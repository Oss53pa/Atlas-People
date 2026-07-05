import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ShieldCheck, MoonStar, Eye, Languages, Lock, Database, Check, Download, Smartphone, Monitor, Wifi } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { Tabs } from '../../components/ui/Tabs';
import { Switch } from '../../components/ui/controls';
import { useToast } from '../../components/ui/Toast';
import { useSurface } from '../../store/useSurface';
import { cn } from '../../lib/cn';
import { isBackendConfigured, useMyConsents, useToggleConsent, useMyNotificationPrefs } from '../../lib/portal/supabaseLive';
import { useSessionContext } from '../../lib/useSession';

const TABS = [
  { key: 'notifications', label: 'Notifications' },
  { key: 'consentements', label: 'Consentements' },
  { key: 'deconnexion', label: 'Déconnexion' },
  { key: 'accessibilite', label: 'Accessibilité' },
  { key: 'langue', label: 'Langue' },
  { key: 'securite', label: 'Sécurité' },
  { key: 'donnees', label: 'Mes données' },
];

const NOTIF_EVENTS = [
  { label: 'Versement de paie', push: true, email: true, sms: true, locked: false },
  { label: 'Nouveau courrier', push: true, email: true, sms: false, locked: false },
  { label: 'Courrier action requise', push: true, email: true, sms: true, locked: false },
  { label: 'Réponse à mes demandes', push: true, email: true, sms: false, locked: false },
  { label: 'Convocation disciplinaire', push: true, email: true, sms: true, locked: true },
  { label: 'Alerte sécurité', push: true, email: true, sms: true, locked: true },
  { label: 'Actualités RH', push: false, email: true, sms: false, locked: false },
];

const CONSENTS = [
  { code: 'CONS-1', label: 'Annuaire interne', desc: 'Apparaître dans l’annuaire (nom, poste, contacts pro).', granted: true },
  { code: 'CONS-2', label: 'Photo de profil', desc: 'Afficher ma photo dans l’annuaire et l’organigramme.', granted: true },
  { code: 'CONS-3', label: 'Organigramme', desc: 'Apparaître dans l’organigramme visible par tous.', granted: true },
  { code: 'CONS-4', label: 'Newsletter & communications', desc: 'Recevoir les actualités RH.', granted: true },
  { code: 'CONS-5', label: 'Géolocalisation pointage', desc: 'Position GPS uniquement au moment du pointage.', granted: true },
  { code: 'CONS-6', label: 'Biométrie (bornes)', desc: 'Pointage biométrique si bornes équipées.', granted: false },
  { code: 'CONS-8', label: 'Partage partenaires', desc: 'Partager certaines données avec mutuelle/banque.', granted: true },
  { code: 'CONS-10', label: 'Sondages internes', desc: 'Participer aux sondages climat/engagement.', granted: true },
  { code: 'CONS-12', label: 'Offres de mobilité interne', desc: 'Recevoir les offres correspondant à mon profil.', granted: true },
];

const DATA_CATEGORIES = [
  { icon: '👤', label: 'Identité civile & familiale', retention: 'Contrat + 5 ans' },
  { icon: '💰', label: 'Données financières', retention: '10 ans' },
  { icon: '⏱', label: 'Temps & présence', retention: '5 ans' },
  { icon: '🎯', label: 'Carrière & performance', retention: 'Contrat + 5 ans' },
  { icon: '⚕', label: 'Données médicales (métadonnées)', retention: '30 ans · dossier détaillé exclusif médecin' },
  { icon: '📊', label: 'Métadonnées techniques (logs)', retention: '1 an (accès) / 5 ans (audit)' },
];

export function MesParametresPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);
  const { toast } = useToast();
  const [tab, setTab] = useState('notifications');
  const [mode, setMode] = useState('normal');
  const [consents, setConsents] = useState(() => Object.fromEntries(CONSENTS.map((c) => [c.code, c.granted])));
  const [disco, setDisco] = useState(true);
  const [twoFa, setTwoFa] = useState(true);

  // Couche live — consentements + préférences de notification (repli local ci-dessus).
  const { data: ctx } = useSessionContext();
  const { data: liveConsents } = useMyConsents(ctx?.tenantId, ctx?.employeeId);
  const { data: liveNotifPrefs } = useMyNotificationPrefs(ctx?.tenantId, ctx?.employeeId);
  const toggleConsent = useToggleConsent();
  const consentsLive = isBackendConfigured && !!liveConsents && liveConsents.length > 0;
  const notifLive = isBackendConfigured && !!liveNotifPrefs && liveNotifPrefs.length > 0;

  // Matrice live type × canal pour la vue Notifications (réflexion lecture seule).
  const notifChannels = ['push', 'email', 'sms', 'whatsapp', 'in_app'] as const;
  const notifMatrix = (() => {
    if (!notifLive) return null;
    const byType = new Map<string, { channels: Record<string, boolean>; mandatory: boolean }>();
    for (const p of liveNotifPrefs!) {
      const entry = byType.get(p.notification_type) ?? { channels: {}, mandatory: false };
      entry.channels[p.channel] = p.enabled;
      if (p.is_mandatory) entry.mandatory = true;
      byType.set(p.notification_type, entry);
    }
    return Array.from(byType.entries()).map(([type, v]) => ({ type, ...v }));
  })();

  return (
    <div className="animate-fade-up space-y-5">
      <h1 className="text-2xl font-semibold text-ink">Mes paramètres</h1>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'notifications' && (
        <Card>
          <CardHeader title="Préférences de notification" subtitle={notifLive ? 'Par type × canal · Live DB' : "Par type d'événement × canal"} action={notifLive ? <Wifi size={13} className="text-emerald-500" /> : <Bell size={16} className="text-ink-400" />} />
          <div className="mb-3 flex flex-wrap gap-2">
            {[['normal', 'Normal'], ['focused', 'Concentré'], ['vacation', 'Vacances'], ['silent', 'Silencieux']].map(([k, l]) => (
              <button key={k} onClick={() => setMode(k)} className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold', mode === k ? 'border-amber/40 bg-amber/12 text-amber-deep' : 'border-line text-ink-500')}>{l}</button>
            ))}
          </div>
          {notifMatrix ? (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[560px] text-sm">
                <thead><tr className="border-b border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400"><th className="px-4 py-2.5 text-left">Type</th>{notifChannels.map((ch) => <th key={ch} className="px-2 py-2.5 text-center">{ch}</th>)}</tr></thead>
                <tbody className="divide-y divide-line">
                  {notifMatrix.map((e) => (
                    <tr key={e.type}>
                      <td className="px-4 py-2.5 text-[13px] font-semibold text-ink-700">{e.type}{e.mandatory && <span className="ml-1.5 text-[10px] font-bold text-ink-400">(obligatoire)</span>}</td>
                      {notifChannels.map((ch) => <td key={ch} className="px-2 py-2.5 text-center">{e.channels[ch] ? <Check size={15} className={cn('mx-auto', e.mandatory ? 'text-ink-400' : 'text-ok')} /> : <span className="text-ink-300">—</span>}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[480px] text-sm">
                <thead><tr className="border-b border-line bg-surface2 text-[10px] font-bold uppercase tracking-wider text-ink-400"><th className="px-4 py-2.5 text-left">Événement</th><th className="px-2 py-2.5 text-center">Push</th><th className="px-2 py-2.5 text-center">Email</th><th className="px-2 py-2.5 text-center">SMS</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {NOTIF_EVENTS.map((e) => (
                    <tr key={e.label}>
                      <td className="px-4 py-2.5 text-[13px] font-semibold text-ink-700">{e.label}{e.locked && <span className="ml-1.5 text-[10px] font-bold text-ink-400">(obligatoire)</span>}</td>
                      {(['push', 'email', 'sms'] as const).map((ch) => <td key={ch} className="px-2 py-2.5 text-center">{e[ch] ? <Check size={15} className={cn('mx-auto', e.locked ? 'text-ink-400' : 'text-ok')} /> : <span className="text-ink-300">—</span>}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-[11px] font-medium text-ink-400">Les notifications obligatoires (disciplinaire, sécurité) ne sont pas désactivables.</p>
        </Card>
      )}

      {tab === 'consentements' && (
        <Card>
          <CardHeader title="Mes consentements (RGPD / CDP)" subtitle={consentsLive ? 'Révocables à tout moment · horodaté · Live DB' : 'Révocables à tout moment · chaque changement horodaté'} action={<div className="flex items-center gap-2">{consentsLive && <Wifi size={13} className="text-emerald-500" />}<Button variant="ghost" size="sm" onClick={() => toast({ variant: 'success', title: 'Export généré', description: 'Preuve de mes consentements.pdf' })}><Download size={13} /> Exporter</Button></div>} />
          {consentsLive ? (
            <div className="space-y-1.5">
              {liveConsents!.map((c) => {
                const meta = CONSENTS.find((m) => m.code === c.consent_code);
                return (
                  <div key={c.consent_code} className="flex items-start justify-between gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink"><span className="mono text-[11px] text-ink-400">{c.consent_code}</span> · {meta?.label ?? c.consent_code}</p>{meta?.desc && <p className="text-[11px] font-medium text-ink-400">{meta.desc}</p>}</div>
                    <Switch
                      checked={c.granted}
                      disabled={toggleConsent.isPending}
                      onChange={(v) => toggleConsent.mutate(
                        { code: c.consent_code, granted: v },
                        {
                          onSuccess: () => toast({ variant: v ? 'success' : 'info', title: v ? 'Consentement accordé' : 'Consentement retiré', description: `${meta?.label ?? c.consent_code} — horodaté.` }),
                          onError: (err) => toast({ variant: 'error', title: 'Échec de la mise à jour', description: err instanceof Error ? err.message : 'Consentement non modifié.' }),
                        },
                      )}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              {CONSENTS.map((c) => (
                <div key={c.code} className="flex items-start justify-between gap-3 rounded-xl bg-surface2 px-3 py-2.5">
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink"><span className="mono text-[11px] text-ink-400">{c.code}</span> · {c.label}</p><p className="text-[11px] font-medium text-ink-400">{c.desc}</p></div>
                  <Switch checked={consents[c.code]} onChange={(v) => { setConsents((s) => ({ ...s, [c.code]: v })); toast({ variant: v ? 'success' : 'info', title: v ? 'Consentement accordé' : 'Consentement retiré', description: `${c.label} — horodaté.` }); }} />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'deconnexion' && (
        <Card>
          <CardHeader title="Mon droit à la déconnexion" subtitle="Opposable — aucune sanction pour non-réponse" action={<MoonStar size={16} className="text-ink-400" />} />
          <Switch checked={disco} onChange={setDisco} label="Activer mes plages de déconnexion" />
          {disco && (
            <div className="mt-3 space-y-1.5 text-sm">
              <Row label="Lun–Ven" value="20:00 → 07:30" />
              <Row label="Samedi" value="Toute la journée" />
              <Row label="Dimanche" value="Toute la journée" />
              <Row label="Jours fériés & congés" value="Inclus" />
            </div>
          )}
          <p className="mt-3 text-[11px] font-medium text-ink-400">Exceptions toujours notifiées : convocation disciplinaire, sanction, alerte sécurité, urgence santé.</p>
        </Card>
      )}

      {tab === 'accessibilite' && (
        <Card>
          <CardHeader title="Accessibilité" subtitle="Appliqué à tout le portail" action={<Eye size={16} className="text-ink-400" />} />
          <div className="space-y-3">
            <Switch checked={false} onChange={() => {}} label="Mode haute lisibilité" />
            <Switch checked={false} onChange={() => {}} label="Police dyslexie-friendly" />
            <Switch checked={false} onChange={() => {}} label="Contraste élevé" />
            <Switch checked={false} onChange={() => {}} label="Réduire les animations" />
            <Switch checked={false} onChange={() => {}} label="Montants en toutes lettres (TTS)" />
          </div>
        </Card>
      )}

      {tab === 'langue' && (
        <Card>
          <CardHeader title="Langue de l'interface" action={<Languages size={16} className="text-ink-400" />} />
          <div className="space-y-2">
            {['Français', 'English', 'Português (à venir)'].map((l, i) => (
              <label key={l} className="flex items-center gap-2.5 rounded-xl bg-surface2 px-3 py-2.5"><input type="radio" name="lang" defaultChecked={i === 0} disabled={i === 2} /><span className="text-sm font-semibold text-ink">{l}</span></label>
            ))}
          </div>
        </Card>
      )}

      {tab === 'securite' && (
        <div className="space-y-5">
          <Card>
            <CardHeader title="Mot de passe & 2FA" action={<Lock size={16} className="text-ink-400" />} />
            <Row label="Dernière modification du mot de passe" value="15/03/2026 (74 j)" />
            <Button variant="outline" size="sm" className="mt-2" onClick={() => toast({ variant: 'info', title: 'Changement de mot de passe', description: 'Formulaire sécurisé (ré-auth).' })}>Changer mon mot de passe</Button>
            <div className="mt-3 border-t border-line pt-3"><Switch checked={twoFa} onChange={setTwoFa} label="Authentification à deux facteurs (2FA)" hint="Application authentificator · activée le 02/05/2026" /></div>
          </Card>
          <Card>
            <CardHeader title="Mes sessions actives" />
            <div className="space-y-1.5">
              <SessionRow icon={Monitor} label="Cette session · Mac Safari · Abidjan" current />
              <SessionRow icon={Smartphone} label="iPhone Safari · Abidjan · il y a 2h" />
              <SessionRow icon={Monitor} label="Mac Chrome · Abidjan · il y a 3 j" />
            </div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => toast({ variant: 'success', title: 'Sessions fermées', description: 'Toutes les autres sessions ont été déconnectées.' })}>Déconnecter les autres sessions</Button>
          </Card>
        </div>
      )}

      {tab === 'donnees' && (
        <div className="space-y-5">
          <Card>
            <CardHeader title="Catégories de données détenues sur moi" subtitle="Transparence RGPD / CDP" action={<Database size={16} className="text-ink-400" />} />
            <div className="space-y-1.5">
              {DATA_CATEGORIES.map((c) => (
                <div key={c.label} className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5"><span className="text-lg">{c.icon}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{c.label}</p><p className="text-[11px] font-medium text-ink-400">Conservation : {c.retention}</p></div></div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Mes droits RGPD" subtitle="Toutes les demandes passent par « Mes demandes »" action={<ShieldCheck size={16} className="text-ink-400" />} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link to="/espace/demandes"><Button variant="outline" size="sm" className="w-full"><Download size={13} /> Exporter mes données</Button></Link>
              <Link to="/espace/demandes"><Button variant="outline" size="sm" className="w-full">Rectifier mes données</Button></Link>
              <Link to="/espace/demandes"><Button variant="outline" size="sm" className="w-full">Demander un effacement</Button></Link>
              <Link to="/espace/parametres"><Button variant="outline" size="sm" className="w-full">Gérer mes consentements</Button></Link>
            </div>
            <p className="mt-3 text-[11px] font-medium text-ink-400">Journal d'audit immuable (chaîne SHA-256) de tous les accès à vos données disponible sur demande.</p>
          </Card>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="font-medium text-ink-500">{label}</span><span className="font-semibold text-ink">{value}</span></div>;
}
function SessionRow({ icon: Icon, label, current }: { icon: typeof Monitor; label: string; current?: boolean }) {
  return <div className="flex items-center gap-3 rounded-xl bg-surface2 px-3 py-2.5"><Icon size={16} className="text-ink-400" /><span className="flex-1 text-sm font-medium text-ink-700">{label}</span>{current && <StatusPill tone="ok" dot={false}>Actuelle</StatusPill>}</div>;
}
