# Noyau Compétences (M9) — CDC core

Mécanique de calcul **déterministe** du module Compétences, dérivée de la *Note
de cadrage core Performance × Compétences × Bonus* §5. Complète le référentiel
`m9_*` existant (skills, jobs, exigences) avec ce qui manquait : **triangulation**
employé/manager/RH, **analyse d'écart**, **verdict de readiness** et **péremption**.

## Périmètre (note de cadrage §5)

1. **Référentiel & niveaux** — taxonomie de familles, niveau de maîtrise
   échelonné paramétrable (R3, jamais binaire). *Réutilise `m9_skills` (échelle 0–5).*
2. **Attentes par poste** — `niveau_attendu` + `criticité` par compétence ; le
   poste suivant définit la cible de mobilité. *Réutilise `m9_job_requirements`.*
3. **Évaluation triangulée + preuves** — employé (preuve), manager
   (contre-évaluation), RH (avis historique) → `niveau_retenu` = validé manager
   consolidé (R4). Preuve réutilisable depuis la Performance (`preuves.source_action_id`, R9).
4. **Écart & readiness** — `écart = niveau_attendu − niveau_retenu` ; verdict
   `prêt` / `prêt sous conditions` / `pas prêt`, conditions = écarts restants.
5. **Péremption** — `date_validite` dépassée → `périmé` ; ne compte jamais comme acquis (§5.5).

## Architecture

| Couche | Fichier | Rôle |
|--------|---------|------|
| Modèle | `types.ts` | Échelle, triangulation, attentes, écarts, readiness |
| Calcul | `readiness.ts` | niveau retenu, statut, écart, verdict, couverture |
| Façade | `index.ts` | Point d'entrée |
| SQL | `supabase/migrations/0037_m9_competences_core.sql` | `comp_evaluations`, `comp_readiness`, triggers, RPC, RLS |

## Traçabilité §5 → code

| §5 | Élément | Fonction / objet SQL |
|----|---------|----------------------|
| §3 | niveau → % | `pctMaitrise` |
| §5.3 | triangulation → retenu (R4) | `niveauRetenu`, trigger `comp_set_retenu` |
| §5.3 | preuve obligatoire (R9) | `evalueCompetence`, `preuve_id` |
| §5.4 | écart vs poste suivant | `ecartCompetence` |
| §5.4 | verdict readiness + couverture | `evalueReadiness`, `analyseAccesPoste`, RPC `rpc_comp_readiness` |
| §5.5 | péremption | `statutPeremption`, trigger |

## Règles dures couvertes

R3 niveau échelonné → % · R4 `niveau_retenu` = validé manager · R7 readiness
figée + chaînée SHA-256 · R8 RLS strict (employé/manager N-1/RH) · R9 une
compétence se prouve.

## Tests

```bash
npx vitest run src/engine/competences
```

`__tests__/readiness.test.ts` (19 cas) couvre la triangulation, la péremption,
les trois verdicts et la couverture pondérée par criticité.

## Aval

Le verdict alimente la **succession** (M10) et la **9-box** ; les écarts
alimentent un **plan de développement** (M11 Formation). Voir note de cadrage §10.
