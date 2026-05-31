/**
 * M7 OKR — données démo : cascade Entreprise → Département → Équipe → Individu.
 * Cycle actif : Q2 2026 (1er avril → 30 juin) · check-in hebdo · ~25 OKRs.
 */
import { CYCLES, confidenceFromProgress } from './referentiels';
import type { Objective, KeyResult, CheckIn, OkrCycle, OkrKPI, AlignmentEdge } from './types';

const TODAY = new Date('2026-05-31');

// Quel jour du cycle est-on ? (Q2 cycle, ~ 60 jours sur 91)
const cycleStart = new Date('2026-04-01');
const cycleEnd = new Date('2026-06-30');
const cycleProgress = Math.min(1, Math.max(0, (TODAY.getTime() - cycleStart.getTime()) / (cycleEnd.getTime() - cycleStart.getTime())));

// ─────────────────────────────────────── CYCLES export
export const OKR_CYCLES: OkrCycle[] = CYCLES.map((c) => ({ ...c, objectivesCount: 0 }));
export const activeCycle = OKR_CYCLES.find((c) => c.status === 'active')!;

// ─────────────────────────────────────── OBJECTIVES (cascade)
const objectives: Objective[] = [];
const krs: KeyResult[] = [];
const aligns: AlignmentEdge[] = [];

let oIdx = 1, kIdx = 1;
function nextOref() { return `OBJ-2026-Q2-${String(oIdx++).padStart(4, '0')}`; }
function nextKref() { return `KR-2026-Q2-${String(kIdx++).padStart(4, '0')}`; }

function addObj(o: Omit<Objective, 'id' | 'ref' | 'cycleId' | 'startedAt' | 'progress' | 'confidence' | 'status'> & { progress: number; status?: Objective['status'] }): Objective {
  const ref = nextOref();
  const conf = confidenceFromProgress(o.progress, cycleProgress);
  const obj: Objective = {
    id: `obj-${oIdx - 1}`, ref,
    cycleId: activeCycle.id,
    startedAt: '2026-04-01',
    confidence: conf,
    status: o.status ?? 'active',
    ...o,
  };
  objectives.push(obj);
  if (obj.parentObjectiveId) aligns.push({ childObjectiveId: obj.id, parentObjectiveId: obj.parentObjectiveId, contribution: 'primary' });
  return obj;
}

function addKR(objectiveId: string, k: Omit<KeyResult, 'id' | 'ref' | 'objectiveId' | 'confidence' | 'lastUpdatedAt'>): KeyResult {
  const progress = (k.currentValue - k.startValue) / Math.max(0.0001, (k.targetValue - k.startValue));
  const kr: KeyResult = {
    id: `kr-${kIdx - 1}`, ref: nextKref(), objectiveId,
    confidence: confidenceFromProgress(Math.max(0, Math.min(1, progress)), cycleProgress),
    lastUpdatedAt: '2026-05-26',
    ...k,
  };
  krs.push(kr);
  return kr;
}

// ─── COMPANY (3 OKRs)
const obj1 = addObj({ level: 'company', title: 'Accélérer la croissance du chiffre d\'affaires Q2', description: 'Pousser les indicateurs de croissance pour atteindre la trajectoire annuelle', ownerEmployeeId: 'e1', progress: 0.55 });
const obj2 = addObj({ level: 'company', title: 'Faire d\'Atlas la référence Customer-Loved en Afrique francophone', description: 'NPS, churn, NRR — focus rétention & satisfaction', ownerEmployeeId: 'e1', progress: 0.72 });
const obj3 = addObj({ level: 'company', title: 'Industrialiser la livraison produit & paie', description: 'Vélocité tech + qualité paie multi-pays', ownerEmployeeId: 'e1', progress: 0.6 });

addKR(obj1.id, { title: 'Atteindre 850 M FCFA de revenu trimestriel', type: 'currency', startValue: 0, targetValue: 850_000_000, currentValue: 510_000_000, unit: 'FCFA', ownerEmployeeId: 'e4', weight: 5 });
addKR(obj1.id, { title: 'Acquérir 12 nouveaux comptes Tier 1', type: 'numeric', startValue: 0, targetValue: 12, currentValue: 7, ownerEmployeeId: 'e4', weight: 4 });
addKR(obj1.id, { title: 'Activer 2 nouveaux pays (présence commerciale)', type: 'numeric', startValue: 0, targetValue: 2, currentValue: 1, ownerEmployeeId: 'e13', weight: 3 });
addKR(obj2.id, { title: 'Porter le NPS produit à 55+', type: 'numeric', startValue: 32, targetValue: 55, currentValue: 47, ownerEmployeeId: 'e11', weight: 5 });
addKR(obj2.id, { title: 'Réduire le churn annuel à 8 %', type: 'percent', startValue: 18, targetValue: 8, currentValue: 12, unit: '%', ownerEmployeeId: 'e11', weight: 5 });
addKR(obj2.id, { title: 'NRR portée à 115 %', type: 'percent', startValue: 95, targetValue: 115, currentValue: 108, unit: '%', ownerEmployeeId: 'e4', weight: 4 });
addKR(obj3.id, { title: 'Déployer la paie M3 sur 5 pays UEMOA', type: 'numeric', startValue: 2, targetValue: 5, currentValue: 3, ownerEmployeeId: 'e2', weight: 5 });
addKR(obj3.id, { title: 'Réduire le lead-time des PRs < 36 h (médiane)', type: 'numeric', startValue: 72, targetValue: 36, currentValue: 48, unit: 'h', ownerEmployeeId: 'e2', weight: 4 });

// ─── DEPARTMENT (5 OKRs)
const obj4 = addObj({ level: 'department', title: 'Engineering : doubler la vélocité produit', ownerEmployeeId: 'e2', ownerTeam: 'Technologie', parentObjectiveId: obj3.id, progress: 0.62 });
const obj5 = addObj({ level: 'department', title: 'Commercial : closer 12 comptes Tier 1', ownerEmployeeId: 'e4', ownerTeam: 'Ventes', parentObjectiveId: obj1.id, progress: 0.58 });
const obj6 = addObj({ level: 'department', title: 'RH : industrialiser le recrutement Tech', ownerEmployeeId: 'e3', ownerTeam: 'Ressources Humaines', parentObjectiveId: obj3.id, progress: 0.51 });
const obj7 = addObj({ level: 'department', title: 'Customer Success : NPS 55+ et churn -10pts', ownerEmployeeId: 'e11', ownerTeam: 'Customer Success', parentObjectiveId: obj2.id, progress: 0.7 });
const obj8 = addObj({ level: 'department', title: 'Finance : passer à un closing < 5 j ouvrés', ownerEmployeeId: 'e1', ownerTeam: 'Finance', progress: 0.4 });

addKR(obj4.id, { title: '95 % de coverage tests sur cœur paie', type: 'percent', startValue: 78, targetValue: 95, currentValue: 88, unit: '%', ownerEmployeeId: 'e8', weight: 5 });
addKR(obj4.id, { title: '3 déploiements prod par semaine', type: 'numeric', startValue: 1, targetValue: 3, currentValue: 2, ownerEmployeeId: 'e8', weight: 4 });
addKR(obj4.id, { title: 'Time-to-recovery incident < 60 min', type: 'numeric', startValue: 180, targetValue: 60, currentValue: 90, unit: 'min', ownerEmployeeId: 'e2', weight: 3 });
addKR(obj5.id, { title: 'Pipeline qualifié 1,8 Md FCFA', type: 'currency', startValue: 800_000_000, targetValue: 1_800_000_000, currentValue: 1_200_000_000, unit: 'FCFA', ownerEmployeeId: 'e4', weight: 5 });
addKR(obj5.id, { title: 'Cycle de vente < 90 j (médiane)', type: 'numeric', startValue: 120, targetValue: 90, currentValue: 102, unit: 'j', ownerEmployeeId: 'e4', weight: 4 });
addKR(obj6.id, { title: 'Embaucher 8 ingénieurs senior', type: 'numeric', startValue: 0, targetValue: 8, currentValue: 3, ownerEmployeeId: 'e7', weight: 5 });
addKR(obj6.id, { title: 'Time-to-fill ≤ 40 jours (médiane)', type: 'numeric', startValue: 60, targetValue: 40, currentValue: 45, unit: 'j', ownerEmployeeId: 'e7', weight: 4 });
addKR(obj6.id, { title: 'NPS candidat ≥ 60', type: 'numeric', startValue: 45, targetValue: 60, currentValue: 58, ownerEmployeeId: 'e7', weight: 3 });
addKR(obj7.id, { title: 'NPS Customer 47 → 55+', type: 'numeric', startValue: 47, targetValue: 55, currentValue: 51, ownerEmployeeId: 'e11', weight: 5 });
addKR(obj7.id, { title: 'Churn -10pts (18 % → 8 %)', type: 'percent', startValue: 18, targetValue: 8, currentValue: 12, unit: '%', ownerEmployeeId: 'e11', weight: 5 });
addKR(obj8.id, { title: 'Réduire le closing à 5 jours ouvrés', type: 'numeric', startValue: 12, targetValue: 5, currentValue: 8, unit: 'j', ownerEmployeeId: 'e6', weight: 5 });
addKR(obj8.id, { title: 'Automatiser 80 % des écritures', type: 'percent', startValue: 40, targetValue: 80, currentValue: 55, unit: '%', ownerEmployeeId: 'e6', weight: 4 });

// ─── TEAM (4 OKRs sous Engineering / Sales / RH)
const obj9 = addObj({ level: 'team', title: 'Squad Paie : passer à 5 pays sur le module M3', ownerEmployeeId: 'e2', ownerTeam: 'Squad Paie', parentObjectiveId: obj4.id, progress: 0.65 });
const obj10 = addObj({ level: 'team', title: 'Squad Platform : SLO 99,95 %', ownerEmployeeId: 'e8', ownerTeam: 'Squad Platform', parentObjectiveId: obj4.id, progress: 0.78 });
const obj11 = addObj({ level: 'team', title: 'Account Strategic : signer 6 logos Tier 1', ownerEmployeeId: 'e4', ownerTeam: 'Strategic Sales', parentObjectiveId: obj5.id, progress: 0.5 });
const obj12 = addObj({ level: 'team', title: 'Talent Acquisition Tech : closer 8 ingés', ownerEmployeeId: 'e7', ownerTeam: 'Talent Acquisition', parentObjectiveId: obj6.id, progress: 0.4 });

addKR(obj9.id, { title: 'CI/CD Sénégal opérationnel', type: 'binary', startValue: 0, targetValue: 1, currentValue: 1, ownerEmployeeId: 'e10', weight: 4 });
addKR(obj9.id, { title: 'Modèles paie Mali livrés', type: 'milestone', startValue: 0, targetValue: 5, currentValue: 3, ownerEmployeeId: 'e2', weight: 5 });
addKR(obj9.id, { title: 'Charge utilisateur tests UAT', type: 'percent', startValue: 0, targetValue: 100, currentValue: 60, unit: '%', ownerEmployeeId: 'e10', weight: 3 });
addKR(obj10.id, { title: 'Uptime production ≥ 99,95 %', type: 'percent', startValue: 99.7, targetValue: 99.95, currentValue: 99.92, unit: '%', ownerEmployeeId: 'e8', weight: 5 });
addKR(obj10.id, { title: 'MTBF doublé', type: 'numeric', startValue: 120, targetValue: 240, currentValue: 190, unit: 'h', ownerEmployeeId: 'e8', weight: 4 });
addKR(obj11.id, { title: '6 logos Tier 1 signés', type: 'numeric', startValue: 0, targetValue: 6, currentValue: 3, ownerEmployeeId: 'e4', weight: 5 });
addKR(obj11.id, { title: 'Win-rate ≥ 40 %', type: 'percent', startValue: 25, targetValue: 40, currentValue: 33, unit: '%', ownerEmployeeId: 'e4', weight: 4 });
addKR(obj12.id, { title: '8 offres acceptées Tech', type: 'numeric', startValue: 0, targetValue: 8, currentValue: 3, ownerEmployeeId: 'e7', weight: 5 });
addKR(obj12.id, { title: 'Taux acceptation offres ≥ 75 %', type: 'percent', startValue: 60, targetValue: 75, currentValue: 71, unit: '%', ownerEmployeeId: 'e7', weight: 4 });

// ─── INDIVIDUAL (5 OKRs personnels)
const obj13 = addObj({ level: 'individual', title: 'Livrer la migration paie Sénégal en prod', ownerEmployeeId: 'e2', parentObjectiveId: obj9.id, progress: 0.7 });
const obj14 = addObj({ level: 'individual', title: 'Lancer la facturation SaaS Atlas Studio', ownerEmployeeId: 'e1', progress: 0.45 });
const obj15 = addObj({ level: 'individual', title: 'Recruter 3 commerciaux Tier 1 confirmés', ownerEmployeeId: 'e7', parentObjectiveId: obj12.id, progress: 0.55 });
const obj16 = addObj({ level: 'individual', title: 'Refondre l\'onboarding produit (NPS 50+)', ownerEmployeeId: 'e5', parentObjectiveId: obj7.id, progress: 0.6 });
const obj17 = addObj({ level: 'individual', title: 'Convertir 4 comptes pilotes en contrats', ownerEmployeeId: 'e4', parentObjectiveId: obj11.id, progress: 0.5 });

addKR(obj13.id, { title: 'Tests UAT 100 % verts SN', type: 'percent', startValue: 0, targetValue: 100, currentValue: 80, unit: '%', ownerEmployeeId: 'e2', weight: 5 });
addKR(obj13.id, { title: 'Go-live production Sénégal', type: 'binary', startValue: 0, targetValue: 1, currentValue: 0, ownerEmployeeId: 'e2', weight: 5 });
addKR(obj14.id, { title: 'Spec finalisée + validée', type: 'binary', startValue: 0, targetValue: 1, currentValue: 1, ownerEmployeeId: 'e1', weight: 3 });
addKR(obj14.id, { title: 'POC technique livré', type: 'binary', startValue: 0, targetValue: 1, currentValue: 0, ownerEmployeeId: 'e1', weight: 4 });
addKR(obj15.id, { title: '3 commerciaux Tier 1 signés', type: 'numeric', startValue: 0, targetValue: 3, currentValue: 2, ownerEmployeeId: 'e7', weight: 5 });
addKR(obj16.id, { title: 'NPS onboarding ≥ 50', type: 'numeric', startValue: 30, targetValue: 50, currentValue: 42, ownerEmployeeId: 'e5', weight: 5 });
addKR(obj16.id, { title: 'Réduire le time-to-first-value à 7 j', type: 'numeric', startValue: 21, targetValue: 7, currentValue: 12, unit: 'j', ownerEmployeeId: 'e5', weight: 4 });
addKR(obj17.id, { title: '4 contrats annuels signés', type: 'numeric', startValue: 0, targetValue: 4, currentValue: 2, ownerEmployeeId: 'e4', weight: 5 });

// ─────────────────────────────────────── CHECK-INS (3 semaines récentes par OKR principal)
const checkins: CheckIn[] = [];
let ciIdx = 1;
const weeks = ['2026-W19', '2026-W20', '2026-W21'];
for (const o of objectives) {
  if (o.level === 'individual' || o.level === 'team' || o.level === 'department') {
    for (const w of weeks) {
      checkins.push({
        id: `ci-${ciIdx}`, ref: `CHK-2026-${String(ciIdx).padStart(4, '0')}`,
        objectiveId: o.id,
        authorEmployeeId: o.ownerEmployeeId ?? 'e1',
        weekOf: w,
        submittedAt: w === '2026-W21' ? '2026-05-26' : w === '2026-W20' ? '2026-05-19' : '2026-05-12',
        progressDelta: 0.05 + ((ciIdx % 4) * 0.02),
        confidence: o.confidence,
        highlights: w === '2026-W21' ? 'Bonne dynamique cette semaine, deux deals avancés' : 'Avancement normal',
        blockers: o.confidence !== 'green' ? 'Recrutement plus lent que prévu — pipeline candidats à élargir' : undefined,
        nextSteps: 'Synchroniser avec sponsor mardi prochain',
      });
      ciIdx++;
    }
  }
}

// ─────────────────────────────────────── Export
export const OBJECTIVES: Objective[] = objectives;
export const KEY_RESULTS: KeyResult[] = krs;
export const ALIGNMENTS: AlignmentEdge[] = aligns;
export const CHECKINS: CheckIn[] = checkins;

// Met à jour le compteur des cycles
for (const c of OKR_CYCLES) c.objectivesCount = OBJECTIVES.filter((o) => o.cycleId === c.id).length;

// ─────────────────────────────────────── Helpers
export const objectiveById = (id: string) => OBJECTIVES.find((o) => o.id === id);
export const krsByObjective = (id: string) => KEY_RESULTS.filter((k) => k.objectiveId === id);
export const childObjectives = (parentId: string) => OBJECTIVES.filter((o) => o.parentObjectiveId === parentId);
export const checkinsByObjective = (id: string) => CHECKINS.filter((c) => c.objectiveId === id);
export const cycleById = (id: string) => OKR_CYCLES.find((c) => c.id === id);

export function kpis(): OkrKPI {
  const active = OBJECTIVES.filter((o) => o.status === 'active');
  const krActive = KEY_RESULTS.filter((k) => objectiveById(k.objectiveId)?.status === 'active');
  const avgProg = active.length ? active.reduce((s, o) => s + o.progress, 0) / active.length : 0;
  const greenPct = active.length ? Math.round((active.filter((o) => o.confidence === 'green').length / active.length) * 100) : 0;
  const expectedCheckIns = active.filter((o) => o.level !== 'company').length;
  const submittedThisWeek = CHECKINS.filter((c) => c.weekOf === '2026-W21').length;
  const late = Math.max(0, expectedCheckIns - submittedThisWeek);
  const aligned = OBJECTIVES.filter((o) => o.level !== 'company' && o.parentObjectiveId).length;
  const denomAlign = OBJECTIVES.filter((o) => o.level !== 'company').length;
  const alignPct = denomAlign ? Math.round((aligned / denomAlign) * 100) : 0;
  return {
    cyclesActifs: OKR_CYCLES.filter((c) => c.status === 'active').length,
    objectifsActifs: active.length,
    krsActifs: krActive.length,
    progressionMoyenne: avgProg,
    confidenceGreenPct: greenPct,
    checkInsEnRetard: late,
    alignementCoveragePct: alignPct,
    scoreMoyenCloture: 0.72,
  };
}
