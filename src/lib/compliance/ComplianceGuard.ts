/**
 * ComplianceGuard — moteur de règles qui BLOQUE les infractions (cahier §5.3, M12).
 *
 * « La conformité comme bouclier actif : le système refuse l'infraction. »
 * Déterministe, pur TypeScript. Le LLM peut expliquer une décision, jamais la prendre.
 */

export type Verdict = 'allow' | 'block';

export interface ComplianceCheck {
  rule: string;
  verdict: Verdict;
  message: string;
  legalBasis?: string;
}

export interface OvertimeRequest {
  countryCode: string;
  weeklyOvertimeHours: number;
}

export interface DismissalRequest {
  countryCode: string;
  seniorityMonths: number;
  noticeDaysGiven: number;
}

export interface SalaryFloorRequest {
  countryCode: string;
  monthlySalary: number;
}

/** SMIG mensuel indicatif par pays (FCFA). */
const MONTHLY_SMIG: Record<string, number> = {
  CI: 75_000,
  SN: 64_500,
  CM: 41_875,
};

/** Plafonds d'heures supplémentaires hebdomadaires (illustratif, par pays). */
const OVERTIME_WEEKLY_CAP: Record<string, number> = {
  CI: 15,
  SN: 20,
  CM: 20,
};

/** Préavis minimal de licenciement en jours selon l'ancienneté (illustratif). */
function minimumNoticeDays(seniorityMonths: number): number {
  if (seniorityMonths < 12) return 30;
  if (seniorityMonths < 72) return 30;
  if (seniorityMonths < 132) return 60;
  return 90;
}

export const ComplianceGuard = {
  checkOvertime(req: OvertimeRequest): ComplianceCheck {
    const cap = OVERTIME_WEEKLY_CAP[req.countryCode] ?? 15;
    if (req.weeklyOvertimeHours > cap) {
      return {
        rule: 'OVERTIME_WEEKLY_CAP',
        verdict: 'block',
        message: `Heures sup. (${req.weeklyOvertimeHours}h) au-delà du plafond légal de ${cap}h/semaine.`,
        legalBasis: `Code du travail ${req.countryCode}`,
      };
    }
    return {
      rule: 'OVERTIME_WEEKLY_CAP',
      verdict: 'allow',
      message: `Heures sup. conformes (≤ ${cap}h/semaine).`,
    };
  },

  /** SMIG mensuel indicatif d'un pays (FCFA), avec repli prudent. */
  monthlySmig(countryCode: string): number {
    return MONTHLY_SMIG[countryCode] ?? 60_000;
  },

  checkSalaryFloor(req: SalaryFloorRequest): ComplianceCheck {
    const smig = this.monthlySmig(req.countryCode);
    if (req.monthlySalary < smig) {
      return {
        rule: 'SALARY_FLOOR',
        verdict: 'block',
        message: `Salaire (${req.monthlySalary.toLocaleString('fr-FR')}) inférieur au SMIG de ${smig.toLocaleString('fr-FR')} FCFA.`,
        legalBasis: `Code du travail ${req.countryCode}`,
      };
    }
    return {
      rule: 'SALARY_FLOOR',
      verdict: 'allow',
      message: `Salaire conforme (≥ SMIG ${smig.toLocaleString('fr-FR')} FCFA).`,
    };
  },

  /** Préavis minimal légal (jours) pour une ancienneté donnée. */
  requiredNoticeDays(seniorityMonths: number): number {
    return minimumNoticeDays(seniorityMonths);
  },

  checkDismissalNotice(req: DismissalRequest): ComplianceCheck {
    const required = minimumNoticeDays(req.seniorityMonths);
    if (req.noticeDaysGiven < required) {
      return {
        rule: 'DISMISSAL_NOTICE',
        verdict: 'block',
        message: `Préavis insuffisant : ${req.noticeDaysGiven}j accordés, ${required}j requis pour cette ancienneté.`,
        legalBasis: `OHADA / Code du travail ${req.countryCode}`,
      };
    }
    return {
      rule: 'DISMISSAL_NOTICE',
      verdict: 'allow',
      message: `Préavis conforme (≥ ${required}j).`,
    };
  },
};
