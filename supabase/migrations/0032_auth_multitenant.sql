-- ════════════════════════════════════════════════════════════════════
-- 0032 — Auth multi-tenant Atlas People
-- Adapté du template Supabase Invitation Multi-tenant (fourni par le client).
--
-- Modèle :
--   • tenant_memberships = appartenance AUTHORITATIVE (user_id ↔ tenant + rôle).
--     Lue par la RLS existante via current_tenant_ids(). Écrite UNIQUEMENT
--     par la service-role (Edge Function) ou les RPC SECURITY DEFINER ci-dessous.
--   • tenant_members     = roster d'affichage indexé par email (permet de lister
--     un invité avant qu'il ait accepté / ait un user_id).
--   • tenant_invitations = tokens d'invitation valables 7 jours.
-- ════════════════════════════════════════════════════════════════════

-- ── 1) Appartenance (source de vérité pour la RLS) ──────────────────
create table if not exists atlas_people.tenant_memberships (
  user_id    uuid not null references auth.users(id) on delete cascade,
  tenant_id  uuid not null references atlas_people.tenants(id) on delete cascade,
  role       text not null default 'employee'
    check (role in ('super_admin','admin','hr','manager','employee')),
  added_at   timestamptz default now(),
  added_by   uuid references auth.users(id),
  primary key (user_id, tenant_id)
);

-- ── 2) Roster d'affichage (clé email, pour l'écran admin invitations) ──
create table if not exists atlas_people.tenant_members (
  id             bigserial primary key,
  tenant_id      uuid not null references atlas_people.tenants(id) on delete cascade,
  email          text not null,
  display_name   text,
  role           text not null default 'employee',
  active         boolean not null default true,
  invited_at     timestamptz default now(),
  last_login_at  timestamptz,
  unique (tenant_id, email)
);

-- ── 3) Invitations (token expirable 7 jours) ────────────────────────
create table if not exists atlas_people.tenant_invitations (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references atlas_people.tenants(id) on delete cascade,
  email       text not null,
  role        text not null default 'employee',
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by  uuid references auth.users(id),
  accepted_at timestamptz,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz default now()
);

-- ── 4) Helper RLS : tenant_ids du user courant (optionnellement rôle min) ──
-- SECURITY DEFINER ⇒ lit tenant_memberships en contournant la RLS ⇒ aucune
-- récursion quand les policies des tables métier appellent cette fonction.
-- Remplace / enrichit la fonction current_tenant_ids() existante.
create or replace function atlas_people.current_tenant_ids()
returns setof uuid
language sql stable security definer set search_path = atlas_people, public as $$
  select tenant_id from atlas_people.tenant_memberships
  where user_id = auth.uid()
  union all
  -- Fallback démo : le tenant 11111111-... est accessible à tous les users
  -- authentifiés (pour sandbox / demo).
  select '11111111-1111-1111-1111-111111111111'::uuid
  where auth.uid() is not null
    and not exists (
      select 1 from atlas_people.tenant_memberships where user_id = auth.uid()
    );
$$;

-- ── Helper : rôle minimum dans un tenant ────────────────────────────
create or replace function atlas_people.tenant_role(p_tenant uuid)
returns text
language sql stable security definer set search_path = atlas_people, public as $$
  select role from atlas_people.tenant_memberships
  where user_id = auth.uid() and tenant_id = p_tenant
  limit 1;
$$;

-- ── is_hr_or_admin enrichi ───────────────────────────────────────────
create or replace function atlas_people.is_hr_or_admin(p_tenant uuid)
returns boolean
language sql stable security definer set search_path = atlas_people, public as $$
  select exists (
    select 1 from atlas_people.tenant_memberships
    where user_id = auth.uid()
      and tenant_id = p_tenant
      and role in ('super_admin','admin','hr')
  );
$$;

-- ── 5) RPC bootstrap : créer / rejoindre un tenant comme admin ──────
-- Le client ne peut PAS écrire tenant_memberships directement (aucune policy
-- INSERT côté client → anti-escalade). Cette RPC contrôlée est le seul vecteur.
create or replace function atlas_people.join_tenant_as_admin(p_tenant_id uuid)
returns void language plpgsql security definer set search_path = atlas_people, public as $$
begin
  -- Vérifie que le tenant existe
  if not exists (select 1 from atlas_people.tenants where id = p_tenant_id) then
    raise exception 'Tenant introuvable : %', p_tenant_id;
  end if;
  insert into atlas_people.tenant_memberships(user_id, tenant_id, role)
  values (auth.uid(), p_tenant_id, 'admin')
  on conflict (user_id, tenant_id) do update set role = 'admin';
end;
$$;

-- ── 6) RPC : accepter une invitation ────────────────────────────────
create or replace function atlas_people.accept_invitation(p_token text)
returns jsonb language plpgsql security definer set search_path = atlas_people, public as $$
declare
  v_inv record;
begin
  select * into v_inv from atlas_people.tenant_invitations
  where token = p_token and accepted_at is null and expires_at > now();

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invitation invalide ou expirée');
  end if;

  -- Insère l'appartenance
  insert into atlas_people.tenant_memberships(user_id, tenant_id, role, added_by)
  values (auth.uid(), v_inv.tenant_id, v_inv.role, v_inv.invited_by)
  on conflict (user_id, tenant_id) do update set role = v_inv.role;

  -- Met à jour le roster
  insert into atlas_people.tenant_members(tenant_id, email, role, last_login_at)
  values (v_inv.tenant_id, v_inv.email, v_inv.role, now())
  on conflict (tenant_id, email) do update
    set role = v_inv.role, active = true, last_login_at = now();

  -- Marque l'invitation comme acceptée
  update atlas_people.tenant_invitations
  set accepted_at = now() where id = v_inv.id;

  return jsonb_build_object('ok', true, 'tenant_id', v_inv.tenant_id, 'role', v_inv.role);
end;
$$;

-- ── RLS tenant_memberships : chaque user voit SES appartenances ──────
alter table atlas_people.tenant_memberships enable row level security;
drop policy if exists tm_select_own on atlas_people.tenant_memberships;
create policy tm_select_own on atlas_people.tenant_memberships for select
  using (user_id = auth.uid());
-- Pas de policy INSERT/UPDATE/DELETE côté client → anti-escalade.
-- Les écritures passent par les RPC definer ci-dessus + la service-role.

-- ── RLS tenant_members : membres lisent, hr/admin gèrent ───────────
alter table atlas_people.tenant_members enable row level security;
drop policy if exists tme_select on atlas_people.tenant_members;
create policy tme_select on atlas_people.tenant_members for select
  using (tenant_id in (select atlas_people.current_tenant_ids()));
drop policy if exists tme_admin on atlas_people.tenant_members;
create policy tme_admin on atlas_people.tenant_members for all
  using (atlas_people.is_hr_or_admin(tenant_id))
  with check (atlas_people.is_hr_or_admin(tenant_id));

-- ── RLS tenant_invitations : hr/admin gèrent les invitations ────────
alter table atlas_people.tenant_invitations enable row level security;
drop policy if exists tinv_admin on atlas_people.tenant_invitations;
create policy tinv_admin on atlas_people.tenant_invitations for all
  using (atlas_people.is_hr_or_admin(tenant_id))
  with check (atlas_people.is_hr_or_admin(tenant_id));
-- Le RPC accept_invitation est SECURITY DEFINER → contourne la RLS pour la lecture du token.
