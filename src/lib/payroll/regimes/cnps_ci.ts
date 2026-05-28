/**
 * Régime Côte d'Ivoire — CNPS / IGR.
 * Config de démonstration versionnée (à valider par la veille réglementaire).
 */
import type { Regime } from '../types';

export const REGIME_CI: Regime = {
  countryCode: 'CI',
  countryName: "Côte d'Ivoire",
  zone: 'UEMOA',
  currency: 'XOF',
  socialFund: 'CNPS',
  version: '2025.1',
  effectiveFrom: '2025-01-01',
  contributions: [
    {
      code: 'CNPS_RET',
      label: 'CNPS — Retraite',
      base: 'capped',
      ceiling: 3_375_000, // plafond mensuel retraite
      employeeBps: 630, // 6,30 %
      employerBps: 770, // 7,70 %
      accounts: { employee: '431100', employer: '664100' },
    },
    {
      code: 'CNPS_PF',
      label: 'CNPS — Prestations familiales',
      base: 'capped',
      ceiling: 70_000,
      employeeBps: 0,
      employerBps: 525, // 5,75 % (PF) — illustratif
      accounts: { employer: '664200' },
    },
    {
      code: 'CNPS_AT',
      label: 'CNPS — Accident du travail',
      base: 'capped',
      ceiling: 70_000,
      employeeBps: 0,
      employerBps: 200, // 2 % (taux moyen, varie par secteur)
      accounts: { employer: '664300' },
    },
    {
      code: 'CMU',
      label: 'Couverture Maladie Universelle',
      base: 'gross',
      employeeBps: 0,
      employerBps: 0, // forfait géré hors %, illustratif
      accounts: { employer: '664400' },
    },
  ],
  incomeTax: {
    code: 'IGR',
    label: 'IGR / IRPP',
    abatementBps: 2000, // abattement 20 % frais professionnels (illustratif)
    brackets: [
      { upTo: 75_000, bps: 0 },
      { upTo: 240_000, bps: 1600 }, // 16 %
      { upTo: 800_000, bps: 2100 }, // 21 %
      { upTo: 2_400_000, bps: 2400 }, // 24 %
      { upTo: 8_000_000, bps: 2800 }, // 28 %
      { upTo: null, bps: 3200 }, // 32 %
    ],
  },
  employerTaxes: [
    { code: 'FDFP_TA', label: "FDFP — Taxe d'apprentissage", bps: 40, account: '637100' },
    { code: 'FDFP_FC', label: 'FDFP — Formation continue', bps: 60, account: '637200' },
  ],
};
