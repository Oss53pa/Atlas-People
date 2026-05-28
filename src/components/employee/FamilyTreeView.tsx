import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/cn';
import type { FamilyMember } from '../../data/mock';

/** Arbre familial (DS — composant FamilyTreeView). Ascendants en haut,
 *  employé + conjoint(s) au centre, enfants en bas. */
export function FamilyTreeView({ employee, members }: { employee: string; members: FamilyMember[] }) {
  const spouses = members.filter((m) => m.type === 'spouse');
  const children = members.filter((m) => m.type === 'child');
  const ascendants = members.filter((m) => m.type === 'ascendant');

  return (
    <div className="flex flex-col items-center gap-0 overflow-x-auto py-2">
      {ascendants.length > 0 && (
        <>
          <div className="flex flex-wrap justify-center gap-2">
            {ascendants.map((a) => (
              <PersonCard key={a.id} member={a} />
            ))}
          </div>
          <Connector />
        </>
      )}

      <div className="flex items-center gap-2">
        {spouses.map((s) => (
          <PersonCard key={s.id} member={s} />
        ))}
        {spouses.length > 0 && <span className="h-px w-5 bg-line" />}
        <div className="rounded-xl border-2 border-amber/50 bg-amber/[0.06] px-3 py-2.5 text-center">
          <Avatar name={employee} size="sm" className="mx-auto" />
          <p className="mt-1.5 text-xs font-bold text-ink">{employee}</p>
          <p className="text-[10px] font-semibold text-amber-deep">Collaborateur</p>
        </div>
      </div>

      {children.length > 0 && (
        <>
          <Connector />
          <div className="flex flex-wrap justify-center gap-2">
            {children.map((c) => (
              <PersonCard key={c.id} member={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Connector() {
  return <span className="h-5 w-px bg-line" />;
}

function PersonCard({ member }: { member: FamilyMember }) {
  return (
    <div className={cn('w-[112px] rounded-xl border border-line bg-surface px-2.5 py-2 text-center', member.status === 'deceased' && 'opacity-50')}>
      <Avatar name={member.name} size="xs" className="mx-auto" />
      <p className="mt-1 truncate text-[11px] font-bold text-ink">{member.name}</p>
      <p className="truncate text-[9px] font-medium text-ink-400">{member.relation}</p>
      <div className="mt-1 flex justify-center gap-1">
        {member.fiscalDependent && <span title="À charge fiscale" className="h-1.5 w-1.5 rounded-full bg-amber" />}
        {member.healthBeneficiary && <span title="Bénéficiaire santé" className="h-1.5 w-1.5 rounded-full bg-ok" />}
      </div>
    </div>
  );
}
