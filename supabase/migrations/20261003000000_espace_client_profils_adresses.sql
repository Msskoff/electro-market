-- Espace client ElectroMarket : profils et adresses de livraison.
-- Appliquée sur le projet Supabase « electromarket » (keiyumihbvlgucoqdbmf) le 2026-10-03.
-- Chaque client n'accède qu'à ses propres données (RLS).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '' check (char_length(first_name) <= 50),
  last_name text not null default '' check (char_length(last_name) <= 50),
  phone text check (phone is null or phone ~ '^\+228 [0-9]{2} [0-9]{2} [0-9]{2} [0-9]{2}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Profil client (1 ligne par compte, créée à l''inscription).';

alter table public.profiles enable row level security;

create policy "Profil : lecture par son titulaire" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Profil : création par son titulaire" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "Profil : modification par son titulaire" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 30),
  district text not null check (char_length(district) between 2 and 60),
  city text not null check (char_length(city) between 2 and 40),
  landmark text not null default '' check (char_length(landmark) <= 120),
  phone text not null check (phone ~ '^\+228 [0-9]{2} [0-9]{2} [0-9]{2} [0-9]{2}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table public.addresses is 'Adresses de livraison (quartier + point de repère, usage local au Togo).';

create index addresses_user_id_idx on public.addresses (user_id);
-- Au plus une adresse par défaut par client.
create unique index addresses_one_default_per_user on public.addresses (user_id) where is_default;

alter table public.addresses enable row level security;

create policy "Adresses : lecture par leur titulaire" on public.addresses
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Adresses : création par leur titulaire" on public.addresses
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Adresses : modification par leur titulaire" on public.addresses
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Adresses : suppression par leur titulaire" on public.addresses
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Mise à jour automatique de updated_at.
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Création du profil à l'inscription (prénom / nom transmis dans les métadonnées).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(left(new.raw_user_meta_data ->> 'first_name', 50), ''),
    coalesce(left(new.raw_user_meta_data ->> 'last_name', 50), '')
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Changer d'adresse par défaut sans violer l'index unique (2 étapes, RLS appliquée).
create function public.set_default_address(target uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  update public.addresses set is_default = false where user_id = (select auth.uid()) and is_default and id <> target;
  update public.addresses set is_default = true where user_id = (select auth.uid()) and id = target;
end;
$$;
revoke execute on function public.set_default_address(uuid) from public, anon;
grant execute on function public.set_default_address(uuid) to authenticated;

-- Droit à l'effacement : le client supprime son compte (profil et adresses suivent en cascade).
-- SECURITY DEFINER volontaire (signalé par l'analyse Supabase) : ne supprime que auth.uid().
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Non authentifié';
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
