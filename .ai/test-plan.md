# Plan testów dla projektu 10x-cards

## 1. Wprowadzenie i cele testowania
Celem testów jest zapewnienie, że aplikacja 10x-cards działa zgodnie ze specyfikacją, jest stabilna, bezpieczna oraz wydajna. Testy mają potwierdzić poprawność funkcjonalności generowania fiszek, zarządzania sesjami użytkowników, integracji z Supabase, a także interakcji UI na stronach Astro i komponentach React. Plan uwzględnia nowoczesny stos technologiczny projektu: Astro 5, React 19, TypeScript 5, oraz integracje z Supabase i OpenRouter.ai.

## 2. Zakres testów
- Testy jednostkowe pojedynczych funkcji i hooków (np. `useGenerateFlashcards`)
- Testy integracyjne API (np. endpoint `/api/generations`, `/api/flashcards`)
- Testy interfejsu użytkownika (widoki: `/generate`, `/auth`, `/study`)
- Testy bezpieczeństwa (autoryzacja, RLS w Supabase)
- Testy wydajnościowe wywołań API (np. komunikacja z OpenRouter.ai)
- Testy end-to-end symulujące pełny flow użytkownika (logowanie, generowanie fiszek, zapisywanie danych)

## 3. Typy testów
1. **Testy jednostkowe**
   - Walidacja funkcji walidujących (np. walidacja długości tekstu)
   - Testy hooków React (np. poprawne zarządzanie stanem w `useGenerateFlashcards`)
   - Izolowane testy komponentów React z Testing Library
2. **Testy integracyjne**
   - Testy interakcji między frontendem a backendem (przekazywanie sesji, cookies, JWT)
   - Testy poprawności komunikacji z Supabase
   - Testy izolowane AuthContext i synchronizacji sesji
3. **Testy end-to-end (E2E)**
   - Flow autentykacji: rejestracja, logowanie, ochrona tras
   - Generowanie i zapisywanie fiszek – weryfikacja komunikatów i aktualizacji UI
   - Testy kompatybilności SSR vs CSR w Astro
4. **Testy wydajnościowe**
   - Obciążenia dla generowania fiszek przy dużej liczbie danych
   - Szybkość odpowiedzi endpointów API
   - Hydratacja komponentów React w Astro
5. **Testy bezpieczeństwa**
   - Weryfikacja RLS (Row Level Security) w bazie danych
   - Testy błędnych lub wygasłych tokenów JWT
   - Próby dostępu do endpointów bez autoryzacji

## 4. Scenariusze testowe kluczowych funkcjonalności
- **Autentykacja i autoryzacja:**
  - Poprawne logowanie użytkownika via Supabase Auth.
  - Próba uzyskania dostępu do chronionych API endpointów bez prawidłowego JWT (spodziewany kod 401).
- **Generowanie fiszek:**
  - Wprowadzenie tekstu o długości poniżej i powyżej limitu (1000–10000 znaków) oraz weryfikacja komunikatów walidacyjnych.
  - Wywołanie endpointu `/api/generations` przy użyciu poprawnych danych oraz obserwacja poprawnej synchronizacji sesji.
  - Symulacja błędnych odpowiedzi z AI (np. 503 Service Unavailable) i weryfikacja obsługi błędu.
- **Zarządzanie stanem widoku generowania:**
  - Testy działania hooka `useGenerateFlashcards`: poprawna aktualizacja stanu, zmiana statusu fiszek, otwieranie i zamykanie modala edycji.
- **Interfejs użytkownika:**
  - Walidacja komponentów UI z użyciem komponentów Shadcn/ui – test responsywności, dostępności i interakcji klawiaturowych.
  - Test wyświetlania komunikatów błędów (toast notifications, inline messages).
- **Integracja bazodanowa:**
  - Zapisywanie wygenerowanych fiszek z poprawnymi danymi w bazie danych PostgreSQL.
  - Weryfikacja poprawności RLS – użytkownik ma dostęp tylko do swoich danych.
  
## 5. Środowisko testowe
- **Lokalne środowisko developerskie:** Windows z VS Code, lokalny serwer Astro.
- **Baza danych:** Instancja lokalna lub testowa Supabase.
- **Symulacja API:** Środowisko testowe OpenRouter.ai lub mock endpointów.
- **Narzędzia CI/CD:** Github Actions uruchamiające testy przy commitach.

## 6. Narzędzia do testowania
- **Frameworki testowe:** Vitest i Testing Library dla testów jednostkowych i integracyjnych (lepsze wsparcie dla Astro/Vite, natywne ESM, szybsze wykonanie).
- **E2E:** Playwright do symulacji pełnego flow użytkownika (lepsze wsparcie dla nowoczesnych aplikacji, równoległe wykonywanie testów).
- **Biblioteki do mockowania:** MSW (Mock Service Worker) do symulacji odpowiedzi API.
- **Narzędzia do testów wydajnościowych:** k6 do symulacji obciążenia (lepsza integracja z GitHub Actions, skrypty w TypeScript).
- **Narzędzia analizy kodu:** ESLint, Prettier oraz testy statyczne TypeScript.
- **Testy wizualne UI:** Storybook do izolowanego testowania komponentów Shadcn/ui.
- **Środowisko lokalne Supabase:** Supabase CLI do lokalnego developmentu i testów.

## 7. Harmonogram testów
- **Dzień 1–2:** Implementacja testów jednostkowych kluczowych funkcji i hooków.
- **Dzień 3–4:** Rozbudowa testów integracyjnych endpointów API i interakcji Supabase.
- **Dzień 5:** Przeprowadzenie testów E2E obejmujących pełny flow użytkownika.
- **Dzień 6:** Testy wydajnościowe oraz bezpieczeństwa (symulacja ataków, testy negatywne).
- **Dzień 7:** Analiza wyników, optymalizacja testów i przygotowanie raportu.

## 8. Kryteria akceptacji testów
- Wszystkie testy jednostkowe i integracyjne muszą przechodzić bez błędów.
- Testy E2E muszą symulować poprawny flow użytkownika (logowanie, generowanie, walidacja oraz zapis fiszek).
- Wskaźniki wydajnościowe API nie przekraczają ustalonych progów odpowiedzi (czas odpowiedzi poniżej 500ms przy umiarkowanym obciążeniu).
- Wszystkie błędy autoryzacji oraz walidacji są odpowiednio obsługiwane i zwracane przez system.

## 9. Role i odpowiedzialności
- **Inżynier QA:** Tworzenie i utrzymanie planu testów, napisanie testów jednostkowych, integracyjnych i E2E.
- **Developerzy:** Współpraca przy rozwiązywaniu wykrytych problemów, przygotowanie środowiska testowego.
- **DevOps:** Konfiguracja narzędzi CI/CD i integracja testów w pipeline.
- **Zespół bezpieczeństwa:** Przeprowadzenie testów bezpieczeństwa i przegląd ustawień RLS.

## 10. Procedury raportowania błędów
- **Zgłaszanie:** Wszystkie błędy są rejestrowane w systemie zgłoszeń (np. Jira, GitHub Issues) z pełnym opisem scenariusza, kroków odtworzenia oraz zrzutami ekranu, jeśli to możliwe.
- **Priorytetyzacja:** Błędy krytyczne (blokujące funkcjonalność) muszą być naprawione przed wdrożeniem nowych funkcjonalności.
- **Weryfikacja:** Po naprawie błędów wprowadzane są testy regresji dla wcześniej zgłoszonych problemów.
- **Raport końcowy:** Na koniec cyklu testowego przygotowywany jest raport podsumowujący przeprowadzone testy, uzyskane wyniki oraz rekomendacje dalszych działań.
