import { useMemo } from 'react';
import {
  Globe, Eye, TrendingUp, Star, Quote, Video, ExternalLink, Settings2, Users,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { RecrutSubNav } from '../../components/recrut/RecrutSubNav';
import { CAREER_SITE_SECTIONS, TESTIMONIALS, employerBrandKpis } from '../../lib/m5/assessments';
import { cn } from '../../lib/cn';

export function MarqueEmployeurPage() {
  const { toast } = useToast();
  const k = useMemo(() => employerBrandKpis(), []);
  const siteUrl = 'recrutement.crmc.atlas-people.com';

  return (
    <div className="animate-fade-up space-y-5">
      <RecrutSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Marque employeur</h1>
          <p className="text-sm font-medium text-ink-500">Site carrière personnalisable · contenu · mesure d'attractivité</p>
        </div>
        <Button size="sm" onClick={() => toast({ variant: 'info', title: 'Site carrière', description: `Aperçu public : ${siteUrl}` })}><ExternalLink size={14} /> Voir le site public</Button>
      </div>

      <Card className="glass-amber">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber/15 text-amber-deep"><Globe size={20} /></span>
            <div>
              <p className="text-sm font-bold text-ink">Site carrière publié</p>
              <p className="mono text-[12px] font-medium text-ink-500">https://{siteUrl}</p>
            </div>
          </div>
          <StatusPill tone="ok" dot>En ligne</StatusPill>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Visiteurs / mois" value={k.visitorsMonth.toLocaleString('fr-FR')} unit="site carrière" icon={Eye} delta={{ value: `+${k.visitorsDelta}%`, trend: 'up' }} />
        <StatCard label="Conversion" value={`${k.conversionRate} %`} unit="visiteur → candidature" icon={TrendingUp} tone="amber" />
        <StatCard label="Note Glassdoor" value={`${k.glassdoorScore}`} unit="/ 5" icon={Star} />
        <StatCard label="Taux acceptation" value={`${k.acceptanceRate} %`} unit="offres" icon={TrendingUp} />
        <StatCard label="Candidatures spontanées" value={String(k.spontaneousApps)} unit="/ mois" icon={Users} />
        <StatCard label="Témoignages" value={String(TESTIMONIALS.length)} unit="publiés" icon={Quote} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* Sections du site */}
        <Card>
          <CardHeader title="Sections du site carrière" subtitle="Activer / désactiver les blocs publiés" action={<Settings2 size={16} className="text-ink-400" />} />
          <div className="space-y-1.5">
            {CAREER_SITE_SECTIONS.map((s) => (
              <div key={s.key} className="flex items-center gap-3 rounded-xl border border-line bg-surface2/30 px-3 py-2">
                <span className={cn('flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors', s.enabled ? 'justify-end bg-amber-deep' : 'justify-start bg-ink-300/40')}>
                  <span className="h-4 w-4 rounded-full bg-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">{s.label}</p>
                  <p className="truncate text-[11px] font-medium text-ink-500">{s.summary}</p>
                </div>
                <StatusPill tone={s.enabled ? 'ok' : 'neutral'} dot={false}>{s.enabled ? 'Visible' : 'Masqué'}</StatusPill>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-line pt-3">
            <Button variant="outline" size="sm" onClick={() => toast({ variant: 'success', title: 'Site carrière', description: 'Modifications publiées sur le site public' })}>Publier les modifications</Button>
          </div>
        </Card>

        {/* Témoignages */}
        <Card>
          <CardHeader title="Témoignages collaborateurs" subtitle="Citations & vidéos" action={<Quote size={16} className="text-amber-deep" />} />
          <div className="space-y-2">
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className="rounded-xl border border-line bg-surface2/30 p-3">
                <div className="flex items-center gap-2">
                  <Avatar name={t.authorName} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold text-ink">{t.authorName}</p>
                    <p className="truncate text-[10px] font-medium text-ink-500">{t.role}</p>
                  </div>
                  {t.hasVideo && <span className="flex items-center gap-1 rounded-md bg-amber/12 px-1.5 py-0.5 text-[10px] font-bold text-amber-deep"><Video size={10} /> Vidéo</span>}
                </div>
                <p className="mt-1.5 text-[12px] font-medium italic text-ink-700">« {t.quote} »</p>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => toast({ variant: 'info', title: 'Témoignage', description: 'Ajouter un témoignage collaborateur' })}>+ Ajouter un témoignage</Button>
        </Card>
      </div>

      <p className="text-[11px] font-medium text-ink-400">Marque employeur M5 · site carrière {siteUrl} · multilingue FR/EN · SEO + analytics · RGPD by design.</p>
    </div>
  );
}
