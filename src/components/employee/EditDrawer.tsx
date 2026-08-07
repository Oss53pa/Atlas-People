import { useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { Drawer, Modal } from '../ui/overlays';
import { FormField, TextInput } from '../ui/FormField';
import { Checkbox } from '../ui/controls';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useDirectory } from '../../store/useDirectory';
import { useEvents } from '../../store/useEvents';
import { mobileMoney, type EmployeeRecord } from '../../data/mock';
import { useUpdateEmployee, isBackendConfigured } from '../../lib/m1/supabaseLive';

export type EditSection = 'identity' | 'contact' | 'payment';

const TITLES: Record<EditSection, string> = {
  identity: "Modifier l'état civil",
  contact: 'Modifier les coordonnées',
  payment: 'Modifier le versement',
};

/** P1.4 — Drawer d'édition de section, avec workflow sensible pour le versement. */
export function EditDrawer({
  employee,
  section,
  onClose,
}: {
  employee: EmployeeRecord;
  section: EditSection;
  onClose: () => void;
}) {
  const updateEmployee = useDirectory((s) => s.updateEmployee);
  const updateLive = useUpdateEmployee();
  const append = useEvents((s) => s.append);
  const { toast } = useToast();

  /** Persiste un patch : Supabase (live, audité) sinon store Zustand (démo). Renvoie true si OK. */
  const applyPatch = async (patch: Partial<EmployeeRecord>, action: string): Promise<boolean> => {
    if (isBackendConfigured) {
      try {
        await updateLive.mutateAsync({ id: employee.id, patch, action });
        return true;
      } catch (e) {
        toast({ variant: 'error', title: 'Échec de la mise à jour', description: e instanceof Error ? e.message : 'Erreur inconnue.' });
        return false;
      }
    }
    updateEmployee(employee.id, patch);
    return true;
  };

  const [firstName, setFirstName] = useState(employee.firstName);
  const [lastName, setLastName] = useState(employee.lastName);
  const [email, setEmail] = useState(employee.email);
  const [phone, setPhone] = useState(employee.phone ?? '');
  const [address, setAddress] = useState(employee.address ?? '');
  const [mm, setMm] = useState(employee.mobileMoneyNumber ?? '');
  const [unlocked, setUnlocked] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [ack, setAck] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const saveIdentity = async () => {
    if (!(await applyPatch({ firstName, lastName, email }, 'employee.identity'))) return;
    append({ employeeId: employee.id, type: 'amendment', date: today, label: 'Mise à jour de l’état civil' });
    toast({ variant: 'success', title: 'État civil mis à jour', description: 'Modification tracée dans l’audit.' });
    onClose();
  };

  const saveContact = async () => {
    if (!(await applyPatch({ phone, address, email }, 'employee.contact'))) return;
    toast({ variant: 'success', title: 'Coordonnées mises à jour' });
    onClose();
  };

  const savePayment = async () => {
    if (!(await applyPatch({ mobileMoneyNumber: mm }, 'employee.payment'))) return;
    append({ employeeId: employee.id, type: 'amendment', date: today, label: 'Modification du mode de versement (sensible)' });
    toast({ variant: 'warning', title: 'Versement modifié', description: 'Audit fort enregistré · l’employé est notifié.' });
    setConfirmOpen(false);
    onClose();
  };

  const isPayment = section === 'payment';

  return (
    <>
      <Drawer open onClose={onClose} title={TITLES[section]}>
        {section === 'identity' && (
          <div className="space-y-4">
            <FormField label="Nom" required hint={`Valeur actuelle : ${employee.lastName}`}>
              <TextInput value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </FormField>
            <FormField label="Prénoms" required hint={`Valeur actuelle : ${employee.firstName}`}>
              <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </FormField>
            <FormField label="Email" hint={`Valeur actuelle : ${employee.email}`}>
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormField>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="ghost" size="sm" onClick={onClose}>Annuler</Button>
              <Button size="sm" onClick={saveIdentity}>Enregistrer</Button>
            </div>
          </div>
        )}

        {section === 'contact' && (
          <div className="space-y-4">
            <FormField label="Téléphone principal" hint={employee.phone ? `Actuel : ${employee.phone}` : 'Non renseigné'}>
              <TextInput value={phone} placeholder="+225…" onChange={(e) => setPhone(e.target.value)} />
            </FormField>
            <FormField label="Email" hint={`Actuel : ${employee.email}`}>
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormField>
            <FormField label="Adresse" hint={employee.address ? `Actuelle : ${employee.address}` : 'Non renseignée'}>
              <TextInput value={address} onChange={(e) => setAddress(e.target.value)} />
            </FormField>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="ghost" size="sm" onClick={onClose}>Annuler</Button>
              <Button size="sm" onClick={saveContact}>Enregistrer</Button>
            </div>
          </div>
        )}

        {isPayment && (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-amber/25 bg-amber/[0.07] p-3">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-deep" />
              <p className="text-[12px] font-medium text-ink-700">
                Donnée sensible. La modification nécessite un déverrouillage, sera tracée en audit immuable et notifiée à l’employé.
              </p>
            </div>
            <FormField label="Numéro Mobile Money" hint={`Actuel : ${employee.mobileMoneyNumber ?? mobileMoney(employee)}`}>
              <TextInput value={mm} disabled={!unlocked} onChange={(e) => setMm(e.target.value)} />
            </FormField>
            {!unlocked ? (
              <Button variant="outline" size="sm" onClick={() => setUnlocked(true)}>
                <Lock size={14} /> Déverrouiller pour modifier
              </Button>
            ) : (
              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <Button variant="ghost" size="sm" onClick={onClose}>Annuler</Button>
                <Button variant="danger" size="sm" disabled={!mm} onClick={() => setConfirmOpen(true)}>
                  Modifier le versement
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {isPayment && (
        <Modal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Confirmer la modification du versement"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>Annuler</Button>
              <Button variant="danger" size="sm" disabled={!ack || reason.length < 20} onClick={savePayment}>
                Confirmer la modification
              </Button>
            </>
          }
        >
          <p className="mb-3 text-sm font-medium text-ink-500">
            Modification du versement de <span className="font-semibold text-ink">{employee.firstName} {employee.lastName}</span>, effective dès la prochaine paie. Tracée en audit immuable.
          </p>
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-surface2 px-3 py-2.5 text-sm">
            <span className="mono font-semibold text-ink-400 line-through">{employee.mobileMoneyNumber ?? mobileMoney(employee)}</span>
            <span className="text-amber-deep">→</span>
            <span className="mono font-semibold text-ink">{mm}</span>
          </div>
          <FormField label="Raison de la modification (min. 20 caractères)" required>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink focus:border-amber/40 focus:outline-none focus:ring-2 focus:ring-amber/15"
            />
          </FormField>
          <div className="mt-3">
            <Checkbox checked={ack} onChange={setAck} label="J'ai vérifié les nouvelles informations de versement et confirme leur exactitude." />
          </div>
        </Modal>
      )}
    </>
  );
}
