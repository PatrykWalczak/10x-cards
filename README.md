# 📚 10x Cards

Nowoczesna platforma edukacyjna wykorzystująca sztuczną inteligencję do automatycznego generowania wysokiej jakości fiszek z dowolnego tekstu, czyniąc naukę przez powtarzanie rozłożone w czasie bardziej efektywną i dostępną.

## 📋 O projekcie

10x Cards to innowacyjna aplikacja, która rozwiązuje czasochłonny proces ręcznego tworzenia fiszek edukacyjnych poprzez dostarczenie rozwiązania opartego na AI. Aplikacja łączy efektywność automatycznego generowania treści z sprawdzoną metodologią nauki przez powtarzanie rozłożone w czasie.

## 🎯 Główne funkcjonalności

🤖 **Generowanie fiszek przez AI** - wykorzystuje zaawansowane modele LLM (OpenRouter API) do automatycznego tworzenia fiszek z tekstu  
✏️ **Ręczne tworzenie fiszek** - możliwość tworzenia niestandardowych fiszek z własną treścią  
📚 **Zarządzanie fiszkami** - edycja, usuwanie i organizowanie kolekcji fiszek  
🔁 **Powtarzanie rozłożone w czasie** - wbudowany algorytm do optymalnych sesji nauki  
👤 **System autentykacji** - bezpieczny system kont z ochroną prywatności danych  
📊 **Analityka nauki** - śledzenie statystyk generowania i akceptacji fiszek  
📱 **Responsywny design** - pełna optymalizacja dla urządzeń mobilnych  

## 🖼️ Screenshoty

### Strona główna
*Intuicyjny interfejs z polem do wklejania tekstu i generowania fiszek*

### Generator fiszek
*Trójstopniowy proces: wklej tekst → przejrzyj wygenerowane fiszki → zapisz wybrane*

### Moje fiszki
*Zarządzanie kolekcją fiszek z możliwością edycji i usuwania*

## 🚀 Technologie

### Frontend
- **Astro 5** - szybki framework z minimalnym JavaScript
- **React 19** - interaktywne komponenty
- **TypeScript 5** - statyczne typowanie
- **Tailwind CSS 3** - utility-first CSS framework
- **Shadcn/ui** - biblioteka komponentów UI

### Backend & Serwisy
- **Supabase** - kompleksowe rozwiązanie backendowe:
  - PostgreSQL - baza danych
  - Autentykacja użytkowników
  - Row Level Security (RLS)
- **OpenRouter API** - dostęp do modeli AI z kontrolą kosztów

### AI & Integracje
- **OpenRouter API** - dostęp do różnych modeli LLM
- **Meta Llama 3.2** - model do generowania fiszek
- **Inteligentna analiza tekstu** - automatyczne wyodrębnianie kluczowych pojęć

### DevOps & Testy
- **Vitest** - szybkie testy jednostkowe i integracyjne
- **ESLint & Prettier** - jakość i formatowanie kodu
- **Husky** - git hooks dla jakości kodu

## 📁 Struktura projektu

```
10x-astro-starter/
├── .github/
│   └── workflows/           # GitHub Actions workflows
├── public/                  # Zasoby statyczne
├── src/
│   ├── components/         # Komponenty React
│   │   ├── auth/          # Komponenty autentykacji
│   │   ├── flashcards/    # Komponenty zarządzania fiszkami
│   │   ├── generate/      # Komponenty generatora
│   │   ├── hooks/         # Custom hooks
│   │   ├── navigation/    # Komponenty nawigacji
│   │   └── ui/            # Komponenty UI
│   ├── contexts/          # React Contexts
│   ├── db/                # Konfiguracja bazy danych
│   ├── layouts/           # Układy stron
│   ├── lib/               # Integracje i serwisy
│   │   ├── services/      # Serwisy biznesowe
│   │   └── validation/    # Schematy walidacji
│   ├── middleware/        # Middleware Astro
│   ├── pages/             # Strony aplikacji
│   │   └── api/           # API endpoints
│   ├── styles/            # Style globalne
│   └── test/              # Konfiguracja testów
├── supabase/
│   └── migrations/        # Migracje bazy danych
└── [pliki konfiguracyjne]
```

## 🛠️ Instalacja i uruchomienie

### Wymagania
- Node.js 22+
- npm lub yarn
- Konto Supabase
- Klucz API OpenRouter

### Kroki instalacji

1. **Sklonuj repozytorium**
   ```bash
   git clone https://github.com/yourusername/10x-cards.git
   cd 10x-cards
   ```

2. **Użyj odpowiedniej wersji Node.js**
   ```bash
   nvm use
   ```

3. **Zainstaluj zależności**
   ```bash
   npm install
   ```

4. **Skonfiguruj zmienne środowiskowe**
   ```bash
   cp .env.example .env
   ```
   
   Wypełnij plik `.env`:
   ```bash
   # Supabase Configuration
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_KEY=your_supabase_service_key

   # OpenRouter AI Configuration
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

5. **Uruchom migracje Supabase**
   ```bash
   npx supabase db push
   ```

6. **Uruchom aplikację**
   ```bash
   npm run dev
   ```

   Aplikacja będzie dostępna pod adresem `http://localhost:4321`

## 📋 Dostępne skrypty

| Skrypt | Opis |
|--------|------|
| `npm run dev` | Uruchom serwer deweloperski z hot reload |
| `npm run build` | Zbuduj aplikację do produkcji |
| `npm run preview` | Podgląd buildu produkcyjnego lokalnie |
| `npm run test` | Uruchom testy jednostkowe z Vitest |
| `npm run test:watch` | Uruchom testy w trybie obserwacji |
| `npm run lint` | Sprawdź jakość kodu z ESLint |
| `npm run lint:fix` | Automatycznie napraw problemy ESLint |
| `npm run format` | Sformatuj kod z Prettier |

## 🧪 Testowanie

### Testy jednostkowe
```bash
npm run test
```

### Testy w trybie obserwacji
```bash
npm run test:watch
```

### Pokrycie kodu
```bash
npm run test:coverage
```

## 📦 Deployment

Aplikacja może być łatwo wdrożona na różnych platformach:

- **Vercel** - automatyczny deployment z GitHub
- **Netlify** - ciągłe wdrażanie
- **DigitalOcean** - hosting przez Docker
- **Cloudflare Pages** - szybki hosting statyczny

### Ręczny build
```bash
npm run build
```

## 🔒 Bezpieczeństwo

- ✅ Autentykacja oparta na JWT (Supabase Auth)
- ✅ Row Level Security (RLS) w PostgreSQL
- ✅ Walidacja danych po stronie klienta i serwera
- ✅ Bezpieczne przechowywanie kluczy API
- ✅ Ochrona przed XSS i CSRF

## 📈 Przyszłe funkcjonalności

- 🎯 **Zaawansowane algorytmy powtarzania** - personalizowane interwały nauki
- 📊 **Szczegółowa analityka** - raporty postępów i statystyki nauki
- 👥 **Współdzielenie fiszek** - udostępnianie kolekcji innym użytkownikom
- 🔍 **Zaawansowane wyszukiwanie** - filtrowanie fiszek po słowach kluczowych
- 📱 **Aplikacja mobilna** - natywne aplikacje iOS/Android
- 🌍 **Wielojęzyczność** - wsparcie dla wielu języków
- 🎨 **Personalizacja** - motywy i dostosowywanie interfejsu
- 📋 **Import/Export** - przenoszenie fiszek między platformami

## 🎯 Zakres projektu

### Funkcjonalności MVP (Obecny zakres)

- ✅ Rejestracja i autentykacja użytkowników
- ✅ Generowanie fiszek przez AI z tekstu
- ✅ Ręczne tworzenie i zarządzanie fiszkami
- ✅ Edycja i usuwanie fiszek
- ✅ Śledzenie statystyk generowania

### Metryki sukcesu

- **Współczynnik akceptacji AI**: Cel 75% akceptacji fiszek generowanych przez AI
- **Współczynnik użycia AI**: Cel 75% fiszek tworzonych z pomocą AI
- **Zaangażowanie użytkowników**: Monitorowanie częstotliwości tworzenia fiszek

## 📊 Status projektu

🚧 **W rozwoju** - Faza MVP

Projekt jest obecnie w aktywnym rozwoju, koncentrując się na podstawowych funkcjonalnościach MVP. Aplikacja jest budowana z myślą o skalowalności i doświadczeniu użytkownika.

## 🤝 Autorzy

Projekt stworzony jako część kursu programowania **10xdevs**.

## 📄 Licencja

Ten projekt jest licencjonowany na podstawie licencji MIT - zobacz plik [LICENSE](LICENSE) dla szczegółów.

---

**Uwaga**: Ten projekt priorytetowo traktuje prywatność użytkowników i bezpieczeństwo danych. Wszystkie dane osobowe są obsługiwane zgodnie z przepisami RODO, a użytkownicy mają pełną kontrolę nad swoimi danymi z prawem dostępu i usunięcia.

## 🔗 Linki

- [Demo na żywo](https://10x-cards-demo.vercel.app) *(wkrótce)*
- [Dokumentacja API](docs/api.md) *(wkrótce)*
- [Przewodnik kontrybutora](CONTRIBUTING.md) *(wkrótce)*
- **Testing Library** - Component testing utilities for React components
- **Playwright** - End-to-end testing with parallel execution and modern app support
- **MSW (Mock Service Worker)** - API mocking for reliable testing
- **k6** - Performance testing with TypeScript support
- **Storybook** - Isolated UI component testing and documentation
- **Axe** - Automated accessibility testing
- **Supabase CLI** - Local development and testing environment

## Getting Started Locally

### Prerequisites

- Node.js version `22.14.0` (specified in `.nvmrc`)
- npm or yarn package manager
- Supabase account for backend services
- Openrouter.ai API key for AI functionality

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 10x-astro-starter
   ```

2. **Use the correct Node.js version**
   ```bash
   nvm use
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory with:
   ```bash
   # Supabase Configuration
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Openrouter.ai Configuration
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:4321`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run astro` | Run Astro CLI commands |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Automatically fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit and integration tests with Vitest |
| `npm run test:e2e` | Run end-to-end tests with Playwright |
| `npm run test:watch` | Run tests in watch mode during development |

## Project Scope

### MVP Features (Current Scope)

- ✅ User registration and authentication
- ✅ AI-powered flashcard generation from text input
- ✅ Manual flashcard creation and management
- ✅ Flashcard editing and deletion
- ✅ Spaced repetition learning sessions
- ✅ Generation statistics tracking

### Future Enhancements (Post-MVP)

- Advanced flashcard search by keywords
- Custom spaced repetition algorithms
- Collaborative flashcard sharing
- Advanced learning analytics
- Mobile application
- Offline learning capabilities

### Success Metrics

- **AI Acceptance Rate**: Target of 75% acceptance rate for AI-generated flashcards
- **AI Usage Rate**: Goal of 75% of flashcards created using AI assistance
- **User Engagement**: Monitor flashcard creation and learning session frequency

## Project Status

🚧 **In Development** - MVP Phase

The project is currently in active development focusing on core MVP features. The application is being built with scalability and user experience as primary considerations.

### Current Development Focus

- Core flashcard generation and management functionality
- User authentication and data security
- Spaced repetition algorithm integration
- UI/UX optimization for learning workflows

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This project prioritizes user privacy and data security. All personal data is handled in compliance with GDPR regulations, and users maintain full control over their data with rights to access and deletion.
