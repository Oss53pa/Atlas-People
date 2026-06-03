# M5 RECRUTEMENT — SOURCING & DIFFUSION
## Multiposting, jobboards, réseaux sociaux, chasse, performance par canal
*God mode premium. Référence : 01_FONDATION.md, 03_OFFRES_EMPLOI.md.*

---

# 0. POSITIONNEMENT

Une fois l'offre validée et publiée, il faut la **diffuser** pour qu'elle atteigne les candidats cibles. Cette section couvre :
- **Multiposting** sur jobboards et plateformes.
- **Sourcing actif** (chasse sur LinkedIn, bases CV).
- **Diffusion réseaux sociaux**.
- **Cooptation interne** activation (détail dans doc 12).
- **Mesure de performance** par canal (ROI sourcing).

## 0.1 Routes

- `/hr/recrutement/offres/{offreId}/diffusion` → Gestion diffusion d'une offre
- `/hr/recrutement/sourcing` → Centre de sourcing global
- `/hr/recrutement/sourcing/canaux` → Configuration canaux
- `/hr/recrutement/sourcing/performance` → ROI par canal
- `/hr/recrutement/sourcing/chasse` → Outils chasse directe

---

# 1. CANAUX DE DIFFUSION SUPPORTÉS

## 1.1 Catégories

### Site carrière (interne)
- Site dédié tenant : `recrutement.{tenant_slug}.atlas-people.com`
- Personnalisable (branding, contenu).
- Toutes les offres publiques y sont automatiquement publiées.
- SEO optimisé.

### Jobboards internationaux
- **LinkedIn Jobs** (organique + sponsored)
- **Indeed** (organique + sponsored)
- **Glassdoor** (organique + sponsored)
- **Welcome to the Jungle** (option)
- **Monster** (option)

### Jobboards africains francophones
- **Novojob** (Sénégal, CI, autres)
- **JobAfrique** (panafricain)
- **EmploisDakar** (Sénégal)
- **NotreJob.ci** (Côte d'Ivoire)
- **Emploi.cm** (Cameroun)
- **GabonJob** (Gabon)
- Autres selon pays

### Réseaux sociaux
- **LinkedIn** (post organique sur page entreprise)
- **Facebook** (post organique + ads)
- **Twitter/X** (post organique)
- **Instagram** (post si pertinent, ex. postes créatifs)

### Cooptation interne
- Diffusion via portail collaborateur.
- Notifications ciblées (selon profils recherchés).
- Lien doc 12.

### Cabinets de recrutement (externes)
- Brief de cabinet partenaire.
- Suivi des CVs envoyés par le cabinet.
- Gestion honoraires.

### Sourcing direct (chasse)
- Recherche LinkedIn Recruiter.
- Bases CV achetées (Monster CV Search, etc.).
- Bases internes (anciens candidats).
- Approche par message direct.

## 1.2 Modèle de données

```sql
CREATE TABLE diffusion_channels (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Identification
  code TEXT NOT NULL,         -- 'linkedin', 'indeed', 'novojob', etc.
  category TEXT NOT NULL,     -- 'jobboard', 'social', 'agency', 'direct'
  display_name TEXT NOT NULL,
  
  -- Configuration
  api_credentials JSONB,      -- chiffré
  default_settings JSONB,
  
  -- Coûts
  pricing_model TEXT,         -- 'free', 'pay_per_post', 'subscription', 'cpc'
  base_cost INT,
  cost_currency TEXT,
  
  -- État
  active BOOLEAN,
  
  -- Performance historique
  total_posts INT DEFAULT 0,
  total_candidates_received INT DEFAULT 0,
  total_hires INT DEFAULT 0,
  avg_cost_per_hire INT
);

CREATE TABLE job_offer_diffusions (
  id UUID PRIMARY KEY,
  job_offer_id UUID NOT NULL REFERENCES job_offers(id),
  channel_id UUID NOT NULL REFERENCES diffusion_channels(id),
  
  -- État
  status TEXT,                -- 'pending', 'posted', 'active', 'expired', 'closed'
  posted_at TIMESTAMPTZ,
  external_url TEXT,          -- URL sur le canal externe
  external_reference TEXT,
  expires_at TIMESTAMPTZ,
  
  -- Coût
  cost INT,
  cost_currency TEXT,
  
  -- Performance
  views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  applications_received INT DEFAULT 0,
  hires_made INT DEFAULT 0,
  
  -- Audit
  posted_by UUID,
  audit_log JSONB
);
```

---

# 2. MULTIPOSTING

## 2.1 Interface

```
┌──────────────────────────────────────────────────────────────────────┐
│ Diffusion - Offre OFR-2026-0245 Chef de Projet Commercial             │
├──────────────────────────────────────────────────────────────────────┤
│ STATUT GLOBAL                                                         │
│  ● Publiée le 05/06/2026                                              │
│  Expire le : 05/08/2026 (J-30)                                        │
│  Vues cumulées : 1 247                                                │
│  Candidatures reçues : 38                                             │
├──────────────────────────────────────────────────────────────────────┤
│ CANAUX ACTIFS (3)                                                     │
│                                                                       │
│ Canal              │ État         │ Vues  │ Candid. │ Coût            │
│ ─────────────────  │ ──────────── │ ───── │ ─────── │ ─────────────── │
│ Site carrière      │ ● Actif      │  823  │   18    │ Gratuit         │
│ LinkedIn Jobs      │ ● Sponsored  │  290  │   12    │ 150K (5j rest.) │
│ Indeed             │ ● Actif      │  134  │    8    │ 80K (15j rest.) │
├──────────────────────────────────────────────────────────────────────┤
│ AJOUTER UN CANAL                                                      │
│  ☐ Glassdoor (sponsored, 100K FCFA / 30j)                              │
│  ☐ Welcome to the Jungle (200K FCFA / 30j)                             │
│  ☐ Novojob (CI) - 50K FCFA / 30j                                       │
│  ☐ NotreJob.ci - Gratuit                                              │
│  ☐ Post LinkedIn page CRMC (organique)                                 │
│  ☐ Post Facebook page CRMC (organique)                                 │
│  ☐ Brief cabinet recrutement                                          │
│  ☐ Activer cooptation interne                                          │
│                                                                       │
│  Sélectionner et [Diffuser]                                           │
├──────────────────────────────────────────────────────────────────────┤
│ ACTIONS                                                               │
│  [📊 Voir performance détaillée] [⏸ Pauser tout]                        │
│  [✏ Modifier diffusions] [🔄 Renouveler expirés]                      │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.2 Wizard ajout canal

```
┌──────────────────────────────────────────────────────────────────────┐
│ Ajouter diffusion - Canal LinkedIn Jobs                                │
├──────────────────────────────────────────────────────────────────────┤
│ CONFIGURATION                                                         │
│  Type d'annonce :                                                     │
│  ○ Gratuite (organique sur page CRMC) - 0 FCFA                         │
│  ● Sponsored (mise en avant payante)                                  │
│    Durée : [30 jours ▾]                                                │
│    Budget : [200 000] FCFA                                            │
│    Ciblage géographique : Abidjan + 50km                              │
│    Ciblage compétences : Commerce, Management de projet                │
│                                                                       │
│ ESTIMATION PERFORMANCE                                                │
│  Vues estimées : 400-600                                              │
│  Candidatures estimées : 15-25                                        │
│  Coût par candidature : 8-13K FCFA                                     │
│                                                                       │
│ MAPPING CONTENU                                                       │
│  Titre LinkedIn : Chef de Projet Commercial H/F                        │
│  ✅ Description envoyée                                                │
│  ✅ Critères de profil envoyés                                        │
│  ✅ Lien de candidature : direct vers ATS                             │
│                                                                       │
│ VALIDATION FINANCIÈRE                                                 │
│  Coût : 200K FCFA                                                     │
│  Validation requise : Resp. recrutement (< 500K = pas DAF)             │
│                                                                       │
│ [Confirmer & publier]                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.3 API multiposting

```
POST /hr/recrutement/offres/{offreId}/diffusions
     body: { channel_id, settings }
GET  /hr/recrutement/offres/{offreId}/diffusions
PATCH /hr/recrutement/offres/{offreId}/diffusions/{diffId}
DELETE /hr/recrutement/offres/{offreId}/diffusions/{diffId}
POST /hr/recrutement/offres/{offreId}/diffusions/{diffId}/renew
GET  /hr/recrutement/offres/{offreId}/diffusions/{diffId}/stats
```

## 2.4 Synchronisation

Chaque canal a un connecteur dédié (Edge Function) qui :
- Publie l'offre via API du jobboard.
- Récupère les statistiques (vues, clics) périodiquement (cron horaire).
- Récupère les candidatures reçues sur le jobboard.
- Met à jour le statut (actif, expiré).

---

# 3. SOURCING DIRECT (chasse)

## 3.1 Workflow

```
[Identifier profil cible]
   ↓
Recherche sur sources :
  • LinkedIn Recruiter (recherche booleanne)
  • Bases CV externes (Monster, etc.)
  • Bases internes (anciens candidats, viviers)
  • Référencement réseau (cooptation passive)
   ↓
Constitution liste cible (50-100 profils)
   ↓
Qualification rapide (10-15 profils gardés)
   ↓
Approche directe (messages personnalisés)
   ↓
Suivi réponses + déclenchement processus si intéressé
```

## 3.2 Outil chasse intégré

```
┌──────────────────────────────────────────────────────────────────────┐
│ Chasse - Offre OFR-2026-0245                                          │
├──────────────────────────────────────────────────────────────────────┤
│ RECHERCHE BOOLEANNE                                                   │
│  Source : ● LinkedIn  ○ Monster  ○ Base interne                       │
│                                                                       │
│  Mots-clés : [(chef de projet OR project manager) AND commercial]      │
│  Localisation : [Abidjan, Côte d'Ivoire]                              │
│  Niveau : [Cadre confirmé]                                            │
│  Secteur : [Distribution, Retail, Commerce]                            │
│  Compétences : [CRM, négociation, management]                          │
│                                                                       │
│  [Lancer recherche]                                                   │
├──────────────────────────────────────────────────────────────────────┤
│ RÉSULTATS (47 profils)                                                │
│                                                                       │
│ Profil               │ Match │ Statut sourcing │ Action               │
│ ──────────────────── │ ───── │ ─────────────── │ ──────────────────  │
│ Profil Anonyme #1   │ 92%   │ Non contacté    │ [Approcher]          │
│ Profil Anonyme #2   │ 88%   │ Non contacté    │ [Approcher]          │
│ Profil Anonyme #3   │ 85%   │ Contacté J-5    │ [Voir échange]       │
│ Profil Anonyme #4   │ 83%   │ Réponse positive│ [Convertir candidat] │
│ ...                                                                   │
├──────────────────────────────────────────────────────────────────────┤
│ TEMPLATES MESSAGES APPROCHE                                           │
│  [▾ Template "Approche cadre commercial confirmé"]                     │
│  [Personnaliser et envoyer en lot]                                    │
└──────────────────────────────────────────────────────────────────────┘
```

## 3.3 Confidentialité chasse

Les chasses sont souvent **confidentielles** (offre `visibility: confidential`) :
- Pas publiée publiquement.
- Approche directe uniquement.
- Données sensibles (rémunérations cibles) protégées.

---

# 4. CABINETS DE RECRUTEMENT

## 4.1 Gestion brief cabinet

Pour les profils difficiles, externalisation possible :

```
┌──────────────────────────────────────────────────────────────────────┐
│ Brief cabinet - Offre OFR-2026-0245                                   │
├──────────────────────────────────────────────────────────────────────┤
│ CABINET PARTENAIRE                                                    │
│  [Cabinet ABC Recrutement ▾]                                          │
│  Contact : M. KOUASSI                                                 │
│  Honoraires : 20% du brut annuel (~3,2M FCFA estimé)                   │
│                                                                       │
│ BRIEF                                                                  │
│  Type : ○ Recherche par approche directe (chasse)                     │
│         ● Sourcing actif sur jobboards spécialisés                    │
│         ○ Mix                                                         │
│                                                                       │
│  Engagement résultat : ☑ Présentation 3 profils minimum sous 30j      │
│  Exclusivité : ☑ Aucune autre cabinet                                 │
│                                                                       │
│ DOCUMENTS                                                             │
│  ✅ Offre détaillée envoyée                                            │
│  ✅ Convention cabinet signée                                          │
│                                                                       │
│ SUIVI                                                                  │
│  Profils présentés : 0 / 3                                            │
│  Délai engagé : J+22 / J+30                                            │
│  Statut : ⏳ En cours                                                 │
│                                                                       │
│ [Voir profils envoyés] [Relancer cabinet]                             │
└──────────────────────────────────────────────────────────────────────┘
```

## 4.2 Workflow cabinet

```
[Brief envoyé]
   ↓
Cabinet sourcing (chez lui)
   ↓
Cabinet envoie CVs candidats (via plateforme ou email)
   ↓
Import dans ATS avec source = "Cabinet ABC"
   ↓
Suivi pipeline normal
   ↓
Si embauche : honoraires versés cabinet (workflow paiement)
```

---

# 5. RÉSEAUX SOCIAUX

## 5.1 Publication automatique

Connecteurs vers :
- LinkedIn (post organique).
- Facebook (post organique + ads).
- Twitter/X.
- Instagram (postes créatifs).

## 5.2 Template post social

```
[Image bannière offre]

🎯 NOUS RECRUTONS !

Chef de Projet Commercial H/F
📍 Cosmos Yopougon, Abidjan
💼 CDI
💰 800K-1,1M FCFA brut

Pilotez les projets commerciaux stratégiques de CRMC, leader du retail en Côte d'Ivoire.

✅ 5 ans d'expérience minimum
✅ Bac+5 (Commerce, Management)
✅ Maîtrise CRM + analyse financière

🔗 Postulez : [lien direct ATS]

#Recrutement #Abidjan #CommerceRetail #CRMC #JobAbidjan
```

Génération automatique via PROPH3T (avec validation marketing).

## 5.3 Performance réseaux sociaux

KPI suivis :
- Reach (portée).
- Engagement (likes, shares, commentaires).
- Clics vers offre.
- Candidatures résultantes.

---

# 6. PERFORMANCE PAR CANAL — ROI

## 6.1 Dashboard performance

```
┌──────────────────────────────────────────────────────────────────────┐
│ Performance canaux - Année 2026 (cumul YTD)                           │
├──────────────────────────────────────────────────────────────────────┤
│ Canal              │ Coût  │ Cand. │ Hire │ CPC    │ CPH        │ ROI  │
│ ─────────────────  │ ───── │ ───── │ ──── │ ────── │ ────────── │ ──── │
│ Site carrière      │ 0     │  245  │  18  │ 0      │ 0          │ ∞    │
│ LinkedIn Jobs      │ 2,4M  │  185  │  12  │ 13K    │ 200K       │ ⭐⭐⭐│
│ Indeed             │ 800K  │   95  │   5  │ 8K     │ 160K       │ ⭐⭐⭐│
│ Cooptation         │ 1,2M  │   42  │   8  │ 28K    │ 150K       │ ⭐⭐⭐⭐│
│ Glassdoor          │ 600K  │   38  │   2  │ 16K    │ 300K       │ ⭐⭐  │
│ Novojob            │ 200K  │   72  │   4  │ 3K     │ 50K        │ ⭐⭐⭐⭐⭐│
│ Cabinet ABC        │ 8,5M  │   12  │   3  │ 708K   │ 2,8M       │ ⭐   │
│ Chasse interne     │ 0     │   18  │   4  │ 0      │ 0          │ ∞    │
│                                                                       │
│ TOTAL              │ 13,7M │  707  │  56  │ 19K    │ 245K       │      │
├──────────────────────────────────────────────────────────────────────┤
│ INSIGHTS                                                              │
│  ✅ Cooptation : meilleur ROI sur coût qualité                         │
│  ✅ Novojob : excellent CPH pour le marché local                       │
│  ⚠ Cabinet ABC : CPH élevé, à challenger sur résultats                 │
│  💡 Augmenter budget Cooptation et Novojob                             │
└──────────────────────────────────────────────────────────────────────┘
```

## 6.2 KPI clés

| KPI | Définition | Cible |
|-----|-----------|-------|
| **CPC** (Coût Par Candidature) | Coût canal / Candidatures reçues | < 20K FCFA |
| **CPH** (Coût Par Hire) | Coût canal / Embauches | < 300K FCFA |
| **Conversion rate** | Hires / Candidatures par canal | > 5% |
| **Quality score** | Note qualité moyenne candidats par canal | > 3/5 |

## 6.3 Optimisation budgétaire

Suggestions automatiques (PROPH3T) :
- Augmenter budget canaux performants.
- Réduire/arrêter canaux faibles.
- Tester nouveaux canaux.

---

# 7. EXPIRATION ET RENOUVELLEMENT

## 7.1 Surveillance expiration

Alertes automatiques :
- J-7 avant expiration.
- J-3 avant expiration.
- À expiration.

## 7.2 Workflow renouvellement

```
[Offre approche expiration]
   ↓
Notification Recruteur + Resp. recrutement
   ↓
Décision :
  • Pas de candidat valide → Renouveler diffusion
  • Bonne shortlist → Laisser expirer
  • Poste pourvu → Fermer offre + retirer toutes diffusions
   ↓
Si renouvellement :
  • Coût supplémentaire (selon canal)
  • Validation budgétaire (si > 500K cumulé)
   ↓
Republication automatique
```

---

# 8. VIVIERS DE CANDIDATS

## 8.1 Concept

Au-delà des offres ponctuelles, l'entreprise constitue des **viviers** de candidats qualifiés sur des profils récurrents :
- Vivier "Commerciaux confirmés".
- Vivier "Comptables".
- Vivier "Talents direction" (succession).

## 8.2 Gestion

```
[Identifier candidats intéressants]
   ↓
Ajout au vivier (avec consentement RGPD)
   ↓
Suivi périodique (newsletter, événements)
   ↓
Réactivation lors d'opportunité
```

## 8.3 Cible

Réduire le time-to-hire en activant un vivier qualifié plutôt qu'en démarrant de zéro.

---

# 9. CONFORMITÉ DIFFUSION

## 9.1 Contrôles

Avant publication sur canal externe :
- Vérification que l'offre est validée légalement.
- Vérification que le contenu envoyé respecte les CGV du canal.
- Vérification budgétaire (si payant).
- Conservation logs (traçabilité réglementaire).

## 9.2 Anti-discrimination

Détection si offre adaptée différemment selon canal (ex. version "homme" sur jobboard X, version "femme" sur jobboard Y → interdit).

---

# 10. APIS DIFFUSION

```
GET  /hr/recrutement/sourcing/canaux
PATCH /hr/recrutement/sourcing/canaux/{channelId}
POST /hr/recrutement/sourcing/canaux/{channelId}/configure-api

POST /hr/recrutement/offres/{offreId}/diffusions
GET  /hr/recrutement/offres/{offreId}/diffusions
PATCH /hr/recrutement/offres/{offreId}/diffusions/{diffId}
DELETE /hr/recrutement/offres/{offreId}/diffusions/{diffId}
POST /hr/recrutement/offres/{offreId}/diffusions/{diffId}/renew

POST /hr/recrutement/sourcing/chasse/search
POST /hr/recrutement/sourcing/chasse/approach
GET  /hr/recrutement/sourcing/chasse/templates

POST /hr/recrutement/sourcing/cabinet/brief
GET  /hr/recrutement/sourcing/cabinet/{cabinetId}/candidates

GET  /hr/recrutement/sourcing/performance?period=
GET  /hr/recrutement/sourcing/roi-by-channel
```

---

# 11. TABLES IMPLIQUÉES

### Nouvelles
- `diffusion_channels` (catalogue canaux)
- `job_offer_diffusions` (diffusions actives)
- `diffusion_external_logs` (logs APIs externes)
- `diffusion_performance_snapshots` (snapshots stats)
- `sourcing_searches` (recherches sauvegardées)
- `sourcing_approaches` (messages approche)
- `external_recruitment_agencies` (cabinets partenaires)
- `agency_briefs` (briefs cabinets)
- `agency_candidates_submitted` (candidats présentés par cabinets)
- `candidate_pools` (viviers)
- `candidate_pool_members`

---

# 12. SYNTHÈSE

**Sourcing & Diffusion** :
- Multiposting sur jobboards internationaux et africains (LinkedIn, Indeed, Novojob, etc.).
- Connecteurs API pour publication et récupération statistiques.
- Réseaux sociaux (LinkedIn, Facebook, etc.).
- Cooptation interne (lien doc 12).
- Cabinets de recrutement (brief, suivi, honoraires).
- Chasse directe (LinkedIn Recruiter, bases CV).
- Viviers de candidats qualifiés.
- Dashboard performance par canal avec ROI.

**Règles dures** :
- Validation budgétaire si coût total diffusion > 500K FCFA.
- Validation DAF si > 5M FCFA.
- Cohérence contenu sur tous canaux (anti-discrimination).
- Logs complets pour traçabilité.
- Respect CGV de chaque canal.

---

*Fin spécification 04 — Sourcing & diffusion.*
