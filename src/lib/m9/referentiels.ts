/**
 * M9 COMPÉTENCES — référentiels du module.
 * Seuils de matching mobilité interne, pilotables depuis settings_registry (V13).
 */

export const COMPETENCE_THRESHOLDS = {
  /** Score minimum pour qu'une candidature de mobilité soit recevable. */
  MOBILITY_MATCH_MIN_PCT: 40,
  /** Score à partir duquel un PDC d'accompagnement signé ADVIST est exigé. */
  MOBILITY_MATCH_PDC_MIN_PCT: 60,
  /** Score à partir duquel la décision DRH + manager d'accueil suffit (auto-validation). */
  MOBILITY_MATCH_AUTO_VALIDATE_PCT: 80,
};
