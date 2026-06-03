# M5 RECRUTEMENT — TESTS & ASSESSMENTS
## Tests techniques, psychométriques, mises en situation, assessment centers
*God mode premium. Référence : 01_FONDATION.md, 06_EVALUATION_SCORING.md.*

---

# 0. POSITIONNEMENT

Les **tests** permettent une **évaluation objective** des capacités du candidat au-delà du CV et de l'entretien. Ils sont particulièrement utiles pour :
- **Valider** les compétences techniques déclarées.
- **Mesurer** les soft skills et traits de personnalité.
- **Observer** le candidat en situation réelle.
- **Réduire** les biais subjectifs.

Cette section couvre :
- **Tests techniques** (intégrés ou via partenaires).
- **Tests psychométriques** (personnalité, valeurs, motivations).
- **Mises en situation** (cas pratiques, simulations).
- **Assessment centers** (1-2 jours combinant plusieurs épreuves).
- **Vérification de références**.

## 0.1 Routes

- `/hr/recrutement/tests` → Catalogue tests
- `/hr/recrutement/tests/{testId}/passations` → Suivi passations
- `/hr/recrutement/applications/{appId}/tests` → Tests d'une candidature
- `/hr/recrutement/assessments-centers` → Programmation AC

---

# 1. CATALOGUE DE TESTS

## 1.1 Tests techniques

### Intégrations partenaires
- **HackerRank** : tests coding (option payante).
- **Codility** : tests algorithmique.
- **TestGorilla** : suite tests généralistes.

### Tests internes Atlas People
Bibliothèque maison gratuite incluse :

```
Bibliothèque tests Atlas
├── TECHNIQUES MÉTIER
│   ├── TST-COMMERCIAL-NEGOCIATION (cas pratique B2B)
│   ├── TST-FINANCE-ANALYSE (analyse bilan + recommandations)
│   ├── TST-COMPTABLE-SAISIE (cas écritures OHADA)
│   ├── TST-RH-PAIE (cas calcul bulletin)
│   ├── TST-MARKETING-PLAN (création plan trimestriel)
│   └── TST-PROJET-PILOTAGE (gestion projet fictif)
├── BUREAUTIQUE
│   ├── TST-EXCEL-AVANCE (formules, TCD)
│   ├── TST-WORD-MISE-EN-PAGE
│   └── TST-POWERPOINT-PRESENTATION
├── LANGUES
│   ├── TST-FRANCAIS-COMPRÉHENSION
│   ├── TST-FRANCAIS-RÉDACTION
│   └── TST-ANGLAIS-NIVEAU
└── LOGIQUE
    ├── TST-LOGIQUE-NUMERIQUE
    └── TST-LOGIQUE-VERBALE
```

## 1.2 Tests psychométriques

### Intégrations
- **AssessFirst** (option, recommandé pour cadres).
- **PerformanSe** (suite RH classique).
- **DISC** (test commercial).

### Tests internes
- TST-PSY-PERSONNALITE-BIG5 (Big Five personnalité).
- TST-PSY-VALEURS-PRO (valeurs professionnelles).
- TST-PSY-MOTIVATIONS.
- TST-PSY-STYLES-MANAGEMENT.

## 1.3 Mises en situation

Cas pratiques personnalisés par poste :
- **Commercial** : présentation produit fictif, négo simulée.
- **Manager** : recadrage collaborateur (jeu de rôle).
- **DAF** : présentation budget devant comité.
- **DRH** : gestion conflit social.

## 1.4 Modèle de données

```sql
CREATE TABLE test_catalog (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT,              -- 'technical', 'psychometric', 'situation', 'language', 'logic'
  
  -- Modalités
  duration_minutes INT,
  passing_score INT,
  scoring_method TEXT,        -- 'percentage', 'level', 'profile', 'mixed'
  
  -- Source
  source TEXT,                -- 'atlas_internal', 'hackerrank', 'codility', 'testgorilla', etc.
  external_test_id TEXT,
  
  -- Contenu
  questions JSONB,            -- pour tests internes
  test_template_url TEXT,     -- pour tests externes
  
  -- Validation
  legal_validated BOOLEAN,
  validated_by UUID,
  
  active BOOLEAN
);

CREATE TABLE test_passations (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id),
  test_id UUID NOT NULL REFERENCES test_catalog(id),
  
  -- Invitation
  invited_at TIMESTAMPTZ,
  invitation_link TEXT,
  deadline_at TIMESTAMPTZ,
  
  -- Passation
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INT,
  
  -- Résultats
  raw_score INT,
  scaled_score INT,           -- normalisé 0-100
  profile_result JSONB,       -- pour psychométriques
  detailed_results JSONB,
  pass_fail TEXT,             -- 'pass', 'fail', 'borderline'
  
  -- Métadonnées
  ip_address INET,
  user_agent TEXT,
  suspicious_activity JSONB,  -- détection triche basique
  
  -- Statut
  status TEXT,                -- 'invited', 'started', 'completed', 'expired', 'cancelled'
  
  -- Audit
  audit_hash TEXT
);
```

---

# 2. WORKFLOW PASSATION TEST

## 2.1 Étape 1 — Invitation

```
[Recruteur décide test pour candidat]
   ↓
Sélection test dans catalogue
   ↓
Configuration : deadline, présentiel/distance
   ↓
Envoi invitation email candidat
   ↓
Email avec :
  • Description test
  • Durée prévue
  • Conditions de passation
  • Lien d'accès sécurisé (token unique)
  • Date limite
```

## 2.2 Étape 2 — Passation

### Distance
- Candidat accède via lien sécurisé.
- Identification (vérif email).
- Conditions environnement (recommandations).
- Lancement test.
- Sauvegarde régulière.
- Fin test → résultats automatiques.

### Présentiel
- Convocation candidat sur site.
- Salle dédiée + supervision RH.
- Test sur ordinateur fourni.
- Conditions standardisées.

## 2.3 Étape 3 — Résultats

```
┌──────────────────────────────────────────────────────────────────────┐
│ Résultats test - Awa DIABATÉ                                          │
│ Test : TST-COMMERCIAL-NEGOCIATION                                     │
│ Passé le : 18/06/2026 14h32-16h45 (2h13 / 2h max)                     │
├──────────────────────────────────────────────────────────────────────┤
│ SCORE GLOBAL : 82/100 ★★★★ (Bon)                                       │
│ Seuil de passage : 60/100 ✅                                          │
│ Comparaison benchmark candidats poste similaire : Top 25%              │
├──────────────────────────────────────────────────────────────────────┤
│ DÉTAIL PAR SECTION                                                    │
│                                                                       │
│ Section 1 : Méthodologie commerciale (30%)                            │
│  Score : 85/100                                                       │
│  Bonne maîtrise des étapes, méthodes structurées                       │
│                                                                       │
│ Section 2 : Analyse situation client (25%)                            │
│  Score : 78/100                                                       │
│  Identification besoins correcte, leviers à approfondir                │
│                                                                       │
│ Section 3 : Négociation tarifaire (20%)                                │
│  Score : 88/100                                                       │
│  Très bon, gestion remises maîtrisée                                   │
│                                                                       │
│ Section 4 : Closing & contractualisation (15%)                        │
│  Score : 80/100                                                       │
│                                                                       │
│ Section 5 : Suivi post-vente (10%)                                    │
│  Score : 75/100                                                       │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ ANALYSE COMMENTÉE                                                     │
│  Points forts : Méthodologie, négo tarifaire                          │
│  Points à confirmer en entretien : profondeur analyse besoins         │
│  Recommandation : ✅ Passe le filtre, continuer en entretien          │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.4 Cas tests psychométriques

Résultats sous forme de **profil** plutôt que score :

```
┌──────────────────────────────────────────────────────────────────────┐
│ Profil psychométrique - Awa DIABATÉ                                   │
│ Test : Big Five personnalité                                          │
├──────────────────────────────────────────────────────────────────────┤
│ DIMENSIONS                                                            │
│                                                                       │
│ Ouverture à l'expérience    : ████████░░ 78/100 (élevée)              │
│ Conscience professionnelle  : █████████░ 88/100 (très élevée)         │
│ Extraversion                 : ███████░░░ 70/100 (élevée)              │
│ Agréabilité                  : ████████░░ 75/100 (élevée)              │
│ Stabilité émotionnelle      : ████████░░ 80/100 (élevée)              │
│                                                                       │
│ INTERPRÉTATION                                                        │
│  Profil cohérent avec un poste de management commercial confirmé :    │
│  • Forte conscience professionnelle (rigueur, fiabilité)              │
│  • Bonne stabilité émotionnelle (gestion stress, conflits)            │
│  • Extraversion équilibrée (relations clients/équipe)                 │
│  • Agréabilité élevée (collaboratif sans excès)                       │
│  • Ouverture (s'adapte aux changements, innovation)                    │
│                                                                       │
│ ⚠ INTERPRÉTATION INDICATIVE                                            │
│  Ce profil est une aide à la décision, pas un critère unique.         │
│  À croiser obligatoirement avec entretien et autres évaluations.      │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 3. ASSESSMENT CENTER

## 3.1 Concept

L'**assessment center** est une **journée (ou demi-journée) complète** d'évaluation combinant plusieurs épreuves pour mieux cerner un candidat. Idéal pour postes cadres ou stratégiques.

## 3.2 Composition typique

```
JOURNÉE TYPE ASSESSMENT CENTER (8h-17h)

08h30 - Accueil + petit déjeuner
09h00 - Présentation programme + entreprise (30 min)
09h30 - Test de personnalité Big Five (45 min)
10h30 - Pause
10h45 - Mise en situation 1 : présentation business case (45 min prep + 30 min pres)
12h00 - Déjeuner avec équipe (observation informelle)
14h00 - Jeu de rôle : négociation client difficile (45 min)
15h00 - Pause
15h15 - Test technique métier (1h)
16h15 - Entretien debrief + feedback candidat (45 min)
17h00 - Fin journée

OBSERVATEURS PRÉSENTS
• 2 managers opérationnels
• 1 RRH
• 1 DRH (sur épreuves clés)
• 1 facilitateur externe (option)
```

## 3.3 Gestion AC

```
┌──────────────────────────────────────────────────────────────────────┐
│ Assessment Center - Promo Cadre Commercial 2026                       │
│ Date : 24/06/2026                                                     │
│ Lieu : Siège CRMC, Salle Plénière                                     │
├──────────────────────────────────────────────────────────────────────┤
│ CANDIDATS PROGRAMMÉS (5)                                              │
│  ✓ Awa DIABATÉ (OFR-2026-0245)                                         │
│  ✓ Ibrahim KOUASSI (OFR-2026-0245)                                     │
│  ✓ Mariam BAMBA (OFR-2026-0245)                                        │
│  ✓ Yao DIALLO (OFR-2026-0245)                                          │
│  ✓ Fatou BAH (OFR-2026-0245)                                           │
│                                                                       │
│ ÉPREUVES PROGRAMMÉES                                                  │
│  • Test personnalité Big Five (9h30)                                  │
│  • Présentation business case "Lancement nouvelle gamme" (10h45)      │
│  • Jeu de rôle négociation enseigne (14h)                              │
│  • Test technique TST-COMMERCIAL-NEGOCIATION (15h15)                  │
│                                                                       │
│ OBSERVATEURS                                                          │
│  • Hadja TIMITÉ (Manager DC)                                          │
│  • Cheick DIALLO (DG)                                                  │
│  • Aboubakar KONÉ (RRH)                                                │
│  • Mawuena ADJEI (Consultante RH externe)                             │
│                                                                       │
│ DOCUMENTS                                                             │
│  • Brief business case (envoyé candidats J-3)                          │
│  • Grilles d'évaluation préparées                                      │
│  • Logistique (salles, restauration)                                   │
│                                                                       │
│ POST-AC                                                               │
│  • Réunion debrief observateurs (lendemain J+1)                       │
│  • Convergence évaluations                                            │
│  • Décision shortlist                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 4. VÉRIFICATION DE RÉFÉRENCES

## 4.1 Quand

Avant offre finale (ou après acceptation conditionnelle), vérification :
- Identité (diplômes, anciennes fonctions).
- Expérience (réalité des postes, dates).
- Compétences (auprès d'anciens employeurs).
- Comportement (recommandations).

## 4.2 Workflow

```
[Candidat fournit 2-3 références]
   ↓
Demande consentement écrit candidat
   ↓
Recruteur contacte références (téléphone ou questionnaire écrit)
   ↓
Questions standardisées :
  • Période de collaboration
  • Fonction exacte exercée
  • Compétences clés observées
  • Points forts et axes de progrès
  • Recommanderiez-vous ? Pourquoi ?
   ↓
Synthèse référence dans fiche candidat
```

## 4.3 Précautions juridiques

- Consentement écrit obligatoire (RGPD).
- Pas de contact ancien employeur actuel sans accord exprès.
- Pas de divulgation d'informations confidentielles à la référence.
- Synthèse partagée avec candidat (transparence).

## 4.4 Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Vérification références - Awa DIABATÉ                                 │
├──────────────────────────────────────────────────────────────────────┤
│ CONSENTEMENT CANDIDATE                                                │
│  ✅ Reçu le 23/06 (formulaire signé)                                   │
│                                                                       │
│ RÉFÉRENCES FOURNIES (3)                                                │
│                                                                       │
│ Référence 1 : M. KOUAME (ex-N+1 SOGECA)                                │
│  Tél : +225 07 88 99 00                                                │
│  Période : 06/2017 - 12/2019                                           │
│  Contact : ✅ Effectué 24/06                                          │
│  Synthèse :                                                            │
│  "Excellente professionnelle, organisée, leadership naturel. A su      │
│  reprendre un portefeuille difficile et le développer de 40% en 18    │
│  mois. Recommandée sans réserve."                                      │
│                                                                       │
│ Référence 2 : Mme TRAORÉ (collègue AfricaTrade)                       │
│  Contact : ⏳ Tentative 1 sans retour                                 │
│  Relance prévue : 26/06                                                │
│                                                                       │
│ Référence 3 : M. SIDIBÉ (mentor)                                       │
│  Contact : ✅ Effectué 24/06                                          │
│  Synthèse : "Très belle évolution, capacité d'apprentissage rapide."   │
│                                                                       │
│ SYNTHÈSE GLOBALE                                                      │
│  ✅ Toutes références positives                                       │
│  ✅ Cohérence avec CV et déclarations entretien                       │
│  ✅ Recommandation finale : Validé pour offre                          │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 5. DÉTECTION DE TRICHE

## 5.1 Mécanismes pour tests à distance

- **Time tracking** : durée passation trop courte = suspect.
- **Focus tracking** : changement onglet, fenêtre inactive.
- **IP géolocalisée** : cohérence avec déclaration candidat.
- **Webcam** (option) : enregistrement passation.
- **Browser lockdown** (option) : pas de copier-coller, pas d'autres onglets.

## 5.2 Limites

- Pas d'invasif (RGPD).
- Information claire au candidat avant test.
- Pas d'élimination automatique sur seul signal triche → revue manuelle.

## 5.3 Alertes affichées

```
⚠ Activité suspecte détectée sur passation
  • Test complété en 18 min sur 120 min prévues
  • 4 changements d'onglet détectés
  • Webcam désactivée pendant 12 min
  
Recommandation : Considérer une re-passation en présentiel.
```

---

# 6. APIS TESTS

```
GET  /hr/recrutement/tests/catalog
GET  /hr/recrutement/tests/catalog/{testId}
POST /hr/recrutement/tests/catalog (ajout test custom)

POST /hr/recrutement/applications/{appId}/tests/invite
     body: { test_id, deadline }
GET  /hr/recrutement/applications/{appId}/tests
GET  /hr/recrutement/tests/passations/{passId}
POST /hr/recrutement/tests/passations/{passId}/start
POST /hr/recrutement/tests/passations/{passId}/submit
POST /hr/recrutement/tests/passations/{passId}/cancel
GET  /hr/recrutement/tests/passations/{passId}/results

POST /hr/recrutement/assessment-centers
GET  /hr/recrutement/assessment-centers/{acId}
POST /hr/recrutement/assessment-centers/{acId}/programmer

POST /hr/recrutement/applications/{appId}/references
POST /hr/recrutement/applications/{appId}/references/contact
GET  /hr/recrutement/applications/{appId}/references
```

---

# 7. TABLES IMPLIQUÉES

### Nouvelles
- `test_catalog`
- `test_passations`
- `test_passation_logs` (suivi temps réel)
- `test_cheating_signals`
- `assessment_centers`
- `assessment_center_sessions`
- `references_verifications`
- `references_contacts_log`

---

# 8. SYNTHÈSE

**Tests & Assessments** :
- Tests techniques (internes + partenaires HackerRank, Codility, TestGorilla).
- Tests psychométriques (Big Five, valeurs, motivations).
- Mises en situation (cas pratiques, jeux de rôle).
- **Assessment centers** structurés pour postes stratégiques.
- **Vérification de références** avec consentement RGPD.
- **Détection de triche** basique (sans invasif).

**Règles dures** :
- Tests validés juridiquement (anti-discrimination).
- Consentement candidat à chaque passation.
- Vérification références avec consentement écrit.
- Pas d'élimination automatique sur seul signal triche.
- Audit chaîné.

---

*Fin spécification 08 — Tests & assessments.*
