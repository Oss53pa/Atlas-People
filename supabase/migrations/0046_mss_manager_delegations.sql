-- 0046 — MSS : table des délégations de validation manager.
-- Absente du schéma pré-provisionné ; ajoutée pour la surface Paramètres →
-- Délégations du portail manager (création / révocation live).
-- RLS harmonisée (current_tenant_ids), grants authenticated, comme le reste
-- du schéma atlas_people.

CREATE TABLE IF NOT EXISTS atlas_people.manager_delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  delegator_employee_id uuid NOT NULL,
  delegate_employee_id uuid NOT NULL,
  delegate_name text,
  scope jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','accepted','active','expired','revoked','declined')),
  message text,
  valid_from date,
  valid_until date,
  created_by uuid,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manager_delegations_tenant_delegator_idx
  ON atlas_people.manager_delegations (tenant_id, delegator_employee_id, status);

ALTER TABLE atlas_people.manager_delegations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS manager_delegations_tenant_all ON atlas_people.manager_delegations;
CREATE POLICY manager_delegations_tenant_all ON atlas_people.manager_delegations
  FOR ALL
  USING (tenant_id IN (SELECT atlas_people.current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT atlas_people.current_tenant_ids()));

GRANT SELECT, INSERT, UPDATE, DELETE ON atlas_people.manager_delegations TO authenticated;
GRANT SELECT ON atlas_people.manager_delegations TO anon;
