/**
 * Cockpit Performance — chargement LIVE depuis les tables perf_* (schéma
 * atlas_people) reconstruites en `MockEmploye[]`, pour être calculées par le
 * MÊME moteur (src/engine/performance) que le mode démo. Repli mock si le
 * backend n'est pas configuré ou si la campagne est vide (retourne null).
 *
 * Note : le calcul d'atteinte semestriel côté client reprend §6.3 (moyenne des
 * mois actifs). Les RPC serveur figées (perf_scores) restent l'autorité pour la
 * couche validée officielle ; ce chargement alimente les tableaux de bord.
 */
import { isBackendConfigured, supabase } from '../supabase';
import type { MesureAction } from '../../engine/performance';
import type { MockAction, MockActionMois, MockEmploye, MockObjectif } from './mock';

const SCHEMA = 'atlas_people';
const DEMO_TENANT = '11111111-1111-1111-1111-111111111111';

type ObjRow = { id: string; porteur_id: string | null; poids: number; est_collectif: boolean };
type ActRow = {
  id: string; objectif_id: string; libelle: string; nature: string; type_mesure: string;
  poids: number; cible: number | null; date_echeance: string | null; statut: string;
};
type EvalRow = {
  action_id: string; periode_mois: string; resultat: number | null; note: number | null;
  resultat_manager: number | null; note_manager: number | null; actif_mois: boolean;
};

function mesure(typeMesure: string, resultat: number | null, note: number | null, cible: number | null): MesureAction {
  return typeMesure === 'quantitatif'
    ? { typeMesure: 'quantitatif', resultat: resultat ?? 0, cible: cible ?? undefined }
    : { typeMesure: 'qualitatif', note: note ?? 0 };
}

/**
 * Charge la campagne la plus récente d'un tenant et reconstruit les employés
 * (objectifs → actions → mois self/manager). Retourne null pour repli mock.
 */
export async function fetchPerfEmployesLive(tenantId: string = DEMO_TENANT): Promise<MockEmploye[] | null> {
  if (!isBackendConfigured || !supabase) return null;
  try {
    const sb = supabase.schema(SCHEMA);

    const { data: camp } = await sb
      .from('perf_campagnes').select('id')
      .eq('tenant_id', tenantId).order('annee', { ascending: false }).limit(1).maybeSingle();
    if (!camp) return null;
    const campagneId = (camp as { id: string }).id;

    const { data: objs } = await sb
      .from('perf_objectifs').select('id, porteur_id, poids, est_collectif, libelle')
      .eq('campagne_id', campagneId).eq('niveau', 'employe').is('remplace_id', null);
    const objRows = (objs ?? []) as (ObjRow & { libelle: string })[];
    if (objRows.length === 0) return null;

    const objIds = objRows.map((o) => o.id);
    const [{ data: acts }, { data: contribs }] = await Promise.all([
      sb.from('perf_actions').select('id, objectif_id, libelle, nature, type_mesure, poids, cible, date_echeance, statut').in('objectif_id', objIds),
      sb.from('perf_objectif_contributions').select('employe_id, poids_contribution').eq('tenant_id', tenantId),
    ]);
    const actRows = (acts ?? []) as ActRow[];
    const actIds = actRows.map((a) => a.id);

    const { data: evals } = actIds.length
      ? await sb.from('perf_action_evaluations')
          .select('action_id, periode_mois, resultat, note, resultat_manager, note_manager, actif_mois')
          .in('action_id', actIds)
      : { data: [] as EvalRow[] };
    const evalRows = (evals ?? []) as EvalRow[];

    const porteurs = [...new Set(objRows.map((o) => o.porteur_id).filter(Boolean))] as string[];
    const { data: emps } = porteurs.length
      ? await sb.from('employees').select('id, department, manager_id').in('id', porteurs)
      : { data: [] };
    type EmpRow = { id: string; department: string | null; manager_id: string | null };
    type ContribRow = { employe_id: string; poids_contribution: number };
    const empMeta = new Map(((emps ?? []) as EmpRow[]).map((e) => [e.id, e]));
    const contribMap = new Map(((contribs ?? []) as ContribRow[]).map((c) => [c.employe_id, c.poids_contribution]));

    // regroupe évals par action, actions par objectif, objectifs par porteur
    const evalsByAction = new Map<string, EvalRow[]>();
    for (const e of evalRows) evalsByAction.set(e.action_id, [...(evalsByAction.get(e.action_id) ?? []), e]);
    const actsByObj = new Map<string, ActRow[]>();
    for (const a of actRows) actsByObj.set(a.objectif_id, [...(actsByObj.get(a.objectif_id) ?? []), a]);

    const byEmploye = new Map<string, MockObjectif[]>();
    for (const o of objRows) {
      if (!o.porteur_id) continue;
      const actions: MockAction[] = (actsByObj.get(o.id) ?? []).map((a) => {
        const moisS1: MockActionMois[] = (evalsByAction.get(a.id) ?? [])
          .sort((x, y) => x.periode_mois.localeCompare(y.periode_mois))
          .map((e) => ({
            mois: e.periode_mois,
            self: mesure(a.type_mesure, e.resultat, e.note, a.cible),
            manager: mesure(a.type_mesure, e.resultat_manager, e.note_manager, a.cible),
            actif: e.actif_mois,
          }));
        return {
          id: a.id, libelle: a.libelle,
          nature: a.nature === 'one_shot' ? 'one_shot' : 'continue',
          typeMesure: a.type_mesure === 'qualitatif' ? 'qualitatif' : 'quantitatif',
          poids: a.poids, cible: a.cible ?? undefined,
          dateEcheance: a.date_echeance ?? undefined, statut: a.statut, moisS1,
        };
      });
      byEmploye.set(o.porteur_id, [
        ...(byEmploye.get(o.porteur_id) ?? []),
        { id: o.id, libelle: (o as ObjRow & { libelle: string }).libelle, poids: o.poids, estCollectif: o.est_collectif, actions },
      ]);
    }

    const employes: MockEmploye[] = [...byEmploye.entries()].map(([employeId, objectifs]) => ({
      employeId,
      departement: empMeta.get(employeId)?.department ?? '—',
      managerId: empMeta.get(employeId)?.manager_id ?? undefined,
      poidsContribution: contribMap.get(employeId) ?? 1,
      objectifs,
    }));
    return employes.length ? employes : null;
  } catch {
    return null;
  }
}
