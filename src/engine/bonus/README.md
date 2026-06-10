# Moteur Bonus variable (M3)

Calcul **déterministe** du bonus variable, dérivé de la *Note de cadrage core* §6.
Tout montant est en **Money.ts bigint** (franc FCFA entier, zéro float, R5). Le
bonus **consomme** le score final validé de la campagne (§9) et ne le recalcule
jamais ; PROPH3T ne calcule aucun bonus (R5).

## Traçabilité §6 → code

| §6 | Élément | Fonction / objet |
|----|---------|------------------|
| §4 | **DSL contrôlé** (SCORE/COEF/SAL_MENS/SAL_ANN, + − × ÷, parenthèses ; rationnels BigInt, jamais d'`eval`, R2) | `evalFormule` (`dsl.ts`) |
| §6.1 | formule `SCORE × COEF × base` (ou DSL si fourni) | `partBrute`, `scoreFraction` |
| §6.2 A | prorata enveloppe (Σ = enveloppe exact) | `repartitionBonus` (`A_prorata`) |
| §6.2 B | formule plafonnée + alerte dépassement | `repartitionBonus` (`B_plafonnee`) |
| §6.2 C | formule libre (enveloppe prévisionnelle) | `repartitionBonus` (`C_libre`) |
| §6.3 | plafond/plancher (absolus), **réconciliation itérative** des caps en mode A, arrondi FCFA, reliquat lissé | `repartProrataCaps`, `bornes` |
| §8 | simulation what-if (pur, sans persistance) | `simulateBonus` |
| §7/§9 | gating direction + consommation SCORE | migrations `0038`/`0042` (`visible_employe`, statut `affiche`, `rpc_valide_repartition`, `rpc_bonus_score_source`) |

## Sécurité / persistance (migration 0038)

- `remu_fiche` (salaire + formule), `bonus_enveloppes` (mode A/B/C), `bonus_calculs`
  (figé + chaîné SHA-256, R7).
- **Gating R6** : `visible_employe` ne passe `true` qu'à la validation direction
  de l'enveloppe (trigger). RLS (R8) : l'employé voit *son* bonus + détail
  seulement après gating ; l'enveloppe globale et les autres bonus restent RH/Direction.

## Tests

```bash
npx vitest run src/engine/bonus
```

16 cas : formule, trois modes, bornes, reliquat exact (`[333333, 333333, 333334]`).

## Simulation what-if (§6.5)

Le moteur étant pur, la RH/direction peut appeler `repartitionBonus` avec une
enveloppe et des coefficients ajustés pour visualiser **total** et **chaque
bonus** sans rien persister ni afficher (aucune écriture en base).
