import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, User, Wallet, CalendarClock, Target, GraduationCap, ReceiptText,
  Inbox, Mail, HeartPulse, Rocket, Settings, ArrowRight, Lock,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { Avatar } from '../../components/ui/Avatar';
import { Brand } from '../../components/ui/Brand';
import { useSurface } from '../../store/useSurface';
import { employeeById, employeeName } from '../../data/mock';
import { cn } from '../../lib/cn';

const SELF_ID = 'e2';

interface Section {
  code: string; title: string; desc: string; icon: typeof Home; to?: string; live: boolean;
}

const SECTIONS: Section[] = [
  { code: 'S1', title: 'Accueil', desc: 'Vue d\'ensemble de mon espace', icon: Home, to: '/espace', live: true },
  { code: 'S2', title: 'Mon profil', desc: 'Identité, famille, coordonnées, documents', icon: User, to: '/espace/profil', live: true },
  { code: 'S3', title: 'Ma paie', desc: 'Bulletins, cumuls, attestations', icon: Wallet, to: '/espace/paie', live: true },
  { code: 'S4', title: 'Mon temps', desc: 'Congés, pointage, planning, heures sup', icon: CalendarClock, to: '/me/time', live: true },
  { code: 'S5', title: 'Ma performance', desc: 'Objectifs (OKR), évaluations, entretiens', icon: Target, live: false },
  { code: 'S6', title: 'Mon développement', desc: 'Compétences, formations, carrière', icon: GraduationCap, live: false },
  { code: 'S7', title: 'Mes notes de frais', desc: 'Saisie, suivi, remboursements', icon: ReceiptText, to: '/espace/frais', live: true },
  { code: 'S8', title: 'Mes demandes', desc: 'Helpdesk RH, suivi des tickets', icon: Inbox, live: false },
  { code: 'S9', title: 'Mon courrier', desc: 'Correspondance officielle, signatures', icon: Mail, live: false },
  { code: 'S10', title: 'Mon suivi santé', desc: 'Visites, aptitude, vaccinations', icon: HeartPulse, live: false },
  { code: 'S11', title: 'Mon onboarding', desc: 'Parcours d\'intégration / de départ', icon: Rocket, live: false },
  { code: 'PARAMS', title: 'Mes paramètres', desc: 'Notifications, consentements, sécurité', icon: Settings, live: false },
];

/** Portail collaborateur — hub /espace (ESS). Répertoire des 13 sections. */
export function PortalHubPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('ess'); }, [setSurface]);

  const employee = employeeById(SELF_ID)!;
  const greeting = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir';

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-deep">Portail collaborateur</p>
          <h1 className="text-2xl font-semibold text-ink">{greeting} {employee.firstName}</h1>
          <p className="text-sm font-medium text-ink-500">Votre espace personnel — vos données uniquement</p>
        </div>
        <Avatar name={employeeName(employee)} size="lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const inner = (
            <Card className={cn('h-full transition-all', s.live ? 'card-hover cursor-pointer' : 'opacity-70')}>
              <div className="flex items-start gap-3">
                <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', s.live ? 'bg-amber/12 text-amber-deep' : 'bg-ink/[0.05] text-ink-400')}>
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-ink">{s.title}</h2>
                    {!s.live && <StatusPill tone="neutral" dot={false}>à venir</StatusPill>}
                  </div>
                  <p className="mt-0.5 text-[12px] font-medium text-ink-400">{s.desc}</p>
                </div>
                {s.live ? <ArrowRight size={16} className="shrink-0 text-ink-400" /> : <Lock size={14} className="shrink-0 text-ink-300" />}
              </div>
            </Card>
          );
          return s.live && s.to ? <Link key={s.code} to={s.to}>{inner}</Link> : <div key={s.code}>{inner}</div>;
        })}
      </div>

      <p className="px-2 text-center text-[11px] font-medium text-ink-400">
        Vos données restent sur l'infrastructure de confiance Atlas · <Brand name="Proph3t" /> souverain · aucune donnée d'un autre collaborateur.
      </p>
    </div>
  );
}
