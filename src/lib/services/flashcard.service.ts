/**
 * FlashcardService - Serwis do zarządzania danymi fiszek w bazie danych
 *
 * Ten serwis obsługuje operacje bazodanowe związane z fiszkami,
 * w tym tworzenie, aktualizację, pobieranie i usuwanie fiszek.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { TablesInsert } from "../../db/database.types";
import type { CreateFlashcardCommand, FlashcardDto, FlashcardFromDb } from "../../types";
import { mapDbToFlashcardDto } from "../../types";

export class FlashcardService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Sprawdza, czy wszystkie podane identyfikatory generacji istnieją
   * i należą do określonego użytkownika
   *
   * @param commands - Tablica komend tworzenia fiszek do sprawdzenia
   * @param userId - ID użytkownika, który powinien być właścicielem generacji
   * @throws Error jeśli któryś z identyfikatorów generacji jest nieprawidłowy
   */
  private async validateGenerationIds(commands: CreateFlashcardCommand[], userId: string): Promise<void> {
    // Zbieramy unikalne identyfikatory generacji (pomijając null i undefined)
    const generationIds = [
      ...new Set(
        commands.map((cmd) => cmd.generation_id).filter((id): id is number => id !== null && id !== undefined)
      ),
    ];

    // Jeśli nie ma żadnych identyfikatorów generacji do sprawdzenia, to kończymy
    if (generationIds.length === 0) {
      return;
    }

    // Sprawdzamy, czy wszystkie identyfikatory generacji należą do tego użytkownika
    const { data, error } = await this.supabase
      .from("generations")
      .select("id")
      .eq("user_id", userId)
      .in("id", generationIds);

    if (error) {
      console.error("Błąd podczas walidacji identyfikatorów generacji:", error);
      throw new Error("Nie udało się zweryfikować identyfikatorów generacji");
    }

    // Sprawdzamy, czy wszystkie identyfikatory zostały znalezione
    const foundIds = new Set(data.map((gen) => gen.id));
    const missingIds = generationIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new Error(
        `Podane identyfikatory generacji nie istnieją lub nie należą do tego użytkownika: ${missingIds.join(", ")}`
      );
    }
  }

  /**
   * Tworzy wiele fiszek w bazie danych
   *
   * @param commands - Tablica komend tworzenia fiszek
   * @returns Tablica utworzonych fiszek
   * @throws Error jeśli tworzenie nie powiedzie się
   */
  async createFlashcards(commands: CreateFlashcardCommand[]): Promise<FlashcardDto[]> {
    // Walidacja, czy wszystkie karty należą do tego samego użytkownika
    const userId = commands[0]?.user_id;
    if (!userId || !commands.every((cmd) => cmd.user_id === userId)) {
      throw new Error("Wszystkie fiszki muszą należeć do tego samego użytkownika");
    }

    // Sprawdzenie, czy podane generation_id istnieją i należą do tego użytkownika
    await this.validateGenerationIds(commands, userId);

    // Mapowanie komend na struktury danych do wstawienia do bazy
    const flashcardsToInsert: TablesInsert<"flashcards">[] = commands.map((cmd) => ({
      front: cmd.front,
      back: cmd.back,
      source: cmd.source,
      generation_id: cmd.generation_id || null,
      user_id: cmd.user_id,
    }));

    // Wstawianie fiszek do bazy danych
    const { data, error } = await this.supabase.from("flashcards").insert(flashcardsToInsert).select("*");

    if (error) {
      console.error("Nie udało się utworzyć fiszek:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error("Brak danych zwróconych po utworzeniu fiszek");
    }

    // Mapowanie wyników z bazy danych na DTO
    return data.map((flashcard) => mapDbToFlashcardDto(flashcard as FlashcardFromDb));
  }

  /**
   * Tworzy pojedynczą fiszkę w bazie danych
   *
   * @param command - Komenda tworzenia fiszki
   * @returns Utworzona fiszka
   * @throws Error jeśli tworzenie nie powiedzie się
   */
  async createFlashcard(command: CreateFlashcardCommand): Promise<FlashcardDto> {
    const results = await this.createFlashcards([command]);
    return results[0];
  }

  /**
   * Pobiera wszystkie fiszki użytkownika
   *
   * @param userId - ID użytkownika
   * @returns Lista fiszek użytkownika
   */
  async getUserFlashcards(userId: string): Promise<FlashcardDto[]> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Błąd podczas pobierania fiszek użytkownika:", error);
      throw error;
    }

    return data ? data.map((flashcard) => mapDbToFlashcardDto(flashcard as FlashcardFromDb)) : [];
  }
  /**
   * Aktualizuje istniejącą fiszkę
   *
   * @param flashcardId - ID fiszki do aktualizacji
   * @param userId - ID użytkownika (weryfikacja właściciela)
   * @param updates - Dane do aktualizacji
   * @returns Zaktualizowana fiszka
   */
  async updateFlashcard(
    flashcardId: number,
    userId: string,
    updates: { front?: string; back?: string; source?: string }
  ): Promise<FlashcardDto> {
    // Sprawdzamy czy fiszka należy do użytkownika
    const { data: existing, error: checkError } = await this.supabase
      .from("flashcards")
      .select("id")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (checkError || !existing) {
      throw new Error("Fiszka nie została znaleziona lub nie należy do tego użytkownika");
    }

    // Aktualizujemy fiszkę
    const { data, error } = await this.supabase
      .from("flashcards")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      console.error("Błąd podczas aktualizacji fiszki:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Brak danych zwróconych po aktualizacji fiszki");
    }

    return mapDbToFlashcardDto(data as FlashcardFromDb);
  }

  /**
   * Usuwa fiszkę użytkownika
   *
   * @param flashcardId - ID fiszki do usunięcia
   * @param userId - ID użytkownika (weryfikacja właściciela)
   * @returns true jeśli usunięto pomyślnie
   */
  async deleteFlashcard(flashcardId: number, userId: string): Promise<boolean> {
    const { error } = await this.supabase.from("flashcards").delete().eq("id", flashcardId).eq("user_id", userId);

    if (error) {
      console.error("Błąd podczas usuwania fiszki:", error);
      throw error;
    }

    return true;
  }

  /**
   * Pobiera fiszkę po ID (z weryfikacją właściciela)
   *
   * @param flashcardId - ID fiszki
   * @param userId - ID użytkownika
   * @returns Fiszka lub null jeśli nie znaleziono
   */
  async getFlashcardById(flashcardId: number, userId: string): Promise<FlashcardDto | null> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Nie znaleziono
      }
      console.error("Błąd podczas pobierania fiszki:", error);
      throw error;
    }

    return data ? mapDbToFlashcardDto(data as FlashcardFromDb) : null;
  }
}
