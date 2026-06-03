# M5 RECRUTEMENT — CANDIDATURES & PIPELINE
## Pipeline kanban, gestion CV, parsing PROPH3T, doublons, fiche candidat 360°
*God mode premium. Référence : 01_FONDATION.md, 03_OFFRES_EMPLOI.md.*

---

# 0. POSITIONNEMENT

Le **pipeline de candidatures** est le **cœur opérationnel** de l'ATS. C'est l'écran sur lequel les recruteurs passent le plus de temps : visualiser, qualifier, faire avancer les candidats à travers les étapes du processus.

Cette section couvre :
- **Réception** des candidatures (site carrière, jobboards, manuel, cooptation).
- **Parsing CV automatique** via PROPH3T.
- **Détection de doublons** (anti ré-application abusive).
- **Pipeline visualisé** en kanban personnalisable.
- **Fiche candidat 360°** avec historique complet.
- **Actions de masse** (déplacement étapes, communication groupée).

## 0.1 Routes

- `/hr/recrutement/offres/{offreId}/candidats` → Pipeline d'une offre
- `/hr/recrutement/candidats` → Vue globale tous candidats
- `/hr/recrutement/candidats/{candidatId}` → Fiche candidat 360°
- `/hr/recrutement/candidats/{candidatId}/historique` → Historique applications
- `/hr/recrutement/candidats/import` → Import manuel

---

# 1. SOURCES DE CANDIDATURES

## 1.1 Canaux d'entrée

### Site carrière interne
- Formulaire de candidature sur `/career/{tenant}/offre/{slug}`.
- Champs : nom, prénom, email, téléphone, CV (PDF), LM (PDF/texte), questions personnalisées.
- Consentement RGPD obligatoire.

### Jobboards externes
- Récupération automatique via APIs des jobboards.
- LinkedIn EasyApply, Indeed Apply, etc.
- Mapping vers structure candidat ATS.

### Cooptation interne
- Collaborateur dépose CV via portail collaborateur.
- Lien automatique avec le coopteur (pour suivi prime).

### Import manuel
- Recruteur ajoute manuellement un candidat (ex. reçu par email).
- Upload CV + saisie données.

### Chasse directe
- Profil identifié via LinkedIn / Monster.
- Conversion en candidature après réponse positive du candidat.

### Réapplication
- Candidat de viviers / ancien candidat repostule.
- Liaison automatique avec son historique.

## 1.2 Modèle de données

```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Identité
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name_normalized TEXT,    -- pour détection doublons
  email TEXT NOT NULL,
  email_hash TEXT,               -- pour anonymisation RGPD
  phone TEXT,
  date_of_birth DATE,            -- optionnel (RGPD)
  gender TEXT,                   -- optionnel
  nationality TEXT,
  current_location TEXT,
  
  -- Données professionnelles extraites
  current_position TEXT,
  current_company TEXT,
  years_of_experience INT,
  highest_education TEXT,
  
  -- Compétences (depuis parsing)
  extracted_skills TEXT[],
  
  -- Préférences
  preferred_contact_method TEXT,
  preferred_communication_language TEXT,
  
  -- RGPD
  rgpd_consent_given_at TIMESTAMPTZ NOT NULL,
  rgpd_consent_purpose TEXT NOT NULL,
  rgpd_consent_duration_months INT DEFAULT 24,
  rgpd_consent_anonymization_date DATE,
  
  -- État
  status TEXT,                   -- 'active', 'anonymized', 'deleted'
  
  -- Vivier
  in_pool BOOLEAN DEFAULT false,
  pool_categories TEXT[],
  
  -- Origine première inscription
  first_source TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  job_offer_id UUID NOT NULL REFERENCES job_offers(id),
  
  -- Source
  application_source TEXT NOT NULL,  -- 'career_site', 'linkedin', 'indeed', etc.
  applied_at TIMESTAMPTZ DEFAULT now(),
  
  -- Documents
  cv_document_id UUID,
  cover_letter_document_id UUID,
  cover_letter_text TEXT,
  additional_documents UUID[],
  
  -- Réponses questions personnalisées
  custom_answers JSONB,
  
  -- Cooptation
  referrer_employee_id UUID,
  
  -- Pipeline
  current_stage_id UUID,
  current_stage_entered_at TIMESTAMPTZ,
  pipeline_history JSONB,        -- log transitions
  
  -- Évaluations
  overall_score DECIMAL(3,2),
  matching_score_ai DECIMAL(3,2),
  
  -- État
  status TEXT,                   -- 'new', 'in_progress', 'hired', 'rejected', 'withdrawn'
  rejection_reason TEXT,
  rejection_communicated_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  audit_log JSONB
);

CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  job_offer_id UUID,             -- NULL = stages globaux par défaut
  
  code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  position INT NOT NULL,
  
  category TEXT NOT NULL,        -- 'new', 'pre_qualification', 'evaluation', 'final', 'closed'
  
  -- Couleur kanban
  color TEXT,
  
  -- Actions
  default_actions JSONB,
  
  active BOOLEAN DEFAULT true
);
```

---

# 2. PIPELINE KANBAN

## 2.1 Layout standard

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Pipeline - OFR-2026-0245 Chef de Projet Commercial (38 candidats)                            │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ Filtres : [Source ▾] [Match score ≥▾] [📅 Reçu depuis ▾]              [🔍 Rechercher candidat]│
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐│
│ │NOUVEAUX (12)│ │PRÉ-QUAL (8) │ │ÉVAL.TECH (5)│ │ENTR.MGR (4) │ │FINALE (2)   │ │HIRED (0)││
│ │             │ │             │ │             │ │             │ │             │ │         ││
│ │┌───────────┐│ │┌───────────┐│ │┌───────────┐│ │┌───────────┐│ │┌───────────┐│ │         ││
│ ││Awa DIA. 🎯││ ││Ibra. KOU. ││ ││Mariam B.  ││ ││Yao DIALLO ││ ││Fatou BAH  ││ │         ││
│ ││★★★★★ 92%  ││ ││★★★★ 85%   ││ ││★★★★ 82%   ││ ││★★★★ 88%   ││ ││★★★★★ 94%  ││ │         ││
│ ││Site car.  ││ ││LinkedIn   ││ ││Cooptation ││ ││LinkedIn   ││ ││Cooptation ││ │         ││
│ ││Reçu 03/06 ││ ││03/06      ││ ││02/06      ││ ││30/05      ││ ││25/05      ││ │         ││
│ ││[Ouvrir]   ││ ││[Ouvrir]   ││ ││[Ouvrir]   ││ ││[Ouvrir]   ││ ││[Ouvrir]   ││ │         ││
│ │└───────────┘│ │└───────────┘│ │└───────────┘│ │└───────────┘│ │└───────────┘│ │         ││
│ │             │ │             │ │             │ │             │ │             │ │         ││
│ │┌───────────┐│ │┌───────────┐│ │┌───────────┐│ │             │ │             │ │         ││
│ ││Aboubakar T││ ││Aïssa KONÉ ││ ││...        ││ │             │ │             │ │         ││
│ ││★★★ 78%    ││ ││★★★★ 80%   ││ ││           ││ │             │ │             │ │         ││
│ ││...        ││ ││...        ││ ││           ││ │             │ │             │ │         ││
│ │└───────────┘│ │└───────────┘│ │└───────────┘│ │             │ │             │ │         ││
│ │             │ │             │ │             │ │             │ │             │ │         ││
│ │+ 10 autres  │ │+ 6 autres   │ │+ 3 autres   │ │+ 3 autres   │ │+ 1 autre    │ │         ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘│
│                                                                                             │
│ COLONNE FERMÉS (17) : Rejetés (12) · Désistés (5)                                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Carte candidat (kanban)

```
┌─────────────────────────────┐
│ Awa DIABATÉ                  │
│ ★★★★★ Match 92%              │
│                              │
│ 32 ans · Cadre commercial    │
│ 6 ans exp · Marketing Sup    │
│                              │
│ Source : Site carrière       │
│ Reçu le 03/06 (J-2)          │
│                              │
│ 🏷 #anglais #CRM #leadership │
│                              │
│ Étape : Nouveaux             │
│ Action req. : Pré-qualif J+1 │
│                              │
│ [📄 CV] [✉ Message] [Ouvrir] │
└─────────────────────────────┘
```

## 2.3 Drag & drop entre étapes

Le recruteur déplace un candidat d'une colonne à l'autre :
- Confirmation pour changements importants (passer en finale).
- Action automatique selon transition (envoyer email, programmer entretien).
- Trace dans `pipeline_history`.

## 2.4 Personnalisation pipeline

Par défaut, 6 étapes standard :
1. Nouveaux (entrée)
2. Pré-qualification (CV review)
3. Évaluation technique (tests)
4. Entretien manager
5. Finale (DRH + DG)
6. Hired / Closed

Le pipeline peut être **personnalisé par offre** (ajout d'étapes spécifiques, ex. "Présentation business case" pour cadres).

---

# 3. PARSING CV AVEC PROPH3T

## 3.1 Workflow

```
[Candidature reçue avec CV PDF]
   ↓
EF ocr-cv : Tesseract extrait le texte brut
   ↓
EF parse-cv-proph3t : PROPH3T Ollama extrait structure
  • Identité (nom, prénom, contact)
  • Expérience pro (postes, entreprises, dates, descriptions)
  • Formation (diplômes, écoles, dates)
  • Compétences techniques
  • Langues
  • Centres d'intérêt
   ↓
Validation manuelle si confiance < 80%
   ↓
Pré-remplissage fiche candidat
```

## 3.2 Données extraites

```typescript
interface ParsedCV {
  identity: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address?: string;
    date_of_birth?: string;
    nationality?: string;
  };
  professional_experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: {
    technical: string[];
    soft: string[];
    tools: string[];
  };
  languages: LanguageProficiency[];
  certifications: CertificationEntry[];
  links: { type: string; url: string }[];  // LinkedIn, GitHub, portfolio
  
  parsing_metadata: {
    confidence_score: number;  // 0-100
    parsing_warnings: string[];
    extraction_timestamp: Date;
  };
}
```

## 3.3 Affichage extraction

```
┌──────────────────────────────────────────────────────────────────────┐
│ Parsing CV - Candidat Awa DIABATÉ                                     │
│ Confiance globale : 94% ✅                                            │
├──────────────────────────────────────────────────────────────────────┤
│ IDENTITÉ EXTRAITE                                                     │
│  Prénom : Awa                                                         │
│  Nom : DIABATÉ                                                        │
│  Email : awa.diabate@email.com ✅ (validé)                            │
│  Téléphone : +225 07 12 34 56 78                                       │
│  Date naissance : 15/03/1992 (32 ans)                                  │
│                                                                       │
│ EXPÉRIENCE PROFESSIONNELLE (3 postes)                                 │
│                                                                       │
│  ▶ Senior Business Developer                                          │
│    AfricaTrade SA · 01/2020 - actuel (4 ans 5 mois)                    │
│    "Pilotage de 15 comptes clés, développement portefeuille +40%..."   │
│                                                                       │
│  ▶ Business Developer                                                  │
│    SOGECA · 06/2017 - 12/2019 (2 ans 6 mois)                           │
│    "..."                                                               │
│                                                                       │
│  ▶ Stage Commercial                                                    │
│    Orange CI · 02/2016 - 08/2016 (6 mois)                              │
│                                                                       │
│ FORMATION                                                              │
│  ▶ Master 2 Marketing & Vente (2016)                                   │
│    HEC Paris                                                          │
│                                                                       │
│  ▶ Licence Économie (2014)                                             │
│    Université FHB d'Abidjan                                            │
│                                                                       │
│ COMPÉTENCES DÉTECTÉES                                                 │
│  Techniques : CRM (Salesforce, HubSpot), Excel avancé, Power BI       │
│  Soft : Leadership, négociation, communication                         │
│  Outils : Slack, Microsoft 365, Jira                                  │
│                                                                       │
│ LANGUES                                                                │
│  Français (Bilingue), Anglais (Courant), Dioula (Maternel)             │
│                                                                       │
│ CERTIFICATIONS                                                         │
│  Salesforce Admin (2022)                                               │
│  Google Analytics (2021)                                               │
│                                                                       │
│ LIENS                                                                  │
│  LinkedIn : linkedin.com/in/awa-diabate                                │
│                                                                       │
│ ⚠ ALERTES PARSING                                                     │
│  • Aucune alerte                                                      │
│                                                                       │
│ [✏ Modifier extraction] [✅ Valider] [↩ Re-parser]                    │
└──────────────────────────────────────────────────────────────────────┘
```

## 3.4 Cas d'erreur parsing

Si confiance < 60%, l'extraction est marquée pour **revue manuelle**. Le recruteur peut :
- Re-parser (nouvelle tentative).
- Saisir manuellement les données.
- Demander au candidat de soumettre format plus clair.

---

# 4. DÉTECTION DE DOUBLONS

## 4.1 Pourquoi

- Candidat qui postule plusieurs fois (offre différente ou même offre).
- Candidat déjà dans la base (vivier, ancien candidat).
- Tentative de tromperie (mêmes données sous identité différente).

## 4.2 Algorithme

Plusieurs critères de matching :
- **Exact match email** (poids fort).
- **Match nom + téléphone**.
- **Match nom + email_domain**.
- **Fuzzy match nom + données pro communes**.
- **Hash phonétique** (pour orthographes différentes).

Score de confiance → si > 80% → suggestion doublon.

## 4.3 Workflow détection

```
[Nouvelle candidature reçue]
   ↓
Recherche doublons potentiels
   ↓
Si trouvé(s) :
  • Affichage liste candidats correspondants
  • Recruteur décide : fusionner OU créer nouveau
   ↓
Si fusion :
  • Conservation du candidat existant
  • Ajout de la nouvelle application
  • Lien historique conservé
```

## 4.4 Affichage

```
┌──────────────────────────────────────────────────────────────────────┐
│ ⚠ DOUBLON POTENTIEL DÉTECTÉ                                           │
├──────────────────────────────────────────────────────────────────────┤
│ Le candidat Awa DIABATÉ (email : awa.diabate@email.com) ressemble à : │
│                                                                       │
│ Candidat existant : Awa DIABATÉ (ID #1245)                            │
│  • Email : awa.diabate@email.com ✅ EXACT                              │
│  • Téléphone : +225 07 12 34 56 78 ✅ EXACT                            │
│  • Précédente candidature : OFR-2025-0089 (Commercial Senior, rejeté) │
│  • Dans vivier "Commerciaux confirmés" depuis 11/2025                  │
│                                                                       │
│ ACTION                                                                 │
│  ● Fusionner avec candidat existant (recommandé)                       │
│  ○ Créer nouveau candidat (en cas d'homonymie réelle)                  │
│  ○ Ignorer (cancel)                                                   │
│                                                                       │
│ [Confirmer fusion]                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 5. FICHE CANDIDAT 360°

## 5.1 Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ HEADER CANDIDAT (fixe)                                                            │
│  [Photo] Awa DIABATÉ                                                              │
│           32 ans · Senior Business Developer · Abidjan                            │
│           [📞 +225 07 12 34 56 78] [✉ awa.diabate@email.com]                     │
│           [🔗 LinkedIn]                                                           │
│                                                                                   │
│           ★ Score 92% pour OFR-2026-0245                                          │
│           Étape : Nouveaux · Reçu 03/06                                           │
│                                                                                   │
│           [📝 Action ▾] [✉ Message] [📅 Planifier] [⭐ Évaluer]                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ NAVIGATION                                                                        │
│  [Synthèse] [CV/Documents] [Évaluations] [Entretiens] [Tests] [Comm.] [Historique]│
├─────────────────────────────────────────────────────────────────────────────────┤
│ CONTENU                                                                           │
│  ...                                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Onglet Synthèse

Vue agrégée :
- Données extraites du CV.
- Score matching (et détail).
- Compétences vs requis (gap analysis).
- Score d'évaluation moyen.
- Prochaines actions.
- Notes recruteur.

## 5.3 Onglet CV / Documents

- CV (visualisation PDF + données extraites).
- Lettre de motivation.
- Documents complémentaires (diplômes, certifs, portfolio).
- Données du formulaire candidature.

## 5.4 Onglet Évaluations

(Détail dans doc 06)

## 5.5 Onglet Entretiens

(Détail dans doc 07)

## 5.6 Onglet Tests

(Détail dans doc 08)

## 5.7 Onglet Communications

Historique de toutes les communications avec ce candidat :
- Emails envoyés/reçus.
- SMS.
- Notifications portail candidat.
- Notes internes recruteur.

## 5.8 Onglet Historique

Toutes ses candidatures dans l'entreprise :
- Offres précédentes postulées.
- Statuts finaux.
- Pipeline parcouru.
- Si déjà recruté : lien vers M1/M4.

---

# 6. PORTAIL CANDIDAT EXTERNE

## 6.1 Espace candidat

Sur `/career/{tenant}/mon-espace`, candidat peut :
- Voir liste de ses candidatures.
- Voir statut actuel.
- Voir prochaines étapes.
- Mettre à jour son CV/profil.
- Communiquer avec recruteur (messagerie).
- Programmer entretiens (sur créneaux proposés).
- Compléter tests (si requis).
- Exercer ses droits RGPD (accès, modification, suppression).

## 6.2 Transparence

Statut de candidature visible en temps réel :
- "Reçue, en cours d'examen" (J0-J7)
- "Pré-qualification en cours" (J7-J14)
- "Évaluation technique programmée" (avec date)
- "Entretien manager programmé" (avec date)
- "Décision finale en cours"
- "Acceptée" / "Non retenue"

---

# 7. ACTIONS DE MASSE

## 7.1 Multi-sélection

Cocher plusieurs candidats dans le pipeline → actions :
- Envoyer email groupé (template).
- Passer à étape suivante.
- Rejeter en lot (avec lettre type).
- Ajouter à vivier.
- Exporter en CSV (pour analyse externe, avec consentement).

## 7.2 Lettre de rejet groupée

Cas typique : 12 candidats non retenus après pré-qualif.
- Sélection multiple.
- Choix template lettre rejet.
- Personnalisation rapide (variable {{first_name}}).
- Envoi groupé.
- Trace dans communications de chacun.

---

# 8. RECHERCHE TRANSVERSE CANDIDATS

## 8.1 Moteur de recherche

Recherche full-text + filtres avancés :
- Sur tout : nom, email, contenu CV, notes, évaluations.
- Filtres : compétences, années exp, formation, localisation, langues, source, statut.
- Recherche booleanne (AND, OR, NOT).

## 8.2 Cas d'usage

- Nouveau besoin "Commercial confirmé" → rechercher dans vivier + anciens candidats matching.
- Réactivation pour opportunité.
- Vérification doublon.

---

# 9. APIS CANDIDATURES

```
GET  /hr/recrutement/offres/{offreId}/candidats?stage=&filters=
POST /hr/recrutement/offres/{offreId}/candidats (import manuel)
GET  /hr/recrutement/candidats/{candidatId}
GET  /hr/recrutement/candidats/{candidatId}/synthese
GET  /hr/recrutement/candidats/{candidatId}/cv
GET  /hr/recrutement/candidats/{candidatId}/historique
PATCH /hr/recrutement/candidats/{candidatId}
DELETE /hr/recrutement/candidats/{candidatId} (anonymisation RGPD)

POST /hr/recrutement/applications/{appId}/move-to-stage
POST /hr/recrutement/applications/{appId}/reject
POST /hr/recrutement/applications/{appId}/withdraw

POST /hr/recrutement/cv/parse (PROPH3T)
POST /hr/recrutement/candidats/detect-duplicates
POST /hr/recrutement/candidats/merge

POST /hr/recrutement/candidats/bulk-action
     body: { ids: [], action: 'move_stage' | 'send_email' | 'reject' | 'add_to_pool', params: {} }

GET  /hr/recrutement/candidats/search?q=&filters=
```

---

# 10. TABLES IMPLIQUÉES

### Nouvelles
- `candidates` (base candidats externes)
- `candidate_documents` (CV, LM, divers)
- `candidate_parsing_results` (extractions PROPH3T)
- `candidate_duplicate_logs` (détections doublons)
- `candidate_merges_log` (fusions effectuées)
- `applications` (candidatures sur offres)
- `application_pipeline_history` (transitions)
- `pipeline_stages` (étapes configurables)
- `candidate_communications` (toutes comms)
- `candidate_notes_recruiter` (notes internes)
- `candidate_pools` (viviers)
- `candidate_pool_members`
- `bulk_actions_log`

---

# 11. SYNTHÈSE

**Candidatures & Pipeline** :
- Réception multi-canal (site, jobboards, cooptation, manuel, chasse).
- **Parsing CV PROPH3T** avec extraction structurée + confiance.
- **Détection doublons** avec algorithme multi-critères.
- **Pipeline kanban** 6 étapes par défaut, personnalisable par offre.
- **Drag & drop** entre étapes avec actions automatiques.
- **Fiche candidat 360°** avec 7 onglets.
- **Portail candidat externe** transparent avec droits RGPD.
- **Actions de masse** (rejet groupé, email batch).
- **Recherche transverse** full-text + filtres avancés.

**Règles dures** :
- Consentement RGPD vérifié à chaque candidature.
- Pas d'élimination automatique sans validation humaine.
- Détection doublons systématique.
- Statut visible candidat en temps réel.
- Communications tracées.
- Audit chaîné.

---

*Fin spécification 05 — Candidatures & pipeline.*
