/**
 * API Endpoint: POST /api/flashcards
 * 
 * Umożliwia tworzenie jednej lub wielu fiszek w systemie.
 * Fiszki mogą być tworzone ręcznie lub pochodzić z generacji AI.
 * Endpoint waliduje dane wejściowe i zapisuje fiszki w bazie danych.
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { 
  CreateFlashcardsRequestDto, 
  CreateFlashcardsResponseDto,
  FlashcardDto,
  FlashcardSource
} from '../../types';
import { FlashcardService } from '../../lib/services/flashcard.service';

// Wyłączenie prerenderowania dla tego endpointu
export const prerender = false;

// Walidacja schematu dla pojedynczej fiszki
const createFlashcardSchema = z.object({
  front: z.string()
    .min(1, "Front fiszki nie może być pusty")
    .max(200, "Front fiszki nie może przekraczać 200 znaków"),
  back: z.string()
    .min(1, "Tył fiszki nie może być pusty")
    .max(500, "Tył fiszki nie może przekraczać 500 znaków"),
  source: z.enum(['ai-full', 'ai-edited', 'manual'] as const),
  generation_id: z.number().nullable().optional()
});

// Walidacja schematu dla całego żądania
const createFlashcardsRequestSchema = z.object({
  flashcards: z.array(createFlashcardSchema)
    .min(1, "Musisz podać co najmniej jedną fiszkę")
    .max(100, "Nie można utworzyć więcej niż 100 fiszek jednocześnie")
});

/**
 * Obsługa POST dla tworzenia fiszek
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {    // Uzyskanie klienta Supabase
    const supabase = locals.supabase;
    
    // Sprawdzenie autentykacji
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
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
    
    const validationResult = createFlashcardsRequestSchema.safeParse(requestData);
    
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
    const { flashcards } = validationResult.data;
    
    // Inicjalizacja serwisu
    const flashcardService = new FlashcardService(supabase);
    
    // Tworzenie fiszek w bazie danych
    try {
      const createdFlashcards = await flashcardService.createFlashcards(
        flashcards.map(flashcard => ({
          ...flashcard,
          user_id: userId
        }))
      );
      
      // Przygotowanie odpowiedzi sukcesu
      const response: CreateFlashcardsResponseDto = {
        data: createdFlashcards,
        count: createdFlashcards.length
      };
      
      return new Response(
        JSON.stringify(response),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
      
    } catch (dbError: any) {
      console.error('Błąd bazy danych podczas tworzenia fiszek:', dbError);
      
      // Sprawdzenie, czy błąd dotyczy foreign key violation (nieprawidłowy generation_id)
      if (dbError.code === '23503') { // PostgreSQL Foreign Key Violation
        return new Response(
          JSON.stringify({ 
            error: 'Nieprawidłowe dane', 
            details: 'Podany generation_id jest nieprawidłowy lub nie należy do tego użytkownika' 
          }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Błąd bazy danych', 
          details: 'Nie udało się zapisać fiszek w bazie danych' 
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error: any) {
    // Nieoczekiwane błędy
    console.error('Błąd punktu końcowego tworzenia fiszek:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Wewnętrzny błąd serwera', 
        details: 'Wystąpił nieoczekiwany błąd' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


/**
 * Obsługa GET dla pobierania fiszek użytkownika
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const supabase = locals.supabase;
    
    // Sprawdzenie autentykacji
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          details: 'Valid session required' 
        }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = session.user.id;
    const flashcardService = new FlashcardService(supabase);
    
    // Sprawdzamy czy to zapytanie o konkretną fiszkę
    const flashcardId = url.searchParams.get('id');
    
    if (flashcardId) {
      // Pobieranie konkretnej fiszki
      const flashcard = await flashcardService.getFlashcardById(parseInt(flashcardId), userId);
      
      if (!flashcard) {
        return new Response(
          JSON.stringify({ 
            error: 'Not found', 
            details: 'Fiszka nie została znaleziona' 
          }), 
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ data: flashcard }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Pobieranie wszystkich fiszek użytkownika
      const flashcards = await flashcardService.getUserFlashcards(userId);
      
      return new Response(
        JSON.stringify({ 
          data: flashcards,
          count: flashcards.length 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error: any) {
    console.error('Błąd podczas pobierania fiszek:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Wewnętrzny błąd serwera', 
        details: 'Nie udało się pobrać fiszek' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Obsługa PUT dla aktualizacji fiszki
 */
export const PUT: APIRoute = async ({ request, url, locals }) => {
  try {
    const supabase = locals.supabase;
    
    // Sprawdzenie autentykacji
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          details: 'Valid session required' 
        }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = session.user.id;
    const flashcardId = url.searchParams.get('id');
    
    if (!flashcardId) {
      return new Response(
        JSON.stringify({ 
          error: 'Bad request', 
          details: 'ID fiszki jest wymagane' 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
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
    
    const updateSchema = z.object({
      front: z.string().min(1).max(200).optional(),
      back: z.string().min(1).max(500).optional(),
      source: z.enum(['ai-full', 'ai-edited', 'manual'] as const).optional()
    });
    
    const validationResult = updateSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Nieprawidłowe dane wejściowe', 
          details: validationResult.error.format() 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const flashcardService = new FlashcardService(supabase);
    const updatedFlashcard = await flashcardService.updateFlashcard(
      parseInt(flashcardId), 
      userId, 
      validationResult.data
    );
    
    return new Response(
      JSON.stringify({ data: updatedFlashcard }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Błąd podczas aktualizacji fiszki:', error);
    
    if (error.message.includes('nie została znaleziona')) {
      return new Response(
        JSON.stringify({ 
          error: 'Not found', 
          details: error.message 
        }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Wewnętrzny błąd serwera', 
        details: 'Nie udało się zaktualizować fiszki' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Obsługa DELETE dla usuwania fiszki
 */
export const DELETE: APIRoute = async ({ url, locals }) => {
  try {
    const supabase = locals.supabase;
    
    // Sprawdzenie autentykacji
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          details: 'Valid session required' 
        }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = session.user.id;
    const flashcardId = url.searchParams.get('id');
    
    if (!flashcardId) {
      return new Response(
        JSON.stringify({ 
          error: 'Bad request', 
          details: 'ID fiszki jest wymagane' 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const flashcardService = new FlashcardService(supabase);
    await flashcardService.deleteFlashcard(parseInt(flashcardId), userId);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Fiszka została usunięta' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Błąd podczas usuwania fiszki:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Wewnętrzny błąd serwera', 
        details: 'Nie udało się usunąć fiszki' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
