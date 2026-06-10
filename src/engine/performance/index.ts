/**
 * Moteur Performance (M7 OKR + M8 Évaluations) — point d'entrée du noyau de calcul.
 *
 * Réexporte les types du modèle, les formules d'atteinte/score (§6) et l'audit
 * chaîné des snapshots (§8, §13). Réservé au calcul d'atteinte en POURCENTAGE —
 * aucune logique monétaire (M3) ni PROPH3T ici (R5/R8).
 */

export * from './types';
export * from './scoring';
export * from './snapshot';
