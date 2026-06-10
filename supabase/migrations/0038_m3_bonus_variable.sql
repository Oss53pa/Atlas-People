-- ============================================================================
-- Atlas People — Noyau BONUS variable (M3), branchement sur la Performance.
-- Implémente la *Note de cadrage core* §6 : fiche de rémunération + formule,
-- enveloppe & mode d'articulation (A prorata / B plafonnée / C libre), gating
-- d'affichage direction (R6), confidentialité RLS (R8).
--
-- Le CALCUL monétaire est porté par le moteur TS `src/engine/bonus` (Money.ts
-- bigint, déterministe, testé) — ces tables PERSISTENT les résultats et portent
-- la sécurité/gating. Le bonus CONSOMME le score validé exposé par la
-- Performance (§9, perf_scores scope=employe periode=annee couche valide) et ne
-- le recalcule jamais. PROPH3T ne calcule aucun bonus (R5).
--
-- Montants en bigint (franc FCFA entier, zéro float). Additif & idempotent.
-- Dépend de 0036 (perf_scores, perf_events, perf_chain_hash, helpers RLS).
-- ============================================================================
set search_path = atlas_people, public, extensions;

-- ---------------------------------------------------------------------------
-- 1. FICHE DE RÉMUNÉRATION — salaire + formule bonus (§6.1, §8 remu_fiche)
-- ---------------------------------------------------------------------------
create table if not exists remu_fiche (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  employe_id      uuid not null,
  salaire_mensuel bigint not null check (salaire_mensuel >= 0),  -- FCFA entier
  devise          text not null default 'XOF' check (devise in ('XOF','XAF')),
  formule_base    text not null default 'SAL_MENS' check (formule_base in ('SAL_MENS','SAL_ANN')),
  formule_coef    numeric not null default 1 check (formule_coef >= 0),
  plancher_bps    int,                                            -- % SAL_ANN ×100
  plafond_bps     int,
  updated_at      timestamptz not null default now(),
  unique (tenant_id, employe_id)
);

-- ---------------------------------------------------------------------------
-- 2. ENVELOPPES — budget & mode d'articulation (§6.2)
-- ---------------------------------------------------------------------------
create table if not exists bonus_enveloppes (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null,
  campagne_id   uuid references perf_campagnes(id) on delete set null,
  periode_type  text not null default 'annuel' check (periode_type in ('annuel','semestriel')),
  periode_ref   text not null,
  scope         text not null default 'global',                  -- global | departement
  scope_id      uuid,
  montant       bigint not null check (montant >= 0),
  devise        text not null default 'XOF' check (devise in ('XOF','XAF')),
  mode_bonus    text not null default 'A_prorata'
                  check (mode_bonus in ('A_prorata','B_plafonnee','C_libre')),
  statut        text not null default 'brouillon'
                  check (statut in ('brouillon','simulee','validee','cloturee')),
  valide_par    uuid,
  valide_at     timestamptz,
  created_at    timestamptz not null default now(),
  unique (tenant_id, campagne_id, periode_ref, scope, scope_id)
);
create index if not exists bonus_env_camp_idx on bonus_enveloppes (tenant_id, campagne_id);

-- ---------------------------------------------------------------------------
-- 3. CALCULS — un bonus par employé, figé + chaîné, GATÉ (§6.3, §6.4, R6/R7)
-- ---------------------------------------------------------------------------
create table if not exists bonus_calculs (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null,
  enveloppe_id    uuid not null references bonus_enveloppes(id) on delete cascade,
  employe_id      uuid not null,
  campagne_id     uuid references perf_campagnes(id) on delete set null,
  score_source    numeric,                                        -- score validé consommé (§9)
  part            bigint,                                         -- part brute (mode A)
  brut            bigint,                                         -- formule avant bornes
  final           bigint,                                         -- après mode + bornes + arrondi
  borne           text check (borne in ('plafond','plancher')),
  devise          text not null default 'XOF' check (devise in ('XOF','XAF')),
  statut          text not null default 'calcule' check (statut in ('calcule','valide')),
  -- R6 : l'employé ne voit son bonus QUE lorsque l'enveloppe est validée direction
  visible_employe boolean not null default false,
  validateur_id   uuid,
  validated_at    timestamptz,
  hash            text,
  prev_hash       text,
  created_at      timestamptz not null default now(),
  unique (enveloppe_id, employe_id)
);
create index if not exists bonus_calc_emp_idx on bonus_calculs (tenant_id, employe_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- touch updated_at sur remu_fiche
do $$ begin
  drop trigger if exists remu_fiche_touch on remu_fiche;
  create trigger remu_fiche_touch before update on remu_fiche
    for each row execute function perf_touch_updated_at();
end $$;

-- gating R6 : visible_employe suit la validation de l'enveloppe.
create or replace function bonus_sync_gating() returns trigger
language plpgsql set search_path = atlas_people, public as $$
begin
  update bonus_calculs c
     set visible_employe = (new.statut = 'validee')
   where c.enveloppe_id = new.id;
  return new;
end $$;

do $$ begin
  drop trigger if exists bonus_env_gating on bonus_enveloppes;
  create trigger bonus_env_gating after update of statut on bonus_enveloppes
    for each row execute function bonus_sync_gating();
end $$;

-- immutabilité du calcul figé (R7) : pas de modif après écriture du hash.
create or replace function bonus_freeze_guard() returns trigger
language plpgsql set search_path = atlas_people, public as $$
begin
  if old.hash is not null and old.statut = 'valide' then
    -- la visibilité (gating) reste modifiable, le reste non
    if new.final is distinct from old.final
       or new.brut is distinct from old.brut
       or new.score_source is distinct from old.score_source then
      raise exception 'bonus_calcul % figé : montant immuable (R7).', old.id;
    end if;
  end if;
  return new;
end $$;

do $$ begin
  drop trigger if exists bonus_calc_freeze on bonus_calculs;
  create trigger bonus_calc_freeze before update on bonus_calculs
    for each row execute function bonus_freeze_guard();
end $$;

-- ============================================================================
-- RPC — consommation du score validé (§9) & chaînage de la validation
-- ============================================================================

-- §9 : score final validé exposé en lecture seule à M3 (variable SCORE).
create or replace function rpc_bonus_score_source(p_employe_id uuid, p_campagne_id uuid)
returns numeric
language sql security definer set search_path = atlas_people, public as $$
  select pct_valide from perf_scores
   where scope = 'employe' and scope_id = p_employe_id
     and campagne_id = p_campagne_id and periode_type = 'annee' and periode_ref = 'final'
     and fige is true
   limit 1;
$$;

-- fige un calcul de bonus (hash chaîné) une fois l'enveloppe validée (§6.4).
create or replace function rpc_valide_bonus(p_calcul_id uuid, p_validateur_id uuid)
returns void
language plpgsql security definer set search_path = atlas_people, public, extensions as $$
declare c bonus_calculs%rowtype; v_prev text; v_hash text;
begin
  select * into c from bonus_calculs where id = p_calcul_id;
  if not found then raise exception 'bonus_calcul introuvable'; end if;

  select hash into v_prev from bonus_calculs
    where tenant_id = c.tenant_id and employe_id = c.employe_id and hash is not null
    order by created_at desc limit 1;
  v_prev := coalesce(v_prev, repeat('0',64));
  v_hash := perf_chain_hash(v_prev, jsonb_build_object(
    'employe', c.employe_id, 'enveloppe', c.enveloppe_id,
    'final', coalesce(c.final,0)::text, 'score', coalesce(c.score_source,0)::text));

  update bonus_calculs
     set statut = 'valide', validateur_id = p_validateur_id, validated_at = now(),
         prev_hash = v_prev, hash = v_hash
   where id = p_calcul_id;
end $$;

-- ============================================================================
-- RLS — confidentialité du bonus (§6.4, R6/R8)
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array['remu_fiche','bonus_enveloppes','bonus_calculs']
  loop
    execute format('alter table %I enable row level security', t);
    execute format($f$drop policy if exists bonus_tenant_write on %I$f$, t);
    execute format($f$create policy bonus_tenant_write on %I for all
      using (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id))
      with check (tenant_id in (select current_tenant_ids()) and is_hr_or_admin(tenant_id))$f$, t);
  end loop;
end $$;

-- remu_fiche : l'employé lit SA fiche (salaire, formule, base de son calcul).
drop policy if exists remu_fiche_self_read on remu_fiche;
create policy remu_fiche_self_read on remu_fiche for select using (
  tenant_id in (select current_tenant_ids()) and (
    is_hr_or_admin(tenant_id) or employe_id in (select current_employee_ids())
  )
);

-- bonus_calculs : l'employé voit SON bonus + son détail UNIQUEMENT après gating
-- direction (visible_employe). Enveloppe globale et bonus des autres réservés RH.
drop policy if exists bonus_calc_self_read on bonus_calculs;
create policy bonus_calc_self_read on bonus_calculs for select using (
  tenant_id in (select current_tenant_ids()) and (
    is_hr_or_admin(tenant_id)
    or (employe_id in (select current_employee_ids()) and visible_employe is true)
  )
);

-- bonus_enveloppes : strictement RH/Direction (budget global confidentiel) —
-- déjà couvert par bonus_tenant_write ; aucune lecture employé n'est ajoutée.

-- ---------------------------------------------------------------------------
comment on table bonus_calculs is
  'Bonus calculé par employé (moteur TS Money.ts). Gating R6 : visible_employe ne passe true qu''à la validation direction de l''enveloppe. Figé + chaîné SHA-256 (R7).';
comment on function rpc_bonus_score_source(uuid,uuid) is
  'Expose le score final validé de la campagne (§9) comme variable SCORE du bonus. Lecture seule — aucun calcul de score ici (R1/R5).';
