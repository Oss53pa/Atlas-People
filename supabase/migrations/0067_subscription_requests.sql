-- =====================================================================
-- 0067 — Demandes de souscription (landing publique)
--
-- POURQUOI.
-- Les sous-landings produit (/produits/<slug>) proposent deux issues :
-- se connecter si l'on a déjà un compte actif, souscrire sinon. La
-- souscription n'avait aucune destination : le formulaire ouvrait la
-- messagerie de l'utilisateur. Une demande commerciale perdue dans une
-- boîte mail n'est ni traçable ni exploitable — elle est ici persistée.
--
-- LA TABLE N'EST PAS TENANT-SCOPÉE, ET C'EST VOLONTAIRE.
-- Le demandeur n'a pas encore de workspace : c'est justement l'objet de
-- sa demande. `current_tenant_ids()` n'a donc rien à filtrer. La table
-- vit hors du modèle multi-tenant, comme une file d'attente commerciale.
--
-- ÉCRITURE PAR LA SEULE EDGE FUNCTION `subscribe`.
-- RLS activée SANS AUCUNE POLICY : ni anon ni authenticated ne peuvent
-- lire ou écrire. L'insertion passe par la fonction edge (service role,
-- qui contourne la RLS) après validation du contenu et limitation de
-- débit. Exposer un `insert` direct à anon offrirait à n'importe qui un
-- robinet d'écriture non filtré dans la base.
--
-- DONNÉES PERSONNELLES. On stocke le strict nécessaire au rappel
-- commercial (nom, email professionnel, entreprise). L'adresse IP n'est
-- jamais stockée en clair : seul un condensat salé sert à la limitation
-- de débit, et il est purgeable indépendamment du reste.
-- =====================================================================

-- ── Statut de traitement ─────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'subscription_status' and n.nspname = 'atlas_people'
  ) then
    create type atlas_people.subscription_status as enum (
      'nouvelle',    -- reçue, pas encore traitée
      'contactee',   -- un commercial a repris contact
      'convertie',   -- workspace provisionné
      'rejetee'      -- hors cible, doublon ou spam
    );
  end if;
end $$;

-- ── Table ────────────────────────────────────────────────────────────
create table if not exists atlas_people.subscription_requests (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- Produit visé (slug public de la sous-landing) et mode de workspace
  -- correspondant, figés à la demande : le catalogue peut évoluer, la
  -- demande doit rester lisible telle qu'elle a été formulée.
  product_slug  text not null check (product_slug in ('core', 'conseil', 'payroll', '360', 'placement')),
  tenant_type   text not null check (tenant_type in ('entreprise', 'cabinet_complet', 'cabinet_paie', 'cabinet_mixte', 'cabinet_agence')),

  full_name     text not null check (length(btrim(full_name)) between 2 and 120),
  email         text not null check (length(email) between 5 and 190 and position('@' in email) > 1),
  company       text not null check (length(btrim(company)) between 2 and 160),
  headcount     text     check (headcount is null or length(headcount) <= 40),
  country       text     check (country   is null or length(country)   <= 80),
  message       text     check (message   is null or length(message)   <= 4000),

  status        atlas_people.subscription_status not null default 'nouvelle',
  handled_at    timestamptz,
  handled_note  text,

  -- Traçabilité minimale, sans donnée identifiante en clair.
  source        text not null default 'landing' check (length(source) <= 40),
  ip_hash       text check (ip_hash is null or length(ip_hash) = 64)
);

comment on table atlas_people.subscription_requests is
  'Demandes de souscription émises depuis la landing publique. Hors modèle multi-tenant : le demandeur n''a pas encore de workspace. Écriture réservée à l''edge function subscribe (service role).';
comment on column atlas_people.subscription_requests.ip_hash is
  'SHA-256 salé de l''adresse IP — sert uniquement à la limitation de débit, jamais à identifier une personne.';

create index if not exists idx_subscription_requests_created
  on atlas_people.subscription_requests (created_at desc);
create index if not exists idx_subscription_requests_status
  on atlas_people.subscription_requests (status, created_at desc);
-- Limitation de débit : compte des demandes récentes d'un même condensat.
create index if not exists idx_subscription_requests_ip_recent
  on atlas_people.subscription_requests (ip_hash, created_at desc);

-- ── Verrouillage ─────────────────────────────────────────────────────
-- RLS activée et aucune policy : le rôle service (edge function) reste
-- seul à pouvoir écrire, et personne ne peut lire depuis le client.
alter table atlas_people.subscription_requests enable row level security;

revoke all on atlas_people.subscription_requests from anon;
revoke all on atlas_people.subscription_requests from authenticated;
