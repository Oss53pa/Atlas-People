-- =====================================================================
-- V6 · Moteur de paie unifié — RPC calculate_bulletin(employee_id, cycle_id)
--
-- Contexte : le calcul de bulletin existait en DEUX copies maintenues à la
-- main (src/lib/payroll/PayrollEngine.ts côté front, supabase/functions/
-- _shared/payroll.ts côté Edge Function) censées rester identiques pour
-- garantir la cohérence du hash d'audit — sans aucune garantie mécanique.
-- L'Edge Function compute-payslip et ses tables (legal_regimes,
-- payroll_runs, payslips) sont mortes (0 ligne, jamais appelées).
--
-- Cette RPC devient la SEULE source de vérité du calcul, en Postgres,
-- lue aussi bien par le frontend (aperçu live) que par tout traitement
-- serveur (clôture de cycle). Elle lit le régime-pays depuis les tables
-- déjà vivantes et alimentées par le frontend (useRegime.ts) :
-- payroll_regime_configs / payroll_contributions / payroll_tax_brackets /
-- payroll_employer_taxes — PAS les payroll_baremes génériques (0051) qui
-- ne sont consommées par aucun code et divergent sur certains taux
-- (PF/FDFP_FC) : réconciliation légale à faire séparément (voir tâche).
--
-- Arithmétique : francs entiers uniquement (règle dure cahier §2.3), même
-- convention que Money.ts (bigint + arrondi half-up symétrique).
-- =====================================================================

-- ── Helpers monétaires (miroir exact de src/lib/money.ts) ──────────────

create or replace function atlas_people.money_round(p_value numeric)
returns bigint
language sql immutable as $$
  select case
    when p_value >= 0 then floor(p_value + 0.5)
    else -floor(-p_value + 0.5)
  end::bigint;
$$;

create or replace function atlas_people.apply_rate_bps(p_units bigint, p_bps int)
returns bigint
language sql immutable as $$
  select atlas_people.money_round(p_units::numeric * p_bps / 10000.0);
$$;

create or replace function atlas_people.divide_int(p_units bigint, p_n int)
returns bigint
language sql immutable as $$
  select atlas_people.money_round(p_units::numeric / p_n);
$$;

-- ── Barème progressif marginal (miroir de computeProgressiveTax) ───────
-- Implémentation PROCÉDURALE (boucle + accumulateur), volontairement
-- distincte de la vérification indépendante ci-dessous (set-based).
create or replace function atlas_people.progressive_tax(p_regime_id uuid, p_taxable bigint)
returns bigint
language plpgsql immutable as $$
declare
  v_tax bigint := 0;
  v_prev_ceiling bigint := 0;
  v_upper bigint;
  v_slice_top bigint;
  v_slice bigint;
  r record;
begin
  for r in
    select up_to, rate_bps from atlas_people.payroll_tax_brackets
    where regime_id = p_regime_id
    order by sort_order
  loop
    v_upper := coalesce(r.up_to / 100, 9223372036854775807);
    v_slice_top := least(p_taxable, v_upper);
    v_slice := v_slice_top - v_prev_ceiling;
    if v_slice <= 0 then
      if p_taxable <= v_upper then exit; end if;
      v_prev_ceiling := v_upper;
      continue;
    end if;
    v_tax := v_tax + atlas_people.apply_rate_bps(v_slice, r.rate_bps);
    v_prev_ceiling := v_upper;
    exit when p_taxable <= v_upper;
  end loop;
  return v_tax;
end;
$$;

-- ── Vérification indépendante de l'impôt (set-based, chemin distinct) ──
create or replace function atlas_people.progressive_tax_verify(p_regime_id uuid, p_taxable bigint)
returns bigint
language sql stable as $$
  with b as (
    select
      coalesce(up_to / 100, 'Infinity'::numeric) as ceil_francs,
      lag(up_to / 100) over (order by sort_order) as floor_francs,
      rate_bps
    from atlas_people.payroll_tax_brackets
    where regime_id = p_regime_id
  ),
  widths as (
    select
      greatest(0, least(p_taxable::numeric, ceil_francs) - coalesce(floor_francs, 0)) as width,
      rate_bps
    from b
  )
  select coalesce(sum(atlas_people.apply_rate_bps(width::bigint, rate_bps)), 0)::bigint
  from widths
  where width > 0;
$$;

-- ── RPC principale ──────────────────────────────────────────────────────

create or replace function atlas_people.calculate_bulletin(p_employee_id uuid, p_cycle_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = atlas_people, public
as $$
declare
  v_emp        record;
  v_cycle      record;
  v_inputs     record;
  v_regime_id  uuid;
  v_regime     record;

  v_prorata_pct        numeric := 1;
  v_base_salary         bigint;
  v_overtime_taxable     bigint := 0;
  v_bonus_taxable        bigint := 0;
  v_bonus_non_taxable    bigint := 0;
  v_taxable_allowances   bigint;
  v_non_taxable_allowances bigint;
  v_gross_taxable        bigint;
  v_gross_total          bigint;

  v_total_employee_contrib bigint := 0;
  v_total_employer_contrib bigint := 0;
  v_after_social  bigint;
  v_abatement     bigint;
  v_net_taxable   bigint;
  v_fiscal_parts  int;
  v_taxable_per_part bigint;
  v_tax_per_part     bigint;
  v_income_tax       bigint;
  v_total_other_deductions bigint := 0;
  v_total_employer_tax     bigint := 0;
  v_net_to_pay    bigint;
  v_employer_cost bigint;

  v_lines jsonb := '[]'::jsonb;
  v_deduction_lines jsonb := '[]'::jsonb;

  -- vérification indépendante
  v_verify_employee_contrib bigint;
  v_verify_income_tax       bigint;
  v_verify_net_to_pay       bigint;
  v_discrepancies jsonb := '[]'::jsonb;

  v_anomalies jsonb := '[]'::jsonb;
  v_smig bigint;
  v_c record;
  v_t record;
  v_d record;
  v_inputs_found boolean;
begin
  -- 1) Employé + cycle (même tenant, jamais inférés).
  select id, tenant_id, country_code, base_salary, taxable_allowances,
         non_taxable_allowances, fiscal_parts
    into v_emp
  from atlas_people.employees
  where id = p_employee_id;
  if not found then
    raise exception 'EMPLOYEE_NOT_FOUND: %', p_employee_id;
  end if;

  select id, tenant_id, period, country_code
    into v_cycle
  from atlas_people.payroll_cycles
  where id = p_cycle_id and tenant_id = v_emp.tenant_id;
  if not found then
    raise exception 'CYCLE_NOT_FOUND: % (tenant %)', p_cycle_id, v_emp.tenant_id;
  end if;

  -- 2) Variables du mois (payroll_inputs) — optionnelles, défaut mois plein.
  select jours_ouvrables, jours_travailles
    into v_inputs
  from atlas_people.payroll_inputs
  where cycle_id = p_cycle_id and employee_id = p_employee_id;
  v_inputs_found := found;

  if v_inputs_found and v_inputs.jours_ouvrables is not null and v_inputs.jours_ouvrables > 0
     and v_inputs.jours_travailles is not null and v_inputs.jours_travailles < v_inputs.jours_ouvrables then
    v_prorata_pct := least(1, v_inputs.jours_travailles / v_inputs.jours_ouvrables);
  end if;

  v_base_salary := atlas_people.money_round(v_emp.base_salary * v_prorata_pct);

  -- 3) Heures supplémentaires (toujours imposables — miroir m3PayrollInput).
  select coalesce(sum(coalesce(amount, 0)), 0) into v_overtime_taxable
  from atlas_people.payroll_inputs_overtime
  where cycle_id = p_cycle_id and employee_id = p_employee_id;

  -- 4) Primes/bonus — taxabilité résolue via la rubrique catalogue (enters_base_irpp).
  select
    coalesce(sum(coalesce(b.amount, 0)) filter (where coalesce(r.enters_base_irpp, true)), 0),
    coalesce(sum(coalesce(b.amount, 0)) filter (where not coalesce(r.enters_base_irpp, true)), 0)
  into v_bonus_taxable, v_bonus_non_taxable
  from atlas_people.payroll_inputs_bonuses b
  left join atlas_people.payroll_rubriques r
    on r.tenant_id = v_emp.tenant_id and r.code = b.rubrique_code and r.status = 'published'
  where b.cycle_id = p_cycle_id and b.employee_id = p_employee_id;

  v_taxable_allowances := atlas_people.money_round(v_emp.taxable_allowances * v_prorata_pct)
                           + v_overtime_taxable + v_bonus_taxable;
  v_non_taxable_allowances := atlas_people.money_round(v_emp.non_taxable_allowances * v_prorata_pct)
                               + v_bonus_non_taxable;

  v_gross_taxable := v_base_salary + v_taxable_allowances;
  v_gross_total := v_gross_taxable + v_non_taxable_allowances;

  v_lines := v_lines || jsonb_build_object(
    'code', 'SAL_BASE', 'label', 'Salaire de base', 'kind', 'earning',
    'baseUnits', v_base_salary, 'amountUnits', v_base_salary
  );
  if v_taxable_allowances <> 0 then
    v_lines := v_lines || jsonb_build_object(
      'code', 'PRIME_IMP', 'label', 'Primes imposables', 'kind', 'earning',
      'baseUnits', v_taxable_allowances, 'amountUnits', v_taxable_allowances
    );
  end if;
  if v_non_taxable_allowances <> 0 then
    v_lines := v_lines || jsonb_build_object(
      'code', 'IND_TRANSP', 'label', 'Indemnités non imposables', 'kind', 'earning',
      'baseUnits', v_non_taxable_allowances, 'amountUnits', v_non_taxable_allowances
    );
  end if;

  -- 5) Régime-pays (source unique : payroll_regime_configs, cf. useRegime.ts).
  select id, currency, version, income_tax_code, income_tax_label, abatement_bps
    into v_regime
  from atlas_people.payroll_regime_configs
  where tenant_id = v_emp.tenant_id and country_code = v_emp.country_code and is_active
  order by effective_from desc
  limit 1;
  if not found then
    raise exception 'REGIME_NOT_FOUND: tenant % pays %', v_emp.tenant_id, v_emp.country_code;
  end if;
  v_regime_id := v_regime.id;

  -- 6) Cotisations sociales (boucle procédurale — chemin primaire).
  for v_c in
    select code, label, base_type, ceiling, employee_bps, employer_bps
    from atlas_people.payroll_contributions
    where regime_id = v_regime_id and is_active
    order by sort_order
  loop
    declare
      v_base bigint;
      v_amt bigint;
    begin
      v_base := case when v_c.base_type = 'capped' and v_c.ceiling is not null
                     then least(v_gross_taxable, v_c.ceiling / 100)
                     else v_gross_taxable end;
      if v_c.employee_bps > 0 then
        v_amt := atlas_people.apply_rate_bps(v_base, v_c.employee_bps);
        v_total_employee_contrib := v_total_employee_contrib + v_amt;
        v_lines := v_lines || jsonb_build_object(
          'code', v_c.code, 'label', v_c.label, 'kind', 'employee_contribution',
          'baseUnits', v_base, 'rateBps', v_c.employee_bps, 'amountUnits', -v_amt
        );
      end if;
      if v_c.employer_bps > 0 then
        v_amt := atlas_people.apply_rate_bps(v_base, v_c.employer_bps);
        v_total_employer_contrib := v_total_employer_contrib + v_amt;
        v_lines := v_lines || jsonb_build_object(
          'code', v_c.code || '_PAT', 'label', v_c.label || ' (part patronale)', 'kind', 'employer_contribution',
          'baseUnits', v_base, 'rateBps', v_c.employer_bps, 'amountUnits', v_amt
        );
      end if;
    end;
  end loop;

  -- 7) Impôt sur le revenu (cotisations déductibles + abattement + quotient familial).
  v_after_social := greatest(v_gross_taxable - v_total_employee_contrib, 0);
  v_abatement := case when coalesce(v_regime.abatement_bps, 0) > 0
                      then atlas_people.apply_rate_bps(v_after_social, v_regime.abatement_bps)
                      else 0 end;
  v_net_taxable := greatest(v_after_social - v_abatement, 0);
  v_fiscal_parts := greatest(1, round(coalesce(v_emp.fiscal_parts, 1)));
  v_taxable_per_part := atlas_people.divide_int(v_net_taxable, v_fiscal_parts);
  v_tax_per_part := atlas_people.progressive_tax(v_regime_id, v_taxable_per_part);
  v_income_tax := v_tax_per_part * v_fiscal_parts;

  v_lines := v_lines || jsonb_build_object(
    'code', v_regime.income_tax_code, 'label', v_regime.income_tax_label, 'kind', 'tax',
    'baseUnits', v_net_taxable, 'amountUnits', -v_income_tax
  );

  -- 8) Retenues diverses (avances, oppositions, exceptionnelles — après impôt).
  for v_d in
    select rubrique_code as code, label, coalesce(amount, 0) as amount, payload->>'account' as account
    from atlas_people.payroll_inputs_exceptional_deductions
    where cycle_id = p_cycle_id and employee_id = p_employee_id
    union all
    select rubrique_code as code, label, coalesce(amount, 0) as amount, payload->>'account' as account
    from atlas_people.payroll_inputs_advances_deduction
    where cycle_id = p_cycle_id and employee_id = p_employee_id
  loop
    v_total_other_deductions := v_total_other_deductions + v_d.amount;
    v_lines := v_lines || jsonb_build_object(
      'code', v_d.code, 'label', v_d.label, 'kind', 'deduction',
      'baseUnits', v_d.amount, 'amountUnits', -v_d.amount, 'account', v_d.account
    );
    v_deduction_lines := v_deduction_lines || jsonb_build_object('code', v_d.code, 'amount', v_d.amount);
  end loop;

  -- 9) Taxes patronales (FDFP, CFCE…).
  for v_t in
    select code, label, rate_bps
    from atlas_people.payroll_employer_taxes
    where regime_id = v_regime_id and is_active
    order by sort_order
  loop
    declare v_amt bigint;
    begin
      v_amt := atlas_people.apply_rate_bps(v_gross_taxable, v_t.rate_bps);
      v_total_employer_tax := v_total_employer_tax + v_amt;
      v_lines := v_lines || jsonb_build_object(
        'code', v_t.code, 'label', v_t.label, 'kind', 'employer_tax',
        'baseUnits', v_gross_taxable, 'rateBps', v_t.rate_bps, 'amountUnits', v_amt
      );
    end;
  end loop;

  v_net_to_pay := v_gross_total - v_total_employee_contrib - v_income_tax - v_total_other_deductions;
  v_employer_cost := v_gross_total + v_total_employer_contrib + v_total_employer_tax;

  -- 10) Vérification indépendante (set-based) — tout écart bloque l'émission.
  select coalesce(sum(
    case when c.employee_bps > 0 then
      atlas_people.apply_rate_bps(
        case when c.base_type = 'capped' and c.ceiling is not null
             then least(v_gross_taxable, c.ceiling / 100)
             else v_gross_taxable end,
        c.employee_bps)
    else 0 end
  ), 0) into v_verify_employee_contrib
  from atlas_people.payroll_contributions c
  where c.regime_id = v_regime_id and c.is_active;

  v_verify_income_tax := atlas_people.progressive_tax_verify(
    v_regime_id,
    atlas_people.divide_int(
      greatest(
        greatest(v_gross_taxable - v_verify_employee_contrib, 0)
        - case when coalesce(v_regime.abatement_bps, 0) > 0
               then atlas_people.apply_rate_bps(greatest(v_gross_taxable - v_verify_employee_contrib, 0), v_regime.abatement_bps)
               else 0 end,
        0),
      v_fiscal_parts)
  ) * v_fiscal_parts;

  v_verify_net_to_pay := v_gross_total - v_verify_employee_contrib - v_verify_income_tax - v_total_other_deductions;

  if v_verify_employee_contrib <> v_total_employee_contrib then
    v_discrepancies := v_discrepancies || jsonb_build_object(
      'field', 'totalEmployeeContribution', 'engine', v_total_employee_contrib, 'verifier', v_verify_employee_contrib);
  end if;
  if v_verify_income_tax <> v_income_tax then
    v_discrepancies := v_discrepancies || jsonb_build_object(
      'field', 'incomeTax', 'engine', v_income_tax, 'verifier', v_verify_income_tax);
  end if;
  if v_verify_net_to_pay <> v_net_to_pay then
    v_discrepancies := v_discrepancies || jsonb_build_object(
      'field', 'netToPay', 'engine', v_net_to_pay, 'verifier', v_verify_net_to_pay);
  end if;

  -- 11) Anomalies bloquantes (miroir src/lib/m3/engine.ts).
  select coalesce((parameters->>'smig_mensuel')::bigint, null) into v_smig
  from atlas_people.country_packs
  where country_code = v_emp.country_code and status = 'published'
    and (tenant_id = v_emp.tenant_id or tenant_id is null)
  order by (tenant_id = v_emp.tenant_id) desc, effective_from desc
  limit 1;
  if v_smig is null then
    v_smig := case v_emp.country_code when 'CI' then 75000 when 'SN' then 64500 when 'CM' then 41875 else 60000 end;
  end if;

  if v_net_to_pay < 0 then
    v_anomalies := v_anomalies || jsonb_build_object('severity','danger','code','NET_NEGATIF','message','Net à payer négatif.','blocking',true);
  elsif v_net_to_pay < v_smig and v_prorata_pct >= 1 then
    v_anomalies := v_anomalies || jsonb_build_object('severity','danger','code','NET_SOUS_SMIG',
      'message', format('Net (%s) inférieur au SMIG %s (%s).', v_net_to_pay, v_emp.country_code, v_smig), 'blocking', true);
  end if;
  if (v_total_employee_contrib + v_income_tax + v_total_other_deductions) > v_gross_total then
    v_anomalies := v_anomalies || jsonb_build_object('severity','danger','code','COTIS_SUP_BRUT','message','Retenues totales supérieures au brut.','blocking',true);
  end if;
  if v_gross_total > 0 and v_total_other_deductions > atlas_people.money_round(v_gross_total * 0.33) then
    v_anomalies := v_anomalies || jsonb_build_object('severity','danger','code','QUOTITE','message','Retenues > 33 % du brut (quotité saisissable dépassée).','blocking',true);
  end if;
  if v_inputs_found and v_inputs.jours_travailles is not null and v_inputs.jours_ouvrables is not null
     and v_inputs.jours_travailles > v_inputs.jours_ouvrables then
    v_anomalies := v_anomalies || jsonb_build_object('severity','danger','code','JOURS_INCOHERENTS','message','Jours travaillés supérieurs aux jours ouvrables.','blocking',true);
  end if;

  return jsonb_build_object(
    'employeeId', p_employee_id,
    'cycleId', p_cycle_id,
    'tenantId', v_emp.tenant_id,
    'currency', v_regime.currency,
    'regimeVersion', v_regime.version,
    'countryCode', v_emp.country_code,
    'prorataPct', v_prorata_pct,
    'lines', v_lines,
    'grossTaxableUnits', v_gross_taxable,
    'grossTotalUnits', v_gross_total,
    'totalEmployeeContributionUnits', v_total_employee_contrib,
    'incomeTaxUnits', v_income_tax,
    'totalOtherDeductionsUnits', v_total_other_deductions,
    'netToPayUnits', v_net_to_pay,
    'totalEmployerContributionUnits', v_total_employer_contrib,
    'totalEmployerTaxUnits', v_total_employer_tax,
    'employerCostUnits', v_employer_cost,
    'bulletin', jsonb_build_object(
      'brut_total', v_gross_total,
      'base_cnps', v_gross_taxable,
      'base_irpp', v_gross_taxable - v_total_employee_contrib,
      'total_cotisations_emp', v_total_employee_contrib + v_income_tax,
      'total_retenues', v_total_other_deductions,
      'net_a_payer', v_net_to_pay,
      'total_cotisations_pat', v_total_employer_contrib,
      'cout_employeur', v_employer_cost
    ),
    'verification', jsonb_build_object('ok', jsonb_array_length(v_discrepancies) = 0, 'discrepancies', v_discrepancies),
    'anomalies', v_anomalies,
    'emissionBlocked', (jsonb_array_length(v_discrepancies) > 0) or coalesce((
      select bool_or((a->>'blocking')::boolean) from jsonb_array_elements(v_anomalies) a
    ), false)
  );
end;
$$;

grant execute on function atlas_people.calculate_bulletin(uuid, uuid) to authenticated;
