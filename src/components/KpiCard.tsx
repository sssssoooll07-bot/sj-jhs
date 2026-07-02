interface Props {
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'good' | 'warn' | 'bad'
  title?: string
}

export function KpiCard({ label, value, sub, tone = 'default', title }: Props) {
  return (
    <div className={`kpi kpi--${tone}`} title={title}>
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">{value}</div>
      {sub && <div className="kpi__sub">{sub}</div>}
    </div>
  )
}
