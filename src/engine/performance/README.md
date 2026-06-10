# Moteur Performance (M7 OKR + M8 Évaluations)

Noyau de calcul **déterministe** du module Performance, conforme au *CDC Module
Performance (M7/M8)* et à la *Note de cadrage core Performance × Compétences ×
Bonus*. Le moteur ne calcule que des **pourcentages d'atteinte** — aucune
logique monétaire (réservée à `Money.ts` / M3), aucun appel PROPH3T (R5/R8).

## Architecture

| Couche | Fichier | Rôle |
|--------|---------|------|
| Modèle | `types.ts` | Types du modèle `perf_*`, `NotationConfig`, défauts neutres |
| Calcul | `scoring.ts` | Formules §6 : réalisation, atteinte, score, remontée, arbitrage |
| Audit | `snapshot.ts` | Snapshots figés + chaîne SHA-256 (§8, §13) |
| Façade | `index.ts` | Point d'entrée |
| Live | `../../lib/perf/supabaseLive.ts` | Appels RPC (réplique SQL du moteur) |
| SQL | `supabase/migrations/0036_m7_m8_perf_engine.sql` | Schéma, triggers, RPC, RLS |

Le moteur TS est la **référence testée** ; les RPC `rpc_calcul_*` (SQL) en sont
la réplique côté base, autorité de la couche validée (R4).

## Traçabilité CDC → code

| CDC | Formule | Fonction |
|-----|---------|----------|
| §6.1 | `pct = note / echelle_max × 100` | `pctNotation` |
| §6.2 | réalisation action (quantitatif/qualitatif, cap) | `pctRealisation` |
| §6.3 | agrégation temporelle continue / one_shot | `aggregeContinue`, `aggregeOneShot` |
| §6.4 | atteinte mensuelle / semestrielle / annuelle | `atteinteObjectifMois`, `…Semestre`, `…Annuel` |
| §6.5 | score employé `α·indiv + (1−α)·collectif` | `scoreEmploye` |
| §6.6 | remontée département → global | `remonteeDepartement`, `remonteeGlobale` |
| §6.7 | deux couches auto / valide | paramètre `Couche` |
| §7.3 | arbitrage si `|auto − valide| > seuil` | `arbitrageRequis`, `ecartCouches` |
| §8/§13 | snapshot figé + hash chaîné | `buildPerfChain`, `verifyPerfChain` |
| §9 | accroche bonus `evaluation.validee` | RPC `rpc_valide_evaluation` |

## Règles dures couvertes

R1 atteinte dérivée des actions · R2 Σ poids = 100 · R3 notation → % · R4 couche
validée seule officielle · R5 écart > seuil → arbitrage · R6 snapshot figé
immuable · R7 versioning · R8 RLS strict.

## Tests

```bash
npx vitest run src/engine/performance
```

`__tests__/scoring.test.ts` couvre chaque formule et ses bornes ;
`__tests__/snapshot.test.ts` couvre l'intégrité de la chaîne d'audit.
