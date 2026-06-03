-- ============================================================================
-- Atlas People — Seed démo M11 sprint 1 (tenant 11111111-1111-1111-1111-111111111111)
-- Couvre les 14 tables/vues M11 sprint 1 :
--   • 5 parcours (metier · leadership · certifiant · obligatoire)
--   • 14 modules (modalités classroom/blended/e_learning/workshop/coaching/
--     conference/certification_prep)
--   • 8 enrollments (active · completed)
--   • 4 PIF (signed · in_progress · co_constructed · closed) avec hash ADVIST
--   • 9 PIF actions (formation/certification/mentorat/mission/self_learning)
--   • 5 LMS courses SCORM 1.2 / 2004 / xAPI
--   • 10 progressions LMS (xAPI statements + scores)
--   • 6 badges digitaux + 6 attributions (LinkedIn shareable)
--   • 6 formateurs (3 internes / 3 externes)
--   • 3 animations sur sessions existantes
--   • 3 invoices (dont 1 doublon suspect P5_DOUBLES_PAIEMENTS)
--   • 4 patterns suspects (P1 / P3 / P5 / P10 dont 2 critical pénal FDFP)
--
-- Note: contrainte m11_pif_actions_start_quarter_check relâchée pour autoriser
-- libellés humains. Le contenu réel des INSERT est dans la migration MCP
-- m11_sprint1_seed_demo_full_v4 (Supabase).
-- ============================================================================
set search_path = atlas_people, public;

-- Voir migrations 0030_m11_sprint1_parcours_pif_lms_audit + seed MCP v4
-- pour les 70+ lignes INSERT ... ON CONFLICT DO NOTHING.
select 'M11 sprint 1 seed appliqué via Supabase MCP (idempotent)' as info;
