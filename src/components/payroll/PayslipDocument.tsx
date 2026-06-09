/**
 * Template officiel du bulletin de paie — Page A4 portrait exacte.
 *
 * Architecture :
 *   Container : width=210mm, height=297mm (fixe, toujours une page A4).
 *   Layout    : flex-col — la section TABLEAU prend tout l'espace restant
 *               (flex-1 + overflow: hidden) → le bulletin remplit TOUJOURS
 *               la feuille quelle que soit la quantité de rubriques.
 *   Impression : @page payslipPage { size: A4 portrait; margin: 6mm; }
 *               + body.print-payslip → 1 page garantie.
 *   Aperçu    : PayslipModal affiche la page A4 à une échelle adaptée à l'écran.
 */
import { useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Money } from '../../lib/money';
import type { PayslipComputation } from '../../lib/payroll';
import type { PayslipLine } from '../../lib/payroll/types';
import { matricule, mobileMoney, type EmployeeRecord } from '../../data/mock';
import { countryByCode } from '../../data/countries';

export type PayslipTemplate = 'standard' | 'clarifie' | 'classique';

export const PAYSLIP_TEMPLATES: { key: PayslipTemplate; label: string }[] = [
  { key: 'standard', label: 'Standard OHADA' },
  { key: 'clarifie', label: 'Clarifié' },
  { key: 'classique', label: 'Classique' },
];

export function PayslipDocument({
  employee,
  computation,
  period,
  tenantName = 'Atlas Demo SA',
  template = 'standard',
}: {
  employee: EmployeeRecord;
  computation: PayslipComputation;
  period: string;
  tenantName?: string;
  template?: PayslipTemplate;
}) {
  const { result, verification, accounting } = computation;
  const currency = result.currency;
  const M = (u: string) => Money.fromJSON({ units: u, currency });
  const fmt = (n: number) => Money.of(Math.round(n), currency).format();
  const country = countryByCode(employee.countryCode);

  const earnings = result.lines.filter((l) => l.kind === 'earning');
  const combos = combinedRows(result.lines);

  const totalGains = M(result.grossTotalUnits);
  const totalRetenues = totalGains.subtract(M(result.netToPayUnits));
  const totalPatronal = M(result.totalEmployerContributionUnits).add(M(result.totalEmployerTaxUnits));
  const netImposable = M(result.grossTaxableUnits).subtract(M(result.totalEmployeeContributionUnits));
  const employeurCost = M(result.employerCostUnits);
  const auditHash = pseudoHash(`${matricule(employee)}|${period}|${result.netToPayUnits}`);
  const templateLabel = PAYSLIP_TEMPLATES.find((t) => t.key === template)?.label ?? '';
  const bulletinRef = `BUL-${period.replace(/[^A-Z0-9]/gi, '').slice(0, 6)}-${matricule(employee).slice(-3)}`;

  // Auto-tag body.print-payslip sur Ctrl+P
  useEffect(() => {
    const onBefore = () => document.body.classList.add('print-payslip');
    const onAfter  = () => document.body.classList.remove('print-payslip');
    window.addEventListener('beforeprint', onBefore);
    window.addEventListener('afterprint',  onAfter);
    const mq = window.matchMedia('print');
    const onChange = (e: MediaQueryListEvent) => { if (e.matches) onBefore(); else onAfter(); };
    mq.addEventListener?.('change', onChange);
    return () => {
      window.removeEventListener('beforeprint', onBefore);
      window.removeEventListener('afterprint',  onAfter);
      mq.removeEventListener?.('change', onChange);
      document.body.classList.remove('print-payslip');
    };
  }, []);

  // Nombre de lignes pour adapter la taille de police dans la section tableau
  const totalRows = earnings.length + combos.length;
  const tableFontPt = totalRows <= 8  ? 10
                    : totalRows <= 12 ? 9
                    : totalRows <= 16 ? 8.5
                    : totalRows <= 20 ? 8
                    : totalRows <= 24 ? 7.5
                    : 7;

  return (
    /*
     * ════════════════════════════════════════════════════════════════
     * PAGE A4 PORTRAIT — 210 × 297 mm (fixe, toujours pleine page).
     * display: flex + flex-direction: column + overflow: hidden
     * → le contenu NE PEUT PAS dépasser la feuille A4.
     * → la section tableau (flex-1) remplit tout l'espace disponible.
     * ════════════════════════════════════════════════════════════════
     */
    <div
      className="payslip-print"
      style={{
        width: '210mm',
        height: '297mm',
        overflow: 'hidden',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '6mm 7mm',
        fontFamily: '"Inter", "Segoe UI", sans-serif',
        color: '#1a1a1a',
        boxSizing: 'border-box',
      }}
      data-rows={totalRows}
    >

      {/* ═══ EN-TÊTE — Identité société + référence ═══ */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'2px solid #1a1a1a', paddingBottom:'3mm', marginBottom:'2.5mm', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'3mm' }}>
          <div style={{ width:'7mm', height:'7mm', background:'#fef3e2', borderRadius:'1.5mm', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg viewBox="0 0 64 64" style={{ width:'4.5mm', height:'4.5mm' }}>
              <path d="M32 14 L50 50 H41 L32 31 L23 50 H14 Z" fill="#C97E12" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize:'10pt', fontWeight:700, lineHeight:1.2, textTransform:'uppercase', letterSpacing:'0.02em', margin:0 }}>{tenantName}</p>
            <p style={{ fontSize:'7.5pt', color:'#555', margin:0, lineHeight:1.2 }}>{country.name} · {country.socialFund}</p>
            <p style={{ fontSize:'7pt', color:'#888', margin:0, lineHeight:1.2 }}>NCC ——— · RCCM ——— · {country.name}</p>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <p style={{ fontSize:'7.5pt', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', color:'#C97E12', margin:0 }}>Bulletin de paie</p>
          <p style={{ fontFamily:'monospace', fontSize:'14pt', fontWeight:800, lineHeight:1.2, margin:0 }}>{period}</p>
          <p style={{ fontFamily:'monospace', fontSize:'7pt', color:'#888', margin:0 }}>N° {bulletinRef}</p>
          <p style={{ fontSize:'6.5pt', textTransform:'uppercase', letterSpacing:'0.1em', color:'#aaa', margin:0 }}>Modèle : {templateLabel} · {currency}</p>
        </div>
      </div>

      {/* ═══ IDENTITÉ SALARIÉ — grille 2 colonnes ═══ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', columnGap:'5mm', borderBottom:'1px solid #ccc', paddingBottom:'2mm', marginBottom:'2mm', flexShrink:0 }}>
        {[
          ['Matricule', matricule(employee), true],
          ["Date d'embauche", new Date(employee.hireDate).toLocaleDateString('fr-FR'), false],
          ['Nom & prénom', `${employee.lastName} ${employee.firstName}`, false],
          ['Type de contrat', employee.contractType, false],
          ['Emploi', employee.role, false],
          ['Parts fiscales', String(employee.fiscalParts), true],
          ['Département', employee.department, false],
          ['Régime / Pays', `${country.socialFund} · ${employee.countryCode}`, false],
        ].map(([label, value, mono]) => (
          <div key={label as string} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:'2mm', borderBottom:'1px dotted #e0e0e0', paddingTop:'0.8mm', paddingBottom:'0.8mm' }}>
            <span style={{ fontSize:'7pt', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#888', flexShrink:0 }}>{label as string}</span>
            <span style={{ fontSize:'8.5pt', fontWeight:600, fontFamily: mono ? 'monospace' : 'inherit', textAlign:'right', color:'#1a1a1a' }}>{value as string}</span>
          </div>
        ))}
      </div>

      {/* ═══ TABLEAU DES RUBRIQUES — flex-1, remplit tout l'espace libre ═══ */}
      <div style={{ flex:1, overflow:'hidden', marginBottom:'2mm' }}>
        {template === 'standard'  && <StandardTable  earnings={earnings} combos={combos} fmt={fmt} M={M} totalGains={totalGains} totalRetenues={totalRetenues} fontPt={tableFontPt} />}
        {template === 'clarifie'  && <ClarifieTable  earnings={earnings} combos={combos} fmt={fmt} M={M} totalGains={totalGains} totalRetenues={totalRetenues} totalPatronal={totalPatronal} fontPt={tableFontPt} />}
        {template === 'classique' && <ClassiqueTable earnings={earnings} combos={combos} fmt={fmt} M={M} totalGains={totalGains} totalRetenues={totalRetenues} totalPatronal={totalPatronal} fontPt={tableFontPt} />}
      </div>

      {/* ═══ NET À PAYER — bandeau sobre ═══ */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'2px solid #C97E12', borderBottom:'2px solid #C97E12', background:'rgba(201,126,18,0.04)', padding:'3mm', marginBottom:'2mm', flexShrink:0 }}>
        <div>
          <p style={{ fontSize:'7.5pt', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', color:'#C97E12', margin:0 }}>Net à payer</p>
          <p style={{ fontSize:'8pt', color:'#666', margin:0 }}>Versé sur Mobile Money {mobileMoney(employee)}</p>
        </div>
        <p style={{ fontFamily:'monospace', fontSize:'18pt', fontWeight:800, color:'#C97E12', lineHeight:1, margin:0 }}>
          {M(result.netToPayUnits).formatWithCurrency()}
        </p>
      </div>

      {/* ═══ RÉCAP — 6 cases ═══ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'2mm', borderBottom:'1px solid #e0e0e0', paddingBottom:'2mm', marginBottom:'2mm', flexShrink:0 }}>
        {[
          ['Net imposable', netImposable.format(), '#1a1a1a'],
          ['Total gains', totalGains.format(), '#1a1a1a'],
          ['Total retenues', totalRetenues.format(), '#b91c1c'],
          ['Charg. patronales', totalPatronal.format(), '#1a1a1a'],
          ['Coût employeur', employeurCost.format(), '#C97E12'],
          ['Heures travail.', '173,33 h', '#1a1a1a'],
        ].map(([label, value, color]) => (
          <div key={label as string} style={{ borderRight:'1px dotted #e0e0e0', paddingRight:'1.5mm', paddingLeft:'0.5mm' }}>
            <p style={{ fontSize:'6.5pt', fontWeight:700, textTransform:'uppercase', color:'#888', margin:0, lineHeight:1.2 }}>{label as string}</p>
            <p style={{ fontSize:'8.5pt', fontWeight:700, fontFamily:'monospace', color:color as string, margin:0, lineHeight:1.3 }}>{value as string}</p>
          </div>
        ))}
      </div>

      {/* ═══ CHARGES PATRONALES info (standard seulement) ═══ */}
      {template === 'standard' && combos.some((r) => r.patAmount != null) && (
        <div style={{ borderBottom:'1px solid #e0e0e0', paddingBottom:'1.5mm', marginBottom:'1.5mm', flexShrink:0 }}>
          <p style={{ fontSize:'6.5pt', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#888', margin:'0 0 1mm 0' }}>Charges patronales (information)</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5mm 4mm' }}>
            {combos.filter((r) => r.patAmount != null).map((r) => (
              <div key={`pat-${r.code}`} style={{ display:'flex', justifyContent:'space-between', fontSize:'7.5pt' }}>
                <span style={{ color:'#555', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'60%' }}>{r.patLabel ?? r.label}</span>
                <span style={{ fontFamily:'monospace', fontWeight:600, color:'#1a1a1a' }}>{fmt(r.patAmount!)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ FOOTER — intégrité + mention légale ═══ */}
      <div style={{ borderTop:'1px solid #ccc', paddingTop:'1.5mm', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1mm' }}>
          <div style={{ display:'flex', gap:'3mm', alignItems:'center' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'1mm', background: verification.ok ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', color: verification.ok ? '#15803d' : '#dc2626', fontSize:'7pt', fontWeight:700, padding:'0.5mm 1.5mm', borderRadius:'1mm' }}>
              <ShieldCheck size={8} /> {verification.ok ? 'Double vérification OK' : 'Écart détecté'}
            </span>
            <span style={{ fontSize:'7pt', color:'#666' }}>Écriture comptable {accounting.balanced ? 'équilibrée' : 'déséquilibrée'}</span>
          </div>
          <span style={{ fontFamily:'monospace', fontSize:'7pt', color:'#888' }}>Audit · <strong style={{ color:'#555' }}>{auditHash}</strong></span>
        </div>
        <p style={{ fontSize:'7pt', color:'#999', lineHeight:1.35, margin:0 }}>
          Bulletin établi conformément au régime {country.socialFund} ({country.name}). À conserver sans limitation de durée.
          Document généré par <strong style={{ color:'#C97E12' }}>Atlas People</strong> · Atlas Studio · OHADA 17 États.
        </p>
      </div>

    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
 * Modèle 1 — STANDARD OHADA
 * ══════════════════════════════════════════════════════════════════ */
function StandardTable({ earnings, combos, fmt, M, totalGains, totalRetenues, fontPt }: TableProps) {
  const retenues = combos.filter((r) => r.empAmount != null);
  const thStyle = (right = false): React.CSSProperties => ({
    fontSize: `${fontPt * 0.78}pt`, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
    color: '#555', padding: '1.2mm 1mm', textAlign: right ? 'right' : 'left', borderBottom: '1px solid #1a1a1a',
  });
  return (
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:`${fontPt}pt` }}>
      <thead>
        <tr>
          <th style={{ ...thStyle(), width:'42%' }}>Désignation</th>
          <th style={thStyle(true)}>Base</th>
          <th style={thStyle(true)}>Taux</th>
          <th style={thStyle(true)}>Gains</th>
          <th style={thStyle(true)}>Retenues</th>
        </tr>
      </thead>
      <tbody>
        <TableSectionHeader colSpan={5} title="Gains" fontPt={fontPt} />
        {earnings.map((l) => <TableRow key={l.code} cells={[
          { v: l.label, align:'left' }, { v: M(l.baseUnits).format(), mono:true },
          { v: '—', color:'#aaa' }, { v: `+ ${M(l.amountUnits).format()}`, mono:true, bold:true },
          { v: '—', color:'#aaa' },
        ]} fontPt={fontPt} />)}
        <TableSectionHeader colSpan={5} title="Cotisations & impôts (part salariale)" fontPt={fontPt} />
        {retenues.map((r) => <TableRow key={r.code} cells={[
          { v: r.label, align:'left' }, { v: r.base != null ? fmt(r.base) : '—', mono:true, color:'#555' },
          { v: r.empRate != null ? `${r.empRate.toFixed(2)}%` : '—', mono:true, color:'#888' },
          { v: '—', color:'#aaa' }, { v: `− ${fmt(r.empAmount!)}`, mono:true, bold:true, color:'#b91c1c' },
        ]} fontPt={fontPt} />)}
      </tbody>
      <tfoot>
        <tr style={{ borderTop:'2px solid #1a1a1a', fontWeight:700 }}>
          <td style={{ padding:'1.5mm 1mm', fontSize:`${fontPt + 0.5}pt` }} colSpan={3}>Totaux</td>
          <td style={{ padding:'1.5mm 1mm', textAlign:'right', fontFamily:'monospace', fontSize:`${fontPt + 0.5}pt` }}>{totalGains.format()}</td>
          <td style={{ padding:'1.5mm 1mm', textAlign:'right', fontFamily:'monospace', fontSize:`${fontPt + 0.5}pt`, color:'#b91c1c' }}>{totalRetenues.format()}</td>
        </tr>
      </tfoot>
    </table>
  );
}

/* ══════════════════════════════════════════════════════════════════
 * Modèle 2 — CLARIFIÉ
 * ══════════════════════════════════════════════════════════════════ */
function ClarifieTable({ earnings, combos, fmt, M, totalGains, totalRetenues, totalPatronal, fontPt }: TableProps) {
  const thS = (right = false): React.CSSProperties => ({
    fontSize: `${fontPt * 0.78}pt`, fontWeight: 700, textTransform: 'uppercase', color: '#555',
    padding: '1.2mm 1mm', textAlign: right ? 'right' : 'left', borderBottom: '1px solid #1a1a1a',
  });
  return (
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:`${fontPt}pt` }}>
      <thead>
        <tr>
          <th style={{ ...thS(), width:'34%' }}>Désignation</th>
          <th style={thS(true)}>Base</th>
          <th style={thS(true)}>Taux sal.</th>
          <th style={{ ...thS(true), color:'#15803d' }}>Gain</th>
          <th style={{ ...thS(true), color:'#b91c1c' }}>Retenue</th>
          <th style={{ ...thS(true), color:'#555' }}>Part employeur</th>
        </tr>
      </thead>
      <tbody>
        <TableSectionHeader colSpan={6} title="Gains" fontPt={fontPt} />
        {earnings.map((l) => <TableRow key={l.code} cells={[
          { v: l.label, align:'left' }, { v: M(l.baseUnits).format(), mono:true, color:'#555' },
          { v: '—', color:'#aaa' }, { v: `+ ${M(l.amountUnits).format()}`, mono:true, bold:true },
          { v: '—', color:'#aaa' }, { v: '—', color:'#aaa' },
        ]} fontPt={fontPt} />)}
        <TableSectionHeader colSpan={6} title="Cotisations sociales" fontPt={fontPt} />
        {combos.map((r) => <TableRow key={r.code} cells={[
          { v: r.label, align:'left' }, { v: r.base != null ? fmt(r.base) : '—', mono:true, color:'#555' },
          { v: r.empRate != null ? `${r.empRate.toFixed(2)}%` : '—', mono:true, color:'#888' },
          { v: '—', color:'#aaa' },
          { v: r.empAmount != null ? `− ${fmt(r.empAmount)}` : '—', mono:true, bold:true, color:'#b91c1c' },
          { v: r.patAmount != null ? fmt(r.patAmount) : '—', mono:true, color:'#555' },
        ]} fontPt={fontPt} />)}
      </tbody>
      <tfoot>
        <tr style={{ borderTop:'2px solid #1a1a1a', fontWeight:700 }}>
          <td style={{ padding:'1.5mm 1mm', fontSize:`${fontPt + 0.5}pt` }} colSpan={3}>Totaux</td>
          <td style={{ padding:'1.5mm 1mm', textAlign:'right', fontFamily:'monospace', fontSize:`${fontPt + 0.5}pt` }}>{totalGains.format()}</td>
          <td style={{ padding:'1.5mm 1mm', textAlign:'right', fontFamily:'monospace', fontSize:`${fontPt + 0.5}pt`, color:'#b91c1c' }}>{totalRetenues.format()}</td>
          <td style={{ padding:'1.5mm 1mm', textAlign:'right', fontFamily:'monospace', fontSize:`${fontPt + 0.5}pt`, color:'#555' }}>{totalPatronal!.format()}</td>
        </tr>
      </tfoot>
    </table>
  );
}

/* ══════════════════════════════════════════════════════════════════
 * Modèle 3 — CLASSIQUE
 * ══════════════════════════════════════════════════════════════════ */
function ClassiqueTable({ earnings, combos, fmt, M, totalGains, totalRetenues, totalPatronal, fontPt }: TableProps) {
  const thS = (right = false): React.CSSProperties => ({
    fontSize: `${fontPt * 0.78}pt`, fontWeight: 700, textTransform: 'uppercase', color: '#555',
    padding: '1.2mm 1mm', textAlign: right ? 'right' : 'left', borderBottom: '1px solid #1a1a1a',
  });
  return (
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:`${fontPt}pt` }}>
      <thead>
        <tr>
          <th style={{ ...thS(), width:'30%' }}>Rubriques</th>
          <th style={thS(true)}>Base</th>
          <th style={thS(true)}>Taux sal.</th>
          <th style={thS(true)}>Mont. sal.</th>
          <th style={thS(true)}>Taux pat.</th>
          <th style={thS(true)}>Cot. patronales</th>
        </tr>
      </thead>
      <tbody>
        <TableSectionHeader colSpan={6} title="Gains" fontPt={fontPt} />
        {earnings.map((l) => <TableRow key={l.code} cells={[
          { v: l.label, align:'left' }, { v: M(l.baseUnits).format(), mono:true, color:'#555' },
          { v: '—', color:'#aaa' }, { v: `+ ${M(l.amountUnits).format()}`, mono:true, bold:true },
          { v: '—', color:'#aaa' }, { v: '—', color:'#aaa' },
        ]} fontPt={fontPt} />)}
        <TableSectionHeader colSpan={6} title="Cotisations & taxes patronales" fontPt={fontPt} />
        {combos.map((r) => <TableRow key={r.code} cells={[
          { v: r.label, align:'left' }, { v: r.base != null ? fmt(r.base) : '—', mono:true, color:'#555' },
          { v: r.empRate != null ? `${r.empRate.toFixed(2)}%` : '—', mono:true, color:'#888' },
          { v: r.empAmount != null ? `− ${fmt(r.empAmount)}` : '—', mono:true, bold:true, color:'#b91c1c' },
          { v: r.patRate != null ? `${r.patRate.toFixed(2)}%` : '—', mono:true, color:'#888' },
          { v: r.patAmount != null ? fmt(r.patAmount) : '—', mono:true, color:'#555' },
        ]} fontPt={fontPt} />)}
      </tbody>
      <tfoot>
        <tr style={{ borderTop:'2px solid #1a1a1a', fontWeight:700 }}>
          <td style={{ padding:'1.5mm 1mm', fontSize:`${fontPt + 0.5}pt` }}>Totaux</td>
          <td colSpan={2} />
          <td style={{ padding:'1.5mm 1mm', textAlign:'right', fontFamily:'monospace', fontSize:`${fontPt + 0.5}pt`, color:'#b91c1c' }}>{totalRetenues.format()}</td>
          <td style={{ padding:'1.5mm 1mm', textAlign:'right', fontFamily:'monospace', fontSize:`${fontPt + 0.5}pt`, color:'#555' }}>brut {totalGains.format()}</td>
          <td style={{ padding:'1.5mm 1mm', textAlign:'right', fontFamily:'monospace', fontSize:`${fontPt + 0.5}pt`, color:'#555' }}>{totalPatronal!.format()}</td>
        </tr>
      </tfoot>
    </table>
  );
}

/* ══════════════════════════════════════════════════════════════════
 * Composants de tableau partagés
 * ══════════════════════════════════════════════════════════════════ */

function TableSectionHeader({ colSpan, title, fontPt }: { colSpan: number; title: string; fontPt: number }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{
        background: 'rgba(0,0,0,0.04)', padding: '0.8mm 1mm',
        fontSize: `${fontPt * 0.73}pt`, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: '#555',
      }}>{title}</td>
    </tr>
  );
}

interface CellDef { v: string; align?: 'left' | 'right'; mono?: boolean; bold?: boolean; color?: string }

function TableRow({ cells, fontPt }: { cells: CellDef[]; fontPt: number }) {
  return (
    <tr style={{ borderBottom: '1px dotted #e0e0e0' }}>
      {cells.map((c, i) => (
        <td key={i} style={{
          padding: '0.7mm 1mm',
          textAlign: i === 0 && c.align !== 'right' ? 'left' : 'right',
          fontFamily: c.mono ? 'monospace' : 'inherit',
          fontWeight: c.bold ? 700 : 500,
          color: c.color ?? '#1a1a1a',
          fontSize: `${fontPt}pt`,
          whiteSpace: i === 0 ? 'normal' : 'nowrap',
        }}>{c.v}</td>
      ))}
    </tr>
  );
}

/* ══════════════════════════════════════════════════════════════════
 * Types et helpers
 * ══════════════════════════════════════════════════════════════════ */

interface ComboRow {
  code: string; label: string; patLabel?: string;
  base?: number; empRate?: number; empAmount?: number; patRate?: number; patAmount?: number;
}

interface TableProps {
  earnings: PayslipLine[];
  combos: ComboRow[];
  fmt: (n: number) => string;
  M: (u: string) => Money;
  totalGains: Money;
  totalRetenues: Money;
  totalPatronal?: Money;
  fontPt: number;
}

function combinedRows(lines: PayslipLine[]): ComboRow[] {
  const num = (u: string) => Number(BigInt(u));
  const baseOf = (l: PayslipLine) =>
    l.kind === 'employer_contribution' && l.code.endsWith('_PAT') ? l.code.slice(0, -4) : l.code;

  const employerLines = lines.filter((l) => l.kind === 'employer_contribution' || l.kind === 'employer_tax');
  const employerByBase = new Map<string, PayslipLine>();
  for (const l of employerLines) employerByBase.set(baseOf(l), l);

  const rows: ComboRow[] = [];
  const pairedBases = new Set<string>();

  for (const l of lines) {
    if (l.kind !== 'employee_contribution' && l.kind !== 'tax' && l.kind !== 'deduction') continue;
    const pat = employerByBase.get(l.code);
    if (pat) pairedBases.add(l.code);
    rows.push({
      code: l.code, label: l.label, patLabel: pat?.label.replace(' (part patronale)', ''),
      base: l.baseUnits ? num(l.baseUnits) : undefined,
      empRate: l.rateBps ? l.rateBps / 100 : undefined,
      empAmount: Math.abs(num(l.amountUnits)),
      patRate: pat?.rateBps ? pat.rateBps / 100 : undefined,
      patAmount: pat ? num(pat.amountUnits) : undefined,
    });
  }
  for (const l of employerLines) {
    const base = baseOf(l);
    if (pairedBases.has(base)) continue;
    rows.push({
      code: `${l.code}__patonly`, label: l.label.replace(' (part patronale)', ''),
      base: l.baseUnits ? num(l.baseUnits) : undefined,
      patRate: l.rateBps ? l.rateBps / 100 : undefined,
      patAmount: num(l.amountUnits),
    });
  }
  return rows;
}

function pseudoHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}
