/**
 * Régime Sénégal — IPRES + CSS / IR.
 * Config de démonstration versionnée (à valider par la veille réglementaire).
 */
import type { Regime } from '../types';

export const REGIME_SN: Regime = {
  countryCode: 'SN',
  countryName: 'Sénégal',
  zone: 'UEMOA',
  currency: 'XOF',
  socialFund: 'IPRES + CSS',
  version: '2025.1',
  effectiveFrom: '2025-01-01',
  contributions: [
    {
      code: 'IPRES_RG',
      label: 'IPRES — Régime général',
      base: 'capped',
      ceiling: 432_000,
      employeeBps: 560, // 5,6 %
      employerBps: 840, // 8,4 %
      accounts: { employee: '431100', employer: '664100' },
    },
    {
      code: 'IPRES_CC',
      label: 'IPRES — Régime cadres',
      base: 'capped',
      ceiling: 1_296_000,
      employeeBps: 240, // 2,4 %
      employerBps: 360, // 3,6 %
      accounts: { employee: '431200', employer: '664150' },
    },
    {
      code: 'CSS',
      label: 'Caisse de Sécurité Sociale (PF + AT)',
      base: 'capped',
      ceiling: 63_000,
      employeeBps: 0,
      employerBps: 700, // 7 % PF + 1 à 5 % AT (illustratif)
      accounts: { employer: '664200' },
    },
  ],
  incomeTax: {
    code: 'IR',
    label: 'Impôt sur le Revenu',
    abatementBps: 0,
    brackets: [
      { upTo: 52_500, bps: 0 },
      { upTo: 141_667, bps: 2000 }, // 20 %
      { upTo: 333_333, bps: 3000 }, // 30 %
      { upTo: 583_333, bps: 3500 }, // 35 %
      { upTo: null, bps: 4000 }, // 40 %
    ],
  },
  employerTaxes: [
    { code: 'CFCE', label: 'Contribution Forfaitaire (CFCE)', bps: 300, account: '637100' },
  ],
};
