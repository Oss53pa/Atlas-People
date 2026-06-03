# M5 RECRUTEMENT — CONFORMITÉ RGPD & NON-DISCRIMINATION
## Consentements, conservation, droits candidats, audit conformité
*God mode premium. Référence : 01_FONDATION.md, 05_CANDIDATURES.md, 06_EVALUATION_SCORING.md.*

---

# 0. POSITIONNEMENT

Le recrutement traite des **données personnelles sensibles** en grande quantité (CV, photos, évaluations, notes subjectives). La conformité **RGPD** et **non-discrimination OHADA** est donc **non négociable**.

Cette section couvre :
- **Consentements** explicites à chaque étape.
- **Durées de conservation** paramétrables avec anonymisation auto.
- **Droits candidats** (accès, rectification, suppression, portabilité).
- **Audit conformité** Juriste & DPO.
- **Non-discrimination** OHADA enforcée techniquement.
- **Transferts internationaux** de données (cas expatriés).

## 0.1 Cadre réglementaire

| Référence | Pays |
|-----------|------|
| Loi 2017-742 sur la protection des données personnelles | Côte d'Ivoire |
| Loi 2008-12 sur la protection des données | Sénégal |
| Loi 2009-09 sur la protection des données | Burkina Faso |
| Acte additionnel CEDEAO A/SA.1/01/10 | CEDEAO |
| Convention CEMAC sur cybersécurité | CEMAC |
| RGPD UE (transferts internationaux UE↔Afrique) | UE |
| Code Travail OHADA + nationaux | UEMOA/CEMAC |

## 0.2 Routes

- `/hr/recrutement/conformite/rgpd` → Cockpit RGPD
- `/hr/recrutement/conformite/consentements` → Suivi consentements
- `/hr/recrutement/conformite/demandes-droits` → Demandes candidats (accès, suppression)
- `/hr/recrutement/conformite/anonymisation` → Anonymisations programmées
- `/hr/recrutement/conformite/audit` → Audit conformité

---

# 1. CONSENTEMENTS

## 1.1 Consentements requis

| Action candidat | Consentement requis | Granularité |
|-----------------|---------------------|-------------|
| Dépôt de candidature | Traitement données candidature | Obligatoire |
| Photo CV | Conservation photo | Distinct |
| Inscription vivier | Conservation 2 ans + opportunités | Distinct |
| Tests psychométriques | Évaluation psychologique | Distinct |
| Vérification références | Contact tiers | Distinct |
| Webcam pendant test | Enregistrement image | Distinct |
| Newsletter alertes | Communications marketing | Distinct |
| Transfert données hors zone | Transfert international | Distinct |

## 1.2 Granularité

Chaque finalité a un consentement **séparé** :
- Refusable individuellement.
- Révocable à tout moment.
- Tracé avec horodatage + version conditions.

## 1.3 Formulaire consentement type

```
┌──────────────────────────────────────────────────────────────────────┐
│ Consentement RGPD - Candidature CRMC                                  │
├──────────────────────────────────────────────────────────────────────┤
│ ☑ J'autorise CRMC SA à traiter mes données personnelles dans le      │
│   cadre du présent processus de recrutement (OBLIGATOIRE)             │
│                                                                       │
│ ☐ J'autorise CRMC SA à conserver mes données 2 ans après la fin du   │
│   processus pour me proposer d'autres opportunités (optionnel)        │
│                                                                       │
│ ☐ J'autorise CRMC SA à me contacter pour de futures opportunités      │
│   correspondant à mon profil (optionnel)                              │
│                                                                       │
│ ☐ J'autorise CRMC SA à conserver mon CV avec photo (optionnel)        │
│   ⚠ Note : la présence de photo n'est pas un critère de sélection     │
│                                                                       │
│ ☐ J'autorise CRMC SA à m'inscrire à sa newsletter recrutement         │
│                                                                       │
│ DURÉE DE CONSERVATION                                                 │
│  • Si vous êtes recruté : durée du contrat + obligations légales      │
│  • Si vous n'êtes pas retenu : 2 ans (si autorisé ci-dessus)           │
│  • Si vous refusez la conservation : suppression auto après clôture   │
│                                                                       │
│ VOS DROITS                                                            │
│  Vous pouvez à tout moment exercer vos droits d'accès, rectification, │
│  effacement, portabilité et opposition.                                │
│  Contact DPO : dpo@crmc.ci                                            │
│                                                                       │
│ [Voir la politique complète de confidentialité]                        │
│                                                                       │
│ [☑ J'ai lu et j'accepte les conditions]                               │
│                                                                       │
│ [Valider mes consentements]                                           │
└──────────────────────────────────────────────────────────────────────┘
```

## 1.4 Modèle de données

```sql
CREATE TABLE candidate_consents (
  id UUID PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  
  consent_type TEXT NOT NULL,    -- 'processing', 'vivier_2y', 'future_opportunities',
                                 -- 'photo_storage', 'newsletter', etc.
  consent_given BOOLEAN NOT NULL,
  consent_date TIMESTAMPTZ NOT NULL,
  consent_version TEXT,          -- version des CGU acceptée
  
  consent_method TEXT,           -- 'web_form', 'paper', 'verbal_recorded'
  ip_address INET,
  user_agent TEXT,
  
  -- Révocation
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  
  -- Audit
  audit_hash TEXT
);
```

---

# 2. DURÉES DE CONSERVATION

## 2.1 Politique par défaut

| Type donnée | Durée | Anonymisation |
|-------------|-------|---------------|
| Candidature non retenue | 2 ans après dernière interaction | Auto à J+2ans |
| Candidat dans vivier | 2 ans (renouvelable avec consentement) | Auto si refus renouvellement |
| Candidat embauché | Durée contrat + 30 ans (obligations légales) | N/A (basculé en M1/M4) |
| Tests psychométriques | 1 an | Auto à J+1an |
| Enregistrements visio | 6 mois | Auto à J+6mois |
| Évaluations détaillées | 2 ans | Auto à J+2ans |
| Logs accès | 1 an (RGPD), 3 ans (sécurité) | Auto |

## 2.2 Paramétrable par tenant

Tenant peut ajuster (sans descendre en-dessous des minima légaux).

## 2.3 Workflow anonymisation auto

```
[Cron daily : check candidatures à anonymiser]
   ↓
Sélection candidatures :
  • Statut "rejected" ou "withdrawn"
  • Dernière interaction > 2 ans
  • Consentement vivier expiré ou refusé
   ↓
Pour chaque candidature :
  • Anonymisation données identité (nom, email, téléphone, photo, adresse)
  • Conservation données statistiques agrégées (catégorie poste, score)
  • Mise à jour `status = 'anonymized'`
  • Trace dans audit
   ↓
Notification DPO du volume anonymisé
```

## 2.4 Anonymisation effective

Champs anonymisés :
- `first_name` → "ANONYMIZED"
- `last_name` → "ANONYMIZED-{hash5char}"
- `email` → null
- `email_hash` → conservé pour détection futurs doublons
- `phone` → null
- `photo` → supprimée physiquement
- `cv_document` → supprimé
- `notes_recruiter` → expurgées
- Évaluations : scores conservés (anonymes), commentaires expurgés

Données conservées (statistiques) :
- Source de candidature.
- Pipeline parcouru.
- Date dépôt.
- Catégorie poste.

---

# 3. DROITS CANDIDATS

## 3.1 Droits garantis

| Droit | Description | Délai réponse |
|-------|-------------|---------------|
| **Accès** | Obtenir copie complète de ses données | 30 jours |
| **Rectification** | Corriger des données erronées | 30 jours |
| **Effacement** | Demander la suppression de ses données | 30 jours |
| **Limitation** | Restreindre certains traitements | 30 jours |
| **Portabilité** | Récupérer ses données dans format standard (JSON, CSV) | 30 jours |
| **Opposition** | S'opposer à un traitement spécifique | 30 jours |
| **Retrait consentement** | Annuler un consentement précédemment donné | Immédiat |

## 3.2 Modèle de données

```sql
CREATE TABLE candidate_rights_requests (
  id UUID PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  
  request_type TEXT NOT NULL,   -- 'access', 'rectification', 'erasure', etc.
  request_date TIMESTAMPTZ NOT NULL,
  request_details TEXT,
  
  -- Vérification identité
  identity_verified BOOLEAN,
  identity_verification_method TEXT,
  
  -- Traitement
  assigned_to UUID,
  status TEXT,                  -- 'received', 'in_progress', 'completed', 'rejected'
  deadline DATE,                -- 30 jours après réception
  
  -- Réponse
  response_provided_at TIMESTAMPTZ,
  response_method TEXT,         -- 'email', 'portal'
  response_data_url TEXT,       -- pour droit d'accès, fichier ZIP
  
  -- Cas rejet
  rejection_reason TEXT,
  rejection_legal_basis TEXT,
  
  -- Audit
  audit_log JSONB
);
```

## 3.3 Espace candidat - Exercice des droits

```
┌──────────────────────────────────────────────────────────────────────┐
│ Mes droits sur mes données personnelles                                │
├──────────────────────────────────────────────────────────────────────┤
│ Conformément au RGPD et à la législation ivoirienne, vous bénéficiez │
│ des droits suivants :                                                 │
│                                                                       │
│ 📥 DROIT D'ACCÈS                                                       │
│  Obtenir une copie complète de toutes vos données stockées chez CRMC. │
│  [Demander mes données]                                               │
│                                                                       │
│ ✏ DROIT DE RECTIFICATION                                              │
│  Corriger les données erronées ou obsolètes vous concernant.          │
│  [Demander correction]                                                │
│                                                                       │
│ 🗑 DROIT À L'EFFACEMENT                                                │
│  Demander la suppression de toutes vos données.                        │
│  ⚠ Si vous êtes en cours de processus, cela mettra fin à votre        │
│    candidature.                                                       │
│  [Demander suppression]                                               │
│                                                                       │
│ 📤 DROIT À LA PORTABILITÉ                                              │
│  Récupérer vos données dans un format standard (JSON, PDF).            │
│  [Télécharger mes données]                                            │
│                                                                       │
│ ⏸ DROIT À LA LIMITATION                                                │
│  Geler certains traitements de vos données.                            │
│  [Limiter traitement]                                                 │
│                                                                       │
│ ❌ DROIT D'OPPOSITION                                                  │
│  Vous opposer à un traitement spécifique.                              │
│  [S'opposer]                                                          │
│                                                                       │
│ 🔄 RETIRER UN CONSENTEMENT                                             │
│  Annuler un consentement précédemment donné.                           │
│  [Gérer mes consentements]                                            │
│                                                                       │
│ Contact DPO : dpo@crmc.ci                                              │
└──────────────────────────────────────────────────────────────────────┘
```

## 3.4 Workflow demande accès

```
[Candidat clique "Demander mes données"]
   ↓
Vérification identité (email + 2FA si possible)
   ↓
Création demande RGPD (deadline J+30)
   ↓
Notification DPO + Juriste
   ↓
Extraction automatique :
  • Données candidat (table candidates)
  • Toutes candidatures (applications)
  • Documents (CV, LM, etc.)
  • Évaluations (anonymisées sur évaluateurs si demandé)
  • Communications
  • Logs accès
   ↓
Génération package ZIP avec :
  • Données structurées (JSON)
  • Documents originaux
  • Lecture humaine (PDF récapitulatif)
   ↓
Notification candidat avec lien sécurisé téléchargement
(lien expirable 30 jours)
   ↓
Trace dans audit
```

## 3.5 Workflow demande suppression

```
[Candidat demande suppression]
   ↓
Vérification identité
   ↓
Analyse cas :
  • Si en pipeline actif : confirmation explicite ("Voulez-vous vraiment
    arrêter votre candidature ?")
  • Si déjà embauché : refus motivé (obligations légales conservation)
  • Si simple candidat passé : OK
   ↓
Si OK : exécution suppression complète
  • Anonymisation immédiate (même algo que conservation expirée)
  • Trace dans audit (mais pas dans candidat lui-même)
   ↓
Notification candidat confirmation suppression
   ↓
Trace conservée 5 ans (preuve de bonne exécution)
```

---

# 4. NON-DISCRIMINATION

## 4.1 Champs interdits

Aucun de ces critères ne peut être :
- Demandé au candidat dans le formulaire.
- Pris en compte dans l'évaluation.
- Affiché dans les fiches candidat aux évaluateurs.

| Critère | Exception légale possible |
|---------|---------------------------|
| Origine ethnique | Aucune |
| Religion | Aucune |
| Orientation sexuelle | Aucune |
| Situation familiale | Aucune (sauf justifiée poste) |
| Grossesse | Strictement interdit |
| Apparence physique | Aucune (sauf scène, mannequinat) |
| Handicap | Adaptation poste, jamais critère rejet |
| Opinions politiques | Aucune |
| Activités syndicales | Strictement interdit |
| Âge | Limites légales seulement |
| Genre | Quota d'équité interne possible (à l'embauche) |
| Nationalité | Critère sécurité défense seulement |

## 4.2 Détection algorithmique (rappel doc 06)

Patterns détectés et tracés en audit :
- Évaluateur notant systématiquement bas une catégorie démographique.
- Commentaires discriminants ("trop jeune", "incompatible avec maternité").
- Disparités score moyen H/F sur même poste.
- Etc.

## 4.3 Reporting non-discrimination

Dashboard Juriste & DPO :
- Taux H/F par étape pipeline (drop-off).
- Disparités score moyen par catégorie démographique.
- Évaluateurs alertés pour patterns suspects.
- Évolution sur 12 mois.

---

# 5. TRANSFERTS INTERNATIONAUX

## 5.1 Cas d'application

- Recrutement d'expatriés (transfert données hors zone).
- Candidats résidant à l'étranger.
- Sous-traitants étrangers (jobboards internationaux).

## 5.2 Garanties requises

- Pays adéquat (UE, Suisse, Royaume-Uni, etc.) → OK.
- Pays non adéquat → clauses contractuelles types (CCT) obligatoires.
- Consentement explicite du candidat (lors de la candidature).

## 5.3 Workflow

```
[Candidature reçue d'un pays non adéquat]
   ↓
Vérification consentement transfert international
   ↓
Si oui : traitement normal avec garanties
Si non : refus traitement + information candidat
```

---

# 6. SÉCURITÉ DES DONNÉES

## 6.1 Mesures techniques

- **Chiffrement** au repos (AES-256) et en transit (TLS 1.3).
- **Anonymisation** systématique aux échéances.
- **Pseudonymisation** dans les exports / analytics.
- **Accès restreints** par rôle (RLS PostgreSQL).
- **Logs accès** complets et conservés.
- **Authentification forte** (SSO + MFA pour rôles sensibles).
- **Tokens** d'accès expirables pour candidats.

## 6.2 Mesures organisationnelles

- **DPO désigné** (peut être externe).
- **Registre des traitements** maintenu.
- **AIPD** (Analyse d'Impact) pour traitements à risque.
- **Formation collaborateurs** régulière.
- **Procédure violation** (notification CNIL/équivalent + candidat).

## 6.3 Violations de données

En cas de fuite :
- Notification CNIL/équivalent sous 72h.
- Notification candidats concernés si risque élevé.
- Analyse impact + mesures correctives.
- Trace complète audit.

---

# 7. AUDIT CONFORMITÉ

## 7.1 Cockpit DPO

```
┌──────────────────────────────────────────────────────────────────────┐
│ Cockpit DPO - Mai 2026                                                 │
├──────────────────────────────────────────────────────────────────────┤
│ CONSENTEMENTS                                                         │
│  Nouveaux consentements ce mois : 89                                   │
│  Consentements révoqués : 3                                            │
│  Taux opt-in vivier : 78%                                              │
│                                                                       │
│ DEMANDES DROITS                                                       │
│  Reçues ce mois : 4                                                    │
│   • Accès : 2 (traitées en 5 et 12 jours)                              │
│   • Suppression : 1 (traitée en 2 jours)                               │
│   • Rectification : 1 (traitée en 1 jour)                              │
│  Aucune demande en retard ✅                                          │
│                                                                       │
│ ANONYMISATIONS                                                        │
│  Anonymisations auto ce mois : 145                                     │
│  Volume conservation vivier : 1 230 candidats                          │
│  Volume historique total : 8 947 candidats                             │
│                                                                       │
│ NON-DISCRIMINATION                                                    │
│  Évaluations analysées : 380                                           │
│  Alertes biais émises : 8                                              │
│   • Confirmées discriminantes : 1 (formation évaluateur)              │
│   • Faux positifs : 7                                                  │
│                                                                       │
│ INCIDENTS                                                              │
│  Tentatives accès non autorisées : 0                                   │
│  Violations données : 0 ✅                                             │
│                                                                       │
│ CONFORMITÉ GLOBALE                                                    │
│  Score conformité : 96/100 ✅                                          │
│  Audits externes prévus : Q4 2026                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## 7.2 Registre des traitements

Maintenu automatiquement avec :
- Finalité du traitement.
- Base légale.
- Catégories de données.
- Destinataires.
- Durée de conservation.
- Mesures de sécurité.

Format exportable pour contrôle CNIL/équivalent.

## 7.3 Audit annuel

Chaque année :
- Audit externe par cabinet spécialisé.
- Rapport DPO.
- Plan d'actions correctives.

---

# 8. APIS RGPD

```
POST /career/{tenant_slug}/api/consent
GET  /career/{tenant_slug}/api/consent/mine
POST /career/{tenant_slug}/api/consent/revoke

POST /career/{tenant_slug}/api/rgpd-request
     body: { request_type, details }
GET  /career/{tenant_slug}/api/rgpd-request/{requestId}/status

POST /hr/recrutement/conformite/rgpd-requests/{requestId}/process
POST /hr/recrutement/conformite/rgpd-requests/{requestId}/respond
GET  /hr/recrutement/conformite/rgpd-requests/dashboard

POST /hr/recrutement/conformite/anonymisation/run-batch (cron)
GET  /hr/recrutement/conformite/anonymisation/scheduled
POST /hr/recrutement/conformite/anonymisation/preview

GET  /hr/recrutement/conformite/registre-traitements
POST /hr/recrutement/conformite/registre-traitements/export

GET  /hr/recrutement/conformite/non-discrimination/dashboard?period=
GET  /hr/recrutement/conformite/non-discrimination/biais-alerts

POST /hr/recrutement/conformite/violation/declare
GET  /hr/recrutement/conformite/violations
```

---

# 9. TABLES IMPLIQUÉES

### Nouvelles
- `candidate_consents`
- `candidate_consent_revocations`
- `candidate_rights_requests`
- `candidate_rights_request_responses`
- `candidates_anonymization_log`
- `data_processing_registry` (registre des traitements)
- `international_transfers_log`
- `data_breach_incidents`
- `dpo_audit_log`
- `bias_detection_alerts`
- `non_discrimination_reports`

---

# 10. SYNTHÈSE

**Conformité RGPD & Non-discrimination** :
- **Consentements** granulaires et explicites à chaque finalité.
- **Conservation** 2 ans par défaut avec anonymisation automatique.
- **7 droits candidats** garantis avec workflows dédiés (délai 30j).
- **Espace candidat** pour exercer ses droits en autonomie.
- **Non-discrimination** OHADA enforcée techniquement (champs interdits, détection biais).
- **Transferts internationaux** avec garanties (CCT).
- **Sécurité** chiffrement + RLS + logs.
- **Cockpit DPO** avec monitoring continu.
- **Registre traitements** auto-maintenu.

**Règles dures** :
- Consentement obligatoire au dépôt candidature.
- Anonymisation auto après 2 ans (sauf consentement vivier).
- Réponse demande droits sous 30 jours.
- Champs discriminatoires bloqués techniquement.
- Notification violation sous 72h.
- Audit chaîné.

---

*Fin spécification 14 — Conformité RGPD & non-discrimination.*
