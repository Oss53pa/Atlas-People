# M5 RECRUTEMENT — ENTRETIENS
## Planification, types, comptes-rendus, panels, intégration calendriers
*God mode premium. Référence : 01_FONDATION.md, 05_CANDIDATURES.md, 06_EVALUATION_SCORING.md.*

---

# 0. POSITIONNEMENT

Les **entretiens** sont le **moment clé** du processus de recrutement : c'est là que se joue la décision finale d'embauche. Cette section couvre :
- **Planification** intelligente avec intégration Google Calendar / Outlook.
- **Types d'entretiens** (téléphonique, visio, présentiel, panel, mise en situation).
- **Templates** de questions par profil.
- **Comptes-rendus** structurés.
- **Génération automatique** liens visio (Meet, Teams, Zoom).
- **Convocations** avec confirmations.
- **Suivi no-show** et relances.

## 0.1 Routes

- `/hr/recrutement/entretiens` → Calendrier global entretiens
- `/hr/recrutement/entretiens/{entretienId}` → Détail entretien
- `/hr/recrutement/applications/{appId}/entretiens` → Entretiens d'une candidature
- `/hr/recrutement/applications/{appId}/entretiens/nouveau` → Programmer
- `/hr/recrutement/entretiens/templates` → Templates questions

---

# 1. TYPES D'ENTRETIENS

## 1.1 Catalogue

| Type | Durée typique | Acteurs | Objectif |
|------|---------------|---------|----------|
| **Téléphonique de pré-qualification** | 20-30 min | Recruteur | Vérifier basics, motivation, salaire, dispo |
| **Visio avec manager** | 45-60 min | Manager + Recruteur | Compétences techniques, fit équipe |
| **Visio avec RH** | 30-45 min | RRH | Fit culturel, projet pro, package |
| **Présentiel exploration** | 1-2h | Manager + RH | Approfondissement, visite site |
| **Présentiel finale** | 30-45 min | DRH ou DG | Décision finale, validation |
| **Panel** | 1-2h | 3-5 personnes | Sélection croisée, multi-perspectives |
| **Mise en situation / cas pratique** | 1-2h | Manager + experts | Évaluation comportementale réelle |
| **Présentation business case** | 1h | Comité | Test conceptualisation, présentation |
| **Entretien équipe peer** | 30 min | Futurs collègues | Validation fit équipe |
| **Test deuxième langue** | 30 min | Linguiste/RH | Vérification niveau langue déclaré |

## 1.2 Modèle de données

```sql
CREATE TABLE interviews (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  application_id UUID NOT NULL REFERENCES applications(id),
  
  -- Type
  interview_type TEXT NOT NULL,
  pipeline_stage_id UUID,
  sequence_order INT,         -- 1er, 2e, 3e entretien
  
  -- Planification
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  timezone TEXT,
  
  -- Modalité
  modality TEXT,              -- 'phone', 'video', 'in_person', 'hybrid'
  location TEXT,              -- adresse si présentiel
  video_link TEXT,            -- lien Meet/Teams/Zoom
  video_provider TEXT,
  
  -- Participants
  interviewers JSONB,         -- [{ user_id, role, presence_required }]
  candidate_confirmed BOOLEAN DEFAULT false,
  candidate_confirmed_at TIMESTAMPTZ,
  
  -- Calendrier externe
  external_calendar_event_id TEXT,
  external_calendar_provider TEXT,  -- 'google', 'outlook'
  
  -- Convocation
  invitation_sent_at TIMESTAMPTZ,
  invitation_template_id UUID,
  
  -- Préparation
  preparation_notes TEXT,
  questions_template_id UUID,
  documents_to_share UUID[],
  
  -- Compte-rendu
  status TEXT,                -- 'scheduled', 'completed', 'no_show', 'cancelled', 'rescheduled'
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  notes TEXT,
  evaluation_id UUID,         -- lien évaluation produite
  
  -- Reprogrammation
  rescheduled_from UUID,      -- ref vers entretien précédent annulé
  reschedule_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  audit_hash TEXT
);
```

---

# 2. PLANIFICATION INTELLIGENTE

## 2.1 Wizard de planification

```
┌──────────────────────────────────────────────────────────────────────┐
│ Programmer entretien - Awa DIABATÉ pour OFR-2026-0245                 │
├──────────────────────────────────────────────────────────────────────┤
│ TYPE                                                                  │
│  [Entretien manager (45 min) ▾]                                        │
│                                                                       │
│ MODALITÉ                                                              │
│  ○ Téléphonique                                                       │
│  ● Visioconférence                                                    │
│  ○ Présentiel                                                         │
│  ○ Hybride                                                            │
│                                                                       │
│ PARTICIPANTS                                                          │
│  Évaluateurs côté entreprise :                                        │
│   ☑ Hadja TIMITÉ (Manager DC) - obligatoire                            │
│   ☑ Aboubakar KONÉ (RRH) - obligatoire                                │
│   ☐ Cheick DIALLO (DG) - optionnel                                    │
│                                                                       │
│  Candidat : Awa DIABATÉ                                                │
│                                                                       │
│ CRÉNEAUX PROPOSÉS                                                     │
│  Recherche dans les agendas des participants (Google Calendar) :       │
│                                                                       │
│  ● Lundi 17/06 10:00 - 10:45 (tous disponibles) ⭐ Recommandé          │
│  ○ Mardi 18/06 14:00 - 14:45 (tous disponibles)                       │
│  ○ Mercredi 19/06 09:00 - 09:45 (Hadja + Aboubakar)                   │
│  ○ Jeudi 20/06 11:00 - 11:45 (tous disponibles)                       │
│                                                                       │
│  [↻ Proposer autres créneaux] [📅 Saisie manuelle]                     │
│                                                                       │
│ PROPOSER PLUSIEURS CRÉNEAUX AU CANDIDAT                               │
│  ● Oui, candidat choisit (recommandé)                                  │
│  ○ Non, créneau imposé                                                │
│                                                                       │
│ Sélectionner 2-3 créneaux à proposer :                                 │
│  ☑ Lundi 17/06 10:00                                                  │
│  ☑ Mardi 18/06 14:00                                                  │
│  ☑ Jeudi 20/06 11:00                                                  │
│                                                                       │
│ LIEN VISIO                                                             │
│  ● Google Meet (auto-généré)                                          │
│  ○ Microsoft Teams                                                    │
│  ○ Zoom                                                               │
│  ○ Lien personnalisé                                                  │
│                                                                       │
│ MESSAGE PERSONNALISÉ (option)                                          │
│  [TextArea pré-rempli avec template]                                   │
│                                                                       │
│ PRÉPARATION                                                           │
│  Template questions : [Cadre commercial confirmé ▾]                    │
│  Documents à transmettre : ☑ Brochure CRMC, ☐ Plan site                │
│                                                                       │
│ [Programmer + envoyer convocation]                                    │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.2 Logique de recherche de créneaux

EF `find-interview-slots` :
- Lit agendas Google Calendar / Outlook des participants côté entreprise.
- Identifie créneaux libres communs.
- Filtre selon horaires de travail (par défaut 09h-18h ouvrés).
- Filtre selon préférences candidat (si exprimées).
- Suggère top 5 créneaux par ordre de priorité.

## 2.3 Confirmation candidat

Candidat reçoit email avec :
- 2-3 créneaux proposés.
- Lien clic pour confirmer son choix.
- Espace candidat reflète le choix.

```
Email candidat - Proposition d'entretien

Bonjour Awa,

Suite à l'étude de votre candidature pour le poste de Chef de Projet Commercial, 
nous souhaiterions vous proposer un entretien avec Hadja TIMITÉ (Manager Direction 
Commerciale) et Aboubakar KONÉ (RRH).

Cet entretien sera en visioconférence (Google Meet) et durera environ 45 minutes.

Merci de cliquer sur le créneau de votre choix :

[ ✓ Lundi 17 juin à 10h00 ]
[ ✓ Mardi 18 juin à 14h00 ]
[ ✓ Jeudi 20 juin à 11h00 ]

[ Aucun ne me convient, proposer d'autres créneaux ]

Cordialement,
L'équipe Recrutement CRMC
```

## 2.4 Création événement calendrier

À confirmation candidat :
- Création événement Google Calendar / Outlook pour chaque participant + candidat.
- Lien visio inséré dans description.
- Rappels automatiques 1 jour avant + 1 heure avant.
- Pièces jointes (CV candidat, fiche poste).

---

# 3. TEMPLATES DE QUESTIONS

## 3.1 Bibliothèque

Atlas People livre des templates par profil :

```
Templates questions entretiens
├── COMMERCIAL
│   ├── TPL-INT-COMMERCIAL-BASE
│   ├── TPL-INT-COMMERCIAL-CONFIRMÉ
│   └── TPL-INT-COMMERCIAL-DIRECTEUR
├── FINANCE
│   ├── TPL-INT-FINANCE-COMPTABLE
│   └── TPL-INT-FINANCE-CONTROLEUR
├── RH
├── IT
├── DIRECTION
├── MOTIVATION
│   └── TPL-INT-MOTIVATION-UNIVERSEL
└── COMPORTEMENTAL
    └── TPL-INT-COMPORTEMENTAL-STAR
```

## 3.2 Structure template

```typescript
interface InterviewQuestionsTemplate {
  id: UUID;
  code: string;
  display_name: string;
  category: string;
  
  sections: {
    name: string;        // "Ouverture", "Technique", "Comportemental", etc.
    duration_minutes: number;
    questions: {
      text: string;
      type: 'open' | 'situation' | 'comportemental' | 'technique';
      objective: string;
      red_flags: string[];      // signaux d'alerte
      expected_indicators: string[];
    }[];
  }[];
}
```

## 3.3 Affichage pendant entretien

```
┌──────────────────────────────────────────────────────────────────────┐
│ ENTRETIEN EN COURS - Awa DIABATÉ                                      │
│ Durée prévue : 45 min · Temps écoulé : 12 min                          │
├──────────────────────────────────────────────────────────────────────┤
│ Section 1 : OUVERTURE (5 min)                                         │
│  ✅ Présentation mutuelle (effectuée)                                  │
│  ✅ Parcours du candidat (effectué)                                    │
│                                                                       │
│ Section 2 : TECHNIQUE COMMERCIAL (15 min)                              │
│  ▶ Décrivez votre méthodologie de prospection B2B                     │
│    [Notes ___________________________________]                         │
│    💡 Indicateurs : structuration, KPI, outils utilisés                │
│    🚨 Red flags : pas de méthodologie claire                           │
│                                                                       │
│  ○ Comment gérez-vous un compte client difficile ?                     │
│  ○ Donnez un exemple de négociation complexe (méthode STAR)            │
│  ○ Quels indicateurs suivez-vous pour piloter votre activité ?        │
│                                                                       │
│ Section 3 : MANAGEMENT (10 min)                                       │
│  ○ Décrivez votre style de management                                  │
│  ○ Comment recadrez-vous un collaborateur sous-performant ?            │
│                                                                       │
│ Section 4 : FIT & MOTIVATION (10 min)                                  │
│  ○ Pourquoi CRMC ? Pourquoi maintenant ?                               │
│  ○ Vos 3 valeurs professionnelles essentielles ?                       │
│                                                                       │
│ Section 5 : CLÔTURE (5 min)                                            │
│  ○ Avez-vous des questions ?                                          │
│  ○ Présentation des prochaines étapes                                  │
│                                                                       │
│ NOTES TRANSVERSES                                                     │
│ [TextArea libre pendant l'entretien]                                  │
│                                                                       │
│ [💾 Sauvegarder] [⏸ Pause] [✅ Terminer entretien]                     │
└──────────────────────────────────────────────────────────────────────┘
```

## 3.4 Saisie en temps réel

Pendant l'entretien, l'évaluateur peut :
- Cocher questions traitées.
- Saisir notes textuelles.
- Marquer signaux importants (red flags, points forts).
- Sauvegarder en continu (autosave).

À la fin → l'évaluation structurée (doc 06) est pré-remplie avec les notes saisies.

---

# 4. COMPTES-RENDUS

## 4.1 Génération assistée

Après l'entretien :
- Notes saisies → assistance PROPH3T pour structurer en compte-rendu.
- Suggestions de scores cohérents avec notes.
- Recommandation pré-remplie (modifiable).

## 4.2 Structure CR

```
┌──────────────────────────────────────────────────────────────────────┐
│ COMPTE-RENDU - Entretien Manager Awa DIABATÉ                          │
│ Date : Lundi 17/06 10h00-10h47                                         │
│ Évaluateurs : Hadja TIMITÉ (Manager), Aboubakar KONÉ (RRH)             │
├──────────────────────────────────────────────────────────────────────┤
│ CONTEXTE                                                              │
│  Entretien dans le cadre du recrutement Chef de Projet Commercial      │
│  pour la Direction Commerciale (Cosmos Yopougon).                     │
│                                                                       │
│ DÉROULÉ                                                                │
│  • Ouverture (5 min) : présentation candidate et entreprise           │
│  • Technique commercial (15 min) : approfondissement méthodologie     │
│  • Management (10 min) : style management, gestion équipe             │
│  • Fit & motivation (10 min) : projet pro, alignement valeurs         │
│  • Clôture (5 min) : questions candidate, prochaines étapes           │
│                                                                       │
│ POINTS FORTS                                                          │
│  ✅ Excellente structuration des réponses (méthode STAR maîtrisée)     │
│  ✅ Cas concrets pertinents (gestion compte 80M FCFA, retournement)    │
│  ✅ Style management collaboratif structuré (réunions hebdo, OKR)     │
│  ✅ Motivation alignée (projet long terme, valeurs CRMC)               │
│  ✅ Communication claire et posée                                      │
│                                                                       │
│ POINTS DE VIGILANCE                                                   │
│  ⚠ Expérience uniquement startup → adaptation environnement +1000 emp│
│  ⚠ Analyse financière correcte mais sans profondeur sur P&L          │
│                                                                       │
│ ÉVALUATION                                                            │
│  Cf. évaluation détaillée [#EVA-2026-1245]                             │
│  Score global : 4,3/5 (86/100)                                         │
│                                                                       │
│ RECOMMANDATION                                                        │
│  ✅ HIRE - À présenter pour entretien finale DRH+DG                    │
│                                                                       │
│ ANNEXES                                                               │
│  • CV candidate                                                       │
│  • Notes manuscrites entretien                                        │
│  • Évaluation détaillée                                               │
└──────────────────────────────────────────────────────────────────────┘
```

## 4.3 Validation et partage

Compte-rendu validé par évaluateur principal → archivé dans fiche candidat → visible autres évaluateurs et comité hiring.

---

# 5. PANELS

## 5.1 Concept

Pour postes stratégiques, un **panel** réunit plusieurs évaluateurs simultanément face au candidat :
- Manager opérationnel.
- RRH ou DRH.
- Membre direction.
- Éventuellement futur peer.

## 5.2 Avantages

- Multiples perspectives en un temps.
- Évaluation immédiatement convergente.
- Cohérence des questions/critères.

## 5.3 Animation

```
┌──────────────────────────────────────────────────────────────────────┐
│ Panel - Entretien finale Awa DIABATÉ                                  │
│ Mardi 24/06 14h00-15h30                                                │
│ Participants :                                                        │
│  • Hadja TIMITÉ (Manager DC) - animatrice                              │
│  • Cheick DIALLO (DG)                                                  │
│  • Aboubakar KONÉ (RRH)                                                │
│  • Marie SAMAKÉ (Manager opérationnel)                                 │
│  • Awa DIABATÉ (candidate)                                             │
├──────────────────────────────────────────────────────────────────────┤
│ STRUCTURE PANEL (1h30)                                                 │
│                                                                       │
│ • Tour de table introduction (15 min)                                  │
│ • Présentation candidate de son parcours (15 min)                      │
│ • Questions croisées par chaque participant (45 min)                   │
│   - 10 min par participant entreprise                                  │
│ • Questions de la candidate (10 min)                                   │
│ • Clôture et next steps (5 min)                                        │
│                                                                       │
│ APRÈS PANEL                                                           │
│  Chaque participant remplit son évaluation individuelle (15 min)       │
│  Convergence : visualisation côte à côte des 4 évaluations             │
│  Discussion 30 min entre évaluateurs (sans candidate)                  │
│  Décision finale collective                                            │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 6. CONVOCATIONS

## 6.1 Email type

```
Objet : Confirmation entretien - Chef de Projet Commercial CRMC

Bonjour Awa,

Nous avons le plaisir de confirmer votre entretien :

📅 Date : Lundi 17 juin 2026
🕐 Heure : 10h00 à 10h45 (heure d'Abidjan, GMT)
💻 Modalité : Visioconférence (Google Meet)
🔗 Lien : https://meet.google.com/abc-defg-hij

PARTICIPANTS CÔTÉ CRMC :
• Hadja TIMITÉ - Manager Direction Commerciale
• Aboubakar KONÉ - Responsable Ressources Humaines

PRÉPARATION
• Veuillez vous connecter 5 minutes avant
• Tenue professionnelle souhaitée
• Documents joints : brochure CRMC, présentation rôle

EN CAS D'EMPÊCHEMENT
Merci de nous contacter au plus tôt par retour de mail.

[ ✅ Confirmer ma présence ]    [ ❌ Annuler ]

À très bientôt,
L'équipe Recrutement CRMC
```

## 6.2 SMS de rappel

J-1 : "Bonjour, nous vous rappelons votre entretien CRMC demain à 10h00. Lien : ..."
J-0 1h avant : "Votre entretien commence dans 1h. Lien : ..."

## 6.3 No-show et relances

Si candidat ne se connecte pas / ne se présente pas :
- Attente 15 min.
- Tentative appel téléphonique.
- Marquage `no_show` après 30 min.
- Email automatique de relance proposant nouveau créneau.
- Si 2e no-show sans excuse : candidature passée en `rejected` automatiquement.

---

# 7. CALENDRIER GLOBAL ENTRETIENS

```
┌──────────────────────────────────────────────────────────────────────┐
│ Calendrier entretiens - Semaine du 17/06                              │
├──────────────────────────────────────────────────────────────────────┤
│ Filtres : [Évaluateur ▾] [Type ▾] [Offre ▾] [Statut ▾]                 │
├──────────────────────────────────────────────────────────────────────┤
│ LUN 17/06        │ MAR 18/06        │ MER 19/06        │ JEU 20/06      │
│ ──────────────── │ ──────────────── │ ──────────────── │ ────────────── │
│ 09h00 - Manager  │ 10h30 - Phone    │ 14h00 - Visio    │ 11h00 - Visio  │
│ DIABATÉ Awa      │ KONÉ Ibrahim     │ DIALLO Yao       │ BAH Fatou      │
│ OFR-2026-0245    │ OFR-2026-0248    │ OFR-2026-0245    │ OFR-2026-0245  │
│                   │                   │                   │                │
│ 10h00 - Manager  │ 14h00 - Manager  │                   │                │
│ DIABATÉ Awa ⏳    │ DIABATÉ Awa      │                   │                │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ STATS SEMAINE                                                         │
│  Total programmés : 12                                                │
│  Effectués : 7                                                        │
│  No-show : 1                                                          │
│  Reprogrammés : 1                                                     │
│  À venir : 4                                                          │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 8. APIS ENTRETIENS

```
GET  /hr/recrutement/entretiens/calendar?from=&to=&filters=
POST /hr/recrutement/applications/{appId}/entretiens
GET  /hr/recrutement/applications/{appId}/entretiens
GET  /hr/recrutement/entretiens/{entId}
PATCH /hr/recrutement/entretiens/{entId}
POST /hr/recrutement/entretiens/{entId}/find-slots
POST /hr/recrutement/entretiens/{entId}/send-invitation
POST /hr/recrutement/entretiens/{entId}/candidate-confirm
POST /hr/recrutement/entretiens/{entId}/reschedule
POST /hr/recrutement/entretiens/{entId}/cancel
POST /hr/recrutement/entretiens/{entId}/mark-completed
POST /hr/recrutement/entretiens/{entId}/mark-no-show
POST /hr/recrutement/entretiens/{entId}/notes (saisie temps réel)
POST /hr/recrutement/entretiens/{entId}/generate-cr (PROPH3T assist)
GET  /hr/recrutement/entretiens/templates
GET  /hr/recrutement/entretiens/templates/{tplId}
```

---

# 9. TABLES IMPLIQUÉES

### Nouvelles
- `interviews` (entretiens)
- `interview_participants` (qui participe)
- `interview_slots_proposed` (créneaux proposés candidat)
- `interview_questions_templates`
- `interview_notes_live` (notes temps réel)
- `interview_reports` (comptes-rendus)
- `interview_panels`
- `interview_reminders_sent`
- `external_calendar_sync_log`
- `interview_no_shows_log`

---

# 10. SYNTHÈSE

**Entretiens** :
- 10 types couverts (téléphonique → panel finale).
- **Planification intelligente** avec recherche créneaux Google Calendar / Outlook.
- Génération automatique liens visio (Meet, Teams, Zoom).
- Templates de questions par profil.
- **Saisie temps réel** des notes pendant entretien.
- **Génération assistée** compte-rendu PROPH3T.
- **Panels** structurés pour postes stratégiques.
- Convocations email + SMS.
- Gestion no-show et reprogrammation.

**Règles dures** :
- Calendrier participants synchronisé.
- Templates questions validés juridiquement.
- Compte-rendu obligatoire dans 48h post-entretien.
- 2 no-show sans excuse = rejet automatique.
- Audit chaîné.

---

*Fin spécification 07 — Entretiens.*
