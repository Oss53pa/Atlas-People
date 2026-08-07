import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Printer } from 'lucide-react';
import { Button } from '../ui/Button';
import { PayslipDocument, PAYSLIP_TEMPLATES, type PayslipTemplate } from './PayslipDocument';
import type { PayslipComputation } from '../../lib/payroll';
import type { EmployeeRecord } from '../../data/mock';
import { cn } from '../../lib/cn';

// Dimensions A4 portrait en pixels écran (96 CSS px/in ÷ 25.4 mm/in)
const MM = 96 / 25.4;
const A4_W = Math.round(210 * MM); // 794 px
const A4_H = Math.round(297 * MM); // 1123 px

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
  const areaRef   = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.74);

  // ── Scale dynamique ─────────────────────────────────────────────
  // Calcule le facteur d'échelle pour que la page A4 tienne entièrement
  // dans la zone visible sans scroll, quelle que soit la taille de l'écran.
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const compute = () => {
      const sw = area.clientWidth  - 48; // 24 px de marge de chaque côté
      const sh = area.clientHeight - 48;
      setScale(Math.min(sw / A4_W, sh / A4_H, 1));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(area);
    return () => ro.disconnect();
  }, []);

  // ── Neutralise le transform avant impression ─────────────────────
  // position:fixed doit être relatif à la page (viewport print) et non
  // au parent CSS transformé (qui piégerait le fixed → 2 pages à l'impression).
  useEffect(() => {
    const onBefore = () => {
      if (scalerRef.current) scalerRef.current.style.transform = 'none';
    };
    const onAfter = () => {
      if (scalerRef.current) scalerRef.current.style.transform = `scale(${scale})`;
    };
    window.addEventListener('beforeprint', onBefore);
    window.addEventListener('afterprint',  onAfter);
    return () => {
      window.removeEventListener('beforeprint', onBefore);
      window.removeEventListener('afterprint',  onAfter);
    };
  }, [scale]);

  const handlePrint = useCallback(() => {
    document.body.classList.add('print-payslip');
    window.print();
    setTimeout(() => document.body.classList.remove('print-payslip'), 600);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink/50 backdrop-blur-sm">

      {/* ─── Barre chrome — sélecteur + impression + fermer ─── */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 bg-ink/80 px-4 py-3">
        <p className="text-sm font-bold text-white">Bulletin de paie · {period}</p>
        <div className="flex flex-wrap items-center gap-2">
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
          <Button size="sm" onClick={handlePrint}>
            <Printer size={14} /> Imprimer / PDF
          </Button>
          <button onClick={onClose} className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ─── Zone de prévisualisation — page A4 entière, centrée, sans scroll ─── */}
      <div
        ref={areaRef}
        className="flex flex-1 items-center justify-center overflow-hidden bg-neutral-600/40 p-6"
      >
        {/*
          Outer wrapper : prend dans le flux les dimensions réduites (A4 × scale).
          Sans ce wrapper, le document A4 à taille réelle serait centré AVANT
          le scale et dépasserait la zone → barre de scroll indésirable.
        */}
        <div
          style={{
            width:    A4_W * scale,
            height:   A4_H * scale,
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {/*
            Inner scaler : le transform scale(…) réduit visuellement le document.
            scalerRef => on lui retire le transform juste avant l'impression (beforeprint),
            ce qui garantit que position:fixed dans @media print est bien relatif à la page
            A4 et non au parent transformé (= 1 seule page garantie).
          */}
          <div
            ref={scalerRef}
            style={{
              position:        'absolute',
              top:             0,
              left:            0,
              transform:       `scale(${scale})`,
              transformOrigin: 'top left',
              boxShadow:       '0 8px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.12)',
            }}
          >
            <PayslipDocument
              employee={employee}
              computation={computation}
              period={period}
              template={template}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
