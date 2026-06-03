# M5 RECRUTEMENT — INTÉGRATION VERS M4 ADMIN RH ET M6 ONBOARDING
## Bascule candidat → contrat M4 + déclenchement parcours onboarding M6
*God mode premium. Référence : M4 ADMIN RH doc 03 Contrats, M6 Onboarding (à venir).*

---

# 0. POSITIONNEMENT

Une fois l'offre acceptée par le candidat, démarre la **phase critique de transition** :
- Le candidat **devient un futur collaborateur** (statut intermédiaire).
- La **bascule** vers M4 doit créer le contrat de travail définitif.
- Le **parcours onboarding** M6 doit démarrer pour préparer l'arrivée.
- Tous les **acteurs** (manager, équipe IT, RH admin, paie) doivent être notifiés.

Cette section couvre :
- **Workflow de transition** détaillé.
- **Création contrat M4** avec wizard pré-rempli.
- **Préparation pré-embauche** (documents, équipements, accès SI).
- **Déclenchement parcours onboarding M6**.
- **Synchronisation données** entre M5, M1, M4, M6.

## 0.1 Routes

- `/hr/recrutement/applications/{appId}/integration` → Workflow intégration
- `/hr/recrutement/futurs-collaborateurs` → Liste des futurs embauchés
- `/hr/recrutement/futurs-collaborateurs/{futurId}` → Préparation arrivée

---

# 1. STATUT "FUTUR COLLABORATEUR"

## 1.1 Période transitoire

Entre **acceptation de l'offre** et **prise de poste effective**, le candidat est en statut **futur collaborateur** :
- Plus un candidat (process recrutement terminé).
- Pas encore un employé (contrat pas signé / pas en poste).
- Suivi spécifique sur les actions pré-embauche.

## 1.2 Durée

Typiquement 2 semaines à 3 mois (selon préavis candidat).

## 1.3 Modèle de données

```sql
CREATE TABLE future_employees (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Lien avec recrutement
  application_id UUID NOT NULL REFERENCES applications(id),
  offer_id UUID NOT NULL REFERENCES job_offers_emitted(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  
  -- Données poste
  position_title TEXT NOT NULL,
  contract_type TEXT,
  start_date DATE NOT NULL,
  manager_id UUID,
  
  -- Statut
  status TEXT,                  -- 'offer_accepted', 'pre_boarding_in_progress',
                                -- 'ready_to_start', 'cancelled', 'started'
  
  -- Actions pré-embauche
  pre_boarding_checklist JSONB,
  
  -- Lien M1 (dossier personnel créé)
  m1_employee_id UUID,
  m1_created_at TIMESTAMPTZ,
  
  -- Lien M4 (contrat créé)
  m4_contract_id UUID,
  m4_contract_created_at TIMESTAMPTZ,
  m4_contract_signed_at TIMESTAMPTZ,
  
  -- Lien M6 (parcours onboarding)
  m6_onboarding_journey_id UUID,
  m6_started_at TIMESTAMPTZ,
  
  -- Documents pré-embauche
  documents_required JSONB,     -- liste docs attendus
  documents_received JSONB,
  
  -- Visite médicale
  medical_visit_scheduled_at TIMESTAMPTZ,
  medical_visit_completed_at TIMESTAMPTZ,
  
  -- DPAE
  dpae_filed_at TIMESTAMPTZ,
  dpae_reference TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  audit_hash TEXT
);
```

---

# 2. WORKFLOW DE TRANSITION

## 2.1 Vue d'ensemble

```
[Offre acceptée par candidat]
   ↓
Création "Futur collaborateur" (M5)
   ↓
Création dossier M1 (données personnelles)
   ↓
Création contrat M4 (wizard pré-rempli)
   ↓
Workflow validation contrat (RRH + DRH + Employé via ADVIST)
   ↓
Déclenchement parcours onboarding M6
   ↓
Préparation pré-embauche en parallèle :
  • Documents requis demandés au candidat
  • Visite médicale d'embauche programmée
  • DPAE déposée
  • Équipement IT préparé
  • Accès SI créés (en standby jusqu'à J-1)
  • Bureau / matériel préparé
  • Équipe informée (présentation J1)
   ↓
J = date prise de poste
   ↓
Activation contrat M4 (statut active)
Création dossier paie M3
Démarrage premier jour onboarding M6
Statut futur collaborateur → 'started'
```

## 2.2 Layout cockpit intégration

```
┌──────────────────────────────────────────────────────────────────────┐
│ Intégration - Awa DIABATÉ                                              │
│ Offre acceptée le 05/07 · Prise de poste prévue 15/10/2026 (J-102)   │
├──────────────────────────────────────────────────────────────────────┤
│ STATUT : 🟡 Pré-embauche en cours                                     │
├──────────────────────────────────────────────────────────────────────┤
│ JALONS                                                                │
│                                                                       │
│ ✅ Offre acceptée par candidate (05/07)                                │
│ ✅ Dossier M1 créé (06/07)                                            │
│ ⏳ Contrat M4 en cours de génération                                  │
│   [Continuer wizard contrat]                                          │
│ ⏳ Documents pré-embauche en cours de collecte (4/8 reçus)            │
│   [Voir détail]                                                       │
│ ⏳ Visite médicale à programmer                                       │
│ ⏳ DPAE à déposer (J-5 avant prise de poste)                          │
│ ⏳ Équipement IT à préparer                                           │
│ ⏳ Parcours onboarding M6 à initialiser                                │
│                                                                       │
│ CHECKLIST PRÉ-EMBAUCHE                                                │
│  ✅ Pièce identité reçue                                              │
│  ✅ Diplôme reçu                                                       │
│  ✅ RIB reçu                                                           │
│  ✅ Photo identité reçue                                              │
│  ⏳ Casier judiciaire en attente                                      │
│  ⏳ Justificatif domicile en attente                                  │
│  ⏳ Certificats CNPS en attente                                       │
│  ⏳ Attestation employeur précédent en attente                        │
│                                                                       │
│ ALERTES                                                                │
│  🟢 Aucune alerte urgente                                              │
│                                                                       │
│ ACTIONS REQUISES                                                      │
│  • Relancer candidate pour documents manquants                        │
│  • Programmer visite médicale (avant fin août)                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 3. CRÉATION DOSSIER M1

## 3.1 Données pré-remplies

À partir des données candidat :
- Nom, prénom, état civil.
- Date et lieu de naissance.
- Nationalité.
- Adresse personnelle.
- Coordonnées (téléphone, email).
- Personne à contacter en cas d'urgence (à compléter).
- Pièces d'identité (à compléter).
- Conjoint et enfants à charge (à compléter).
- Formation principale.

## 3.2 Workflow

```
[Offre acceptée]
   ↓
Bouton "Créer dossier M1" automatique
   ↓
Pré-remplissage depuis données candidat
   ↓
Chargé adm RH complète/vérifie
   ↓
Validation et création M1 effective
   ↓
Matricule attribué (AP-2026-XXXX)
```

## 3.3 API

```
POST /hr/recrutement/applications/{appId}/integration/create-m1-dossier
```

---

# 4. CRÉATION CONTRAT M4

## 4.1 Wizard pré-rempli

Cf. M4 doc 03 (wizard 10 étapes). Différence : pré-rempli depuis :
- Données offre acceptée (poste, salaire, conditions).
- Données candidat (état civil, adresse).
- Modèle contrat suggéré selon type poste.

## 4.2 Spécificité

L'utilisateur n'a quasiment qu'à **valider** chaque étape (modifications mineures éventuelles).

## 4.3 Workflow signature

Comme tout contrat M4 :
- Validation RRH.
- Signature DRH ADVIST.
- Signature employé ADVIST.
- Activation à date d'embauche.

## 4.4 API

```
POST /hr/recrutement/applications/{appId}/integration/create-m4-contract
     body: { contract_options }
GET  /hr/recrutement/applications/{appId}/integration/m4-contract-status
```

---

# 5. PARCOURS ONBOARDING M6 (à venir)

## 5.1 Déclenchement

Une fois contrat signé :
- Sélection du **parcours onboarding** adapté au poste (M6).
- Initialisation des **étapes** pré-J1 et post-J1.
- Notifications aux **parties prenantes** (manager, équipe, IT, etc.).

## 5.2 Étapes pré-J1 typiques

- Envoi welcome pack candidat.
- Configuration accès SI (en standby).
- Préparation bureau / matériel.
- Information équipe.
- Désignation buddy/mentor.
- Préparation programme J1.

## 5.3 API

```
POST /hr/recrutement/applications/{appId}/integration/init-m6-onboarding
     body: { journey_template_id }
GET  /hr/recrutement/applications/{appId}/integration/m6-onboarding-status
```

---

# 6. DOCUMENTS PRÉ-EMBAUCHE

## 6.1 Liste type

| Document | Obligatoire | Pour |
|----------|------------|------|
| Pièce d'identité (CNI, passeport) | ✅ | Identification |
| Acte de naissance | ✅ | Identification |
| Photo identité récente | ✅ | Dossier, badge |
| Diplôme principal | ✅ | Vérification |
| Diplômes complémentaires | Optionnel | Dossier |
| RIB / coordonnées bancaires | ✅ | Paie |
| Casier judiciaire (extrait B3) | Selon poste | Conformité |
| Justificatif de domicile | ✅ | Administratif |
| Certificat de travail précédent employeur | ✅ | Vérification |
| Attestation CNPS précédente | ✅ | Continuité droits |
| Carte d'affiliation mutuelle (si applicable) | Optionnel | Mutuelle |
| Acte de mariage (si applicable) | Selon | Allocations |
| Actes de naissance enfants (si applicable) | Selon | Allocations |
| Document permis de travail (expatriés) | ✅ | Conformité |

## 6.2 Workflow collecte

```
[Création futur collaborateur]
   ↓
Génération liste documents requis (selon poste, statut, pays)
   ↓
Notification au candidat avec liste claire
   ↓
Espace candidat dédié pour téléversement
   ↓
Chargé adm vérifie chaque document
   ↓
Si manquant : relance automatique J+3, J+7
   ↓
Si problème : entretien préalable J-15
   ↓
Tous documents reçus → check pré-embauche OK
```

## 6.3 Espace candidat documents

```
┌──────────────────────────────────────────────────────────────────────┐
│ Documents pré-embauche                                                │
├──────────────────────────────────────────────────────────────────────┤
│ Pour finaliser votre embauche au 15/10/2026, merci de nous fournir    │
│ les documents suivants avant le 30/09/2026.                            │
│                                                                       │
│ ✅ Pièce d'identité (CNI Awa Diabate.pdf)                              │
│ ✅ Acte de naissance (acte-naissance-1992.pdf)                         │
│ ✅ Diplôme MBA (diplome-HEC.pdf)                                       │
│ ✅ RIB NSIA Banque (rib.pdf)                                           │
│ ⏳ Justificatif de domicile [Téléverser]                              │
│ ⏳ Certificat de travail précédent employeur [Téléverser]              │
│ ⏳ Attestation CNPS précédente [Téléverser]                            │
│ ⏳ Casier judiciaire B3 (à demander à la mairie) [Téléverser]          │
│                                                                       │
│ ℹ Tous vos documents sont chiffrés et sécurisés.                       │
│   Ils ne seront utilisés que pour votre dossier RH.                    │
│                                                                       │
│ [Sauvegarder progression]                                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 7. VISITE MÉDICALE D'EMBAUCHE

## 7.1 Obligation

La **visite médicale d'embauche** est obligatoire dans tous les pays UEMOA/CEMAC pour valider l'aptitude au poste.

## 7.2 Workflow

```
[Création futur collaborateur]
   ↓
Programmation visite médicale (service santé travail)
   ↓
Notification candidat avec date/lieu
   ↓
Visite médicale effectuée
   ↓
Médecin émet certificat d'aptitude :
  • Apte
  • Apte avec restrictions
  • Inapte (cas rare, rupture offre)
   ↓
Certificat archivé dans dossier M12
   ↓
Information RH (apte ou non)
```

## 7.3 API

```
POST /hr/recrutement/applications/{appId}/integration/schedule-medical-visit
POST /hr/recrutement/applications/{appId}/integration/medical-visit-result
```

---

# 8. DPAE (DÉCLARATION PRÉALABLE À L'EMBAUCHE)

## 8.1 Obligation

DPAE obligatoire dans tous les pays UEMOA/CEMAC, déposée :
- Avant ou au plus tard le jour de l'embauche.
- Auprès de la CNPS (ou équivalent).

## 8.2 Workflow

```
[Futur collaborateur préparé]
   ↓
À J-5 avant prise de poste : génération DPAE automatique
   ↓
Vérification chargé adm
   ↓
Dépôt électronique (API CNPS si disponible) ou fichier
   ↓
Réception accusé réception
   ↓
Archivage dans dossier M4
```

## 8.3 API

```
POST /hr/recrutement/applications/{appId}/integration/file-dpae
GET  /hr/recrutement/applications/{appId}/integration/dpae-status
```

---

# 9. PRÉPARATION IT & ÉQUIPEMENTS

## 9.1 Notification IT

À J-15 avant prise de poste :
- Notification équipe IT.
- Liste des accès à créer (emails, applications métier, VPN, etc.).
- Liste équipements à préparer (PC, téléphone, badge).

## 9.2 Activation J-1

Les accès sont **créés en mode "désactivé"** et activés le matin du J1.

## 9.3 Layout IT

```
┌──────────────────────────────────────────────────────────────────────┐
│ Préparation IT - Awa DIABATÉ - Prise de poste 15/10/2026               │
├──────────────────────────────────────────────────────────────────────┤
│ COMPTES À CRÉER                                                       │
│  ☑ Email professionnel : awa.diabate@crmc.ci                          │
│  ☑ Atlas People (SSO)                                                  │
│  ☑ Salesforce CRM                                                      │
│  ☑ Microsoft 365                                                      │
│  ☑ Slack workspace                                                    │
│  ☐ VPN (si télétravail)                                                │
│                                                                       │
│ ÉQUIPEMENT À PRÉPARER                                                  │
│  ☑ Ordinateur portable Dell Latitude 7440 (#PC-2026-145)               │
│  ☑ Téléphone professionnel Samsung S24 + ligne (+225 ...)              │
│  ☑ Badge accès Cosmos Yopougon                                         │
│  ☑ Bureau attribué (poste Direction Commerciale n°12)                  │
│                                                                       │
│ ☐ Activation accès à J1 09h00                                          │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 10. PRÉPARATION ÉQUIPE

## 10.1 Notification équipe

À J-7 avant prise de poste, notification équipe directe :
- Nom et photo du futur collaborateur.
- Fonction et missions.
- Date d'arrivée.
- Background succinct.

## 10.2 Désignation buddy

Manager désigne un **buddy** (collègue référent pour les premières semaines).

## 10.3 Programme J1

Préparation du programme du premier jour :
- Accueil RH 9h.
- Visite site.
- Présentation équipe.
- Lunch équipe.
- Premier brief manager.
- Configuration poste.

---

# 11. JOUR J — ACTIVATION

## 11.1 Checklist J1 RH

À J1 matin :
- ✅ Activation accès SI (IT).
- ✅ Accueil physique RH 9h00.
- ✅ Remise badge, équipement.
- ✅ Signature physique éventuelle (si pas tout par ADVIST).
- ✅ Présentation programme onboarding M6.
- ✅ Activation statut M1 → "Actif".
- ✅ Activation contrat M4 → "Active".
- ✅ Création dossier paie M3.
- ✅ Démarrage parcours M6 J1.
- ✅ Statut futur collaborateur → "started".

## 11.2 Reporting

Notification cascade : manager, équipe, paie, comptabilité.

---

# 12. CAS D'ANNULATION

## 12.1 Désistement candidat (avant J1)

Si candidat désiste pendant pré-embauche :
- Statut futur collaborateur → `cancelled`.
- Annulation préparation IT.
- Annulation visite médicale.
- DPAE retirée (si déjà déposée).
- Activation backup (si shortlist).
- Audit complet du désistement (raison, impact).

## 12.2 No-show J1

Cas rare mais possible : candidat ne se présente pas le J1 :
- Tentatives de contact (2-3 essais).
- Si silence > 48h : rupture pour faute considérée.
- Workflow spécial juriste.

---

# 13. APIS INTÉGRATION

```
POST /hr/recrutement/applications/{appId}/integration/create-future-employee
GET  /hr/recrutement/futurs-collaborateurs
GET  /hr/recrutement/futurs-collaborateurs/{futurId}
PATCH /hr/recrutement/futurs-collaborateurs/{futurId}

POST /hr/recrutement/futurs-collaborateurs/{futurId}/create-m1-dossier
POST /hr/recrutement/futurs-collaborateurs/{futurId}/create-m4-contract
POST /hr/recrutement/futurs-collaborateurs/{futurId}/init-m6-onboarding

GET  /hr/recrutement/futurs-collaborateurs/{futurId}/checklist
POST /hr/recrutement/futurs-collaborateurs/{futurId}/checklist/{itemId}/check

POST /hr/recrutement/futurs-collaborateurs/{futurId}/documents/required
POST /hr/recrutement/futurs-collaborateurs/{futurId}/documents/upload (par candidat)
POST /hr/recrutement/futurs-collaborateurs/{futurId}/documents/verify

POST /hr/recrutement/futurs-collaborateurs/{futurId}/medical-visit/schedule
POST /hr/recrutement/futurs-collaborateurs/{futurId}/medical-visit/result

POST /hr/recrutement/futurs-collaborateurs/{futurId}/dpae/file

POST /hr/recrutement/futurs-collaborateurs/{futurId}/it-preparation
POST /hr/recrutement/futurs-collaborateurs/{futurId}/team-notification

POST /hr/recrutement/futurs-collaborateurs/{futurId}/cancel
     body: { reason }

POST /hr/recrutement/futurs-collaborateurs/{futurId}/activate-j1 (jour de prise de poste)
```

---

# 14. TABLES IMPLIQUÉES

### Nouvelles
- `future_employees`
- `pre_boarding_checklists`
- `pre_boarding_documents_required`
- `pre_boarding_documents_received`
- `medical_visits_scheduling`
- `dpae_submissions`
- `it_preparation_tasks`
- `team_notifications_log`
- `cancellations_log`

---

# 15. SYNTHÈSE

**Intégration M4 / M6** :
- Statut **"futur collaborateur"** transitoire entre acceptation et J1.
- Checklist pré-embauche complète (documents, médical, DPAE, IT, équipe).
- Création **automatique dossier M1** avec données candidat.
- Création **automatique contrat M4** via wizard pré-rempli.
- Déclenchement **parcours onboarding M6**.
- Collecte documents via espace candidat sécurisé.
- Visite médicale programmée et tracée.
- DPAE déposée auto à J-5.
- Préparation IT (accès en standby + activation J1).
- Notification équipe et désignation buddy.
- Activation J1 en cascade (M1, M4, M3, M6).

**Règles dures** :
- Tous documents pré-embauche reçus avant J1.
- DPAE déposée avant prise de poste (obligation légale).
- Visite médicale avant ou J1 (aptitude validée).
- Contrat M4 signé via ADVIST avant J1.
- Audit complet de la transition.
- Backup activé immédiatement si désistement.

---

*Fin spécification 11 — Intégration M4 / M6.*
