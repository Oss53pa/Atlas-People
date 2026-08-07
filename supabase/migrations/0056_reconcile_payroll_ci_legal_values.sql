-- =====================================================================
-- V6.1 · Réconciliation des valeurs légales de paie CI
--
-- Contexte : deux jeux de tables stockent chacun, indépendamment, les
-- paramètres légaux CI et leurs valeurs divergeaient :
--   1. payroll_baremes / payroll_baremes_tranches (0051) — référentiel
--      générique, non consommé par aucun code de calcul.
--   2. payroll_regime_configs / payroll_contributions / payroll_tax_brackets
--      / payroll_employer_taxes (0033) — source réellement lue par
--      useRegime.ts et par la RPC atlas_people.calculate_bulletin (0055).
--
-- Recherche effectuée (sources primaires/officielles) :
--   • CNPS prestations familiales (part patronale) : 5 % PF + 0,75 %
--     maternité = 5,75 % combiné (CLEISS — www.cleiss.fr/docs/cotisations/
--     cotedivoire.html ; loidici.biz). payroll_contributions.CNPS_PF ne
--     porte qu'une seule ligne (pas de ligne maternité séparée), donc la
--     valeur correcte pour cette ligne unique est 5,75 % (575 bps), pas
--     5,25 % (525 bps).
--   • FDFP formation continue : 1,2 % de la masse salariale, confirmé
--     directement par le site officiel du FDFP (fdfp.ci/presentation-du-
--     fdfp/). payroll_employer_taxes.FDFP_FC était à 0,6 % (60 bps) —
--     erroné, corrigé à 120 bps.
--   • Barème IRPP/ITS : Ordonnance n°2023-719 du 13/09/2023 (nouvel
--     art. 119 bis CGI), applicable depuis le 01/01/2024, qui a fusionné
--     IGR + Contribution Nationale + IS en un impôt unique (ITS) à 6
--     tranches MENSUELLES (0/16/21/24/28/32 %, seuils 75k/240k/800k/
--     2,4M/8M FCFA). C'est exactement ce que porte déjà
--     payroll_tax_brackets (table consommée). Le barème à 8 tranches
--     ANNUELLES de payroll_baremes_tranches (0/1,5/5/10/15/20/25/35 %)
--     est l'ancien barème IGR pré-réforme, obsolète depuis 2024.
--
-- Un troisième exemplaire des mêmes valeurs erronées (525 bps / 60 bps)
-- existe aussi en dur dans src/lib/payroll/regimes/cnps_ci.ts (fallback
-- statique lu par useRegime.ts quand Supabase est indisponible) — corrigé
-- séparément dans le même commit que cette migration.
--
-- Décision sur payroll_baremes / payroll_baremes_tranches : conservées
-- (alignées sur les mêmes valeurs légales) mais marquées DEPRECATED via
-- commentaire de table, faute de tout consommateur actuel. Ne pas les
-- réutiliser pour un nouveau calcul sans d'abord les brancher comme
-- source unique (elles font doublon avec payroll_regime_configs et
-- consorts, cf. 0055).
-- =====================================================================

-- ── 1) CNPS Prestations familiales (part patronale) : 5,25 % → 5,75 % ──
update atlas_people.payroll_contributions c
set employer_bps = 575
from atlas_people.payroll_regime_configs r
where c.regime_id = r.id
  and r.country_code = 'CI'
  and c.code = 'CNPS_PF'
  and c.employer_bps <> 575;

-- ── 2) FDFP Formation continue : 0,6 % → 1,2 % ──────────────────────
update atlas_people.payroll_employer_taxes t
set rate_bps = 120
from atlas_people.payroll_regime_configs r
where t.regime_id = r.id
  and r.country_code = 'CI'
  and t.code = 'FDFP_FC'
  and t.rate_bps <> 120;

-- ── 3) Barème IRPP_CI (payroll_baremes) : ancien barème annuel 8
--      tranches → barème ITS mensuel 6 tranches (Ordonnance 2023-719,
--      applicable depuis le 01/01/2024) — aligné sur payroll_tax_brackets.
update atlas_people.payroll_baremes
set unit = '%',
    effective_from = '2024-01-01',
    reference_legale = 'Ordonnance n°2023-719 du 13/09/2023 (CGI art. 119 bis) — barème ITS mensuel unique, applicable depuis le 01/01/2024 (remplace IGR + Contribution Nationale)'
where code = 'IRPP_CI';

delete from atlas_people.payroll_baremes_tranches t
using atlas_people.payroll_baremes b
where t.bareme_id = b.id
  and b.code = 'IRPP_CI';

insert into atlas_people.payroll_baremes_tranches
  (tenant_id, bareme_id, ordre, borne_min, borne_max, taux)
select b.tenant_id, b.id, v.ordre, v.borne_min, v.borne_max, v.taux
from atlas_people.payroll_baremes b
cross join (values
  (1,       0,   75000,   0),
  (2,   75001,  240000,  16),
  (3,  240001,  800000,  21),
  (4,  800001, 2400000,  24),
  (5, 2400001, 8000000,  28),
  (6, 8000001,    NULL,  32)
) as v(ordre, borne_min, borne_max, taux)
where b.code = 'IRPP_CI';

-- ── 4) Dépréciation documentaire (table non consommée par le code) ────
comment on table atlas_people.payroll_baremes is
  'DEPRECATED — référentiel générique non consommé par le code applicatif. '
  'La source de vérité pour le calcul de paie est payroll_regime_configs / '
  'payroll_contributions / payroll_tax_brackets / payroll_employer_taxes, '
  'lue par useRegime.ts et par atlas_people.calculate_bulletin() (voir '
  '0055_calculate_bulletin_rpc.sql). Valeurs alignées légalement par '
  '0056_reconcile_payroll_ci_legal_values.sql pour rester exactes tant '
  'que la table existe, mais ne pas la brancher sur un nouveau calcul '
  'sans d''abord en faire la source unique.';

comment on table atlas_people.payroll_baremes_tranches is
  'DEPRECATED — voir commentaire sur atlas_people.payroll_baremes.';
