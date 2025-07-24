/**
 * GenerationService - Serwis do zarządzania danymi generacji fiszek w bazie danych
 * 
 * Ten serwis obsługuje operacje bazodanowe związane z generowaniem fiszek,
 * w tym tworzenie rekordów generacji, aktualizację statystyk i logowanie błędów.
 */

import type { SupabaseClient } from '../../db/supabase.client';
import type { TablesInsert } from '../../db/database.types';

interface GenerationCreateParams {
  user_id: string;
  model: string;
  source_text_hash: string;
  source_text_length: number;
}

interface GenerationStatsUpdateParams {
  generated_count: number;
  accepted_unedited_count?: number;
  accepted_edited_count?: number;
}

interface GenerationErrorLogParams {
  user_id: string;
  model: string;
  source_text_hash: string;
  source_text_length: number;
  error_code?: string;
  error_message?: string;
}

export class GenerationService {
  private supabase: SupabaseClient;
  
  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }
  
  /**
   * Creates a new generation record in the database
   * 
   * @param params - Generation creation parameters
   * @returns The ID of the created generation record
   * @throws Error if the creation fails
   */
  async createGeneration(params: GenerationCreateParams): Promise<number> {
    const { user_id, model, source_text_hash, source_text_length } = params;
    
    // Initial values for counts
    const generationData: TablesInsert<"generations"> = {
      user_id,
      model,
      source_text_hash,
      source_text_length,
      generated_count: 0,
      accepted_unedited_count: 0,
      accepted_edited_count: 0,
    };
    
    const { data, error } = await this.supabase
      .from('generations')
      .insert(generationData)
      .select('id')
      .single();
    
    if (error) {
      console.error('Failed to create generation record:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data || !data.id) {
      throw new Error('Failed to create generation record: No ID returned');
    }
    
    return data.id;
  }
  
  /**
   * Updates the statistics for a generation record
   * 
   * @param generationId - The ID of the generation record to update
   * @param stats - The statistics to update
   * @throws Error if the update fails
   */
  async updateGenerationStats(
    generationId: number,
    stats: GenerationStatsUpdateParams
  ): Promise<void> {
    const { error } = await this.supabase
      .from('generations')
      .update(stats)
      .eq('id', generationId);
    
    if (error) {
      console.error('Failed to update generation stats:', error);
      throw new Error(`Database error: ${error.message}`);
    }
  }
  
  /**
   * Logs an error that occurred during generation
   * 
   * @param params - Error logging parameters
   * @throws Error if the logging fails
   */
  async logGenerationError(params: GenerationErrorLogParams): Promise<void> {
    const { error } = await this.supabase
      .from('generation_error_logs')
      .insert(params);
    
    if (error) {
      console.error('Failed to log generation error:', error);
      // We don't throw here to avoid cascading errors, just log it
    }
  }
  
  /**
   * Retrieves a generation by its ID
   * 
   * @param generationId - The ID of the generation to retrieve
   * @param userId - The user ID owning the generation (for security)
   * @returns The generation record or null if not found
   * @throws Error if the retrieval fails
   */
  async getGenerationById(generationId: number, userId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Failed to retrieve generation:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  }
}
