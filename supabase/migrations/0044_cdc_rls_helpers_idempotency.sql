-- Migration 0044: CDC Complément §3 — RLS helpers + table idempotence
-- has_hr_role(), current_employee_id(), idempotency_keys
--
-- Contexte : migration 0036 (Supabase MCP) portait le même nom ;
-- ce fichier est son équivalent versionné pour le dépôt Git.

SET search_path = atlas_people, public;

-- ── has_hr_role() ──────────────────────────────────────────────────────────
-- Retourne true si l'utilisateur courant a un rôle RH/admin dans son tenant.
-- Utilisé en archétype RH/admin dans les policies RLS et les Edge Functions.
CREATE OR REPLACE FUNCTION atlas_people.has_hr_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = atlas_people, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM atlas_people.tenant_memberships
    WHERE user_id = auth.uid()
      AND role IN ('rh', 'admin', 'drh', 'paie')
  );
$$;

-- ── current_employee_id() ──────────────────────────────────────────────────
-- Version scalaire (uuid) de current_employee_ids() — pour les policies RLS
-- qui ont besoin d'un scalaire : employee_id = current_employee_id().
CREATE OR REPLACE FUNCTION atlas_people.current_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = atlas_people, public
AS $$
  SELECT id FROM atlas_people.employees WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ── idempotency_keys ────────────────────────────────────────────────────────
-- Garantit qu'un appel Edge Function avec le même idempotency_key est rejoué
-- plutôt que ré-exécuté. Utilisé par les 5 Edge Functions du CDC Complément §4.
CREATE TABLE IF NOT EXISTS atlas_people.idempotency_keys (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id  uuid        NOT NULL,
  key        text        NOT NULL,
  action     text        NOT NULL,
  result     jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);

ALTER TABLE atlas_people.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Les Edge Functions s'exécutent avec service_role (bypass RLS).
-- Aucune policy utilisateur nécessaire ; accès direct interdit par RLS activée.
