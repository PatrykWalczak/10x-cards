import { OpenRouterService, createResponseFormat } from './openrouter';

interface FlashcardGenerationResult {
  front: string;
  back: string;
}

export class AIService {
  private openRouter: OpenRouterService | null = null;
  private readonly useMockData: boolean;
  
  constructor() {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    const useMock = import.meta.env.USE_MOCK_AI === 'true' || !apiKey;
    
    this.useMockData = useMock;
    if (!this.useMockData && apiKey) {
      try {        this.openRouter = new OpenRouterService({
          apiKey,
          defaultModel: 'google/gemma-3n-e2b-it:free',
          costLimit: 10
        });
      } catch (error) {
        console.error('Failed to initialize OpenRouter service:', error);
        throw new Error('Failed to initialize OpenRouter service');
      }
    } else if (!this.useMockData && !apiKey) {
      throw new Error("OpenRouter API key is not configured and mock mode is disabled");
    }
  }
  async generateFlashcards(sourceText: string, model: string = 'google/gemma-3n-e2b-it:free'): Promise<FlashcardGenerationResult[]> {
    try {
      if (this.useMockData) {
        console.log('Using mock mode for AI Service');
        return this.generateMockFlashcards(sourceText);
      }
      
      if (!this.openRouter) {
        throw new Error("OpenRouter service is not initialized");
      }
      
      const sanitizedText = this.sanitizeText(sourceText);
        const format = createResponseFormat('flashcards', {
        type: 'object',
        properties: {
          flashcards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                front: { type: 'string' },
                back: { type: 'string' }
              },
              required: ['front', 'back']
            }
          }
        },
        required: ['flashcards']
      });      console.log('Sending AI request with model:', model);
      const response = await this.openRouter.generateCompletion({
        model: model,
        messages: [
          { 
            role: "user", 
            content: this.createFlashcardsPrompt(sanitizedText) 
          }
        ],
        // Tymczasowo wyłączamy structured output dla tego modelu
        // responseFormat: format,
        temperature: 0.3,
        max_tokens: 1000
      });
        console.log('AI response received:', {
        hasResponse: !!response,
        hasChoices: !!response?.choices,
        choicesLength: response?.choices?.length || 0,
        fullResponse: response
      });
      
      if (!response.choices || response.choices.length === 0) {
        console.error('Empty AI response:', response);
        throw new Error("AI model returned empty response");
      }
        let flashcards: FlashcardGenerationResult[] = [];
      
      if (response.choices[0].message.parsed) {
        const parsed = response.choices[0].message.parsed as any;
        if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
          flashcards = parsed.flashcards;
        } else if (Array.isArray(parsed)) {
          flashcards = parsed;
        }
      } else {
        flashcards = this.parseAIResponse(response);
      }
      
      if (!flashcards || flashcards.length === 0) {
        throw new Error("AI model returned empty or invalid flashcards");
      }
      
      return flashcards;    } catch (error: any) {
      console.error('AI Service Error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        status: error.status,
        originalError: error
      });
      
      // Przekaż oryginalny błąd dalej, aby mógł być obsłużony w API endpoint
      throw error;
    }
  }
  
  private sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/```/g, "\\```")
      .replace(/\/\//g, "\\/\\/")
      .replace(/\n{3,}/g, "\n\n");
  }
  private createFlashcardsPrompt(text: string): string {
    return `You are an expert educational content creator specializing in creating flashcards. Your task is to create high-quality question-answer pairs from the provided text.

Create high-quality flashcards from the following text. Generate between 5-15 flashcards focusing on key concepts, definitions, processes, and important facts.

Guidelines:
- Each flashcard should have a clear question (front) and concise answer (back)
- Questions should test understanding, not just recall
- Answers should be 1-3 sentences maximum
- Cover the most important concepts from the text
- Avoid duplicating content between flashcards

Return ONLY a valid JSON object in this exact format:
{
  "flashcards": [
    {
      "front": "What is the main concept?",
      "back": "The main concept is..."
    },
    {
      "front": "How does this process work?",
      "back": "This process works by..."
    }
  ]
}

Text to analyze:
${text}
`;
  }
    private parseAIResponse(response: any): FlashcardGenerationResult[] {
    try {
      const content = response.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("Invalid AI response format");
      }
      
      let parsedData;
      try {
        parsedData = typeof content === 'string' ? JSON.parse(content) : content;
      } catch (e) {
        // Try to extract JSON from text (if the model included additional text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse JSON from AI response");
        }
      }
      
      // Extract flashcards from the parsed data
      let flashcards;
      if (parsedData.flashcards && Array.isArray(parsedData.flashcards)) {
        flashcards = parsedData.flashcards;
      } else if (Array.isArray(parsedData)) {
        flashcards = parsedData;
      } else {
        throw new Error("AI response does not contain flashcards array");
      }
      
      if (!Array.isArray(flashcards)) {
        throw new Error("AI response is not an array of flashcards");
      }
      
      return flashcards.map((card: any, index: number) => {
        if (!card.front || !card.back) {
          throw new Error(`Flashcard at index ${index} is missing front or back content`);
        }
        
        return {
          front: card.front.trim(),
          back: card.back.trim()
        };
      });
    } catch (error: any) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }
  
  getCostUsage(): any {
    if (this.useMockData || !this.openRouter) {
      return {
        totalCost: 0,
        tokenUsage: { prompt: 0, completion: 0, total: 0 },
        limitReached: false
      };
    }
    
    return this.openRouter.getCostUsage();
  }
  
  private generateMockFlashcards(sourceText: string): FlashcardGenerationResult[] {
    const baseFlashcards: FlashcardGenerationResult[] = [
      {
        front: "Co to jest spaced repetition?",
        back: "Spaced repetition to technika nauki, która polega na powtarzaniu materiału w optymalnych odstępach czasu."
      },
      {
        front: "Jaka jest zaleta używania fiszek do nauki?",
        back: "Fiszki umożliwiają aktywne przypominanie informacji, co jest bardziej efektywne niż bierne czytanie."
      },
      {
        front: "Co to jest krzywa zapominania?",
        back: "Krzywa zapominania pokazuje jak szybko zapominamy informacje w czasie, jeśli nie są powtarzane."
      }
    ];
    
    return baseFlashcards;
  }
}

// Eksportujemy instancję serwisu
export const aiService = new AIService();
