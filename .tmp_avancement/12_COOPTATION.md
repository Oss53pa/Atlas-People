# M5 RECRUTEMENT — COOPTATION
## Programme cooptation interne, primes, suivi anti-collusion
*God mode premium. Référence : 01_FONDATION.md, M3 paie (primes).*

---

# 0. POSITIONNEMENT

La **cooptation** (referral en anglais) consiste à inviter les collaborateurs en poste à **recommander des candidats** issus de leur réseau personnel. C'est un canal de sourcing :
- **Très efficace** : meilleure qualité, meilleur fit culturel.
- **Économique** : pas de coût jobboard mais prime à verser.
- **Engagement** : motivation des collaborateurs (sentiment d'appartenance).
- **Risqué** : conflits d'intérêts, népotisme si mal géré.

Cette section couvre :
- **Programme cooptation** structuré avec règles claires.
- **Wizard de cooptation** pour le collaborateur.
- **Suivi prime** versée selon paliers atteints.
- **Anti-collusion** (managers ne peuvent pas coopter pour leur propre équipe directe).
- **Reporting** : ROI cooptation vs autres canaux.

## 0.1 Routes

- `/hr/recrutement/cooptation` → Cockpit cooptation
- `/hr/recrutement/cooptation/programme` → Configuration programme
- `/hr/recrutement/cooptation/cooptations` → Liste cooptations
- `/portail/cooptation` (côté collaborateur)
- `/portail/cooptation/nouvelle` → Coopter un contact

---

# 1. PROGRAMME COOPTATION

## 1.1 Paramètres clés

```typescript
interface CooptationProgram {
  id: UUID;
  tenant_id: UUID;
  
  // Activation
  active: boolean;
  start_date: Date;
  end_date?: Date;
  
  // Périmètre
  applicable_to_all_jobs: boolean;
  specific_categories: string[];  // si pas all
  excluded_categories: string[];  // ex: pas de cooptation pour direction
  
  // Conditions cooptant
  can_referrer_be: TextArray;   // 'employee', 'manager', 'all_except_top_management'
  min_seniority_months: number; // ex: 6 mois ancienneté min
  exclude_referrer_direct_team: boolean;  // anti-collusion
  
  // Primes (paliers)
  reward_tiers: {
    tier_code: string;
    label: string;       // "Présentation au manager"
    amount: number;      // 25000 FCFA
    trigger: string;     // 'interview_with_manager_held', 'offer_signed', 'probation_passed'
  }[];
  
  // Conditions d'éligibilité prime
  reward_only_if_hired: boolean;
  payment_currency: string;
  payment_mode: string;  // 'payroll_addition', 'separate_transfer'
  
  // Plafonds
  max_referrals_per_referrer_per_year: number;  // ex: 5
  max_total_program_budget: number;
  
  // Communication
  show_to_referrer: boolean;
  notify_status_changes: boolean;
}
```

## 1.2 Paliers de primes types

```
┌─────────────────────────────────────────────────────────────────┐
│ PALIER 1 : Présentation au manager (entretien manager tenu)      │
│  Prime : 25 000 FCFA                                              │
│  Versée : Fin de mois en cours                                    │
│                                                                  │
│ PALIER 2 : Offre signée (candidat accepte offre formelle)        │
│  Prime : 75 000 FCFA                                              │
│  Versée : Mois de signature offre                                 │
│                                                                  │
│ PALIER 3 : Fin période d'essai validée (3 mois)                  │
│  Prime : 150 000 FCFA                                             │
│  Versée : Mois N+3                                                │
│                                                                  │
│ TOTAL POTENTIEL : 250 000 FCFA par cooptation aboutie             │
└─────────────────────────────────────────────────────────────────┘
```

## 1.3 Personnalisation primes

Les primes sont **modulables** selon :
- Type de poste (junior < senior < cadre dirigeant).
- Niveau d'expertise recherché (rare → prime + élevée).
- Urgence du besoin.

Exemple grille :
| Type poste | Total prime |
|------------|-------------|
| Employé | 150 000 FCFA |
| Maîtrise | 250 000 FCFA |
| Cadre B | 400 000 FCFA |
| Cadre A / direction | 600 000 FCFA |
| Profil rare / expert (IT senior, etc.) | 800 000 FCFA |

---

# 2. CÔTÉ COLLABORATEUR : COOPTER

## 2.1 Espace cooptation portail collaborateur

```
┌──────────────────────────────────────────────────────────────────────┐
│ Cooptation - Mon espace                                                │
├──────────────────────────────────────────────────────────────────────┤
│ 🎯 PROGRAMME COOPTATION CRMC                                          │
│  Nos talents recommandent nos talents.                                │
│  Gagnez jusqu'à 250 000 FCFA par cooptation réussie !                  │
│                                                                       │
│  [En savoir plus sur le programme]                                    │
├──────────────────────────────────────────────────────────────────────┤
│ POSTES OUVERTS À LA COOPTATION (12)                                   │
│                                                                       │
│ • Chef de Projet Commercial - Cosmos Yopougon                          │
│   Prime potentielle : 400 000 FCFA                                     │
│   [👤 Coopter quelqu'un]                                              │
│                                                                       │
│ • Comptable Sénior - Siège                                            │
│   Prime potentielle : 250 000 FCFA                                     │
│   [👤 Coopter quelqu'un]                                              │
│                                                                       │
│ • Responsable Maintenance - Cosmos Angré                              │
│   Prime potentielle : 400 000 FCFA                                     │
│   [👤 Coopter quelqu'un]                                              │
│                                                                       │
│ [Voir tous les postes ouverts]                                        │
├──────────────────────────────────────────────────────────────────────┤
│ MES COOPTATIONS EN COURS (3)                                          │
│                                                                       │
│ Candidat coopté      │ Poste            │ Statut       │ Prime gagnée│
│ ─────────────────── │ ──────────────── │ ──────────── │ ─────────── │
│ Ibrahim KOUASSI     │ Commercial       │ ✅ Hired     │ 250K reçues │
│ Aïssa TRA           │ Acheteur         │ ⏳ Entretien │ 25K payées  │
│ Yao SORO            │ Maintenance      │ ⏳ Pré-qualif│ —           │
│                                                                       │
│ TOTAL GAGNÉ ANNÉE : 275 000 FCFA                                       │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.2 Wizard coopter

```
┌──────────────────────────────────────────────────────────────────────┐
│ Coopter un candidat pour Chef de Projet Commercial                    │
├──────────────────────────────────────────────────────────────────────┤
│ INFORMATIONS CANDIDAT                                                  │
│  Prénom : [Marie]                                                     │
│  Nom : [DIABATÉ]                                                       │
│  Email : [marie.diabate@email.com]                                     │
│  Téléphone : [+225 ...]                                               │
│                                                                       │
│ COMMENT LE CONNAISSEZ-VOUS ?                                          │
│  ○ Famille                                                            │
│  ● Ami(e) proche                                                      │
│  ○ Ancien(ne) collègue                                                │
│  ○ Connaissance professionnelle                                       │
│  ○ Réseau (LinkedIn, alumni, etc.)                                    │
│                                                                       │
│ POURQUOI LE/LA RECOMMANDEZ-VOUS POUR CE POSTE ? (oblig.)              │
│  [TextArea : compétences, expérience, fit culturel...]                │
│                                                                       │
│ CV ATTACHÉ                                                             │
│  [📎 Téléverser CV de Marie] (oblig.)                                │
│  ☐ Marie n'a pas de CV à jour, je l'ai contacté pour qu'elle          │
│    candidate directement                                              │
│                                                                       │
│ CONSENTEMENT                                                           │
│  ☑ J'ai prévenu Marie que je la coopte                                 │
│  ☑ J'ai obtenu son accord pour transmettre ses coordonnées             │
│  ☑ Je certifie que Marie n'est pas dans mon équipe directe             │
│  ☑ J'ai lu et accepté le règlement du programme cooptation             │
│                                                                       │
│ [Envoyer cooptation]                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.3 Workflow après cooptation

```
[Cooptation soumise]
   ↓
Vérification auto :
  • Coopteur éligible (ancienneté, équipe)
  • Anti-collusion (pas dans équipe directe poste)
  • Pas de doublon avec candidature existante
   ↓
Si OK → création candidature avec source = "cooptation"
       lien avec coopteur conservé
   ↓
Pipeline standard de recrutement
   ↓
Notifications spécifiques :
  • Au coopteur : statut de sa cooptation à chaque étape
  • Au coopté : remerciement implicite
   ↓
Si entretien manager tenu → palier 1 prime (25K) versée
   ↓
Si offre signée → palier 2 prime (75K) versée
   ↓
Si période essai validée → palier 3 prime (150K) versée
```

---

# 3. ANTI-COLLUSION

## 3.1 Règles

| Règle | Raison |
|-------|--------|
| Cooptant ne peut coopter dans son **équipe directe** | Anti-collusion |
| Cooptant **pas dans la chaîne décisionnelle** du recrutement | Conflit intérêt |
| Manager opérationnel ne peut coopter pour **lui-même** | Évident |
| Cooptant doit avoir **min 6 mois d'ancienneté** | Engagement avéré |
| **Limite 5 cooptations** par cooptant par an | Anti-abus |
| Membres **DRH et Recrutement** ne peuvent coopter (sauf cas exceptionnel validé) | Indépendance |
| Conjoint, ascendants, descendants : **interdit** sauf transparence et validation Juriste | Népotisme |

## 3.2 Détection automatique

À la soumission cooptation, vérification automatique :
- Coopteur est-il manager direct du poste ouvert ?
- Coopteur est-il dans comité hiring de l'offre ?
- Coopteur est-il dans pipeline RH ?
- Nb cooptations année courante ?
- Lien familial déclaré ?

Si alerte → blocage ou validation manuelle Juriste.

## 3.3 Layout détection

```
⚠ Cooptation refusée - Conflit potentiel détecté

Vous ne pouvez pas coopter pour ce poste car :
• Le poste est rattaché à votre équipe directe (Direction Commerciale)
• En tant que manager direct, vous évaluerez le candidat retenu

Solution :
• Si Marie vous semble vraiment qualifiée, encouragez-la à candidater 
  directement via le site carrière.
• Sa candidature sera traitée normalement, mais sans prime de cooptation.

Vous pouvez coopter pour les autres postes ouverts :
[Voir liste]
```

---

# 4. SUIVI PRIME

## 4.1 Mécanique de versement

Une fois palier atteint :
- Notification automatique au coopteur.
- Création **élément variable** de paie M3 (`PRIME_COOPTATION_PALIER_X`).
- Versement sur le bulletin du mois suivant.
- Trace complète dans audit.

## 4.2 Cas particuliers

| Cas | Conséquence prime |
|-----|-------------------|
| Coopté **désiste** avant offre | Aucune prime |
| Offre **refusée** par coopté | Palier 1 conservé si entretien tenu |
| Coopté **embauché** mais coopteur **part avant fin essai** | Paliers 1+2 versés, palier 3 supprimé |
| Coopté **rompt période essai** | Palier 3 non versé |
| Coopté **embauché à un autre poste** | Prime du poste effectivement pris |
| **Plusieurs cooptations** pour même coopté | Seul le premier coopteur reçoit |
| Coopté **déjà dans pipeline** (autre source) | Cooptation refusée |

## 4.3 Layout suivi coopteur

```
┌──────────────────────────────────────────────────────────────────────┐
│ Suivi de votre cooptation - Marie DIABATÉ                              │
├──────────────────────────────────────────────────────────────────────┤
│ STATUT ACTUEL : 🟢 Entretien manager tenu                              │
├──────────────────────────────────────────────────────────────────────┤
│ JALONS                                                                │
│                                                                       │
│ ✅ Cooptation reçue (05/06)                                            │
│ ✅ Pré-qualification (10/06)                                          │
│ ✅ Test technique (15/06)                                              │
│ ✅ Entretien manager (20/06) → PRIME 25K versée mois courant          │
│ ⏳ Entretien finale prévu (28/06)                                     │
│ ⏳ Comité hiring                                                      │
│ ⏳ Offre éventuelle                                                    │
│ ⏳ Fin période d'essai (3 mois après embauche)                         │
│                                                                       │
│ POTENTIEL RESTANT                                                     │
│  Si Marie est retenue et signe : + 75 000 FCFA                         │
│  Si Marie valide sa période d'essai : + 150 000 FCFA                   │
│  TOTAL POSSIBLE : 250 000 FCFA                                         │
│                                                                       │
│ HISTORIQUE PAIEMENTS                                                  │
│  25/06 : PRIME_COOPT_PALIER_1 - 25 000 FCFA ✅ Versée                  │
│                                                                       │
│ ℹ Vous serez notifié à chaque progression de votre cooptation.        │
└──────────────────────────────────────────────────────────────────────┘
```

## 4.4 Notifications coopteur

| Événement | Notification |
|-----------|--------------|
| Cooptation reçue | "Merci ! Votre cooptation a été enregistrée." |
| Candidat passé en pré-qualif | "Marie a été retenue en pré-qualification." |
| Entretien planifié | "Marie passe un entretien le X." |
| Entretien tenu (palier 1) | "Bravo ! Vous gagnez 25K FCFA." |
| Offre signée (palier 2) | "Excellent ! +75K FCFA bientôt versés." |
| Candidat hired (palier 3 en attente) | "Marie a rejoint l'équipe. 150K FCFA seront versés fin période d'essai." |
| Fin période d'essai validée | "Félicitations ! +150K FCFA versés." |
| Cooptation refusée | "Malheureusement Marie n'a pas été retenue. Merci de votre contribution." |

---

# 5. CÔTÉ BACK-OFFICE : SUIVI PROGRAMME

## 5.1 Cockpit cooptation

```
┌──────────────────────────────────────────────────────────────────────┐
│ Programme Cooptation - Tableau de bord                                │
├──────────────────────────────────────────────────────────────────────┤
│ STATISTIQUES ANNÉE 2026 (cumul YTD)                                   │
│                                                                       │
│ Cooptations soumises : 87                                              │
│ Cooptations qualifiées : 42 (48%)                                      │
│ Entretiens tenus : 38 (44%)                                            │
│ Offres signées : 18 (21%)                                              │
│ Embauches confirmées : 15 (17%)                                        │
│ Taux conversion global : 17% (vs marché 8-10%)                         │
│                                                                       │
│ PRIMES VERSÉES YTD                                                    │
│  Palier 1 (entretien) : 950 000 FCFA (38 × 25K)                        │
│  Palier 2 (offre) : 1 350 000 FCFA (18 × 75K)                          │
│  Palier 3 (essai) : 1 800 000 FCFA (12 × 150K)                         │
│  TOTAL : 4 100 000 FCFA                                                │
│                                                                       │
│ COÛT-PAR-HIRE COOPTATION : 273 333 FCFA                                │
│  (Excellent ROI vs cabinet 2,8M ou Glassdoor 300K)                     │
│                                                                       │
│ TOP COOPTANTS YTD                                                      │
│  1. Hadja TIMITÉ - 5 cooptations (3 hired, 750K gagnés)                │
│  2. Aboubakar KONÉ - 4 cooptations (2 hired)                           │
│  3. Marie SAMAKÉ - 3 cooptations (2 hired)                             │
├──────────────────────────────────────────────────────────────────────┤
│ COOPTATIONS EN COURS (15)                                             │
│  [Voir détail]                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

## 5.2 Configuration programme

Responsable Recrutement gère :
- Activation / pause / clôture programme.
- Modification paliers et montants.
- Postes éligibles / exclus.
- Règles éligibilité cooptants.
- Plafonds budget.

## 5.3 Audit anti-fraude

Surveillance automatique :
- Cooptants suspects (volume anormal).
- Coopteurs avec **taux de retrait élevé** (cooptations qui désistent vite après prise de poste).
- Patterns inhabituels (même domaine email tous coopteurs).

---

# 6. CAMPAGNES COMMUNICATION

## 6.1 Boost ponctuel

Pour booster un recrutement difficile :
- Campagne "Bonus exceptionnel : prime doublée sur poste X jusqu'au Y".
- Communication ciblée (Slack, email).
- Suivi conversion.

## 6.2 Programmes saisonniers

- "Cooptation Été 2026" : prime supplémentaire 25K si cooptation en juillet-août.
- Communication interne.

---

# 7. APIS COOPTATION

```
GET  /portail/cooptation/programme
GET  /portail/cooptation/postes-ouverts
POST /portail/cooptation/coopter
     body: { offer_id, candidate_data, motivation, cv_file }
GET  /portail/cooptation/mes-cooptations
GET  /portail/cooptation/mes-primes-gagnees

GET  /hr/recrutement/cooptation/programme
PATCH /hr/recrutement/cooptation/programme
POST /hr/recrutement/cooptation/programme/activer
POST /hr/recrutement/cooptation/programme/desactiver

GET  /hr/recrutement/cooptation/cooptations
GET  /hr/recrutement/cooptation/cooptations/{coopId}
POST /hr/recrutement/cooptation/cooptations/{coopId}/anti-collusion-check
POST /hr/recrutement/cooptation/cooptations/{coopId}/qualifier
POST /hr/recrutement/cooptation/cooptations/{coopId}/rejeter

POST /hr/recrutement/cooptation/cooptations/{coopId}/palier/{tier}/declencher
POST /hr/recrutement/cooptation/cooptations/{coopId}/prime/verser

GET  /hr/recrutement/cooptation/dashboard?period=
GET  /hr/recrutement/cooptation/top-cooptants
GET  /hr/recrutement/cooptation/anti-fraude/alerts

POST /hr/recrutement/cooptation/campagnes
```

---

# 8. TABLES IMPLIQUÉES

### Nouvelles
- `cooptation_programs`
- `cooptation_reward_tiers`
- `cooptation_referrals`
- `cooptation_referral_status_history`
- `cooptation_rewards_paid`
- `cooptation_anti_collusion_checks`
- `cooptation_campaigns`
- `cooptation_audit_log`

### Mises à jour
- `applications` (champ `referrer_employee_id` + `application_source` = 'cooptation')

---

# 9. SYNTHÈSE

**Cooptation** :
- Programme structuré avec paliers de primes (3 paliers typiques).
- Wizard de cooptation depuis portail collaborateur.
- **Anti-collusion** technique enforced (pas de manager direct, ancienneté min, plafonds).
- Suivi prime versée automatiquement via M3 paie.
- Notifications coopteur à chaque étape.
- Dashboard ROI cooptation (CPH typiquement excellent).
- Campagnes ponctuelles pour booster recrutements difficiles.

**Règles dures** :
- Manager direct ne peut coopter pour son équipe.
- Membres RH/Recrutement exclus du programme (sauf exception).
- Famille proche interdite sauf validation Juriste.
- Max 5 cooptations / cooptant / an.
- Pas de cooptation rétroactive (candidat déjà dans pipeline = pas de prime).
- Audit chaîné anti-fraude.

---

*Fin spécification 12 — Cooptation.*
