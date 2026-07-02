import { useMemo, useState } from 'react'
import type { DashboardData } from '../types'
import { outstanding } from '../lib/aggregate'
import { fmtDate, fmtNum } from '../lib/format'
import { StatusBadge } from '../components/StatusBadge'

export function SalesView({ data }: { data: DashboardData }) {
  const [division, setDivision] = useState('전체')
  const [status, setStatus] = useState('전체')
  const [q, setQ] = useState('')

  const divisions = useMemo(
    () => ['전체', ...new Set(data.sales.map((s) => s.division).filter(Boolean))],
    [data.sales],
  )
  const statuses = useMemo(
    () => ['전체', ...new Set(data.sales.map((s) => s.status).filter(Boolean))],
    [data.sales],
  )

  const rows = useMemo(() => {
    const needle = q.trim()
    return data.sales
      .filter((s) => division === '전체' || s.division === division)
      .filter((s) => status === '전체' || s.status === status)
      .filter((s) =>
        needle === '' ||
        [s.client, s.desc, s.project, s.owner].some((v) => v.includes(needle)),
      )
      .slice()
      .reverse() // 최신순
  }, [data.sales, division, status, q])

  const sumSupply = rows.reduce((s, r) => s + r.supply, 0)
  const sumTotal = rows.reduce((s, r) => s + r.total, 0)
  const sumReceived = rows.reduce((s, r) => s + r.received, 0)
  const sumOutstanding = rows.reduce((s, r) => s + outstanding(r), 0)

  return (
    <div className="view">
      <div className="toolbar">
        <select value={division} onChange={(e) => setDivision(e.target.value)}>
          {divisions.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input
          type="search" placeholder="거래처 · 내용 · 프로젝트 · 담당자 검색"
          value={q} onChange={(e) => setQ(e.target.value)}
        />
        <div className="toolbar__summary">
          {rows.length}건 · 합계 {fmtNum(sumTotal)}원 · 수금 {fmtNum(sumReceived)}원 ·{' '}
          <strong className="text-bad">미수 {fmtNum(sumOutstanding)}원</strong>
        </div>
      </div>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>일자</th><th>사업부문</th><th>거래처</th><th>프로젝트</th><th>작업내용</th>
              <th className="num">공급가액</th><th className="num">합계금액</th>
              <th>수금상태</th><th className="num">수금액</th><th className="num">미수액</th>
              <th>수금예정일</th><th>담당</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={i}>
                <td>{fmtDate(s.date)}</td>
                <td>{s.division}</td>
                <td>{s.client}</td>
                <td>{s.project || '-'}</td>
                <td className="ellipsis">{s.desc}</td>
                <td className="num">{fmtNum(s.supply)}</td>
                <td className="num">{fmtNum(s.total)}</td>
                <td><StatusBadge value={s.status} /></td>
                <td className="num">{fmtNum(s.received)}</td>
                <td className={`num ${outstanding(s) > 0 ? 'text-bad' : ''}`}>{fmtNum(outstanding(s))}</td>
                <td>{fmtDate(s.dueDate)}</td>
                <td>{s.owner}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}>합계 ({rows.length}건)</td>
              <td className="num">{fmtNum(sumSupply)}</td>
              <td className="num">{fmtNum(sumTotal)}</td>
              <td />
              <td className="num">{fmtNum(sumReceived)}</td>
              <td className="num">{fmtNum(sumOutstanding)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  )
}
