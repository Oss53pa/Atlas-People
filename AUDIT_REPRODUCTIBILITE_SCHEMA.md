# Audit de reproductibilité — `supabase/migrations/` ↔ schéma `atlas_people`

Projet Supabase `vgtmljfayiysuvrcmunt` · audit du 2026-07-31 · 56 fichiers de migration
confrontés aux 404 tables, 18 vues, 111 enums et 65 fonctions réellement en base.

**Verdict : le dépôt ne reconstruit pas la base.** Rejouer `supabase/migrations/` sur une
base vierge ne produit pas `atlas_people` — ni en contenu, ni en placement, ni en forme.
Cinq défauts indépendants, du plus structurant au plus mineur.

---

## 1. 56 tables existent en base et ne sont déclarées par aucun fichier

14 % du schéma est introuvable dans le dépôt. Ces tables ont été déployées directement
via le MCP Supabase, sans jamais être écrites dans un fichier.

| Module | Tables non déclarées |
|---|---|
| M9 | 16 — `m9_pdc`, `m9_pdc_actions`, `m9_eval_auto_*`, `m9_eval_manager_*`, `m9_certifications_*`, `m9_mobilite_*`, `m9_pic`, `m9_talents_snapshots`, `m9_anti_discrim_alerts`, `m9_suspicious_patterns` |
| M11 | 14 — `m11_parcours*`, `m11_pif*`, `m11_lms_*`, `m11_badges`, `m11_badge_attributions`, `m11_formateurs`, `m11_convocations`, `m11_invoices`, `m11_session_animations`, `m11_suspicious_patterns` |
| M10 | 10 — `m10_talent_pools`, `m10_talent_pool_memberships`, `m10_promotions`, `m10_alumni`, `m10_job_*`, `m10_talent_review_workshops`, `m10_audit_log`, `m10_suspicious_patterns` |
| M5 | 9 — `m5_needs`, `m5_jobs`, `m5_candidates`, `m5_applications`, `m5_interviews`, `m5_offers`, `m5_scorecards`, `m5_referrals`, `m5_audit_log` |
| M6 | 7 — `m6_arrivants`, `m6_jalons`, `m6_tasks`, `m6_pulses`, `m6_parcours_templates`, `m6_welcome_book`, `m6_audit_log` |

Le dépôt le documente lui-même. En-tête de `0035_missing_m9_m10_m11_tables.sql` :

> Les tables m9_*, m10_*, m11_* listées ci-dessous existent dans la DB (déployées via
> Supabase MCP lors des sprints 134-155) mais n'avaient pas de policies RLS.

Conséquence directe : `0029_m5_m6_recrutement_onboarding.sql` et
`0030_m11_sprint1_parcours_pif_lms_audit.sql` **ne contiennent aucun `create table`**.
Ils ne portent que les enums, la RLS, les triggers et les vues de tables qui n'existent
nulle part dans le dépôt. Rejoués seuls, ils échouent.

S'ajoutent **8 vues** (`m5_recrutement_summary`, `m6_onboarding_summary`,
`m9_pdc_progress`, `m9_anti_discrim_summary`, `m10_promotions_summary`,
`m10_succession_status`, `m11_pif_progress`, `employee_status_overview`) et
**13 enums** (`m9_*`, `m10_*`) dans le même cas.

## 2. Cinq fichiers n'ont jamais été appliqués (ou quasiment pas)

| Fichier | Tables déclarées présentes en base |
|---|---|
| `0017_m4_performance_equipe.sql` | **0 / 8** |
| `0018_m5_developpement_equipe.sql` | **0 / 8** |
| `0019_m6_m7_recrutement_quotidien.sql` | 1 / 16 |
| `0020_m8_m9_m10_reporting_pratique_parametres.sql` | 1 / 15 |
| `0016_mss_manager_portal.sql` | 1 / 4 |

Soit 47 tables déclarées et inexistantes : tout un pan « portail manager · performance
équipe · développement équipe » conçu mais jamais déployé. Aucune de leurs fonctions
n'existe non plus (`team_360_synthesis`, `team_payroll_mass`, `supervises_in_chain`,
`recompute_management_chain`, `current_manager_depth`, `trg_recompute_chain`).

C'est le même mécanisme que `0045`, resté non appliqué jusqu'à cette session : les
migrations sont poussées une par une via `apply_migration` avec un nom saisi à la main,
sans lien automatique avec le nom de fichier. Un fichier oublié ne produit aucun signal.

## 3. 19 fichiers créeraient leurs objets dans le mauvais schéma

Ces fichiers déclarent des objets **non qualifiés** et ne portent **aucun
`set search_path`**. Rejoués via `supabase db push`, ils créent tout dans `public`,
pas dans `atlas_people`.

`0001_init` (34 objets), `0012_m2_temps_absences` (33), `0006_m1_paquet2` (19),
`0005_m1_paquet1` (18), `0007_m1_paquet3` (17), `0019` (16), `0020` (15),
`0008_m1_paquet4` (14), `0004_m1_referentials` (9), `0011_m1_config_referentials` (9),
`0016_mss` (9), `0017` (9), `0014_portal_helpdesk_courrier` (8), `0018` (8),
`0003_m1_operational` (7), `0015_rls_role_aware` (6), `0002_fna_and_ethics` (4),
`0010_m1_exit` (4), `0009_m1_amendments` (3) — **233 objets au total**.

Les fichiers récents (`0032`, `0046`, `0047`+) qualifient correctement en
`atlas_people.` ou posent la directive. Le défaut est concentré sur le socle historique.

## 4. Dix tables déclarées deux fois avec des colonnes divergentes

`create table if not exists` fait gagner la **première** déclaration en silence.
Pour six d'entre elles, la première déclaration est la mauvaise.

| Table | 1re déclaration (gagnante au rejeu) | Version réellement en base | Verdict |
|---|---|---|---|
| `sites` | `0004` — 10 col. | `0011` — 18 col. | **rejeu faux** |
| `collective_agreements` | `0004` — 7 col. | `0011` — 15 col. | **rejeu faux** |
| `departments` | `0004` — 9 col. | `0011` — 12 col. | **rejeu faux** |
| `public_holidays` | `0004` — 9 col. | `0011` — 11 col. | **rejeu faux** |
| `classifications` | `0004` — 7 col. | `0011` — 11 col. | **rejeu faux** |
| `manager_delegations` | `0016_mss` — 15 col. | `0046` — 14 col. | **rejeu faux** |
| `exit_interviews` | `0010` — 14 col. | `0010` — 14 col. | ordre favorable |
| `tenants` | `0001` + ALTER `0047` | 9 col. | cohérent |
| `manager_preferences` | `0016_mss` / `0020` | absente | sans objet |
| `manager_rituals` | `0016_mss` / `0020` | absente | sans objet |

Les cinq premières ne diffèrent pas par accident : `0011_m1_config_referentials` est une
refonte des référentiels de `0004_m1_referentials`, mais elle a été écrite en
`create table if not exists` au lieu d'un `alter table`. En base c'est la version `0011`
qui règne — donc elle a été appliquée avant `0004`, ou `0004` n'a jamais tourné.

## 5. Divergence de prédicats RLS — corrigée le 2026-07-31

`0022`, `0023` et `0024` portaient `tenant_id = any (current_tenant_ids())` et
`is_hr_or_admin()` sans argument, deux constructions qui échouent
(`0A000 set-returning functions are not allowed in WHERE`,
`42883 function is_hr_or_admin() does not exist`). Réalignées sur la forme en base
(commit `61393f2`), vérifiées par rejeu en transaction annulée : 107 policies comparées,
0 divergence.

Deux traces résiduelles du même phénomène, non corrigées :

- `m8_distribution_classes` — vue déclarée par `0025` (appliquée) mais absente de la base.
- `sync_tenant_to_atlas_people` — fonction déclarée par `0047` (appliquée) mais absente.

Dans les deux cas, la version réellement poussée différait du fichier.

---

## Ce qui est sain

- **Aucune colonne hors-dépôt sur les tables que le dépôt déclare.** Sur les 348 tables
  communes, aucune n'a de colonne en base absente du fichier. La dérive va uniquement
  dans le sens « le dépôt déclare plus que la base », et s'explique entièrement par les
  points 2 et 4.
- **Enums** : les 98 déclarés existent tous en base.
- **Fonctions** : 64 des 65 fonctions en base sont déclarées (seule `tenant_bootstrap_state`
  ne l'est pas).

## Remédiation, par ordre de valeur

1. **Figer l'état réel.** Générer un `pg_dump --schema-only` d'`atlas_people` et le
   committer comme baseline. C'est le seul moyen de rendre les 56 tables du point 1
   reproductibles sans les réécrire à la main.
2. **Trancher le sort des cinq fichiers du point 2.** Soit les appliquer, soit les
   sortir de `migrations/`. Les laisser en l'état garantit qu'un rejeu crée 47 tables
   fantômes et fait gagner les mauvaises déclarations du point 4.
3. **Corriger le point 4** avant tout rejeu : transformer les `create table if not exists`
   de `0011` en `alter table … add column if not exists`, ou supprimer les déclarations
   concurrentes de `0004`.
4. **Ajouter `set search_path = atlas_people, public, extensions;`** en tête des
   19 fichiers du point 3.
5. **Fermer la boucle d'application** : nommer les migrations `apply_migration` d'après
   le fichier, sans exception. Les noms divergents (`cdc_complement_rls_helpers_idempotency`
   pour `0044`, `mss_manager_delegations` pour `0046`) sont ce qui a masqué l'absence
   de `0045` et de `0017`/`0018`.

## Méthode et limites

Extraction des objets déclarés par analyse syntaxique des 56 fichiers (`create table`,
`create view`, `create type … as enum`, `create function`, `alter table … add column`,
y compris les `create table` dynamiques en `format(%I)` de `0016_m3_paie`), confrontée à
`information_schema` et `pg_catalog`. Deux artefacts d'extraction ont été identifiés et
écartés après vérification manuelle : le faux objet `if` issu de `format()`, et les neuf
`payroll_inputs_*` créées dynamiquement.

Non couvert : index, triggers, contraintes CHECK, valeurs par défaut, types de colonnes,
libellés d'enums, et les données de seed. La comparaison de colonnes porte sur les noms
et leur nombre, pas sur les types.
