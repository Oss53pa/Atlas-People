# M5 RECRUTEMENT — MARQUE EMPLOYEUR
## Site carrière personnalisable, contenu, attractivité, mesure
*God mode premium. Référence : 01_FONDATION.md, 03_OFFRES_EMPLOI.md.*

---

# 0. POSITIONNEMENT

La **marque employeur** est l'image projetée par l'entreprise auprès du marché du travail. Elle conditionne :
- L'**attractivité** pour les talents (volume et qualité candidatures).
- La **rétention** des collaborateurs en poste.
- La **différenciation** vs concurrents sur le marché de l'emploi.
- La **perception** globale (consommateurs aussi).

Atlas People fournit un **site carrière personnalisable** + outils de **gestion contenu** + **mesure attractivité**.

## 0.1 Routes

- `/hr/recrutement/marque-employeur` → Cockpit marque employeur
- `/hr/recrutement/marque-employeur/site` → Configuration site
- `/hr/recrutement/marque-employeur/contenu` → CMS contenu
- `/hr/recrutement/marque-employeur/analytics` → Analytics site
- `/career/{tenant_slug}` (front public) → Site carrière

---

# 1. SITE CARRIÈRE

## 1.1 URL et hébergement

Chaque tenant dispose d'un sous-domaine dédié :
```
https://recrutement.{tenant_slug}.atlas-people.com
```

Exemples :
- `https://recrutement.crmc.atlas-people.com`
- `https://recrutement.sogeca.atlas-people.com`

**Option Premium** : domaine personnalisé (`https://carrieres.crmc.ci`) avec configuration DNS tenant.

## 1.2 Structure type d'un site carrière

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                            │
│  Logo tenant | Notre entreprise | Offres | Notre vie | Espace cand│
├─────────────────────────────────────────────────────────────────┤
│ HOMEPAGE                                                          │
│  • Bannière vidéo / image                                         │
│  • Accroche : "Rejoignez CRMC, leader du retail africain"         │
│  • CTA principal : "Voir nos offres"                              │
│  • Compteur offres ouvertes                                       │
│  • Témoignages collaborateurs                                     │
│  • Carrousel équipes / sites                                      │
│  • Newsletter (alerte nouvelles offres)                           │
├─────────────────────────────────────────────────────────────────┤
│ NOTRE ENTREPRISE                                                  │
│  • Présentation activité                                          │
│  • Histoire                                                       │
│  • Valeurs                                                        │
│  • Chiffres clés                                                  │
│  • Implantations                                                  │
│  • RSE / engagements                                              │
├─────────────────────────────────────────────────────────────────┤
│ NOTRE VIE EN ENTREPRISE                                           │
│  • Culture                                                        │
│  • Avantages collaborateurs                                       │
│  • Formation & développement                                      │
│  • Diversité & inclusion                                          │
│  • Témoignages vidéo / photo                                      │
│  • Galerie photos                                                 │
├─────────────────────────────────────────────────────────────────┤
│ NOS MÉTIERS                                                       │
│  • Présentation par famille de métier                             │
│  • Témoignages par métier                                         │
│  • Parcours types                                                 │
├─────────────────────────────────────────────────────────────────┤
│ OFFRES D'EMPLOI                                                   │
│  • Filtres (lieu, contrat, type, fonction)                        │
│  • Liste paginée                                                  │
│  • Recherche par mots-clés                                        │
│  • Détail offre + bouton "Postuler"                               │
├─────────────────────────────────────────────────────────────────┤
│ CANDIDATURE SPONTANÉE                                             │
│  • Formulaire libre                                               │
│  • Vivier alimenté                                                │
├─────────────────────────────────────────────────────────────────┤
│ ESPACE CANDIDAT (auth)                                            │
│  • Mes candidatures                                               │
│  • Suivi statut                                                   │
│  • Profil candidat                                                │
│  • Documents                                                      │
│  • Droits RGPD                                                    │
├─────────────────────────────────────────────────────────────────┤
│ FAQ RECRUTEMENT                                                   │
├─────────────────────────────────────────────────────────────────┤
│ FOOTER                                                            │
│  • Contact RH                                                     │
│  • Mentions légales                                               │
│  • Politique RGPD                                                 │
│  • Réseaux sociaux                                                │
└─────────────────────────────────────────────────────────────────┘
```

## 1.3 Modèle de données

```sql
CREATE TABLE career_site_config (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL UNIQUE,
  
  -- URL
  subdomain TEXT,            -- 'crmc' donne 'crmc.atlas-people.com'
  custom_domain TEXT,        -- 'carrieres.crmc.ci' (premium)
  
  -- Branding
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  font_family TEXT,
  
  -- Configuration
  default_language TEXT,
  supported_languages TEXT[],
  
  -- Modules activés
  modules_enabled JSONB,     -- { home, about, life, jobs, spontaneous, faq, blog }
  
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,
  
  -- Réseaux sociaux
  linkedin_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  
  -- Métadonnées
  active BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ
);

CREATE TABLE career_site_pages (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  slug TEXT NOT NULL,        -- 'notre-entreprise', 'nos-metiers'
  title TEXT NOT NULL,
  meta_description TEXT,
  
  language TEXT NOT NULL,
  
  -- Contenu structuré (blocs)
  content_blocks JSONB,
  
  -- État
  status TEXT,               -- 'draft', 'published'
  published_at TIMESTAMPTZ,
  
  -- SEO
  seo_keywords TEXT[],
  
  -- Audit
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE TABLE career_site_testimonials (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  employee_name TEXT,
  employee_position TEXT,
  employee_photo_url TEXT,
  
  testimonial_text TEXT,
  testimonial_video_url TEXT,
  
  category TEXT,             -- 'culture', 'evolution', 'work_life', etc.
  
  -- Consentement employé
  employee_consent_given BOOLEAN,
  employee_consent_date DATE,
  
  active BOOLEAN,
  display_order INT
);
```

---

# 2. CMS CONTENU

## 2.1 Éditeur

Interface drag & drop pour composer les pages :

```
┌──────────────────────────────────────────────────────────────────────┐
│ Éditeur page "Notre vie en entreprise"                                │
├──────────────────────────────────────────────────────────────────────┤
│ BLOCS DISPONIBLES                                                     │
│  [📷 Image]  [🎬 Vidéo]  [📝 Texte]  [📊 KPI]  [👤 Témoignage]       │
│  [🎴 Carrousel]  [📋 Liste]  [💬 Citation]  [🌐 Réseaux]             │
├──────────────────────────────────────────────────────────────────────┤
│ STRUCTURE PAGE                                                        │
│                                                                       │
│ 1. [Bannière image - Photo équipe Cosmos]                              │
│    Modifier · Supprimer · ↑ Monter · ↓ Descendre                       │
│                                                                       │
│ 2. [Texte - "Une entreprise humaine, ambitieuse..."]                   │
│                                                                       │
│ 3. [KPI - "+ 500 collaborateurs", "92% satisfaction", "85% évolution"] │
│                                                                       │
│ 4. [Témoignage vidéo - Hadja TIMITÉ, DRH]                              │
│                                                                       │
│ 5. [Carrousel - Photos sites & équipes]                                │
│                                                                       │
│ 6. [Liste - Nos avantages : mutuelle, formation, tickets, etc.]        │
│                                                                       │
│ 7. [Citation - "Chez CRMC, on grandit ensemble" - Cheick DIALLO, DG]   │
│                                                                       │
│ 8. [Réseaux sociaux - liens LinkedIn, Facebook]                        │
│                                                                       │
│ + [Ajouter bloc]                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ MULTILINGUE                                                            │
│  Page actuelle : Français · [Voir version EN]                          │
│                                                                       │
│ [Sauvegarder draft] [Prévisualiser] [Publier]                          │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.2 Versions multilingues

Chaque page peut avoir plusieurs versions linguistiques.

PROPH3T peut **générer un brouillon traduction** automatique (validation humaine ensuite).

## 2.3 Workflow validation

```
[Page éditée] → [Draft] → [Soumis revue] → [Validé Marketing] → [Publié]
```

---

# 3. TÉMOIGNAGES COLLABORATEURS

## 3.1 Constitution

- Récolte de témoignages auprès de collaborateurs volontaires.
- Format texte ou vidéo (courte 1-2 min).
- Catégorisation (culture, évolution, équilibre, etc.).
- Consentement formel obligatoire.

## 3.2 Workflow

```
[RH identifie collaborateur intéressant]
   ↓
Sollicitation accord
   ↓
Si accord : production témoignage (texte ou vidéo)
   ↓
Validation collaborateur sur version finale
   ↓
Signature consentement RGPD (utilisation image, durée, périmètre)
   ↓
Publication site carrière
   ↓
Suivi de la durée du consentement (renouvellement possible)
```

## 3.3 Layout gestion

```
┌──────────────────────────────────────────────────────────────────────┐
│ Témoignages collaborateurs                                            │
├──────────────────────────────────────────────────────────────────────┤
│ Filtres : [Catégorie ▾] [Statut ▾] [Format ▾]                          │
├──────────────────────────────────────────────────────────────────────┤
│ Collab.            │ Catégorie    │ Format │ Consent. │ Statut       │
│ ────────────────── │ ──────────── │ ────── │ ──────── │ ──────────── │
│ Hadja TIMITÉ       │ Évolution    │ Vidéo  │ ✅ Valide│ ✅ Publié    │
│ Marie SAMAKÉ       │ Culture      │ Texte  │ ✅ Valide│ ✅ Publié    │
│ Ibrahim AKA        │ Équilibre    │ Vidéo  │ ⏳ Expiré│ ⚠ À renouv.  │
│ Aïssa DIA          │ Formation    │ Texte  │ ✅ Valide│ ⏳ En attente│
└──────────────────────────────────────────────────────────────────────┘
```

---

# 4. AVANTAGES PROPOSÉS

Section dédiée du site carrière listant les **avantages employeur** :

```
┌─────────────────────────────────────────────────────────────────┐
│ NOS AVANTAGES COLLABORATEURS                                      │
│                                                                  │
│ 💰 RÉMUNÉRATION                                                  │
│  • Salaires compétitifs et révisés annuellement                  │
│  • 13e mois                                                      │
│  • Variable / primes selon performance                           │
│  • Participation aux résultats                                   │
│                                                                  │
│ 🏥 SANTÉ & PRÉVOYANCE                                            │
│  • Mutuelle premium pour vous + famille                          │
│  • Médecine du travail proactive                                 │
│  • Programme bien-être                                           │
│                                                                  │
│ ⏰ ÉQUILIBRE VIE PRO/PERSO                                       │
│  • Télétravail 2 jours/semaine                                   │
│  • Horaires flexibles                                            │
│  • Congés pour événements familiaux                              │
│                                                                  │
│ 🎓 FORMATION & ÉVOLUTION                                         │
│  • Plan formation personnalisé                                   │
│  • Mobilité interne encouragée                                   │
│  • Mentorat                                                      │
│  • Conférences sectorielles                                      │
│                                                                  │
│ 🏢 ENVIRONNEMENT                                                 │
│  • Bureaux modernes et conviviaux                                │
│  • Restauration sur site                                         │
│  • Espaces détente                                               │
│  • Événements d'équipe                                           │
│                                                                  │
│ 🌍 RSE                                                           │
│  • Engagement environnemental                                    │
│  • Mécénat et bénévolat                                          │
│  • Égalité H/F                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

# 5. ANALYTICS SITE CARRIÈRE

## 5.1 KPI suivis

| KPI | Définition |
|-----|-----------|
| **Trafic total** | Nombre de visiteurs uniques |
| **Pages vues** | Pages consultées (total et par page) |
| **Temps moyen** | Durée moyenne par session |
| **Taux rebond** | % visiteurs partant après 1 page |
| **Sources trafic** | Organique, direct, social, référent |
| **Vues par offre** | Volume vues sur chaque offre |
| **Conversion candidature** | Vues offre → Candidatures déposées |
| **Origine candidatures** | Site carrière vs jobboards externes |
| **Newsletter abonnés** | Volume abonnés alertes offres |
| **Géolocalisation** | Pays/villes des visiteurs |

## 5.2 Dashboard

```
┌──────────────────────────────────────────────────────────────────────┐
│ Analytics Site Carrière - Mai 2026                                    │
├──────────────────────────────────────────────────────────────────────┤
│ Visiteurs uniques : 8 452 (+12% vs mois préc.)                         │
│ Pages vues : 24 137 (avg 2,9 pages/session)                            │
│ Durée moyenne session : 2'45                                           │
│ Taux rebond : 38% (bon, < 50%)                                         │
├──────────────────────────────────────────────────────────────────────┤
│ SOURCES TRAFIC                                                        │
│  Organique (SEO) : 4 250 (50%)                                         │
│  Direct : 1 690 (20%)                                                  │
│  Réseaux sociaux : 1 380 (16%)                                         │
│   - LinkedIn : 820                                                     │
│   - Facebook : 360                                                     │
│   - Instagram : 200                                                    │
│  Jobboards : 850 (10%)                                                 │
│  Référents : 280 (3%)                                                  │
│  Email : 102 (1%)                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ OFFRES LES PLUS VUES                                                  │
│  1. Chef Projet Commercial - 823 vues - 18 candidatures (CR 2,2%)      │
│  2. Comptable Senior - 645 vues - 12 candidatures (1,9%)               │
│  3. Resp Maintenance Angré - 524 vues - 9 candidatures (1,7%)          │
│  ...                                                                  │
├──────────────────────────────────────────────────────────────────────┤
│ CONVERSION GLOBALE                                                    │
│  Vues offres : 4 200                                                  │
│  Candidatures déposées : 89                                            │
│  Taux conversion : 2,1% (vs moyenne secteur 1,5% ✅)                   │
└──────────────────────────────────────────────────────────────────────┘
```

## 5.3 Sources analytics

- Google Analytics 4 (intégration ID configurable).
- Facebook Pixel (option).
- Tracking interne Atlas People.

---

# 6. NEWSLETTER / ALERTES

## 6.1 Inscription

Visiteurs site carrière peuvent s'inscrire pour recevoir :
- Notifications nouvelles offres correspondant à leur profil.
- Newsletter mensuelle (vie entreprise, témoignages, etc.).

## 6.2 Préférences

- Filtres : famille de métier, lieu, type contrat.
- Fréquence : immédiat / hebdo / mensuel.
- Désinscription facile (1 clic, conforme RGPD).

## 6.3 Workflow

Nouvelle offre publiée matchant profil abonné → envoi email automatique.

---

# 7. MOTEUR DE RECHERCHE OFFRES

## 7.1 Filtres avancés

```
┌─────────────────────────────────────────────────────────────────┐
│ Rechercher une offre                                              │
│                                                                  │
│ Mots-clés : [_______________________]                            │
│                                                                  │
│ Lieu : [Tous ▾]                                                  │
│  ☑ Abidjan / Yopougon                                             │
│  ☑ Abidjan / Angré                                                │
│  ☐ Dakar                                                         │
│  ☐ Bamako                                                        │
│                                                                  │
│ Type de contrat : [Tous ▾]                                       │
│  ☑ CDI                                                           │
│  ☐ CDD                                                           │
│  ☐ Stage                                                         │
│  ☐ Alternance                                                    │
│                                                                  │
│ Famille de métier : [Toutes ▾]                                   │
│  ☑ Commercial                                                    │
│  ☐ Finance                                                       │
│  ...                                                            │
│                                                                  │
│ Expérience : [Tous niveaux ▾]                                    │
│ Télétravail : [Indifférent ▾]                                    │
│                                                                  │
│ [🔍 Rechercher]                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 7.2 SEO offres

Chaque page offre est **SEO-optimisée** :
- URL friendly (slug descriptif).
- Métadonnées title/description.
- Microdata Google Jobs (rich results).
- Sitemap.xml auto-généré.

---

# 8. INTÉGRATION RÉSEAUX SOCIAUX

## 8.1 Partage offres

Boutons partage sur chaque offre :
- LinkedIn.
- Facebook.
- WhatsApp.
- Email.

## 8.2 Affichage offres dans posts sociaux

Quand offre publiée → auto-création post LinkedIn page entreprise (option).

---

# 9. APIS MARQUE EMPLOYEUR

```
GET  /hr/recrutement/marque-employeur/site/config
PATCH /hr/recrutement/marque-employeur/site/config
POST /hr/recrutement/marque-employeur/site/publish

GET  /hr/recrutement/marque-employeur/pages
POST /hr/recrutement/marque-employeur/pages
PATCH /hr/recrutement/marque-employeur/pages/{pageId}
POST /hr/recrutement/marque-employeur/pages/{pageId}/publish

GET  /hr/recrutement/marque-employeur/temoignages
POST /hr/recrutement/marque-employeur/temoignages
POST /hr/recrutement/marque-employeur/temoignages/{tId}/request-consent
POST /hr/recrutement/marque-employeur/temoignages/{tId}/publish

GET  /hr/recrutement/marque-employeur/analytics?period=
GET  /hr/recrutement/marque-employeur/analytics/offres
GET  /hr/recrutement/marque-employeur/analytics/conversion

GET  /career/{tenant_slug}/api/offres (public)
GET  /career/{tenant_slug}/api/offres/{slug} (public)
POST /career/{tenant_slug}/api/candidater/{slug} (public)
POST /career/{tenant_slug}/api/newsletter/subscribe (public)
```

---

# 10. TABLES IMPLIQUÉES

### Nouvelles
- `career_site_config`
- `career_site_pages`
- `career_site_pages_versions`
- `career_site_pages_translations`
- `career_site_testimonials`
- `career_site_testimonial_consents`
- `career_site_analytics_snapshots`
- `career_site_newsletter_subscribers`
- `career_site_newsletter_sent`

---

# 11. SYNTHÈSE

**Marque employeur** :
- Site carrière personnalisable par tenant (sous-domaine + option custom).
- CMS contenu drag & drop avec blocs réutilisables.
- Multilingue avec aide PROPH3T.
- Témoignages collaborateurs avec gestion consentement.
- Avantages employeur structurés.
- Analytics complets (trafic, conversion, sources).
- Newsletter alertes offres.
- SEO optimisé (microdata Google Jobs).
- Intégration réseaux sociaux.

**Règles dures** :
- Consentement explicite pour tout témoignage (renouvelable).
- Aucune photo/vidéo collaborateur sans accord écrit.
- Pages validées Marketing avant publication.
- RGPD compliant (analytics, newsletter, désinscription).
- Audit chaîné.

---

*Fin spécification 13 — Marque employeur.*
