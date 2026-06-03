# M5 RECRUTEMENT — AUDIT & ANTI-FRAUDE
## Chaîne SHA-256, anti-fraude recrutement, patterns suspects
*God mode premium. Référence : 01_FONDATION.md, M4 doc 14 (référence audit OHADA).*

---

# 0. POSITIONNEMENT

L'**audit M5** est le **gardien de l'intégrité** du processus de recrutement :
- Trace **toutes les opérations** sensibles avec **chaînage cryptographique**.
- Détecte les **patterns suspects** de fraude/contournement.
- Garantit la **traçabilité OHADA** et conformité RGPD.
- Permet la **reconstitution complète** d'un parcours candidat.
- Sert de preuve en cas de **contentieux** (recours candidat éconduit).

## 0.1 Routes

- `/hr/recrutement/audit` → Cockpit audit
- `/hr/recrutement/audit/timeline/{appId}` → Timeline application
- `/hr/recrutement/audit/integrity-check` → Vérification chaîne
- `/hr/recrutement/audit/suspicious-patterns` → Alertes anti-fraude
- `/hr/recrutement/audit/exports` → Exports audit pour contrôle

---

# 1. CHAÎNE D'AUDIT SHA-256

## 1.1 Principe (rappel doc audit M4)

Chaque entrée d'audit M5 :
- Hashe son contenu en SHA-256.
- Inclut le **hash de l'entrée précédente**.
- Forme une chaîne incassable.
- Si un attaquant modifie un événement passé, **tous les hashs suivants sont invalides**.

## 1.2 Structure d'une entrée audit

```sql
CREATE TABLE m5_audit_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- Timestamp
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Acteur
  actor_id UUID,                 -- user_id (NULL si système)
  actor_type TEXT,               -- 'user', 'system', 'candidate', 'integration'
  actor_role TEXT,
  actor_ip INET,
  
  -- Action
  action_code TEXT NOT NULL,     -- ex: 'application.created', 'evaluation.submitted'
  action_category TEXT,
  
  -- Ressource cible
  resource_type TEXT,            -- 'application', 'candidate', 'offer', etc.
  resource_id UUID,
  
  -- Détails
  before_state JSONB,            -- état avant modification
  after_state JSONB,             -- état après
  metadata JSONB,
  
  -- Chaîne
  previous_hash TEXT,
  current_hash TEXT NOT NULL,
  
  -- Contexte
  session_id TEXT,
  user_agent TEXT,
  
  -- Localisation
  application_id UUID,
  candidate_id UUID,
  offer_id UUID
);

CREATE INDEX idx_m5_audit_app ON m5_audit_log(application_id);
CREATE INDEX idx_m5_audit_candidate ON m5_audit_log(candidate_id);
CREATE INDEX idx_m5_audit_offer ON m5_audit_log(offer_id);
CREATE INDEX idx_m5_audit_actor ON m5_audit_log(actor_id);
CREATE INDEX idx_m5_audit_action ON m5_audit_log(action_code);
CREATE INDEX idx_m5_audit_time ON m5_audit_log(occurred_at);
```

## 1.3 Calcul du hash

```typescript
function computeAuditHash(entry: AuditEntry, previousHash: string): string {
  const payload = JSON.stringify({
    tenant_id: entry.tenant_id,
    occurred_at: entry.occurred_at,
    actor_id: entry.actor_id,
    action_code: entry.action_code,
    resource_type: entry.resource_type,
    resource_id: entry.resource_id,
    before_state: entry.before_state,
    after_state: entry.after_state,
    previous_hash: previousHash
  });
  return sha256(payload);
}
```

## 1.4 Vérification d'intégrité

Cron quotidien : EF `verify-m5-audit-chain` :
- Parcourt toutes les entrées audit M5 du tenant.
- Recalcule chaque hash.
- Compare avec valeur stockée.
- Si mismatch → alerte critique immédiate (incident sécurité).

---

# 2. ÉVÉNEMENTS AUDITÉS

## 2.1 Catalogue complet (~80 actions tracées)

### Besoins
- `need.created`, `.submitted`, `.validated_rrh`, `.validated_daf`, `.validated_drh`, `.validated_dg`
- `need.rejected`, `.cancelled`, `.modified`

### Offres
- `offer.draft_created`, `.submitted_legal`, `.validated_legal`, `.submitted_marketing`
- `offer.validated_final`, `.published`, `.modified_published`, `.paused`, `.closed`

### Diffusions
- `diffusion.added`, `.removed`, `.renewed`, `.expired`
- `diffusion.cost_validated_rrh`, `.cost_validated_daf`

### Candidats
- `candidate.created`, `.merged`, `.consent_given`, `.consent_revoked`
- `candidate.added_to_pool`, `.removed_from_pool`
- `candidate.anonymized_auto`, `.deleted_request`

### Candidatures
- `application.received` (avec source)
- `application.cv_parsed` (PROPH3T)
- `application.duplicate_detected`
- `application.stage_changed` (avec from/to)
- `application.rejected` (avec raison)
- `application.withdrawn` (par candidat)

### Évaluations
- `evaluation.created`, `.submitted`, `.modified`
- `evaluation.bias_alert_triggered`
- `evaluation.matching_score_computed` (PROPH3T)

### Entretiens
- `interview.scheduled`, `.confirmed`, `.held`, `.cancelled`, `.rescheduled`, `.no_show`
- `interview.notes_saved`, `.report_generated`, `.report_validated`

### Tests
- `test.invited`, `.started`, `.completed`, `.expired`
- `test.suspicious_activity_detected`
- `references.contacted`, `.summary_recorded`

### Décisions
- `committee.scheduled`, `.held`, `.vote_cast`, `.decision_made`
- `decision.hire`, `.no_hire`, `.shortlist`

### Lettres
- `letter.generated` (acceptation / refus / backup)
- `letter.sent`, `.candidate_received`

### Offres formelles
- `offer_emitted.created`, `.validated_rrh`
- `offer_emitted.signed_drh` (ADVIST)
- `offer_emitted.sent`, `.candidate_received`
- `offer_emitted.accepted`, `.declined`, `.counter_proposed`, `.expired`
- `offer_emitted.signed_candidate` (ADVIST)

### Négociations
- `negotiation.iteration_created`, `.employer_response`
- `negotiation.deal_finalized`, `.deal_failed`

### Intégration M4/M6
- `integration.future_employee_created`
- `integration.m1_dossier_created`
- `integration.m4_contract_created`
- `integration.m6_onboarding_initiated`
- `integration.documents_pre_boarding_received`
- `integration.medical_visit_scheduled`, `.medical_visit_result`
- `integration.dpae_filed`
- `integration.j1_activated`
- `integration.cancelled` (désistement)

### Cooptation
- `cooptation.referral_created`, `.qualified`, `.rejected`
- `cooptation.anti_collusion_check_passed`, `.failed`
- `cooptation.tier_1_triggered`, `.tier_2_triggered`, `.tier_3_triggered`
- `cooptation.reward_paid`

### Marque employeur
- `career_site.page_published`
- `career_site.testimonial_published`, `.consent_renewed`, `.consent_revoked`

### RGPD
- `rgpd.request_received`, `.processed`, `.responded`
- `rgpd.anonymization_batch_executed`
- `rgpd.data_breach_declared`

### Système
- `audit.chain_integrity_verified`
- `audit.suspicious_pattern_detected`
- `audit.compliance_check_passed`, `.failed`

---

# 3. ANTI-FRAUDE RECRUTEMENT

## 3.1 Patterns suspects détectés

| Pattern | Description | Action |
|---------|-------------|--------|
| **Cooptation suspecte** | Volume anormal d'un cooptant, taux retrait élevé | Alerte DPO + RH |
| **Biais récurrent évaluateur** | Évaluateur notant systématiquement bas une catégorie | Alerte Juriste |
| **Doublons éliminés multiple fois** | Même candidat refusé à répétition (revanchard ?) | Suivi spécifique |
| **Accès anormaux** | Consultation massive de dossiers candidats hors mission | Alerte sécurité |
| **Modifications post-décision** | Tentative modifier évaluation/scores après décision | Alerte critique |
| **Conflits d'intérêts non déclarés** | Évaluateur proche d'un candidat | Alerte Juriste |
| **Exports massifs** | Export volume anormal de données candidats | Alerte DPO |
| **Validation hors horaires** | Validations à 3h du matin = suspect | Alerte sécurité |
| **Cancel d'offres acceptées** | Annulation après acceptation candidat | Alerte DRH |
| **Salaires offerts hors fourchette** | Offre > fourchette validée DAF | Alerte DAF |
| **Discrimination signaux** | Patterns trouvés en évaluations | Alerte Juriste + DPO |

## 3.2 Modèle de données

```sql
CREATE TABLE m5_suspicious_patterns (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  pattern_code TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT now(),
  
  -- Acteurs concernés
  related_user_id UUID,
  related_candidate_id UUID,
  related_application_id UUID,
  related_offer_id UUID,
  
  -- Détails
  severity TEXT,             -- 'low', 'medium', 'high', 'critical'
  pattern_data JSONB,
  evidence_audit_log_ids BIGINT[],
  
  -- Traitement
  status TEXT,               -- 'new', 'investigating', 'confirmed_fraud',
                             -- 'false_positive', 'closed'
  assigned_to UUID,
  investigation_notes TEXT,
  resolution_action TEXT,
  resolved_at TIMESTAMPTZ,
  
  -- Notification
  notified_users UUID[],
  notification_sent_at TIMESTAMPTZ
);
```

## 3.3 Détection — exemples

### Cooptation suspecte

```typescript
async function detectSuspiciousCooptation() {
  // Cooptant avec > 5 cooptations dans le trimestre
  const overactiveReferrers = await db.query(`
    SELECT referrer_employee_id, COUNT(*) as count
    FROM cooptation_referrals
    WHERE created_at > NOW() - INTERVAL '3 months'
    GROUP BY referrer_employee_id
    HAVING COUNT(*) > 5
  `);

  // Cooptant avec taux retrait élevé
  const highChurn = await db.query(`
    SELECT referrer_employee_id,
           COUNT(*) FILTER (WHERE status = 'hired') as hired,
           COUNT(*) FILTER (WHERE status = 'left_within_3m') as left_quick
    FROM cooptation_referrals
    WHERE hired_at > NOW() - INTERVAL '1 year'
    GROUP BY referrer_employee_id
    HAVING (left_quick::float / NULLIF(hired, 0)) > 0.5
  `);

  // Cooptant cooptant des proches (analyse domaine email)
  const sameDomainReferrals = await db.query(`
    SELECT r.referrer_employee_id,
           SUBSTRING(c.email FROM '@(.*)$') as candidate_domain,
           SUBSTRING(e.email FROM '@(.*)$') as referrer_domain
    FROM cooptation_referrals r
    JOIN candidates c ON r.candidate_id = c.id
    JOIN employees e ON r.referrer_employee_id = e.id
    WHERE candidate_domain = referrer_domain
      AND candidate_domain NOT IN ('gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com')
  `);

  // Création alertes
  for (const row of [...overactiveReferrers, ...highChurn, ...sameDomainReferrals]) {
    await createSuspiciousPatternAlert({
      pattern_code: 'cooptation_suspect',
      severity: 'medium',
      ...row
    });
  }
}
```

### Biais évaluateur

```typescript
async function detectEvaluatorBias() {
  // Évaluateur avec écart significatif score H vs F
  const genderBiasedEvaluators = await db.query(`
    WITH evaluator_stats AS (
      SELECT evaluator_id,
             AVG(weighted_score) FILTER (WHERE candidate_gender = 'M') as avg_m,
             AVG(weighted_score) FILTER (WHERE candidate_gender = 'F') as avg_f,
             COUNT(*) FILTER (WHERE candidate_gender = 'M') as count_m,
             COUNT(*) FILTER (WHERE candidate_gender = 'F') as count_f
      FROM application_evaluations
      WHERE submitted_at > NOW() - INTERVAL '6 months'
      GROUP BY evaluator_id
      HAVING COUNT(*) > 20  -- échantillon suffisant
    )
    SELECT evaluator_id, avg_m, avg_f, (avg_m - avg_f) as gap
    FROM evaluator_stats
    WHERE ABS(avg_m - avg_f) > 0.8  -- écart > 0.8 sur échelle 1-5
  `);

  for (const row of genderBiasedEvaluators) {
    await createSuspiciousPatternAlert({
      pattern_code: 'evaluator_gender_bias',
      severity: 'high',
      related_user_id: row.evaluator_id,
      pattern_data: row
    });
  }
}
```

### Modifications post-décision

```sql
-- Alerte si évaluation modifiée après décision comité
CREATE OR REPLACE FUNCTION check_post_decision_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT decision_made_at FROM hiring_committees 
      WHERE job_offer_id = (SELECT job_offer_id FROM applications WHERE id = NEW.application_id)) 
     < NEW.updated_at THEN
    
    INSERT INTO m5_suspicious_patterns (
      tenant_id, pattern_code, severity, related_user_id, related_application_id
    ) VALUES (
      NEW.tenant_id, 'eval_modified_after_decision', 'critical',
      NEW.updated_by, NEW.application_id
    );
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_post_decision_eval
AFTER UPDATE ON application_evaluations
FOR EACH ROW EXECUTE FUNCTION check_post_decision_modification();
```

---

# 4. TIMELINE COMPLÈTE D'UNE APPLICATION

Pour reconstituer le parcours complet d'un candidat (en cas de contentieux notamment) :

```
┌──────────────────────────────────────────────────────────────────────┐
│ TIMELINE - Application APP-2026-0245-001 (Awa DIABATÉ)                 │
├──────────────────────────────────────────────────────────────────────┤
│ 03/06 09:32 - application.received                                    │
│  Source : Site carrière                                                │
│  Hash : 8a3f...c2e1                                                   │
│                                                                       │
│ 03/06 09:32 - candidate.consent_given                                  │
│  Consentements : traitement_data, vivier_2y                            │
│  Hash : 7b2e...d3f4                                                   │
│                                                                       │
│ 03/06 09:34 - application.cv_parsed                                    │
│  PROPH3T - confiance 94%                                              │
│  Hash : 6c1d...e5a8                                                   │
│                                                                       │
│ 03/06 09:35 - evaluation.matching_score_computed                       │
│  Score : 92%                                                          │
│  Hash : 5d0c...f7b9                                                   │
│                                                                       │
│ 04/06 14:20 - application.stage_changed                                │
│  From : 'new' → To : 'pre_qualification'                              │
│  Actor : Aboubakar KONÉ (Recruteur)                                    │
│  Hash : 4e9b...a8c0                                                   │
│                                                                       │
│ 05/06 10:15 - evaluation.submitted (CV review)                         │
│  Score : 88/100                                                       │
│  Recommandation : Shortlist                                            │
│  Actor : Marie SAMAKÉ (Recruteur)                                      │
│  Hash : 3f8a...b9d1                                                   │
│                                                                       │
│ 06/06 11:00 - interview.scheduled (phone screen)                       │
│  Date : 10/06 14h-14h30                                                │
│  Actor : Aboubakar KONÉ                                                │
│  Hash : 2g7c...c0e2                                                   │
│                                                                       │
│ 10/06 14:32 - interview.held                                          │
│  Durée réelle : 32 min                                                │
│  Hash : 1h6d...d1f3                                                   │
│                                                                       │
│ 10/06 15:00 - evaluation.submitted (phone screen)                      │
│  Score : 85/100                                                       │
│  Hash : 9i5e...e2a4                                                   │
│                                                                       │
│ ... (continue jusqu'à embauche)                                       │
│                                                                       │
│ 05/07 16:45 - offer_emitted.accepted (candidate signed ADVIST)         │
│  Signature ADVIST ID : ADV-2026-78451                                  │
│  Hash : 0j4f...f3b5                                                   │
│                                                                       │
│ 15/10 09:00 - integration.j1_activated                                 │
│  M1 employee_id : EMP-2026-0245                                        │
│  M4 contract_id : CTR-2026-0245                                        │
│  M6 onboarding_id : ONB-2026-0245                                      │
│  Hash : ak3g...g4c6                                                   │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ INTÉGRITÉ : ✅ Chaîne validée (42 entrées, hashs OK)                  │
│ EXPORT : [PDF] [JSON]                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 5. EXPORTS POUR CONTRÔLE

## 5.1 Préparation contrôle CNIL/équivalent

Pack standard exportable :
- Registre des traitements.
- Logs d'accès aux données candidats.
- Demandes d'exercice de droits + réponses.
- Anonymisations effectuées.
- Violations déclarées (si applicable).

## 5.2 Préparation contentieux

Pour un candidat éconduit qui conteste :
- Timeline complète de sa candidature.
- Toutes les évaluations le concernant.
- Comparaison anonymisée avec le candidat retenu.
- Audit log complet.
- Preuve non-discrimination (statistiques).

## 5.3 Audit externe

Cabinet d'audit peut accéder en lecture seule (compte dédié) à :
- Tables agrégées.
- Audit logs (anonymisés sur données candidats sensibles).
- Statistiques conformité.

---

# 6. COCKPIT AUDIT

```
┌──────────────────────────────────────────────────────────────────────┐
│ Audit M5 - Cockpit                                                    │
├──────────────────────────────────────────────────────────────────────┤
│ INTÉGRITÉ CHAÎNE                                                      │
│  Dernière vérification : 30/05 03:00 ✅                               │
│  Entrées vérifiées : 89 245                                            │
│  Status : ✅ Toutes valides                                           │
│  Prochaine vérification : demain 03:00                                 │
├──────────────────────────────────────────────────────────────────────┤
│ ALERTES ANTI-FRAUDE OUVERTES (5)                                      │
│                                                                       │
│ Sévérité │ Pattern               │ Acteur          │ Statut           │
│ ──────── │ ────────────────────  │ ───────────────  │ ────────────── │
│ HIGH     │ Biais genre évaluateur│ Yao DIALLO       │ 🔴 Investigation │
│ MEDIUM   │ Cooptation suspecte   │ Marie SAMAKÉ     │ 🟡 Investigation │
│ MEDIUM   │ Accès anormal         │ Ibra. KONÉ       │ 🟡 Investigation │
│ LOW      │ Validation horaire    │ Sys auto         │ 🟢 False posit.  │
│ LOW      │ Doublon récurrent     │ Candidat#9876    │ 🟢 Suivi         │
│                                                                       │
│ [Voir détail toutes alertes]                                          │
├──────────────────────────────────────────────────────────────────────┤
│ STATISTIQUES MOIS                                                     │
│  Entrées audit M5 produites : 12 450                                   │
│  Volume données auditées : 287 MB                                      │
│  Alertes détectées : 18                                                │
│  Alertes investiguées : 16                                             │
│  Faux positifs : 12 (75%)                                              │
│  Fraudes confirmées : 1                                                │
├──────────────────────────────────────────────────────────────────────┤
│ EXPORTS RÉCENTS                                                       │
│  • Préparation audit CNIL Q2 (28/05) - DPO                             │
│  • Timeline candidat (12/05) - Juriste pour contentieux                │
│                                                                       │
│ [Préparer nouvel export]                                              │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 7. CONSERVATION & PURGE

## 7.1 Politique conservation audit

| Type | Durée |
|------|-------|
| Audit log M5 standard | 5 ans |
| Audit log opérations sensibles (disciplinaire, RGPD) | 10 ans |
| Audit log violations sécurité | Perpétuel |
| Snapshots intégrité | 1 an |

## 7.2 Purge automatique

Cron : suppression des entrées dépassant durée légale (sauf en cas d'enquête ouverte).

## 7.3 Archivage

Audit ancien (> 1 an) archivé sur stockage froid (coûts ↓).

---

# 8. APIS AUDIT M5

```
GET  /hr/recrutement/audit/logs?filters=
GET  /hr/recrutement/audit/timeline/{application_id}
GET  /hr/recrutement/audit/timeline/{candidate_id}/all
POST /hr/recrutement/audit/integrity-check (manual trigger)
GET  /hr/recrutement/audit/integrity-check/latest

GET  /hr/recrutement/audit/suspicious-patterns
GET  /hr/recrutement/audit/suspicious-patterns/{patternId}
POST /hr/recrutement/audit/suspicious-patterns/{patternId}/assign
POST /hr/recrutement/audit/suspicious-patterns/{patternId}/resolve
     body: { resolution: 'confirmed_fraud' | 'false_positive', notes }

POST /hr/recrutement/audit/exports/cnil-prep
POST /hr/recrutement/audit/exports/litigation
     body: { application_id }
POST /hr/recrutement/audit/exports/external-auditor
     body: { period, scope }

POST /hr/recrutement/audit/purge/archive-old
```

---

# 9. TABLES IMPLIQUÉES

### Nouvelles
- `m5_audit_log` (audit chaîné)
- `m5_audit_integrity_checks`
- `m5_suspicious_patterns`
- `m5_suspicious_patterns_investigations`
- `m5_audit_exports_log`
- `m5_audit_archives` (archivage froid)

---

# 10. SYNTHÈSE

**Audit & Anti-fraude M5** :
- **Chaîne SHA-256** pour intégrité incassable.
- **~80 actions tracées** (toutes opérations sensibles).
- **Vérification quotidienne** intégrité chaîne (cron).
- **Détection 11+ patterns suspects** automatique.
- **Investigations** structurées avec assignation et résolution.
- **Timeline complète** d'une candidature reconstituable.
- **Exports** pour CNIL, contentieux, audit externe.
- **Conservation 5 à 10 ans** selon sensibilité.

**Règles dures** :
- Toute opération sensible auditée.
- Aucune modification de l'audit (insertion seule).
- Vérification intégrité quotidienne.
- Alertes critiques notifiées immédiatement.
- Conservation légale stricte.
- Investigations tracées dans audit lui-même.

---

*Fin spécification 16 — Audit M5 & anti-fraude.*
