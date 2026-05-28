-- ============================================================================
-- Atlas People — RLS rôle-aware (tâche A)
-- Affine l'isolation tenant (déjà en place) par RÔLE et par IDENTITÉ, en
-- respectant la charte de confidentialité (cahier §2.4, §6, §10) :
--   • Le manager (N-1) ne voit JAMAIS rémunération / famille / médical détaillé /
--     disciplinaire détaillé de ses collaborateurs.
--   • Le médecin du travail est exclusif sur le médical détaillé.
--   • L'employé ne voit que SES propres données sensibles.
--   • RH / admin : accès tenant complet sur les domaines RH.
-- Cette migration honore la note laissée dans 0008 : « séparation fine
-- médecin/RH/manager portée par M12 ».
-- Rôles (memberships.role) : employee | manager | hr | admin | occupational_health
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Fonctions d'aide (security definer, stables) — réutilisées par les policies.
-- Toutes restent contraintes par current_tenant_ids() dans les policies, donc
-- aucune ne peut traverser la frontière d'un tenant.
-- ---------------------------------------------------------------------------
create or replace function current_employee_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from employees where user_id = auth.uid();
$$;

create or replace function is_hr_or_admin(p_tenant uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.user_id = auth.uid() and m.tenant_id = p_tenant
      and m.role in ('hr', 'admin')
  );
$$;

create or replace function is_admin(p_tenant uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.user_id = auth.uid() and m.tenant_id = p_tenant and m.role = 'admin'
  );
$$;

create or replace function is_occupational_health(p_tenant uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.user_id = auth.uid() and m.tenant_id = p_tenant
      and m.role = 'occupational_health'
  );
$$;

-- Le demandeur est-il le manager DIRECT (N-1) de p_employee ? (MSS = N-1 only)
create or replace function is_manager_of(p_employee uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from employees e
    where e.id = p_employee
      and e.manager_id in (select id from employees where user_id = auth.uid())
  );
$$;

comment on function is_manager_of(uuid) is
  'Vrai si l''utilisateur courant est le manager hiérarchique direct (N-1) de l''employé visé. La supervision ne descend jamais au-delà du N-1 (charte MSS).';

-- ---------------------------------------------------------------------------
-- TIER 1 — Paie collective & comptabilité : RH / admin UNIQUEMENT.
-- (Le manager n'a aucun accès ; l'employé passe par ses bulletins/lignes.)
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array[
  'payroll_runs','social_declarations','accounting_entries','compensation_components'
];
begin
  foreach t in array tabs loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format($f$
      create policy hr_only on %I
        using (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id))
        with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));
    $f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- TIER 2 — Confidentiel individuel : SELF + RH/admin, JAMAIS le manager.
-- Rémunération individuelle, comptes de versement, avantages, famille.
-- (Toutes ces tables portent une colonne employee_id — vérifiée dynamiquement.)
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array[
  'benefits','company_vehicles','company_housing','in_kind_benefits_typed',
  'employee_loans','employee_advances','recurring_advances','employee_guarantees',
  'corporate_payment_cards','saving_share_plans','employee_compensation_lines',
  'family_members','expat_accompanying_family'
];
begin
  foreach t in array tabs loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('drop policy if exists tenant_isolation on %I', t);
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'employee_id'
    ) then
      execute format($f$
        create policy self_or_hr on %I
          using (tenant_id in (select current_tenant_ids())
                 and (employee_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
          with check (tenant_id in (select current_tenant_ids())
                 and (employee_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)));
      $f$, t);
    else
      -- Sans employee_id : repli RH/admin uniquement.
      execute format($f$
        create policy hr_only on %I
          using (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id))
          with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));
      $f$, t);
    end if;
  end loop;
end $$;

-- TIER 2b — Comptes de versement : LECTURE self + RH ; ÉCRITURE RH/admin seuls.
-- Toute modification du moyen de versement passe par la cérémonie de l'edge
-- function change-payment-method (ré-auth + double notification + effet à la
-- paie suivante, jamais rétroactif). L'employé ne peut donc PAS écrire en direct.
do $$
declare t text;
declare tabs text[] := array['bank_accounts','mobile_money_accounts','employee_payment_methods'];
begin
  foreach t in array tabs loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format($f$
      create policy read_self_write_hr on %I
        using (tenant_id in (select current_tenant_ids())
               and (employee_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
        with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));
    $f$, t);
  end loop;
end $$;

-- payment_split_destinations : pas d'employee_id direct → via la méthode de paiement.
-- Lecture self (par sa méthode) + RH ; écriture RH/admin seuls.
do $$
begin
  if to_regclass('public.payment_split_destinations') is not null then
    drop policy if exists tenant_isolation on payment_split_destinations;
    create policy read_self_write_hr on payment_split_destinations
      using (
        tenant_id in (select current_tenant_ids())
        and (
          is_hr_or_admin(tenant_id)
          or payment_method_id in (
            select pm.id from employee_payment_methods pm
            where pm.employee_id in (select current_employee_ids())
          )
        )
      )
      with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- TIER 3 — Opérationnel : SELF + manager DIRECT + RH/admin.
-- Temps, absences, congés, frais, objectifs, aptitude catégorielle.
-- (Le manager pilote l'opérationnel de son équipe N-1 — surface MSS.)
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array[
  'time_entries','leaves','expense_claims','objectives','employee_aptitudes',
  'absences','absence_justifications'
];
begin
  foreach t in array tabs loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('drop policy if exists tenant_isolation on %I', t);
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'employee_id'
    ) then
      execute format($f$
        create policy self_team_or_hr on %I
          using (tenant_id in (select current_tenant_ids())
                 and (employee_id in (select current_employee_ids())
                      or is_manager_of(employee_id)
                      or is_hr_or_admin(tenant_id)))
          with check (tenant_id in (select current_tenant_ids())
                 and (employee_id in (select current_employee_ids())
                      or is_manager_of(employee_id)
                      or is_hr_or_admin(tenant_id)));
      $f$, t);
    else
      execute format($f$
        create policy hr_only on %I
          using (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id))
          with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));
      $f$, t);
    end if;
  end loop;
end $$;

-- evaluations : SELF (évalué) + évaluateur + manager direct + RH/admin.
do $$
begin
  if to_regclass('public.evaluations') is not null then
    drop policy if exists tenant_isolation on evaluations;
    create policy self_reviewer_team_or_hr on evaluations
      using (
        tenant_id in (select current_tenant_ids())
        and (
          employee_id in (select current_employee_ids())
          or reviewer_id in (select current_employee_ids())
          or is_manager_of(employee_id)
          or is_hr_or_admin(tenant_id)
        )
      )
      with check (
        tenant_id in (select current_tenant_ids())
        and (
          reviewer_id in (select current_employee_ids())
          or is_hr_or_admin(tenant_id)
        )
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- TIER 4 — Médical détaillé : SELF + médecin du travail UNIQUEMENT.
-- Ni le manager, ni les RH généralistes (cahier : médecin du travail exclusif).
-- L'aptitude CATÉGORIELLE reste en Tier 3 (opérationnel).
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array[
  'employee_medical_followup','medical_visits','employee_vaccinations','medical_leave_tracking'
];
begin
  foreach t in array tabs loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('drop policy if exists tenant_isolation on %I', t);
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'employee_id'
    ) then
      execute format($f$
        create policy self_or_occupational_health on %I
          using (tenant_id in (select current_tenant_ids())
                 and (employee_id in (select current_employee_ids())
                      or is_occupational_health(tenant_id)))
          with check (tenant_id in (select current_tenant_ids())
                 and (employee_id in (select current_employee_ids())
                      or is_occupational_health(tenant_id)));
      $f$, t);
    else
      execute format($f$
        create policy occupational_health_only on %I
          using (tenant_id in (select current_tenant_ids()) and is_occupational_health(tenant_id))
          with check (tenant_id in (select current_tenant_ids()) and is_occupational_health(tenant_id));
      $f$, t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- TIER 5 — Disciplinaire & incidents : SELF (concerné) + RH/admin.
-- Le manager ne voit jamais le DÉTAIL disciplinaire (charte §6).
-- ---------------------------------------------------------------------------
do $$
declare t text;
declare tabs text[] := array['disciplinary_actions','incidents'];
begin
  foreach t in array tabs loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format($f$
      create policy self_or_hr on %I
        using (tenant_id in (select current_tenant_ids())
               and (employee_id in (select current_employee_ids()) or is_hr_or_admin(tenant_id)))
        with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id));
    $f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- TIER 6 — Notifications : strictement le destinataire (par utilisateur).
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.notifications') is not null then
    drop policy if exists tenant_isolation on notifications;
    create policy own_notifications on notifications
      using (tenant_id in (select current_tenant_ids())
             and (user_id = auth.uid() or is_hr_or_admin(tenant_id)))
      with check (tenant_id in (select current_tenant_ids()));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- employees — la fiche : SELF + manager direct + RH/admin (lecture/écriture).
-- La protection COLONNE (salaire jamais exposé au manager) est assurée par la
-- vue org_directory ci-dessous, projection sûre utilisée par l'organigramme/MSS.
-- ---------------------------------------------------------------------------
do $$
begin
  drop policy if exists tenant_isolation on employees;
  -- Lecture : self + manager direct + RH/admin.
  -- Écriture : RH/admin uniquement — les modifications self-service passent par
  -- la demande de modification (P1.7), jamais par une écriture directe (un
  -- employé ne peut pas modifier son propre salaire).
  create policy employee_self_team_or_hr on employees
    using (
      tenant_id in (select current_tenant_ids())
      and (
        user_id = auth.uid()
        or is_manager_of(id)
        or is_hr_or_admin(tenant_id)
      )
    )
    with check (
      tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id)
    );
end $$;

-- Annuaire / organigramme : colonnes NON sensibles pour tous les membres du
-- tenant. Vue en SECURITY DEFINER (pas de security_invoker) → contourne la RLS
-- ligne d'employees mais N'EXPOSE QUE des colonnes sûres (aucune rémunération,
-- aucune donnée famille/médicale). Filtrée par tenant de l'appelant.
create or replace view org_directory as
  select
    e.id, e.tenant_id, e.first_name, e.last_name, e.email,
    e.role_title, e.department, e.country_code, e.contract,
    e.hire_date, e.status, e.manager_id
  from employees e
  where e.tenant_id in (select current_tenant_ids());

comment on view org_directory is
  'Annuaire/organigramme — colonnes non sensibles uniquement (jamais salaire, famille ni médical). Lisible par tout membre du tenant ; isolation tenant appliquée dans la vue.';

revoke all on org_directory from public;
grant select on org_directory to authenticated;
