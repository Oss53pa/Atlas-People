import { X, Printer } from 'lucide-react';
import { Button } from '../ui/Button';
import { PayslipDocument } from './PayslipDocument';
import type { PayslipComputation } from '../../lib/payroll';
import type { EmployeeRecord } from '../../data/mock';

export function PayslipModal({
  employee,
  computation,
  period,
  onClose,
}: {
  employee: EmployeeRecord;
  computation: PayslipComputation;
  period: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink/50 backdrop-blur-sm">
      <div className="no-print flex items-center justify-between px-4 py-3">
        <p className="text-sm font-bold text-white">Bulletin de paie · {period}</p>
        <div className="flex items-center gap-2">
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
          <PayslipDocument employee={employee} computation={computation} period={period} />
        </div>
      </div>
    </div>
  );
}
