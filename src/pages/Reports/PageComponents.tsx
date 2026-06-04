/**
 * PageComponents — composants de page A4 simulés à l'écran.
 * PageA4 · CoverPage · TocPage · BackCoverPage
 */
import type { ReportConfig, Palette } from '../../engine/reportBlocks';
import { cn } from '../../lib/cn';

/* ───────── PageA4 — wrapper d'une page A4 simulée ───────── */

interface PageA4Props {
  format: ReportConfig['format'];
  children: React.ReactNode;
  pageNumber?: number;
  totalPages?: number;
  config: ReportConfig;
  orgName: string;
}

export function PageA4({ format, children, pageNumber, totalPages, config, orgName }: PageA4Props) {
  const ratio = format === 'A4_landscape' ? 297 / 210 : format === 'pptx' ? 16 / 9 : 210 / 297;
  return (
    <div className="relative mx-auto mb-4 w-full overflow-hidden bg-white shadow-md print:shadow-none"
      style={{ aspectRatio: ratio, maxWidth: format === 'A4_landscape' || format === 'pptx' ? '100%' : 720 }}>
      <div className="absolute inset-0 flex flex-col p-[14mm]">
        <div className="flex-1 overflow-hidden">{children}</div>
        {config.options.includeFooter && (
          <div className="mt-2 flex items-center justify-between border-t pt-1 text-[8px]" style={{ borderColor: '#e5e7eb', color: '#9ca3af' }}>
            <span className="truncate">{orgName} · {config.identity.title} · {config.identity.period}</span>
            <span className="font-bold uppercase">{config.identity.confidentiality}</span>
            {config.options.includePageNumbers && pageNumber && totalPages
              ? <span className="mono">Page {pageNumber} / {totalPages}</span>
              : <span />
            }
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── CoverPage — couverture du rapport ───────── */

interface CoverPageProps {
  config: ReportConfig;
  palette: Palette;
  orgName: string;
  orgSub?: string;
}

export function CoverPage({ config, palette, orgName, orgSub }: CoverPageProps) {
  const ratio = config.format === 'A4_landscape' ? 297 / 210 : config.format === 'pptx' ? 16 / 9 : 210 / 297;
  const bgColor = config.identity.coverBgColor ?? palette.primary;
  const titleColor = config.identity.titleColor ?? '#FFFFFF';
  const subColor = config.identity.subtitleColor ?? '#E5E7EB';

  return (
    <div className="relative mx-auto mb-4 w-full overflow-hidden shadow-md print:shadow-none"
      style={{ aspectRatio: ratio, maxWidth: config.format === 'A4_landscape' || config.format === 'pptx' ? '100%' : 720, background: bgColor }}>
      {config.identity.coverBgImageUrl && (
        <div className="absolute inset-0" style={{
          backgroundImage: `url(${config.identity.coverBgImageUrl})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: config.identity.coverBgOpacity ?? 0.15,
        }} />
      )}
      <div className="relative flex h-full flex-col justify-between p-[14mm]">
        <div>
          {config.identity.logoDataUrl ? (
            <img src={config.identity.logoDataUrl} alt="logo" className="mb-2 max-h-12" />
          ) : (
            <p className="text-[14px] font-bold" style={{ color: titleColor }}>{orgName}</p>
          )}
          {orgSub && <p className="text-[10px]" style={{ color: subColor }}>{orgSub}</p>}
        </div>

        <div>
          <h1 className={cn('font-bold leading-tight', config.format === 'pptx' ? 'text-[44px]' : 'text-[36px]')} style={{ color: titleColor }}>
            {config.identity.title}
          </h1>
          <p className={cn('mt-2 font-medium', config.format === 'pptx' ? 'text-[18px]' : 'text-[16px]')} style={{ color: subColor }}>
            {config.identity.subtitle}
          </p>
        </div>

        <div className="text-[10px] space-y-0.5" style={{ color: subColor }}>
          <p>Période : <strong style={{ color: titleColor }}>{config.identity.period}</strong></p>
          <p>Auteur : <strong style={{ color: titleColor }}>{config.identity.author}</strong></p>
          <p className="uppercase tracking-wider">Confidentialité : <strong style={{ color: titleColor }}>{config.identity.confidentiality}</strong></p>
        </div>
      </div>
    </div>
  );
}

/* ───────── TocPage — sommaire automatique ───────── */

interface TocEntry { level: 1 | 2 | 3; text: string; page: number }

interface TocPageProps {
  entries: TocEntry[];
  config: ReportConfig;
  palette: Palette;
  orgName: string;
  pageNumber: number;
  totalPages: number;
}

export function TocPage({ entries, config, palette, orgName, pageNumber, totalPages }: TocPageProps) {
  return (
    <PageA4 format={config.format} config={config} orgName={orgName} pageNumber={pageNumber} totalPages={totalPages}>
      <h1 className="mb-3 text-[20px] font-bold" style={{ color: palette.primary }}>Sommaire</h1>
      <div className="space-y-0.5 text-[10px]">
        {entries.map((e, i) => (
          <div key={i} className="flex items-baseline gap-2" style={{ paddingLeft: (e.level - 1) * 12 }}>
            <span className="truncate font-medium" style={{ color: e.level === 1 ? palette.primary : '#525252', fontWeight: e.level === 1 ? 700 : 500 }}>{e.text}</span>
            <span className="flex-1 border-b border-dotted" style={{ borderColor: '#d1d5db' }} />
            <span className="mono text-[9px]" style={{ color: '#9ca3af' }}>{e.page}</span>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="italic" style={{ color: '#9ca3af' }}>Aucun titre — ajoutez des H1/H2/H3 pour générer le sommaire.</p>
        )}
      </div>
    </PageA4>
  );
}

/* ───────── BackCoverPage — 4e de couverture ───────── */

interface BackCoverPageProps {
  config: ReportConfig;
  palette: Palette;
  orgName: string;
}

export function BackCoverPage({ config, palette, orgName }: BackCoverPageProps) {
  const ratio = config.format === 'A4_landscape' ? 297 / 210 : config.format === 'pptx' ? 16 / 9 : 210 / 297;
  return (
    <div className="relative mx-auto mb-4 w-full overflow-hidden shadow-md print:shadow-none"
      style={{ aspectRatio: ratio, maxWidth: config.format === 'A4_landscape' || config.format === 'pptx' ? '100%' : 720, background: palette.primary }}>
      <div className="flex h-full flex-col justify-end p-[14mm] text-white">
        <div className="space-y-1">
          <p className="text-[20px] font-bold">{orgName}</p>
          <p className="text-[10px] opacity-70">
            Rapport généré par <strong>Atlas People</strong> · Atlas Studio · OHADA 17 États
          </p>
          {config.recipients.length > 0 && (
            <p className="mt-2 text-[9px] opacity-60">Destinataires : {config.recipients.join(' · ')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
