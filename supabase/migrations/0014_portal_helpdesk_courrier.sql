-- ============================================================================
-- Atlas People — Portail Collaborateur : sections nouvelles S8 & S9.
--   S8 « Mes demandes » : helpdesk RH employé (tickets, fil de conversation, SLA).
--   S9 « Mon courrier » : correspondance officielle reçue, preuve de lecture &
--       de signature (audit chaîné SHA-256), conservation légale (aucun DELETE).
-- 8 tables + RLS + seed catalogue des types de demande. Additif, idempotent.
-- ============================================================================

-- ===========================================================================
-- S8 — Mes demandes (helpdesk RH)
-- ===========================================================================
create table if not exists service_request_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants (id) on delete cascade,  -- NULL = commun
  code text not null,
  label text not null,
  category text not null check (category in ('document','remuneration','time','career','administrative','rgpd')),
  description text,
  required_fields jsonb,
  default_sla_hours int,
  routing_rule text not null default 'primary_referent' check (routing_rule in ('primary_referent','backup','general_hr','compliance','occupational_doctor')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists uq_service_request_types on service_request_types (coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), code);

create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  reference text not null unique,                 -- REQ-{année}-{séquence}
  requester_employee_id uuid not null references employees (id),
  request_type_id uuid references service_request_types (id),
  request_type_code text not null,
  subject text not null,
  description text not null,
  urgency text not null default 'normal' check (urgency in ('normal','important','urgent')),
  urgency_justification text,
  type_specific_fields jsonb,
  status text not null default 'submitted' check (status in ('submitted','assigned','in_progress','info_requested','resolved','closed','refused','transferred')),
  assigned_to_user_id uuid,
  assigned_at timestamptz,
  sla_deadline timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  refusal_reason text,
  satisfaction_score int check (satisfaction_score between 1 and 5),
  satisfaction_comment text,
  source_surface text not null default 'portal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_service_requests_req on service_requests (tenant_id, requester_employee_id, status);
create index if not exists idx_service_requests_assignee on service_requests (tenant_id, assigned_to_user_id, status);
create index if not exists idx_service_requests_sla on service_requests (tenant_id, sla_deadline) where status in ('submitted','assigned','in_progress','info_requested');

create table if not exists service_request_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  service_request_id uuid not null references service_requests (id) on delete cascade,
  author_user_id uuid not null,
  author_role text not null check (author_role in ('employee','hr_agent','system')),
  content text not null,
  attachments jsonb,
  is_internal_note boolean not null default false,  -- note RH non visible à l'employé
  created_at timestamptz not null default now()
);
create index if not exists idx_service_request_messages on service_request_messages (tenant_id, service_request_id, created_at);

create table if not exists service_request_attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  service_request_id uuid not null references service_requests (id) on delete cascade,
  file_path text not null,
  file_name text not null,
  uploaded_by_user_id uuid not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists service_request_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  service_request_id uuid not null references service_requests (id) on delete cascade,
  event_type text not null,
  payload jsonb,
  actor_user_id uuid,
  occurred_at timestamptz not null default now()
);
create index if not exists idx_service_request_history on service_request_history (tenant_id, service_request_id, occurred_at);

-- ===========================================================================
-- S9 — Mon courrier (correspondance officielle)
-- ===========================================================================
create table if not exists official_correspondence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  recipient_employee_id uuid not null references employees (id),
  correspondence_type text not null,
  subject text not null,
  body text,
  attached_document_id uuid references employee_documents (id),
  sender_type text not null check (sender_type in ('hr','drh','manager','direction','occupational_doctor','payroll','system')),
  sender_user_id uuid,

  status text not null default 'unread' check (status in ('unread','read','action_required','signed','acknowledged','archived')),
  delivered_at timestamptz not null default now(),
  first_read_at timestamptz,
  last_action_at timestamptz,
  archived_at timestamptz,

  requires_signature boolean not null default false,
  signature_deadline date,
  signed_at timestamptz,
  signature_proof_id uuid,                          -- référence ADVIST

  requires_acknowledgment boolean not null default false,
  acknowledged_at timestamptz,

  requires_attendance_confirmation boolean not null default false,
  attendance_confirmed_at timestamptz,
  attendance_response text check (attendance_response in ('confirmed','reschedule_requested','declined',null)),

  confidentiality_level text not null default 'normal' check (confidentiality_level in ('normal','confidential','strictly_confidential')),
  source_module text,
  source_entity_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_correspondence on official_correspondence (tenant_id, recipient_employee_id, status, delivered_at desc);

create table if not exists correspondence_read_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  correspondence_id uuid not null references official_correspondence (id) on delete cascade,
  read_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  audit_hash text                                   -- chaîné SHA-256
);
create index if not exists idx_correspondence_read_log on correspondence_read_log (tenant_id, correspondence_id);

create table if not exists correspondence_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  correspondence_id uuid not null references official_correspondence (id) on delete cascade,
  action_type text not null check (action_type in ('signed','acknowledged','attendance_confirmed','reschedule_requested','archived')),
  action_payload jsonb,
  acted_at timestamptz not null default now(),
  ip_address text,
  audit_hash text
);
create index if not exists idx_correspondence_actions on correspondence_actions (tenant_id, correspondence_id);

-- ---------------------------------------------------------------------------
-- Seed — catalogue commun des types de demande (extrait du §7.2)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from service_request_types limit 1) then
    insert into service_request_types (code, label, category, default_sla_hours, routing_rule) values
      ('DOC-ATT-TRAV','Attestation de travail','document',48,'primary_referent'),
      ('DOC-ATT-SAL','Attestation de salaire','document',48,'primary_referent'),
      ('DOC-ATT-VOY','Attestation pour voyage','document',72,'primary_referent'),
      ('DOC-BULLETIN','Duplicata de bulletin','document',48,'general_hr'),
      ('DOC-FISCAL','Documents fiscaux','document',120,'general_hr'),
      ('REM-PRET','Demande de prêt employeur','remuneration',240,'primary_referent'),
      ('REM-AVANCE','Demande d''avance sur salaire','remuneration',120,'primary_referent'),
      ('REM-ENTRETIEN','Entretien sur ma rémunération','remuneration',168,'primary_referent'),
      ('TPS-INFO-SOLDE','Question sur mon solde de congés','time',120,'primary_referent'),
      ('TPS-REGUL-POINT','Régularisation de pointage','time',72,'primary_referent'),
      ('CAR-RDV-DEVEL','RDV de développement','career',168,'primary_referent'),
      ('CAR-MOBILITE','Souhait de mobilité interne','career',168,'general_hr'),
      ('FORM-FINANCE','Financement d''une formation externe','career',240,'general_hr'),
      ('ADM-RDV-RH','RDV avec mon référent RH','administrative',120,'primary_referent'),
      ('ADM-QUESTION','Question générale','administrative',120,'primary_referent'),
      ('ADM-RECLAMATION','Réclamation','administrative',168,'general_hr'),
      ('RGPD-EXPORT','Export de mes données','rgpd',720,'compliance'),
      ('RGPD-RECTIF','Rectification de mes données','rgpd',240,'compliance'),
      ('RGPD-EFFACE','Effacement de mes données','rgpd',720,'compliance');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS — isolation tenant (granularité employé/RH affinée à l'intégration helpdesk back-office)
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array[
  'service_requests','service_request_messages','service_request_attachments','service_request_history',
  'official_correspondence','correspondence_read_log','correspondence_actions'
];
begin
  foreach t in array tabs loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy tenant_isolation on %I
        using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
        with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
    $f$, t);
  end loop;
end $$;

alter table service_request_types enable row level security;
create policy service_request_types_read on service_request_types
  for select using (tenant_id is null or tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
