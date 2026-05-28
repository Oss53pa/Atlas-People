import type { Regime } from '../types';
import { REGIME_CI } from './cnps_ci';
import { REGIME_SN } from './ipres_sn';

export const REGIMES: Record<string, Regime> = {
  CI: REGIME_CI,
  SN: REGIME_SN,
};

export function getRegime(countryCode: string): Regime {
  const regime = REGIMES[countryCode];
  if (!regime) throw new Error(`Aucun régime configuré pour le pays ${countryCode}`);
  return regime;
}

export { REGIME_CI, REGIME_SN };
