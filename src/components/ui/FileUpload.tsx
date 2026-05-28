import { useRef, useState } from 'react';
import { UploadCloud, Camera } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Zone d'upload drag&drop (desktop) + appareil photo (mobile). */
export function FileUpload({
  accept = '.pdf,.jpg,.jpeg,.png,.docx',
  maxSizeMb = 10,
  hint = 'PDF, JPG, PNG ou DOCX · 10 Mo max',
  onFiles,
}: {
  accept?: string;
  maxSizeMb?: number;
  hint?: string;
  onFiles?: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    const tooBig = list.find((f) => f.size > maxSizeMb * 1024 * 1024);
    if (tooBig) {
      setError(`« ${tooBig.name} » dépasse ${maxSizeMb} Mo.`);
      return;
    }
    setError(null);
    onFiles?.(list);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          dragging ? 'border-amber bg-amber/[0.06]' : 'border-line bg-surface2 hover:border-amber/40',
        )}
      >
        <UploadCloud size={26} className="mb-2 text-ink-400" />
        <p className="text-sm font-semibold text-ink">Glissez vos documents ici</p>
        <p className="mt-0.5 text-[12px] font-medium text-ink-400">{hint}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-700 sm:hidden">
          <Camera size={14} /> Prendre une photo
        </span>
        <input ref={inputRef} type="file" accept={accept} capture="environment" multiple className="hidden" onChange={(e) => handle(e.target.files)} />
      </div>
      {error && <p className="mt-1.5 text-[11px] font-semibold text-danger">{error}</p>}
    </div>
  );
}
