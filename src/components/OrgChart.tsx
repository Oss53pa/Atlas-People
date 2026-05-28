import { useNavigate } from 'react-router-dom';
import { Avatar } from './ui/Avatar';
import { EMPLOYEES, employeeName, managerIdOf, type EmployeeRecord } from '../data/mock';
import { countryByCode } from '../data/countries';

/** Organigramme hiérarchique (M1.8) construit depuis les relations manager. */
export function OrgChart() {
  const roots = EMPLOYEES.filter((e) => !managerIdOf(e));
  return (
    <div className="space-y-4">
      {roots.map((r) => (
        <OrgNode key={r.id} employee={r} depth={0} />
      ))}
    </div>
  );
}

function OrgNode({ employee, depth }: { employee: EmployeeRecord; depth: number }) {
  const navigate = useNavigate();
  const reports = EMPLOYEES.filter((e) => managerIdOf(e) === employee.id);
  const country = countryByCode(employee.countryCode);

  return (
    <div className={depth > 0 ? 'border-l border-line pl-4 ml-3' : ''}>
      <button
        onClick={() => navigate(`/collaborateurs/${employee.id}`)}
        className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-left transition-all hover:border-amber/40 hover:bg-amber/[0.04]"
      >
        <Avatar name={employeeName(employee)} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{employeeName(employee)}</p>
          <p className="truncate text-[11px] font-medium text-ink-400">{employee.role} · {employee.department}</p>
        </div>
        <span className="text-base">{country.flag}</span>
        {reports.length > 0 && (
          <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[10px] font-bold text-ink-500">
            {reports.length} N-1
          </span>
        )}
      </button>
      {reports.length > 0 && (
        <div className="space-y-2">
          {reports.map((r) => (
            <OrgNode key={r.id} employee={r} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
