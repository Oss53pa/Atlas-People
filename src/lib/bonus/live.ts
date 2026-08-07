/**
 * Bonus — chargement LIVE des entrées de simulation.
 *
 * SCORE = score VALIDÉ de la campagne (couche officielle R4), obtenu en
 * recalculant les employés live via le moteur Performance (fetchPerfEmployesLive
 * → computeAllEmployes). Salaire + formule proviennent de `remu_fiche` (repli
 * sur `employees.base_salary`). Le calcul monétaire reste délégué au moteur
 * Money.ts (buildRepartition). Repli mock si backend non configuré / vide.
 */
import { isBackendConfigured, supabase } from '../supabase';
import { Money } from '../money';
import { PERF_CONFIG, computeAllEmployes } from '../perf/mock';
import { fetchPerfEmployesLive } from '../perf/live';
import type { BonusInput, RemuFiche } from '../../engine/bonus';
import type { BonusEmployeMock } from './mock';

const SCHEMA = 'atlas_people';
const DEMO_TENANT = '11111111-1111-1111-1111-111111111111';

type FicheRow = {
  employe_id: string; salaire_mensuel: number | null; formule_coef: number | null;
  bonus_formule: string | null; plafond_bps: number | null; plancher_bps: number | null;
};

/**
 * Construit les entrées bonus depuis les données live : score validé Performance
 * + fiche de rémunération. Retourne null (→ repli démo) si rien d'exploitable.
 */
export async function fetchBonusInputsLive(
  coefGlobal = 1,
  tenantId: string = DEMO_TENANT,
): Promise<{ inputs: BonusInput[]; rows: BonusEmployeMock[] } | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const perf = await fetchPerfEmployesLive(tenantId);
    if (!perf || perf.length === 0) return null;
    const scored = computeAllEmployes(PERF_CONFIG, perf); // scoreValide par employé (R4)
    const empIds = scored.map((e) => e.employeId);

    const sb = supabase.schema(SCHEMA);
    const [{ data: fiches }, { data: emps }] = await Promise.all([
      sb.from('remu_fiche')
        .select('employe_id, salaire_mensuel, formule_coef, bonus_formule, plafond_bps, plancher_bps')
        .eq('tenant_id', tenantId).in('employe_id', empIds),
      sb.from('employees').select('id, base_salary').in('id', empIds),
    ]);
    const ficheMap = new Map(((fiches ?? []) as FicheRow[]).map((f) => [f.employe_id, f]));
    const salMap = new Map(((emps ?? []) as { id: string; base_salary: number | null }[]).map((e) => [e.id, e.base_salary]));

    const rows: BonusEmployeMock[] = [];
    const inputs: BonusInput[] = [];
    for (const e of scored) {
      const f = ficheMap.get(e.employeId);
      const salaire = Number(f?.salaire_mensuel ?? salMap.get(e.employeId) ?? 0);
      if (!salaire) continue;
      const fiche: RemuFiche = {
        employeId: e.employeId,
        salaireMensuel: Money.of(salaire, 'XOF'),
        formule: { base: 'SAL_MENS', coef: (f?.formule_coef ?? 1) * coefGlobal },
        formuleDsl: f?.bonus_formule ?? 'SCORE × COEF × SAL_MENS',
        plafondBps: f?.plafond_bps ?? undefined,
        plancherBps: f?.plancher_bps ?? undefined,
      };
      rows.push({ employeId: e.employeId, scorePct: e.scoreValide, fiche });
      inputs.push({ fiche, scorePct: e.scoreValide });
    }
    return inputs.length ? { inputs, rows } : null;
  } catch {
    return null;
  }
}
