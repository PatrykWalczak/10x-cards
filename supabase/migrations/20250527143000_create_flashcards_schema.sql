--
-- migration: create_flashcards_schema
-- purpose: initial database schema for 10x-cards mvp application
-- affected tables: flashcards, generations, generation_error_logs
-- special considerations: 
--   - users table is managed by supabase auth
--   - row level security (rls) enabled for all custom tables
--   - triggers for automatic updated_at timestamp management
--
-- created: 2025-05-27
-- author: system migration
--

-- create the generations table first since it's referenced by flashcards
-- this table tracks ai generation sessions and related statistics
create table public.generations (
    id bigserial primary key,
    -- reference to the user who initiated the generation
    user_id uuid references auth.users(id) not null,
    -- ai model used for generation (e.g., 'gpt-4', 'claude-3')
    model varchar not null,
    -- total number of flashcards generated in this session
    generated_count integer not null default 0,
    -- number of ai-generated cards accepted without editing
    accepted_unedited_count integer not null default 0,
    -- number of ai-generated cards accepted after user editing
    accepted_edited_count integer not null default 0,
    -- hash of the source text to avoid duplicate processing
    source_text_hash text not null,
    -- length of source text (enforced between 1000-10000 characters per requirements)
    source_text_length integer not null check (source_text_length between 1000 and 10000),
    -- standard timestamp fields
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- create the flashcards table to store all user flashcards
-- supports both ai-generated and manually created flashcards
create table public.flashcards (
    id bigserial primary key,
    -- front side of the flashcard (question/prompt) - limited to 200 chars per requirements
    front varchar(200) not null,
    -- back side of the flashcard (answer/explanation) - limited to 500 chars per requirements
    back varchar(500) not null,
    -- source of the flashcard: 'ai-full', 'ai-edited', or 'manual'
    -- using check constraint instead of enum for flexibility per requirements
    source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
    -- standard timestamp fields
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    -- foreign key to generations table (nullable for manual flashcards)
    generation_id bigint references public.generations(id),
    -- foreign key to auth.users table - every flashcard belongs to a user
    user_id uuid references auth.users(id) not null
);

-- create the generation_error_logs table for tracking ai generation failures
-- helps with debugging and monitoring ai service reliability
create table public.generation_error_logs (
    id bigserial primary key,
    -- reference to the user who experienced the error
    user_id uuid references auth.users(id) not null,
    -- ai model that failed during generation
    model varchar not null,
    -- hash of the source text that caused the error
    source_text_hash text not null,
    -- length of source text that caused the error
    source_text_length integer not null check (source_text_length between 1000 and 10000),
    -- error code from the ai service or application
    error_code varchar,
    -- detailed error message for debugging
    error_message text,
    -- timestamp when the error occurred
    created_at timestamp with time zone default now() not null
);

-- create performance indexes for frequently queried columns
-- flashcards table indexes
create index idx_flashcards_user_id on public.flashcards(user_id);
create index idx_flashcards_generation_id on public.flashcards(generation_id);
create index idx_flashcards_source on public.flashcards(source);
create index idx_flashcards_created_at on public.flashcards(created_at);

-- generations table indexes
create index idx_generations_user_id on public.generations(user_id);
create index idx_generations_created_at on public.generations(created_at);

-- generation_error_logs table indexes
create index idx_generation_error_logs_user_id on public.generation_error_logs(user_id);
create index idx_generation_error_logs_created_at on public.generation_error_logs(created_at);

-- create trigger functions for automatic updated_at timestamp management
-- function to update flashcards.updated_at when row is modified
create or replace function update_flashcard_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- function to update generations.updated_at when row is modified
create or replace function update_generation_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- create triggers that automatically update the updated_at column
-- trigger for flashcards table
create trigger trigger_update_flashcard_updated_at
before update on public.flashcards
for each row
execute function update_flashcard_updated_at();

-- trigger for generations table
create trigger trigger_update_generation_updated_at
before update on public.generations
for each row
execute function update_generation_updated_at();

-- enable row level security on all custom tables
-- this ensures users can only access their own data
alter table public.flashcards enable row level security;
alter table public.generations enable row level security;
alter table public.generation_error_logs enable row level security;

-- flashcards table rls policies
-- allow authenticated users to select only their own flashcards
create policy flashcards_select_policy on public.flashcards
    for select to authenticated
    using (user_id = auth.uid());

-- allow authenticated users to insert flashcards only with their own user_id
create policy flashcards_insert_policy on public.flashcards
    for insert to authenticated
    with check (user_id = auth.uid());

-- allow authenticated users to update only their own flashcards
create policy flashcards_update_policy on public.flashcards
    for update to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- allow authenticated users to delete only their own flashcards
create policy flashcards_delete_policy on public.flashcards
    for delete to authenticated
    using (user_id = auth.uid());

-- generations table rls policies
-- allow authenticated users to select only their own generation records
create policy generations_select_policy on public.generations
    for select to authenticated
    using (user_id = auth.uid());

-- allow authenticated users to insert generation records only with their own user_id
create policy generations_insert_policy on public.generations
    for insert to authenticated
    with check (user_id = auth.uid());

-- allow authenticated users to update only their own generation records
create policy generations_update_policy on public.generations
    for update to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- allow authenticated users to delete only their own generation records
create policy generations_delete_policy on public.generations
    for delete to authenticated
    using (user_id = auth.uid());

-- generation_error_logs table rls policies
-- allow authenticated users to select only their own error logs
create policy generation_error_logs_select_policy on public.generation_error_logs
    for select to authenticated
    using (user_id = auth.uid());

-- allow authenticated users to insert error logs only with their own user_id
create policy generation_error_logs_insert_policy on public.generation_error_logs
    for insert to authenticated
    with check (user_id = auth.uid());

-- note: no update/delete policies for error logs as they should be immutable audit records
