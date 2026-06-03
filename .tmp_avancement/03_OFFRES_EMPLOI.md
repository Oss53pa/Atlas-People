# M5 RECRUTEMENT — OFFRES D'EMPLOI
## Rédaction, modèles, multilingue, publication
*God mode premium. Référence : 01_FONDATION.md, 02_BESOIN_RECRUTEMENT.md.*

---

# 0. POSITIONNEMENT

L'**offre d'emploi** est la **face publique** du besoin de recrutement, destinée aux **candidats**. Sa qualité influe directement sur :
- L'**attractivité** (nombre et qualité des candidatures reçues).
- La **marque employeur** (image projetée).
- La **conformité** (RGPD, non-discrimination).
- La **performance SEO** (visibilité sur jobboards et moteurs).

Cette section couvre :
- **Bibliothèque de modèles** d'offres par type de poste.
- **Wizard de rédaction** avec assistance PROPH3T.
- **Personnalisation** multilingue.
- **Validation** juridique et marketing.
- **Publication** sur le site carrière interne.

## 0.1 Routes

- `/hr/recrutement/offres` → Liste offres
- `/hr/recrutement/offres/nouvelle` → Wizard
- `/hr/recrutement/offres/{offreId}` → Détail
- `/hr/recrutement/offres/{offreId}/edit` → Édition
- `/hr/recrutement/offres/{offreId}/preview` → Aperçu candidat
- `/hr/recrutement/offres/modeles` → Bibliothèque

---

# 1. STRUCTURE D'UNE OFFRE

## 1.1 Sections standard

Une offre publique comprend :

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ACCROCHE (hook)                                                │
│    Phrase punchy d'introduction                                   │
├─────────────────────────────────────────────────────────────────┤
│ 2. ENTREPRISE                                                    │
│    Présentation employeur, valeurs, culture                       │
├─────────────────────────────────────────────────────────────────┤
│ 3. MISSIONS                                                       │
│    Responsabilités principales (5-8 points)                       │
├─────────────────────────────────────────────────────────────────┤
│ 4. PROFIL RECHERCHÉ                                               │
│    Formation, expérience, compétences                             │
├─────────────────────────────────────────────────────────────────┤
│ 5. CE QUE NOUS OFFRONS                                            │
│    Rémunération, avantages, opportunités                          │
├─────────────────────────────────────────────────────────────────┤
│ 6. PROCESSUS DE RECRUTEMENT                                       │
│    Étapes, délais, contacts                                       │
├─────────────────────────────────────────────────────────────────┤
│ 7. INFORMATIONS PRATIQUES                                         │
│    Lieu, type contrat, date début, télétravail                    │
├─────────────────────────────────────────────────────────────────┤
│ 8. ENGAGEMENT DIVERSITÉ & INCLUSION                               │
│    Mention obligatoire non-discrimination                         │
└─────────────────────────────────────────────────────────────────┘
```

## 1.2 Modèle de données

```sql
CREATE TABLE job_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  recruitment_need_id UUID NOT NULL REFERENCES recruitment_needs(id),
  
  -- Identification
  reference TEXT UNIQUE NOT NULL,  -- OFR-2026-0245
  slug TEXT UNIQUE NOT NULL,       -- pour URL friendly
  
  -- Contenu principal
  title TEXT NOT NULL,
  title_seo TEXT,                  -- titre optimisé SEO
  
  hook TEXT,                       -- accroche
  company_description TEXT,
  missions JSONB,                  -- liste structurée
  profile_required JSONB,
  benefits JSONB,
  recruitment_process TEXT,
  practical_info JSONB,
  diversity_statement TEXT,
  
  -- Données structurées
  contract_type TEXT NOT NULL,
  experience_min_years INT,
  experience_max_years INT,
  education_level TEXT,
  salary_min INT,
  salary_max INT,
  salary_currency TEXT DEFAULT 'XOF',
  
  -- Localisation
  location_city TEXT,
  location_country TEXT,
  remote_work_policy TEXT,         -- full_remote, hybrid, on_site
  
  -- Métadonnées
  language TEXT NOT NULL,          -- fr, en, bilingual
  category TEXT,                    -- commercial, finance, IT, etc.
  job_function TEXT,
  
  -- Statut
  status TEXT NOT NULL,            -- draft, validated, published, paused, closed
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Validations
  legal_validated_at TIMESTAMPTZ,
  legal_validated_by UUID,
  marketing_validated_at TIMESTAMPTZ,
  marketing_validated_by UUID,
  
  -- Visibilité
  visibility TEXT NOT NULL,        -- public, internal_only, confidential
  
  -- SEO
  seo_meta_title TEXT,
  seo_meta_description TEXT,
  seo_keywords TEXT[],
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL,
  audit_hash TEXT
);
```

---

# 2. BIBLIOTHÈQUE DE MODÈLES

## 2.1 Modèles standards livrés

Atlas People livre des modèles **par famille de métier** :

```
Bibliothèque modèles offres
├── COMMERCIAL
│   ├── MOD-OFR-COM-DIR-COMMERCIAL
│   ├── MOD-OFR-COM-CHEF-PROJET
│   ├── MOD-OFR-COM-COMMERCIAL-B2B
│   ├── MOD-OFR-COM-CHARGE-AFFAIRES
│   └── MOD-OFR-COM-ASSISTANT-COM
├── FINANCE & COMPTABILITÉ
│   ├── MOD-OFR-FIN-DAF
│   ├── MOD-OFR-FIN-CONTROLEUR-GESTION
│   ├── MOD-OFR-FIN-COMPTABLE-SENIOR
│   ├── MOD-OFR-FIN-COMPTABLE
│   └── MOD-OFR-FIN-TRESORIER
├── RESSOURCES HUMAINES
│   ├── MOD-OFR-RH-DRH
│   ├── MOD-OFR-RH-RRH
│   ├── MOD-OFR-RH-CHARGE-RECRUTEMENT
│   ├── MOD-OFR-RH-GESTIONNAIRE-PAIE
│   └── MOD-OFR-RH-ASSISTANT-RH
├── INFORMATIQUE
│   ├── MOD-OFR-IT-DIRECTION-SI
│   ├── MOD-OFR-IT-DEVELOPPEUR
│   ├── MOD-OFR-IT-ADMIN-SYSTEME
│   └── MOD-OFR-IT-SUPPORT
├── OPÉRATIONS / CENTRE COMMERCIAL
│   ├── MOD-OFR-OPS-DIRECTEUR-CENTRE
│   ├── MOD-OFR-OPS-RESPONSABLE-MAINTENANCE
│   ├── MOD-OFR-OPS-AGENT-SECURITE
│   └── MOD-OFR-OPS-AGENT-ENTRETIEN
├── DIRECTION GÉNÉRALE
│   ├── MOD-OFR-DG-DIRECTEUR-GENERAL
│   └── MOD-OFR-DG-DIRECTEUR-EXECUTIF
└── ALTERNANCE / STAGES
    ├── MOD-OFR-ALT-APPRENTISSAGE
    └── MOD-OFR-STAGE-DECOUVERTE
```

~30 modèles standards livrés, extensibles.

## 2.2 Structure d'un modèle

```typescript
interface JobOfferTemplate {
  id: UUID;
  tenant_id: UUID;
  
  // Identification
  code: string;
  libelle: string;
  category: string;       // famille métier
  job_function: string;
  
  // Contenu template
  language: 'fr' | 'en' | 'bilingual';
  hook_template: string;
  company_description_template: string;
  missions_template: string[];      // array de bullets avec placeholders
  profile_template: string[];
  benefits_template: string[];
  recruitment_process_template: string;
  diversity_statement_template: string;
  
  // SEO
  seo_keywords_suggested: string[];
  
  // Variables
  variables: TemplateVariable[];
  
  // Validations
  legal_validated_by: UUID;
  legal_validated_at: Date;
  
  // Versions
  version: number;
  effective_from: Date;
  
  // État
  active: boolean;
  is_atlas_standard: boolean;  // livré par Atlas vs custom tenant
}
```

## 2.3 Personnalisation tenant

Tenant peut :
- Utiliser tel quel.
- Hériter d'un modèle Atlas et personnaliser (ex. ajouter mentions branding maison).
- Créer modèles 100% custom.

## 2.4 Layout bibliothèque

```
┌──────────────────────────────────────────────────────────────────────┐
│ Bibliothèque modèles offres - Tenant CRMC                              │
├──────────────────────────────────────────────────────────────────────┤
│ Filtres : [Famille ▾] [Langue ▾] [Statut ▾]                            │
├──────────────────────────────────────────────────────────────────────┤
│ COMMERCIAL (5 modèles)                                                 │
│                                                                       │
│ Modèle                          │ Hérité de         │ Utilisations   │
│ ─────────────────────────────── │ ───────────────── │ ───────────── │
│ MOD-OFR-COM-CHEF-PROJET         │ Atlas standard    │ 8 offres      │
│ MOD-CRMC-COM-CHEF-PROJ-V2       │ MOD-OFR-COM-CHEF  │ 12 offres     │
│ MOD-OFR-COM-COMMERCIAL-B2B      │ Atlas standard    │ 5 offres      │
│ ...                                                                   │
│                                                                       │
│ [Voir détail] [Hériter] [Aperçu PDF]                                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 3. WIZARD CRÉATION D'OFFRE

## 3.1 Pré-remplissage depuis besoin

L'offre est créée **à partir du besoin** :
- Données structurées pré-remplies (poste, fourchette salariale, localisation, contrat).
- Sélection d'un modèle d'offre adapté à la famille métier.
- Personnalisation du texte.

## 3.2 Étape 1 — Choix modèle

```
┌──────────────────────────────────────────────────────────────────────┐
│ Nouvelle offre depuis besoin BES-2026-0245 (1/5)                      │
├──────────────────────────────────────────────────────────────────────┤
│ BESOIN SOURCE                                                         │
│  BES-2026-0245 : Chef de Projet Commercial                            │
│  Service : Direction Commerciale                                       │
│  ✅ Besoin validé                                                     │
│                                                                       │
│ CHOIX DU MODÈLE                                                       │
│ Modèles suggérés (selon famille métier Commercial) :                  │
│  ● MOD-CRMC-COM-CHEF-PROJ-V2 (recommandé - utilisé 12 fois)            │
│  ○ MOD-OFR-COM-CHEF-PROJET (Atlas standard)                            │
│  ○ MOD-OFR-COM-CHARGE-AFFAIRES                                         │
│  ○ Partir d'une offre blanche                                          │
│                                                                       │
│ LANGUE                                                                │
│  ● Français                                                           │
│  ○ Anglais                                                            │
│  ○ Bilingue FR/EN                                                      │
│                                                                       │
│ VISIBILITÉ                                                            │
│  ● Publique (site carrière + jobboards)                                │
│  ○ Interne uniquement (mobilité interne)                              │
│  ○ Confidentielle (par invitation, ex. chasse)                        │
│                                                                       │
│                                          [Continuer →]                │
└──────────────────────────────────────────────────────────────────────┘
```

## 3.3 Étape 2 — Rédaction contenu

```
┌──────────────────────────────────────────────────────────────────────┐
│ Nouvelle offre (2/5) - Rédaction                                       │
├──────────────────────────────────────────────────────────────────────┤
│ TITRE ANNONCE (visible candidats)                                     │
│  [Chef de Projet Commercial H/F - Cosmos Yopougon____________________]│
│  ⚠ Mention "H/F" obligatoire (non-discrimination)                      │
│                                                                       │
│ ACCROCHE                                                              │
│  [Rejoignez CRMC, leader du retail en Côte d'Ivoire, et pilotez______]│
│  [_des projets commerciaux stratégiques au sein de Cosmos Yopougon]   │
│                                                                       │
│ PRÉSENTATION ENTREPRISE                                                │
│  [Texte généré depuis modèle, personnalisable]                         │
│  ☑ Inclure logo entreprise                                            │
│  ☑ Inclure vidéo carrière (si dispo)                                   │
│                                                                       │
│ MISSIONS PRINCIPALES                                                  │
│  ● Piloter les projets commerciaux stratégiques de CRMC SA            │
│  ● Animer et coordonner l'équipe commerciale (5 personnes)            │
│  ● Définir et mettre en œuvre la stratégie commerciale du centre     │
│  ● Gérer la relation avec les enseignes partenaires majeures          │
│  ● Suivre les KPI commerciaux et reporter à la direction              │
│  ● Identifier et développer de nouveaux partenariats                  │
│  ● Participer aux comités de direction commerciale                    │
│  [+ Ajouter mission]                                                  │
│                                                                       │
│ PROFIL RECHERCHÉ                                                      │
│  Formation : Bac+5 (École Commerce, Management ou équivalent)         │
│  Expérience : 5 ans minimum dans la gestion de projets commerciaux   │
│  Compétences techniques :                                              │
│   • Maîtrise des techniques de vente B2B                              │
│   • Compétences managériales avérées                                  │
│   • Maîtrise des outils CRM (Salesforce, HubSpot)                      │
│   • Bonne maîtrise de l'analyse financière                            │
│  Compétences comportementales :                                       │
│   • Leadership, communication, orientation résultats                  │
│  Langues : Français bilingue, Anglais courant                          │
│                                                                       │
│ CE QUE NOUS OFFRONS                                                   │
│  ● Rémunération attractive : 800 000 - 1 100 000 FCFA brut/mois        │
│  ● Indemnités logement (250K), transport (45K), prime fonction (75K)  │
│  ● Mutuelle santé complète                                             │
│  ● Tickets restaurant, téléphone, ordinateur portable                  │
│  ● Télétravail 2 jours/semaine                                        │
│  ● Formation continue et opportunités d'évolution                      │
│  ● Cadre de travail moderne et stimulant                              │
│                                                                       │
│ PROCESSUS DE RECRUTEMENT                                              │
│  1. Étude de votre candidature (sous 7 jours)                          │
│  2. Entretien téléphonique avec la RH (30 min)                         │
│  3. Entretien avec le manager opérationnel (1h)                        │
│  4. Test de mise en situation (2h)                                     │
│  5. Entretien finale avec la DRH et le DG                              │
│  6. Réponse définitive sous 15 jours                                   │
│                                                                       │
│ INFORMATIONS PRATIQUES                                                │
│  Type contrat : CDI                                                   │
│  Localisation : Cosmos Yopougon, Abidjan                              │
│  Date de prise de poste : 01/08/2026 (ou selon préavis)               │
│  Référence : OFR-2026-0245                                             │
│                                                                       │
│ ENGAGEMENT DIVERSITÉ                                                  │
│  [Texte standard non-discrimination, modifiable]                       │
│                                                                       │
│ [🤖 Améliorer texte avec PROPH3T] [Aperçu candidat] [Sauvegarder]      │
│                                                                       │
│                                          [Continuer →]                │
└──────────────────────────────────────────────────────────────────────┘
```

## 3.4 Assistance PROPH3T

Bouton **[🤖 Améliorer avec PROPH3T]** propose :
- Reformulation accroche pour plus de punch.
- Suggestions pour rendre missions plus claires.
- Détection langage discriminatoire (genre, âge).
- Optimisation SEO du titre.
- Suggestion mots-clés pour visibilité.

L'utilisateur **valide ou ignore** chaque suggestion.

## 3.5 Étape 3 — SEO et métadonnées

```
┌──────────────────────────────────────────────────────────────────────┐
│ Nouvelle offre (3/5) - SEO & Métadonnées                              │
├──────────────────────────────────────────────────────────────────────┤
│ TITRE SEO (pour Google, jobboards)                                     │
│  [Chef de Projet Commercial - CRMC - Abidjan Yopougon CDI]            │
│                                                                       │
│ META DESCRIPTION                                                       │
│  [CRMC recrute un Chef de Projet Commercial à Abidjan. Pilotez les   ]│
│  [projets commerciaux stratégiques. CDI, 800K-1,1M FCFA brut. Postulez]│
│  [maintenant.]                                                         │
│  Longueur : 145 / 160 caractères ✅                                    │
│                                                                       │
│ MOTS-CLÉS                                                              │
│  [+ Ajouter]                                                          │
│  • chef de projet commercial                                          │
│  • emploi commercial Abidjan                                          │
│  • CDI commerce Côte d'Ivoire                                          │
│  • cadre commercial CCI                                                │
│  • Cosmos Yopougon                                                     │
│  • CRMC recrutement                                                    │
│                                                                       │
│ URL FRIENDLY                                                          │
│  /career/crmc/offre/[chef-de-projet-commercial-yopougon-cdi]          │
│                                                                       │
│ CATÉGORIES JOBBOARDS                                                  │
│  • Commerce                                                           │
│  • Management                                                         │
│  • Centres commerciaux                                                │
│                                                                       │
│ IMAGES (option)                                                       │
│  [📎 Image bannière offre] [📎 Logo entreprise]                        │
│                                                                       │
│                                          [Continuer →]                │
└──────────────────────────────────────────────────────────────────────┘
```

## 3.6 Étape 4 — Validation juridique

```
┌──────────────────────────────────────────────────────────────────────┐
│ Nouvelle offre (4/5) - Validation juridique                           │
├──────────────────────────────────────────────────────────────────────┤
│ CONTRÔLES AUTOMATIQUES                                                │
│  ✅ Mention "H/F" présente dans titre                                 │
│  ✅ Engagement diversité présent                                       │
│  ✅ Aucune mention discriminatoire détectée (âge, genre, origine)     │
│  ✅ Aucune mention salaire individualisé révélant rémunération autre   │
│  ✅ Conformité RGPD (mention traitement données candidats)             │
│  ⚠ Mention "moins de 35 ans" dans missions - À VÉRIFIER                │
│                                                                       │
│ DÉTECTIONS PROPH3T (Suggestions)                                      │
│  ⚠ "jeune équipe" peut être discriminant en termes d'âge               │
│    Suggestion : remplacer par "équipe dynamique"                       │
│    [Appliquer] [Ignorer]                                              │
│                                                                       │
│  💡 Le terme "Manager" peut être plus neutre que "Chef" pour attirer   │
│    plus de candidatures féminines.                                    │
│    [Appliquer] [Ignorer]                                              │
│                                                                       │
│ VALIDATION JURISTE (obligatoire avant publication)                    │
│  [Soumettre validation Maître KOUASSI]                                 │
│                                                                       │
│                                          [Continuer →]                │
└──────────────────────────────────────────────────────────────────────┘
```

## 3.7 Étape 5 — Publication

```
┌──────────────────────────────────────────────────────────────────────┐
│ Nouvelle offre (5/5) - Publication                                     │
├──────────────────────────────────────────────────────────────────────┤
│ APERÇU FINAL                                                          │
│  [📄 Aperçu candidat]                                                  │
│                                                                       │
│ DATE DE PUBLICATION                                                   │
│  ● Immédiate                                                          │
│  ○ Programmée : [📅]                                                  │
│                                                                       │
│ DATE D'EXPIRATION                                                     │
│  ● Auto (60 jours après publication)                                  │
│  ○ Personnalisée : [📅]                                                │
│                                                                       │
│ DIFFUSION (sera détaillée dans onglet Sourcing)                       │
│  ☑ Site carrière interne                                              │
│  ☑ LinkedIn                                                           │
│  ☑ Indeed                                                             │
│  ☑ Cooptation interne (activée)                                       │
│  ☐ Jobboards locaux (à activer dans Sourcing)                          │
│                                                                       │
│ VALIDATION FINALE                                                     │
│  ✅ Validation juridique reçue (Maître KOUASSI, 03/06)                 │
│  ⏳ Validation marketing (Responsable communication)                   │
│  ⏳ Validation finale Resp. recrutement                                │
│                                                                       │
│ [Soumettre pour validation finale]                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 4. WORKFLOW DE VALIDATION

## 4.1 Étapes

```
[draft]
   ↓ (rédaction terminée)
[pending_legal]   → Juriste valide non-discrimination
   ↓
[pending_marketing]  → Resp. communication valide branding (option)
   ↓
[pending_final]   → Responsable recrutement valide tout
   ↓
[validated]
   ↓ (publication)
[published]
   ↓ (durée vie)
[expired] OU [paused] OU [closed]
```

## 4.2 Validations en parallèle

Légale et marketing peuvent être en parallèle (gain de temps).

## 4.3 Allégement pour offres récurrentes

Si une offre est une **réutilisation à l'identique** d'une offre déjà validée légalement, validation juridique allégée (vérification rapide).

---

# 5. MULTILINGUE

## 5.1 Versions linguistiques

Une offre peut avoir plusieurs versions :
- Version primary (langue principale).
- Versions secondaires (traductions).

## 5.2 Workflow traduction

```
Offre publiée en français
   ↓
Demande traduction anglais
   ↓
Génération automatique brouillon (PROPH3T)
   ↓
Validation par traducteur professionnel (option externe)
   ↓
Publication version EN
```

## 5.3 Affichage candidat

Sur le site carrière, l'offre s'affiche dans la langue du navigateur ou choix utilisateur.

---

# 6. APERÇU CANDIDAT

L'aperçu candidat affiche l'offre **exactement comme elle apparaîtra sur le site carrière** :

```
┌──────────────────────────────────────────────────────────────────────┐
│ APERÇU CANDIDAT                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ [Header CRMC avec logo]                                                │
│                                                                       │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ CHEF DE PROJET COMMERCIAL H/F                                  │   │
│ │ CRMC SA · Cosmos Yopougon · CDI · 800K-1,1M FCFA                │   │
│ │ Publié le 05/06/2026 · Réf. OFR-2026-0245                        │   │
│ │                                                                │   │
│ │ [🎯 Postuler] [💾 Sauvegarder]                                  │   │
│ │                                                                │   │
│ │ Rejoignez CRMC, leader du retail en Côte d'Ivoire...           │   │
│ │                                                                │   │
│ │ NOTRE ENTREPRISE                                                │   │
│ │ ...                                                            │   │
│ │                                                                │   │
│ │ VOS MISSIONS                                                    │   │
│ │ • Piloter les projets commerciaux stratégiques                  │   │
│ │ • Animer et coordonner l'équipe commerciale                     │   │
│ │ ...                                                            │   │
│ │                                                                │   │
│ │ VOTRE PROFIL                                                    │   │
│ │ ...                                                            │   │
│ │                                                                │   │
│ │ CE QUE NOUS OFFRONS                                             │   │
│ │ ...                                                            │   │
│ │                                                                │   │
│ │ PROCESSUS                                                       │   │
│ │ ...                                                            │   │
│ │                                                                │   │
│ │ Engagement diversité & inclusion                                │   │
│ │ ...                                                            │   │
│ │                                                                │   │
│ │ [🎯 Postuler maintenant]                                        │   │
│ └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 7. GESTION CYCLE DE VIE

## 7.1 États

- **Draft** : en rédaction.
- **Pending validation** : en cours de validation.
- **Validated** : validée, prête à publier.
- **Published** : publique, recevant des candidatures.
- **Paused** : temporairement suspendue (volume trop important, congés équipe).
- **Closed (filled)** : poste pourvu.
- **Closed (cancelled)** : annulée.
- **Closed (expired)** : expirée sans recrutement.

## 7.2 Actions par état

| État | Actions possibles |
|------|-------------------|
| Draft | Éditer, soumettre validation, supprimer |
| Pending | (Validation en cours, attente actions validateurs) |
| Validated | Publier, modifier (retour draft), archiver |
| Published | Pauser, fermer, modifier (création nouvelle version) |
| Paused | Reprendre, fermer |
| Closed | Archiver, dupliquer (pour nouvel essai) |

## 7.3 Modification d'offre publiée

Modifier une offre déjà publiée est **risqué** (incohérence avec candidats déjà postulés). Workflow :
- Modification mineure (correction typo) : autorisée.
- Modification majeure (changement missions, salaire) : crée **nouvelle version** + redirection vers nouvelle URL.
- Information aux candidats déjà postulés.

---

# 8. DUPLICATION D'OFFRE

Fonctionnalité utile pour **rechercher plusieurs profils similaires** :
- Bouton "Dupliquer".
- Crée nouvelle offre avec contenu identique.
- Nouveau besoin associé (différent).
- Permet variations (ex. publication région différente).

---

# 9. AUDIT

Toutes opérations tracées :
- Création, modification, validation, publication, modification post-publication.
- Acteurs.
- Hash SHA-256.

---

# 10. APIS

```
GET  /hr/recrutement/offres?filters=
GET  /hr/recrutement/offres/{offreId}
POST /hr/recrutement/offres
PATCH /hr/recrutement/offres/{offreId}
POST /hr/recrutement/offres/{offreId}/submit-legal
POST /hr/recrutement/offres/{offreId}/validate-legal
POST /hr/recrutement/offres/{offreId}/submit-marketing
POST /hr/recrutement/offres/{offreId}/validate-marketing
POST /hr/recrutement/offres/{offreId}/validate-final
POST /hr/recrutement/offres/{offreId}/publish
POST /hr/recrutement/offres/{offreId}/pause
POST /hr/recrutement/offres/{offreId}/close
POST /hr/recrutement/offres/{offreId}/duplicate
GET  /hr/recrutement/offres/{offreId}/preview
GET  /hr/recrutement/offres/{offreId}/versions

POST /hr/recrutement/offres/{offreId}/improve-with-proph3t
POST /hr/recrutement/offres/{offreId}/translate (PROPH3T)

GET  /hr/recrutement/offres/modeles
POST /hr/recrutement/offres/modeles/{modeleId}/instantiate
```

---

# 11. TABLES IMPLIQUÉES

### Nouvelles
- `job_offers` (offres)
- `job_offer_versions`
- `job_offer_translations`
- `job_offer_templates`
- `job_offer_template_versions`
- `job_offer_validations` (workflow)
- `job_offer_audit_log`

---

# 12. SYNTHÈSE

**Offres d'emploi** :
- Face publique du besoin de recrutement.
- Bibliothèque de **~30 modèles standards** par famille métier.
- Wizard 5 étapes (choix modèle → rédaction → SEO → validation → publication).
- Assistance **PROPH3T** : reformulation, détection biais, SEO.
- Multilingue (FR/EN/bilingue) avec traduction assistée.
- Workflow validation Juridique + Marketing + Final.
- Cycle de vie complet avec gestion versions.

**Règles dures** :
- Validation juridique obligatoire avant publication.
- Mention H/F obligatoire dans titre.
- Engagement diversité obligatoire.
- Détection automatique biais.
- Conformité RGPD systématique.
- Audit chaîné.

---

*Fin spécification 03 — Offres d'emploi.*
