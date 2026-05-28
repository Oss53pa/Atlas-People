import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, UserCog, Eye, Layers, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { SettingsSubNav } from '../../components/mss/SettingsSubNav';
import { useSurface } from '../../store/useSurface';

const SECTIONS = [
  { to: '/team/parametres/notifications', icon: Bell, title: 'Notifications managériales', desc: 'Matrice événement × canal, mode concentré, plages de déconnexion.' },
  { to: '/team/parametres/delegations', icon: UserCog, title: 'Délégations temporaires', desc: 'Déléguer mes validations à un autre manager (workflow + audit fort).' },
  { to: '/team/parametres/vue-equipe', icon: Eye, title: 'Préférences vue équipe', desc: 'Vue par défaut, tri, colonnes affichées.' },
  { to: '/team/parametres/profondeur', icon: Layers, title: 'Profondeur par défaut', desc: 'Périmètre affiché à l’ouverture du portail.' },
  { to: '/team/parametres/modeles', icon: FileText, title: 'Modèles personnalisés', desc: 'Trames 1:1, feedback, entretien, communication.' },
];

export function SettingsIndexPage() {
  const setSurface = useSurface((s) => s.setSurface);
  useEffect(() => { setSurface('mss'); }, [setSurface]);

  return (
    <div className="animate-fade-up space-y-5">
      <SettingsSubNav />
      <h1 className="text-2xl font-semibold text-ink">Mes paramètres manager</h1>
      <Card><p className="flex items-start gap-2 text-[12px] font-medium text-ink-500"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-info" /> Distincts de vos paramètres employé : ici uniquement les préférences liées à votre rôle managérial.</p></Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.to} to={s.to}>
              <Card className="card-hover h-full cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-info/12 text-info"><Icon size={17} /></span>
                  <ArrowRight size={15} className="mt-1 text-ink-300" />
                </div>
                <p className="mt-3 text-sm font-bold text-ink">{s.title}</p>
                <p className="mt-1 text-[13px] font-medium text-ink-500">{s.desc}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
