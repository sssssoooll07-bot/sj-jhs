import { useMemo, useState } from 'react'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { CashRow, DashboardData } from '../types'
import type { Updater } from '../App'
import { fmtDate, fmtFull, fmtKRW, fmtNum, toMillion } from '../lib/format'
import { cashFields, cashToForm, formToCash } from '../lib/editing'
import { StatusBadge } from '../components/StatusBadge'
import { KpiCard } from '../components/KpiCard'
import { EditDialog } from '../components/EditDialog'
import { ConfirmBox } from '../components/ConfirmBox'

export function CashView({ data, update }: { data: DashboardData; update: Updater }) {
  const [month, setMonth] = useState('전체')
  const [editing, setEditing] = useState<CashRow | 'new' | null>(null)
  const [deleting, setDeleting] = useState<CashRow | null>(null)

  const months = useMemo(
    () => ['전체', ...new Set(data.cash.map((c) => c.date?.slice(0, 7) ?? '').filter(Boolean))],
    [data.cash],
  )
  const rows = data.cash.filter((c) => month === '전체' || c.date?.startsWith(month))

  const sumIn = rows.reduce((s, r) => s + r.inflow, 0)
  const sumOut = rows.reduce((s, r) => s + r.outflow, 0)
  const lastBalance = data.cash.length > 0 ? data.cash[data.cash.length - 1].balance : 0
  const series = data.cash.map((c, i) => ({ name: c.date ?? String(i), 잔액: toMillion(c.balance) }))

  function handleSave(row: CashRow) {
    update((d) => ({
      ...d,
      cash: editing === 'new' ? [...d.cash, row] : d.cash.map((c) => (c === editing ? row : c)),
    }))
    setEditing(null)
  }


  return (
    <div className="view">
      <div className="kpi-grid kpi-grid--3">
        <KpiCard label="현재 잔액" value={fmtKRW(lastBalance)} title={fmtFull(lastBalance)}
          tone={lastBalance < 0 ? 'bad' : 'good'} />
        <KpiCard label={`입금 합계 (${month})`} value={fmtKRW(sumIn)} title={fmtFull(sumIn)} />
        <KpiCard label={`출금 합계 (${month})`} value={fmtKRW(sumOut)} title={fmtFull(sumOut)} />
      </div>

      <section className="panel">
        <h2>잔액 추이 <span className="unit">(백만원)</span></h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" />
            <XAxis dataKey="name" fontSize={11} minTickGap={40} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(v) => `${fmtNum(Number(v))}백만`} />
            <Line dataKey="잔액" stroke="#2e75b6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <div className="toolbar">
        <button className="btn-solid" onClick={() => setEditing('new')}>+ 입출금 추가</button>
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          {months.map((m) => <option key={m}>{m}</option>)}
        </select>
        <div className="toolbar__summary">
          {rows.length}건 · 입금 {fmtNum(sumIn)}원 · 출금 {fmtNum(sumOut)}원
        </div>
      </div>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>일자</th><th>구분</th><th>계정과목</th><th>거래처/내역</th>
              <th className="num">입금액</th><th className="num">출금액</th>
              <th className="num">잔액</th><th>계좌</th><th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice().reverse().map((c, i) => (
              <tr key={i}>
                <td>{fmtDate(c.date)}</td>
                <td><StatusBadge value={c.kind} /></td>
                <td>{c.category}</td>
                <td className="ellipsis">{c.desc}</td>
                <td className="num text-good">{c.inflow > 0 ? fmtNum(c.inflow) : ''}</td>
                <td className="num text-bad">{c.outflow > 0 ? fmtNum(c.outflow) : ''}</td>
                <td className="num">{fmtNum(c.balance)}</td>
                <td>{c.account}</td>
                <td className="row-actions">
                  <button className="btn-icon" title="수정" onClick={() => setEditing(c)}>✏️</button>
                  <button className="btn-icon" title="삭제" onClick={() => setDeleting(c)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {editing && (
        <EditDialog
          title={editing === 'new' ? '입출금 추가' : '입출금 수정'}
          fields={cashFields}
          initial={cashToForm(editing === 'new' ? null : editing)}
          onSave={(v) => handleSave(formToCash(v))}
          onCancel={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmBox
          danger
          confirmLabel="삭제"
          message={`이 입출금 기록을 삭제할까요?\n${fmtDate(deleting.date)} · ${deleting.desc} · ${fmtNum(deleting.inflow || deleting.outflow)}원`}
          onConfirm={() => {
            update((d) => ({ ...d, cash: d.cash.filter((c) => c !== deleting) }))
            setDeleting(null)
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
