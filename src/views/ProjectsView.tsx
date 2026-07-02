import { useMemo, useState } from 'react'
import type { DashboardData } from '../types'
import { fmtDate, fmtNum } from '../lib/format'
import { StatusBadge } from '../components/StatusBadge'

export function ProjectsView({ data }: { data: DashboardData }) {
  const [status, setStatus] = useState('전체')
  const [division, setDivision] = useState('전체')

  const statuses = useMemo(
    () => ['전체', ...new Set(data.projects.map((p) => p.status).filter(Boolean))],
    [data.projects],
  )
  const divisions = useMemo(
    () => ['전체', ...new Set(data.projects.map((p) => p.division).filter(Boolean))],
    [data.projects],
  )

  const rows = data.projects
    .filter((p) => status === '전체' || p.status === status)
    .filter((p) => division === '전체' || p.division === division)

  const sumContract = rows.reduce((s, r) => s + r.contract, 0)
  const sumBilled = rows.reduce((s, r) => s + r.billed, 0)
  const sumReceived = rows.reduce((s, r) => s + r.received, 0)

  return (
    <div className="view">
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={division} onChange={(e) => setDivision(e.target.value)}>
          {divisions.map((d) => <option key={d}>{d}</option>)}
        </select>
        <div className="toolbar__summary">
          {rows.length}건 · 계약 {fmtNum(sumContract)}원 · 기성청구 {fmtNum(sumBilled)}원 · 수금 {fmtNum(sumReceived)}원
        </div>
      </div>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>코드</th><th>프로젝트명</th><th>사업부문</th><th>발주처</th>
              <th>상태</th><th>진행률</th>
              <th className="num">계약금액</th><th className="num">기성청구</th>
              <th className="num">수금액</th><th className="num">잔여계약</th>
              <th>완료예정</th><th>PM</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.code}>
                <td>{p.code}</td>
                <td className="ellipsis">{p.name}</td>
                <td>{p.division}</td>
                <td>{p.client}</td>
                <td><StatusBadge value={p.status} /></td>
                <td>
                  <div className="progress" title={`${Math.round(p.progress * 100)}%`}>
                    <div className="progress__bar" style={{ width: `${p.progress * 100}%` }} />
                    <span className="progress__text">{Math.round(p.progress * 100)}%</span>
                  </div>
                </td>
                <td className="num">{fmtNum(p.contract)}</td>
                <td className="num">{fmtNum(p.billed)}</td>
                <td className="num">{fmtNum(p.received)}</td>
                <td className="num">{fmtNum(p.contract - p.billed)}</td>
                <td>{fmtDate(p.endDate)}</td>
                <td>{p.pm}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6}>합계 ({rows.length}건)</td>
              <td className="num">{fmtNum(sumContract)}</td>
              <td className="num">{fmtNum(sumBilled)}</td>
              <td className="num">{fmtNum(sumReceived)}</td>
              <td className="num">{fmtNum(sumContract - sumBilled)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  )
}
