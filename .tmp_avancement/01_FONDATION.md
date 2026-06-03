# M5 RECRUTEMENT — FONDATION
## Architecture, principes, accès, intégrations, public, KPI
*God mode premium. Référence : M4 ADMIN RH, M1 Dossier collaborateur, M8 Évaluations.*

---

# 0. POSITIONNEMENT DU MODULE M5

## 0.1 Vision

**M5 RECRUTEMENT** est l'**ATS (Applicant Tracking System)** d'Atlas People. Il couvre **tout le cycle de recrutement** depuis l'expression d'un besoin jusqu'à l'intégration effective d'un collaborateur.

C'est le **point d'entrée** dans l'entreprise pour tout futur collaborateur, et donc le **premier point de contact** entre l'organisation et son futur employé. La qualité de l'expérience candidat dans M5 conditionne :
- La **marque employeur** (réputation auprès du marché du travail).
- La **qualité des recrutements** (matching candidat-poste).
- L'**efficacité opérationnelle** RH (time-to-hire, coût).
- La **conformité** (RGPD, non-discrimination).

M5 alimente M4 (création de contrat à l'embauche) et M6 (parcours d'onboarding).

## 0.2 Périmètre

```
┌─────────────────────────────────────────────────────────────────────┐
│                    M5 RECRUTEMENT                                    │
│                                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │
│  │ BESOIN          │ │ OFFRE D'EMPLOI  │ │ DIFFUSION       │       │
│  │ Demande poste   │ │ Rédaction       │ │ Site carrière   │       │
│  │ Validation 4-eye│ │ Modèles         │ │ Multiposting    │       │
│  │ Budget          │ │ Multilingue     │ │ Réseaux sociaux │       │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘       │
│                                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │
│  │ CANDIDATURES    │ │ ÉVALUATION      │ │ ENTRETIENS      │       │
│  │ Pipeline kanban │ │ Grilles         │ │ Planification    │       │
│  │ Parsing CV IA   │ │ Scoring         │ │ Comptes-rendus   │       │
│  │ Anti-doublons   │ │ Matching IA     │ │ Panels           │       │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘       │
│                                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │
│  │ TESTS           │ │ DÉCISION        │ │ OFFRE           │       │
│  │ Techniques      │ │ Comité hiring   │ │ Génération      │       │
│  │ Psychométriques │ │ Feedback        │ │ Négociation     │       │
│  │ Assessment      │ │ Lettre refus    │ │ Acceptation     │       │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘       │
│                                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │
│  │ INTÉGRATION     │ │ COOPTATION      │ │ MARQUE EMP.     │       │
│  │ Bascule M4      │ │ Programme       │ │ Site carrière   │       │
│  │ Onboarding M6   │ │ Primes          │ │ Attractivité    │       │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘       │
│                                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │
│  │ RGPD            │ │ REPORTING       │ │ AUDIT           │       │
│  │ Consentements   │ │ Funnel          │ │ Chaîne SHA-256  │       │
│  │ Non-discrim.    │ │ Time-to-hire    │ │ Anti-fraude     │       │
│  │ Droits candidat │ │ Quality of hire │ │                 │       │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

## 0.3 Hors périmètre M5

- **Onboarding pré-embauche détaillé** (parcours intégration 90 jours) → M6
- **Création contrat** → M4 (M5 fournit les données, M4 exécute)
- **Évaluation post-embauche** → M8
- **Formation** → M11
- **Gestion mobilité interne** → M10 (recrutement INTERNE peut chevaucher légèrement)

---

# 1. ARCHITECTURE TECHNIQUE

## 1.1 Stack

Identique au standard Atlas Studio :
- **Frontend** : React 18 + TypeScript + Tailwind + Zustand + React Query
- **Backend** : Supabase (PostgreSQL 16, RLS, Edge Functions Deno, Realtime, Storage)
- **Calendrier** : intégration Google Calendar API + Microsoft Graph (Outlook) pour planification entretiens
- **Visio** : intégration Google Meet, Microsoft Teams, Zoom (génération automatique liens)
- **Parsing CV** : Tesseract OCR + PROPH3T Ollama pour extraction structurée
- **Multiposting** : connecteurs LinkedIn API, Indeed API, agrégateurs locaux (Novojob, JobAfrique, etc.)
- **Site carrière** : sous-domaine personnalisable (recrutement.{tenant}.atlas-people.com)
- **Tests techniques** : intégrations HackerRank, Codility (option) OU tests internes
- **Tests psychométriques** : intégration partenaires (option) OU tests internes
- **Notifications** : email + SMS (CinetPay) + portail candidat

## 1.2 Routing

```
/hr/recrutement                              → Cockpit recrutement
/hr/recrutement/besoins                      → Liste besoins recrutement
/hr/recrutement/besoins/nouveau              → Wizard nouveau besoin
/hr/recrutement/besoins/{besoinId}           → Détail besoin
/hr/recrutement/offres                       → Liste offres publiées
/hr/recrutement/offres/nouvelle              → Wizard nouvelle offre
/hr/recrutement/offres/{offreId}             → Détail offre
/hr/recrutement/offres/{offreId}/candidats   → Pipeline candidatures
/hr/recrutement/candidats                    → Vue globale candidats
/hr/recrutement/candidats/{candidatId}       → Fiche candidat
/hr/recrutement/entretiens                   → Calendrier entretiens
/hr/recrutement/entretiens/{entretienId}    → Détail entretien
/hr/recrutement/tests                        → Catalogue tests
/hr/recrutement/tests/{testId}/passations    → Suivi passations
/hr/recrutement/offres-emission              → Offres en cours négo.
/hr/recrutement/cooptation                   → Programme cooptation
/hr/recrutement/marque-employeur             → Gestion site carrière
/hr/recrutement/reporting                    → Reporting + KPI
/hr/recrutement/audit                        → Audit & conformité
/hr/recrutement/parametres                   → Paramètres (modèles, workflows)

/career/{tenant_slug}                        → Site carrière public (front)
/career/{tenant_slug}/offre/{slug}           → Offre publique
/career/{tenant_slug}/candidature            → Formulaire candidature
/career/{tenant_slug}/mon-espace             → Espace candidat
```

## 1.3 Modèle de domaine

```
Société
  ├── Besoins de recrutement (1..N)
  │     └── Offres d'emploi (1..N par besoin)
  │           ├── Canaux de diffusion (1..N)
  │           └── Candidatures (0..N)
  │                 ├── Évaluations (0..N)
  │                 ├── Entretiens (0..N)
  │                 ├── Tests passés (0..N)
  │                 ├── Documents (CV, LM, diplômes)
  │                 └── Statut pipeline
  │
  └── Programme cooptation
        ├── Cooptations (0..N)
        └── Primes versées (0..N)
```

---

# 2. PUBLIC UTILISATEUR & ACCÈS

## 2.1 Rôles M5

| Rôle | Description | Accès typique |
|------|-------------|---------------|
| **Recruteur** | Opérationnel sourcing, gestion candidats | Pipeline, candidats, entretiens |
| **Chargé recrutement** | Pilotage opérationnel, coordination | + édition offres, planification |
| **Responsable recrutement** | Pilotage stratégique, validation | + validation offres, KPI |
| **Manager opérationnel** | Demande besoin, conduit entretiens | Besoins (sa team), entretiens, feedbacks |
| **RRH** | Validation, signature offres | + validation budget, signature |
| **DRH** | Pilotage stratégique, validation finale | + validation budget global, KPI |
| **DAF** | Validation budget poste | + validation impact masse salariale |
| **Juriste social** | Conformité RGPD, non-discrimination | + audit conformité |
| **Comité hiring** | Décision recrutement | + accès dossier candidat final, vote |
| **Auditeur** | Lecture totale | Audit log, conformité |
| **Candidat (externe)** | Postuler, suivre sa candidature | Espace candidat externe |

## 2.2 Matrice des pouvoirs M5

```
┌────────────────────────────────────────────────────────────────────────┐
│ Opération                       │ Initiation │ Valid. N1 │ Valid. N2     │
├────────────────────────────────────────────────────────────────────────┤
│ Création besoin recrutement     │ Manager    │ RRH       │ DRH+DAF      │
│ Validation budget poste         │ —          │ DAF       │ DG (si >50M) │
│ Création offre depuis besoin    │ Recruteur  │ Resp. rec.│ —            │
│ Publication offre               │ Recruteur  │ Resp. rec.│ —            │
│ Diffusion multicanal payante    │ Recruteur  │ Resp. rec.│ DAF (si >5M) │
│ Saisie candidature manuelle     │ Recruteur  │ —         │ —            │
│ Évaluation candidat             │ Recruteur  │ —         │ —            │
│ Planification entretien         │ Recruteur  │ —         │ —            │
│ Décision élimination candidat   │ Recruteur  │ Manager   │ —            │
│ Décision passage en finale      │ Manager    │ Resp. rec.│ —            │
│ Décision hiring (offre)         │ Comité     │ DRH       │ —            │
│ Génération lettre offre         │ Recruteur  │ DRH       │ —            │
│ Signature offre                 │ —          │ —         │ DRH (ADVIST) │
│ Acceptation offre par candidat  │ Candidat   │ —         │ —            │
│ Bascule en contrat M4           │ Recruteur  │ Chargé adm│ DRH          │
│ Configuration programme coopt.  │ Resp. rec. │ DRH       │ —            │
│ Versement prime cooptation      │ Resp. rec. │ DRH       │ DAF          │
│ Personnalisation site carrière  │ Resp. rec. │ DRH       │ Marketing    │
│ Suppression candidature (RGPD)  │ Juriste    │ DRH       │ —            │
│ Export massif données candidats │ —          │ —         │ DRH+Juriste  │
└────────────────────────────────────────────────────────────────────────┘
```

## 2.3 Règle dure d'accès

**Aucune décision de hiring (offre finale) sans validation comité hiring + DRH.** Pas d'exception.

**Tout traitement de données candidat** doit respecter le **consentement RGPD** explicite et les **principes de non-discrimination** OHADA.

---

# 3. PRINCIPES FONDAMENTAUX

## 3.1 Expérience candidat first

Chaque interaction avec le candidat doit être :
- **Transparente** : statut visible à tout moment.
- **Respectueuse** : feedback systématique (pas de silence radio).
- **Rapide** : time-to-response ≤ 7 jours après dépôt.
- **Personnalisée** : communication adaptée au profil.
- **Conforme** : RGPD respecté à chaque étape.

C'est le **premier point de contact** avec l'employeur, il conditionne la marque employeur.

## 3.2 Cycle structuré standardisé

Tout candidat suit un **pipeline standardisé** avec étapes claires :
1. Candidature reçue
2. Pré-qualification (CV review)
3. Test technique/psychométrique (si applicable)
4. Entretien recruteur
5. Entretien manager
6. Entretien finale (DRH ou DG selon poste)
7. Vérification références
8. Comité hiring
9. Offre
10. Acceptation
11. Pré-embauche
12. Embauche effective

Chaque étape a des **acteurs définis**, des **outils** et des **SLA**.

## 3.3 Non-discrimination

Le système enforce techniquement :
- **Champs interdits** dans les critères de tri : âge, genre, nationalité (sauf justification objective), religion, situation familiale, handicap (sauf adaptation poste).
- **Détection algorithmique** des biais dans les évaluations (alertes si pattern discriminatoire détecté).
- **Logs** de toutes les décisions pour audit.
- **Validation Juriste** sur les critères d'évaluation.

## 3.4 RGPD by design

- Consentement explicite à chaque dépôt de candidature.
- Durée de conservation paramétrable (par défaut 2 ans après dernière interaction).
- Droit d'accès, modification, suppression respecté.
- Anonymisation automatique des données candidats non retenus après délai.
- Pas de transfert de données hors zone RGPD-compatible sans garanties.

## 3.5 IA = assistance, pas décision

PROPH3T (Ollama) est utilisé pour :
- **Parsing CV** : extraction structurée (nom, expérience, compétences, formation).
- **Matching candidat-offre** : score d'adéquation suggéré.
- **Rédaction** : suggestion textes offres, lettres réponse.
- **Détection biais** : alertes sur évaluations potentiellement discriminatoires.
- **Synthèse** : résumé d'un dossier candidat.

**Jamais** PROPH3T ne décide d'éliminer, retenir, ou hiérarchiser un candidat. C'est toujours le **recruteur humain** qui valide.

## 3.6 Multilingue

Tous les éléments candidat-facing sont multilingues :
- Français (langue principale UEMOA/CEMAC).
- Anglais (postes internationaux, expatriés).
- Bilingue (cas spécifiques).

---

# 4. INTÉGRATIONS AVEC AUTRES MODULES

## 4.1 Avec M1 Dossier collaborateur

- Candidat retenu → création dossier M1 avec données pré-remplies.
- Réutilisation des données candidats (état civil, contacts, formation).

## 4.2 Avec M4 Admin RH

- **Bascule contrat** : candidat retenu → wizard création contrat M4 pré-rempli avec données candidat.
- Modèle contrat suggéré selon type poste.

## 4.3 Avec M6 Onboarding (à venir)

- Candidat acceptant offre → déclenchement parcours onboarding pré-embauche.
- Préparation poste, équipement, comptes SI, etc.

## 4.4 Avec M8 Évaluations

- Évaluation 90 jours post-embauche → boucle de feedback sur qualité du recrutement.

## 4.5 Avec M9 Compétences

- Compétences requises définies dans l'offre → matching avec référentiel M9.
- Compétences détectées sur CV candidat → enrichissement référentiel.

## 4.6 Avec M10 Carrières (recrutement interne)

- Postes ouverts visibles aux collaborateurs internes via portail collaborateur (mobilité interne).
- Candidatures internes traitées dans M5 avec workflow spécifique.

## 4.7 Avec M3 Paie

- Définition fourchette de rémunération du poste → cohérence avec grille salariale M3.
- Validation budget poste = impact masse salariale projeté.

## 4.8 Avec Atlas Studio Core

- SSO via `@atlas-studio/auth-sdk`.
- Tenant & souscription.
- Utilisateurs externes (candidats) gérés avec auth dédiée.

## 4.9 Avec DocJourney

- Templates offres, lettres réponse, lettres refus, contrats provisoires.
- Personnalisable par tenant.

## 4.10 Avec ADVIST

- Signature offre par DRH (employeur).
- Signature acceptation par candidat.

## 4.11 Avec calendriers externes

- Google Calendar API : planification entretiens dans agenda recruteur/manager.
- Microsoft Graph : équivalent Outlook.
- Génération automatique liens visio (Meet, Teams, Zoom).

## 4.12 Avec jobboards

- LinkedIn Talent Hub (API).
- Indeed (API).
- Glassdoor (API).
- Jobboards locaux : Novojob, JobAfrique, EmploisDakar, etc.
- Multiposting via partenaires agrégateurs (Broadbean, etc.) en option.

---

# 5. CYCLE DE VIE TYPIQUE D'UNE OFFRE

```
1. EXPRESSION DU BESOIN
   ↓
   Manager exprime besoin (création/remplacement poste)
   Validation budget (DAF) + accord DRH
   ↓
2. RÉDACTION DE L'OFFRE
   ↓
   Recruteur rédige offre (modèle DocJourney)
   Validation Responsable recrutement
   ↓
3. PUBLICATION
   ↓
   Publication site carrière
   Diffusion multicanal (jobboards, réseaux sociaux)
   Activation cooptation interne
   ↓
4. SOURCING ACTIF (optionnel)
   ↓
   Chasse sur LinkedIn, bases CV
   Approche directe candidats
   ↓
5. RÉCEPTION CANDIDATURES
   ↓
   Candidatures arrivent (site carrière, jobboards, manuel)
   Parsing CV automatique PROPH3T
   Détection doublons
   ↓
6. PRÉ-QUALIFICATION
   ↓
   Recruteur trie candidatures
   Score de matching IA
   Première sélection
   ↓
7. ÉVALUATION
   ↓
   Tests techniques/psychométriques (si applicable)
   Entretien téléphonique recruteur
   ↓
8. ENTRETIENS APPROFONDIS
   ↓
   Entretien manager
   Éventuellement entretien équipe
   Entretien DRH (postes cadres)
   Entretien DG (postes direction)
   ↓
9. SÉLECTION FINALE
   ↓
   Vérification références
   Comité hiring (recruteur + manager + RRH)
   Décision : hire / reject / shortlist
   ↓
10. OFFRE
   ↓
   Génération lettre d'offre (DocJourney)
   Signature DRH (ADVIST)
   Envoi candidat
   ↓
11. NÉGOCIATION
   ↓
   Éventuels échanges sur rémunération, date début, conditions
   Avenants offre possibles
   ↓
12. ACCEPTATION
   ↓
   Signature candidat (ADVIST)
   ↓
13. PRÉ-EMBAUCHE
   ↓
   Démarrage parcours onboarding M6 (préparation)
   Vérification documents pour M4 (pièces ID, diplômes, etc.)
   Visite médicale d'embauche programmée
   ↓
14. EMBAUCHE EFFECTIVE
   ↓
   Création contrat M4 (wizard pré-rempli avec données candidat)
   Création dossier M1
   Création dossier paie M3
   Démarrage parcours onboarding M6 J1
   Fermeture offre M5 (statut closed-hired)
   ↓
15. FEEDBACK QUALITÉ
   ↓
   Évaluation 90 jours (lien M8)
   Mesure quality-of-hire
   Amélioration continue
```

Chaque étape est tracée et chronométrée pour calculer les KPI.

---

# 6. KPI CIBLES DU MODULE M5

## 6.1 KPI fondamentaux

| KPI | Définition | Cible |
|-----|-----------|-------|
| **Time-to-fill** | Délai entre publication offre et acceptation | < 45 jours moyenne |
| **Time-to-hire** | Délai entre candidature retenue et acceptation | < 21 jours moyenne |
| **Cost-per-hire** | Coût total / embauche | < 800K FCFA moyenne (poste cadre) |
| **Quality-of-hire** | Score perf. à 6 mois × taux rétention 12 mois | > 75/100 |
| **Offer acceptance rate** | Offres acceptées / Offres envoyées | > 80% |
| **Candidate experience score** | Note moyenne candidat (post-process) | > 4/5 |
| **Source effectiveness** | Embauches / Source | Suivi multi-source |
| **Diversity at hire** | Répartition H/F embauches | Objectifs paritaires |
| **Internal mobility ratio** | Embauches internes / Total embauches | > 25% |
| **Drop-off rate** | % candidats perdus par étape | < 30% par étape |

## 6.2 KPI processus

- Délai pré-qualification (J + ?)
- Délai entre étapes du pipeline
- Taux de no-show entretiens
- Taux de réponse candidats relancés
- Volume traité par recruteur

## 6.3 KPI marque employeur

- Trafic site carrière
- Conversion visiteur → candidature
- Note Glassdoor / Indeed
- Engagement réseaux sociaux

---

# 7. RÈGLES DURES TRANSVERSES M5

| # | Règle | Justification |
|---|-------|---------------|
| R1 | Consentement RGPD explicite à chaque dépôt candidature | Conformité |
| R2 | Conservation candidatures : 2 ans après dernière interaction (paramétrable) | RGPD |
| R3 | Anonymisation automatique candidats non retenus après délai | RGPD |
| R4 | Aucune décision automatisée d'élimination par IA (assistance uniquement) | RGPD + équité |
| R5 | Critères d'évaluation validés par Juriste (non-discrimination) | OHADA + RGPD |
| R6 | Détection algorithmique de biais avec alerte | Équité |
| R7 | Feedback systématique aux candidats à chaque étape | Marque employeur |
| R8 | Aucune offre sans validation comité hiring + DRH | Décision collective |
| R9 | Validation budget poste obligatoire avant publication offre | Maîtrise masse salariale |
| R10 | Signature offre via ADVIST (employeur + candidat) | Valeur juridique |
| R11 | Bascule en contrat M4 = workflow tracé (pas de modif manuelle données) | Cohérence |
| R12 | Audit chaîné SHA-256 sur toute opération M5 | Conformité |
| R13 | Données sensibles (rémunérations négociées) en accès restreint | Confidentialité |
| R14 | Pas de cooptation possible par managers directs des cooptés (anti-collusion) | Anti-fraude |
| R15 | Multilangue obligatoire si offre destinée à l'international | Inclusivité |

---

# 8. PERFORMANCE — CIBLES TECHNIQUES

| Opération | Cible |
|-----------|-------|
| Chargement pipeline candidatures (jusqu'à 500 candidats) | < 1,5 s |
| Parsing CV PDF (extraction structurée PROPH3T) | < 8 s |
| Matching candidat-offre (score IA) | < 3 s |
| Recherche transverse candidats (full-text) | < 800 ms |
| Publication offre multicanal | < 30 s |
| Génération lettre offre PDF | < 3 s |
| Planification entretien (calendrier + invitation) | < 5 s |
| Reporting funnel complet | < 2 s |
| Site carrière (chargement page offre) | < 1 s |

---

# 9. TABLES PRINCIPALES (overview)

Voir doc 17 pour le détail complet. Les principales :

- `recruitment_needs` (besoins recrutement)
- `job_offers` (offres d'emploi)
- `job_offer_diffusions` (canaux de diffusion)
- `candidates` (candidats - base externe)
- `applications` (candidatures sur offres)
- `application_pipeline_stages` (étapes parcourues)
- `application_evaluations` (évaluations)
- `interviews` (entretiens)
- `interview_panels` (panels)
- `tests_passed` (passations tests)
- `hiring_committees` (comités hiring)
- `job_offers_emitted` (offres émises aux candidats)
- `cooptation_programs`
- `cooptation_referrals`
- `career_site_config` (config site carrière)
- `recruitment_audit_log` (audit chaîné)

---

# 10. PROCHAINES SECTIONS

- **02 Besoin recrutement** : expression besoin, validation budget, business case.
- **03 Offres emploi** : rédaction, modèles, multilingue.
- **04 Sourcing/diffusion** : multiposting, jobboards, réseaux sociaux.
- **05 Candidatures** : pipeline kanban, parsing CV, doublons.
- **06 Évaluation scoring** : grilles, scoring, matching IA.
- **07 Entretiens** : planification, types, comptes-rendus.
- **08 Tests assessments** : techniques, psychométriques.
- **09 Décision feedback** : hiring committee, lettres.
- **10 Offre négociation** : génération, négociation, acceptation.
- **11 Intégration M4 M6** : bascule contrat + onboarding.
- **12 Cooptation** : programme, primes.
- **13 Marque employeur** : site carrière.
- **14 Conformité RGPD** : consentements, non-discrimination.
- **15 Reporting** : KPI funnel, time-to-hire.
- **16 Audit M5** : chaîné, anti-fraude.
- **17 Récap technique** : modèle données complet.

---

*Fin spécification 01 — Fondation M5 Recrutement.*
