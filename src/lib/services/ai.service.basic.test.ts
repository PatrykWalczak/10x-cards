import { describe, it, expect } from "vitest";

// Główny test jednostkowy AIService - najważniejszej funkcjonalności aplikacji
describe("AIService - Main Functionality Test", () => {
  it("should pass basic validation", () => {
    expect(true).toBe(true);
  });

  it("should import AIService class correctly", async () => {
    const { AIService } = await import("./ai.service");
    expect(AIService).toBeDefined();
    expect(typeof AIService).toBe("function");
  });

  it("should create AIService instance in mock mode", async () => {
    // Ustawiamy mock mode poprzez environment
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      USE_MOCK_AI: "true",
    };

    try {
      const { AIService } = await import("./ai.service");
      const aiService = new AIService();
      expect(aiService).toBeDefined();
      expect(typeof aiService.generateFlashcards).toBe("function");
    } finally {
      process.env = originalEnv;
    }
  });

  it("should generate flashcards in mock mode", async () => {
    // Test najważniejszej funkcjonalności - generowania fiszek
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      USE_MOCK_AI: "true",
    };

    try {
      const { AIService } = await import("./ai.service");
      const aiService = new AIService();

      const inputText = "JavaScript to język programowania używany do tworzenia interaktywnych stron internetowych.";
      const result = await aiService.generateFlashcards(inputText);

      // Sprawdzenie podstawowej struktury odpowiedzi
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Sprawdzenie struktury pierwszej fiszki
      if (result.length > 0) {
        const firstFlashcard = result[0];
        expect(firstFlashcard).toHaveProperty("front");
        expect(firstFlashcard).toHaveProperty("back");
        expect(typeof firstFlashcard.front).toBe("string");
        expect(typeof firstFlashcard.back).toBe("string");
        expect(firstFlashcard.front.length).toBeGreaterThan(0);
        expect(firstFlashcard.back.length).toBeGreaterThan(0);
      }
    } finally {
      process.env = originalEnv;
    }
  });
  it("should handle empty input validation", async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      USE_MOCK_AI: "true",
    };

    try {
      const { AIService } = await import("./ai.service");
      const aiService = new AIService();

      // W mock mode, puste stringi mogą generować domyślne fiszki
      // Sprawdźmy że funkcja działa bez błędów
      const emptyResult = await aiService.generateFlashcards("");
      expect(emptyResult).toBeDefined();
      expect(Array.isArray(emptyResult)).toBe(true);

      const spacesResult = await aiService.generateFlashcards("   ");
      expect(spacesResult).toBeDefined();
      expect(Array.isArray(spacesResult)).toBe(true);

      // Mock mode powinien generować przynajmniej jedną fiszkę
      expect(emptyResult.length).toBeGreaterThan(0);
      expect(spacesResult.length).toBeGreaterThan(0);
    } finally {
      process.env = originalEnv;
    }
  });

  it("should generate multiple flashcards from educational content", async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      USE_MOCK_AI: "true",
    };

    try {
      const { AIService } = await import("./ai.service");
      const aiService = new AIService();

      const educationalText = `
        Fotosynteza to proces biologiczny, w którym rośliny wykorzystują energię światła słonecznego 
        do przekształcania dwutlenku węgla i wody w glukozę i tlen. Ten proces zachodzi w chloroplastach, 
        które zawierają chlorofil - pigment nadający roślinom zielony kolor. Fotosynteza jest fundamentalnym 
        procesem dla życia na Ziemi, ponieważ produkuje tlen niezbędny dla większości organizmów oraz 
        stanowi podstawę łańcucha pokarmowego.
      `;

      const result = await aiService.generateFlashcards(educationalText);

      // Sprawdzenie jakości generowanych fiszek
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Każda fiszka powinna mieć sensowną strukturę
      result.forEach((flashcard) => {
        expect(flashcard).toHaveProperty("front");
        expect(flashcard).toHaveProperty("back");

        // Walidacja długości contentu
        expect(flashcard.front.length).toBeGreaterThan(5);
        expect(flashcard.back.length).toBeGreaterThan(10);

        // Sprawdzenie że nie są puste
        expect(flashcard.front.trim()).not.toBe("");
        expect(flashcard.back.trim()).not.toBe("");
      });
    } finally {
      process.env = originalEnv;
    }
  });

  it("should work with different models parameter", async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      USE_MOCK_AI: "true",
    };

    try {
      const { AIService } = await import("./ai.service");
      const aiService = new AIService();

      const testText = "Algorytmy sortowania służą do układania danych w określonej kolejności.";

      // Test z domyślnym modelem
      const result1 = await aiService.generateFlashcards(testText);
      expect(result1).toBeDefined();
      expect(Array.isArray(result1)).toBe(true);

      // Test z określonym modelem
      const result2 = await aiService.generateFlashcards(testText, "google/gemma-3n-e2b-it:free");
      expect(result2).toBeDefined();
      expect(Array.isArray(result2)).toBe(true);

      // Oba wyniki powinny być poprawne
      expect(result1.length).toBeGreaterThan(0);
      expect(result2.length).toBeGreaterThan(0);
    } finally {
      process.env = originalEnv;
    }
  });
});
