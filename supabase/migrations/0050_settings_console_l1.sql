-- =====================================================================
-- L1 · Console de Paramétrage — DDL socle
-- 5 nouvelles tables + 2 ALTER TABLE sur existantes
-- settings_registry / settings_override / settings_snapshot
-- settings_journal / country_packs
-- tenants.owner_user_id (CADMIN) / payroll_cycles.settings_snapshot_id
-- =====================================================================

-- 1. settings_registry
-- Manifeste central : chaque module expose ses clés configurables
-- tenant_id IS NULL = entrée atlas globale (template système)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS atlas_people.settings_registry (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid        REFERENCES atlas_people.tenants(id) ON DELETE CASCADE,
  module_code              text        NOT NULL,
  section                  text        NOT NULL,
  key                      text        NOT NULL,
  display_name             text        NOT NULL,
  description              text,
  data_type                text        NOT NULL
    CHECK (data_type IN ('number','text','boolean','json','date','rate','amount')),
  default_value            jsonb       NOT NULL,
  min_value                jsonb,
  max_value                jsonb,
  allowed_values           jsonb,
  applicable_tenant_types  text[]      DEFAULT ARRAY['entreprise','cabinet_complet','cabinet_paie','cabinet_mixte','cabinet_agence'],
  applicable_country_codes text[],
  cascade_levels           text[]      NOT NULL
    DEFAULT ARRAY['tenant','client_file','legal_entity','population'],
  is_system                boolean     NOT NULL DEFAULT false,
  active                   boolean     NOT NULL DEFAULT true,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- Unicité : clé globale atlas (sans tenant)
CREATE UNIQUE INDEX IF NOT EXISTS settings_registry_global_uidx
  ON atlas_people.settings_registry (module_code, section, key)
  WHERE tenant_id IS NULL;

-- Unicité : clé tenant-spécifique
CREATE UNIQUE INDEX IF NOT EXISTS settings_registry_tenant_uidx
  ON atlas_people.settings_registry (tenant_id, module_code, section, key)
  WHERE tenant_id IS NOT NULL;

ALTER TABLE atlas_people.settings_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_registry_read" ON atlas_people.settings_registry
  FOR SELECT USING (
    tenant_id IS NULL
    OR tenant_id IN (SELECT atlas_people.current_tenant_ids())
  );

CREATE POLICY "settings_registry_write" ON atlas_people.settings_registry
  FOR ALL USING (
    tenant_id IN (SELECT atlas_people.current_tenant_ids())
    AND NOT is_system
  )
  WITH CHECK (
    tenant_id IN (SELECT atlas_people.current_tenant_ids())
    AND NOT is_system
  );

GRANT SELECT ON atlas_people.settings_registry TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON atlas_people.settings_registry TO authenticated;


-- 2. settings_override
-- Override par niveau de cascade (tenant → client_file → legal_entity → population)
-- Workflow : draft → submitted → validated → published → archived
-- Contrainte no_overlap : un seul published par (tenant, clé, niveau, entité cible)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS atlas_people.settings_override (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES atlas_people.tenants(id) ON DELETE CASCADE,
  registry_id      uuid        NOT NULL REFERENCES atlas_people.settings_registry(id),
  cascade_level    text        NOT NULL
    CHECK (cascade_level IN ('tenant','client_file','legal_entity','population')),
  level_entity_id  uuid,
  value            jsonb       NOT NULL,
  status           text        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','validated','published','archived')),
  valid_from       date,
  valid_to         date,
  version          integer     NOT NULL DEFAULT 1,
  created_by       uuid        REFERENCES auth.users(id),
  submitted_at     timestamptz,
  submitted_by     uuid        REFERENCES auth.users(id),
  validated_at     timestamptz,
  validated_by     uuid        REFERENCES auth.users(id),
  published_at     timestamptz,
  published_by     uuid        REFERENCES auth.users(id),
  archived_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- no_overlap : unicité sur published uniquement
CREATE UNIQUE INDEX IF NOT EXISTS settings_override_no_overlap_uidx
  ON atlas_people.settings_override (
    tenant_id, registry_id, cascade_level,
    COALESCE(level_entity_id::text, '__nil__')
  )
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS settings_override_tenant_registry_idx
  ON atlas_people.settings_override (tenant_id, registry_id, status);

ALTER TABLE atlas_people.settings_override ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_override_tenant" ON atlas_people.settings_override
  FOR ALL USING (tenant_id IN (SELECT atlas_people.current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT atlas_people.current_tenant_ids()));

GRANT SELECT, INSERT, UPDATE, DELETE ON atlas_people.settings_override TO authenticated;


-- 3. settings_snapshot
-- Snapshot figé des paramètres résolus au moment de la clôture d'un cycle
-- Immuable après création : garantit la reproductibilité des calculs
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS atlas_people.settings_snapshot (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES atlas_people.tenants(id) ON DELETE CASCADE,
  cycle_id         uuid        REFERENCES atlas_people.payroll_cycles(id),
  period           text        NOT NULL,
  country_code     text        NOT NULL,
  parameters       jsonb       NOT NULL,
  override_ids     uuid[]      NOT NULL DEFAULT '{}',
  resolved_at      timestamptz NOT NULL DEFAULT now(),
  resolved_by      uuid        REFERENCES auth.users(id),
  hash             text        NOT NULL,
  prev_snapshot_id uuid        REFERENCES atlas_people.settings_snapshot(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE atlas_people.settings_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_snapshot_tenant" ON atlas_people.settings_snapshot
  FOR ALL USING (tenant_id IN (SELECT atlas_people.current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT atlas_people.current_tenant_ids()));

GRANT SELECT, INSERT ON atlas_people.settings_snapshot TO authenticated;


-- 4. settings_journal
-- Journal SHA-256 chainé dédié aux modifications de paramètres
-- Immuable : INSERT only, jamais UPDATE ni DELETE
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS atlas_people.settings_journal (
  id               bigserial   PRIMARY KEY,
  tenant_id        uuid        NOT NULL REFERENCES atlas_people.tenants(id) ON DELETE CASCADE,
  actor_id         uuid        REFERENCES auth.users(id),
  action           text        NOT NULL
    CHECK (action IN ('create','update','submit','validate','publish','archive','rollback')),
  entity           text        NOT NULL,
  entity_id        uuid        NOT NULL,
  override_before  jsonb,
  override_after   jsonb       NOT NULL,
  prev_hash        text,
  hash             text        NOT NULL,
  source_surface   text        NOT NULL DEFAULT 'backoffice'
    CHECK (source_surface IN ('ess','mss','backoffice','system')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS settings_journal_tenant_created_idx
  ON atlas_people.settings_journal (tenant_id, created_at DESC);

ALTER TABLE atlas_people.settings_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_journal_insert" ON atlas_people.settings_journal
  FOR INSERT WITH CHECK (tenant_id IN (SELECT atlas_people.current_tenant_ids()));

CREATE POLICY "settings_journal_read" ON atlas_people.settings_journal
  FOR SELECT USING (tenant_id IN (SELECT atlas_people.current_tenant_ids()));

GRANT SELECT, INSERT ON atlas_people.settings_journal TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE atlas_people.settings_journal_id_seq TO authenticated;


-- 5. country_packs
-- Packs pays versionnés : taux légaux (CNPS, IRPP, SMIG, FDFP...)
-- tenant_id IS NULL = pack atlas officiel ; non-NULL = surcharge tenant
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS atlas_people.country_packs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        REFERENCES atlas_people.tenants(id) ON DELETE CASCADE,
  country_code     text        NOT NULL,
  pack_version     text        NOT NULL,
  effective_from   date        NOT NULL,
  effective_to     date,
  status           text        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),
  parameters       jsonb       NOT NULL DEFAULT '{}',
  changelog        text,
  published_at     timestamptz,
  published_by     uuid        REFERENCES auth.users(id),
  created_by       uuid        REFERENCES auth.users(id),
  audit_hash       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS country_packs_global_uidx
  ON atlas_people.country_packs (country_code, pack_version)
  WHERE tenant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS country_packs_tenant_uidx
  ON atlas_people.country_packs (tenant_id, country_code, pack_version)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS country_packs_country_status_idx
  ON atlas_people.country_packs (country_code, status, effective_from DESC);

ALTER TABLE atlas_people.country_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "country_packs_read" ON atlas_people.country_packs
  FOR SELECT USING (
    tenant_id IS NULL
    OR tenant_id IN (SELECT atlas_people.current_tenant_ids())
  );

CREATE POLICY "country_packs_write" ON atlas_people.country_packs
  FOR ALL USING (tenant_id IN (SELECT atlas_people.current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT atlas_people.current_tenant_ids()));

GRANT SELECT ON atlas_people.country_packs TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON atlas_people.country_packs TO authenticated;


-- 6. Altérations tables existantes
-- ---------------------------------------------------------------

-- CADMIN : colonne owner_user_id pour distinguer le propriétaire fondateur
-- du workspace de ses admins délégués
ALTER TABLE atlas_people.tenants
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id);

-- Lien cycle paie → snapshot paramètres
-- Permet de retrouver exactement les paramètres utilisés pour un calcul passé
ALTER TABLE atlas_people.payroll_cycles
  ADD COLUMN IF NOT EXISTS settings_snapshot_id uuid
    REFERENCES atlas_people.settings_snapshot(id);
