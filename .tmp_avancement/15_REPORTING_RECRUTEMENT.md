# M5 RECRUTEMENT — REPORTING
## Funnel, time-to-hire, cost-per-hire, quality-of-hire, dashboards
*God mode premium. Référence : 01_FONDATION.md (KPI cibles), tous documents M5.*

---

# 0. POSITIONNEMENT

Le **reporting recrutement** transforme l'activité opérationnelle en **données pilotables** par :
- **Responsable Recrutement** : pilotage opérationnel quotidien/hebdo.
- **DRH** : pilotage stratégique mensuel/trimestriel.
- **DG / COMEX** : vision exécutive.
- **DAF** : maîtrise coûts et budget.
- **Compliance / DPO** : conformité & équité.

Cette section couvre :
- **KPI fondamentaux** définition, calcul, cibles.
- **Funnel de conversion** détaillé par étape.
- **Time-to-fill / Time-to-hire** avec décomposition.
- **Cost-per-hire** complet (coûts directs + indirects).
- **Quality-of-hire** (rétention + performance).
- **Diversity at hire** (équité).
- **Source effectiveness** (ROI par canal — déjà esquissé doc 04).
- **Dashboards** par profil utilisateur.

## 0.1 Routes

- `/hr/recrutement/reporting` → Hub reporting
- `/hr/recrutement/reporting/dashboards` → Dashboards interactifs
- `/hr/recrutement/reporting/kpi` → Détail KPI
- `/hr/recrutement/reporting/funnel` → Funnel conversion
- `/hr/recrutement/reporting/exports` → Exports planifiés
- `/hr/recrutement/reporting/predictions` → Prédictions PROPH3T

---

# 1. KPI FONDAMENTAUX — DÉFINITIONS

## 1.1 Time metrics

### Time-to-fill (TTF)
**Définition** : Délai entre la **publication de l'offre** et la **date d'acceptation** de l'offre par le candidat retenu.

```
TTF = date_offer_accepted - date_offer_published
```

**Cible** : < 45 jours moyenne tous postes confondus.

### Time-to-hire (TTH)
**Définition** : Délai entre la **première candidature** du candidat retenu et l'**acceptation de son offre**.

```
TTH = date_offer_accepted - date_application_received (du candidat retenu)
```

**Cible** : < 21 jours moyenne.

### Time-to-start (TTS)
**Définition** : Délai entre l'**acceptation de l'offre** et la **prise de poste effective**.

```
TTS = date_actual_start - date_offer_accepted
```

**Cible** : Variable (dépend préavis) — 30-90 jours typique.

### Time-to-productivity (TTP)
**Définition** : Délai entre la **prise de poste** et l'**atteinte d'un niveau de productivité satisfaisant** (mesuré via M8 Évaluations à J+90).

**Cible** : < 90 jours.

## 1.2 Volume metrics

| KPI | Définition |
|-----|-----------|
| **Offres ouvertes** | Offres avec statut `published` à date T |
| **Offres pourvues mois** | Offres passées en `closed_hired` ce mois |
| **Candidatures reçues** | Volume candidatures dans la période |
| **Embauches** | Candidats avec statut `hired` |
| **Taux remplissage** | Embauches / Postes à pourvoir |

## 1.3 Conversion metrics

| KPI | Définition |
|-----|-----------|
| **Application Rate** | Candidatures / Vues offre |
| **Pre-qualification Rate** | Pré-qualifiés / Candidatures totales |
| **Interview Rate** | Entretiens tenus / Pré-qualifiés |
| **Offer Rate** | Offres envoyées / Entretiens tenus |
| **Acceptance Rate** | Offres acceptées / Offres envoyées |
| **Show-up Rate** | Embauches effectives / Offres acceptées |
| **Conversion globale** | Embauches / Candidatures |

## 1.4 Cost metrics

### Cost-per-hire (CPH)
**Définition** : Coût total du recrutement / Nombre d'embauches.

```
CPH = (Coûts externes + Coûts internes + Coûts technologie) / Nb embauches
```

**Composantes** :
- **Coûts externes** : jobboards, cabinets, événements, communication.
- **Coûts internes** : temps RH + manager + autres collaborateurs × taux horaire.
- **Coûts technologie** : abonnement ATS + tests partenaires.
- **Coûts onboarding** : préparation, équipement.

**Cibles** :
- Cadre B/A : < 800 000 FCFA
- Maîtrise/Employé : < 300 000 FCFA
- Direction/Profil rare : < 2 500 000 FCFA

### Cost-per-application (CPA)
**Définition** : Coût des actions sourcing / Candidatures reçues.

## 1.5 Quality metrics

### Quality-of-hire (QoH)
**Définition** : Score composite intégrant :
- Performance à 6 mois (note évaluation M8).
- Taux de rétention 12 mois (toujours en poste J+12).
- Évaluation manager (subjective).

```
QoH = (Score_perf_6m × 0.4) + (Retention_12m × 0.3) + (Score_manager × 0.3)
```

Échelle 0-100. **Cible** : > 75.

### Retention rate
**Définition** : % collaborateurs encore en poste à 6, 12, 24 mois post-embauche.

**Cibles** :
- 6 mois : > 95% (sortir un échec d'embauche en 6 mois = échec recrutement)
- 12 mois : > 90%
- 24 mois : > 85%

### Probation pass rate
**Définition** : % candidats validant leur période d'essai.

**Cible** : > 95%.

## 1.6 Experience metrics

### Candidate Experience Score (CXS)
Cf. doc 09. Note moyenne enquête satisfaction post-process.

**Cible** : > 4/5.

### Candidate NPS
Cf. doc 09. Promoteurs - Détracteurs.

**Cible** : > +30.

## 1.7 Diversity metrics

### Diversity at hire
**Définition** : Répartition démographique des embauches sur période.

Suivi :
- Genre (H/F).
- Tranche âge.
- Catégorie professionnelle.

**Cibles** :
- Parité H/F (cadres + maîtrise) : 40-60% chaque genre.
- Diversité tranches âge : pas de discrimination.

### Internal mobility ratio
**Définition** : Embauches internes / Total embauches.

**Cible** : > 25%.

---

# 2. FUNNEL DE CONVERSION

## 2.1 Funnel type — visualisation

```
┌──────────────────────────────────────────────────────────────────────┐
│ FUNNEL RECRUTEMENT - OFR-2026-0245 Chef de Projet Commercial         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  📢 Vues offre               ████████████████████████████  1 247       │
│                                          ↓ 3.0%                       │
│  📝 Candidatures reçues       ████                          38         │
│                                          ↓ 65.8%                      │
│  ✅ Pré-qualifiés              ███                           25        │
│                                          ↓ 64.0%                      │
│  📞 Entretien recruteur        ██                            16        │
│                                          ↓ 56.3%                      │
│  💼 Entretien manager          ██                            9         │
│                                          ↓ 55.6%                      │
│  🎯 Entretien finale           █                             5         │
│                                          ↓ 60.0%                      │
│  📜 Offres envoyées            █                             3         │
│                                          ↓ 100.0%                     │
│  🤝 Acceptation               █                             3         │
│                                                                       │
│  CONVERSION GLOBALE : 0.24% (vues → embauches)                        │
│  TIME-TO-FILL : 38 jours ✅ (< cible 45j)                              │
│  TIME-TO-HIRE : 18 jours ✅ (< cible 21j)                              │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ DROP-OFF ANALYSIS                                                      │
│  ⚠ Plus gros drop : Entretien recruteur → Entretien manager (43%)     │
│  💡 Action : Renforcer briefing manager avant entretien recruteur     │
│                                                                       │
│  Drops par raison :                                                   │
│  • Pré-qualif éliminés (13) : profil non match (8), salaire (3),       │
│    expérience (2)                                                     │
│  • Entretien recruteur éliminés (9) : compétences (4), motivation (3), │
│    désistement (2)                                                    │
│  • Entretien manager (7) : technique (4), fit équipe (3)              │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.2 Funnel global (toutes offres)

```
┌──────────────────────────────────────────────────────────────────────┐
│ FUNNEL GLOBAL - Mai 2026                                              │
├──────────────────────────────────────────────────────────────────────┤
│ Étape                    │ Volume │ Convers. │ Taux moyen secteur     │
│ ──────────────────────── │ ────── │ ──────── │ ──────────────────────│
│ Vues offres              │ 12 380 │ —        │ —                      │
│ Candidatures             │   485  │ 3.9%     │ 2-3% (✅ au-dessus)    │
│ Pré-qualifiés            │   285  │ 58.8%    │ 50-60% (✅ aligné)     │
│ Entretien recruteur      │   178  │ 62.5%    │ 55-65%                │
│ Entretien manager        │    98  │ 55.1%    │ 50-60%                │
│ Entretien finale         │    52  │ 53.1%    │ 45-55%                │
│ Tests                    │    48  │ 92.3%    │ —                      │
│ Comité hiring            │    35  │ 72.9%    │ —                      │
│ Offres envoyées          │    28  │ 80.0%    │ —                      │
│ Acceptations             │    23  │ 82.1%    │ 75-85% (✅ aligné)     │
│ Embauches effectives     │    21  │ 91.3%    │ 90-95%                │
├──────────────────────────────────────────────────────────────────────┤
│ CONVERSION GLOBALE       │ 0.17%  │ (vues → embauches)                │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 3. DASHBOARD RESPONSABLE RECRUTEMENT

```
┌──────────────────────────────────────────────────────────────────────┐
│ Dashboard Responsable Recrutement - Aboubakar KONÉ                    │
│ Période : Mois en cours (Mai 2026)                                    │
├──────────────────────────────────────────────────────────────────────┤
│ KPI CLÉS                                                              │
│  📊 Offres ouvertes         : 18 (-3 vs M-1)                          │
│  📝 Candidatures mois       : 485 (+12% vs M-1)                        │
│  🤝 Embauches mois          : 21 (cible 18 ✅)                         │
│  ⏱ Time-to-fill moyen       : 38j ✅                                  │
│  💰 Cost-per-hire moyen     : 312K FCFA                                │
│  ⭐ Candidate Experience    : 4.3/5                                    │
├──────────────────────────────────────────────────────────────────────┤
│ PIPELINE PAR OFFRE (Top 5 actives)                                    │
│                                                                       │
│ Offre                    │ Stage     │ Volume │ Time open │ Statut    │
│ ───────────────────────  │ ───────── │ ────── │ ────────  │ ───────── │
│ Chef Projet Commercial   │ Finale    │  3     │ 32j       │ 🟢 OK     │
│ Comptable Senior         │ Entretien │  5     │ 22j       │ 🟢 OK     │
│ Resp Maintenance Angré   │ Pré-qualif│ 12     │ 18j       │ 🟢 OK     │
│ Acheteur                 │ Sourcing  │  2     │ 45j       │ 🟡 Slow   │
│ Comm. Mall Angré         │ Sourcing  │  1     │ 60j ⚠     │ 🔴 Block  │
├──────────────────────────────────────────────────────────────────────┤
│ ACTIONS REQUISES                                                      │
│  • Relancer cabinet ABC sur poste Comm. Mall (J-60)                    │
│  • Préparer comité hiring Chef Projet Commercial vendredi              │
│  • 3 candidatures en silence > 7 jours (à traiter)                     │
├──────────────────────────────────────────────────────────────────────┤
│ EFFICACITÉ SOURCING (Top canaux)                                      │
│  1. Cooptation : 4 hires / 28 cooptations (14% conv) - 245K CPH ⭐    │
│  2. LinkedIn : 6 hires / 110 candid (5%) - 380K CPH                    │
│  3. Site carrière : 5 hires / 180 candid (3%) - 180K CPH               │
│  4. Indeed : 3 hires / 95 candid (3%) - 270K CPH                       │
│  5. Cabinet ABC : 2 hires / 8 propos. - 4 200K CPH ⚠                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 4. DASHBOARD DRH

```
┌──────────────────────────────────────────────────────────────────────┐
│ Dashboard DRH - Hadja TIMITÉ                                          │
│ Période : T2 2026 (Avr-Juin)                                          │
├──────────────────────────────────────────────────────────────────────┤
│ VOLUME EMBAUCHES                                                      │
│  Embauches T2 : 58 (vs budget 65, déficit -7)                         │
│  Cumul YTD 2026 : 156 (vs budget 165)                                  │
│  Projection annuelle : ~315 (vs budget 320)                            │
│                                                                       │
│ PAR CATÉGORIE                                                         │
│  • Cadre A/B : 18 ✅                                                  │
│  • Maîtrise : 22 ✅                                                   │
│  • Employé : 12 ⚠ (retard)                                            │
│  • Ouvrier/Agent : 6                                                  │
├──────────────────────────────────────────────────────────────────────┤
│ QUALITÉ                                                                │
│  Quality-of-Hire moyen : 78/100 ✅ (cible 75)                          │
│  Période d'essai validée : 96% ✅                                     │
│  Rétention 12 mois (cohorte 2025) : 91% ✅                             │
│  Time-to-Productivity moyen : 84 jours ✅                              │
├──────────────────────────────────────────────────────────────────────┤
│ COÛTS                                                                  │
│  Budget recrutement T2 : 145M FCFA                                     │
│  Dépenses T2 : 132M FCFA (91%)                                         │
│  CPH moyen : 285K FCFA ✅                                              │
│                                                                       │
│  Décomposition coûts :                                                │
│   • Diffusion jobboards : 35M (27%)                                    │
│   • Cabinets externes : 25M (19%)                                      │
│   • Coopt. primes : 12M (9%)                                           │
│   • Évén. carrière : 8M (6%)                                           │
│   • Temps interne RH : 38M (29%)                                       │
│   • Onboarding : 14M (10%)                                             │
├──────────────────────────────────────────────────────────────────────┤
│ DIVERSITÉ                                                              │
│  H/F cadres : 48% / 52% ✅ (proche parité)                             │
│  H/F maîtrise : 55% / 45% ✅                                           │
│  Diversité tranches âges : équilibrée ✅                              │
│                                                                       │
│  Mobilité interne : 32% des embauches (vs cible 25%) ✅                │
├──────────────────────────────────────────────────────────────────────┤
│ EXPÉRIENCE CANDIDAT                                                    │
│  CXS T2 : 4.3/5 ✅                                                    │
│  NPS T2 : +35 ✅                                                      │
│  Taux silence > 7j : 4% (down from 12% Q1) ✅                          │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 5. DASHBOARD EXÉCUTIF (DG/COMEX)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Dashboard Exécutif - Cheick DIALLO                                    │
│ Période : Semestre 1 2026                                             │
├──────────────────────────────────────────────────────────────────────┤
│ INDICATEURS STRATÉGIQUES                                              │
│                                                                       │
│  🎯 Plan recrutement vs réalisé                                       │
│     Budget S1 : 165 embauches → Réalisé : 156 (-5%)                    │
│     Couleur : 🟡 Léger retard                                          │
│                                                                       │
│  💰 Maîtrise budgétaire                                                │
│     Budget S1 : 305M FCFA → Consommé : 287M (94%)                      │
│     Couleur : 🟢 Maîtrisé                                              │
│                                                                       │
│  ⭐ Qualité embauches                                                  │
│     QoH cohorte 2025 : 78/100 ✅                                      │
│     Rétention 12m : 91% ✅                                            │
│     Couleur : 🟢                                                      │
│                                                                       │
│  📈 Couverture postes critiques                                       │
│     Postes ouverts > 60j : 2/18 (11%)                                  │
│     Couleur : 🟡 À surveiller                                          │
│                                                                       │
│  💼 Marque employeur                                                  │
│     Vues site carrière : 78K (+18% vs S2 2025)                         │
│     Conversion : 2.1%                                                 │
│     CXS : 4.3/5                                                       │
│     Note Glassdoor : 4.2/5                                            │
├──────────────────────────────────────────────────────────────────────┤
│ POINTS DE VIGILANCE                                                   │
│  • Difficulté recrutement profils IT senior (1 poste > 90j)            │
│  • Coût cabinet excessif sur 2 postes spécifiques                      │
│  • Réflexion à mener sur attractivité profils techniques               │
├──────────────────────────────────────────────────────────────────────┤
│ ROI RECRUTEMENT                                                       │
│  Investissement S1 : 287M FCFA                                         │
│  Création valeur (estim. masse salariale × productivité) : 2,1 Mds    │
│  ROI estimé : x7.3                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 6. SOURCE EFFECTIVENESS — APPROFONDISSEMENT

Cf. doc 04 pour le détail. Tableau récap avec **données qualité** ajoutées :

```
┌──────────────────────────────────────────────────────────────────────┐
│ ROI sources - Année 2026 YTD                                          │
├──────────────────────────────────────────────────────────────────────┤
│ Source        │ Hires │ CPH    │ QoH avg │ Rétention 12m │ Score      │
│ ──────────────│ ───── │ ────── │ ─────── │ ───────────── │ ────────── │
│ Cooptation    │   18  │ 245K   │ 84      │ 95%           │ ⭐⭐⭐⭐⭐  │
│ Site carrière │   38  │ 145K   │ 78      │ 92%           │ ⭐⭐⭐⭐⭐  │
│ LinkedIn      │   32  │ 385K   │ 76      │ 89%           │ ⭐⭐⭐⭐    │
│ Indeed        │   12  │ 165K   │ 72      │ 87%           │ ⭐⭐⭐⭐    │
│ Novojob       │   18  │ 65K    │ 70      │ 85%           │ ⭐⭐⭐⭐    │
│ Glassdoor     │    5  │ 320K   │ 74      │ 90%           │ ⭐⭐⭐      │
│ Cabinet ABC   │    8  │ 2,8M   │ 80      │ 88%           │ ⭐⭐        │
│ Approche dir. │   10  │ 580K   │ 82      │ 93%           │ ⭐⭐⭐⭐    │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 7. PRÉDICTIONS PROPH3T

## 7.1 Prédictions disponibles

PROPH3T offre des projections basées sur les données historiques :

| Prédiction | Méthode |
|-----------|---------|
| **Time-to-fill prédictif** par offre | Comparaison historique offres similaires |
| **Taux de désistement** candidat selon profil | Modèle ML |
| **Probabilité passage essai** par candidat | Score basé évaluations + cohortes |
| **Couverture budgétaire** projetée | Régression sur historique |
| **Risques pénurie** par profil | Analyse tension marché |

## 7.2 Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Prédictions IA - OFR-2026-0245 Chef de Projet Commercial             │
├──────────────────────────────────────────────────────────────────────┤
│ Time-to-fill prédit : 42 jours (intervalle : 35-50j)                  │
│  Basé sur : 12 offres similaires (cadre B commercial, Abidjan)         │
│  Confiance : 84%                                                      │
│                                                                       │
│ Probabilité couverture J+45 : 78% ✅                                  │
│ Probabilité couverture J+60 : 95% ✅                                  │
│                                                                       │
│ RECOMMANDATION                                                        │
│  Diffusion actuelle (LinkedIn + cooptation) adaptée                    │
│  Suggestion : ajouter Novojob pour booster volume                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 8. EXPORTS & REPORTING AUTOMATIQUE

## 8.1 Reports programmés

| Report | Fréquence | Destinataires |
|--------|-----------|---------------|
| Daily standup recruteurs | Quotidien | Équipe recrutement |
| Weekly status RRH | Hebdo | Responsable recrutement |
| Monthly DRH dashboard | Mensuel | DRH |
| Quarterly executive | Trimestriel | DG/COMEX |
| Annual bilan recrutement | Annuel | DG + Conseil |
| Diversity report | Trimestriel | DPO + DRH |
| Compliance audit | Trimestriel | Juriste |

## 8.2 Formats d'export

- PDF (présentation propre).
- Excel (analyses).
- CSV (données brutes).
- API JSON (intégration BI externe).

## 8.3 Intégration Power BI / Tableau

Connecteur **lecture seule** vers tables agrégées pour BI externe.

---

# 9. APIS REPORTING

```
GET  /hr/recrutement/reporting/dashboard/recruteur?period=
GET  /hr/recrutement/reporting/dashboard/drh?period=
GET  /hr/recrutement/reporting/dashboard/exec?period=

GET  /hr/recrutement/reporting/kpi/time-to-fill?filters=
GET  /hr/recrutement/reporting/kpi/cost-per-hire?filters=
GET  /hr/recrutement/reporting/kpi/quality-of-hire?cohort=
GET  /hr/recrutement/reporting/kpi/funnel?offer_id=
GET  /hr/recrutement/reporting/kpi/diversity?period=
GET  /hr/recrutement/reporting/kpi/sources-roi?period=

POST /hr/recrutement/reporting/predictions/time-to-fill
     body: { offer_id }
POST /hr/recrutement/reporting/predictions/coverage
GET  /hr/recrutement/reporting/predictions/market-tension

GET  /hr/recrutement/reporting/exports/scheduled
POST /hr/recrutement/reporting/exports/run-now
POST /hr/recrutement/reporting/exports/configure
```

---

# 10. TABLES IMPLIQUÉES

### Nouvelles
- `recruitment_kpi_snapshots` (snapshots mensuels KPI)
- `recruitment_funnel_snapshots`
- `recruitment_cost_breakdown` (décomposition coûts)
- `quality_of_hire_calculations` (calculs QoH)
- `recruitment_predictions_log` (prédictions PROPH3T)
- `recruitment_reports_scheduled`
- `recruitment_reports_runs`

### Materialized views (rafraîchies nightly)
- `mv_recruitment_funnel_monthly`
- `mv_recruitment_kpi_dashboard`
- `mv_quality_of_hire_cohorts`
- `mv_sources_roi_yearly`

---

# 11. SYNTHÈSE

**Reporting recrutement** :
- **KPI fondamentaux** standardisés : TTF, TTH, CPH, QoH, CXS, NPS, Diversity.
- **Funnel** complet par étape avec drop-off analysis.
- **3 dashboards** profilés : Responsable Recrutement, DRH, Exec.
- **Source effectiveness** intégrant qualité et rétention.
- **Prédictions PROPH3T** (time-to-fill, couverture, risques pénurie).
- **Reports programmés** + exports multi-formats.
- **Integration BI externe** (Power BI / Tableau).

**Règles dures** :
- KPI calculés sur données brutes auditées.
- Aucune métrique discriminante exposée (anonymat respecté).
- Snapshots mensuels conservés 5 ans.
- Materialized views rafraîchies quotidiennement.
- Audit chaîné.

---

*Fin spécification 15 — Reporting recrutement.*
