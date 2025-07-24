# Specyfikacja Techniczna: System Autentykacji 10x-cards

## 1. Przegląd

System autentykacji dla aplikacji 10x-cards implementuje pełny cykl zarządzania użytkownikami z wykorzystaniem Supabase Auth i Astro. Specyfikacja obejmuje rejestrację, logowanie, wylogowanie, odzyskiwanie hasła oraz zarządzanie sesjami użytkowników w aplikacji do generowania fiszek edukacyjnych.

### 1.1 Cele implementacji

- **Bezpieczeństwo**: Implementacja JWT-based authentication z Supabase
- **Użyteczność**: Intuicyjny UX flow dla wszystkich operacji auth
- **Zgodność**: Pełna zgodność z PRD (US-001, US-002) i istniejącą architekturą
- **Skalowanie**: Przygotowanie pod rozbudowę aplikacji o nowe funkcjonalności

### 1.2 Integracja z istniejącym kodem

Aplikacja już posiada:
- ✅ Middleware Supabase w `src/middleware/index.ts`
- ✅ Konfigurację środowiska w `src/env.d.ts`
- ✅ Typy autentykacji w `src/types.ts`
- ✅ Widok generowania fiszek w `/generate`
- ✅ API endpoints z hardcoded user ID

---

## 2. Architektura UI

### 2.1 Strony i routing

```
/auth           - Strona logowania/rejestracji (publiczna)
/               - Dashboard (chroniona, przekierowanie do /generate)
/generate       - Generowanie fiszek (chroniona, istniejąca)
/flashcards     - Lista fiszek (chroniona, do implementacji)
/study          - Sesja nauki (chroniona, do implementacji)
/profile        - Profil użytkownika (chroniona, do implementacji)
```

### 2.2 Stany autentykacji aplikacji

#### Niezalogowany użytkownik:
- **Dostępne strony**: `/auth`
- **Przekierowania**: Wszystkie inne strony → `/auth`
- **UI**: Formularz logowania/rejestracji

#### Zalogowany użytkownik:
- **Dostępne strony**: Wszystkie chronione strony
- **Przekierowania**: `/auth` → `/` → `/generate`
- **UI**: Główna nawigacja z user menu

### 2.3 Komponenty autoryzacji

```
src/components/auth/
├── AuthLayout.astro         # Layout dla stron auth
├── AuthForm.tsx            # Formularz logowania/rejestracji
├── LoginForm.tsx           # Dedykowany formularz loginu
├── RegisterForm.tsx        # Dedykowany formularz rejestracji
├── PasswordResetForm.tsx   # Formularz resetowania hasła
└── AuthGuard.tsx          # HOC/komponenty ochrony tras
```

### 2.4 Layout i nawigacja

#### AuthLayout (`/auth`):
```html
<AuthLayout>
  <div class="min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1>10x-cards</h1>
        <p>Generowanie fiszek z AI</p>
      </div>
      <AuthForm />
    </div>
  </div>
</AuthLayout>
```

#### MainLayout (chronione strony):
```html
<Layout>
  <header class="border-b">
    <nav class="container mx-auto px-4 py-4 flex justify-between">
      <div class="flex items-center space-x-6">
        <Logo />
        <NavLink href="/generate">Generuj</NavLink>
        <NavLink href="/flashcards">Moje fiszki</NavLink>
        <NavLink href="/study">Nauka</NavLink>
      </div>
      <UserMenu />
    </nav>
  </header>
  <main>
    <slot />
  </main>
</Layout>
```

---

## 3. Implementacja Frontend

### 3.1 Zarządzanie stanem autentykacji

#### React Context dla sesji użytkownika:
```typescript
// src/contexts/AuthContext.tsx
interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Nasłuchiwanie zmian sesji Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Implementacja metod auth...
}
```

### 3.2 Komponenty formularzy

#### AuthForm - uniwersalny formularz:
```typescript
// src/components/auth/AuthForm.tsx
interface AuthFormProps {
  mode?: 'login' | 'register' | 'reset';
  onModeChange?: (mode: 'login' | 'register' | 'reset') => void;
}

const AuthForm = ({ mode = 'login', onModeChange }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      switch (mode) {
        case 'login':
          await signIn(email, password);
          break;
        case 'register':
          if (password !== confirmPassword) {
            setErrors(['Hasła nie są identyczne']);
            return;
          }
          await signUp(email, password);
          break;
        case 'reset':
          await resetPassword(email);
          break;
      }
    } catch (error) {
      setErrors([error.message]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Implementacja formularza */}
    </form>
  );
};
```

### 3.3 Ochrona tras (Route Guards)

#### Middleware na poziomie Astro:
```typescript
// src/middleware/auth.ts
export const onRequest = defineMiddleware(async (context, next) => {
  const { url, locals } = context;
  const supabase = locals.supabase;
  
  // Pobieranie sesji użytkownika
  const { data: { session } } = await supabase.auth.getSession();
  
  // Definicja tras publicznych i chronionych
  const publicRoutes = ['/auth'];
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));
  
  // Logika przekierowań
  if (!session && !isPublicRoute) {
    // Niezalogowany użytkownik próbuje dostać się do chronionej strony
    return Response.redirect(new URL('/auth', url.origin));
  }
  
  if (session && url.pathname === '/auth') {
    // Zalogowany użytkownik na stronie logowania
    return Response.redirect(new URL('/', url.origin));
  }
  
  if (session && url.pathname === '/') {
    // Przekierowanie z dashboard do głównej funkcjonalności
    return Response.redirect(new URL('/generate', url.origin));
  }
  
  return next();
});
```

### 3.4 Komponenty UI

#### UserMenu - menu użytkownika:
```typescript
// src/components/navigation/UserMenu.tsx
const UserMenu = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Konto</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profil</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          Wyloguj się
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

---

## 4. Backend i API

### 4.1 Aktualizacja istniejących endpoints

#### Usunięcie hardcoded user ID z API:
```typescript
// src/pages/api/generations.ts (aktualizacja)
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Autoryzacja użytkownika
    const supabase = locals.supabase;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'Valid session required' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = session.user.id; // Dynamiczny user ID
    
    // Reszta logiki bez zmian...
  } catch (error) {
    // Error handling...
  }
};
```

### 4.2 Nowe API endpoints

#### Profil użytkownika:
```typescript
// src/pages/api/users/me.ts
export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Pobieranie statystyk użytkownika
    const { data: flashcardsStats } = await supabase
      .from('flashcards')
      .select('source')
      .eq('user_id', session.user.id);

    const stats = {
      total: flashcardsStats.length,
      ai_generated: flashcardsStats.filter(f => f.source.startsWith('ai')).length,
      manual: flashcardsStats.filter(f => f.source === 'manual').length,
    };

    const response: UserProfileDto = {
      id: session.user.id,
      email: session.user.email!,
      created_at: session.user.created_at,
      flashcards_count: stats,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

#### Usuwanie konta:
```typescript
// src/pages/api/users/delete.ts
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { confirmation }: DeleteAccountRequestDto = await request.json();
    
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return new Response(
        JSON.stringify({ error: 'Invalid confirmation text' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Usuwanie danych użytkownika - RLS automatycznie ograniczy do własnych danych
    const userId = session.user.id;
    
    // Usuwanie fiszek (kaskadowe usunie powiązane generacje)
    await supabase
      .from('flashcards')
      .delete()
      .eq('user_id', userId);

    // Usuwanie konta użytkownika z Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      throw error;
    }

    const response: DeleteAccountResponseDto = {
      message: 'Account deleted successfully',
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### 4.3 Serwisy do zarządzania użytkownikami

```typescript
// src/lib/services/user.service.ts
import type { SupabaseClient } from '../db/supabase.client';
import type { UserProfileDto, DeleteAccountRequestDto } from '../../types';

export class UserService {
  constructor(private supabase: SupabaseClient) {}

  async getUserProfile(userId: string): Promise<UserProfileDto> {
    // Pobieranie danych użytkownika z auth
    const { data: authUser } = await this.supabase.auth.getUser();
    
    if (!authUser.user) {
      throw new Error('User not found');
    }

    // Pobieranie statystyk fiszek
    const { data: flashcardsStats } = await this.supabase
      .from('flashcards')
      .select('source')
      .eq('user_id', userId);

    const stats = {
      total: flashcardsStats?.length || 0,
      ai_generated: flashcardsStats?.filter(f => f.source.startsWith('ai')).length || 0,
      manual: flashcardsStats?.filter(f => f.source === 'manual').length || 0,
    };

    return {
      id: authUser.user.id,
      email: authUser.user.email!,
      created_at: authUser.user.created_at,
      flashcards_count: stats,
    };
  }

  async deleteUserAccount(userId: string): Promise<void> {
    // Usuwanie wszystkich danych użytkownika
    // RLS polityki zapewnią że usuwane są tylko własne dane
    
    // 1. Usuwanie fiszek (automatycznie usuwa powiązane generacje)
    await this.supabase
      .from('flashcards')
      .delete()
      .eq('user_id', userId);

    // 2. Usuwanie logów błędów generacji
    await this.supabase
      .from('generation_error_logs')
      .delete()
      .eq('user_id', userId);

    // 3. Usuwanie pozostałych generacji (jeśli istnieją orphaned)
    await this.supabase
      .from('generations')
      .delete()
      .eq('user_id', userId);
  }
}
```

---

## 5. Bezpieczeństwo i walidacja

### 5.1 Walidacja formularzy

#### Schematy Zod dla autentykacji:
```typescript
// src/lib/validation/auth.schemas.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email'),
  password: z
    .string()
    .min(6, 'Hasło musi mieć co najmniej 6 znaków'),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email'),
  password: z
    .string()
    .min(6, 'Hasło musi mieć co najmniej 6 znaków')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
           'Hasło musi zawierać małą literę, wielką literę i cyfrę'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});

export const passwordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email'),
});
```

### 5.2 Konfiguracja Supabase Auth

#### Aktualizacja `supabase/config.toml`:
```toml
[auth]
# Podstawowe ustawienia (już skonfigurowane)
enable_signup = true
site_url = "http://127.0.0.1:3000"

# Wzmocnienie wymagań hasła
minimum_password_length = 8
password_requirements = "lower_upper_letters_digits"

# Konfiguracja email
[auth.email]
enable_signup = true
enable_confirmations = true  # Wymagana konfirmacja email
double_confirm_changes = true

# Rate limiting
[auth.rate_limit]
email_sent = 5  # Emails per hour
sign_in_sign_ups = 10  # Próby logowania per 5 min
```

### 5.3 Walidacja po stronie serwera

```typescript
// src/lib/utils/auth.validation.ts
export const validateAuthRequest = (data: unknown) => {
  try {
    return loginSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    throw error;
  }
};
```

---

## 6. Obsługa błędów i UX

### 6.1 Mapowanie błędów Supabase

```typescript
// src/lib/utils/auth.errors.ts
export const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Nieprawidłowy email lub hasło';
    case 'Email not confirmed':
      return 'Konto nie zostało potwierdzone. Sprawdź swoją skrzynkę email';
    case 'User already registered':
      return 'Użytkownik z tym emailem już istnieje';
    case 'Password should be at least 6 characters':
      return 'Hasło musi mieć co najmniej 6 znaków';
    case 'Signup is disabled':
      return 'Rejestracja jest obecnie wyłączona';
    default:
      return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie';
  }
};
```

### 6.2 Loading states i feedback

```typescript
// Hook do zarządzania stanem loading
const useAuthLoading = () => {
  const [loadingStates, setLoadingStates] = useState({
    signIn: false,
    signUp: false,
    signOut: false,
    resetPassword: false,
  });

  const setLoading = (action: keyof typeof loadingStates, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [action]: loading }));
  };

  return { loadingStates, setLoading };
};
```

### 6.3 Toast notifications

```typescript
// src/components/ui/use-toast.ts (rozszerzenie Shadcn)
export const useAuthToast = () => {
  const { toast } = useToast();

  const showSuccess = (message: string) => {
    toast({
      title: 'Sukces',
      description: message,
      variant: 'default',
    });
  };

  const showError = (message: string) => {
    toast({
      title: 'Błąd',
      description: message,
      variant: 'destructive',
    });
  };

  return { showSuccess, showError };
};
```

---

## 7. Responsive Design i Accessibility

### 7.1 Responsive breakpoints

```css
/* Tailwind config dla auth form */
.auth-container {
  @apply min-h-screen flex items-center justify-center px-4;
}

.auth-form {
  @apply w-full max-w-md space-y-6 bg-card p-6 rounded-lg border shadow-sm;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .auth-form {
    @apply max-w-sm p-4 space-y-4;
  }
}
```

### 7.2 Accessibility features

```typescript
// Komponenty z pełną obsługą a11y
const AuthForm = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Auto-focus na pierwszym polu przy wejściu
    emailRef.current?.focus();
  }, []);

  return (
    <form aria-label="Formularz logowania">
      <div className="space-y-4">
        <Label htmlFor="email" className="sr-only">
          Adres email
        </Label>
        <Input
          id="email"
          ref={emailRef}
          type="email"
          placeholder="Email"
          aria-required="true"
          aria-describedby="email-error"
          autoComplete="email"
        />
        {emailError && (
          <p id="email-error" className="text-sm text-destructive">
            {emailError}
          </p>
        )}
      </div>
      {/* Więcej pól... */}
    </form>
  );
};
```

---

## 8. Plan implementacji

### 8.1 Faza 1: Podstawowa infrastruktura (2-3 dni)

1. **Utworzenie struktur plików:**
   ```
   src/
   ├── components/auth/
   ├── contexts/
   ├── lib/validation/
   ├── lib/services/user.service.ts
   └── pages/auth.astro
   ```

2. **Implementacja AuthContext i podstawowych hooks**
3. **Utworzenie AuthLayout i podstawowych komponentów UI**
4. **Aktualizacja middleware do ochrony tras**

### 8.2 Faza 2: Formularze i walidacja (2-3 dni)

1. **Implementacja AuthForm z wszystkimi trybami**
2. **Dodanie walidacji Zod i obsługi błędów**
3. **Implementacja password reset flow**
4. **Testy formularzy i walidacji**

### 8.3 Faza 3: Integracja z istniejącym kodem (1-2 dni)

1. **Usunięcie hardcoded user ID z API endpoints**
2. **Aktualizacja istniejących stron o auth guard**
3. **Implementacja nawigacji z UserMenu**
4. **Testy integracji z istniejącymi funkcjonalnościami**

### 8.4 Faza 4: API profilu i zarządzanie kontem (2 dni)

1. **Implementacja endpoints `/api/users/me` i `/api/users/delete`**
2. **Utworzenie UserService**
3. **Implementacja strony profilu użytkownika**
4. **Funkcjonalność usuwania konta**

### 8.5 Faza 5: Testy i polishing (1-2 dni)

1. **Testy E2E całego flow autentykacji**
2. **Optymalizacja UX i loading states**
3. **Walidacja accessibility**
4. **Dokumentacja i code review**

### 8.6 Harmonogram szczegółowy:

**Dzień 1:**
- [ ] Utworzenie struktury plików i AuthContext
- [ ] Implementacja podstawowego AuthLayout
- [ ] Aktualizacja middleware do route protection

**Dzień 2:**
- [ ] Implementacja AuthForm (login/register)
- [ ] Dodanie walidacji Zod
- [ ] Podstawowa obsługa błędów

**Dzień 3:**
- [ ] Password reset functionality
- [ ] UserMenu i nawigacja
- [ ] Loading states i toast notifications

**Dzień 4:**
- [ ] Usunięcie hardcoded user ID z API
- [ ] Aktualizacja istniejących stron
- [ ] Testy integracji z /generate

**Dzień 5:**
- [ ] API endpoints profilu użytkownika
- [ ] UserService implementation
- [ ] Delete account functionality

**Dzień 6:**
- [ ] Strona profilu użytkownika
- [ ] Responsive design improvements
- [ ] Accessibility testing

**Dzień 7:**
- [ ] E2E testing całego flow
- [ ] Bug fixes i polishing
- [ ] Documentation update

---

## 9. Kryteria akceptacji

### 9.1 Funkcjonalne

**US-001: Rejestracja konta**
- ✅ Formularz z polami email/hasło
- ✅ Walidacja po stronie klienta i serwera
- ✅ Potwierdzenie rejestracji emailem
- ✅ Automatyczne logowanie po rejestracji

**US-002: Logowanie do aplikacji**
- ✅ Formularz logowania
- ✅ Obsługa błędnych danych
- ✅ Przekierowanie po logowaniu
- ✅ Pamiętanie sesji

**Dodatkowe wymagania:**
- ✅ Wylogowanie z czyszczeniem sesji
- ✅ Reset hasła przez email
- ✅ Ochrona wszystkich chronionych tras
- ✅ Profil użytkownika ze statystykami
- ✅ Usuwanie konta

### 9.2 Techniczne

- ✅ Integracja z Supabase Auth
- ✅ JWT token management
- ✅ RLS policies działają poprawnie
- ✅ Bezpieczeństwo walidacji
- ✅ Responsive design
- ✅ Accessibility compliance
- ✅ Error handling
- ✅ Loading states

### 9.3 UX/UI

- ✅ Intuicyjny flow autoryzacji
- ✅ Czytelne komunikaty błędów
- ✅ Smooth transitions
- ✅ Mobile-friendly
- ✅ Keyboard navigation
- ✅ Screen reader support

---

## 10. Metryki i monitoring

### 10.1 Metryki sukcesu

1. **Rejestracja:**
   - Success rate > 95%
   - Time to completion < 60 sekund
   - Email confirmation rate > 80%

2. **Logowanie:**
   - Success rate > 98%
   - Time to login < 30 sekund
   - Password reset usage < 5%

3. **Retencja:**
   - Session length > 10 minut
   - Return users > 70%
   - Account deletion rate < 2%

### 10.2 Monitoring

```typescript
// Analytics hooks dla tracking auth events
const useAuthAnalytics = () => {
  const trackSignUp = () => {
    // Analytics event tracking
  };
  
  const trackSignIn = () => {
    // Analytics event tracking
  };
  
  const trackError = (error: string) => {
    // Error tracking
  };
};
```

---

## 11. Rozszerzenia przyszłościowe

### 11.1 Planowane ulepszenia

1. **OAuth providers (Google, GitHub)**
2. **Two-factor authentication (2FA)**
3. **Email templates customization**
4. **Advanced user preferences**
5. **Admin panel dla zarządzania użytkownikami**

### 11.2 Integracja z nowymi funkcjonalnościami

- **Social features:** Współdzielenie fiszek między użytkownikami
- **Premium features:** Różne poziomy dostępu
- **Team accounts:** Organizacyjne zarządzanie kontami
- **API access:** Zewnętrzne integracje

---

## 12. Załączniki

### 12.1 Istniejące typy (src/types.ts)

```typescript
// Już zdefiniowane DTO dla autentykacji
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
```

### 12.2 Konfiguracja Supabase

Aplikacja ma już skonfigurowane:
- ✅ Supabase URL i Key w środowisku
- ✅ Database types w `src/db/database.types.ts`
- ✅ Supabase client w `src/db/supabase.client.ts`
- ✅ Middleware w `src/middleware/index.ts`
- ✅ RLS policies w migracji SQL

### 12.3 Database Schema

Tabela `auth.users` jest zarządzana przez Supabase Auth i zawiera:
- `id` (UUID, primary key)
- `email` (unique)
- `encrypted_password`
- `created_at`
- `confirmed_at`
- `last_sign_in_at`

RLS policies zapewniają, że użytkownicy mają dostęp tylko do własnych danych w tabelach:
- `flashcards`
- `generations` 
- `generation_error_logs`

---

**Status dokumentu:** ✅ Gotowy do implementacji
**Ostatnia aktualizacja:** Styczeń 2025
**Wersja:** 1.0
