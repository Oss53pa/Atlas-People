import { CalendarClock, Coins, Calculator, ShieldCheck, Hash, Plug } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { PaieSubNav } from '../../components/paie/PaieSubNav';

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between py-1.5"><span className="text-[12px] font-medium text-ink-500">{label}</span><span className="text-[13px] font-semibold text-ink">{value}</span></div>;
}

export function ParametresPaiePage() {
  return (
    <div className="animate-fade-up space-y-5">
      <PaieSubNav />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Paramètres paie</h1>
        <p className="text-sm font-medium text-ink-500">Configuration tenant du module M3 · Atlas Studio CI</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Calendrier de paie" action={<CalendarClock size={16} className="text-ink-400" />} />
          <div className="divide-y divide-line">
            <Row label="Jour théorique de paie" value="25 du mois" />
            <Row label="Deadline saisie variables" value="20 du mois" />
            <Row label="Deadline validation" value="23 du mois" />
            <Row label="Déclarations sociales" value="J+5 après paie" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Devises & arrondis" action={<Coins size={16} className="text-ink-400" />} />
          <div className="divide-y divide-line">
            <Row label="Devise principale" value="XOF (FCFA)" />
            <Row label="Multi-devises expatriés" value="USD, EUR" />
            <Row label="Mode d'arrondi" value="HALF_EVEN" />
            <Row label="Précision" value="0 décimale (franc entier)" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Workflow de validation (4-eyes)" action={<ShieldCheck size={16} className="text-ink-400" />} />
          <div className="divide-y divide-line">
            <Row label="Calcul → validation" value="Responsable paie" />
            <Row label="Validation bulletins" value="Responsable + DRH/DAF" />
            <Row label="Émission virements" value="DRH + Trésorier" />
            <Row label="Seuil validation renforcée" value="> 5 M FCFA → 3 validateurs" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Numérotation" action={<Hash size={16} className="text-ink-400" />} />
          <div className="divide-y divide-line">
            <Row label="N° bulletin" value="{SOC}-BUL-{YYYY}-{MM}-{SEQ:06}" />
            <Row label="N° ordre de virement" value="OV-{SOC}-{YYYYMMDD}-{SEQ}" />
            <Row label="Réinitialisation séquence" value="Annuelle" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Bornages" action={<Calculator size={16} className="text-ink-400" />} />
          <div className="divide-y divide-line">
            <Row label="SMIG appliqué (CI)" value="75 000 FCFA" />
            <Row label="Quotité saisissable max" value="33 % du brut" />
            <Row label="Plafond cumul HS annuel" value="220 h" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Intégrations" action={<Plug size={16} className="text-ink-400" />} />
          <div className="space-y-2">
            {[['Atlas Finance', 'OD comptables', 'ok'], ['CinetPay', 'Mobile Money', 'ok'], ['CNPS en ligne', 'Déclarations', 'warn'], ['e-Impôts DGI', 'Déclarations fiscales', 'warn']].map(([n, d, s]) => (
              <div key={n} className="flex items-center justify-between rounded-xl bg-surface2 px-3 py-2">
                <div><p className="text-[13px] font-semibold text-ink">{n}</p><p className="text-[11px] font-medium text-ink-400">{d}</p></div>
                <StatusPill tone={s === 'ok' ? 'ok' : 'warn'} dot={false}>{s === 'ok' ? 'Connecté' : 'À configurer'}</StatusPill>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
