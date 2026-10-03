-- Administration : catalogue, configuration et brouillons en base.
-- Appliquée sur le projet Supabase « electromarket » le 2026-10-03.
--
-- Principe « Brouillon puis Publier » :
--   * les tables publiques (products, categories, site_settings) ne contiennent QUE la
--     version en ligne, lisible par tous ;
--   * les modifications en cours vivent dans `drafts`, lisible et modifiable par les
--     seuls administrateurs ; « Publier » copie le brouillon dans la table publique
--     (fonctions publish_*) puis le supprime, en une seule transaction.
-- Toute écriture est réservée aux administrateurs (RLS + is_admin()).

-- ------------------------------------------------------------------
-- Administrateurs
-- ------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table public.admins is 'Comptes ayant accès au tableau de bord /admin. Ajout uniquement en SQL.';
alter table public.admins enable row level security;
create policy "Admins : chacun voit sa propre ligne" on public.admins
  for select to authenticated using ((select auth.uid()) = user_id);
-- Aucune politique d'écriture : on ne devient administrateur que par SQL (tableau de bord Supabase) :
--   insert into public.admins (user_id) select id from auth.users where email = '…';
-- Premier administrateur : le compte du propriétaire de la boutique (attribué le 2026-10-03).

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
comment on function public.is_admin() is 'Vrai si l''utilisateur connecté est administrateur. SECURITY DEFINER : lit admins sans exposer la table.';
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ------------------------------------------------------------------
-- Catalogue publié (lecture publique, écriture admin)
-- ------------------------------------------------------------------
create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position integer not null default 0,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.categories is 'Catégories en ligne (contenu complet dans data : nom, accroche, introduction, FAQ…).';

create table public.brands (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 60),
  created_at timestamptz not null default now()
);
comment on table public.brands is 'Marques (modifiées directement, sans brouillon).';

create table public.products (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category text not null references public.categories (slug) on update cascade on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  brand text not null references public.brands (slug) on update cascade on delete restrict,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  -- Bascule « En stock / Rupture » : appliquée immédiatement, sans brouillon.
  in_stock boolean not null default true,
  position integer not null default 0,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, slug)
);
comment on table public.products is 'Produits en ligne. data = fiche complète (variantes, caractéristiques, FAQ…). in_stock = false force la rupture.';
create index products_category_position on public.products (category, position);

-- Anciennes URL de produits (slug ou catégorie modifiés) : redirection 301 vers la nouvelle.
create table public.product_redirects (
  from_path text primary key,
  to_path text not null,
  created_at timestamptz not null default now()
);

create table public.site_settings (
  id text primary key default 'main' check (id = 'main'),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  published_at timestamptz not null default now()
);
comment on table public.site_settings is 'Configuration publiée (contact, livraison, retours, garantie, hero, FAQ du site). Une seule ligne.';

-- ------------------------------------------------------------------
-- Brouillons (admin uniquement)
-- ------------------------------------------------------------------
create table public.drafts (
  entity text not null check (entity in ('product', 'category', 'settings')),
  key text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  primary key (entity, key)
);
comment on table public.drafts is 'Modifications enregistrées mais pas encore publiées. Invisibles du public.';

-- ------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_redirects enable row level security;
alter table public.site_settings enable row level security;
alter table public.drafts enable row level security;

create policy "Catégories : lecture publique" on public.categories for select to anon, authenticated using (true);
create policy "Catégories : écriture admin" on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Marques : lecture publique" on public.brands for select to anon, authenticated using (true);
create policy "Marques : écriture admin" on public.brands for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Produits : lecture publique" on public.products for select to anon, authenticated using (true);
create policy "Produits : écriture admin" on public.products for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Redirections : lecture publique" on public.product_redirects for select to anon, authenticated using (true);
create policy "Redirections : écriture admin" on public.product_redirects for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Configuration : lecture publique" on public.site_settings for select to anon, authenticated using (true);
create policy "Configuration : écriture admin" on public.site_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Brouillons : admin uniquement" on public.drafts for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Les administrateurs voient les comptes clients (tableau de bord « je vois tout »).
create policy "Profils : lecture admin" on public.profiles for select to authenticated using ((select public.is_admin()));
create policy "Adresses : lecture admin" on public.addresses for select to authenticated using ((select public.is_admin()));
create policy "Paniers : lecture admin" on public.carts for select to authenticated using ((select public.is_admin()));

create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger drafts_set_updated_at before update on public.drafts
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- Publication (SECURITY INVOKER : la RLS s'applique, donc admin uniquement)
-- ------------------------------------------------------------------
create function public.publish_product(p_id text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  d jsonb;
  old_path text;
  new_path text;
  next_pos integer;
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs' using errcode = '42501';
  end if;
  select data into d from public.drafts where entity = 'product' and key = p_id for update;
  if d is null then
    raise exception 'Aucun brouillon à publier pour %', p_id using errcode = 'P0002';
  end if;

  select '/' || category || '/' || slug into old_path from public.products where id = p_id;
  new_path := '/' || (d ->> 'category') || '/' || (d ->> 'slug');
  select coalesce(max(position), -1) + 1 into next_pos from public.products;

  insert into public.products (id, category, slug, brand, data, position, published_at)
  values (p_id, d ->> 'category', d ->> 'slug', d ->> 'brand', d, next_pos, now())
  on conflict (id) do update
    set category = excluded.category, slug = excluded.slug, brand = excluded.brand,
        data = excluded.data, published_at = now();

  if old_path is not null and old_path <> new_path then
    -- Les anciennes redirections suivent aussi (pas de chaîne de redirections).
    update public.product_redirects set to_path = new_path where to_path = old_path;
    insert into public.product_redirects (from_path, to_path) values (old_path, new_path)
      on conflict (from_path) do update set to_path = excluded.to_path;
  end if;
  delete from public.product_redirects where from_path = new_path;

  delete from public.drafts where entity = 'product' and key = p_id;
  return new_path;
end;
$$;

create function public.publish_category(p_slug text)
returns void
language plpgsql
set search_path = ''
as $$
declare d jsonb;
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs' using errcode = '42501';
  end if;
  select data into d from public.drafts where entity = 'category' and key = p_slug for update;
  if d is null then
    raise exception 'Aucun brouillon à publier pour %', p_slug using errcode = 'P0002';
  end if;
  update public.categories set data = d, published_at = now() where slug = p_slug;
  if not found then
    raise exception 'Catégorie inconnue : %', p_slug using errcode = 'P0002';
  end if;
  delete from public.drafts where entity = 'category' and key = p_slug;
end;
$$;

create function public.publish_settings()
returns void
language plpgsql
set search_path = ''
as $$
declare d jsonb;
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs' using errcode = '42501';
  end if;
  select data into d from public.drafts where entity = 'settings' and key = 'main' for update;
  if d is null then
    raise exception 'Aucun brouillon de configuration à publier' using errcode = 'P0002';
  end if;
  insert into public.site_settings (id, data, published_at) values ('main', d, now())
    on conflict (id) do update set data = excluded.data, published_at = now();
  delete from public.drafts where entity = 'settings' and key = 'main';
end;
$$;

revoke execute on function public.publish_product(text) from public, anon;
revoke execute on function public.publish_category(text) from public, anon;
revoke execute on function public.publish_settings() from public, anon;
grant execute on function public.publish_product(text) to authenticated;
grant execute on function public.publish_category(text) to authenticated;
grant execute on function public.publish_settings() to authenticated;

-- Liste des clients avec leur e-mail (auth.users n'est pas lisible autrement).
create function public.admin_list_customers()
returns table (id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz, first_name text, last_name text, phone text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text, u.created_at, u.last_sign_in_at, p.first_name, p.last_name, p.phone
    from auth.users u left join public.profiles p on p.id = u.id
    order by u.created_at desc;
end;
$$;
comment on function public.admin_list_customers() is 'Clients et e-mails pour le tableau de bord. SECURITY DEFINER, refuse tout non-admin.';
revoke execute on function public.admin_list_customers() from public, anon;
grant execute on function public.admin_list_customers() to authenticated;

-- ------------------------------------------------------------------
-- Photos produit : bucket public (lecture par URL), écriture admin
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produits', 'produits', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "Photos produit : ajout admin" on storage.objects for insert to authenticated
  with check (bucket_id = 'produits' and (select public.is_admin()));
create policy "Photos produit : modification admin" on storage.objects for update to authenticated
  using (bucket_id = 'produits' and (select public.is_admin()));
create policy "Photos produit : suppression admin" on storage.objects for delete to authenticated
  using (bucket_id = 'produits' and (select public.is_admin()));
