# M5 RECRUTEMENT — ÉVALUATION & SCORING
## Grilles d'évaluation, scoring multi-critères, matching IA
*God mode premium. Référence : 01_FONDATION.md, 03_OFFRES_EMPLOI.md, 05_CANDIDATURES.md.*

---

# 0. POSITIONNEMENT

L'**évaluation des candidats** est l'**activité critique** du recrutement. Elle doit être :
- **Objective** : grilles structurées limitant les biais.
- **Équitable** : mêmes critères pour tous les candidats d'une offre.
- **Conforme** : pas de critères discriminatoires.
- **Traçable** : décisions documentées pour audit.
- **Multi-évaluateurs** : convergence des avis (4-eyes minimum sur les finales).

Cette section couvre :
- **Grilles d'évaluation** paramétrables par offre.
- **Matching IA** (score d'adéquation candidat ↔ offre).
- **Scoring multi-critères** pondéré.
- **Détection de biais** automatique.
- **Convergence multi-évaluateurs**.

## 0.1 Routes

- `/hr/recrutement/applications/{appId}/evaluations` → Évaluations d'une candidature
- `/hr/recrutement/applications/{appId}/evaluations/nouvelle` → Nouvelle évaluation
- `/hr/recrutement/grilles-evaluation` → Bibliothèque grilles
- `/hr/recrutement/scoring/parametres` → Paramètres scoring tenant

---

# 1. GRILLES D'ÉVALUATION

## 1.1 Structure

Une grille d'évaluation comprend :
- **Critères** organisés en catégories.
- Chaque critère a un **poids** (% du score total).
- Chaque critère est noté selon une **échelle** (ex. 1-5, ou A/B/C/D).
- **Commentaires libres** par critère.
- **Décision finale** (recommandation : Hire / No-hire / Shortlist).

## 1.2 Catégories standards

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ADÉQUATION TECHNIQUE (poids paramétrable, ex. 35%)            │
│  • Maîtrise des compétences techniques requises                  │
│  • Connaissance secteur/métier                                   │
│  • Maîtrise outils/technologies                                  │
│  • Expérience comparable                                         │
├─────────────────────────────────────────────────────────────────┤
│ 2. COMPÉTENCES COMPORTEMENTALES (poids 25%)                      │
│  • Leadership                                                    │
│  • Communication                                                 │
│  • Esprit d'équipe                                               │
│  • Capacité d'adaptation                                         │
│  • Orientation résultats                                         │
├─────────────────────────────────────────────────────────────────┤
│ 3. FIT CULTUREL (poids 15%)                                       │
│  • Alignement valeurs entreprise                                  │
│  • Motivation pour le poste                                       │
│  • Projet professionnel cohérent                                  │
├─────────────────────────────────────────────────────────────────┤
│ 4. POTENTIEL D'ÉVOLUTION (poids 10%)                              │
│  • Capacité d'apprentissage                                       │
│  • Ambition réaliste                                              │
│  • Polyvalence                                                    │
├─────────────────────────────────────────────────────────────────┤
│ 5. CONDITIONS PRATIQUES (poids 15%)                               │
│  • Disponibilité (préavis, date de prise de poste)                │
│  • Compatibilité salariale                                        │
│  • Mobilité géographique compatible                               │
│  • Stabilité professionnelle                                      │
└─────────────────────────────────────────────────────────────────┘
```

## 1.3 Échelle de notation

Standard 5 niveaux :
- **5 - Exceptionnel** : dépasse largement les attentes.
- **4 - Très bon** : dépasse les attentes.
- **3 - Satisfait** : conforme aux attentes (référence).
- **2 - À développer** : sous les attentes mais récupérable.
- **1 - Insuffisant** : ne correspond pas.

## 1.4 Modèle de données

```sql
CREATE TABLE evaluation_grids (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  
  category TEXT,  -- 'standard', 'commercial', 'tech', 'manager', etc.
  
  -- Critères structurés
  categories JSONB,  -- [{ name, weight, criteria: [{name, description, weight_in_category}] }]
  
  -- Échelle
  scale_type TEXT,  -- 'numeric_1_5', 'letter_a_d', 'custom'
  scale_definition JSONB,
  
  -- Métadonnées
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  active BOOLEAN DEFAULT true,
  
  -- Validation juriste (anti-discrimination)
  legal_validated_by UUID,
  legal_validated_at TIMESTAMPTZ
);

CREATE TABLE application_evaluations (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  application_id UUID NOT NULL REFERENCES applications(id),
  evaluator_id UUID NOT NULL,
  evaluator_role TEXT,         -- 'recruiter', 'manager', 'hr', 'panel'
  
  -- Type d'évaluation
  evaluation_type TEXT,        -- 'cv_review', 'phone_screen', 'interview', 'test', 'final_panel'
  evaluation_stage_id UUID,
  
  -- Grille utilisée
  grid_id UUID REFERENCES evaluation_grids(id),
  
  -- Scores
  scores_by_criterion JSONB,   -- { criterion_code: score }
  weighted_score DECIMAL(5,2),  -- score pondéré final
  
  -- Recommandation
  recommendation TEXT,         -- 'hire', 'no_hire', 'shortlist', 'doubt'
  
  -- Commentaires
  strengths TEXT,
  concerns TEXT,
  additional_comments TEXT,
  
  -- Détection biais
  bias_warnings JSONB,
  
  -- Date
  evaluated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Audit
  audit_hash TEXT
);
```

## 1.5 Layout grille de remplissage

```
┌──────────────────────────────────────────────────────────────────────┐
│ Évaluation - Awa DIABATÉ pour OFR-2026-0245                            │
│ Évaluateur : Hadja TIMITÉ (Manager DC)                                 │
│ Type : Entretien manager                                              │
│ Grille : Grille standard cadre commercial                             │
├──────────────────────────────────────────────────────────────────────┤
│ 1. ADÉQUATION TECHNIQUE (35% du total)                                │
│                                                                       │
│  1.1 Maîtrise techniques de vente B2B (poids 10/35)                   │
│      ○ 1  ○ 2  ○ 3  ● 4  ○ 5                                          │
│      Commentaire : [Bonne maîtrise démontrée par exemples concrets]   │
│                                                                       │
│  1.2 Compétences managériales (poids 10/35)                           │
│      ○ 1  ○ 2  ○ 3  ● 4  ○ 5                                          │
│      Commentaire : [Expérience management 5 personnes, méthodologie OK]│
│                                                                       │
│  1.3 Maîtrise outils CRM (poids 8/35)                                 │
│      ○ 1  ○ 2  ○ 3  ○ 4  ● 5                                          │
│      Commentaire : [Excellente, certifiée Salesforce]                  │
│                                                                       │
│  1.4 Analyse financière (poids 7/35)                                  │
│      ○ 1  ○ 2  ● 3  ○ 4  ○ 5                                          │
│      Commentaire : [Niveau correct, à conforter]                       │
│                                                                       │
│  Score catégorie : 4,1/5 (147/175)                                     │
├──────────────────────────────────────────────────────────────────────┤
│ 2. COMPÉTENCES COMPORTEMENTALES (25%)                                  │
│                                                                       │
│  2.1 Leadership (8/25)                                                │
│      ● 4                                                              │
│      "Démontre autorité naturelle, sait s'imposer dans débats"        │
│                                                                       │
│  2.2 Communication (7/25)                                              │
│      ● 5                                                              │
│      "Excellente clarté, structure, écoute active"                     │
│                                                                       │
│  2.3 Esprit d'équipe (5/25)                                            │
│      ● 4                                                              │
│                                                                       │
│  2.4 Adaptabilité (5/25)                                              │
│      ● 4                                                              │
│                                                                       │
│  Score catégorie : 4,2/5                                              │
├──────────────────────────────────────────────────────────────────────┤
│ 3. FIT CULTUREL (15%)                                                  │
│  3.1 Alignement valeurs (5/15)                                         │
│      ● 5                                                              │
│  3.2 Motivation (5/15)                                                │
│      ● 5                                                              │
│  3.3 Projet pro (5/15)                                                │
│      ● 4                                                              │
│  Score : 4,7/5                                                        │
├──────────────────────────────────────────────────────────────────────┤
│ 4. POTENTIEL ÉVOLUTION (10%)                                          │
│  ● 4 / 5 - Bon potentiel évolution Direction Commerciale 3-5 ans      │
├──────────────────────────────────────────────────────────────────────┤
│ 5. CONDITIONS PRATIQUES (15%)                                          │
│  5.1 Disponibilité : Préavis 3 mois → dispo 01/10                    │
│      ● 4 / 5                                                          │
│  5.2 Compatibilité salariale : Demande 1,050M ↔ Fourchette OK         │
│      ● 5 / 5                                                          │
│  5.3 Mobilité : OK Cosmos Yopougon                                    │
│      ● 5 / 5                                                          │
│  5.4 Stabilité : 2 postes en 8 ans OK                                  │
│      ● 4 / 5                                                          │
│  Score : 4,5/5                                                        │
├──────────────────────────────────────────────────────────────────────┤
│ SCORE GLOBAL PONDÉRÉ : 4,3/5 (86/100)                                  │
│                                                                       │
│ POINTS FORTS                                                          │
│ [Excellente expérience cadrée, fort potentiel, motivation claire,     │
│  compatible salaire + dispo, certification CRM, leadership confirmé]   │
│                                                                       │
│ POINTS DE VIGILANCE                                                   │
│ [Analyse financière à conforter sur poste, préavis 3 mois ralentit]   │
│                                                                       │
│ RECOMMANDATION FINALE                                                 │
│ ● HIRE - Candidate solide, recommande passage en finale                │
│ ○ SHORTLIST - À garder en option                                      │
│ ○ NO HIRE - Ne correspond pas                                          │
│ ○ DOUBT - Besoin d'informations supplémentaires                       │
│                                                                       │
│ ⚠ ALERTES BIAIS (PROPH3T)                                             │
│ ✅ Aucun biais détecté dans cette évaluation                          │
│                                                                       │
│ [Sauvegarder] [Soumettre]                                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 2. MATCHING IA (PROPH3T)

## 2.1 Score de matching

À la réception de chaque candidature, PROPH3T calcule un **score d'adéquation** entre le CV et l'offre :

```
Score matching = somme pondérée de :
  - Match compétences techniques requises (40%)
  - Match expérience (années + secteur) (25%)
  - Match formation (15%)
  - Match localisation/mobilité (10%)
  - Match disponibilité (10%)
```

Score sur 100, affiché comme indication aux recruteurs (jamais comme décision automatique).

## 2.2 Détail explicatif

```
┌──────────────────────────────────────────────────────────────────────┐
│ Score matching IA - Awa DIABATÉ pour OFR-2026-0245                    │
│ Score global : 92% ★★★★★                                              │
├──────────────────────────────────────────────────────────────────────┤
│ DÉTAIL                                                                │
│                                                                       │
│ ✅ Compétences techniques : 95%                                       │
│   Demandés : Vente B2B, CRM, Analyse financière, Management           │
│   Détectés CV : Vente B2B ✅, Salesforce/HubSpot ✅, Power BI ✅,     │
│                 Management 5 pers. ✅, Analyse finance OK               │
│                                                                       │
│ ✅ Expérience : 90%                                                   │
│   Demandé : 5+ ans cadre commercial                                   │
│   CV : 6 ans (4 ans + 2 ans + 6 mois stage) ✅                         │
│                                                                       │
│ ✅ Formation : 100%                                                   │
│   Demandé : Bac+5 (Commerce, Management)                              │
│   CV : Master 2 Marketing & Vente HEC Paris ✅                         │
│                                                                       │
│ ✅ Localisation : 100%                                                │
│   Lieu offre : Abidjan                                                │
│   Candidat : Abidjan ✅                                               │
│                                                                       │
│ ⚠ Disponibilité : 75%                                                 │
│   Date souhaitée : 01/08/2026                                          │
│   Candidate : préavis 3 mois → dispo 01/10 (ok 01/12 si tardive)      │
│                                                                       │
│ POINTS D'ATTENTION DÉTECTÉS                                           │
│  • Toutes expériences en startup → adaptation environnement corp. ?    │
│                                                                       │
│ POINTS POSITIFS DÉTECTÉS                                              │
│  • Certifications Salesforce et Google Analytics : valeur ajoutée     │
│  • Langues : trilingue (FR/EN/Dioula)                                  │
│  • Réseau (LinkedIn 2K+ connexions secteur)                            │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.3 Limitations

- Score = indication, jamais décision.
- Recruteur peut désaccord avec le score.
- Toutes décisions humaines tracées.
- Pas d'élimination automatique sur score bas.

## 2.4 API matching

```
POST /hr/recrutement/applications/{appId}/compute-matching-score
GET  /hr/recrutement/applications/{appId}/matching-details
```

---

# 3. DÉTECTION DE BIAIS

## 3.1 Patterns détectés

PROPH3T analyse les évaluations et détecte des **patterns potentiellement discriminatoires** :

| Pattern | Exemple |
|---------|---------|
| **Genre** | Tendance à mieux noter les hommes vs femmes pour mêmes profils |
| **Âge** | Tendance à éliminer les > 45 ans |
| **Origine/nationalité** | Sélection biaisée |
| **Université** | Sur-pondération de certaines écoles |
| **Photo CV** | Évaluations différentes selon présence/absence photo |

## 3.2 Workflow détection

```
[Évaluation soumise]
   ↓
Analyse PROPH3T des commentaires + scores
   ↓
Comparaison avec moyennes pour cette offre
   ↓
Si pattern suspect détecté :
  • Alerte au recruteur (revoir évaluation ?)
  • Alerte Compliance Officer
  • Trace dans audit
```

## 3.3 Alertes affichées

```
⚠ Alerte biais potentiel détectée
Votre évaluation présente :
  • Note moyenne 2,1 / Note moyenne offre 3,4 (vs même profil)
  • Commentaire "Pas assez mature" - peut sembler discriminant en âge
  
Recommandation : Revérifier les critères objectifs avant soumission.
```

L'évaluation reste possible mais traçabilité renforcée.

## 3.4 Reporting biais

Dashboard agrégé pour Compliance Officer :
- Taux d'évaluations alertées par recruteur.
- Patterns récurrents.
- Disparités score moyen H/F.
- Disparités score selon source candidat.

---

# 4. CONVERGENCE MULTI-ÉVALUATEURS

## 4.1 Vue d'ensemble pour un candidat

```
┌──────────────────────────────────────────────────────────────────────┐
│ Évaluations consolidées - Awa DIABATÉ                                  │
├──────────────────────────────────────────────────────────────────────┤
│ ÉVALUATEUR        │ TYPE             │ SCORE │ RECOMMAND.              │
│ ────────────────  │ ──────────────── │ ───── │ ──────────────────────  │
│ Marie SAMAKÉ      │ CV Review        │ 88    │ ✅ Shortlist            │
│ Aboubakar KONÉ    │ Phone screen     │ 85    │ ✅ Passer entretien     │
│ Hadja TIMITÉ      │ Entretien manag. │ 92    │ ✅ HIRE                 │
│ Cheick DIALLO     │ Entretien DG     │ 89    │ ✅ HIRE                 │
│                                                                       │
│ SCORE MOYEN : 88,5 / 100 ★★★★★                                        │
│ CONSENSUS : 100% favorables                                           │
├──────────────────────────────────────────────────────────────────────┤
│ ANALYSE CONVERGENCE                                                   │
│ ✅ Tous évaluateurs alignés (variation max 7 points)                   │
│ ✅ Pas de désaccord majeur                                            │
│ ✅ Tous recommandent hiring                                            │
└──────────────────────────────────────────────────────────────────────┘
```

## 4.2 Cas de désaccord

Si évaluateurs en désaccord significatif :
- Alerte au recruteur.
- Médiation par Responsable recrutement.
- Réunion de convergence.
- Décision finale par comité hiring.

---

# 5. BIBLIOTHÈQUE GRILLES PAR FAMILLE

Atlas People livre des grilles types par famille de métier :

```
Bibliothèque grilles
├── GRILLE-STANDARD-CADRE-COMMERCIAL
├── GRILLE-STANDARD-CADRE-FINANCE
├── GRILLE-STANDARD-CADRE-RH
├── GRILLE-STANDARD-CADRE-IT
├── GRILLE-STANDARD-CADRE-OPS
├── GRILLE-STANDARD-EMPLOYE-ADMIN
├── GRILLE-STANDARD-OUVRIER
├── GRILLE-STANDARD-DIRECTION
├── GRILLE-STANDARD-EXPATRIE
└── GRILLE-STANDARD-ALTERNANCE
```

Tenant personnalise selon ses spécificités.

---

# 6. APIS ÉVALUATION

```
GET  /hr/recrutement/grilles-evaluation
GET  /hr/recrutement/grilles-evaluation/{gridId}
POST /hr/recrutement/grilles-evaluation
PATCH /hr/recrutement/grilles-evaluation/{gridId}
POST /hr/recrutement/grilles-evaluation/{gridId}/validate-legal

GET  /hr/recrutement/applications/{appId}/evaluations
POST /hr/recrutement/applications/{appId}/evaluations
GET  /hr/recrutement/applications/{appId}/evaluations/{evalId}
PATCH /hr/recrutement/applications/{appId}/evaluations/{evalId}
POST /hr/recrutement/applications/{appId}/evaluations/{evalId}/submit
GET  /hr/recrutement/applications/{appId}/evaluations/convergence

POST /hr/recrutement/applications/{appId}/compute-matching-score (PROPH3T)
GET  /hr/recrutement/applications/{appId}/matching-details

POST /hr/recrutement/evaluations/{evalId}/detect-bias (PROPH3T)
GET  /hr/recrutement/audit/bias-statistics?period=
```

---

# 7. SYNTHÈSE

**Évaluation & Scoring** :
- **Grilles structurées** par famille de métier, validées juridiquement.
- **5 catégories** : technique, comportemental, fit culturel, potentiel, conditions.
- **Échelle 1-5** standardisée.
- **Scoring pondéré** automatique.
- **Matching IA PROPH3T** avec détail explicatif.
- **Détection de biais** automatique avec alertes.
- **Convergence multi-évaluateurs** visualisée.
- **Reporting biais** pour Compliance Officer.

**Règles dures** :
- Pas d'élimination automatique sur score IA.
- Grilles validées juriste (anti-discrimination).
- Détection biais sur toutes évaluations.
- Convergence multi-évaluateurs documentée.
- Audit chaîné.

---

*Fin spécification 06 — Évaluation & scoring.*
