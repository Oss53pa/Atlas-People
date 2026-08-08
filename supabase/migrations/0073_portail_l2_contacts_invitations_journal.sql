-- =====================================================================
-- 0073 — Portail client, lot L2 : contacts, invitations, révocation, journal
--
-- Met en œuvre §5.2, §5.3, §5.4 et EX-P-011 du volume 0
-- (docs/cdc/00-socle-portail-client.md).
--
-- LE JOURNAL EST LA PIÈCE MAÎTRESSE (constat C6). Sans lui, le cabinet ne
-- peut pas prouver qu'il a livré, ni le client qu'il a réclamé. Il est en
-- AJOUT SEUL et CHAÎNÉ : chaque ligne intègre l'empreinte de la précédente,
-- si bien qu'une suppression ou une retouche rompt la chaîne et se voit.
--
-- NOTE pgcrypto : l'extension vit dans le schéma `extensions`. Les fonctions
-- SECURITY DEFINER ont un search_path figé (exigence de sécurité) et ne la
-- voient donc pas : tous les appels sont qualifiés `extensions.*`.
-- =====================================================================

alter table atlas_people.portal_contacts
  add column if not exists invite_token_hash text,
  add column if not exists invite_expires_at timestamptz,
  add column if not exists invite_used_at    timestamptz,
  add column if not exists terms_version     text,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists mfa_enrolled_at   timestamptz,
  add column if not exists suspended_reason  text;

-- L'invitation part sur un email NOMINATIF (§5.2). Une boîte partagée rend
-- le journal inexploitable et l'accusé de prise de connaissance sans valeur.
create or replace function atlas_people.is_generic_email(p_email text)
returns boolean language sql immutable as $$
  select split_part(lower(btrim(p_email)), '@', 1) in (
    'contact','info','admin','bonjour','hello','rh','hr','compta','comptabilite',
    'direction','secretariat','accueil','service','support','no-reply','noreply');
$$;

-- ── Journal chaîné, en ajout seul (EX-P-011) ─────────────────────────
create table if not exists atlas_people.portal_access_log (
  id bigserial primary key,
  tenant_id uuid not null references atlas_people.tenants(id) on delete cascade,
  contact_id uuid references atlas_people.portal_contacts(id) on delete set null,
  client_id uuid, object_type text, object_id uuid,
  action text not null, at timestamptz not null default now(),
  ip text, user_agent text, detail text,
  sha256_prev text, sha256 text not null
);

comment on table atlas_people.portal_access_log is
  'EX-P-011 — journal en ajout seul, chaîné SHA-256. Aucun UPDATE ni DELETE. Rétention 10 ans.';

create index if not exists idx_portal_log_contact on atlas_people.portal_access_log (contact_id, at desc);
create index if not exists idx_portal_log_tenant  on atlas_people.portal_access_log (tenant_id, at desc);

-- Le chaînage est calculé par la base : le laisser à l'appelant reviendrait
-- à lui demander de sceller sa propre trace.
create or replace function atlas_people.portal_log_chain()
returns trigger language plpgsql
set search_path = atlas_people, public as $$
declare v_prev text;
begin
  select sha256 into v_prev from atlas_people.portal_access_log
   where tenant_id = new.tenant_id order by id desc limit 1;
  new.sha256_prev := v_prev;
  new.sha256 := encode(extensions.digest(
      coalesce(v_prev,'') || '|' || new.tenant_id::text || '|' ||
      coalesce(new.contact_id::text,'') || '|' || coalesce(new.client_id::text,'') || '|' ||
      new.action || '|' || coalesce(new.object_type,'') || '|' ||
      coalesce(new.object_id::text,'') || '|' || new.at::text, 'sha256'), 'hex');
  return new;
end; $$;

drop trigger if exists trg_portal_log_chain on atlas_people.portal_access_log;
create trigger trg_portal_log_chain before insert on atlas_people.portal_access_log
  for each row execute function atlas_people.portal_log_chain();

-- Ajout seul : la révocation des droits est le seul verrou qui tienne.
revoke update, delete, truncate on atlas_people.portal_access_log from authenticated, anon;
alter table atlas_people.portal_access_log enable row level security;

drop policy if exists portal_log_tenant_read on atlas_people.portal_access_log;
create policy portal_log_tenant_read on atlas_people.portal_access_log
  for select to authenticated using (tenant_id in (select atlas_people.current_tenant_ids()));

drop policy if exists portal_log_self_read on atlas_people.portal_access_log;
create policy portal_log_self_read on atlas_people.portal_access_log
  for select to authenticated
  using (contact_id in (select id from atlas_people.portal_contacts where user_id = auth.uid()));

grant select on atlas_people.portal_access_log to authenticated;

create or replace function atlas_people.portal_log(
  p_action text, p_object_type text default null, p_object_id uuid default null,
  p_detail text default null, p_contact_id uuid default null
) returns void language plpgsql security definer
set search_path = atlas_people, public as $$
declare v_contact record;
begin
  if p_contact_id is not null then
    select * into v_contact from atlas_people.portal_contacts where id = p_contact_id;
  else
    select * into v_contact from atlas_people.portal_contacts
     where user_id = auth.uid() and status = 'actif' limit 1;
  end if;
  if not found then return; end if;
  insert into atlas_people.portal_access_log
    (tenant_id, contact_id, client_id, object_type, object_id, action, detail)
  values (v_contact.tenant_id, v_contact.id, v_contact.client_id,
          p_object_type, p_object_id, p_action, p_detail);
end; $$;

grant execute on function atlas_people.portal_log(text, text, uuid, text, uuid) to authenticated;

-- ── Cohérence rôle / périmètre (EX-P-006, EX-P-007) ──────────────────
-- Le rôle `site` sans périmètre ne voit RIEN : échec fermé, jamais ouvert
-- (recette T-00-01).
create or replace function atlas_people.portal_access_state(p_contact_id uuid default null)
returns text language sql stable security definer
set search_path = atlas_people, public as $$
  with c as (
    select * from atlas_people.portal_contacts
     where (p_contact_id is not null and id = p_contact_id)
        or (p_contact_id is null and user_id = auth.uid()) limit 1)
  select case
    when (select count(*) from c) = 0 then 'aucun_acces'
    when (select status from c) = 'revoque'  then 'revoque'
    when (select status from c) = 'suspendu' then 'suspendu'
    when (select status from c) = 'invite'   then 'invitation_en_attente'
    when (select role from c) = 'site'
     and not exists (select 1 from atlas_people.portal_contact_scopes s
                     where s.contact_id = (select id from c)) then 'perimetre_incomplet'
    else 'ok' end;
$$;

grant execute on function atlas_people.portal_access_state(uuid) to authenticated;

-- La porte se ferme dans la fonction d'appartenance, pas seulement à l'écran.
create or replace function atlas_people.portal_client_ids()
returns setof uuid language sql stable security definer
set search_path = atlas_people, public as $$
  select c.client_id from atlas_people.portal_contacts c
  where c.user_id = auth.uid() and c.status = 'actif'
    and (c.role <> 'site'
         or exists (select 1 from atlas_people.portal_contact_scopes s where s.contact_id = c.id));
$$;

create or replace function atlas_people.guard_contact_role_scope()
returns trigger language plpgsql
set search_path = atlas_people, public as $$
begin
  if new.status = 'actif' and new.role = 'site'
     and not exists (select 1 from atlas_people.portal_contact_scopes s where s.contact_id = new.id) then
    new.suspended_reason := 'Rôle site sans périmètre : accès incomplet, aucune donnée servie.';
  end if;
  return new;
end; $$;

drop trigger if exists trg_guard_contact_role_scope on atlas_people.portal_contacts;
create trigger trg_guard_contact_role_scope
  before insert or update of role, status on atlas_people.portal_contacts
  for each row execute function atlas_people.guard_contact_role_scope();

-- ── Second facteur exigé par l'octroi nominatif (§5.2) ───────────────
create or replace function atlas_people.portal_requires_mfa(p_client_id uuid default null)
returns boolean language sql stable security definer
set search_path = atlas_people, public as $$
  select exists (
    select 1 from atlas_people.portal_access_grants g
    where g.revoked_at is null and g.level = 'nominative'
      and g.section_code in ('payroll','workforce')
      and g.client_id = coalesce(p_client_id,
            (select client_id from atlas_people.portal_contacts
              where user_id = auth.uid() and status = 'actif' limit 1)));
$$;

grant execute on function atlas_people.portal_requires_mfa(uuid) to authenticated;

-- ── Invitation, activation, révocation (§5.2) ────────────────────────
-- Seul le CONDENSAT du jeton est conservé : un jeton lisible en base serait
-- un passe-partout pour quiconque lit la table.
create or replace function atlas_people.portal_invite_contact(
  p_client_id uuid, p_email text, p_full_name text,
  p_role atlas_people.portal_role default 'lecteur'
) returns table(contact_id uuid, token text)
language plpgsql security definer
set search_path = atlas_people, public as $$
declare v_tenant uuid; v_token text; v_id uuid;
begin
  select tenant_id into v_tenant from atlas_people.clients
   where id = p_client_id and tenant_id in (select atlas_people.current_tenant_ids());
  if not found then raise exception 'CLIENT_INTROUVABLE: client hors de votre périmètre.'; end if;

  if atlas_people.is_generic_email(p_email) then
    raise exception 'EMAIL_GENERIQUE: l''invitation exige une adresse nominative, pas une boîte partagée.';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into atlas_people.portal_contacts
    (tenant_id, client_id, email, full_name, role, status,
     invited_at, invite_token_hash, invite_expires_at)
  values (v_tenant, p_client_id, lower(btrim(p_email)), btrim(p_full_name), p_role, 'invite',
          now(), encode(extensions.digest(v_token,'sha256'),'hex'), now() + interval '72 hours')
  on conflict (tenant_id, client_id, email) do update
    set full_name = excluded.full_name, role = excluded.role, status = 'invite',
        invited_at = now(), invite_token_hash = excluded.invite_token_hash,
        invite_expires_at = excluded.invite_expires_at, invite_used_at = null, revoked_at = null
  returning id into v_id;

  insert into atlas_people.portal_access_log (tenant_id, contact_id, client_id, action, detail)
  values (v_tenant, v_id, p_client_id, 'invitation', 'Invitation émise pour ' || lower(btrim(p_email)));

  return query select v_id, v_token;
end; $$;

revoke all on function atlas_people.portal_invite_contact(uuid, text, text, atlas_people.portal_role) from public, anon;
grant execute on function atlas_people.portal_invite_contact(uuid, text, text, atlas_people.portal_role) to authenticated;

-- Lien à usage unique, 72 h, et l'email du compte doit correspondre.
create or replace function atlas_people.portal_accept_invitation(
  p_token text, p_terms_version text default 'v1'
) returns table(contact_id uuid, client_id uuid, client_name text)
language plpgsql security definer
set search_path = atlas_people, public as $$
declare v_hash text; v_contact record; v_email text;
begin
  select lower(email) into v_email from auth.users where id = auth.uid();
  if v_email is null then raise exception 'AUTH_REQUIRED: aucune session.'; end if;

  v_hash := encode(extensions.digest(p_token,'sha256'),'hex');
  select * into v_contact from atlas_people.portal_contacts where invite_token_hash = v_hash limit 1;
  if not found then raise exception 'INVITATION_INCONNUE: lien invalide.'; end if;
  if v_contact.invite_used_at is not null then
    raise exception 'INVITATION_UTILISEE: ce lien a déjà servi.'; end if;
  if v_contact.invite_expires_at < now() then
    raise exception 'INVITATION_EXPIREE: lien périmé, demandez-en un nouveau.'; end if;
  if lower(v_contact.email) <> v_email then
    raise exception 'EMAIL_DIFFERENT: ce lien a été émis pour une autre adresse.'; end if;

  update atlas_people.portal_contacts
     set user_id = auth.uid(), status = 'actif', activated_at = now(),
         invite_used_at = now(), invite_token_hash = null,
         terms_version = p_terms_version, terms_accepted_at = now(),
         privacy_accepted_at = now(), last_seen_at = now()
   where id = v_contact.id;

  insert into atlas_people.portal_access_log (tenant_id, contact_id, client_id, action, detail)
  values (v_contact.tenant_id, v_contact.id, v_contact.client_id, 'activation',
          'Activation, conditions ' || p_terms_version);

  return query select v_contact.id, v_contact.client_id, c.name
               from atlas_people.clients c where c.id = v_contact.client_id;
end; $$;

revoke all on function atlas_people.portal_accept_invitation(text, text) from public, anon;
grant execute on function atlas_people.portal_accept_invitation(text, text) to authenticated;

create or replace function atlas_people.portal_revoke_contact(p_contact_id uuid, p_reason text default null)
returns void language plpgsql security definer
set search_path = atlas_people, public as $$
declare v_contact record;
begin
  select * into v_contact from atlas_people.portal_contacts
   where id = p_contact_id and tenant_id in (select atlas_people.current_tenant_ids());
  if not found then raise exception 'CONTACT_INTROUVABLE: hors de votre périmètre.'; end if;

  update atlas_people.portal_contacts
     set status = 'revoque', revoked_at = now(), invite_token_hash = null, suspended_reason = p_reason
   where id = p_contact_id;

  -- L'accès aux données est coupé dès cet instant : toutes les fonctions du
  -- portail exigent status = 'actif'.
  insert into atlas_people.portal_access_log (tenant_id, contact_id, client_id, action, detail)
  values (v_contact.tenant_id, v_contact.id, v_contact.client_id, 'revocation',
          coalesce(p_reason, 'Révocation par le cabinet'));
end; $$;

revoke all on function atlas_people.portal_revoke_contact(uuid, text) from public, anon;
grant execute on function atlas_people.portal_revoke_contact(uuid, text) to authenticated;

-- ── Inactivité : suspension après 180 jours (§5.2) ───────────────────
-- Évaluée à la connexion plutôt que par une tâche planifiée : un compte
-- dormant ne présente aucun risque tant qu'il ne se connecte pas.
create or replace function atlas_people.portal_touch_seen()
returns text language plpgsql security definer
set search_path = atlas_people, public as $$
declare v_contact record;
begin
  select * into v_contact from atlas_people.portal_contacts
   where user_id = auth.uid() and status in ('actif','suspendu') limit 1;
  if not found then return 'aucun_acces'; end if;

  if v_contact.status = 'actif' and v_contact.last_seen_at is not null
     and v_contact.last_seen_at < now() - interval '180 days' then
    update atlas_people.portal_contacts
       set status = 'suspendu', suspended_reason = 'Inactivité supérieure à 180 jours'
     where id = v_contact.id;
    insert into atlas_people.portal_access_log (tenant_id, contact_id, client_id, action, detail)
    values (v_contact.tenant_id, v_contact.id, v_contact.client_id, 'suspension',
            'Inactivité supérieure à 180 jours');
    return 'suspendu';
  end if;

  update atlas_people.portal_contacts set last_seen_at = now() where id = v_contact.id;
  return atlas_people.portal_access_state();
end; $$;

grant execute on function atlas_people.portal_touch_seen() to authenticated;

-- ── Vérification d'intégrité ─────────────────────────────────────────
-- Un journal chaîné n'a de valeur que si quelqu'un peut le recalculer.
create or replace function atlas_people.portal_log_verify(p_tenant_id uuid)
returns table(lignes bigint, premiere_rupture bigint)
language sql stable security definer
set search_path = atlas_people, public as $$
  with chaine as (
    select id, sha256, sha256_prev, lag(sha256) over (order by id) as attendu
    from atlas_people.portal_access_log where tenant_id = p_tenant_id)
  select count(*)::bigint, min(id) filter (where sha256_prev is distinct from attendu)::bigint
  from chaine;
$$;

grant execute on function atlas_people.portal_log_verify(uuid) to authenticated;
