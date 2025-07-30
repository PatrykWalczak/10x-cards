/**
 * Przykład użycia serwisu OpenRouter w kontekście generowania fiszek
 *
 * Ten plik pokazuje, jak można wykorzystać serwis OpenRouter do generowania
 * fiszek na podstawie dostarczonego tekstu.
 */

import { OpenRouterService, createResponseFormat } from "../openrouter";
import { z } from "zod";

/**
 * Schema walidacyjne dla wygenerowanych fiszek
 */
const flashcardSchema = z.object({
  flashcards: z.array(
    z.object({
      front: z.string().min(1),
      back: z.string().min(1),
    })
  ),
});

/**
 * Typ wygenerowanych fiszek
 */
type FlashcardsResponse = z.infer<typeof flashcardSchema>;

/**
 * Klasa serwisu AI do generowania fiszek
 */
export class EnhancedAIService {
  private openRouter: OpenRouterService;

  /**
   * Tworzy nową instancję serwisu AI
   *
   * @param apiKey Klucz API do OpenRouter (opcjonalny, użyje zmiennej środowiskowej jeśli nie podano)
   */
  constructor(apiKey?: string) {
    const key = apiKey || import.meta.env.OPENROUTER_API_KEY;

    if (!key) {
      throw new Error(
        "Brak klucza API OpenRouter. Ustaw zmienną środowiskową OPENROUTER_API_KEY lub przekaż klucz do konstruktora."
      );
    }

    this.openRouter = new OpenRouterService({
      apiKey: key,
      costLimit: 10,
      defaultModel: "meta-llama/llama-3.2-3b-instruct:free",
    });
  }

  /**
   * Generuje fiszki na podstawie dostarczonego tekstu
   *
   * @param text Tekst źródłowy do wygenerowania fiszek
   * @param count Liczba fiszek do wygenerowania (domyślnie 5)
   * @returns Tablica wygenerowanych fiszek
   */
  async generateFlashcards(text: string, count = 5) {
    // Tworzenie formatu odpowiedzi z walidacją JSON schema
    const format = createResponseFormat("flashcards", {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: { type: "string" },
              back: { type: "string" },
            },
            required: ["front", "back"],
          },
        },
      },
      required: ["flashcards"],
    });

    try {
      // Generowanie odpowiedzi z modelu AI
      const response = await this.openRouter.generateCompletion<FlashcardsResponse>({
        model: "meta-llama/llama-3.2-3b-instruct:free",
        messages: [
          {
            role: "system",
            content: "Jesteś ekspertem w tworzeniu fiszek edukacyjnych.",
          },
          {
            role: "user",
            content: `Wygeneruj ${count} fiszek na podstawie następującego tekstu: ${text}`,
          },
        ],
        responseFormat: format,
        temperature: 0.7,
      });

      // Pobranie sparsowanej odpowiedzi JSON
      const parsedFlashcards = response.choices[0].message.parsed;

      // Walidacja odpowiedzi za pomocą Zod
      if (parsedFlashcards) {
        const validated = flashcardSchema.safeParse(parsedFlashcards);

        if (validated.success) {
          return validated.data.flashcards;
        } else {
          console.error("Błąd walidacji fiszek:", validated.error);
        }
      }

      // Jeśli brak sparsowanej odpowiedzi lub walidacja się nie powiodła,
      // spróbuj wyciągnąć dane bezpośrednio z tekstu odpowiedzi
      const rawContent = response.choices[0].message.content;

      try {
        const jsonContent = JSON.parse(rawContent);
        const manualValidation = flashcardSchema.safeParse(jsonContent);

        if (manualValidation.success) {
          return manualValidation.data.flashcards;
        }
      } catch (e) {
        console.error("Błąd parsowania odpowiedzi JSON:", e);
      }

      // Zwróć pustą tablicę, jeśli nie udało się uzyskać poprawnych fiszek
      return [];
    } catch (error) {
      console.error("Błąd podczas generowania fiszek:", error);
      throw error;
    }
  }

  /**
   * Zwraca informacje o zużyciu kosztów
   */
  getCostUsage() {
    return this.openRouter.getCostUsage();
  }
}
