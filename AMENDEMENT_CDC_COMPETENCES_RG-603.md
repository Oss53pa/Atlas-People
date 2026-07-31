# Amendement au CDC Performance & Compétences v3.0

**Objet** : échelle de maîtrise des compétences — RG-603 et ses règles dépendantes
**Date** : 31 juillet 2026
**Statut** : à intégrer au CDC v3.1
**Motif** : le CDC définit une échelle 0–4 que l'implémentation contredit depuis son origine. L'arbitrage retient l'échelle du produit.

---

## 1. Pourquoi le CDC cède et non la base

Trois constats convergents, relevés sur la base de production `atlas_people` et sur le code.

**Sept contraintes `CHECK` imposent déjà 0–5.** Sur `m9_skill_matrix` (`level`, `target_level`), `m9_eval_auto_per_competence` (`auto_level`, `target_level`), `m9_eval_manager_per_competence` (`manager_level`), `m9_eval_consolidated` (`final_level`), et `m9_job_requirements` (`min_level`, borné 1–5).

**Les six niveaux sont libellés, sans orphelin.** `LEVEL_LABEL` dans `src/pages/competences/CompetencesEnrichmentPages.tsx` couvre 0 à 5.

**Le niveau 5 est utilisé par les données.** `m9_skill_matrix.target_level` atteint 5 sur les lignes existantes.

Basculer en 0–4 exigerait d'altérer sept contraintes et de remapper des données déjà saisies, pour supprimer un palier que le produit exploite. Le coût est réel et le bénéfice nul : le CDC décrit la même progression, il lui manque simplement un cran.

**Conséquence rassurante** : « Maîtrise » vaut **3 dans les deux échelles**. Aucune règle qui référence ce niveau ne change de comportement. Seule la borne supérieure était en jeu.

---

## 2. RG-603 — texte de remplacement

> **RG-603.** Échelle de maîtrise :
>
> | Niveau | Libellé | Définition |
> |---|---|---|
> | 0 | Non acquis | Aucune pratique |
> | 1 | Notions | Connaissance théorique, pratique accompagnée |
> | 2 | Autonome | Traite seul les situations standards |
> | 3 | Maîtrise | Traite les situations complexes, arbitre |
> | 4 | Expert | Fait référence sur le périmètre, conçoit les solutions non standards |
> | 5 | Référent | Fait évoluer la pratique, forme les autres, engage l'entité sur le sujet |
>
> L'échelle comporte six niveaux. Le niveau 0 traduit l'absence de pratique et n'est jamais un attendu : un niveau attendu est toujours compris entre 1 et 5.

Les définitions des niveaux 0 à 3 sont celles du CDC v3.0, inchangées. Le niveau 4 « Expert » est inséré. L'ancien niveau 4 « Référent » devient le niveau 5, sa définition étant enrichie pour le distinguer nettement d'« Expert » — la différence porte sur la **portée** : l'Expert résout, le Référent fait évoluer la pratique et engage l'entité.

---

## 3. Règles dépendantes à corriger

### 3.1 RG-1130 (addendum, partie B) — correction obligatoire

Texte actuel :

> **RG-1130.** Toute compétence porte **quatre** descripteurs de niveau formulés en comportement observable, à la troisième personne, sans adverbe d'appréciation.

Sur une échelle à six niveaux dont le 0 est l'absence de pratique, il faut **cinq** descripteurs (niveaux 1 à 5). Remplacer par :

> **RG-1130.** Toute compétence porte **cinq** descripteurs de niveau, un par niveau de 1 à 5, formulés en comportement observable, à la troisième personne, sans adverbe d'appréciation. Le niveau 0 ne porte pas de descripteur : il traduit l'absence de pratique.

Cette correction a un effet direct sur la charge de production du référentiel socle (addendum B.5) : les postes « Descripteurs de niveau métier » passent de quatre à cinq descripteurs par compétence, soit environ 25 % de charge supplémentaire sur ce poste précis. À répercuter dans l'estimation.

### 3.2 RG-605 — à réexaminer, non tranché ici

Texte actuel :

> **RG-605.** Une compétence critique dont le niveau réel est inférieur de **deux niveaux ou plus** au niveau attendu constitue une lacune bloquante.

Un écart de deux niveaux ne porte pas la même gravité sur une échelle de six crans que sur une de cinq : le seuil devient relativement plus permissif. Deux options, à arbitrer par le métier :

- **conserver 2** — la lacune bloquante reste rare, ce qui préserve sa valeur de signal ;
- **passer à 3** — pour maintenir la sévérité relative de la v3.0.

Ce seuil est **déjà paramétrable** : il est exposé dans le registre sous `M9.thresholds.gap_severity_high_threshold` (défaut 2, bornes 1–5, migration `0059`). L'arbitrage peut donc être différé sans bloquer le développement, et révisé par entité.

### 3.3 Règles vérifiées sans impact

- **RG-604** (criticité critique 3 / importante 2 / souhaitable 1) — indépendant du nombre de niveaux.
- **RG-610** (écart = réel − attendu) — inchangé.
- **RG-611** (taux de couverture pondéré par la criticité) — la formule est un rapport de sommes bornées par le niveau attendu, donc invariante au nombre de crans.
- **RG-612** (le dépassement du niveau attendu n'augmente pas la couverture du poste occupé) — inchangé.
- **RG-628** (verrou : compétence critique retenue au niveau du manager au minimum, preuve recevable attachée) — inchangé.
- **RG-1131** (progression d'au moins un degré entre deux emplois repères d'une passerelle) — inchangé, et mécaniquement plus facile à satisfaire sur six crans.
- **RG-700** (conditions d'éligibilité à la promotion, exprimées en taux de couverture) — inchangé, les taux étant normalisés.

---

## 4. Écart résiduel à trancher : les libellés des niveaux 0 et 2

Le tableau ci-dessus conserve les libellés du CDC. L'interface, elle, en affiche deux autres :

| Niveau | CDC (ce document) | Interface (`LEVEL_LABEL`) |
|---|---|---|
| 0 | Non acquis | `—` |
| 1 | Notions | Notion |
| 2 | **Autonome** | **Pratique** |
| 3 | Maîtrise | Maîtrise |
| 4 | Expert | Expert |
| 5 | Référent | Référent |

Ce n'est pas un conflit de données — `LEVEL_LABEL` est purement de l'affichage, trivialement modifiable, sans contrainte ni donnée associée. C'est un choix de vocabulaire produit.

**Recommandation** : aligner l'interface sur le CDC (« Autonome » plutôt que « Pratique », « Non acquis » plutôt que `—`). Les descripteurs du CDC sont formulés en comportement observable comme l'exige RG-1130, et « Autonome » dit ce que le niveau signifie — « traite seul les situations standards » — là où « Pratique » ne dit rien de l'autonomie. RG-008 impose par ailleurs que les libellés soient dérivés par table de référence, sans saisie libre : il n'y a donc qu'une table à corriger.

Non appliqué ici : cela relève d'un changement de code, hors périmètre d'un amendement de CDC.

---

## 5. Traçabilité

L'arbitrage est appliqué en base et documenté dans les migrations suivantes :

| Migration | Contenu |
|---|---|
| `0059_settings_registry_m9.sql` | Déclare `M9.thresholds.mastery_level` (défaut 3, bornes 0–5) et signale la divergence |
| `0061_arbitrage_divergences_m9_m11.sql` | Inscrit l'arbitrage dans la description du paramètre, avec le détail des sept contraintes |

Le paramètre `mastery_level` reste à **3**, valeur juste sous l'une comme sous l'autre échelle.
