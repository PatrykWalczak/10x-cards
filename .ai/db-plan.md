# Schemat bazy danych PostgreSQL dla projektu 10x-cards (MVP)

## 1. Tabele, kolumny i ograniczenia

### `users` (zarządzana przez Supabase Auth)
Tabela użytkowników jest automatycznie zarządzana przez Supabase Auth i zawiera standardowe pola:
- `id` UUID PRIMARY KEY
- `email` TEXT UNIQUE NOT NULL
- `encrypted_password` TEXT NOT NULL
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `confirmed_at` TIMESTAMP WITH TIME ZONE

### `flashcards`
Tabela przechowująca wszystkie fiszki, niezależnie od sposobu ich utworzenia.
```sql
CREATE TABLE flashcards (
    id BIGSERIAL PRIMARY KEY,
    front VARCHAR(200) NOT NULL,
    back VARCHAR(500) NOT NULL,
    source VARCHAR NOT NULL CHECK (source IN ('ai-full', 'ai-edited', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    generation_id BIGINT REFERENCES generations(id),
    user_id UUID REFERENCES auth.users(id) NOT NULL
);
```

### `generations`
Tabela przechowująca informacje o sesjach generowania fiszek przez AI.
```sql
CREATE TABLE generations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    model VARCHAR NOT NULL,
    generated_count INTEGER NOT NULL DEFAULT 0,
    accepted_unedited_count INTEGER NOT NULL DEFAULT 0,
    accepted_edited_count INTEGER NOT NULL DEFAULT 0,
    source_text_hash TEXT NOT NULL,
    source_text_length INTEGER NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### `generation_error_logs`
Tabela przechowująca logi błędów podczas generowania fiszek.
```sql
CREATE TABLE generation_error_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    model VARCHAR NOT NULL,
    source_text_hash TEXT NOT NULL,
    source_text_length INTEGER NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000),
    error_code VARCHAR,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

## 2. Relacje między tabelami

- **users → flashcards**: jeden-do-wielu (1:N)
  - Jeden użytkownik może mieć wiele fiszek
  - Każda fiszka należy do dokładnie jednego użytkownika

- **users → generations**: jeden-do-wielu (1:N)
  - Jeden użytkownik może mieć wiele generacji AI
  - Każda generacja należy do dokładnie jednego użytkownika

- **users → generation_error_logs**: jeden-do-wielu (1:N)
  - Jeden użytkownik może mieć wiele logów błędów
  - Każdy log błędu jest powiązany z dokładnie jednym użytkownikiem

- **generations → flashcards**: jeden-do-wielu (1:N)
  - Jedna generacja może zawierać wiele fiszek
  - Każda fiszka wygenerowana przez AI (source: 'ai-full' lub 'ai-edited') jest powiązana z jedną generacją
  - Fiszki utworzone ręcznie (source: 'manual') mają generation_id = NULL

## 3. Indeksy

```sql
-- Indeksy dla tabeli flashcards
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_generation_id ON flashcards(generation_id);
CREATE INDEX idx_flashcards_source ON flashcards(source);
CREATE INDEX idx_flashcards_created_at ON flashcards(created_at);

-- Indeksy dla tabeli generations
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_created_at ON generations(created_at);

-- Indeksy dla tabeli generation_error_logs
CREATE INDEX idx_generation_error_logs_user_id ON generation_error_logs(user_id);
CREATE INDEX idx_generation_error_logs_created_at ON generation_error_logs(created_at);
```

## 4. Triggery

Triggery do automatycznej aktualizacji pola `updated_at`:

```sql
-- Trigger dla tabeli flashcards
CREATE OR REPLACE FUNCTION update_flashcard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_flashcard_updated_at
BEFORE UPDATE ON flashcards
FOR EACH ROW
EXECUTE FUNCTION update_flashcard_updated_at();

-- Trigger dla tabeli generations
CREATE OR REPLACE FUNCTION update_generation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_generation_updated_at
BEFORE UPDATE ON generations
FOR EACH ROW
EXECUTE FUNCTION update_generation_updated_at();
```

## 5. Zasady Row Level Security (RLS)

Zabezpieczenia na poziomie wiersza dla ograniczenia dostępu użytkowników tylko do własnych danych:

```sql
-- Włączenie RLS dla wszystkich tabel
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;

-- Zasady dla tabeli flashcards
CREATE POLICY flashcards_user_select ON flashcards
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY flashcards_user_insert ON flashcards
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY flashcards_user_update ON flashcards
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY flashcards_user_delete ON flashcards
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Zasady dla tabeli generations
CREATE POLICY generations_user_select ON generations
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY generations_user_insert ON generations
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY generations_user_update ON generations
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY generations_user_delete ON generations
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Zasady dla tabeli generation_error_logs
CREATE POLICY generation_error_logs_user_select ON generation_error_logs
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY generation_error_logs_user_insert ON generation_error_logs
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
```

## 6. Dodatkowe uwagi

1. **Zarządzanie użytkownikami**: Tabela `users` jest automatycznie zarządzana przez system autentykacji Supabase, a dostęp do innych tabel jest zabezpieczony przez RLS.

