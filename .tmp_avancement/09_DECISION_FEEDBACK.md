# M5 RECRUTEMENT — DÉCISION & FEEDBACK
## Comité hiring, votes, lettres réponse, gestion silence radio
*God mode premium. Référence : 01_FONDATION.md, 06_EVALUATION_SCORING.md.*

---

# 0. POSITIONNEMENT

La **décision de hiring** est l'**aboutissement** du processus de recrutement : à ce stade, un candidat va être retenu et les autres remerciés.

Cette section couvre :
- **Comité hiring** : décision collégiale documentée.
- **Mécanique de vote** structurée.
- **Lettres de réponse** personnalisées (acceptation, refus, shortlist).
- **Gestion du silence radio** (relances candidats).
- **Mesure satisfaction candidat** post-process.

## 0.1 Routes

- `/hr/recrutement/applications/{appId}/decision` → Décision sur candidature
- `/hr/recrutement/comites-hiring` → Liste comités planifiés
- `/hr/recrutement/comites-hiring/{committeeId}` → Détail comité
- `/hr/recrutement/feedbacks` → Suivi feedbacks envoyés

---

# 1. COMITÉ HIRING

## 1.1 Concept

Le **comité hiring** réunit les acteurs clés pour décider collectivement de l'embauche. Composition typique :
- **Recruteur principal** (animateur, rapporteur).
- **Manager opérationnel** (validation technique + fit équipe).
- **RRH** (validation process + alignment RH).
- **DRH** (validation finale + autorité signature).
- Éventuellement **DG** pour postes stratégiques.

## 1.2 Quand ?

- À l'issue de toutes les évaluations (entretiens + tests + références).
- Sur shortlist de 2-5 candidats finals.
- Décision : retenir 1, garder 1-2 en backup, écarter les autres.

## 1.3 Modèle de données

```sql
CREATE TABLE hiring_committees (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  job_offer_id UUID NOT NULL REFERENCES job_offers(id),
  
  -- Programmation
  scheduled_at TIMESTAMPTZ,
  location TEXT,
  
  -- Composition
  members JSONB,           -- [{ user_id, role, vote_weight }]
  
  -- Candidats évalués
  shortlisted_application_ids UUID[],
  
  -- Statut
  status TEXT,             -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  -- Décision
  decision TEXT,           -- 'hire', 'shortlist_backup', 'no_hire_all', 'further_eval'
  hired_application_id UUID,
  backup_application_ids UUID[],
  rejected_application_ids UUID[],
  
  -- Motivations
  decision_summary TEXT,
  detailed_rationale TEXT,
  
  -- Votes
  vote_log JSONB,          -- détail des votes
  consensus_reached BOOLEAN,
  
  -- Audit
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  audit_hash TEXT
);
```

## 1.4 Layout préparation comité

```
┌──────────────────────────────────────────────────────────────────────┐
│ Comité hiring - OFR-2026-0245 Chef de Projet Commercial                │
│ Programmé : Vendredi 28/06 14h00-15h30                                 │
├──────────────────────────────────────────────────────────────────────┤
│ MEMBRES COMITÉ                                                        │
│  • Aboubakar KONÉ (Recruteur, animateur)                               │
│  • Hadja TIMITÉ (Manager DC, voix forte technique)                     │
│  • Mawuena ADJEI (RRH, voix process)                                   │
│  • Cheick DIALLO (DG, validation finale)                              │
├──────────────────────────────────────────────────────────────────────┤
│ CANDIDATS FINALS (3 shortlistés)                                       │
│                                                                       │
│ #1 Awa DIABATÉ                  Score moyen 88,5 ★★★★★                │
│    Évaluations : CV 88 / Phone 85 / Manager 92 / DG 89                 │
│    Tests : Commercial 82 / Big Five OK                                 │
│    Références : 3/3 positives                                          │
│    Disponibilité : Préavis 3 mois (01/10)                              │
│    Salaire demandé : 1 050 000 FCFA (dans fourchette)                  │
│    [📄 Dossier complet]                                                │
│                                                                       │
│ #2 Ibrahim KOUASSI              Score moyen 83 ★★★★                    │
│    Évaluations : CV 85 / Phone 82 / Manager 80 / DG 85                 │
│    Tests : Commercial 78 / Big Five OK                                 │
│    Références : 2/3 positives, 1 mitigée                              │
│    Disponibilité : Immédiate                                          │
│    Salaire demandé : 950 000 FCFA                                      │
│    [📄 Dossier complet]                                                │
│                                                                       │
│ #3 Mariam BAMBA                  Score moyen 79 ★★★★                    │
│    Évaluations : CV 82 / Phone 78 / Manager 78 / DG 79                 │
│    Tests : Commercial 75 / Big Five OK                                 │
│    Références : En cours (J-2 prévu)                                   │
│    Disponibilité : 2 mois                                              │
│    Salaire demandé : 900 000 FCFA                                      │
│    [📄 Dossier complet]                                                │
├──────────────────────────────────────────────────────────────────────┤
│ DOCUMENTS PRÉPARATOIRES                                                │
│  • Synthèse comparative 3 candidats                                    │
│  • CVs                                                                │
│  • Comptes-rendus entretiens                                          │
│  • Résultats tests                                                    │
│  • Synthèses références                                               │
│  [⬇ Télécharger pack complet]                                         │
├──────────────────────────────────────────────────────────────────────┤
│ [Lancer comité]                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

## 1.5 Animation comité

```
┌──────────────────────────────────────────────────────────────────────┐
│ Comité en cours                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ ORDRE DU JOUR                                                         │
│  1. Rappel besoin + critères clés (5 min)                              │
│  2. Présentation candidat #1 Awa (10 min)                              │
│  3. Présentation candidat #2 Ibrahim (10 min)                          │
│  4. Présentation candidat #3 Mariam (10 min)                           │
│  5. Discussion comparative (15 min)                                    │
│  6. Vote individuel (5 min)                                            │
│  7. Consolidation + décision (10 min)                                  │
│  8. Plan d'action post-décision (5 min)                                │
│                                                                       │
│ VOTE INDIVIDUEL (anonyme)                                              │
│  Chaque membre vote pour son candidat préféré :                        │
│   ○ Awa DIABATÉ                                                        │
│   ○ Ibrahim KOUASSI                                                    │
│   ○ Mariam BAMBA                                                       │
│   ○ Aucun (ne pas embaucher)                                          │
│   ○ Évaluation complémentaire requise                                  │
│                                                                       │
│  Plus : note de conviction (1-5) sur le choix.                         │
│                                                                       │
│ [Lancer vote]                                                         │
└──────────────────────────────────────────────────────────────────────┘
```

## 1.6 Résultat vote

```
┌──────────────────────────────────────────────────────────────────────┐
│ Résultat du vote                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ Awa DIABATÉ        : 3 votes (Aboubakar, Hadja, Mawuena) ⭐            │
│ Ibrahim KOUASSI    : 1 vote (Cheick - "expérience corporate")          │
│ Mariam BAMBA       : 0 vote                                            │
│ Aucun              : 0 vote                                            │
│                                                                       │
│ Notes de conviction moyennes :                                         │
│  Awa : 4,7/5 (très forte conviction)                                   │
│  Ibrahim : 3,5/5 (conviction modérée)                                  │
│                                                                       │
│ DÉCISION (majorité) : Embaucher Awa DIABATÉ                            │
│ Backup : Ibrahim KOUASSI (si Awa refuse)                              │
│                                                                       │
│ DÉBAT FINAL                                                           │
│  Cheick s'aligne : "Awa est plus forte sur le leadership et le         │
│  potentiel d'évolution. Ibrahim était mon second choix."               │
│                                                                       │
│ ✅ CONSENSUS ATTEINT                                                  │
│                                                                       │
│ [Confirmer décision]                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

## 1.7 Cas de désaccord

Si pas de consensus :
- Tour de table approfondi.
- Vote pondéré (DRH a voix prépondérante).
- Si toujours blocage : décision DRH+DG en différé après débat.

---

# 2. POST-DÉCISION : COMMUNICATIONS

## 2.1 Plan de communication

```
┌─ Action immédiate ─────────────────────────────────────────────────┐
│                                                                    │
│ CANDIDAT RETENU                                                    │
│  → Appel téléphonique manager le jour-même (annonce verbale)        │
│  → Email confirmation J+1 avec proposition d'offre formelle         │
│                                                                    │
│ CANDIDATS BACKUP                                                   │
│  → Email J+2 expliquant : pas retenu en 1er choix mais shortlistés │
│  → Demande accord pour rester en backup (1-2 semaines)             │
│                                                                    │
│ CANDIDATS NON RETENUS                                              │
│  → Email J+3 avec lettre de refus personnalisée                     │
│  → Optionnel : feedback constructif si demandé                      │
│                                                                    │
│ CANDIDATS PRÉCÉDEMMENT ÉLIMINÉS (pré-qualif)                       │
│  → Email J+3 (déjà notifiés mais relance courtoise)                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

# 3. LETTRES DE RÉPONSE

## 3.1 Templates

### Lettre acceptation (verbale + email)

```
Objet : Excellente nouvelle - Proposition d'embauche CRMC

Bonjour Awa,

Suite à votre entretien finale du 28 juin et au comité de sélection qui s'est 
tenu le même jour, c'est avec un grand plaisir que je vous annonce que nous 
souhaitons vous proposer le poste de Chef de Projet Commercial au sein de la 
Direction Commerciale de CRMC SA.

Votre profil, vos compétences en management commercial et en pilotage de projets, 
ainsi que votre forte motivation pour rejoindre nos équipes, nous ont convaincus.

Nous vous adresserons dans les 48 heures suivantes une proposition d'offre 
formelle détaillant les conditions de votre embauche (rémunération, date de 
prise de poste, avantages).

Nous restons à votre disposition pour tout échange préalable.

Très cordialement,

Hadja TIMITÉ
Manager Direction Commerciale - CRMC SA
+225 27 22 ...
```

### Lettre refus (personnalisée)

```
Objet : Suite à votre candidature - Poste Chef de Projet Commercial

Bonjour Mariam,

Nous vous remercions sincèrement pour le temps consacré à notre processus de 
recrutement pour le poste de Chef de Projet Commercial.

Votre parcours et vos compétences ont retenu toute notre attention. Cependant, 
après mûre réflexion et au regard des spécificités du poste, nous avons retenu 
un autre profil dont l'expérience correspond plus précisément à nos besoins 
actuels.

Cette décision n'enlève rien à la qualité de votre candidature. Nous avons 
particulièrement apprécié [point fort spécifique].

Nous gardons précieusement votre profil dans notre vivier de talents et 
n'hésiterons pas à revenir vers vous pour de prochaines opportunités qui 
correspondraient davantage à votre parcours.

Si vous le souhaitez, je peux vous proposer un échange téléphonique de 
15 minutes pour vous donner un feedback constructif sur votre candidature.

Nous vous souhaitons plein succès dans la suite de votre recherche.

Cordialement,

Aboubakar KONÉ
Responsable Ressources Humaines - CRMC SA
```

### Lettre shortlist backup

```
Objet : Votre candidature CRMC - Statut

Bonjour Ibrahim,

Suite à notre processus de recrutement pour le poste de Chef de Projet Commercial, 
nous avons retenu votre candidature en tant que candidat shortlisté.

Nous avons fait notre choix initial sur un autre profil, mais votre candidature 
nous a vivement intéressés. Nous souhaitons savoir si vous accepteriez de rester 
en backup pendant les 15 prochains jours.

Cela signifie que si le candidat retenu venait à se désister, nous reviendrions 
vers vous immédiatement avec une proposition d'offre.

Merci de nous confirmer votre accord ou refus sous 48h.

Cordialement,

Aboubakar KONÉ
```

## 3.2 Personnalisation PROPH3T

PROPH3T génère des lettres **personnalisées** :
- Mentionne un point fort spécifique du candidat.
- Adapte le ton à la maturité professionnelle.
- Évite les formulations type "copy-paste" qui décrédibilisent.

## 3.3 Workflow envoi

```
[Décision validée]
   ↓
Génération lettres par PROPH3T (drafts)
   ↓
Validation manuelle recruteur (modification possible)
   ↓
Validation finale RRH si refus important
   ↓
Envoi groupé
   ↓
Suivi accusés réception
```

## 3.4 Layout interface envoi

```
┌──────────────────────────────────────────────────────────────────────┐
│ Communications post-comité                                            │
├──────────────────────────────────────────────────────────────────────┤
│ DESTINATAIRES                                                         │
│                                                                       │
│ ✅ Awa DIABATÉ (HIRED)                                                │
│    Type : Proposition d'embauche                                       │
│    Modalité : Appel + Email                                           │
│    [Voir/Modifier lettre]                                             │
│                                                                       │
│ ✅ Ibrahim KOUASSI (BACKUP)                                           │
│    Type : Lettre shortlist backup                                     │
│    Modalité : Email                                                   │
│    [Voir/Modifier lettre]                                             │
│                                                                       │
│ ✅ Mariam BAMBA (REJECTED)                                            │
│    Type : Lettre refus personnalisée                                  │
│    Modalité : Email                                                   │
│    [Voir/Modifier lettre]                                             │
│                                                                       │
│ ✅ 5 candidats éliminés en pré-qualif                                  │
│    Type : Notification standard                                        │
│    Modalité : Email                                                   │
│    [Voir lettre type]                                                 │
│                                                                       │
│ ENVOI                                                                 │
│  ☑ Vérifier toutes les lettres                                         │
│  ☑ Programmer envois (échelonnés sur 24-48h)                          │
│                                                                       │
│ [Envoyer maintenant] [Programmer]                                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 4. GESTION DU SILENCE RADIO

## 4.1 Anti-silence radio

Un des **principaux points de frustration candidats** : ne jamais avoir de retour.

Atlas People enforce techniquement :
- **Notification automatique** à chaque changement de statut (transparence pipeline).
- **Lettre de refus obligatoire** à toute candidature rejetée.
- **SLA 7 jours** maximum après dépôt pour 1er retour.
- **Alertes recruteur** si SLA dépassé.
- **Dashboard** des candidatures en silence depuis > 7j.

## 4.2 Dashboard silence

```
┌──────────────────────────────────────────────────────────────────────┐
│ ⚠ Candidatures en attente de réponse                                  │
├──────────────────────────────────────────────────────────────────────┤
│ DEPUIS PLUS DE 7 JOURS SANS RETOUR (12)                               │
│                                                                       │
│ Candidat            │ Offre        │ Statut        │ Reçu il y a     │
│ ──────────────────  │ ──────────── │ ─────────────  │ ─────────────── │
│ Test PIERRE 12      │ OFR-0245     │ Nouveau       │ 9 jours ⚠       │
│ Aïssa DIA          │ OFR-0248     │ Pré-qualif    │ 11 jours ⚠      │
│ Yao KOUAKOU        │ OFR-0252     │ Évaluation    │ 14 jours ⚠⚠     │
│ ...                                                                   │
│                                                                       │
│ ACTIONS RAPIDES                                                       │
│  [Envoyer rappel masse] [Marquer en relance prioritaire]              │
├──────────────────────────────────────────────────────────────────────┤
│ DEPUIS PLUS DE 14 JOURS (3)                                           │
│  ⚠⚠⚠ Risque marque employeur - À traiter en URGENCE                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 5. SATISFACTION CANDIDAT

## 5.1 Enquête post-process

Après clôture (positive ou négative) :
- Email automatique J+7 avec mini-enquête (3-5 questions).
- Anonyme.
- Score sur 5 étoiles + commentaire libre.

## 5.2 Questions type

```
1. Comment évaluez-vous la clarté du processus de recrutement ? (1-5)
2. La communication avec l'équipe recrutement a-t-elle été satisfaisante ? (1-5)
3. Les délais entre étapes étaient-ils acceptables ? (1-5)
4. Recommanderiez-vous CRMC à d'autres candidats ? (NPS 0-10)
5. Commentaire libre : que pourrions-nous améliorer ?
```

## 5.3 Indicateurs suivis

- **Candidate Experience Score** (CXS) : moyenne notes 1-3.
- **Candidate NPS** : promoteurs - détracteurs.
- **Taux de réponse enquête**.
- **Évolution sur 12 mois**.

## 5.4 Reporting

Dashboard mensuel avec :
- CXS global et par recruteur.
- Tendances.
- Verbatims (commentaires anonymisés).
- Recommandations d'amélioration.

---

# 6. APIS DÉCISION & FEEDBACK

```
POST /hr/recrutement/offres/{offreId}/comite-hiring
GET  /hr/recrutement/comites-hiring/{committeeId}
POST /hr/recrutement/comites-hiring/{committeeId}/start
POST /hr/recrutement/comites-hiring/{committeeId}/vote
POST /hr/recrutement/comites-hiring/{committeeId}/decide
POST /hr/recrutement/comites-hiring/{committeeId}/cancel

POST /hr/recrutement/applications/{appId}/decision
     body: { decision, comments }

POST /hr/recrutement/applications/{appId}/lettre-acceptation/generate (PROPH3T)
POST /hr/recrutement/applications/{appId}/lettre-refus/generate (PROPH3T)
POST /hr/recrutement/applications/{appId}/lettre-backup/generate (PROPH3T)
POST /hr/recrutement/applications/{appId}/lettre/send
GET  /hr/recrutement/applications/{appId}/communications

GET  /hr/recrutement/silence-radio?days_min=7
POST /hr/recrutement/applications/bulk-reminder

POST /hr/recrutement/applications/{appId}/satisfaction-survey/send
GET  /hr/recrutement/satisfaction/dashboard?period=
```

---

# 7. TABLES IMPLIQUÉES

### Nouvelles
- `hiring_committees`
- `hiring_committee_members`
- `hiring_committee_votes`
- `application_decisions`
- `candidate_letters_sent`
- `candidate_letter_templates`
- `candidate_satisfaction_surveys`
- `candidate_satisfaction_responses`
- `silence_radio_alerts`

---

# 8. SYNTHÈSE

**Décision & Feedback** :
- **Comité hiring** structuré avec vote anonyme + débat.
- **Lettres personnalisées** (acceptation, refus, shortlist) générées par PROPH3T.
- **Anti-silence radio** technique enforced (SLA 7j, dashboard).
- **Enquête satisfaction** candidat post-process.
- **CXS + NPS** mesurés et suivis.

**Règles dures** :
- Décision hire = consensus comité (sinon décision DRH+DG).
- Lettres personnalisées obligatoires (pas de copy-paste).
- Aucune candidature sans retour > 14 jours.
- Audit chaîné de toutes décisions.
- Anonymat votes comité préservé.

---

*Fin spécification 09 — Décision & feedback.*
