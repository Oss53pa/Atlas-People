-- ============================================================================
-- Atlas People — M11 Formation sprint 1 (selon spec formation.zip).
-- Couvre :
--   • Parcours formation (templates + modules + enrollments)
--   • PIF (Plan Individuel Formation co-construit · 3 signatures ADVIST)
--   • LMS Atlas (SCORM/xAPI · courses · progress · badges digitaux)
--   • Formateurs pool + animations + convocations DocJourney
--   • Invoices facturation prestataires + audit anti-fraude FDFP
--   • 10 patterns suspects (P1-P10 dont P1-P4 critiques pénal)
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- ENUMS dédiés (14 types)
do $$ begin create type m11_parcours_kind as enum ('metier','leadership','certifiant','obligatoire'); exception when duplicate_object then null; end $$;
do $$ begin create type m11_pif_status as enum ('draft','co_constructed','signed','in_progress','closed','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type m11_action_kind as enum ('formation','certification','mentorat','mission','self_learning','autre'); exception when duplicate_object then null; end $$;
do $$ begin create type m11_action_status as enum ('planned','in_progress','completed','cancelled','postponed'); exception when duplicate_object then null; end $$;
do $$ begin create type m11_modality as enum ('presentiel','distanciel_sync','e_learning','blended','terrain','self_learning'); exception when duplicate_object then null; end $$;
do $$ begin create type m11_lms_progress_status as enum ('not_started','in_progress','completed','failed'); exception when duplicate_object then null; end $$;
do $$ begin create type m11_formateur_kind as enum ('interne','externe'); exception when duplicate_object then null; end $$;
do $$ begin create type m11_convocation_stage as enum ('J-15','J-7','J-1','session'); exception when duplicate_object then null; end $$;
do $$ begin create type m11_convocation_status as enum ('pending','sent','delivered','opened','bounced'); exception when duplicate_object then null; end $$;
do $$ begin create type m11_invoice_status as enum ('draft','validated_for_payment','paid','rejected','duplicate_suspected'); exception when duplicate_object then null; end $$;
do $$ begin create type m11_pattern_code as enum
  ('P1_PRESENCES_FICTIVES','P2_REFACTURATION_NON_JUSTIFIEE','P3_FORMATIONS_FICTIVES_FDFP',
   'P4_CERTIFS_SANS_VALIDATION','P5_DOUBLES_PAIEMENTS','P6_COMPLIANCE_NON_RESPECTEE',
   'P7_SUR_FACTURATION_PRESTATAIRES','P8_MODIF_POST_VALIDATION','P9_EVAL_N2_TRUQUEES',
   'P10_NO_SHOWS_NON_SANCTIONNES');
exception when duplicate_object then null; end $$;
do $$ begin create type m11_confidentiality as enum ('public','interne','sensible','top_secret'); exception when duplicate_object then null; end $$;

-- 14 tables + 1 vue déployées via MCP (idempotent · drop policy if exists)
-- m11_parcours, m11_parcours_modules, m11_parcours_enrollments
-- m11_pif, m11_pif_actions
-- m11_lms_courses, m11_lms_progress, m11_badges, m11_badge_attributions
-- m11_formateurs, m11_session_animations, m11_convocations
-- m11_invoices, m11_suspicious_patterns
-- vue m11_pif_progress (completion + budget consommé par PIF)
--
-- RLS:
--   owner_pif_read : collab + manager + HR voit le PIF
--   owner_lms_read : collab voit son propre suivi LMS

comment on schema atlas_people is 'Atlas People — schema multi-tenant SIRH OHADA · 18 modules · ~200 tables · 14 vues KPI · 9 modules audit SHA-256 · 44 patterns anti-fraude deterministes';
