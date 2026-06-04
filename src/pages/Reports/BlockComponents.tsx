/**
 * BlockComponents — DraggableBlock + InsertHere pour le drag&drop des blocs.
 */
import { useRef } from 'react';
import { Trash2, GripVertical, Pencil } from 'lucide-react';
import type { Block } from '../../engine/reportBlocks';
import { cn } from '../../lib/cn';

interface DraggableBlockProps {
  block: Block;
  index: number;
  onMove: (from: number, to: number) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  children: React.ReactNode;
}

export function DraggableBlock({ block, index, onMove, onDelete, onEdit, children }: DraggableBlockProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    if (ref.current) ref.current.style.opacity = '0.5';
  };
  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    if (ref.current) ref.current.style.opacity = '1';
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(from) && from !== index) onMove(from, index);
  };

  const isHeading = block.type === 'h1' || block.type === 'h2' || block.type === 'h3';
  const isEditable = isHeading || block.type === 'paragraph';

  return (
    <div
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="group relative my-1 rounded-md border border-transparent transition-colors hover:border-amber-deep/30 hover:bg-amber/[0.02]"
    >
      <div className={cn(
        'absolute left-[-30px] top-1 flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100',
        'no-print'
      )}>
        <button type="button" className="cursor-grab rounded p-0.5 text-ink-400 hover:text-ink"
          title="Glisser pour réordonner">
          <GripVertical size={12} />
        </button>
        {isEditable && onEdit && (
          <button type="button" onClick={() => onEdit(block.id)}
            className="rounded p-0.5 text-ink-400 hover:text-amber-deep" title="Éditer">
            <Pencil size={11} />
          </button>
        )}
        <button type="button" onClick={() => onDelete(block.id)}
          className="rounded p-0.5 text-ink-400 hover:text-rose-600" title="Supprimer">
          <Trash2 size={11} />
        </button>
      </div>
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * InsertHere — zone insérable entre deux blocs ou en début/fin
 * ────────────────────────────────────────────────────────────── */
interface InsertHereProps {
  onInsert: () => void;
  label?: string;
}

export function InsertHere({ onInsert, label = '+ Insérer ici' }: InsertHereProps) {
  return (
    <button
      type="button"
      onClick={onInsert}
      className="no-print group my-0.5 flex w-full items-center gap-2 rounded-md py-0.5 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
    >
      <span className="flex-1 border-t border-dashed border-amber-deep/30 group-hover:border-amber-deep" />
      <span className="text-[10px] font-bold text-amber-deep">{label}</span>
      <span className="flex-1 border-t border-dashed border-amber-deep/30 group-hover:border-amber-deep" />
    </button>
  );
}
