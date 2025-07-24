import type { Tables } from "./db/database.types";

/**
 * =========================================
 * Authentication DTOs
 * =========================================
 */

export interface RegisterRequestDto {
  email: string;
  password: string;
}

export interface RegisterResponseDto {
  id: string;
  email: string;
  created_at: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  user: {
    id: string;
    email: string;
  };
}

export interface LogoutResponseDto {
  message: string;
}

/**
 * =========================================
 * Flashcard DTOs
 * =========================================
 */

export type FlashcardSource = 'ai-full' | 'ai-edited' | 'manual';

export interface FlashcardDto {
  id: number;
  front: string;
  back: string;
  source: FlashcardSource;
  created_at: string;
  updated_at: string;
  generation_id: number | null;
  user_id: string;
}

// DTO used when returning a list of flashcards
export type FlashcardListItemDto = Omit<FlashcardDto, 'user_id'>;

export interface FlashcardsListResponseDto {
  data: FlashcardListItemDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// DTO for creating a flashcard manually
export interface CreateFlashcardDto {
  front: string;
  back: string;
  source: FlashcardSource;
  generation_id?: number | null;
}

// DTO for bulk creating flashcards
export interface CreateFlashcardsRequestDto {
  flashcards: CreateFlashcardDto[];
}

export interface CreateFlashcardsResponseDto {
  data: FlashcardDto[];
  count: number;
}

// DTO for updating a flashcard
export interface UpdateFlashcardDto {
  front: string;
  back: string;
}

export interface DeleteFlashcardResponseDto {
  message: string;
}

/**
 * =========================================
 * AI Generation DTOs
 * =========================================
 */

export interface GenerateFlashcardsRequestDto {
  source_text: string;
  model?: string;
}

export interface GeneratedFlashcardDto {
  id: number;
  front: string;
  back: string;
  source: 'ai-full';
}

export interface GenerateFlashcardsResponseDto {
  generation_id: number;
  flashcards: GeneratedFlashcardDto[];
  stats: {
    generated_count: number;
    source_text_length: number;
  };
}

export interface GenerationDetailsDto {
  id: number;
  model: string;
  generated_count: number;
  accepted_unedited_count: number;
  accepted_edited_count: number;
  source_text_length: number;
  created_at: string;
  flashcards: FlashcardListItemDto[];
}

export interface AcceptFlashcardDto {
  id: number;
  front: string;
  back: string;
  accept: boolean;
}

export interface AcceptGeneratedFlashcardsRequestDto {
  flashcards: AcceptFlashcardDto[];
}

export interface AcceptGeneratedFlashcardsResponseDto {
  accepted_count: number;
  flashcards: FlashcardListItemDto[];
}

export interface GenerationStatisticsDto {
  total_generations: number;
  total_generated_flashcards: number;
  total_accepted_unedited: number;
  total_accepted_edited: number;
  acceptance_rate: number;
  models_used: {
    model: string;
    count: number;
  }[];
}

/**
 * =========================================
 * Learning Session DTOs
 * =========================================
 */

export interface LearningSessionResponseDto {
  data: FlashcardListItemDto[];
  session_info: {
    total_cards: number;
    new_cards: number;
    review_cards: number;
  };
}

export interface UpdateLearningStatusRequestDto {
  quality: number; // 0-5 rating for how well the card was recalled
}

export interface UpdateLearningStatusResponseDto {
  id: number;
  next_review_date: string;
}

/**
 * =========================================
 * User DTOs
 * =========================================
 */

export interface UserProfileDto {
  id: string;
  email: string;
  created_at: string;
  flashcards_count: {
    total: number;
    ai_generated: number;
    manual: number;
  };
}

export interface DeleteAccountRequestDto {
  confirmation: string; // Must be "DELETE MY ACCOUNT"
}

export interface DeleteAccountResponseDto {
  message: string;
}

/**
 * =========================================
 * Command Models (For business logic)
 * =========================================
 */

// Base flashcard data needed for all operations
export interface FlashcardBase {
  front: string;
  back: string;
}

// Command to create a flashcard
export interface CreateFlashcardCommand extends FlashcardBase {
  user_id: string;
  source: FlashcardSource;
  generation_id?: number | null;
}

// Command to update a flashcard
export interface UpdateFlashcardCommand extends Partial<FlashcardBase> {
  id: number;
  user_id: string;
}

// Command to delete a flashcard
export interface DeleteFlashcardCommand {
  id: number;
  user_id: string;
}

// Command to generate flashcards
export interface GenerateFlashcardsCommand {
  source_text: string;
  model: string;
  user_id: string;
}

// Command to accept generated flashcards
export interface AcceptGeneratedFlashcardsCommand {
  generation_id: number;
  user_id: string;
  flashcards: {
    id: number;
    front: string;
    back: string;
    accept: boolean;
  }[];
}

// Command to update flashcard learning status
export interface UpdateLearningStatusCommand {
  flashcard_id: number;
  user_id: string;
  quality: number;
}

// Helper types to map between database types and DTOs
export type FlashcardFromDb = Tables<"flashcards">;
export type GenerationFromDb = Tables<"generations">;
export type GenerationErrorLogFromDb = Tables<"generation_error_logs">;

// Helper functions to convert between DB types and DTOs
export const mapDbToFlashcardDto = (flashcard: FlashcardFromDb): FlashcardDto => ({
  ...flashcard,
  source: flashcard.source as FlashcardSource,
});

export const mapDbToGenerationDetailsDto = (
  generation: GenerationFromDb,
  flashcards: FlashcardFromDb[]
): GenerationDetailsDto => ({
  id: generation.id,
  model: generation.model,
  generated_count: generation.generated_count,
  accepted_unedited_count: generation.accepted_unedited_count,
  accepted_edited_count: generation.accepted_edited_count,
  source_text_length: generation.source_text_length,
  created_at: generation.created_at,
  flashcards: flashcards.map(f => ({
    id: f.id,
    front: f.front,
    back: f.back,
    source: f.source as FlashcardSource,
    created_at: f.created_at,
    updated_at: f.updated_at,
    generation_id: f.generation_id,
  })),
});

/**
 * =========================================
 * ViewModel Types for Generate View
 * =========================================
 */

// Stan pojedynczej fiszki w widoku
export interface FlashcardViewState extends GeneratedFlashcardDto {
  status: 'pending' | 'accepted' | 'edited' | 'rejected';
  isEdited: boolean;
  editedFront?: string;
  editedBack?: string;
}

// Stan głównego widoku generowania
export interface GenerateViewState {
  sourceText: string;
  isGenerating: boolean;
  isSaving: boolean;
  flashcards: FlashcardViewState[];
  errors: string[];
  generationId: number | null;
}

// Stan modala edycji
export interface EditModalState {
  isOpen: boolean;
  currentFlashcard: FlashcardViewState | null;
}

// Typy akcji dla fiszek
export type FlashcardAction = 'accept' | 'edit' | 'reject';

// Typ dla obsługi akcji
export type FlashcardActionHandler = (id: number, action: FlashcardAction) => void;

// Dane edycji fiszki
export interface EditFlashcardData {
  front: string;
  back: string;
}

// Stan walidacji
export interface ValidationError {
  field: string;
  message: string;
}

// Propsy dla komponentów
export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  errors: string[];
}

export interface GeneratedFlashcardsListProps {
  flashcards: FlashcardViewState[];
  onFlashcardAction: FlashcardActionHandler;
}

export interface FlashcardPreviewItemProps {
  flashcard: FlashcardViewState;
  onAction: (action: FlashcardAction) => void;
}

export interface EditFlashcardModalProps {
  isOpen: boolean;
  flashcard: FlashcardViewState | null;
  onSave: (data: EditFlashcardData) => void;
  onClose: () => void;
}

export interface SaveActionsSectionProps {
  flashcards: FlashcardViewState[];
  onSaveAll: () => void;
  isSaving: boolean;
}
