-- Commandes, paiement (Moov Money, Mixx by Yas, paiement à la livraison), preuves de
-- paiement et mesure d'audience anonyme (statistiques de l'administration).
-- Appliquée sur le projet Supabase « electromarket » le 2026-10-04.
--
-- Principes :
--   * les montants sont TOUJOURS recalculés ici, à partir du catalogue en ligne
--     (le navigateur n'envoie que SKU + quantités) ;
--   * le stock est réservé à la commande (décrémenté dans la même transaction) et
--     rendu si la commande est annulée ;
--   * un client ne lit que ses commandes ; il ne les écrit qu'au travers des fonctions
--     ci-dessous (aucune politique d'écriture directe) ;
--   * l'historique des commandes survit à la suppression d'un compte (user_id → null,
--     coordonnées figées dans la commande).

-- ------------------------------------------------------------------
-- Commandes
-- ------------------------------------------------------------------
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('ET-' || nextval('public.order_number_seq')),
  user_id uuid references auth.users (id) on delete set null,
  status text not null check (status in ('awaiting_payment', 'payment_review', 'to_ship', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null check (payment_method in ('moov', 'mixx', 'cod')),
  -- Moyen de paiement tel qu'affiché au client au moment de la commande (numéro compris).
  payment_snapshot jsonb not null default '{}'::jsonb,
  subtotal integer not null check (subtotal >= 0),
  shipping integer not null check (shipping >= 0),
  total integer not null check (total >= 0),
  customer jsonb not null,
  address jsonb not null,
  note text not null default '' check (char_length(note) <= 500),
  -- Message de la boutique au client (ex. motif du refus d'une preuve).
  customer_message text not null default '' check (char_length(customer_message) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.orders is 'Commandes. Montants recalculés par place_order ; stock réservé à la commande, rendu à l''annulation.';
create index orders_user_created on public.orders (user_id, created_at desc);
create index orders_status_created on public.orders (status, created_at desc);
create index orders_created on public.orders (created_at);

create table public.order_items (
  order_id uuid not null references public.orders (id) on delete cascade,
  position integer not null,
  product_id text not null,
  sku text not null,
  name text not null,
  variant_label text not null,
  unit_price integer not null check (unit_price >= 0),
  qty integer not null check (qty between 1 and 10),
  primary key (order_id, position)
);
create index order_items_product on public.order_items (product_id);

create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  file_path text not null,
  reference text not null check (char_length(reference) between 3 and 60),
  amount integer not null check (amount > 0),
  paid_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index payment_proofs_order on public.payment_proofs (order_id, created_at desc);

-- Historique affiché au client et à l'administrateur.
create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  note text not null default '',
  by_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create index order_events_order on public.order_events (order_id, created_at);

create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.order_events enable row level security;

create policy "Commandes : le client voit les siennes, l'admin toutes" on public.orders for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));
create policy "Lignes : selon la commande" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))));
create policy "Preuves : selon la commande" on public.payment_proofs for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))));
create policy "Historique : selon la commande" on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))));
-- Aucune politique d'écriture : uniquement via les fonctions ci-dessous.

-- ------------------------------------------------------------------
-- Moyens de paiement publiés (configuration) ; repli sûr si non configurés.
-- ------------------------------------------------------------------
create function public.payment_method_config(p_method text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select m
  from public.site_settings s,
       jsonb_array_elements(coalesce(s.data -> 'payment' -> 'methods', '[{"id":"cod","enabled":true,"label":"Paiement à la livraison"}]'::jsonb)) m
  where s.id = 'main' and m ->> 'id' = p_method and (m ->> 'enabled')::boolean
  limit 1;
$$;

-- Rend au catalogue le stock réservé par une commande (annulation). Usage interne.
create function public.restock_order(p_order uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  it record;
  pid text;
  idx integer;
begin
  for it in select sku, qty from public.order_items where order_id = p_order loop
    select p.id, (v.ord - 1)::integer into pid, idx
    from public.products p, jsonb_array_elements(p.data -> 'variants') with ordinality v(val, ord)
    where v.val ->> 'sku' = it.sku
    for update of p;
    if pid is not null then
      update public.products
        set data = jsonb_set(data, array['variants', idx::text, 'stock'], to_jsonb(((data -> 'variants' -> idx ->> 'stock')::integer) + it.qty))
        where id = pid;
    end if;
    pid := null;
  end loop;
end;
$$;
revoke execute on function public.restock_order(uuid) from public, anon, authenticated;

-- ------------------------------------------------------------------
-- Passer commande (client connecté)
-- p_items : [{ "sku": "…", "qty": 1 }, …] ; p_expected_total : total affiché au client
-- (si le prix a changé entre-temps, la commande est refusée pour qu'il le revoie).
-- ------------------------------------------------------------------
create function public.place_order(p_items jsonb, p_address_id uuid, p_method text, p_note text, p_expected_total integer)
returns table (id uuid, number text, total integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  method jsonb;
  addr public.addresses;
  prof public.profiles;
  policies jsonb;
  item jsonb;
  pos integer := 0;
  v_sku text;
  v_qty integer;
  prod record;
  v_stock integer;
  v_price integer;
  v_subtotal integer := 0;
  v_count integer := 0;
  v_shipping integer;
  lines jsonb := '[]'::jsonb;
  o public.orders;
begin
  if uid is null then
    raise exception 'Connectez-vous pour commander.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'Panier vide ou invalide.' using errcode = '22023';
  end if;
  method := public.payment_method_config(p_method);
  if method is null then
    raise exception 'Ce moyen de paiement n''est pas disponible.' using errcode = '22023';
  end if;
  if p_method in ('moov', 'mixx') and coalesce(method ->> 'number', '') = '' then
    raise exception 'Ce moyen de paiement n''est pas disponible.' using errcode = '22023';
  end if;
  select * into addr from public.addresses a where a.id = p_address_id and a.user_id = uid;
  if addr.id is null then
    raise exception 'Choisissez une adresse de livraison.' using errcode = '22023';
  end if;
  select * into prof from public.profiles pr where pr.id = uid;

  -- Réservation du stock et prix du catalogue en ligne, ligne par ligne (verrou sur le produit).
  for item in select value from jsonb_array_elements(p_items) loop
    v_sku := item ->> 'sku';
    v_qty := (item ->> 'qty')::integer;
    if v_sku is null or v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'Quantité invalide.' using errcode = '22023';
    end if;
    select p.id as pid, p.in_stock, p.data ->> 'name' as name, (v.ord - 1)::integer as idx, v.val
      into prod
      from public.products p, jsonb_array_elements(p.data -> 'variants') with ordinality v(val, ord)
      where v.val ->> 'sku' = v_sku
      for update of p;
    if prod.pid is null then
      raise exception 'Un article de votre panier n''est plus vendu.' using errcode = 'P0002';
    end if;
    -- Relire la variante après le verrou (une autre commande a pu la modifier).
    select (p.data -> 'variants' -> prod.idx ->> 'stock')::integer, (p.data -> 'variants' -> prod.idx ->> 'price')::integer
      into v_stock, v_price
      from public.products p where p.id = prod.pid;
    if not prod.in_stock or v_stock < v_qty then
      raise exception 'Stock insuffisant pour « % » (% disponible).', prod.name, greatest(case when prod.in_stock then v_stock else 0 end, 0) using errcode = 'P0001';
    end if;
    update public.products
      set data = jsonb_set(data, array['variants', prod.idx::text, 'stock'], to_jsonb(v_stock - v_qty))
      where products.id = prod.pid;
    v_subtotal := v_subtotal + v_price * v_qty;
    v_count := v_count + v_qty;
    lines := lines || jsonb_build_object('position', pos, 'product_id', prod.pid, 'sku', v_sku, 'name', prod.name,
      'variant_label', coalesce(prod.val ->> 'label', ''), 'unit_price', v_price, 'qty', v_qty);
    pos := pos + 1;
    prod := null;
  end loop;

  -- Livraison : mêmes règles que priceCart (lib/cart/pricing.ts).
  select coalesce(s.data -> 'policies', '{}'::jsonb) into policies from public.site_settings s where s.id = 'main';
  v_shipping := case
    when v_count = 0 or v_subtotal >= coalesce((policies ->> 'freeShippingThreshold')::integer, 50000) then 0
    else coalesce((policies ->> 'shippingCost')::integer, 2000)
  end;
  if p_expected_total is not null and p_expected_total <> v_subtotal + v_shipping then
    raise exception 'Les prix ont changé depuis l''affichage de votre panier : vérifiez le nouveau total.' using errcode = 'P0001';
  end if;

  insert into public.orders (user_id, status, payment_method, payment_snapshot, subtotal, shipping, total, customer, address, note)
  values (
    uid,
    case when p_method = 'cod' then 'to_ship' else 'awaiting_payment' end,
    p_method,
    method,
    v_subtotal,
    v_shipping,
    v_subtotal + v_shipping,
    jsonb_build_object(
      'first_name', coalesce(prof.first_name, ''),
      'last_name', coalesce(prof.last_name, ''),
      'email', (select u.email from auth.users u where u.id = uid),
      'phone', addr.phone
    ),
    jsonb_build_object('label', addr.label, 'district', addr.district, 'city', addr.city, 'landmark', addr.landmark, 'phone', addr.phone),
    left(coalesce(trim(p_note), ''), 500)
  )
  returning * into o;

  insert into public.order_items (order_id, position, product_id, sku, name, variant_label, unit_price, qty)
  select o.id, (l ->> 'position')::integer, l ->> 'product_id', l ->> 'sku', l ->> 'name', l ->> 'variant_label', (l ->> 'unit_price')::integer, (l ->> 'qty')::integer
  from jsonb_array_elements(lines) l;

  insert into public.order_events (order_id, status, note) values (o.id, o.status, 'Commande passée');

  -- Le panier du compte est vidé (l'appareil l'est par l'action serveur).
  update public.carts set lines = '[]'::jsonb where user_id = uid;

  return query select o.id, o.number, o.total;
end;
$$;
revoke execute on function public.place_order(jsonb, uuid, text, text, integer) from public, anon;
grant execute on function public.place_order(jsonb, uuid, text, text, integer) to authenticated;

-- ------------------------------------------------------------------
-- Preuve de paiement (client) : fichier déjà déposé dans le bucket privé « preuves »,
-- sous le dossier du client.
-- ------------------------------------------------------------------
create function public.submit_payment_proof(p_order uuid, p_path text, p_reference text, p_amount integer, p_paid_at timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  o public.orders;
begin
  select * into o from public.orders where orders.id = p_order and user_id = uid for update;
  if o.id is null then
    raise exception 'Commande introuvable.' using errcode = 'P0002';
  end if;
  if o.status <> 'awaiting_payment' then
    raise exception 'Cette commande n''attend pas de preuve de paiement.' using errcode = 'P0001';
  end if;
  if p_path is null or split_part(p_path, '/', 1) <> uid::text then
    raise exception 'Fichier invalide.' using errcode = '22023';
  end if;
  insert into public.payment_proofs (order_id, file_path, reference, amount, paid_at)
  values (o.id, p_path, trim(p_reference), p_amount, p_paid_at);
  update public.orders set status = 'payment_review', customer_message = '' where orders.id = o.id;
  insert into public.order_events (order_id, status, note) values (o.id, 'payment_review', 'Preuve de paiement envoyée');
end;
$$;
revoke execute on function public.submit_payment_proof(uuid, text, text, integer, timestamptz) from public, anon;
grant execute on function public.submit_payment_proof(uuid, text, text, integer, timestamptz) to authenticated;

-- Annulation par le client, tant que rien n'est payé ni expédié.
create function public.cancel_my_order(p_order uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare o public.orders;
begin
  select * into o from public.orders where orders.id = p_order and user_id = auth.uid() for update;
  if o.id is null then
    raise exception 'Commande introuvable.' using errcode = 'P0002';
  end if;
  if o.status not in ('awaiting_payment', 'to_ship') or (o.status = 'to_ship' and o.payment_method <> 'cod') then
    raise exception 'Cette commande ne peut plus être annulée en ligne : contactez-nous.' using errcode = 'P0001';
  end if;
  perform public.restock_order(o.id);
  update public.orders set status = 'cancelled' where orders.id = o.id;
  insert into public.order_events (order_id, status, note) values (o.id, 'cancelled', 'Annulée par le client');
end;
$$;
revoke execute on function public.cancel_my_order(uuid) from public, anon;
grant execute on function public.cancel_my_order(uuid) to authenticated;

-- ------------------------------------------------------------------
-- Suivi par l'administrateur : transitions autorisées uniquement.
--   awaiting_payment → payment_review (preuve) → to_ship (paiement vérifié)
--   payment_review → awaiting_payment (preuve refusée, avec message au client)
--   to_ship → shipped → delivered ; tout statut non livré → cancelled (stock rendu)
-- ------------------------------------------------------------------
create function public.admin_update_order(p_order uuid, p_status text, p_message text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders;
  allowed boolean;
  msg text := left(coalesce(trim(p_message), ''), 500);
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs' using errcode = '42501';
  end if;
  select * into o from public.orders where orders.id = p_order for update;
  if o.id is null then
    raise exception 'Commande introuvable.' using errcode = 'P0002';
  end if;
  allowed := case
    when p_status = 'cancelled' then o.status not in ('delivered', 'cancelled')
    when p_status = 'to_ship' then o.status in ('payment_review', 'awaiting_payment')
    when p_status = 'awaiting_payment' then o.status = 'payment_review'
    when p_status = 'shipped' then o.status = 'to_ship'
    when p_status = 'delivered' then o.status in ('shipped', 'to_ship')
    else false
  end;
  if not allowed then
    raise exception 'Changement de statut impossible depuis « % ».', o.status using errcode = 'P0001';
  end if;
  if p_status = 'awaiting_payment' and msg = '' then
    raise exception 'Indiquez au client pourquoi la preuve est refusée.' using errcode = '22023';
  end if;

  if p_status = 'cancelled' then
    perform public.restock_order(o.id);
  end if;
  if p_status = 'to_ship' and o.payment_method <> 'cod' then
    update public.payment_proofs set status = 'accepted', reviewed_at = now() where order_id = o.id and status = 'pending';
  end if;
  if p_status = 'awaiting_payment' then
    update public.payment_proofs set status = 'rejected', reviewed_at = now() where order_id = o.id and status = 'pending';
  end if;

  update public.orders
    set status = p_status,
        customer_message = case when p_status in ('awaiting_payment', 'cancelled') then msg else '' end
    where orders.id = o.id;
  insert into public.order_events (order_id, status, note, by_admin) values (o.id, p_status, msg, true);
end;
$$;
revoke execute on function public.admin_update_order(uuid, text, text) from public, anon;
grant execute on function public.admin_update_order(uuid, text, text) to authenticated;

-- ------------------------------------------------------------------
-- Stock et brouillons : une commande peut baisser le stock pendant qu'un brouillon de
-- la fiche est ouvert. Le brouillon garde le stock vu à l'ouverture (stockBase) :
-- à la publication, seul l'écart saisi par l'administrateur est appliqué au stock réel.
-- ------------------------------------------------------------------
create or replace function public.publish_product(p_id text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  d jsonb;
  base jsonb;
  live jsonb;
  old_path text;
  new_path text;
  next_pos integer;
  merged jsonb := '[]'::jsonb;
  v jsonb;
  live_stock integer;
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs' using errcode = '42501';
  end if;
  select data into d from public.drafts where entity = 'product' and key = p_id for update;
  if d is null then
    raise exception 'Aucun brouillon à publier pour %', p_id using errcode = 'P0002';
  end if;

  select '/' || category || '/' || slug, data -> 'variants' into old_path, live from public.products where id = p_id for update;
  base := coalesce(d -> 'stockBase', '{}'::jsonb);
  for v in select value from jsonb_array_elements(d -> 'variants') loop
    select (lv ->> 'stock')::integer into live_stock from jsonb_array_elements(coalesce(live, '[]'::jsonb)) lv where lv ->> 'sku' = v ->> 'sku';
    if live_stock is not null and base ? (v ->> 'sku') then
      v := jsonb_set(v, '{stock}', to_jsonb(greatest(0, (v ->> 'stock')::integer - (base ->> (v ->> 'sku'))::integer + live_stock)));
    end if;
    merged := merged || jsonb_build_array(v);
    live_stock := null;
  end loop;
  d := jsonb_set(d - 'stockBase', '{variants}', merged);

  new_path := '/' || (d ->> 'category') || '/' || (d ->> 'slug');
  select coalesce(max(position), -1) + 1 into next_pos from public.products;

  insert into public.products (id, category, slug, brand, data, position, published_at)
  values (p_id, d ->> 'category', d ->> 'slug', d ->> 'brand', d, next_pos, now())
  on conflict (id) do update
    set category = excluded.category, slug = excluded.slug, brand = excluded.brand,
        data = excluded.data, published_at = now();

  if old_path is not null and old_path <> new_path then
    update public.product_redirects set to_path = new_path where to_path = old_path;
    insert into public.product_redirects (from_path, to_path) values (old_path, new_path)
      on conflict (from_path) do update set to_path = excluded.to_path;
  end if;
  delete from public.product_redirects where from_path = new_path;

  delete from public.drafts where entity = 'product' and key = p_id;
  return new_path;
end;
$$;

-- ------------------------------------------------------------------
-- Preuves de paiement : bucket PRIVÉ (lecture : le client propriétaire et l'admin).
-- Chemin : <user_id>/<order_id>/<horodatage>-<aléa>.<ext>
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('preuves', 'preuves', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "Preuves : dépôt dans son dossier" on storage.objects for insert to authenticated
  with check (bucket_id = 'preuves' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Preuves : lecture propriétaire ou admin" on storage.objects for select to authenticated
  using (bucket_id = 'preuves' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

-- ------------------------------------------------------------------
-- Mesure d'audience anonyme (sans cookie) : un visiteur = empreinte quotidienne
-- non réversible (calculée côté serveur avec un sel secret, renouvelée chaque jour).
-- Aucune donnée personnelle (ni IP, ni compte, ni e-mail).
-- ------------------------------------------------------------------
create table public.analytics_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  type text not null check (type in ('pageview', 'product_view', 'add_to_cart', 'search', 'order')),
  visitor text not null check (visitor ~ '^[0-9a-f]{16}$'),
  path text not null default '' check (char_length(path) <= 200),
  product_id text check (char_length(product_id) <= 80),
  query text check (char_length(query) <= 80),
  results integer check (results >= 0),
  source text not null default 'Direct' check (char_length(source) <= 40),
  device text not null default 'desktop' check (device in ('mobile', 'tablet', 'desktop')),
  value integer check (value >= 0)
);
comment on table public.analytics_events is 'Événements d''audience anonymes (statistiques /admin). Écriture : route /api/evenement. Lecture : admin.';
create index analytics_events_at on public.analytics_events (at);
create index analytics_events_type_at on public.analytics_events (type, at);

alter table public.analytics_events enable row level security;
create policy "Audience : enregistrement anonyme" on public.analytics_events for insert to anon, authenticated
  with check (at > now() - interval '5 minutes' and at < now() + interval '5 minutes');
create policy "Audience : lecture admin" on public.analytics_events for select to authenticated
  using ((select public.is_admin()));

-- ------------------------------------------------------------------
-- Statistiques du tableau de bord (admin) : tout est calculé ici, en une requête.
-- Fuseau : Lomé (UTC+0).
-- ------------------------------------------------------------------
create function public.admin_analytics(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  prev_from timestamptz := p_from - (p_to - p_from);
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs' using errcode = '42501';
  end if;

  with ev as (
    select * from public.analytics_events where at >= p_from and at < p_to
  ),
  ev_prev as (
    select * from public.analytics_events where at >= prev_from and at < p_from
  ),
  ord as (
    select * from public.orders where created_at >= p_from and created_at < p_to
  ),
  ord_prev as (
    select * from public.orders where created_at >= prev_from and created_at < p_from
  ),
  paid as (
    select * from ord where status in ('to_ship', 'shipped', 'delivered') or (payment_method = 'cod' and status <> 'cancelled')
  ),
  days as (
    select d::date as day from generate_series(date_trunc('day', p_from), date_trunc('day', p_to - interval '1 second'), interval '1 day') d
  ),
  daily as (
    select
      days.day,
      (select count(distinct visitor) from ev where ev.type = 'pageview' and ev.at::date = days.day) as visitors,
      (select count(*) from ev where ev.type = 'pageview' and ev.at::date = days.day) as pageviews,
      (select count(*) from ord where ord.created_at::date = days.day and ord.status <> 'cancelled') as orders,
      (select coalesce(sum(total), 0) from ord where ord.created_at::date = days.day and ord.status <> 'cancelled') as revenue
    from days
  ),
  funnel as (
    select
      (select count(distinct visitor) from ev where type = 'pageview') as visitors,
      (select count(distinct visitor) from ev where type = 'product_view') as product_viewers,
      (select count(distinct visitor) from ev where type = 'add_to_cart') as adders,
      (select count(distinct visitor) from ev where type = 'pageview' and path = '/commande') as checkouts,
      (select count(*) from ord where status <> 'cancelled') as orders,
      (select count(*) from paid) as paid
  ),
  totals as (
    select
      (select count(*) from (select distinct visitor, at::date from ev where type = 'pageview') x) as visitors,
      (select count(*) from ev where type = 'pageview') as pageviews,
      (select count(*) from ord where status <> 'cancelled') as orders,
      (select coalesce(sum(total), 0) from ord where status <> 'cancelled') as revenue,
      (select count(*) from (select distinct visitor, at::date from ev_prev where type = 'pageview') x) as prev_visitors,
      (select count(*) from ev_prev where type = 'pageview') as prev_pageviews,
      (select count(*) from ord_prev where status <> 'cancelled') as prev_orders,
      (select coalesce(sum(total), 0) from ord_prev where status <> 'cancelled') as prev_revenue
  ),
  views as (
    select product_id, count(distinct visitor) as views from ev where type = 'product_view' and product_id is not null group by product_id
  ),
  adds as (
    select product_id, count(distinct visitor) as adds from ev where type = 'add_to_cart' and product_id is not null group by product_id
  ),
  sold as (
    select i.product_id, sum(i.qty) as sold, sum(i.qty * i.unit_price) as revenue
    from public.order_items i join ord on ord.id = i.order_id and ord.status <> 'cancelled'
    group by i.product_id
  ),
  products as (
    select
      coalesce(v.product_id, a.product_id, s.product_id) as id,
      coalesce(v.views, 0) as views, coalesce(a.adds, 0) as adds,
      coalesce(s.sold, 0) as sold, coalesce(s.revenue, 0) as revenue
    from views v
    full join adds a on a.product_id = v.product_id
    full join sold s on s.product_id = coalesce(v.product_id, a.product_id)
  ),
  products_named as (
    select pr.*, coalesce(p.data ->> 'name', pr.id) as name, '/' || p.category || '/' || p.slug as path
    from products pr left join public.products p on p.id = pr.id
  ),
  -- Une visite = un visiteur sur une journée ; sa provenance est celle de sa première page.
  visits as (
    select distinct on (visitor, at::date) visitor, source, device from ev where type = 'pageview' order by visitor, at::date, at
  ),
  sources as (
    select source, count(*) as visitors from visits group by source order by 2 desc limit 8
  ),
  devices as (
    select device, count(*) as visitors from visits group by device
  ),
  searches as (
    select lower(query) as query, count(*) as count, min(results) as min_results
    from ev where type = 'search' and query is not null and query <> '' group by lower(query) order by 2 desc limit 15
  ),
  methods as (
    select payment_method as method, count(*) as orders, coalesce(sum(total), 0) as revenue
    from ord where status <> 'cancelled' group by payment_method
  ),
  statuses as (
    select status, count(*) as count from public.orders group by status
  ),
  hours as (
    select extract(isodow from at)::integer as dow, extract(hour from at)::integer as hour, count(*) as count
    from ev where type = 'pageview' group by 1, 2
  ),
  pages as (
    select path, count(*) as views, count(distinct visitor) as visitors
    from ev where type = 'pageview' group by path order by 2 desc limit 10
  )
  select jsonb_build_object(
    'daily', (select coalesce(jsonb_agg(daily order by day), '[]'::jsonb) from daily),
    'funnel', (select to_jsonb(funnel) from funnel),
    'totals', (select to_jsonb(totals) from totals),
    'topViewed', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select * from products_named order by views desc, adds desc limit 10) x),
    'topSold', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select * from products_named where sold > 0 order by revenue desc limit 10) x),
    'viewedNotBought', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select * from products_named where views >= 3 and sold = 0 order by views desc limit 10) x),
    'sources', (select coalesce(jsonb_agg(sources), '[]'::jsonb) from sources),
    'devices', (select coalesce(jsonb_agg(devices), '[]'::jsonb) from devices),
    'searches', (select coalesce(jsonb_agg(searches), '[]'::jsonb) from searches),
    'methods', (select coalesce(jsonb_agg(methods), '[]'::jsonb) from methods),
    'statuses', (select coalesce(jsonb_agg(statuses), '[]'::jsonb) from statuses),
    'hours', (select coalesce(jsonb_agg(hours), '[]'::jsonb) from hours),
    'pages', (select coalesce(jsonb_agg(pages), '[]'::jsonb) from pages)
  ) into result;
  return result;
end;
$$;
revoke execute on function public.admin_analytics(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_analytics(timestamptz, timestamptz) to authenticated;
