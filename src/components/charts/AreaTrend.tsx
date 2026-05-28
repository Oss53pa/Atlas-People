import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

const PALETTE: Record<string, string> = {
  amber: '#EF9F27',
  info: '#3B82C4',
  ok: '#1B9E6B',
};

function CustomTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-float backdrop-blur">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs font-semibold text-ink">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="mono">{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AreaTrend({
  data,
  series,
  xKey = 'label',
  height = 240,
  formatter,
}: {
  data: Array<Record<string, number | string | null>>;
  series: TrendSeries[];
  xKey?: string;
  height?: number;
  formatter?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <defs>
          {series.map((s) => {
            const color = PALETTE[s.color] ?? s.color;
            return (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(23,21,15,0.07)" vertical={false} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#928D81', fontSize: 11, fontWeight: 600 }}
          dy={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={36}
          tick={{ fill: '#928D81', fontSize: 11, fontWeight: 600 }}
        />
        <Tooltip content={<CustomTooltip formatter={formatter} />} cursor={{ stroke: 'rgba(239,159,39,0.4)', strokeWidth: 1 }} />
        {series.map((s) => {
          const color = PALETTE[s.color] ?? s.color;
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#grad-${s.key})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}
