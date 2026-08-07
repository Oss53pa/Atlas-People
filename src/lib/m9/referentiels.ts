/**
 * M9 COMPÉTENCES — référentiels (cadence de réévaluation, SPOF, certifications, mobilité).
 */

// ─────────────────── Seuils & SLA
export const COMPETENCE_THRESHOLDS = {
  REEVALUATION_CADENCE_MONTHS: 12,        // Cadence de réévaluation d'une compétence
  MASTERY_LEVEL: 3,                       // Niveau "Maîtrise" (sur échelle 0-5) — seuil SPOF
  SPOF_MAX_HOLDERS: 1,                    // Bus factor : ≤ 1 détenteur niveau Maîtrise+ = SPOF
  CERT_EXPIRATION_ALERT_DAYS: 90,         // Alerte expiration certification
  GAP_SEVERITY_HIGH_THRESHOLD: 2,         // Gap projeté ≥ 2 → sévérité "high"
  MOBILITY_MATCH_MIN_PCT: 40,             // Seuil match mobilité minimum (candidature recevable)
  MOBILITY_MATCH_AUTO_VALIDATE_PCT: 80,   // Seuil match auto-validation (DRH + manager d'accueil)
  MOBILITY_MATCH_PDC_MIN_PCT: 60,         // Seuil bas de la plage match PDC obligatoire (60-79 %)
  MOBILITY_MATCH_PDC_MAX_PCT: 79,         // Seuil haut de la plage match PDC obligatoire (60-79 %)
  MOBILITY_RETURN_CLAUSE_MONTHS: 6,       // Clause de retour mobilité
};
