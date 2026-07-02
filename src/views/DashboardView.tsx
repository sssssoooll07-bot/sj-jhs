import {
  Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { DashboardData } from '../types'
import { computeKpis, divisionAgg, monthlyAgg, outstanding } from '../lib/aggregate'
import { fmtDate, fmtFull, fmtKRW, fmtNum, monthLabel, toMillion, todayISO } from '../lib/format'
import { KpiCard } from '../components/KpiCard'
import { StatusBadge } from '../components/StatusBadge'

const PIE_COLORS = ['#2e75b6', '#43a047', '#ef6c00', '#8e24aa', '#607d8b']

export function DashboardView({ data }: { data: DashboardData }) {
  const kpi = computeKpis(data)
  const monthly = monthlyAgg(data).map((m) => ({
    name: monthLabel(m.month),
    매출: toMillion(m.sales),
    매입: toMillion(m.purchases),
    이익: toMillion(m.profit),
  }))
  const division = divisionAgg(data.sales)
  const cashSeries = data.cash.map((c, i) => ({
    name: c.date ?? String(i),
    잔액: toMillion(c.balance),
  }))
  const today = todayISO()
  const arRows = data.sales
    .filter((s) => outstanding(s) > 0)
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
    .slice(0, 8)

  return (
    <div className="view">
      <div className="kpi-grid">
        <KpiCard label="누적 매출 (공급가액)" value={fmtKRW(kpi.totalSales)} title={fmtFull(kpi.totalSales)} />
        <KpiCard label="누적 매입 (공급가액)" value={fmtKRW(kpi.totalPurchases)} title={fmtFull(kpi.totalPurchases)} />
        <KpiCard
          label="매출총이익" value={fmtKRW(kpi.grossProfit)} title={fmtFull(kpi.grossProfit)}
          tone={kpi.grossProfit >= 0 ? 'good' : 'bad'}
        />
        <KpiCard
          label="현금 잔액" value={kpi.cashBalance == null ? '-' : fmtKRW(kpi.cashBalance)}
          title={kpi.cashBalance == null ? undefined : fmtFull(kpi.cashBalance)}
          tone={kpi.cashBalance != null && kpi.cashBalance < 0 ? 'bad' : 'default'}
        />
        <KpiCard
          label="미수금" value={fmtKRW(kpi.ar)} title={fmtFull(kpi.ar)}
          sub={kpi.arOverdueCount > 0 ? `기한 경과 ${kpi.arOverdueCount}건` : '기한 경과 없음'}
          tone={kpi.arOverdueCount > 0 ? 'bad' : 'warn'}
        />
        <KpiCard label="미지급 매입" value={fmtKRW(kpi.ap)} title={fmtFull(kpi.ap)} tone="warn" />
        <KpiCard label="진행중 프로젝트" value={`${kpi.activeProjects}건`} />
        <KpiCard label="재직 인원" value={`${kpi.headcount}명`} />
      </div>

      <div className="panel-grid panel-grid--2-1">
        <section className="panel">
          <h2>월별 매출 · 매입 · 이익 <span className="unit">(백만원)</span></h2>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v) => `${fmtNum(Number(v))}백만`} />
              <Legend />
              <Bar dataKey="매출" fill="#2e75b6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="매입" fill="#c9d4e0" radius={[3, 3, 0, 0]} />
              <Line dataKey="이익" stroke="#ef6c00" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </section>

        <section className="panel">
          <h2>사업부문별 매출</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={division} dataKey="value" nameKey="name"
                innerRadius={55} outerRadius={90} paddingAngle={2}
              >
                {division.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => fmtFull(Number(v))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="panel-grid panel-grid--1-1">
        <section className="panel">
          <h2>현금 잔액 추이 <span className="unit">(백만원)</span></h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={cashSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" />
              <XAxis dataKey="name" fontSize={11} minTickGap={40} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v) => `${fmtNum(Number(v))}백만`} />
              <Line dataKey="잔액" stroke="#2e75b6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="panel">
          <h2>미수금 현황 <span className="unit">(수금예정일 순)</span></h2>
          {arRows.length === 0 ? (
            <p className="empty">미수금이 없습니다 🎉</p>
          ) : (
            <table className="table table--compact">
              <thead>
                <tr>
                  <th>거래처</th><th>내용</th><th className="num">미수액</th>
                  <th>수금예정일</th><th>상태</th>
                </tr>
              </thead>
              <tbody>
                {arRows.map((s, i) => (
                  <tr key={i} className={s.dueDate && s.dueDate < today ? 'row--overdue' : ''}>
                    <td>{s.client}</td>
                    <td className="ellipsis">{s.desc}</td>
                    <td className="num">{fmtNum(outstanding(s))}</td>
                    <td>{fmtDate(s.dueDate)}{s.dueDate && s.dueDate < today ? ' ⚠️' : ''}</td>
                    <td><StatusBadge value={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}
