-- Panier rattaché au compte : identique sur tous les appareils du client.
-- Appliquée sur le projet Supabase « electromarket » le 2026-10-03.
-- Ne contient que des SKU et des quantités ; les prix sont toujours recalculés côté serveur.
create table public.carts (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  lines jsonb not null default '[]'::jsonb
    check (jsonb_typeof(lines) = 'array' and jsonb_array_length(lines) <= 30),
  updated_at timestamptz not null default now()
);
comment on table public.carts is 'Panier du client connecté (SKU + quantités), synchronisé entre ses appareils.';

alter table public.carts enable row level security;

create policy "Panier : lecture par son titulaire" on public.carts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Panier : création par son titulaire" on public.carts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Panier : modification par son titulaire" on public.carts
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Panier : suppression par son titulaire" on public.carts
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger carts_set_updated_at before update on public.carts
  for each row execute function public.set_updated_at();
