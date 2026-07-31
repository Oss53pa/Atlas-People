-- =====================================================================
-- V13 · Manifeste settings_registry — M9 Compétences.
--
-- Source : COMPETENCE_THRESHOLDS (src/lib/m9/referentiels.ts), seuils de
-- matching mobilité interne. Entrées atlas globales (tenant_id NULL) —
-- les tenants surchargent via settings_override.
--
-- Complète 0054_settings_registry_m7_m11.sql dont le commentaire
-- excluait délibérément M9 tant que ses seuils restaient en dur dans
-- le JSX sans constante nommée exportée.
-- =====================================================================

insert into atlas_people.settings_registry
  (module_code, section, key, display_name, description, data_type, default_value, min_value, max_value, is_system)
values
  ('M9', 'mobility', 'match_min_pct',           'Seuil match minimum',              'Score de matching (%) en-dessous duquel une candidature de mobilité interne n''est pas recevable.', 'rate', '40'::jsonb, '0'::jsonb, '100'::jsonb, false),
  ('M9', 'mobility', 'match_pdc_min_pct',       'Seuil match — PDC requis',          'Score de matching (%) en-dessous duquel une mobilité exige validation Comex + clause de retour (au-dessus : PDC d''accompagnement signé ADVIST).', 'rate', '60'::jsonb, '0'::jsonb, '100'::jsonb, false),
  ('M9', 'mobility', 'match_auto_validate_pct', 'Seuil match — validation DRH',      'Score de matching (%) à partir duquel la décision DRH + manager d''accueil suffit, sans PDC ni validation Comex.', 'rate', '80'::jsonb, '0'::jsonb, '100'::jsonb, false)
on conflict (module_code, section, key) where tenant_id is null do nothing;
