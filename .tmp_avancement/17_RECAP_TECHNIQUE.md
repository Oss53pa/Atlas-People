# M5 RECRUTEMENT — RÉCAP TECHNIQUE CONSOLIDÉ
## Modèle données, APIs, événements, Edge Functions, RLS, intégrations PROPH3T
*God mode premium. Synthèse technique complète du module M5.*

---

# 0. RAPPEL DE L'ARCHITECTURE

## 0.1 Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────────────┐
│              BACK-OFFICE SIRH ATLAS PEOPLE                            │
│                                                                       │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │  M5 RECRUTEMENT — ATS complet UEMOA/CEMAC                     │    │
│   │                                                              │    │
│   │  • Besoins de recrutement (5 types, validation 4-niveaux)     │    │
│   │  • Offres d'emploi (bibliothèque modèles + wizard rédaction)  │    │
│   │  • Sourcing & diffusion (15+ canaux : jobboards intern./loc.) │    │
│   │  • Candidatures (parsing CV PROPH3T, doublons, pipeline kanban)│    │
│   │  • Évaluations (grilles, scoring, matching IA, anti-biais)    │    │
│   │  • Entretiens (planification Google Cal/Outlook, 10 types)    │    │
│   │  • Tests (techniques, psychométriques, assessment centers)    │    │
│   │  • Décision & feedback (comité hiring, lettres personnalisées)│    │
│   │  • Offres & négociation (génération, ADVIST, contre-prop.)    │    │
│   │  • Intégration M4 M6 (transition pré-embauche complète)       │    │
│   │  • Cooptation (programme structuré, primes 3 paliers)         │    │
│   │  • Marque employeur (site carrière personnalisable)           │    │
│   │  • Conformité RGPD (7 droits, anonymisation auto)             │    │
│   │  • Reporting (funnel, TTH, CPH, QoH, diversity)               │    │
│   │  • Audit & anti-fraude (chaîne SHA-256, 11+ patterns)         │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Intégrations clés :                                                  │
│   • PROPH3T (Ollama) : parsing CV, matching, détection biais          │
│   • Google Calendar / Outlook : planification entretiens              │
│   • Google Meet / Teams / Zoom : visioconférences                     │
│   • LinkedIn, Indeed, Glassdoor + jobboards africains : multiposting  │
│   • CinetPay : primes cooptation versées via paie                     │
│   • DocJourney : templates lettres et offres                          │
│   • ADVIST : signatures qualifiées                                    │
│   • M1, M4, M6 : transitions et bascule                               │
└──────────────────────────────────────────────────────────────────────┘
```

## 0.2 Métriques module M5

| Élément | Volume |
|---------|--------|
| **Documents** | 18 |
| **Lignes de spécification** | ~9 000 lignes |
| **Tables nouvelles** | ~85 |
| **APIs (endpoints)** | ~250 |
| **WebSocket** | 4 |
| **Événements domaine** | ~75 |
| **Edge Functions** | ~55 |
| **Règles dures** | 15+ |
| **Intégrations externes** | 12+ |

---

# 1. STRUCTURE DES 18 DOCUMENTS M5

| Doc | Titre | Lignes | Sujets clés |
|-----|-------|--------|-------------|
| 00 | Index | 53 | — |
| 01 | Fondation | 540 | Architecture, public, matrice pouvoirs, KPI cibles, 15 règles dures |
| 02 | Besoin recrutement | 514 | 5 types, wizard 6 étapes, workflow validation, business case |
| 03 | Offres emploi | 705 | ~30 modèles standards, wizard 5 étapes, multilingue, PROPH3T |
| 04 | Sourcing diffusion | 578 | Multiposting jobboards int. + africains, chasse, cabinets, viviers, ROI |
| 05 | Candidatures | 640 | Pipeline kanban, parsing CV PROPH3T, doublons, fiche 360° |
| 06 | Évaluation scoring | 476 | Grilles structurées, scoring pondéré, matching IA, détection biais |
| 07 | Entretiens | 563 | Planification Google Cal/Outlook, 10 types, templates, panels, CR |
| 08 | Tests assessments | 497 | Tests techniques/psycho/situation, AC, références, anti-triche |
| 09 | Décision feedback | 516 | Comité hiring avec vote, lettres personnalisées, anti-silence |
| 10 | Offre négociation | 569 | Génération, ADVIST, négociation structurée, contre-proposition |
| 11 | Intégration M4 M6 | 596 | Futur collaborateur, pré-embauche, J1 activation |
| 12 | Cooptation | 478 | Programme 3 paliers, anti-collusion, prime M3 |
| 13 | Marque employeur | 550 | Site carrière personnalisable, CMS, témoignages, analytics |
| 14 | Conformité RGPD | 564 | 7 droits candidats, consentements, anonymisation auto |
| 15 | Reporting | 537 | Funnel, TTH/CPH/QoH/CXS/NPS/Diversity, dashboards profilés |
| 16 | Audit anti-fraude | 594 | Chaîne SHA-256, 11+ patterns suspects, timeline reconstituable |
| 17 | Récap technique | — | Ce document |

**Volume total M5 RECRUTEMENT** : ~9 000 lignes de spécification.

---

# 2. MODÈLE DE DONNÉES COMPLET (~85 tables)

## 2.1 Besoins et offres

1. `recruitment_needs` (besoins recrutement)
2. `recruitment_need_types`
3. `recruitment_need_validations`
4. `recruitment_need_business_cases`
5. `recruitment_need_skills_required`
6. `recruitment_need_documents`
7. `recruitment_need_audit_log`
8. `job_offers` (offres)
9. `job_offer_versions`
10. `job_offer_translations`
11. `job_offer_templates`
12. `job_offer_template_versions`
13. `job_offer_validations`
14. `job_offer_audit_log`

## 2.2 Diffusion et sourcing

15. `diffusion_channels` (catalogue canaux)
16. `job_offer_diffusions`
17. `diffusion_external_logs`
18. `diffusion_performance_snapshots`
19. `sourcing_searches`
20. `sourcing_approaches`
21. `external_recruitment_agencies`
22. `agency_briefs`
23. `agency_candidates_submitted`
24. `candidate_pools` (viviers)
25. `candidate_pool_members`

## 2.3 Candidats et candidatures

26. `candidates` (base externe)
27. `candidate_documents`
28. `candidate_parsing_results`
29. `candidate_duplicate_logs`
30. `candidate_merges_log`
31. `applications`
32. `application_pipeline_history`
33. `pipeline_stages`
34. `candidate_communications`
35. `candidate_notes_recruiter`
36. `bulk_actions_log`

## 2.4 Évaluations et tests

37. `evaluation_grids`
38. `application_evaluations`
39. `evaluation_bias_alerts`
40. `test_catalog`
41. `test_passations`
42. `test_passation_logs`
43. `test_cheating_signals`
44. `assessment_centers`
45. `assessment_center_sessions`
46. `references_verifications`
47. `references_contacts_log`

## 2.5 Entretiens

48. `interviews`
49. `interview_participants`
50. `interview_slots_proposed`
51. `interview_questions_templates`
52. `interview_notes_live`
53. `interview_reports`
54. `interview_panels`
55. `interview_reminders_sent`
56. `external_calendar_sync_log`
57. `interview_no_shows_log`

## 2.6 Décision et offre

58. `hiring_committees`
59. `hiring_committee_members`
60. `hiring_committee_votes`
61. `application_decisions`
62. `candidate_letters_sent`
63. `candidate_letter_templates`
64. `candidate_satisfaction_surveys`
65. `candidate_satisfaction_responses`
66. `silence_radio_alerts`
67. `job_offers_emitted`
68. `job_offer_emitted_versions`
69. `offer_negotiations`
70. `offer_signatures`
71. `offer_documents`
72. `offer_expirations_log`

## 2.7 Intégration M4/M6

73. `future_employees`
74. `pre_boarding_checklists`
75. `pre_boarding_documents_required`
76. `pre_boarding_documents_received`
77. `medical_visits_scheduling`
78. `dpae_submissions`
79. `it_preparation_tasks`
80. `team_notifications_log`
81. `cancellations_log`

## 2.8 Cooptation

82. `cooptation_programs`
83. `cooptation_reward_tiers`
84. `cooptation_referrals`
85. `cooptation_referral_status_history`
86. `cooptation_rewards_paid`
87. `cooptation_anti_collusion_checks`
88. `cooptation_campaigns`
89. `cooptation_audit_log`

## 2.9 Marque employeur

90. `career_site_config`
91. `career_site_pages`
92. `career_site_pages_versions`
93. `career_site_pages_translations`
94. `career_site_testimonials`
95. `career_site_testimonial_consents`
96. `career_site_analytics_snapshots`
97. `career_site_newsletter_subscribers`
98. `career_site_newsletter_sent`

## 2.10 RGPD

99. `candidate_consents`
100. `candidate_consent_revocations`
101. `candidate_rights_requests`
102. `candidate_rights_request_responses`
103. `candidates_anonymization_log`
104. `data_processing_registry`
105. `international_transfers_log`
106. `data_breach_incidents`
107. `dpo_audit_log`
108. `bias_detection_alerts`
109. `non_discrimination_reports`

## 2.11 Reporting et audit

110. `recruitment_kpi_snapshots`
111. `recruitment_funnel_snapshots`
112. `recruitment_cost_breakdown`
113. `quality_of_hire_calculations`
114. `recruitment_predictions_log`
115. `recruitment_reports_scheduled`
116. `recruitment_reports_runs`
117. `m5_audit_log` (audit chaîné)
118. `m5_audit_integrity_checks`
119. `m5_suspicious_patterns`
120. `m5_suspicious_patterns_investigations`
121. `m5_audit_exports_log`
122. `m5_audit_archives`

**Total approximatif** : ~85 tables principales (certaines sont des tables de liaison/historique).

## 2.12 Materialized views

- `mv_recruitment_funnel_monthly`
- `mv_recruitment_kpi_dashboard`
- `mv_quality_of_hire_cohorts`
- `mv_sources_roi_yearly`
- `mv_offres_actives_by_societe`
- `mv_candidates_in_pipeline_active`
- `mv_cooptation_dashboard`
- `mv_diversity_at_hire`

Rafraîchissement nocturne + sur événements critiques.

---

# 3. APIS COMPLÈTES (~250 endpoints)

| Section | Endpoints |
|---------|-----------|
| Besoins | ~15 (CRUD, workflow validation, business case, calendrier) |
| Offres | ~20 (CRUD, validation, publication, modèles, traduction) |
| Diffusion / sourcing | ~25 (multiposting, chasse, cabinets, ROI) |
| Candidats / pipeline | ~30 (pipeline, parsing, doublons, recherche) |
| Évaluations | ~20 (grilles, scoring, matching IA, biais) |
| Entretiens | ~25 (planification, types, CR, panels, no-show) |
| Tests | ~20 (catalogue, passations, AC, références) |
| Décision | ~15 (comités, lettres, satisfaction) |
| Offre / négo | ~20 (génération, ADVIST, négo, expiration) |
| Intégration M4/M6 | ~20 (futur collab, M1, M4, M6, documents, médical, DPAE, J1) |
| Cooptation | ~15 (programme, cooptations, primes, anti-fraude) |
| Marque employeur | ~15 (site, pages, témoignages, analytics, candidat portal) |
| RGPD | ~15 (consentements, droits, anonymisation, registre) |
| Reporting | ~15 (dashboards, KPI, prédictions, exports) |
| Audit | ~10 (timeline, intégrité, patterns, exports) |

### WebSocket

```
WS /hr/recrutement/pipeline/{offre_id}/realtime   → Pipeline en temps réel
WS /hr/recrutement/entretiens/calendar/realtime   → Calendrier entretiens live
WS /career/{tenant}/candidat/{candidat_id}/realtime → Espace candidat live
WS /hr/recrutement/audit/alerts/realtime           → Alertes anti-fraude live
```

---

# 4. ÉVÉNEMENTS DOMAINE ÉMIS (~75)

Tous avec `source_module = 'm5_recrutement'`. Catalogue principal :

### Besoins
- `need.created`, `.submitted`, `.validated_*`, `.rejected`, `.cancelled`

### Offres
- `offer.created`, `.validated_legal`, `.validated_marketing`, `.published`, `.paused`, `.closed`

### Diffusion
- `diffusion.added`, `.removed`, `.renewed`, `.expired`, `.stats_updated`

### Candidats
- `candidate.created`, `.merged`, `.consent_given`, `.consent_revoked`, `.anonymized`

### Candidatures
- `application.received`, `.cv_parsed`, `.duplicate_detected`
- `application.stage_changed`, `.rejected`, `.withdrawn`

### Évaluations
- `evaluation.submitted`, `.bias_alert`, `.matching_computed`

### Entretiens
- `interview.scheduled`, `.confirmed`, `.held`, `.no_show`
- `interview.report_validated`

### Tests
- `test.invited`, `.completed`, `.suspicious`
- `references.contacted`, `.completed`

### Décision
- `committee.held`, `.vote_cast`, `.decision_made`
- `decision.hire`, `.no_hire`

### Offre formelle
- `offer_emitted.signed_drh`, `.sent`, `.candidate_received`
- `offer_emitted.accepted`, `.declined`, `.counter`
- `offer_emitted.signed_candidate`, `.expired`

### Intégration
- `integration.future_employee_created`
- `integration.m1_created`, `.m4_created`, `.m6_initiated`
- `integration.dpae_filed`, `.medical_visit_result`
- `integration.j1_activated`, `.cancelled`

### Cooptation
- `cooptation.created`, `.qualified`, `.tier_*_triggered`, `.reward_paid`

### Marque employeur
- `career_site.page_published`, `.testimonial_published`

### RGPD
- `rgpd.request_received`, `.responded`, `.anonymization_executed`

### Audit
- `audit.integrity_verified`, `.suspicious_detected`

---

# 5. EDGE FUNCTIONS NOUVELLES M5 (~55 EF)

### Besoins & offres
1. `process-need-validation-workflow`
2. `generate-business-case-draft` (PROPH3T)
3. `generate-offer-from-template` (PROPH3T)
4. `validate-offer-legal-anti-discrimination` (PROPH3T)
5. `translate-offer-multilingue` (PROPH3T)
6. `publish-offer-multi-channel`

### Diffusion & sourcing
7. `post-to-jobboard-linkedin`
8. `post-to-jobboard-indeed`
9. `post-to-jobboard-novojob`
10. `sync-jobboard-stats` (cron horaire)
11. `monitor-diffusion-expirations` (cron daily)
12. `search-linkedin-recruiter`
13. `send-direct-approach-messages`

### Candidatures
14. `parse-cv-proph3t` (PROPH3T : OCR + extraction)
15. `detect-duplicate-candidates`
16. `merge-duplicate-candidates`
17. `compute-matching-score-ai` (PROPH3T)
18. `move-application-stage` (avec actions automatiques)
19. `monitor-silence-radio` (cron daily)
20. `process-bulk-actions`

### Évaluations
21. `submit-evaluation-with-bias-detection` (PROPH3T)
22. `compute-evaluations-convergence`
23. `detect-evaluator-bias-patterns` (cron weekly, PROPH3T)

### Entretiens
24. `find-interview-slots-google-calendar`
25. `find-interview-slots-outlook`
26. `create-interview-event-with-meet-link`
27. `send-interview-invitation-with-reminders`
28. `process-interview-confirmation`
29. `monitor-no-shows` (cron daily)
30. `generate-interview-report-draft` (PROPH3T)

### Tests
31. `invite-candidate-to-test`
32. `process-test-completion-internal`
33. `sync-test-results-hackerrank`
34. `detect-test-cheating-signals`

### Décision
35. `process-hiring-committee-vote`
36. `generate-acceptance-letter` (PROPH3T)
37. `generate-rejection-letter-personalized` (PROPH3T)
38. `generate-backup-shortlist-letter` (PROPH3T)
39. `send-candidate-satisfaction-survey` (cron)

### Offre & négociation
40. `generate-offer-document` (DocJourney)
41. `sign-offer-with-advist-employer`
42. `process-candidate-counter-proposal`
43. `monitor-offer-expirations` (cron daily)

### Intégration M4/M6
44. `create-future-employee-on-offer-acceptance`
45. `provision-m1-dossier-from-application`
46. `provision-m4-contract-from-application`
47. `init-m6-onboarding-journey`
48. `file-dpae-automatic` (cron J-5)
49. `activate-j1-cascade-m1-m3-m4-m6`

### Cooptation
50. `anti-collusion-check-cooptation`
51. `trigger-cooptation-reward-tier`
52. `monitor-cooptation-suspicious-patterns` (cron weekly)

### Marque employeur
53. `publish-career-site-page`
54. `sync-career-site-analytics` (cron daily)
55. `send-newsletter-job-alerts`

### RGPD
56. `process-rgpd-rights-request`
57. `run-anonymization-batch` (cron daily)
58. `verify-international-transfers`

### Audit
59. `verify-m5-audit-chain` (cron daily)
60. `detect-suspicious-patterns-batch` (cron daily)
61. `prepare-audit-export-cnil`

**Total** : ~55-60 Edge Functions M5.

---

# 6. POLITIQUES RLS M5

## 6.1 Pattern accès candidats par société

```sql
CREATE POLICY "m5_candidates_societe_scope" ON candidates
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_societe_access
      WHERE user_id = auth.uid() AND active = true
    )
    AND auth.has_any_role(ARRAY['recruteur', 'charge_recrutement', 'resp_recrutement',
                                  'manager_op', 'rrh', 'drh', 'juriste', 'auditeur'])
  );
```

## 6.2 Restriction manager opérationnel

```sql
-- Manager opérationnel : seulement les candidatures pour SES offres
CREATE POLICY "m5_manager_only_own_offers" ON applications
  FOR SELECT
  USING (
    CASE
      WHEN auth.has_role('manager_op') AND NOT auth.has_any_role(ARRAY['rrh', 'drh'])
      THEN job_offer_id IN (
        SELECT jo.id FROM job_offers jo
        JOIN recruitment_needs rn ON jo.recruitment_need_id = rn.id
        WHERE rn.manager_id = auth.uid_to_employee_id()
      )
      ELSE true
    END
  );
```

## 6.3 Cooptation - cooptant voit ses cooptations

```sql
CREATE POLICY "m5_cooptation_referrer_self" ON cooptation_referrals
  FOR SELECT
  USING (
    referrer_employee_id = auth.uid_to_employee_id()
    OR auth.has_any_role(ARRAY['resp_recrutement', 'drh', 'auditeur'])
  );
```

## 6.4 Candidat externe - accès à ses propres données

```sql
CREATE POLICY "m5_candidate_self_access" ON applications
  FOR SELECT
  USING (
    candidate_id = auth.candidate_id()  -- session candidat externe
    OR auth.has_any_role(ARRAY['recruteur', 'charge_recrutement', 'resp_recrutement', 'rrh', 'drh'])
  );
```

## 6.5 RGPD - DPO accès total

```sql
CREATE POLICY "m5_dpo_full_access" ON candidates
  FOR SELECT
  USING (
    auth.has_role('dpo')
    OR auth.has_any_role(ARRAY['recruteur', 'charge_recrutement', 'resp_recrutement', 'rrh', 'drh', 'juriste'])
  );
```

## 6.6 Audit log - lecture restreinte

```sql
CREATE POLICY "m5_audit_log_read" ON m5_audit_log
  FOR SELECT
  USING (
    auth.has_any_role(ARRAY['drh', 'auditeur', 'dpo', 'juriste'])
    OR (
      -- Recruteur peut voir audit de ses candidatures
      auth.has_role('recruteur')
      AND application_id IN (
        SELECT id FROM applications WHERE assigned_recruiter_id = auth.uid()
      )
    )
  );

-- Aucun update/delete sur audit
CREATE POLICY "m5_audit_no_modify" ON m5_audit_log
  FOR UPDATE USING (false);

CREATE POLICY "m5_audit_no_delete" ON m5_audit_log
  FOR DELETE USING (auth.has_role('system_purge_job'));
```

---

# 7. INTÉGRATIONS PROPH3T M5 (Ollama, CONFIDENTIAL)

| Section | Usage PROPH3T | Mode |
|---------|---------------|------|
| Besoins | Génération business case draft | Texte |
| Offres | Génération texte offre depuis modèle | Texte |
| Offres | Reformulation pour SEO et clarté | Suggestion |
| Offres | Traduction multilingue | Traduction |
| Offres | Détection langage discriminatoire | Détection |
| Candidatures | **Parsing CV** : extraction structurée | Extraction |
| Candidatures | Matching score candidat-offre | Score |
| Évaluations | Détection biais (genre, âge, origine) | Détection |
| Évaluations | Suggestion convergence multi-évaluateurs | Synthèse |
| Entretiens | Génération compte-rendu depuis notes | Texte |
| Décision | Génération lettres personnalisées (acceptation, refus, backup) | Texte |
| Marque emp. | Traduction pages site carrière | Traduction |
| RGPD | Détection conflits données candidat | Détection |
| Reporting | Prédictions time-to-fill, couverture, pénurie | Prédiction |
| Audit | Détection patterns suspects anti-fraude | Détection |

**Règle dure** : PROPH3T n'élimine **jamais automatiquement** un candidat. Toutes décisions sont validées humainement.

---

# 8. PERFORMANCE — CIBLES GLOBALES M5

| Opération | Cible |
|-----------|-------|
| Chargement pipeline candidatures (jusqu'à 500 candidats) | < 1,5 s |
| Parsing CV PDF (PROPH3T) | < 8 s |
| Matching candidat-offre (score IA) | < 3 s |
| Recherche transverse candidats (full-text) | < 800 ms |
| Publication offre multicanal (1 canal) | < 30 s |
| Génération lettre offre PDF (DocJourney) | < 3 s |
| Planification entretien (recherche créneaux Google Cal) | < 5 s |
| Reporting funnel complet | < 2 s |
| Site carrière (chargement page offre) | < 1 s |
| Vérification chaîne audit (1 semaine) | < 30 s |
| Vérification chaîne audit (1 an complet) | < 5 min |
| Anonymisation batch (100 candidats) | < 60 s |

---

# 9. RÈGLES DURES TRANSVERSES M5 — SYNTHÈSE FINALE

| # | Règle | Justification |
|---|-------|---------------|
| R1 | Consentement RGPD explicite obligatoire à chaque dépôt candidature | Conformité |
| R2 | Conservation candidatures 2 ans (paramétrable, par défaut) avec anonymisation auto | RGPD |
| R3 | Aucune élimination automatique de candidat par IA (assistance uniquement) | RGPD + équité |
| R4 | Critères d'évaluation validés par Juriste (non-discrimination OHADA) | Conformité |
| R5 | Détection algorithmique de biais sur toutes évaluations | Équité |
| R6 | Feedback systématique aux candidats à chaque étape (SLA 7j max) | Marque employeur |
| R7 | Aucune offre finale sans validation comité hiring + DRH | Décision collective |
| R8 | Validation budgétaire DAF obligatoire avant publication offre | Maîtrise masse salariale |
| R9 | Signature offres via ADVIST (employeur + candidat) | Valeur juridique OHADA |
| R10 | Bascule M4 = workflow tracé (création contrat sans modif manuelle données) | Cohérence |
| R11 | Audit chaîné SHA-256 sur toute opération M5 | Conformité |
| R12 | Manager direct ne peut coopter pour son équipe | Anti-collusion |
| R13 | Multilingue obligatoire si offre destinée à l'international | Inclusivité |
| R14 | DPAE déposée avant prise de poste (J-5) | Obligation légale |
| R15 | Visite médicale d'embauche avant ou J1 (aptitude validée) | Obligation légale |
| R16 | 2 no-show entretien sans excuse = rejet automatique | Optimisation |
| R17 | Anonymisation effective des candidats après expiration consentement | RGPD |
| R18 | Conservation 5 à 10 ans des audits selon sensibilité | Conformité légale |

---

# 10. CHECKLIST DE COMPLÉTUDE M5

| Élément | Statut |
|---------|--------|
| 5 types de besoins de recrutement | ✅ |
| ~30 modèles offres standards par famille métier | ✅ |
| Multiposting jobboards internationaux + africains | ✅ |
| Parsing CV PROPH3T automatique | ✅ |
| Détection doublons multi-critères | ✅ |
| Pipeline kanban personnalisable par offre | ✅ |
| 10 types d'entretiens supportés | ✅ |
| Intégration Google Calendar + Outlook | ✅ |
| Génération auto liens visio (Meet, Teams, Zoom) | ✅ |
| Templates questions entretiens par profil | ✅ |
| Grilles évaluation structurées avec scoring pondéré | ✅ |
| Matching IA candidat-offre PROPH3T | ✅ |
| Détection biais évaluateurs | ✅ |
| Tests techniques + psychométriques + AC | ✅ |
| Vérification références avec consentement | ✅ |
| Comité hiring avec vote anonyme | ✅ |
| Lettres personnalisées PROPH3T (3 types) | ✅ |
| Anti-silence radio enforced (SLA 7j) | ✅ |
| Enquête satisfaction candidat post-process | ✅ |
| Génération offre DocJourney + signature ADVIST | ✅ |
| Workflow négociation structuré (3 itérations max) | ✅ |
| Bascule M4 contrat + M1 dossier + M6 onboarding | ✅ |
| Statut "futur collaborateur" transitoire | ✅ |
| Documents pré-embauche collectés via espace candidat | ✅ |
| Visite médicale programmée et tracée | ✅ |
| DPAE déposée auto J-5 | ✅ |
| Préparation IT (accès standby + activation J1) | ✅ |
| Programme cooptation 3 paliers avec primes M3 | ✅ |
| Anti-collusion technique enforced | ✅ |
| Site carrière personnalisable avec CMS | ✅ |
| Témoignages collaborateurs avec gestion consentement | ✅ |
| Analytics site carrière (trafic, conversion, sources) | ✅ |
| Newsletter alertes offres | ✅ |
| SEO + microdata Google Jobs | ✅ |
| 7 droits RGPD candidats avec workflows | ✅ |
| Anonymisation automatique après 2 ans | ✅ |
| Registre des traitements maintenu | ✅ |
| Non-discrimination OHADA enforcée | ✅ |
| KPI fondamentaux : TTH, CPH, QoH, CXS, NPS | ✅ |
| Dashboards profilés : Recruteur, DRH, Exec | ✅ |
| Prédictions PROPH3T (time-to-fill, couverture) | ✅ |
| Chaîne audit SHA-256 | ✅ |
| Détection 11+ patterns suspects anti-fraude | ✅ |
| Timeline reconstituable d'une candidature | ✅ |
| ~85 tables nouvelles | ✅ |
| ~250 endpoints API + 4 WebSocket | ✅ |
| ~75 événements domaine | ✅ |
| ~55 Edge Functions | ✅ |
| 18 règles dures appliquées | ✅ |
| Intégration ADVIST + DocJourney + PROPH3T Ollama | ✅ |

---

# 11. POSITIONNEMENT DANS L'ÉCOSYSTÈME ATLAS PEOPLE

## 11.1 État de la Vague 2 (Talent)

| Module | Statut | Volume |
|--------|--------|--------|
| M5 RECRUTEMENT | ✅ Complet | 9 000 lignes (18 docs) |
| M6 Onboarding | À produire | — |
| M7 OKR | À produire | — |
| M8 Évaluations | À produire | — |
| M9 Compétences | À produire | — |
| M10 Carrières | À produire | — |
| M11 Formation | À produire | — |
| **Vague 2 TOTAL** | 🔄 **1/7** | **9 000 lignes (premier module)** |

## 11.2 Cumul Atlas People à fin M5

| Composant | Volume |
|-----------|--------|
| M1 Dossier collaborateur | 13 400 lignes |
| M2 Temps & Absences | ~3 800 lignes |
| Architecture 3 espaces | 464 lignes |
| Portail Collaborateur | 7 389 lignes |
| Portail Manager | 6 376 lignes |
| Back-office Vague 1 (M3 + M4) | 21 527 lignes |
| **Back-office Vague 2 — M5** | **~9 000 lignes** |
| **TOTAL ATLAS PEOPLE** | **~62 000 lignes** |

## 11.3 Prochaines étapes

### Suite Vague 2 — Talent
- **M6 Onboarding** : Parcours d'intégration nouvel embauché (premiers 90 jours)
- **M7 OKR** : Définition + suivi objectifs alignés stratégie
- **M8 Évaluations** : Cycles d'évaluation annuels/semestriels, 360°
- **M9 Compétences** : Référentiel compétences, cartographie, gaps
- **M10 Carrières** : Parcours, successions, plans de développement
- **M11 Formation** : Catalogue, plans, suivi, ROI, FDFP

### Vague 3 — Conformité (à venir)
- **M12 Santé** : Médecine du travail, AT/MP

### Vague 4 — Pilotage (à venir)
- **M13 Cockpit DRH** : Hub d'arrivée du back-office

---

# 12. INTÉGRATIONS INTER-MODULES — VUE M5

## 12.1 M5 ↔ M1 (Dossier collaborateur)

- Candidat retenu → création automatique dossier M1.
- Données candidat → données dossier M1 (état civil, formation, contacts).

## 12.2 M5 ↔ M2 (Temps & Absences)

- À l'embauche → initialisation droits congés M2.
- Date prise de poste = point de départ ancienneté.

## 12.3 M5 ↔ M3 (Paie)

- Validation budget poste = impact masse salariale projeté.
- Cohérence fourchette salariale avec grille M3.
- À l'embauche → création dossier paie M3 avec données offre.
- Primes cooptation versées via M3.

## 12.4 M5 ↔ M4 (Admin RH)

- Création contrat M4 depuis wizard pré-rempli (intégration doc 11).
- Synchronisation type contrat / classification / coefficient.

## 12.5 M5 ↔ M6 (Onboarding - à venir)

- Acceptation offre → déclenchement parcours onboarding M6.
- Données candidat transmises à M6.

## 12.6 M5 ↔ M8 (Évaluations - à venir)

- Évaluation 90 jours post-embauche → boucle qualité (QoH).
- Feedback sur qualité du recrutement.

## 12.7 M5 ↔ M9 (Compétences - à venir)

- Compétences requises définies dans offre → matching M9.
- Compétences détectées sur CV → enrichissement référentiel.

## 12.8 M5 ↔ M10 (Carrières - à venir)

- Mobilité interne → recrutement interne (workflow spécifique).
- Postes ouverts visibles au portail collaborateur.

## 12.9 M5 ↔ Atlas Studio Core

- SSO `@atlas-studio/auth-sdk`.
- Auth candidat externe avec session dédiée.
- Tenant & souscription.

## 12.10 M5 ↔ DocJourney

- Templates : offres, lettres réponse, modèles diverses.
- Variables dynamiques (nom candidat, poste, etc.).

## 12.11 M5 ↔ ADVIST

- Signatures qualifiées : offres employeur + candidat.

## 12.12 M5 ↔ PROPH3T

- Parsing CV (extraction structurée).
- Matching score IA.
- Détection biais.
- Génération texte (offres, lettres, comptes-rendus).
- Prédictions.

## 12.13 M5 ↔ Calendriers externes

- Google Calendar (planification entretiens).
- Microsoft Graph / Outlook.

## 12.14 M5 ↔ Jobboards

- LinkedIn, Indeed, Glassdoor.
- Jobboards africains : Novojob, JobAfrique, etc.

## 12.15 M5 ↔ Visio

- Google Meet, Microsoft Teams, Zoom.
- Génération automatique liens.

## 12.16 M5 ↔ Tests partenaires

- HackerRank, Codility, TestGorilla (option).

---

# 13. SYNTHÈSE FINALE M5

**M5 RECRUTEMENT** = **ATS complet** pour Atlas People, conçu pour UEMOA/CEMAC, intégrant les meilleures pratiques internationales et les spécificités africaines.

**Périmètre couvert** :
- Cycle complet : besoin → offre → sourcing → candidatures → évaluation → décision → offre formelle → intégration.
- Multi-canal : site carrière + 15+ jobboards (LinkedIn, Indeed + locaux africains) + réseaux sociaux + cooptation + cabinets.
- Parsing CV automatique avec PROPH3T (Ollama, CONFIDENTIAL).
- Pipeline kanban personnalisable.
- Évaluations structurées avec détection automatique des biais.
- Tests intégrés (techniques, psychométriques, assessment centers).
- Entretiens planifiés via Google Calendar / Outlook avec liens visio automatiques.
- Comité hiring structuré avec vote anonyme.
- Lettres personnalisées générées par PROPH3T.
- Workflow négociation salariale.
- Bascule fluide vers M1 dossier + M4 contrat + M6 onboarding.
- Cooptation avec anti-collusion technique.
- Site carrière personnalisable avec analytics.
- Conformité RGPD complète (7 droits, anonymisation auto).
- Reporting riche (funnel, TTH, CPH, QoH, diversity, dashboards profilés).
- Audit chaîné SHA-256 + anti-fraude.

**Qualités** :
- Standard god mode premium niveau ATS international (Greenhouse, Lever, Workday Recruiting) **adapté Afrique francophone**.
- Toutes signatures via ADVIST (valeur juridique OHADA).
- Tous documents via DocJourney.
- IA PROPH3T en assistance partout, jamais en décision.
- Multilingue (FR/EN/bilingue).
- Conformité RGPD africaine + non-discrimination OHADA.
- Audit chaîné quotidiennement vérifié.

**Volumétrie** :
- 18 documents.
- ~9 000 lignes de spécification.
- ~85 tables nouvelles.
- ~250 endpoints API + 4 WebSocket.
- ~75 événements domaine.
- ~55 Edge Functions.
- 18 règles dures appliquées.

---

# 14. ATTERRISSAGE M5 RECRUTEMENT

✅ **Module M5 RECRUTEMENT = COMPLET**

| Module Atlas People | Statut | Lignes | Documents |
|--------|--------|--------|-----------|
| M3 PAIE | ✅ | 10 214 | 18 |
| M4 ADMIN RH | ✅ | 11 313 | 16 |
| M5 RECRUTEMENT | ✅ | ~9 000 | 18 |
| **TOTAL Back-office produit** | ✅ | **~30 500** | **52** |

**Cumul global Atlas People : ~62 000 lignes**

**Prêt pour la suite de la Vague 2** :
- M6 Onboarding (parcours 90 jours post-embauche)
- M7 OKR (définition + suivi objectifs)
- M8 Évaluations (annuelles, semestrielles, 360°)
- M9 Compétences (référentiel, cartographie)
- M10 Carrières (parcours, successions)
- M11 Formation (catalogue, plans, ROI, FDFP)

---

*Fin du récap technique consolidé du module M5 RECRUTEMENT.*
*Module M5 RECRUTEMENT complet : ~9 000 lignes au standard ATS premium pour UEMOA/CEMAC.*
*Vague 2 démarrée — 1 module sur 7 produit.*
