import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from './ai.service';

// Test głównej funkcjonalności generowania fiszek - najważniejszej części aplikacji
describe('AIService - Generowanie Fiszek (Core Functionality)', () => {
  let aiService: AIService;

  beforeEach(() => {
    // Mockujemy środowisko aby używać mock data
    vi.stubEnv('USE_MOCK_AI', 'true');
    vi.stubEnv('OPENROUTER_API_KEY', '');
    
    aiService = new AIService();
  });

  // Test 1: Podstawowe generowanie fiszek
  it('should generate flashcards from valid text', async () => {
    const sourceText = `
      Sztuczna inteligencja (AI) to dziedzina informatyki, która zajmuje się tworzeniem systemów 
      zdolnych do wykonywania zadań wymagających inteligencji ludzkiej. Machine learning jest 
      poddziedziną AI, która pozwala komputerom uczyć się bez explicit programming. 
      Deep learning używa sieci neuronowych do analizy danych.
    `.repeat(10); // Zapewniamy minimum 1000 znaków

    const result = await aiService.generateFlashcards(sourceText);

    // Sprawdzamy strukturę wyniku
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Sprawdzamy każdą fiszkę
    result.forEach((flashcard, index) => {
      expect(flashcard, `Flashcard ${index} should have front property`).toHaveProperty('front');
      expect(flashcard, `Flashcard ${index} should have back property`).toHaveProperty('back');
      
      expect(typeof flashcard.front, `Flashcard ${index} front should be string`).toBe('string');
      expect(typeof flashcard.back, `Flashcard ${index} back should be string`).toBe('string');
      
      expect(flashcard.front.trim().length, `Flashcard ${index} front should not be empty`).toBeGreaterThan(0);
      expect(flashcard.back.trim().length, `Flashcard ${index} back should not be empty`).toBeGreaterThan(0);
    });
  });

  // Test 2: Walidacja długości tekstu (kluczowa walidacja biznesowa)
  it('should handle text length validation correctly', async () => {
    // Tekst za krótki (mniej niż 1000 znaków)
    const shortText = "To jest za krótki tekst do generowania fiszek.";
    
    // Tekst optymalny (1000-10000 znaków)
    const validText = `
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
      nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    `.repeat(50); // Około 5000 znaków

    // Test z poprawnym tekstem powinien działać
    const result = await aiService.generateFlashcards(validText);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);

    // Test z krótkim tekstem też powinien działać (w mock mode)
    // ale w rzeczywistości UI powinien blokować takie teksty
    const shortResult = await aiService.generateFlashcards(shortText);
    expect(shortResult).toBeDefined();
  });

  // Test 3: Sprawdzanie jakości mock data
  it('should return meaningful mock flashcards', async () => {
    const sourceText = "Test text for flashcard generation.".repeat(30);
    
    const result = await aiService.generateFlashcards(sourceText);

    // Sprawdzamy czy mock data ma sensowną zawartość
    expect(result.length).toBeGreaterThanOrEqual(3);
    
    // Sprawdzamy czy mock fiszki mają edukatywną treść
    const hasEducationalContent = result.some(card => 
      card.front.includes('?') && // Pytania powinny kończyć się znakiem zapytania
      card.back.length > 10 // Odpowiedzi powinny być bardziej szczegółowe
    );
    
    expect(hasEducationalContent).toBe(true);

    // Sprawdzamy czy nie ma duplikatów
    const fronts = result.map(card => card.front);
    const uniqueFronts = new Set(fronts);
    expect(uniqueFronts.size).toBe(fronts.length);
  });

  // Test 4: Sprawdzanie metod pomocniczych
  it('should have working utility methods', () => {
    // Test dostępności metod publicznych
    expect(typeof aiService.generateFlashcards).toBe('function');
    expect(typeof aiService.getCostUsage).toBe('function');

    // Test getCostUsage w mock mode
    const costUsage = aiService.getCostUsage();
    expect(costUsage).toBeDefined();
    expect(costUsage).toHaveProperty('totalCost');
    expect(costUsage).toHaveProperty('tokenUsage');
    expect(costUsage.totalCost).toBe(0); // W mock mode powinno być 0
  });

  // Test 5: Test odporności na błędy
  it('should handle edge cases gracefully', async () => {
    // Test z pustym stringiem
    const emptyResult = await aiService.generateFlashcards('');
    expect(emptyResult).toBeDefined();

    // Test z bardzo długim tekstem (w mock mode powinien działać)
    const longText = 'A'.repeat(50000);
    const longResult = await aiService.generateFlashcards(longText);
    expect(longResult).toBeDefined();

    // Test z tekstem ze specjalnymi znakami
    const specialText = `
      Tekst z "cudzysłowami", 'apostrofami', i innymi znakami: @#$%^&*()
      Oraz z kodem: const test = "Hello World"; // komentarz
      \`\`\`javascript
      console.log("test");
      \`\`\`
    `.repeat(20);
    
    const specialResult = await aiService.generateFlashcards(specialText);
    expect(specialResult).toBeDefined();
    expect(specialResult.length).toBeGreaterThan(0);
  });
});

// Test dodatkowy - sprawdzenie eksportu instancji
describe('AIService - Module Exports', () => {
  it('should export aiService instance', async () => {
    const { aiService } = await import('./ai.service');
    expect(aiService).toBeDefined();
    expect(aiService).toBeInstanceOf(AIService);
  });
});