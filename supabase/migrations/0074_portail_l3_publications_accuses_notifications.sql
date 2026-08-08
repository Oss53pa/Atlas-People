-- =====================================================================
-- 0074 — Portail client, lot L3 : publication versionnée, accusés, notifications
--
-- Met en œuvre R4, R5, R6, §8 et EX-P-014 du volume 0.
--
-- LA PUBLICATION EST UN ACTE, PAS UN STATUT (R5). Un objet ne devient pas
-- visible parce qu'une colonne technique a changé : quelqu'un le publie,
-- signe et date. C'est ce qui rend la mise à disposition opposable.
--
-- ON NE SUPPRIME JAMAIS, ON REMPLACE (R6). Une pièce erronée reste
-- consultable, marquée « remplacée ». Retirer une pièce déjà lue effacerait
-- la preuve de ce que le client avait sous les yeux.
-- =====================================================================

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='portal_section_state' and n.nspname='atlas_people') then
    create type atlas_people.portal_section_state as enum ('absente','active','en_attente','sans_objet');
  end if;
end $$;

create table if not exists atlas_people.portal_publications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references atlas_people.tenants(id) on delete cascade,
  client_id uuid not null references atlas_people.clients(id) on delete cascade,
  section_code text not null references atlas_people.portal_sections_registry(section_code),
  object_type text not null, object_id uuid, period text,
  version integer not null default 1 check (version >= 1),
  title text not null, file_path text, sha256 text,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete set null,
  replaces_id uuid references atlas_people.portal_publications(id) on delete set null,
  replaced_by_id uuid references atlas_people.portal_publications(id) on delete set null,
  motive text, unpublished_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table atlas_people.portal_publications is
  'R5 — l''acte de mise à disposition. Un objet devient visible par une publication explicite, jamais par un changement de statut technique.';

create index if not exists idx_portal_pub_client
  on atlas_people.portal_publications (tenant_id, client_id, section_code, published_at desc);

-- R6 : une version n+1 exige un motif.
create or replace function atlas_people.guard_publication_version()
returns trigger language plpgsql set search_path = atlas_people, public as $$
declare v_prev record;
begin
  if new.replaces_id is not null then
    if new.motive is null or length(btrim(new.motive)) < 10 then
      raise exception 'MOTIF_REQUIS: remplacer une pièce publiée exige un motif explicite.';
    end if;
    select * into v_prev from atlas_people.portal_publications where id = new.replaces_id;
    if not found then raise exception 'PUBLICATION_INTROUVABLE: pièce remplacée inconnue.'; end if;
    if v_prev.replaced_by_id is not null then
      raise exception 'DEJA_REMPLACEE: cette pièce a déjà une version postérieure.'; end if;
    new.version := v_prev.version + 1;
  end if;
  return new;
end; $$;

drop trigger if exists trg_guard_publication_version on atlas_people.portal_publications;
create trigger trg_guard_publication_version before insert on atlas_people.portal_publications
  for each row execute function atlas_people.guard_publication_version();

create or replace function atlas_people.after_publication()
returns trigger language plpgsql set search_path = atlas_people, public as $$
begin
  if new.replaces_id is not null then
    update atlas_people.portal_publications set replaced_by_id = new.id where id = new.replaces_id;
  end if;

  insert into atlas_people.portal_notifications (tenant_id, contact_id, client_id, event_code, channel, payload)
  select new.tenant_id, c.id, new.client_id,
         case when new.replaces_id is null then 'publication.created' else 'publication.replaced' end,
         'portal',
         -- EX-P-017 : la notification annonce, elle n'expose rien.
         jsonb_build_object('section', new.section_code, 'title', new.title,
                            'period', new.period, 'version', new.version)
  from atlas_people.portal_contacts c
  where c.client_id = new.client_id and c.status = 'actif';

  insert into atlas_people.portal_access_log (tenant_id, client_id, action, object_type, object_id, detail)
  values (new.tenant_id, new.client_id,
          case when new.replaces_id is null then 'publication' else 'remplacement' end,
          new.object_type, new.id, new.title || ' (v' || new.version || ')');
  return null;
end; $$;

drop trigger if exists trg_after_publication on atlas_people.portal_publications;
create trigger trg_after_publication after insert on atlas_people.portal_publications
  for each row execute function atlas_people.after_publication();

-- R5 : fenêtre de dépublication de 15 minutes, au-delà version corrective.
create or replace function atlas_people.portal_unpublish(p_id uuid, p_motive text)
returns void language plpgsql security definer
set search_path = atlas_people, public as $$
declare v_pub record;
begin
  select * into v_pub from atlas_people.portal_publications
   where id = p_id and tenant_id in (select atlas_people.current_tenant_ids());
  if not found then raise exception 'PUBLICATION_INTROUVABLE: hors de votre périmètre.'; end if;
  if v_pub.published_at < now() - interval '15 minutes' then
    raise exception 'FENETRE_DEPASSEE: au-delà de 15 minutes, publiez une version corrective plutôt que de retirer la pièce.';
  end if;
  if p_motive is null or length(btrim(p_motive)) < 10 then
    raise exception 'MOTIF_REQUIS: la dépublication exige un motif.'; end if;

  update atlas_people.portal_publications set unpublished_at = now(), motive = p_motive where id = p_id;
  insert into atlas_people.portal_access_log (tenant_id, client_id, action, object_type, object_id, detail)
  values (v_pub.tenant_id, v_pub.client_id, 'depublication', v_pub.object_type, v_pub.id, p_motive);
end; $$;

revoke all on function atlas_people.portal_unpublish(uuid, text) from public, anon;
grant execute on function atlas_people.portal_unpublish(uuid, text) to authenticated;

-- ── Accusés de prise de connaissance (C6) ────────────────────────────
create table if not exists atlas_people.portal_acknowledgements (
  publication_id uuid not null references atlas_people.portal_publications(id) on delete cascade,
  contact_id uuid not null references atlas_people.portal_contacts(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  ip text, signature_hash text,
  primary key (publication_id, contact_id)
);

create or replace function atlas_people.portal_acknowledge(p_publication_id uuid)
returns void language plpgsql security definer
set search_path = atlas_people, public as $$
declare v_contact record; v_pub record;
begin
  select * into v_contact from atlas_people.portal_contacts
   where user_id = auth.uid() and status = 'actif' limit 1;
  if not found then raise exception 'AUCUN_ACCES: aucun accès portail actif.'; end if;

  select * into v_pub from atlas_people.portal_publications
   where id = p_publication_id and client_id = v_contact.client_id and unpublished_at is null;
  if not found then raise exception 'PUBLICATION_INTROUVABLE: pièce inaccessible.'; end if;

  insert into atlas_people.portal_acknowledgements (publication_id, contact_id, signature_hash)
  values (p_publication_id, v_contact.id,
          encode(extensions.digest(v_contact.id::text || p_publication_id::text || now()::text, 'sha256'), 'hex'))
  on conflict do nothing;

  insert into atlas_people.portal_access_log (tenant_id, contact_id, client_id, action, object_type, object_id, detail)
  values (v_contact.tenant_id, v_contact.id, v_contact.client_id, 'accuse', 'publication',
          p_publication_id, 'Prise de connaissance');
end; $$;

grant execute on function atlas_people.portal_acknowledge(uuid) to authenticated;

-- ── Notifications (§8.2, EX-P-015 à EX-P-017) ────────────────────────
create table if not exists atlas_people.portal_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references atlas_people.tenants(id) on delete cascade,
  contact_id uuid not null references atlas_people.portal_contacts(id) on delete cascade,
  client_id uuid, event_code text not null,
  channel text not null default 'portal' check (channel in ('portal','email','sms','whatsapp')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz, read_at timestamptz
);

create index if not exists idx_portal_notif_contact
  on atlas_people.portal_notifications (contact_id, created_at desc);

comment on table atlas_people.portal_notifications is
  'EX-P-017 — une notification annonce et renvoie vers le portail, elle ne contient aucune donnée exposable.';

-- EX-P-016 : immédiat pour action.* et invoice.overdue, regroupé sinon.
create or replace function atlas_people.portal_notification_is_immediate(p_event_code text)
returns boolean language sql immutable as $$
  select p_event_code like 'action.%' or p_event_code = 'invoice.overdue';
$$;

create or replace function atlas_people.portal_notifications_pending()
returns table(id uuid, event_code text, payload jsonb, created_at timestamptz, immediate boolean)
language sql stable security definer set search_path = atlas_people, public as $$
  select n.id, n.event_code, n.payload, n.created_at,
         atlas_people.portal_notification_is_immediate(n.event_code)
  from atlas_people.portal_notifications n
  join atlas_people.portal_contacts c on c.id = n.contact_id
  where c.user_id = auth.uid() and c.status = 'actif' and n.read_at is null
  order by n.created_at desc;
$$;

grant execute on function atlas_people.portal_notifications_pending() to authenticated;

alter table atlas_people.portal_publications    enable row level security;
alter table atlas_people.portal_acknowledgements enable row level security;
alter table atlas_people.portal_notifications    enable row level security;

drop policy if exists portal_pub_tenant on atlas_people.portal_publications;
create policy portal_pub_tenant on atlas_people.portal_publications
  for all to authenticated
  using (tenant_id in (select atlas_people.current_tenant_ids()))
  with check (tenant_id in (select atlas_people.current_tenant_ids()));

-- T-00-05 : une pièce dépubliée disparaît du portail, sans être supprimée.
drop policy if exists portal_pub_client_read on atlas_people.portal_publications;
create policy portal_pub_client_read on atlas_people.portal_publications
  for select to authenticated
  using (client_id in (select atlas_people.portal_client_ids()) and unpublished_at is null);

drop policy if exists portal_ack_self on atlas_people.portal_acknowledgements;
create policy portal_ack_self on atlas_people.portal_acknowledgements
  for select to authenticated
  using (contact_id in (select id from atlas_people.portal_contacts where user_id = auth.uid())
         or exists (select 1 from atlas_people.portal_contacts c
                    where c.id = contact_id and c.tenant_id in (select atlas_people.current_tenant_ids())));

drop policy if exists portal_notif_self on atlas_people.portal_notifications;
create policy portal_notif_self on atlas_people.portal_notifications
  for select to authenticated
  using (contact_id in (select id from atlas_people.portal_contacts where user_id = auth.uid())
         or tenant_id in (select atlas_people.current_tenant_ids()));

grant select, insert, update, delete on atlas_people.portal_publications to authenticated;
grant select on atlas_people.portal_acknowledgements to authenticated;
grant select on atlas_people.portal_notifications to authenticated;

-- ── États de rubrique (§8.1, EX-P-014) ───────────────────────────────
-- L'état vide muet est INTERDIT : c'est ici que la règle devient opposable.
create or replace function atlas_people.portal_sections()
returns table(
  section_code text, label text, subtitle text, empty_state text,
  sort_order integer, icon text,
  grant_level atlas_people.portal_grant_level, is_action_capable boolean,
  state atlas_people.portal_section_state, publications integer,
  derniere_publication timestamptz)
language sql stable security definer set search_path = atlas_people, public as $$
  with moi as (
    select c.id as contact_id, c.client_id from atlas_people.portal_contacts c
    where c.user_id = auth.uid() and c.status = 'actif' limit 1),
  p as (select s.* from atlas_people.portal_profile() s)
  select p.section_code, p.label, p.subtitle, p.empty_state, p.sort_order, p.icon,
         p.grant_level, p.is_action_capable,
         case when coalesce(pub.n,0) > 0 then 'active' else 'en_attente' end::atlas_people.portal_section_state,
         coalesce(pub.n,0)::integer, pub.derniere
  from p
  left join lateral (
    select count(*)::integer as n, max(published_at) as derniere
    from atlas_people.portal_publications pp, moi
    where pp.client_id = moi.client_id and pp.section_code = p.section_code
      and pp.unpublished_at is null and pp.replaced_by_id is null
  ) pub on true
  order by p.sort_order;
$$;

grant execute on function atlas_people.portal_sections() to authenticated;
