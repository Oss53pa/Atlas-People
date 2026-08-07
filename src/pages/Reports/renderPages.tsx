/**
 * renderPages — visualiseur A4 simulé écran avec pagination.
 * Découpe les blocs en pages selon les `pageBreak` et un seuil de hauteur.
 */
import { cloneElement, isValidElement } from 'react';
import type { Block, ReportConfig, ReportData, Palette } from '../../engine/reportBlocks';
import { BlockPreview } from './BlockPreviews';
import { DraggableBlock, InsertHere } from './BlockComponents';
import { DashboardSnippet } from './DashboardSnippet';
import { PageA4, CoverPage, TocPage, BackCoverPage } from './PageComponents';

export interface RenderPagesOps {
  onMoveBlock: (from: number, to: number) => void;
  onDeleteBlock: (id: string) => void;
  onEditBlock?: (id: string) => void;
  onInsertAt: (index: number) => void;
}

interface RenderPagesProps {
  config: ReportConfig;
  data: ReportData;
  palette: Palette;
  orgName: string;
  orgSub?: string;
  ops?: RenderPagesOps;
}

export function renderPages({ config, data, palette, orgName, orgSub, ops }: RenderPagesProps): React.ReactNode {
  // Compteurs : page 1 = cover (si activée), page 2 = TOC (si activée), puis blocs
  const pages: { content: React.ReactNode; pageNumber: number }[] = [];
  let pageNumber = 0;

  // Couverture
  if (config.options.includeCover) {
    pageNumber += 1;
    pages.push({
      pageNumber,
      content: <CoverPage key="cover" config={config} palette={palette} orgName={orgName} orgSub={orgSub} />,
    });
  }

  // TOC sera ajoutée après le calcul des entrées
  const tocPlaceholderIdx = config.options.includeTOC ? pages.length : -1;
  if (config.options.includeTOC) {
    pageNumber += 1;
    pages.push({ pageNumber, content: null }); // placeholder
  }

  // Découpe en pages selon pageBreak
  const sections: Block[][] = [[]];
  config.blocks.forEach((b) => {
    if (b.type === 'pageBreak') { sections.push([]); }
    else sections[sections.length - 1].push(b);
  });

  // TOC entries
  const tocEntries: Array<{ level: 1 | 2 | 3; text: string; page: number }> = [];

  sections.forEach((sectionBlocks, sectionIdx) => {
    if (sectionBlocks.length === 0 && sectionIdx > 0) return;
    pageNumber += 1;
    const currentPage = pageNumber;

    // Collecte TOC dans cette section
    sectionBlocks.forEach((b) => {
      if ((b.type === 'h1' || b.type === 'h2' || b.type === 'h3') && b.inToc !== false) {
        const lvl: 1 | 2 | 3 = b.type === 'h1' ? 1 : b.type === 'h2' ? 2 : 3;
        tocEntries.push({ level: lvl, text: b.text, page: currentPage });
      }
    });

    pages.push({
      pageNumber: currentPage,
      content: (
        <PageA4
          key={`page-${sectionIdx}`}
          format={config.format}
          config={config}
          orgName={orgName}
          pageNumber={currentPage}
          totalPages={0} // patched at the end
        >
          {sectionBlocks.map((block, blockIdx) => {
            const globalIdx = config.blocks.findIndex((b) => b.id === block.id);
            const node = block.type === 'dashboard'
              ? <DashboardSnippet dashboardId={block.dashboardId} title={block.title} data={data} palette={palette} />
              : <BlockPreview block={block} data={data} palette={palette} />;

            if (!ops) return <div key={block.id}>{node}</div>;
            return (
              <div key={block.id}>
                {blockIdx === 0 && <InsertHere onInsert={() => ops.onInsertAt(globalIdx)} />}
                <DraggableBlock
                  block={block}
                  index={globalIdx}
                  onMove={ops.onMoveBlock}
                  onDelete={ops.onDeleteBlock}
                  onEdit={ops.onEditBlock}
                >
                  {node}
                </DraggableBlock>
                <InsertHere onInsert={() => ops.onInsertAt(globalIdx + 1)} />
              </div>
            );
          })}
        </PageA4>
      ),
    });
  });

  // 4e de couverture
  if (config.options.includeCover) {
    pageNumber += 1;
    pages.push({
      pageNumber,
      content: <BackCoverPage key="back" config={config} palette={palette} orgName={orgName} />,
    });
  }

  // Remplir TOC maintenant
  if (config.options.includeTOC && tocPlaceholderIdx >= 0) {
    pages[tocPlaceholderIdx] = {
      pageNumber: pages[tocPlaceholderIdx].pageNumber,
      content: (
        <TocPage
          key="toc"
          entries={tocEntries}
          config={config}
          palette={palette}
          orgName={orgName}
          pageNumber={pages[tocPlaceholderIdx].pageNumber}
          totalPages={pageNumber}
        />
      ),
    };
  }

  // Patch du total : les pages de contenu (PageA4) ont été créées avec
  // totalPages=0 (inconnu à ce stade) → on injecte le vrai total maintenant.
  const total = pageNumber;
  return pages.map((p) => {
    if (isValidElement(p.content) && p.content.type === PageA4) {
      return cloneElement(p.content as React.ReactElement<{ totalPages: number }>, { totalPages: total });
    }
    return p.content;
  });
}
