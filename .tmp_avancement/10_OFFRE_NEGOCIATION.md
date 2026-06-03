# M5 RECRUTEMENT — OFFRE & NÉGOCIATION
## Génération lettre offre, signature, négociation, acceptation
*God mode premium. Référence : 01_FONDATION.md, 09_DECISION_FEEDBACK.md, DocJourney, ADVIST.*

---

# 0. POSITIONNEMENT

L'**offre formelle** est l'**engagement juridique** de l'employeur envers le candidat retenu. C'est le document qui précède la signature du contrat de travail (qui sera géré dans M4).

Cette section couvre :
- **Génération** de la lettre d'offre (DocJourney).
- **Signature** par DRH via ADVIST.
- **Envoi** au candidat avec délai de réponse.
- **Négociation** éventuelle (rémunération, dates, conditions).
- **Acceptation** ou refus du candidat.
- **Workflow contre-propositions**.

## 0.1 Routes

- `/hr/recrutement/applications/{appId}/offre` → Gestion offre d'un candidat
- `/hr/recrutement/applications/{appId}/offre/nouvelle` → Création offre
- `/hr/recrutement/applications/{appId}/offre/{offerId}/negociation` → Suivi négo
- `/hr/recrutement/offres-emission` → Cockpit toutes offres en cours

---

# 1. STRUCTURE D'UNE OFFRE D'EMBAUCHE

## 1.1 Contenu

```
┌─────────────────────────────────────────────────────────────────┐
│ LETTRE D'OFFRE D'EMBAUCHE                                          │
│                                                                   │
│ EN-TÊTE                                                           │
│  Société (logo, raison sociale, RCCM)                              │
│  Destinataire (candidat, adresse)                                  │
│  Date, référence offre                                            │
│                                                                   │
│ 1. OBJET                                                          │
│  Proposition d'embauche au poste de [intitulé]                    │
│                                                                   │
│ 2. CONDITIONS DE L'OFFRE                                          │
│  • Type de contrat (CDI, CDD)                                      │
│  • Fonction                                                       │
│  • Service / Direction                                            │
│  • Classification (cadre, employé, ouvrier)                       │
│  • Coefficient CCN                                                │
│  • Manager hiérarchique                                           │
│                                                                   │
│ 3. RÉMUNÉRATION                                                   │
│  • Salaire brut mensuel                                            │
│  • Indemnités fixes                                                │
│  • Primes éventuelles                                              │
│  • Modalités de versement                                          │
│                                                                   │
│ 4. AVANTAGES                                                       │
│  • Mutuelle santé                                                  │
│  • Tickets restaurant                                              │
│  • Matériel fourni (PC, téléphone)                                 │
│  • Télétravail                                                     │
│  • Autres avantages spécifiques                                    │
│                                                                   │
│ 5. CONDITIONS PRATIQUES                                            │
│  • Date de prise de poste                                          │
│  • Lieu de travail                                                 │
│  • Période d'essai (durée)                                         │
│  • Horaires de travail                                             │
│                                                                   │
│ 6. PROCESSUS PRÉ-EMBAUCHE                                          │
│  • Visite médicale d'embauche programmée                           │
│  • Documents à fournir avant prise de poste                        │
│  • Onboarding prévu                                                │
│                                                                   │
│ 7. VALIDITÉ DE L'OFFRE                                             │
│  • Délai de réponse (typiquement 7-14 jours)                       │
│  • Modalités de réponse (acceptation écrite signée ADVIST)         │
│                                                                   │
│ 8. CLAUSE DE NON-CONFIDENTIALITÉ                                   │
│  Cette offre est confidentielle                                   │
│                                                                   │
│ 9. RÉSERVES                                                       │
│  • Sous réserve d'aptitude médicale                                │
│  • Sous réserve de vérification des documents                      │
│                                                                   │
│ SIGNATURE EMPLOYEUR (DRH)                                          │
│ ESPACE SIGNATURE CANDIDAT (à signer)                               │
└─────────────────────────────────────────────────────────────────┘
```

## 1.2 Modèle de données

```sql
CREATE TABLE job_offers_emitted (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  application_id UUID NOT NULL REFERENCES applications(id),
  
  -- Identification
  reference TEXT UNIQUE NOT NULL,  -- OFR-EMI-2026-0245
  
  -- Contenu offre
  contract_type TEXT NOT NULL,
  position_title TEXT NOT NULL,
  department TEXT,
  classification TEXT,
  ccn_coefficient INT,
  manager_id UUID,
  
  -- Rémunération
  base_salary INT NOT NULL,
  salary_currency TEXT DEFAULT 'XOF',
  fixed_allowances JSONB,         -- [{code, label, amount}]
  variable_pay JSONB,
  benefits JSONB,
  
  -- Conditions
  start_date DATE NOT NULL,
  work_location TEXT,
  probation_period_months INT,
  weekly_hours INT,
  remote_work_policy TEXT,
  
  -- Validité
  valid_until DATE,
  expiration_warned_at TIMESTAMPTZ,
  
  -- Statut
  status TEXT,                    -- 'draft', 'signed_employer', 'sent', 'negotiation',
                                  -- 'counter_proposed', 'accepted', 'rejected', 'expired'
  
  -- Signature ADVIST
  employer_signed_at TIMESTAMPTZ,
  employer_signed_by UUID,
  employer_signature_advist_id TEXT,
  
  candidate_received_at TIMESTAMPTZ,
  candidate_response_at TIMESTAMPTZ,
  candidate_signed_at TIMESTAMPTZ,
  candidate_signature_advist_id TEXT,
  candidate_response TEXT,        -- 'accepted', 'rejected', 'counter_proposal'
  candidate_response_notes TEXT,
  
  -- Document
  pdf_document_id UUID,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  audit_hash TEXT
);

CREATE TABLE offer_negotiations (
  id UUID PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES job_offers_emitted(id),
  
  iteration INT NOT NULL,         -- numéro itération négo
  initiated_by TEXT,              -- 'candidate', 'employer'
  
  -- Demandes/contre-propositions
  salary_requested INT,
  start_date_requested DATE,
  other_requests JSONB,
  
  -- Response employeur
  employer_response TEXT,         -- 'accept', 'counter', 'final_no'
  employer_counter JSONB,
  
  -- Statut
  status TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
```

---

# 2. GÉNÉRATION DE L'OFFRE

## 2.1 Workflow

```
[Décision comité hiring : HIRE candidat X]
   ↓
Wizard génération offre
   ↓
Pré-remplissage depuis :
  • Besoin de recrutement (poste, salaire, conditions)
  • Évaluations candidat (salaire demandé)
  • Modèle DocJourney
   ↓
Personnalisation (recruteur ajuste)
   ↓
Validation RRH (vérification cohérence package)
   ↓
Soumission DRH pour signature
   ↓
Signature DRH via ADVIST
   ↓
Envoi candidat
```

## 2.2 Wizard

```
┌──────────────────────────────────────────────────────────────────────┐
│ Génération offre - Awa DIABATÉ                                        │
├──────────────────────────────────────────────────────────────────────┤
│ MODÈLE LETTRE                                                         │
│  [TPL-OFFRE-CDI-CADRE ▾]                                              │
│                                                                       │
│ CONDITIONS CONTRAT                                                    │
│  Type : [CDI ▾]                                                       │
│  Fonction : [Chef de Projet Commercial]                               │
│  Service : [Direction Commerciale]                                    │
│  Manager : [Hadja TIMITÉ]                                              │
│  Classification : [Cadre B échelon 3]                                  │
│  Lieu : [Cosmos Yopougon]                                              │
│  Date prise de poste : [📅 01/10/2026] (selon préavis Awa)            │
│  Période d'essai : [3 mois]                                            │
│  Horaires : [40h/sem - L-V 8h-17h]                                     │
│                                                                       │
│ RÉMUNÉRATION                                                          │
│  Salaire base mensuel : [1 000 000] FCFA                               │
│   (Demande candidate : 1 050 000 - négociation envisageable)          │
│   (Fourchette poste : 800K-1,1M)                                       │
│                                                                       │
│  Indemnités fixes :                                                   │
│   • Logement : 250 000 FCFA                                            │
│   • Transport : 45 000 FCFA                                            │
│   • Fonction : 75 000 FCFA                                             │
│                                                                       │
│  Salaire brut total : 1 370 000 FCFA / mois                            │
│                                                                       │
│  Variable : 10% du brut annuel sur objectifs commerciaux              │
│                                                                       │
│  13e mois : ☑ Oui                                                     │
│                                                                       │
│ AVANTAGES                                                              │
│  ☑ Mutuelle santé (employeur + employé + enfants)                      │
│  ☑ Tickets restaurant (10K FCFA/mois)                                  │
│  ☑ Téléphone professionnel + forfait illimité                          │
│  ☑ Ordinateur portable                                                 │
│  ☑ Télétravail 2j/semaine                                              │
│  ☐ Voiture de fonction (non applicable)                                │
│                                                                       │
│ VALIDITÉ                                                               │
│  Date limite acceptation : [📅 15/07/2026] (offre valable 14 jours)   │
│                                                                       │
│ APERÇU                                                                │
│  [📄 Voir aperçu PDF lettre offre]                                    │
│                                                                       │
│ [Sauvegarder draft] [Soumettre validation RRH]                        │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.3 Validation RRH

RRH vérifie cohérence :
- Package complet conforme à la grille interne ?
- Pas d'avantages exceptionnels non validés ?
- Salaire dans fourchette validée par DAF ?

Si OK → soumission DRH.

## 2.4 Signature DRH ADVIST

DRH signe via ADVIST :
- Connexion ADVIST.
- Lecture lettre.
- Signature qualifiée OHADA.
- Horodatage.

## 2.5 Envoi candidat

Email + portail candidat :
```
Objet : Offre d'embauche CRMC - Chef de Projet Commercial

Bonjour Awa,

Suite à notre comité de sélection, nous avons le plaisir de vous adresser 
ci-joint notre offre formelle d'embauche pour le poste de Chef de Projet 
Commercial au sein de la Direction Commerciale.

📎 Offre_CRMC_DIABATE_20260701.pdf

CONDITIONS PRINCIPALES
• Type de contrat : CDI
• Salaire brut : 1 370 000 FCFA / mois (incluant indemnités)
• Variable annuel : 10% du brut annuel sur objectifs
• Date de prise de poste : 1er octobre 2026
• Lieu : Cosmos Yopougon
• Télétravail : 2 jours/semaine

📅 Cette offre est valable jusqu'au 15 juillet 2026.

POUR DONNER VOTRE RÉPONSE
[ ✅ Accepter et signer ]
[ 💬 Négocier (contre-proposition) ]
[ ❌ Décliner respectueusement ]

Pour toute question, n'hésitez pas à me contacter.

Très cordialement,

Hadja TIMITÉ
DRH CRMC SA
```

---

# 3. RÉPONSE CANDIDAT

## 3.1 Espace candidat

Sur le portail candidat, écran dédié :

```
┌──────────────────────────────────────────────────────────────────────┐
│ Votre offre d'embauche                                                │
├──────────────────────────────────────────────────────────────────────┤
│ 📄 Offre CRMC - Chef de Projet Commercial                              │
│ Reçue le 01/07/2026                                                    │
│ Valide jusqu'au 15/07/2026 (14 jours restants)                         │
│                                                                       │
│ [Consulter la lettre complète]                                        │
│                                                                       │
│ SYNTHÈSE                                                              │
│  Poste : Chef de Projet Commercial                                    │
│  Société : CRMC SA                                                    │
│  Type : CDI                                                           │
│  Salaire : 1 370 000 FCFA brut/mois (avec indemnités)                  │
│  Variable : 10% du brut annuel                                         │
│  Date début : 01/10/2026                                               │
│  Lieu : Cosmos Yopougon                                                │
│                                                                       │
│ VOTRE RÉPONSE                                                         │
│                                                                       │
│  [ ✅ Accepter l'offre et signer ]                                    │
│   Vous serez redirigé vers ADVIST pour signature qualifiée            │
│                                                                       │
│  [ 💬 Faire une contre-proposition ]                                  │
│   Détaillez vos demandes (salaire, date, conditions)                   │
│                                                                       │
│  [ ❌ Décliner respectueusement ]                                     │
│   Merci d'indiquer brièvement la raison                               │
│                                                                       │
│  [ 📞 Demander un entretien préalable ]                                │
│   Programmation d'un échange téléphonique RH ou Manager               │
└──────────────────────────────────────────────────────────────────────┘
```

## 3.2 Acceptation

Si candidat accepte :
- Redirection ADVIST.
- Vérification identité.
- Lecture lettre.
- Signature qualifiée.
- Notification équipe RH (success).
- Statut application → `accepted`.
- Statut offre → `accepted`.
- Déclenchement pré-embauche M4/M6.

## 3.3 Refus

Si candidat décline :
- Saisie raison (champ libre).
- Notification équipe RH.
- Statut application → `withdrawn` ou `rejected_by_candidate`.
- Activation backup (si shortlist) → relance candidat #2.

---

# 4. NÉGOCIATION

## 4.1 Workflow contre-proposition

Si candidat fait contre-proposition :

```
┌──────────────────────────────────────────────────────────────────────┐
│ Votre contre-proposition                                              │
├──────────────────────────────────────────────────────────────────────┤
│ Indiquez les éléments que vous souhaitez négocier :                    │
│                                                                       │
│ ☑ SALAIRE                                                              │
│   Offre actuelle : 1 000 000 FCFA brut                                │
│   Votre demande : [1 100 000] FCFA brut                                │
│   Justification : [TextArea : marché, expérience, autre offre]        │
│                                                                       │
│ ☐ INDEMNITÉS                                                          │
│                                                                       │
│ ☑ DATE DE PRISE DE POSTE                                              │
│   Offre actuelle : 01/10/2026                                          │
│   Votre demande : [📅 15/10/2026]                                     │
│   Raison : Préavis nécessite 2 semaines supplémentaires               │
│                                                                       │
│ ☐ TÉLÉTRAVAIL                                                          │
│                                                                       │
│ ☐ AUTRES CONDITIONS                                                    │
│                                                                       │
│ MESSAGE COMPLÉMENTAIRE                                                │
│  [TextArea]                                                           │
│                                                                       │
│ [Envoyer contre-proposition]                                          │
└──────────────────────────────────────────────────────────────────────┘
```

## 4.2 Côté employeur

Notification reçue → vue manager :

```
┌──────────────────────────────────────────────────────────────────────┐
│ Contre-proposition reçue - Awa DIABATÉ                                │
├──────────────────────────────────────────────────────────────────────┤
│ DEMANDES CANDIDATE                                                    │
│                                                                       │
│ 💰 Salaire : 1 100 000 FCFA (vs 1 000 000 offre = +10%)               │
│   Justification : "Conformément à mes attentes initiales et au marché │
│   actuel pour ce niveau d'expérience. J'ai également une offre        │
│   parallèle à 1 080 000 FCFA chez un concurrent."                     │
│                                                                       │
│ 📅 Date début : 15/10/2026 (vs 01/10 = +2 semaines)                   │
│   Justification : Préavis de 3 mois minimum avec ancien employeur.    │
│                                                                       │
│ ANALYSE                                                                │
│  • Salaire 1 100 000 toujours dans fourchette (800K-1,1M) ✅          │
│  • Impact masse salariale annuelle : +1,2M FCFA (vs offre initiale)   │
│  • Cohérence interne : niveau senior équipe = 1 050K-1 200K             │
│  • Date 15/10 acceptable (2 semaines de glissement)                    │
│                                                                       │
│ OPTIONS DE RÉPONSE                                                    │
│                                                                       │
│  ● Accepter les 2 demandes (salaire 1,1M + date 15/10)                │
│  ○ Accepter partiellement                                              │
│    Salaire : [1 050 000] (point milieu)                               │
│    Date : [15/10/2026] (accepté)                                       │
│  ○ Refuser (maintenir offre initiale)                                  │
│    ⚠ Risque perdre la candidate                                       │
│  ○ Reporter à comité hiring restreint (DRH+DG)                         │
│                                                                       │
│ VALIDATION                                                             │
│  Décision en autonomie : RRH si écart ≤ 5%                            │
│  Décision DRH : si écart 5-15%                                        │
│  Décision DRH+DG : si écart > 15%                                     │
│                                                                       │
│ [Envoyer contre-réponse]                                              │
└──────────────────────────────────────────────────────────────────────┘
```

## 4.3 Itérations

Plusieurs aller-retours possibles. Chaque itération tracée.

Limite : **3 itérations max** par défaut (sinon : décision finale forcée).

## 4.4 Acceptation finale

Une fois accord trouvé :
- Génération **nouvelle lettre d'offre** (avenant à l'offre initiale).
- Signature DRH.
- Signature candidat ADVIST.
- Statut → `accepted`.

---

# 5. EXPIRATION OFFRE

## 5.1 Surveillance

- Notification candidat à J-7 avant expiration.
- Notification candidat à J-3.
- Notification employeur à J-7.

## 5.2 Workflow expiration

Si expiration sans réponse :
- Statut → `expired`.
- Notification équipe.
- Décision : relance ou activation backup.

---

# 6. COCKPIT OFFRES EN COURS

```
┌──────────────────────────────────────────────────────────────────────┐
│ Offres émises - Suivi                                                 │
├──────────────────────────────────────────────────────────────────────┤
│ Filtres : [Statut ▾] [Période ▾] [Offre ▾]                            │
├──────────────────────────────────────────────────────────────────────┤
│ Candidat       │ Poste         │ Émise   │ Statut         │ Action     │
│ ─────────────  │ ────────────  │ ─────── │ ────────────── │ ────────── │
│ Awa DIABATÉ    │ Chef Proj Com │ 01/07   │ ⏳ En attente  │ J-12       │
│ Yao DIALLO     │ Commercial    │ 28/06   │ 💬 Négo iter 2 │ Répondre   │
│ Mariam BAH     │ Comptable     │ 25/06   │ ✅ Acceptée    │ Pré-emb.   │
│ Ibrahim KONÉ   │ Resp Maint.   │ 20/06   │ ❌ Refusée     │ Backup     │
│ Aïssa TRA      │ Acheteur      │ 15/06   │ ⏰ Expirée    │ Décision   │
├──────────────────────────────────────────────────────────────────────┤
│ STATS MOIS                                                            │
│  Émises : 12 · Acceptées : 8 (66%) · Refusées : 2 · En cours : 2       │
│  Taux d'acceptation : 80% (vs cible 80% ✅)                           │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 7. APIS OFFRE & NÉGOCIATION

```
POST /hr/recrutement/applications/{appId}/offre
GET  /hr/recrutement/applications/{appId}/offre
PATCH /hr/recrutement/applications/{appId}/offre/{offerId}
POST /hr/recrutement/applications/{appId}/offre/{offerId}/preview-pdf
POST /hr/recrutement/applications/{appId}/offre/{offerId}/submit-validation
POST /hr/recrutement/applications/{appId}/offre/{offerId}/validate-rrh
POST /hr/recrutement/applications/{appId}/offre/{offerId}/sign-drh (ADVIST)
POST /hr/recrutement/applications/{appId}/offre/{offerId}/send
POST /hr/recrutement/applications/{appId}/offre/{offerId}/candidate-accept (ADVIST)
POST /hr/recrutement/applications/{appId}/offre/{offerId}/candidate-decline
POST /hr/recrutement/applications/{appId}/offre/{offerId}/candidate-counter

GET  /hr/recrutement/applications/{appId}/offre/{offerId}/negociations
POST /hr/recrutement/applications/{appId}/offre/{offerId}/employer-counter
POST /hr/recrutement/applications/{appId}/offre/{offerId}/finalize-deal

GET  /hr/recrutement/offres-emission?filters=
```

---

# 8. TABLES IMPLIQUÉES

### Nouvelles
- `job_offers_emitted`
- `job_offer_emitted_versions` (révisions après négo)
- `offer_negotiations` (itérations)
- `offer_signatures` (workflow ADVIST)
- `offer_documents` (PDFs)
- `offer_expirations_log`

---

# 9. SYNTHÈSE

**Offre & Négociation** :
- **Génération automatique** lettre via DocJourney avec pré-remplissage.
- **Validation 4-eyes** : Recruteur → RRH → DRH.
- **Signature qualifiée ADVIST** côté employeur + candidat.
- **Espace candidat** dédié pour réponse.
- **Workflow négociation** structuré avec itérations (3 max).
- Validation déléguée selon écart salaire (RRH si ≤5%, DRH si 5-15%, DRH+DG si >15%).
- **Suivi expiration** avec alertes.

**Règles dures** :
- Pas d'envoi offre sans validation RRH + signature DRH.
- ADVIST obligatoire pour valeur juridique.
- Toutes itérations négo tracées.
- Expiration automatique à date limite.
- Audit chaîné.

---

*Fin spécification 10 — Offre & négociation.*
