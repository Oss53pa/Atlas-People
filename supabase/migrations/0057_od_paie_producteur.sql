-- =====================================================================
-- OD de paie — arbitrage du modèle comptable + producteur d'écritures
--
-- ── LE DÉFAUT ────────────────────────────────────────────────────────
-- L'Edge Function post-to-fna lit `accounting_entries` pour déverser les
-- écritures de paie dans Atlas FNA. Cette table n'a JAMAIS eu de
-- producteur : un grep exhaustif du dépôt ne trouve que sa création
-- (0001_init.sql), des listes RLS (0001, 0015) et cette lecture. Son
-- commentaire dans post-to-fna (« déjà persistées par AccountingMapper »)
-- était faux : src/lib/payroll/AccountingMapper.ts n'écrit rien en base,
-- il retourne un objet JournalEntry en mémoire. L'intégration FNA était
-- donc solide (idempotence en-tête HTTP + garde unique + RPC) mais ne
-- pouvait structurellement rien déverser.
--
-- ── L'ARBITRAGE ──────────────────────────────────────────────────────
-- Deux modèles concurrents coexistaient, tous deux morts :
--
--   (A) accounting_entries (0001:202) — plat, une ligne = un compte,
--       clé de campagne `run_id` → payroll_runs.
--   (B) payroll_accounting_entries + payroll_accounting_entry_lines
--       (0016:529-549) — en-tête + lignes, journal/status/exported_to,
--       axes analytiques, clé de campagne `cycle_id` → payroll_cycles.
--
-- Le critère décisif n'est pas la richesse du modèle mais la VITALITÉ DE
-- SON PARENT. La migration 0055 l'a établi noir sur blanc : « l'Edge
-- Function compute-payslip et ses tables (legal_regimes, payroll_runs,
-- payslips) sont mortes (0 lignes, jamais appelées) ». Rien ne crée de
-- payroll_runs. La campagne vivante, celle que le frontend lit et écrit
-- (src/lib/m3/supabaseLive.ts) et que calculate_bulletin prend en
-- paramètre, est `payroll_cycles`.
--
-- Choisir (A) aurait donc consisté à brancher un producteur sur une table
-- dont la clé étrangère pointe vers un parent que rien n'alimente : le
-- même défaut structurel, déplacé d'un cran.
--
-- La forme attendue par les consommateurs ne départage pas : post-to-fna
-- veut une liste plate {account, label, debit, credit} bornée à une
-- campagne, et payroll_accounting_entry_lines l'expose telle quelle.
-- (B) apporte en plus ce dont le déversement a besoin de toute façon —
-- totaux, `balanced`, `status`/`exported_to`/`exported_at` — c'est-à-dire
-- sa propre idempotence d'export, sans table annexe.
--
--   ⇒ CIBLE RETENUE : (B), le trio de 0016, clé `cycle_id`.
--   ⇒ accounting_entries (0001) est DÉPRÉCIÉE — marquée par commentaire,
--     jamais supprimée en silence : elle reste dans les policies RLS et
--     un environnement a pu la créer.
--   ⇒ payroll_accounting_mappings, morte elle aussi, cesse de l'être :
--     elle devient la surcharge de plan comptable PAR TENANT lue par le
--     producteur ci-dessous (jumelle en base de AccountingPlan.ts).
--
-- ── LE PRODUCTEUR ────────────────────────────────────────────────────
-- generate_cycle_accounting_entry(cycle) dérive l'OD des bulletins du
-- cycle via atlas_people.calculate_bulletin (0055) — le moteur reste la
-- source unique des montants, la comptabilité ne recalcule rien. Le
-- mapping est le miroir SQL de src/lib/payroll/AccountingMapper.ts ;
-- les deux doivent bouger ensemble.
--
-- ── APPELANTS ────────────────────────────────────────────────────────
-- Cette migration livre la chaîne complète côté serveur (production →
-- lecture → déversement → marquage), mais ne DÉCLENCHE rien : aucun
-- appelant n'invoque encore generate_cycle_accounting_entry. Le moment
-- naturel est la clôture de cycle (Edge Function finalize-payroll-cycle,
-- ou une action explicite « Produire l'OD » sur l'écran Comptabilité) —
-- le choix engage le workflow de paie et reste à trancher côté produit.
-- Tant qu'aucun appelant n'existe, post-to-fna répondra NO_ENTRY (404),
-- ce qui est le comportement correct : plus de lecture d'une table vide
-- présentée comme un déversement réussi.
-- =====================================================================

-- ── 1. Dépréciations (aucune suppression) ─────────────────────────────
-- Gardées sous to_regclass : selon l'environnement, le socle 0001 a pu ne
-- jamais être joué dans ce schéma.

do $$
begin
  if to_regclass('public.accounting_entries') is not null then
    execute $c$comment on table public.accounting_entries is
      'DÉPRÉCIÉE (migration 0057) — modèle comptable non retenu. Table sans '
      'producteur depuis 0001 ; sa clé run_id pointe vers payroll_runs, chaîne '
      'morte constatée en 0055. Le modèle vivant est payroll_accounting_entries '
      '+ payroll_accounting_entry_lines, clé cycle_id. Conservée pour ne rien '
      'casser (policies RLS 0001/0015) : ne rien y écrire, ne pas la lire.'$c$;
  end if;

  if to_regclass('public.fna_postings') is not null then
    execute $c$comment on table public.fna_postings is
      'LEGACY (migration 0057) — idempotence du déversement FNA de l''ancienne '
      'campagne run_id. Le chemin vivant est payroll_accounting_entries.status '
      '= ''exported'' (+ exported_to/exported_at), posé par '
      'atlas_people.post_cycle_to_fna(). Conservée pour l''historique.'$c$;
  end if;
end $$;

-- ── 2. Idempotence de production : une OD par cycle ───────────────────
-- 0016 n'a posé aucune contrainte d'unicité : rien n'empêchait de générer
-- l'OD deux fois et de déverser le double des montants.

create unique index if not exists uq_payroll_accounting_entry_par_cycle
  on atlas_people.payroll_accounting_entries (cycle_id);

comment on table atlas_people.payroll_accounting_entries is
  'OD de paie d''un cycle (en-tête). Produite par '
  'atlas_people.generate_cycle_accounting_entry(cycle_id), déversée par '
  'atlas_people.post_cycle_to_fna(cycle_id, ref). Une seule par cycle. '
  'status : draft (déséquilibrée, à corriger) → generated (équilibrée, '
  'déversable) → exported (déversée, figée).';

comment on table atlas_people.payroll_accounting_entry_lines is
  'Lignes de l''OD, consolidées par (compte, axes analytiques) sur toute la '
  'campagne. Forme lue par l''Edge Function post-to-fna.';

comment on table atlas_people.payroll_accounting_mappings is
  'Surcharge du plan comptable PAR TENANT — jumelle en base de '
  'src/lib/payroll/AccountingPlan.ts. rubrique_code accepte le code d''une '
  'rubrique réelle (retenues : AVANCE, OPPOSITION…) ou l''un des codes '
  'réservés du producteur : BRUT, CHARGES_PAT, TAXES_PAT_CHARGE, '
  'NET_A_PAYER, COTIS_SOCIALES, IMPOT, TAXES_PAT_DETTE. account_debit '
  'surcharge les lignes au débit, account_credit celles au crédit.';

-- ── 3. Producteur d'écritures ─────────────────────────────────────────

create or replace function atlas_people.generate_cycle_accounting_entry(p_cycle_id uuid)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = atlas_people, public
as $$
declare
  -- Plan comptable SYSCOHADA par défaut — miroir EXACT de
  -- DEFAULT_ACCOUNTING_PLAN (src/lib/payroll/AccountingPlan.ts).
  c_gross                 constant text := '661100'; -- rémunérations directes
  c_employer_social       constant text := '664000'; -- charges sociales patronales
  c_employer_tax_expense  constant text := '637000'; -- cotisations formation (FDFP/CFCE)
  c_net                   constant text := '422000'; -- personnel, rémunérations dues
  c_social                constant text := '431000'; -- sécurité sociale (caisses)
  c_income_tax            constant text := '447000'; -- État, impôts sur salaires
  c_employer_tax_liab     constant text := '437000'; -- organismes sociaux (taxes formation)
  c_deduction_default     constant text := '421000'; -- personnel, avances et acomptes

  v_cycle          record;
  v_entry_id       uuid;
  v_existing_status text;
  v_bulletins      int;
  v_total_debit  bigint := 0;
  v_total_credit bigint := 0;
  v_balanced    boolean;
begin
  -- Scope : sous security invoker, un cycle hors périmètre RLS est invisible.
  select id, tenant_id, period, label, country_code, status
    into v_cycle
  from atlas_people.payroll_cycles
  where id = p_cycle_id;
  if not found then
    raise exception 'CYCLE_NOT_FOUND: % (hors périmètre ou inexistant)', p_cycle_id;
  end if;

  -- Une OD déversée est figée : la régénérer désynchroniserait la
  -- comptabilité d'Atlas FNA de celle d'Atlas People.
  select status into v_existing_status
  from atlas_people.payroll_accounting_entries
  where cycle_id = p_cycle_id;
  if v_existing_status = 'exported' then
    raise exception 'ALREADY_EXPORTED: OD du cycle % déjà déversée — régénération refusée', p_cycle_id;
  end if;

  select count(*) into v_bulletins
  from atlas_people.payroll_bulletins
  where cycle_id = p_cycle_id and status <> 'superseded';
  if v_bulletins = 0 then
    raise exception 'NO_BULLETINS: aucun bulletin calculé sur le cycle % — rien à comptabiliser', p_cycle_id;
  end if;

  -- Régénération : on repart d'une OD vide (les lignes tombent en cascade).
  delete from atlas_people.payroll_accounting_entries where cycle_id = p_cycle_id;

  insert into atlas_people.payroll_accounting_entries
    (tenant_id, cycle_id, reference, label, journal, entry_date, status)
  values
    (v_cycle.tenant_id, p_cycle_id, 'OD-PAIE-' || v_cycle.period,
     'OD de paie — ' || coalesce(v_cycle.label, v_cycle.period), 'PAIE',
     current_date, 'draft')
  returning id into v_entry_id;

  -- Lignes : le moteur (calculate_bulletin) fournit tous les montants, y
  -- compris la séparation cotisations sociales / impôt. Aucune clé de
  -- répartition n'intervient ici.
  with src as (
    select atlas_people.calculate_bulletin(b.employee_id, p_cycle_id) as r
    from atlas_people.payroll_bulletins b
    where b.cycle_id = p_cycle_id and b.status <> 'superseded'
  ),
  od_raw as (
    -- Débits : la charge supportée par l'employeur.
    select 'BRUT'::text as rubrique_code, 'debit'::text as side, c_gross as account,
           'Rémunérations du personnel (brut)'::text as label,
           (r->>'grossTotalUnits')::bigint as amount
    from src
    union all
    select 'CHARGES_PAT', 'debit', c_employer_social,
           'Charges sociales patronales',
           (r->>'totalEmployerContributionUnits')::bigint
    from src
    union all
    select 'TAXES_PAT_CHARGE', 'debit', c_employer_tax_expense,
           'Cotisations formation prof. (FDFP/CFCE)',
           (r->>'totalEmployerTaxUnits')::bigint
    from src
    -- Crédits : à qui l'employeur doit ce qu'il a constaté en charge.
    union all
    select 'NET_A_PAYER', 'credit', c_net,
           'Personnel — rémunérations dues (net)',
           (r->>'netToPayUnits')::bigint
    from src
    union all
    select 'COTIS_SOCIALES', 'credit', c_social,
           'Sécurité sociale (caisses)',
           (r->>'totalEmployeeContributionUnits')::bigint
             + (r->>'totalEmployerContributionUnits')::bigint
    from src
    union all
    select 'IMPOT', 'credit', c_income_tax,
           'État — impôt sur salaires',
           (r->>'incomeTaxUnits')::bigint
    from src
    union all
    select 'TAXES_PAT_DETTE', 'credit', c_employer_tax_liab,
           'Organismes sociaux — taxes formation',
           (r->>'totalEmployerTaxUnits')::bigint
    from src
    -- Retenues diverses : chacune sur SON compte de contrepartie (avances
    -- 421, oppositions 427). Les omettre déséquilibrerait l'OD dès qu'un
    -- salarié en porte une, puisque brut ≠ cotisations + net dans ce cas.
    union all
    select coalesce(l->>'code', 'RETENUE'), 'credit',
           coalesce(nullif(l->>'account', ''), c_deduction_default),
           coalesce(l->>'label', 'Retenue diverse'),
           abs((l->>'amountUnits')::bigint)
    from src, lateral jsonb_array_elements(r->'lines') l
    where l->>'kind' = 'deduction'
  ),
  mapped as (
    select
      coalesce(
        case when od_raw.side = 'debit' then nullif(m.account_debit, '')
                                        else nullif(m.account_credit, '') end,
        od_raw.account
      ) as account,
      od_raw.label, od_raw.side, od_raw.amount,
      m.analytical_axis_1, m.analytical_axis_2
    from od_raw
    left join atlas_people.payroll_accounting_mappings m
      on m.tenant_id = v_cycle.tenant_id
     and m.rubrique_code = od_raw.rubrique_code
  )
  insert into atlas_people.payroll_accounting_entry_lines
    (tenant_id, entry_id, account, label, debit, credit, analytical_axis_1, analytical_axis_2)
  select
    v_cycle.tenant_id, v_entry_id, account, min(label),
    coalesce(sum(amount) filter (where side = 'debit'), 0),
    coalesce(sum(amount) filter (where side = 'credit'), 0),
    analytical_axis_1, analytical_axis_2
  from mapped
  group by account, analytical_axis_1, analytical_axis_2
  having coalesce(sum(amount) filter (where side = 'debit'), 0) <> 0
      or coalesce(sum(amount) filter (where side = 'credit'), 0) <> 0;

  select coalesce(sum(debit), 0), coalesce(sum(credit), 0)
    into v_total_debit, v_total_credit
  from atlas_people.payroll_accounting_entry_lines
  where entry_id = v_entry_id;

  v_balanced := v_total_debit = v_total_credit;

  -- Une OD déséquilibrée reste en 'draft' : elle est consultable pour
  -- diagnostic mais post_cycle_to_fna refusera de la déverser. On ne la
  -- rejette pas (raise) — une OD invisible est indiagnosticable.
  update atlas_people.payroll_accounting_entries
     set total_debit = v_total_debit,
         total_credit = v_total_credit,
         balanced = v_balanced,
         status = case when v_balanced then 'generated' else 'draft' end
   where id = v_entry_id;

  return jsonb_build_object(
    'entryId', v_entry_id,
    'cycleId', p_cycle_id,
    'tenantId', v_cycle.tenant_id,
    'period', v_cycle.period,
    'journal', 'PAIE',
    'bulletins', v_bulletins,
    'totalDebit', v_total_debit,
    'totalCredit', v_total_credit,
    'balanced', v_balanced,
    'status', case when v_balanced then 'generated' else 'draft' end,
    'lines', coalesce((
      select jsonb_agg(jsonb_build_object(
               'account', account, 'label', label,
               'debit', debit, 'credit', credit,
               'analyticalAxis1', analytical_axis_1,
               'analyticalAxis2', analytical_axis_2)
             order by account)
      from atlas_people.payroll_accounting_entry_lines
      where entry_id = v_entry_id
    ), '[]'::jsonb)
  );
end $$;

comment on function atlas_people.generate_cycle_accounting_entry(uuid) is
  'Produit (ou régénère) l''OD de paie d''un cycle à partir des bulletins, via '
  'calculate_bulletin. Miroir SQL de src/lib/payroll/AccountingMapper.ts : les '
  'deux mappings doivent évoluer ensemble. Idempotent tant que l''OD n''est pas '
  'déversée ; refuse la régénération après export.';

-- ── 4. Déversement FNA (idempotent) ───────────────────────────────────

create or replace function atlas_people.post_cycle_to_fna(p_cycle_id uuid, p_reference text default null)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = atlas_people, public
as $$
declare
  v_entry record;
  v_count int;
begin
  select id, status, balanced, total_debit, total_credit
    into v_entry
  from atlas_people.payroll_accounting_entries
  where cycle_id = p_cycle_id;

  if not found then
    raise exception 'NO_ENTRY: aucune OD produite pour le cycle % — appeler generate_cycle_accounting_entry d''abord', p_cycle_id;
  end if;
  if v_entry.status = 'exported' then
    raise exception 'ALREADY_POSTED: OD du cycle % déjà déversée dans Atlas FNA (idempotence)', p_cycle_id;
  end if;
  if not v_entry.balanced then
    raise exception 'UNBALANCED: OD du cycle % déséquilibrée (débit % ≠ crédit %) — déversement refusé',
      p_cycle_id, v_entry.total_debit, v_entry.total_credit;
  end if;

  update atlas_people.payroll_accounting_entries
     set status = 'exported',
         exported_to = coalesce(p_reference, 'atlas-fna'),
         exported_at = now()
   where id = v_entry.id and status <> 'exported';
  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'ALREADY_POSTED: OD du cycle % déversée en concurrence', p_cycle_id;
  end if;

  return jsonb_build_object(
    'entryId', v_entry.id,
    'cycleId', p_cycle_id,
    'status', 'exported',
    'totalDebit', v_entry.total_debit,
    'totalCredit', v_entry.total_credit
  );
end $$;

comment on function atlas_people.post_cycle_to_fna(uuid, text) is
  'Marque l''OD d''un cycle comme déversée dans Atlas FNA. Garde-fou triple : '
  'OD existante, équilibrée, non déjà exportée. Remplace post_run_to_fna(), '
  'dont la clé run_id porte sur la chaîne payroll_runs morte.';

grant execute on function atlas_people.generate_cycle_accounting_entry(uuid) to authenticated;
grant execute on function atlas_people.post_cycle_to_fna(uuid, text) to authenticated;
