import { Sparkles } from 'lucide-react';
import { Modal } from '../ui/overlays';
import { explainBulletin } from '../../lib/m3/explain';
import { employeeName, type EmployeeRecord } from '../../data/mock';
import type { PayrollVariables } from '../../lib/m3/types';
import { cn } from '../../lib/cn';

/** Explication step-by-step déterministe du calcul d'un bulletin (doc 06). */
export function ExplainCalculModal({ emp, variables, onClose }: { emp: EmployeeRecord; variables: PayrollVariables; onClose: () => void }) {
  const steps = explainBulletin(emp, variables);
  return (
    <Modal open onClose={onClose} size="lg" title={`Comment ce bulletin est calculé — ${employeeName(emp)}`}>
      <div className="space-y-3">
        <p className="flex items-start gap-2 rounded-xl bg-amber/[0.06] px-3 py-2 text-[12px] font-medium text-ink-700">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-amber-deep" />
          Calcul 100 % déterministe (Money entier, arrondi explicite). Proph3t explique chaque étape — il ne calcule jamais le montant.
        </p>
        {steps.map((s) => (
          <div key={s.n} className="rounded-2xl border border-line bg-surface2/40 p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber/15 text-[12px] font-bold text-amber-deep">{s.n}</span>
              <p className="text-sm font-bold text-ink">{s.title}</p>
            </div>
            {s.note && <p className="mb-2 text-[11px] font-medium text-ink-400">{s.note}</p>}
            <div className="space-y-0.5">
              {s.rows.map((r, i) => (
                <div key={i} className={cn('flex items-center justify-between', r.sub ? 'pl-3 text-[12px] font-medium text-ink-500' : 'border-t border-line/60 pt-1 text-[13px] font-bold text-ink')}>
                  <span className="pr-3">{r.label}</span>
                  <span className="mono shrink-0">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
