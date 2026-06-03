# M5 RECRUTEMENT — BESOIN DE RECRUTEMENT
## Demande, validation budget, business case, workflow d'autorisation
*God mode premium. Référence : 01_FONDATION.md, M3 paie (budget), M4 admin RH (contrat).*

---

# 0. POSITIONNEMENT

Le **besoin de recrutement** est le **point d'entrée du processus** : c'est l'expression formelle d'un besoin de recruter, validée par les acteurs habilités (hiérarchie, RH, finance, direction), qui débouche sur la publication d'une offre.

Un **besoin** ≠ une **offre** :
- Le besoin est interne (process de validation).
- L'offre est externe (publication candidat).
- 1 besoin → 1..N offres (ex. besoin de 3 commerciaux → 1 offre publiée pour les 3 postes).

## 0.1 Routes

- `/hr/recrutement/besoins` → Liste besoins
- `/hr/recrutement/besoins/nouveau` → Wizard nouveau besoin
- `/hr/recrutement/besoins/{besoinId}` → Détail
- `/hr/recrutement/besoins/{besoinId}/business-case` → Business case
- `/hr/recrutement/besoins/calendrier` → Calendrier prévisionnel embauches

## 0.2 Accès

- Création : Manager opérationnel (sa team), RRH, DRH.
- Validation N1 (process) : RRH ou Responsable recrutement.
- Validation N2 (budget) : DAF.
- Validation finale : DRH (et DG si poste stratégique ou montant > seuil).

---

# 1. TYPOLOGIE DES BESOINS

## 1.1 5 types de besoins

| Type | Description | Validation requise |
|------|-------------|--------------------|
| **CREATION** | Création de poste nouveau (pas d'équivalent existant) | RRH + DAF + DRH (+ DG si >50M FCFA/an) |
| **REMPLACEMENT** | Remplacement d'un collaborateur sorti | RRH + DRH (allégé) |
| **RENFORT** | Augmentation d'effectif sur poste existant (croissance) | RRH + DAF + DRH |
| **TRANSFORMATION** | Création poste avec suppression d'autre poste | RRH + DAF + DRH |
| **PROJET** | Recrutement temporaire pour projet spécifique (CDD) | RRH (allégé) |

## 1.2 Caractérisation

Pour chaque besoin :
- **Type** (parmi les 5 ci-dessus).
- **Volume** (nombre de postes à pourvoir).
- **Urgence** : standard, urgent (< 30j), critique (< 15j).
- **Type contrat cible** : CDI, CDD, alternance, etc.
- **Profil** : junior, confirmé, senior, expert, direction.
- **Localisation** : site, télétravail, hybride.

---

# 2. WIZARD CRÉATION BESOIN

## 2.1 Étape 1 — Type et contexte

```
┌──────────────────────────────────────────────────────────────────────┐
│ Nouveau besoin de recrutement (1/6)                                    │
├──────────────────────────────────────────────────────────────────────┤
│ TYPE DE BESOIN                                                        │
│ ● Création nouveau poste                                              │
│ ○ Remplacement (collaborateur sorti)                                   │
│ ○ Renfort (augmentation effectif)                                     │
│ ○ Transformation (création + suppression)                              │
│ ○ Projet (CDD temporaire)                                              │
│                                                                       │
│ Si remplacement : qui remplace-t-on ?                                  │
│ [▾ Rechercher collaborateur sorti]                                     │
│                                                                       │
│ Si transformation : poste(s) supprimé(s) ?                             │
│ [▾ Sélectionner postes à supprimer]                                    │
│                                                                       │
│ VOLUME : [_1__] poste(s)                                               │
│                                                                       │
│ URGENCE :                                                              │
│ ○ Standard (60-90 jours)                                              │
│ ● Urgent (< 30 jours)                                                 │
│ ○ Critique (< 15 jours)                                                │
│                                                                       │
│ MOTIVATION/CONTEXTE :                                                  │
│ [TextArea : raisons du besoin, contexte business...]                   │
│                                                                       │
│                                          [Continuer →]                │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.2 Étape 2 — Définition du poste

```
┌──────────────────────────────────────────────────────────────────────┐
│ Nouveau besoin (2/6) - Définition du poste                            │
├──────────────────────────────────────────────────────────────────────┤
│ IDENTIFICATION                                                        │
│  Intitulé du poste : [Chef de Projet Commercial___________]            │
│  Service : [Direction Commerciale ▾]                                  │
│  Manager hiérarchique : [Hadja TIMITÉ ▾]                              │
│  Rattachement budgétaire : [DC-2026 ▾]                                │
│                                                                       │
│ CLASSIFICATION                                                        │
│  Catégorie pro : [Cadre B ▾]                                          │
│  Échelon prévu : [3 ▾]                                                 │
│  Coefficient CCN : [540] (auto)                                       │
│                                                                       │
│ CONTRAT CIBLE                                                         │
│  Type : ● CDI  ○ CDD  ○ Alternance  ○ Stage  ○ Expatrié                │
│                                                                       │
│ LOCALISATION                                                          │
│  Site principal : [Cosmos Yopougon ▾]                                 │
│  Télétravail : ☑ 2 jours/semaine maximum                              │
│  Déplacements : [_30_] % du temps                                     │
│                                                                       │
│ TEMPS DE TRAVAIL                                                      │
│  Régime : ● Plein temps  ○ Temps partiel [_%_]                        │
│  Horaires : [Standard 40h/semaine ▾]                                  │
│                                                                       │
│                                          [Continuer →]                │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.3 Étape 3 — Profil recherché

```
┌──────────────────────────────────────────────────────────────────────┐
│ Nouveau besoin (3/6) - Profil recherché                                │
├──────────────────────────────────────────────────────────────────────┤
│ EXPÉRIENCE                                                            │
│  Niveau : ○ Junior (0-3 ans)  ● Confirmé (3-7 ans)  ○ Senior (7+)     │
│  Années min : [3] · max : [7]                                          │
│                                                                       │
│ FORMATION                                                             │
│  Niveau min : [Bac+5 ▾]                                                │
│  Spécialisation : [Commerce, Marketing, Management]                    │
│  Diplômes acceptés : [MBA, Master Management, École Commerce]          │
│                                                                       │
│ COMPÉTENCES TECHNIQUES (obligatoires)                                 │
│  [+ Ajouter compétence]                                                │
│  • Pilotage projet commercial (niveau Avancé)                          │
│  • Maîtrise CRM (Salesforce, HubSpot) (niveau Confirmé)                │
│  • Négociation B2B (niveau Avancé)                                     │
│  • Analyse financière (niveau Intermédiaire)                           │
│                                                                       │
│ COMPÉTENCES TECHNIQUES (souhaitables)                                 │
│  • Maîtrise reporting (Power BI, Tableau)                              │
│  • Connaissance secteur centres commerciaux                            │
│                                                                       │
│ COMPÉTENCES COMPORTEMENTALES                                          │
│  • Leadership                                                          │
│  • Communication                                                       │
│  • Orientation résultats                                               │
│  • Adaptabilité                                                        │
│  • Esprit d'équipe                                                     │
│                                                                       │
│ LANGUES                                                                │
│  Français : [Bilingue ▾]                                              │
│  Anglais : [Courant ▾]                                                 │
│  Autres : [—]                                                          │
│                                                                       │
│ MOBILITÉ                                                               │
│  Mobilité géographique : ☑ Côte d'Ivoire                              │
│  Mobilité internationale : ☐ Non requise                              │
│                                                                       │
│                                          [Continuer →]                │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.4 Étape 4 — Rémunération et budget

```
┌──────────────────────────────────────────────────────────────────────┐
│ Nouveau besoin (4/6) - Rémunération & Budget                          │
├──────────────────────────────────────────────────────────────────────┤
│ FOURCHETTE DE RÉMUNÉRATION (mensuel brut)                             │
│  Min : [800 000] FCFA                                                  │
│  Max : [1 100 000] FCFA                                                │
│  Médiane marché : 950 000 FCFA (source : benchmark interne 2026)       │
│  ⚠ Fourchette doit être cohérente avec grille salariale Cadre B échelon 3│
│                                                                       │
│ INDEMNITÉS PRÉVUES                                                    │
│  Indemnité logement : [250 000] FCFA                                   │
│  Indemnité transport : [45 000] FCFA                                   │
│  Prime fonction : [75 000] FCFA                                        │
│                                                                       │
│ AUTRES AVANTAGES                                                      │
│  ☑ Mutuelle santé                                                     │
│  ☑ Tickets restaurant                                                  │
│  ☑ Téléphone professionnel                                             │
│  ☑ Ordinateur portable                                                 │
│  ☐ Voiture de fonction                                                │
│  ☐ Logement de fonction                                                │
│                                                                       │
│ COÛT EMPLOYEUR ESTIMÉ                                                 │
│  Salaire brut médian : 950 000 FCFA                                   │
│  + Indemnités : 370 000 FCFA                                           │
│  Total brut : 1 320 000 FCFA                                           │
│  + Charges patronales (21%) : 277 200 FCFA                             │
│  + Autres avantages : ~80 000 FCFA                                     │
│  ─────                                                                │
│  COÛT EMPLOYEUR MENSUEL : ~1 677 200 FCFA                              │
│  COÛT EMPLOYEUR ANNUEL : ~20 126 400 FCFA (12 mois) + ~22 097 200 (13)│
│                                                                       │
│ COÛT RECRUTEMENT ESTIMÉ                                                │
│  Frais diffusion jobboards : 250 000 FCFA                              │
│  Coût temps RH/manager (estim.) : 850 000 FCFA                         │
│  Coût onboarding : 200 000 FCFA                                        │
│  ─────                                                                │
│  COÛT RECRUTEMENT : ~1 300 000 FCFA                                    │
│                                                                       │
│ BUDGET TOTAL ANNÉE 1 : ~23 400 000 FCFA (coût employé + recrutement)   │
│                                                                       │
│ IMPACT BUDGET ANNUEL ALLOCATION DC :                                   │
│  Budget DC restant 2026 : 145 000 000 FCFA                             │
│  Impact : -23 400 000 FCFA                                             │
│  Restant après : 121 600 000 FCFA ✅ Budget disponible                 │
│                                                                       │
│                                          [Continuer →]                │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.5 Étape 5 — Calendrier et organisation

```
┌──────────────────────────────────────────────────────────────────────┐
│ Nouveau besoin (5/6) - Calendrier                                      │
├──────────────────────────────────────────────────────────────────────┤
│ DATES SOUHAITÉES                                                      │
│  Date de prise de poste idéale : [📅 01/08/2026]                       │
│  Date de prise de poste tardive : [📅 01/10/2026]                      │
│                                                                       │
│ JALONS PRÉVISIONNELS (calculés automatiquement)                       │
│  Validation besoin : J+0 à J+10                                        │
│  Rédaction offre : J+10 à J+15                                         │
│  Publication & sourcing : J+15 à J+45                                  │
│  Pré-qualifications : J+20 à J+50                                      │
│  Entretiens : J+30 à J+60                                              │
│  Comité hiring & décision : J+55 à J+65                                │
│  Offre & négo : J+60 à J+75                                            │
│  Préavis candidat (3 mois si CDI) : J+75 à J+165                       │
│  Prise de poste : J+165 (envir. 01/12/2026)                            │
│                                                                       │
│ ⚠ Date prévisionnelle (01/12/2026) postérieure à date souhaitée (01/08)│
│ Recommandation : accepter un préavis raccourci ou anticiper            │
│                                                                       │
│ ÉQUIPE RECRUTEMENT                                                    │
│  Recruteur principal : [▾]                                             │
│  Manager opérationnel : Hadja TIMITÉ                                  │
│  Pour décision finale : [Comité hiring : RRH + DRH + Manager + DG ?]   │
│                                                                       │
│ DIFFUSION ENVISAGÉE                                                   │
│  ☑ Site carrière interne                                              │
│  ☑ LinkedIn (premium)                                                 │
│  ☑ Cooptation interne                                                  │
│  ☑ Indeed                                                             │
│  ☐ Cabinet de recrutement                                              │
│  ☐ Approche directe (chasse)                                           │
│                                                                       │
│                                          [Continuer →]                │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.6 Étape 6 — Validation et soumission

```
┌──────────────────────────────────────────────────────────────────────┐
│ Nouveau besoin (6/6) - Soumission                                      │
├──────────────────────────────────────────────────────────────────────┤
│ RÉCAPITULATIF                                                         │
│  Type : CREATION                                                      │
│  Volume : 1 poste                                                     │
│  Urgence : Urgent                                                     │
│  Poste : Chef de Projet Commercial                                    │
│  Service : Direction Commerciale                                       │
│  Manager : Hadja TIMITÉ                                                │
│  Salaire médian : 950 000 FCFA                                         │
│  Coût annuel : ~23,4M FCFA                                             │
│  Date cible : 01/08/2026 (réaliste : 01/12/2026)                      │
│                                                                       │
│ WORKFLOW DE VALIDATION                                                │
│  Étape 1 : Validation RRH (Aboubakar KONÉ) - en attente               │
│  Étape 2 : Validation DAF (Aniela DIALLO) - en attente                 │
│  Étape 3 : Validation DRH (Hadja TIMITÉ) - en attente                  │
│  Étape 4 : Validation DG (Cheick DIALLO) - non requise (< 50M)        │
│                                                                       │
│ JUSTIFICATION                                                         │
│  [TextArea : business case détaillé...]                                │
│                                                                       │
│ PIÈCES JOINTES (optionnel)                                            │
│  [📎 Joindre fiche de poste, organigramme, business case détaillé]    │
│                                                                       │
│ NOTIFICATIONS                                                         │
│  ☑ Notifier validateurs                                                │
│  ☑ M'avertir à chaque étape                                            │
│                                                                       │
│ [Soumettre pour validation]                                           │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 3. WORKFLOW DE VALIDATION

## 3.1 Étapes

```
[draft]
   ↓ (submit)
[pending_rrh]
   ↓ (validation RRH)
[pending_daf]
   ↓ (validation DAF - vérif budget)
[pending_drh]
   ↓ (validation DRH)
[pending_dg]  (si seuil dépassé)
   ↓ (validation DG)
[approved] → création offre possible
   ↓ (offre publiée)
[in_progress]
   ↓ (candidat retenu)
[hired] OU [closed_no_hire]
```

## 3.2 Délais SLA par étape

| Étape | SLA standard | SLA urgent |
|-------|--------------|------------|
| Validation RRH | 3 jours | 1 jour |
| Validation DAF | 3 jours | 2 jours |
| Validation DRH | 3 jours | 1 jour |
| Validation DG (si applicable) | 5 jours | 3 jours |

Si dépassement SLA : notification escalade.

## 3.3 Validation conditionnelle

Un validateur peut :
- **Approuver** sans condition.
- **Approuver avec modifications** (ex. réduire fourchette salariale).
- **Demander précisions** (retour au demandeur).
- **Refuser** avec motif.

## 3.4 Layout validation

```
┌──────────────────────────────────────────────────────────────────────┐
│ Demande validation - Besoin BES-2026-0245                              │
│ Pour DAF Aniela DIALLO                                                 │
├──────────────────────────────────────────────────────────────────────┤
│ SYNTHÈSE                                                              │
│  Poste : Chef de Projet Commercial                                     │
│  Demandeur : Hadja TIMITÉ (Manager DC)                                 │
│  Validation RRH : ✅ Validé le 02/06 par Aboubakar KONÉ                │
│  Budget annuel : 23 400 000 FCFA                                       │
│                                                                       │
│ ANALYSE FINANCIÈRE                                                    │
│  Impact masse salariale 2026 : +6 825 000 FCFA (5 mois)                │
│  Impact masse salariale 2027 : +23 400 000 FCFA (année pleine)         │
│  ROI estimé : revenu additionnel projeté +85M FCFA/an                  │
│                                                                       │
│ COHÉRENCE BUDGÉTAIRE                                                  │
│  Budget DC 2026 : 145M restants                                       │
│  Après ce recrutement : 121,6M restants ✅                             │
│  Recrutements DC déjà en cours : 2                                    │
│  Total impact 2027 : +73,2M FCFA                                       │
│                                                                       │
│ DÉCISION                                                              │
│  ● Approuver                                                          │
│  ○ Approuver avec modifications                                       │
│  ○ Demander précisions                                                │
│  ○ Refuser                                                            │
│                                                                       │
│ Commentaire :                                                         │
│ [TextArea]                                                            │
│                                                                       │
│ [Soumettre décision]                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 4. BUSINESS CASE (POUR POSTES STRATÉGIQUES)

Pour les **créations de postes** ou **transformations**, un business case structuré est requis :

## 4.1 Contenu standard

1. **Contexte** : pourquoi ce poste maintenant.
2. **Objectifs business** : KPI attendus du poste.
3. **Périmètre** : missions principales, responsabilités.
4. **Alternatives évaluées** : pourquoi pas externalisation, intérim, mobilité interne, etc.
5. **Coûts** : recrutement + employé année 1 + années suivantes.
6. **Bénéfices attendus** : revenus, économies, gains qualité.
7. **ROI** : retour sur investissement projeté.
8. **Risques** : difficultés recrutement, performance attendue.
9. **Calendrier** : dates clés.
10. **Décision recommandée** : go / no-go / shortlist.

## 4.2 Génération assistée

PROPH3T peut générer un brouillon de business case basé sur :
- Données du besoin (type, contexte, coûts).
- Benchmarks internes.
- Templates standards.

Le demandeur enrichit et valide.

---

# 5. CALENDRIER PRÉVISIONNEL DES EMBAUCHES

## 5.1 Vue globale

```
┌──────────────────────────────────────────────────────────────────────┐
│ Calendrier prévisionnel embauches - Année 2026                         │
├──────────────────────────────────────────────────────────────────────┤
│ Filtres : [Service ▾] [Site ▾] [Urgence ▾]                            │
├──────────────────────────────────────────────────────────────────────┤
│ MOIS       │ EMBAUCHES PRÉVUES │ EN COURS DE RECRUTEMENT             │
│ ────────── │ ────────────────── │ ────────────────────────────────── │
│ Janvier    │ 5 (réalisées)      │ —                                   │
│ Février    │ 8 (réalisées)      │ —                                   │
│ ...                                                                   │
│ Juillet    │ 3 (réalisées)      │ —                                   │
│ Août       │ 2 (prévues)        │ DC-Chef projet, Compta-Assistant   │
│ Septembre  │ 5 (prévues)        │ + 3 recrutements en cours          │
│ Octobre    │ 7 (prévues)        │ + 5 recrutements en lancement       │
│ Novembre   │ 3                  │                                     │
│ Décembre   │ 4                  │                                     │
├──────────────────────────────────────────────────────────────────────┤
│ TOTAL ANNÉE : 48 embauches (35 réalisées, 13 prévues)                  │
│ Vs Budget initial 2026 : 42 embauches → +6 (recrutements opportunités)  │
└──────────────────────────────────────────────────────────────────────┘
```

## 5.2 Détection alertes

- Recrutements en retard / SLA.
- Recrutements concurrents pour mêmes profils (concentration).
- Saturation équipe RH (trop de recrutements simultanés).

---

# 6. TABLES IMPLIQUÉES

### Nouvelles
- `recruitment_needs` (besoins - table maîtresse)
- `recruitment_need_types` (référentiel 5 types)
- `recruitment_need_validations` (workflow validation)
- `recruitment_need_business_cases` (business cases)
- `recruitment_need_skills_required` (compétences requises)
- `recruitment_need_documents` (PJ)
- `recruitment_need_audit_log`

### Consultées
- `employees` (manager hiérarchique)
- `services` (organisation)
- `payroll_budgets` (vérif budget)
- `compensation_grids` (cohérence fourchette salariale)

---

# 7. APIS BESOINS

```
GET  /hr/recrutement/besoins?filters=
GET  /hr/recrutement/besoins/{besoinId}
POST /hr/recrutement/besoins
PATCH /hr/recrutement/besoins/{besoinId}
POST /hr/recrutement/besoins/{besoinId}/submit
POST /hr/recrutement/besoins/{besoinId}/validate-rrh
POST /hr/recrutement/besoins/{besoinId}/validate-daf
POST /hr/recrutement/besoins/{besoinId}/validate-drh
POST /hr/recrutement/besoins/{besoinId}/validate-dg
POST /hr/recrutement/besoins/{besoinId}/reject
POST /hr/recrutement/besoins/{besoinId}/cancel

GET  /hr/recrutement/besoins/{besoinId}/business-case
POST /hr/recrutement/besoins/{besoinId}/business-case/generate-draft (PROPH3T)
PATCH /hr/recrutement/besoins/{besoinId}/business-case

GET  /hr/recrutement/besoins/calendrier?period=&filters=
GET  /hr/recrutement/besoins/alerts

POST /hr/recrutement/besoins/{besoinId}/create-offer (passe en publication)
```

---

# 8. SYNTHÈSE

**Besoin de recrutement** :
- Point d'entrée du processus, séparé de l'offre publique.
- 5 types : CREATION, REMPLACEMENT, RENFORT, TRANSFORMATION, PROJET.
- Wizard 6 étapes (type → poste → profil → budget → calendrier → soumission).
- Workflow validation 4 niveaux : RRH → DAF → DRH → DG (si seuil).
- Validation budget intégrée (impact masse salariale calculé).
- Business case structuré pour postes stratégiques (génération assistée PROPH3T).
- Calendrier prévisionnel global des embauches.

**Règles dures** :
- Pas d'offre sans besoin validé.
- Validation DAF obligatoire (budget).
- Validation DRH systématique.
- Validation DG si coût annuel > 50M FCFA ou poste direction.
- Cohérence fourchette salariale avec grille M3 enforcée.
- Audit chaîné.

---

*Fin spécification 02 — Besoin de recrutement.*
