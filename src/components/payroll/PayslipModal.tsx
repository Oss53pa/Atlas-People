import { useState } from 'react';
import { X, Printer } from 'lucide-react';
import { Button } from '../ui/Button';
import { PayslipDocument, PAYSLIP_TEMPLATES, type PayslipTemplate } from './PayslipDocument';
import type { PayslipComputation } from '../../lib/payroll';
import type { EmployeeRecord } from '../../data/mock';
import { cn } from '../../lib/cn';

export function PayslipModal({
  employee,
  computation,
  period,
  onClose,
  initialTemplate = 'standard',
}: {
  employee: EmployeeRecord;
  computation: PayslipComputation;
  period: string;
  onClose: () => void;
  initialTemplate?: PayslipTemplate;
}) {
  const [template, setTemplate] = useState<PayslipTemplate>(initialTemplate);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink/50 backdrop-blur-sm">
      <div className="no-print flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <p className="text-sm font-bold text-white">Bulletin de paie · {period}</p>
        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de modèle */}
          <div className="flex items-center gap-0.5 rounded-xl bg-white/10 p-0.5">
            {PAYSLIP_TEMPLATES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTemplate(t.key)}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors',
                  template === t.key ? 'bg-white text-ink' : 'text-white/80 hover:text-white',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => {
            document.body.classList.add('print-payslip');
            window.print();
            setTimeout(() => document.body.classList.remove('print-payslip'), 500);
          }}>
            <Printer size={14} /> Imprimer / PDF
          </Button>
          <button onClick={onClose} className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-8">
        <div className="mx-auto max-w-[800px] rounded-2xl shadow-float">
          <PayslipDocument employee={employee} computation={computation} period={period} template={template} />
        </div>
      </div>
    </div>
  );
}
