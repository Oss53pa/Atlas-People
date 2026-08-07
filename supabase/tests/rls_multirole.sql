-- ============================================================================
-- RECETTE RLS MULTI-RÔLES — Atlas People (schéma atlas_people)
-- ----------------------------------------------------------------------------
-- Vérifie, en impersonant chaque rôle, que les policies RLS (migration 0015
-- « RLS rôle-aware » + isolation tenant 0001) appliquent bien la charte de
-- confidentialité, PAR TIER :
--
--   Tier 1  payroll_runs .................. RH/admin UNIQUEMENT
--   Tier 2  family_members ............... SELF + RH, JAMAIS le manager
--   Tier 3  time_entries ................. SELF + manager N-1 + RH
--   Tier 5  disciplinary_actions ......... SELF + RH, JAMAIS le manager
--   employees (la fiche) ................. SELF + manager N-1 + RH (lecture)
--                                          écriture RH/admin UNIQUEMENT
--   Isolation tenant ..................... aucun rôle ne traverse son tenant
--
-- MÉCANIQUE
--   • Fixtures créées en tant que `postgres` (propriétaire → bypass RLS setup),
--     dans 2 tenants jetables.
--   • Chaque rôle est impersoné via `request.jwt.claims.sub` + `SET ROLE
--     authenticated` → `auth.uid()` reflète l'utilisateur, la RLS s'applique.
--   • Lectures : `count(*)` de lignes visibles → comparé à l'attendu.
--   • Écritures : tentative INSERT/UPDATE → l'échec RLS attendu est capturé.
--
-- ZÉRO PERSISTANCE
--   Le bloc DO se termine TOUJOURS par un RAISE : succès → 'RLS_RECETTE_PASS',
--   échec → 'RLS_RECETTE_FAIL'. Dans les deux cas l'exception annule (rollback)
--   la totalité des fixtures. Le rollback est INTENTIONNEL — un P0001
--   'RLS_RECETTE_PASS' signale le SUCCÈS.
--
-- EXÉCUTION
--   psql "$DATABASE_URL" -f supabase/tests/rls_multirole.sql
--   (ou via Supabase MCP execute_sql) — lire le message de l'exception finale.
-- ============================================================================

do $$
declare
  -- tenants
  tA uuid; tB uuid;
  -- users (auth.users.id) et employés (atlas_people.employees.id)
  uMgr uuid := gen_random_uuid(); eMgr uuid;
  uRep uuid := gen_random_uuid(); eRep uuid;   -- N-1 de uMgr
  uOth uuid := gen_random_uuid(); eOth uuid;   -- collègue, hors équipe de uMgr
  uHr  uuid := gen_random_uuid();
  uBhr uuid := gen_random_uuid();              -- RH du tenant B (cross-tenant)
  -- accumulateurs
  checks int := 0;
  fails  text := '';
  n int;
begin
  -- ── FIXTURES (as postgres, RLS bypass) ────────────────────────────────────
  insert into atlas_people.tenants(name, zone, currency)
    select 'RECETTE-RLS-A', zone, currency from atlas_people.tenants limit 1
    returning id into tA;
  insert into atlas_people.tenants(name, zone, currency)
    select 'RECETTE-RLS-B', zone, currency from atlas_people.tenants limit 1
    returning id into tB;

  -- auth.users (FK cible de memberships/employees)
  insert into auth.users (id, aud, role, email, instance_id, created_at, updated_at)
  values
    (uMgr,'authenticated','authenticated',uMgr::text||'@recette.test','00000000-0000-0000-0000-000000000000',now(),now()),
    (uRep,'authenticated','authenticated',uRep::text||'@recette.test','00000000-0000-0000-0000-000000000000',now(),now()),
    (uOth,'authenticated','authenticated',uOth::text||'@recette.test','00000000-0000-0000-0000-000000000000',now(),now()),
    (uHr ,'authenticated','authenticated',uHr ::text||'@recette.test','00000000-0000-0000-0000-000000000000',now(),now()),
    (uBhr,'authenticated','authenticated',uBhr::text||'@recette.test','00000000-0000-0000-0000-000000000000',now(),now());

  -- employés du tenant A (le manager, son N-1, un collègue hors équipe)
  insert into atlas_people.employees(tenant_id, user_id, first_name, last_name, country_code)
    values (tA, uMgr, 'Manager','Recette','CI') returning id into eMgr;
  insert into atlas_people.employees(tenant_id, user_id, first_name, last_name, country_code, manager_id)
    values (tA, uRep, 'Report','Recette','CI', eMgr) returning id into eRep;
  insert into atlas_people.employees(tenant_id, user_id, first_name, last_name, country_code)
    values (tA, uOth, 'Other','Recette','CI') returning id into eOth;

  -- tenant_memberships = source d'appartenance/rôle (cf. current_tenant_ids /
  -- is_hr_or_admin). Le rôle MSS « manager » vient de la hiérarchie employees,
  -- pas du membership. Rôles privilégiés RH/admin : super_admin | admin | hr.
  -- (Sans ligne ici, current_tenant_ids() retomberait sur un tenant par défaut.)
  insert into atlas_people.tenant_memberships(user_id, tenant_id, role) values
    (uMgr, tA, 'employee'),
    (uRep, tA, 'employee'),
    (uOth, tA, 'employee'),
    (uHr , tA, 'hr'),
    (uBhr, tB, 'hr');

  -- données sensibles rattachées au N-1 (eRep)
  insert into atlas_people.time_entries(tenant_id, employee_id, work_date)
    values (tA, eRep, current_date);                                    -- Tier 3
  insert into atlas_people.family_members(tenant_id, employee_id, member_type, last_name, first_names)
    values (tA, eRep, 'spouse', 'Recette', 'Conjoint');                 -- Tier 2
  insert into atlas_people.disciplinary_actions(tenant_id, employee_id, action_type, prev_hash, hash)
    values (tA, eRep, 'warning', 'GENESIS', 'RECETTE_HASH');            -- Tier 5
  insert into atlas_people.payroll_runs(tenant_id, period, country_code)
    values (tA, '2026-08', 'CI');                                       -- Tier 1
  insert into atlas_people.payroll_runs(tenant_id, period, country_code)
    values (tB, '2026-08', 'CI');                                       -- pour cross-tenant

  -- ── ASSERTIONS LECTURE ────────────────────────────────────────────────────
  -- Macro maison via EXECUTE : impersone `who`, compte, compare.
  -- (répété inline car PL/pgSQL n'autorise pas les sous-fonctions locales)

  -- employees (la fiche) — visibilité lecture
  --   manager voit self + N-1 (= 2), pas le collègue hors équipe
  perform set_config('request.jwt.claims', json_build_object('sub',uMgr,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.employees where tenant_id=$1' into n using tA;
  execute 'reset role';
  checks:=checks+1; if n<>2 then fails:=fails||format(E'\n- employees: manager voit %s employés (attendu 2 = self+N-1)', n); end if;

  --   N-1 (employee) ne voit que lui-même
  perform set_config('request.jwt.claims', json_build_object('sub',uRep,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.employees where tenant_id=$1' into n using tA;
  execute 'reset role';
  checks:=checks+1; if n<>1 then fails:=fails||format(E'\n- employees: employé voit %s employés (attendu 1 = self)', n); end if;

  --   RH voit tout le tenant (3)
  perform set_config('request.jwt.claims', json_build_object('sub',uHr,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.employees where tenant_id=$1' into n using tA;
  execute 'reset role';
  checks:=checks+1; if n<>3 then fails:=fails||format(E'\n- employees: RH voit %s employés (attendu 3)', n); end if;

  -- Tier 3 time_entries (du N-1) : self, manager N-1, RH = 1 ; collègue = 0
  perform set_config('request.jwt.claims', json_build_object('sub',uRep,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.time_entries where employee_id=$1' into n using eRep;
  execute 'reset role';
  checks:=checks+1; if n<>1 then fails:=fails||format(E'\n- Tier3 time_entries: SELF voit %s (attendu 1)', n); end if;

  perform set_config('request.jwt.claims', json_build_object('sub',uMgr,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.time_entries where employee_id=$1' into n using eRep;
  execute 'reset role';
  checks:=checks+1; if n<>1 then fails:=fails||format(E'\n- Tier3 time_entries: manager N-1 voit %s (attendu 1)', n); end if;

  perform set_config('request.jwt.claims', json_build_object('sub',uOth,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.time_entries where employee_id=$1' into n using eRep;
  execute 'reset role';
  checks:=checks+1; if n<>0 then fails:=fails||format(E'\n- Tier3 time_entries: collègue hors équipe voit %s (attendu 0)', n); end if;

  -- Tier 2 family_members : self + RH = 1 ; manager N-1 = 0 (JAMAIS)
  perform set_config('request.jwt.claims', json_build_object('sub',uRep,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.family_members where employee_id=$1' into n using eRep;
  execute 'reset role';
  checks:=checks+1; if n<>1 then fails:=fails||format(E'\n- Tier2 family_members: SELF voit %s (attendu 1)', n); end if;

  perform set_config('request.jwt.claims', json_build_object('sub',uMgr,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.family_members where employee_id=$1' into n using eRep;
  execute 'reset role';
  checks:=checks+1; if n<>0 then fails:=fails||format(E'\n- Tier2 family_members: manager N-1 voit %s (FUITE — attendu 0)', n); end if;

  perform set_config('request.jwt.claims', json_build_object('sub',uHr,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.family_members where employee_id=$1' into n using eRep;
  execute 'reset role';
  checks:=checks+1; if n<>1 then fails:=fails||format(E'\n- Tier2 family_members: RH voit %s (attendu 1)', n); end if;

  -- Tier 5 disciplinary_actions : self + RH = 1 ; manager N-1 = 0 (JAMAIS)
  perform set_config('request.jwt.claims', json_build_object('sub',uMgr,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.disciplinary_actions where employee_id=$1' into n using eRep;
  execute 'reset role';
  checks:=checks+1; if n<>0 then fails:=fails||format(E'\n- Tier5 disciplinary: manager N-1 voit %s (FUITE — attendu 0)', n); end if;

  perform set_config('request.jwt.claims', json_build_object('sub',uRep,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.disciplinary_actions where employee_id=$1' into n using eRep;
  execute 'reset role';
  checks:=checks+1; if n<>1 then fails:=fails||format(E'\n- Tier5 disciplinary: SELF voit %s (attendu 1)', n); end if;

  -- Tier 1 payroll_runs : RH = 1 ; manager & employé = 0
  perform set_config('request.jwt.claims', json_build_object('sub',uHr,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.payroll_runs where tenant_id=$1' into n using tA;
  execute 'reset role';
  checks:=checks+1; if n<>1 then fails:=fails||format(E'\n- Tier1 payroll_runs: RH voit %s (attendu 1)', n); end if;

  perform set_config('request.jwt.claims', json_build_object('sub',uMgr,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.payroll_runs where tenant_id=$1' into n using tA;
  execute 'reset role';
  checks:=checks+1; if n<>0 then fails:=fails||format(E'\n- Tier1 payroll_runs: manager voit %s (FUITE — attendu 0)', n); end if;

  perform set_config('request.jwt.claims', json_build_object('sub',uRep,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.payroll_runs where tenant_id=$1' into n using tA;
  execute 'reset role';
  checks:=checks+1; if n<>0 then fails:=fails||format(E'\n- Tier1 payroll_runs: employé voit %s (FUITE — attendu 0)', n); end if;

  -- ── ISOLATION TENANT ──────────────────────────────────────────────────────
  --   RH du tenant B ne voit AUCUN employé / payroll du tenant A
  perform set_config('request.jwt.claims', json_build_object('sub',uBhr,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.employees where tenant_id=$1' into n using tA;
  checks:=checks+1; if n<>0 then fails:=fails||format(E'\n- Cross-tenant: RH(B) voit %s employés de A (FUITE — attendu 0)', n); end if;
  execute 'select count(*) from atlas_people.payroll_runs where tenant_id=$1' into n using tA;
  execute 'reset role';
  checks:=checks+1; if n<>0 then fails:=fails||format(E'\n- Cross-tenant: RH(B) voit %s payroll de A (FUITE — attendu 0)', n); end if;

  --   RH du tenant A ne voit pas le payroll du tenant B
  perform set_config('request.jwt.claims', json_build_object('sub',uHr,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  execute 'select count(*) from atlas_people.payroll_runs where tenant_id=$1' into n using tB;
  execute 'reset role';
  checks:=checks+1; if n<>0 then fails:=fails||format(E'\n- Cross-tenant: RH(A) voit %s payroll de B (FUITE — attendu 0)', n); end if;

  -- ── ASSERTIONS ÉCRITURE (WITH CHECK) ──────────────────────────────────────
  --   Un employé ne peut PAS modifier sa propre fiche (salaire) — écriture RH only.
  perform set_config('request.jwt.claims', json_build_object('sub',uRep,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    execute 'update atlas_people.employees set base_salary = base_salary + 1 where id=$1' using eRep;
    -- si aucune exception : la ligne a-t-elle été modifiée ? (0 ligne = bloqué par USING)
    get diagnostics n = row_count;
    if n > 0 then fails:=fails||E'\n- Écriture: employé a modifié sa fiche (ATTENDU: refus)'; end if;
    checks:=checks+1;
  exception when insufficient_privilege or others then
    -- refus RLS attendu (new row violates row-level security policy)
    checks:=checks+1;
  end;
  execute 'reset role';

  --   Un employé ne peut PAS créer un payroll_run (Tier 1 RH only).
  perform set_config('request.jwt.claims', json_build_object('sub',uRep,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    execute 'insert into atlas_people.payroll_runs(tenant_id,period,country_code) values ($1,$2,$3)'
      using tA, '2026-09', 'CI';
    fails:=fails||E'\n- Écriture: employé a créé un payroll_run (ATTENDU: refus)';
    checks:=checks+1;
  exception when others then
    checks:=checks+1; -- refus attendu
  end;
  execute 'reset role';

  --   Un manager ne peut PAS créer une family_member pour son N-1 (Tier 2 self/RH).
  perform set_config('request.jwt.claims', json_build_object('sub',uMgr,'role','authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    execute 'insert into atlas_people.family_members(tenant_id,employee_id,member_type,last_name,first_names) values ($1,$2,$3,$4,$5)'
      using tA, eRep, 'child', 'Recette', 'Enfant';
    fails:=fails||E'\n- Écriture: manager a créé une donnée famille du N-1 (ATTENDU: refus)';
    checks:=checks+1;
  exception when others then
    checks:=checks+1; -- refus attendu
  end;
  execute 'reset role';

  -- ── VERDICT (rollback via RAISE dans les deux cas) ─────────────────────────
  if fails = '' then
    raise exception 'RLS_RECETTE_PASS: % contrôles OK (lecture par tier + écriture + isolation tenant). Rollback intentionnel.', checks;
  else
    raise exception 'RLS_RECETTE_FAIL (% contrôles) :%', checks, fails;
  end if;
end $$;
