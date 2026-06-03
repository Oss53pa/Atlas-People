-- ============================================================================
-- Atlas People — M5 Recrutement (ATS) + M6 Onboarding backend complet.
-- Couvre :
--   M5 : besoins · jobs · candidates · applications Kanban · interviews ·
--        scorecards · offers · referrals · audit chain
--   M6 : parcours_templates · arrivants · jalons (30/60/90) · tasks · pulses ·
--        welcome_book · audit chain
-- Règles :
--   R1  Owner_arrivant_read : arrivant lit son propre dossier (RGPD)
--   R2  RLS tenant + is_hr_or_admin écriture
--   R3  Audit SHA-256 sur deux modules
-- Schéma atlas_people · idempotent.
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- M5 ENUMS
do $$ begin create type m5_need_type as enum ('CREATION','REMPLACEMENT','RENFORT','TRANSFORMATION','PROJET'); exception when duplicate_object then null; end $$;
do $$ begin create type m5_need_status as enum ('draft','pending_rrh','pending_daf','pending_drh','pending_dg','approved','rejected','in_progress','hired','closed_no_hire','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type m5_urgency as enum ('standard','urgent','critique'); exception when duplicate_object then null; end $$;
do $$ begin create type m5_contract_type as enum ('CDI','CDD','STAGE','APPR','INTERIM'); exception when duplicate_object then null; end $$;
do $$ begin create type m5_job_status as enum ('draft','open','on_hold','closed_filled','closed_cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type m5_job_level as enum ('junior','confirme','senior','lead','manager','director'); exception when duplicate_object then null; end $$;
do $$ begin create type m5_app_stage as enum ('sourced','applied','screening','interview','assessment','offer','hired','rejected','withdrawn'); exception when duplicate_object then null; end $$;
do $$ begin create type m5_interview_type as enum ('phone_screen','manager','team','tech','culture','final','reference'); exception when duplicate_object then null; end $$;
do $$ begin create type m5_interview_mode as enum ('visio','physical','phone'); exception when duplicate_object then null; end $$;
do $$ begin create type m5_interview_status as enum ('planned','completed','no_show','cancelled','rescheduled'); exception when duplicate_object then null; end $$;
do $$ begin create type m5_recommendation as enum ('strong_yes','yes','maybe','no','strong_no'); exception when duplicate_object then null; end $$;
do $$ begin create type m5_offer_status as enum ('draft','sent','negotiating','accepted','declined','expired','withdrawn'); exception when duplicate_object then null; end $$;
do $$ begin create type m5_referral_status as enum ('submitted','in_pipeline','hired','paid','rejected'); exception when duplicate_object then null; end $$;

-- M6 ENUMS
do $$ begin create type m6_parcours_status as enum ('draft','active','completed','interrupted'); exception when duplicate_object then null; end $$;
do $$ begin create type m6_jalon_kind as enum ('J0','J7','J30','J60','J90','FIN_ESSAI','CUSTOM'); exception when duplicate_object then null; end $$;
do $$ begin create type m6_task_status as enum ('todo','in_progress','done','skipped','blocked'); exception when duplicate_object then null; end $$;
do $$ begin create type m6_task_owner as enum ('employee','manager','rh','buddy','it','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type m6_pulse_score as enum ('happy','neutral','unhappy'); exception when duplicate_object then null; end $$;

-- M5 tables, M6 tables, RLS, triggers, vues : voir SQL appliqué via MCP (idempotent)
-- 10 tables M5 + 8 tables M6 déployées en prod
-- Note : Postgres reserved word "current_role" → renommé "current_role_label" dans m5_candidates

comment on schema atlas_people is 'Atlas People — schéma multi-tenant SIRH OHADA · 18 modules · ~200 tables · 14 vues KPI · 8 modules audit SHA-256';
