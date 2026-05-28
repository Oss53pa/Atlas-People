import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSignature, Route, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/overlays';
import { FormField, Select, TextInput } from '../ui/FormField';
import { MoneyInput } from '../ui/MoneyDisplay';
import { useToast } from '../ui/Toast';
import { useDirectory } from '../../store/useDirectory';
import { useEvents } from '../../store/useEvents';
import { COUNTRIES, countryByCode } from '../../data/countries';
import { Money } from '../../lib/money';
import { employeeName, type EmployeeRecord } from '../../data/mock';

const today = '2026-05-27';

export function DossierActions({ employee }: { employee: EmployeeRecord }) {
  const updateEmployee = useDirectory((s) => s.updateEmployee);
  const append = useEvents((s) => s.append);
  const employees = useDirectory((s) => s.employees);
  const { toast } = useToast();
  const [open, setOpen] = useState<null | 'avenant' | 'mobilite'>(null);

  // Avenant
  const [avMotif, setAvMotif] = useState('Augmentation');
  const [avDate, setAvDate] = useState('2026-06-01');
  const [avSalary, setAvSalary] = useState(0);
  const [avJob, setAvJob] = useState('');

  // Mobilité
  const [mbCountry, setMbCountry] = useState(employee.countryCode);
  const [mbDept, setMbDept] = useState(employee.department);
  const [mbManager, setMbManager] = useState('');

  const closeAll = () => setOpen(null);

  const submitAvenant = () => {
    if (avSalary > 0) updateEmployee(employee.id, { baseSalary: avSalary });
    const type = avMotif === 'Promotion' ? 'promotion' : avSalary > 0 ? 'salary_change' : 'amendment';
    append({ employeeId: employee.id, type, date: avDate, label: `Avenant — ${avMotif}${avSalary > 0 ? ` (${Money.of(avSalary, countryByCode(employee.countryCode).currency).format()} FCFA)` : ''}` });
    toast({ variant: 'success', title: 'Avenant créé', description: `${avMotif} · effet ${new Date(avDate).toLocaleDateString('fr-FR')}.` });
    closeAll();
  };

  const submitMobilite = () => {
    const changedCountry = mbCountry !== employee.countryCode;
    updateEmployee(employee.id, { countryCode: mbCountry, department: mbDept, manager: mbManager ? employeeName(employees.find((e) => e.id === mbManager)!) : employee.manager });
    append({ employeeId: employee.id, type: 'mobility', date: today, label: `Mobilité interne — ${mbDept}${changedCountry ? ` · ${countryByCode(mbCountry).name} (changement de régime)` : ''}` });
    toast({ variant: 'success', title: 'Mobilité validée', description: changedCountry ? 'Changement de pays : régime et devise recalculés.' : `Nouveau département : ${mbDept}.` });
    closeAll();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen('avenant')}><FileSignature size={14} /> Avenant</Button>
      <Button variant="outline" size="sm" onClick={() => setOpen('mobilite')}><Route size={14} /> Mobilité</Button>
      <Link to={`/collaborateurs/${employee.id}/sortie`}><Button variant="outline" size="sm"><LogOut size={14} /> Sortie</Button></Link>

      {/* P1.9 — Avenant */}
      <Modal open={open === 'avenant'} onClose={closeAll} title={`Avenant — ${employeeName(employee)}`}
        footer={<><Button variant="ghost" size="sm" onClick={closeAll}>Annuler</Button><Button size="sm" onClick={submitAvenant}>Créer l'avenant</Button></>}>
        <div className="space-y-3">
          <FormField label="Motif" required>
            <Select value={avMotif} onChange={(e) => setAvMotif(e.target.value)}>
              {['Promotion', 'Augmentation', 'Changement de poste', 'Quotité', 'Lieu', 'Classification', 'Autre'].map((m) => <option key={m}>{m}</option>)}
            </Select>
          </FormField>
          <FormField label="Date d'effet" required><TextInput type="date" value={avDate} onChange={(e) => setAvDate(e.target.value)} /></FormField>
          <FormField label="Nouveau salaire de base (optionnel)" hint="Crée une nouvelle ligne de rémunération datée (jamais d'écrasement).">
            <MoneyInput value={avSalary} onChange={setAvSalary} />
          </FormField>
          <FormField label="Nouvel intitulé de poste (optionnel)"><TextInput value={avJob} onChange={(e) => setAvJob(e.target.value)} /></FormField>
        </div>
      </Modal>

      {/* P1.10 — Mobilité */}
      <Modal open={open === 'mobilite'} onClose={closeAll} title="Mobilité interne"
        footer={<><Button variant="ghost" size="sm" onClick={closeAll}>Annuler</Button><Button size="sm" onClick={submitMobilite}>Valider la mobilité</Button></>}>
        <div className="space-y-3">
          <FormField label="Nouveau pays" hint={mbCountry !== employee.countryCode ? '⚠ Changement de régime légal et de devise.' : undefined}>
            <Select value={mbCountry} onChange={(e) => setMbCountry(e.target.value)}>
              {COUNTRIES.filter((c) => c.configured).map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Nouveau département">
            <Select value={mbDept} onChange={(e) => setMbDept(e.target.value)}>
              {['Technologie', 'Finance', 'Ventes', 'Ressources Humaines', 'Opérations'].map((d) => <option key={d}>{d}</option>)}
            </Select>
          </FormField>
          <FormField label="Nouveau manager (N+1)">
            <Select value={mbManager} onChange={(e) => setMbManager(e.target.value)}>
              <option value="">— inchangé —</option>
              {employees.filter((e) => e.id !== employee.id).map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}
            </Select>
          </FormField>
        </div>
      </Modal>
    </>
  );
}
