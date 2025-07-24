/**
 * API Endpoint: POST /api/generations
 * 
 * Generuje fiszki z dostarczonego tekstu używając AI (poprzez OpenRouter.ai).
 * Endpoint waliduje dane wejściowe, komunikuje się z usługą AI,
 * i przechowuje metadane o generacji w bazie danych.
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createHash } from 'crypto';
import { AIService } from '../../lib/services/ai.service';
import { GenerationService } from '../../lib/services/generation.service';
import { OpenRouterError } from '../../lib/services/openrouter';
import type { GenerateFlashcardsRequestDto, GenerateFlashcardsResponseDto } from '../../types';
import type { DEFAULT_USER_ID } from '../../db/supabase.client';

// Wyłączenie prerenderowania dla tego endpointu
export const prerender = false;

// Domyślny model, jeśli nie określono innego
const DEFAULT_AI_MODEL = 'google/gemma-3n-e2b-it:free';

// Walidacja schematu dla body zapytania
const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Tekst musi mieć co najmniej 1000 znaków")
    .max(10000, "Tekst nie może przekraczać 10000 znaków"),
  model: z.string().optional()
});

/**
 * Obsługa POST dla generowania fiszek
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Uzyskanie klienta Supabase
    const supabase = locals.supabase;
    
    // Debug: sprawdź czy jest klient Supabase
    if (!supabase) {
      console.error('No Supabase client available in locals');
      return new Response(
        JSON.stringify({ 
          error: 'Internal error', 
          details: 'Supabase client not available' 
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Sprawdzenie autentykacji
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Debug logging
    console.log('Session check:', {
      hasSession: !!session,
      sessionError: sessionError?.message,
      userId: session?.user?.id,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    if (!session || !session.user) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          details: 'Valid session required' 
        }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = session.user.id; // Dynamiczny user ID
    
    // Walidacja danych wejściowych
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: 'Nieprawidłowe żądanie', 
          details: 'Body żądania musi być prawidłowym JSON' 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const validationResult = generateFlashcardsSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Nieprawidłowe dane wejściowe', 
          details: validationResult.error.format() 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Przygotowanie zwalidowanych danych
    const { source_text, model = DEFAULT_AI_MODEL } = validationResult.data;
    const source_text_hash = createHash('sha256').update(source_text).digest('hex');
    const source_text_length = source_text.length;
    
    // Inicjalizacja serwisów
    const aiService = new AIService();
    const generationService = new GenerationService(supabase);
    
    // Utworzenie rekordu generacji w bazie danych
    let generationId: number;
    try {
      generationId = await generationService.createGeneration({
        user_id: userId,
        model,
        source_text_hash,
        source_text_length
      });
    } catch (error: any) {
      console.error('Nie udało się utworzyć rekordu generacji:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Błąd bazy danych', 
          details: 'Nie udało się zainicjować rekordu generacji' 
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }      // Generowanie fiszek przy użyciu AI (przez OpenRouterService)
    console.log('Starting AI generation:', { model, textLength: source_text.length });
    try {
      // Użyj nowego OpenRouterService, który jest zintegrowany z AIService
      const generatedFlashcards = await aiService.generateFlashcards(source_text, model);
      console.log('AI generation successful:', { count: generatedFlashcards.length });

      // Zapis informacji o kosztach do logów (można później rozszerzyć o zapis do bazy)
      const costUsage = aiService.getCostUsage();
      console.log(`Koszt generacji fiszek: $${costUsage.totalCost.toFixed(4)}, użyte tokeny: ${costUsage.tokenUsage.total}`);
      
      // Aktualizacja rekordu generacji ze statystykami
      await generationService.updateGenerationStats(generationId, {
        generated_count: generatedFlashcards.length
      });
      
      // Przygotowanie odpowiedzi sukcesu
      const response: GenerateFlashcardsResponseDto = {
        generation_id: generationId,
        flashcards: generatedFlashcards.map((flashcard, index) => ({
          id: index + 1, // Tymczasowe ID dla użytku frontendu
          front: flashcard.front,
          back: flashcard.back,
          source: 'ai-full' as const
        })),
        stats: {
          generated_count: generatedFlashcards.length,
          source_text_length
        }
      };
      
      return new Response(
        JSON.stringify(response),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );        } catch (aiError: any) {
      // Specjalna obsługa błędów OpenRouter
      console.error('AI generation error:', aiError);
      console.error('Error details:', {
        name: aiError.name,
        message: aiError.message,
        code: aiError.code,
        stack: aiError.stack
      });
      
      let errorCode = aiError.code || 'AI_ERROR';
      let errorMessage = aiError.message || 'Nie udało się wygenerować fiszek';
      let statusCode = 503;
        // Dostosowanie kodu statusu i komunikatu na podstawie kodu błędu
      if (aiError instanceof OpenRouterError) {
        switch (aiError.code) {
          case 'INVALID_API_KEY':
            statusCode = 401;
            errorMessage = 'Nieprawidłowy klucz API dla usługi AI';
            break;
          case 'RATE_LIMIT_ERROR':
            statusCode = 429;
            errorMessage = 'Przekroczono limit zapytań do usługi AI. Spróbuj ponownie za kilka minut.';
            break;
          case 'COST_LIMIT_ERROR':
            statusCode = 403;
            errorMessage = 'Przekroczono limit kosztów dla usługi AI.';
            break;
          case 'TIMEOUT_ERROR':
            statusCode = 504;
            errorMessage = 'Upłynął limit czasu zapytania do usługi AI. Spróbuj ponownie później.';
            break;
          case 'NETWORK_ERROR':
            statusCode = 503;
            errorMessage = 'Problem z połączeniem do usługi AI. Spróbuj ponownie później.';
            break;
        }      } else if (aiError.message && aiError.message.includes('Rate limit exceeded')) {
        // Obsługa rate limit dla ogólnych błędów
        statusCode = 429;
        errorCode = 'RATE_LIMIT_ERROR';
        errorMessage = 'Przekroczono limit zapytań do usługi AI. Spróbuj ponownie za kilka minut.';
      } else if (aiError.message && aiError.message.includes('No endpoints found')) {
        // Obsługa błędu niedostępnego modelu
        statusCode = 400;
        errorCode = 'INVALID_MODEL';
        errorMessage = 'Wybrany model AI nie jest dostępny. Spróbuj z innym modelem.';
      }
      
      // Logowanie błędu generacji AI
      await generationService.logGenerationError({
        user_id: userId,
        model,
        source_text_hash,
        source_text_length,
        error_code: errorCode,
        error_message: errorMessage
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Błąd usługi AI', 
          code: errorCode,
          details: errorMessage 
        }), 
        { status: statusCode, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error: any) {
    // Nieoczekiwane błędy
    console.error('Błąd punktu końcowego generacji:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Wewnętrzny błąd serwera', 
        details: 'Wystąpił nieoczekiwany błąd' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


