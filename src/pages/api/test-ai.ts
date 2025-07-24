import type { APIRoute } from 'astro';
import { AIService } from '../../lib/services/ai.service';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { text } = await request.json();
    const testText = text || "JavaScript jest językiem programowania. Może być używany do tworzenia aplikacji webowych. Jest bardzo popularny wśród programistów. Posiada dynamiczne typowanie. Można go uruchomić w przeglądarce lub na serwerze. Ma wsparcie dla programowania asynchronicznego. Jest używany w frameworkach takich jak React, Vue czy Angular.";
    
    console.log('Testing AI service with text length:', testText.length);
    
    const aiService = new AIService();
    const flashcards = await aiService.generateFlashcards(testText);
    
    console.log('AI service test successful:', { count: flashcards.length });
    
    return new Response(JSON.stringify({
      success: true,
      flashcards,
      count: flashcards.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('AI service test error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      code: error.code,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
