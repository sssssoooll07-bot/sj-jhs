import { useMemo, useState } from 'react'
import type { DashboardData, PurchaseRow } from '../types'
import type { Updater } from '../App'
import { fmtDate, fmtNum } from '../lib/format'
import { formToPurchase, purchaseFields, purchaseToForm } from '../lib/editing'
import { StatusBadge } from '../components/StatusBadge'
import { EditDialog } from '../components/EditDialog'
import { ConfirmBox } from '../components/ConfirmBox'

export function PurchasesView({ data, update }: { data: DashboardData; update: Updater }) {
  const [category, setCategory] = useState('전체')
  const [status, setStatus] = useState('전체')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<PurchaseRow | 'new' | null>(null)
  const [deleting, setDeleting] = useState<PurchaseRow | null>(null)

  const categories = useMemo(
    () => ['전체', ...new Set(data.purchases.map((p) => p.category).filter(Boolean))],
    [data.purchases],
  )
  const statuses = useMemo(
    () => ['전체', ...new Set(data.purchases.map((p) => p.status).filter(Boolean))],
    [data.purchases],
  )

  const rows = useMemo(() => {
    const needle = q.trim()
    return data.purchases
      .filter((p) => category === '전체' || p.category === category)
      .filter((p) => status === '전체' || p.status === status)
      .filter((p) =>
        needle === '' ||
        [p.client, p.desc, p.project, p.owner].some((v) => v.includes(needle)),
      )
      .slice()
      .reverse()
  }, [data.purchases, category, status, q])

  const sumSupply = rows.reduce((s, r) => s + r.supply, 0)
  const sumTotal = rows.reduce((s, r) => s + r.total, 0)
  const unpaid = rows.filter((r) => r.status !== '' && r.status !== '지급완료')
  const sumUnpaid = unpaid.reduce((s, r) => s + r.total, 0)

  function handleSave(row: PurchaseRow) {
    update((d) => ({
      ...d,
      purchases: editing === 'new' ? [...d.purchases, row] : d.purchases.map((p) => (p === editing ? row : p)),
    }))
    setEditing(null)
  }


  return (
    <div className="view">
      <div className="toolbar">
        <button className="btn-solid" onClick={() => setEditing('new')}>+ 매입 추가</button>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input
          type="search" placeholder="거래처 · 내용 · 프로젝트 검색"
          value={q} onChange={(e) => setQ(e.target.value)}
        />
        <div className="toolbar__summary">
          {rows.length}건 · 합계 {fmtNum(sumTotal)}원 ·{' '}
          <strong className="text-bad">미지급 {unpaid.length}건 {fmtNum(sumUnpaid)}원</strong>
        </div>
      </div>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>일자</th><th>비용구분</th><th>거래처</th><th>프로젝트</th><th>품목/내용</th>
              <th className="num">공급가액</th><th className="num">합계금액</th>
              <th>지급상태</th><th>지급예정일</th><th>지급일</th><th>담당</th><th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={i}>
                <td>{fmtDate(p.date)}</td>
                <td>{p.category}</td>
                <td>{p.client}</td>
                <td>{p.project || '-'}</td>
                <td className="ellipsis">{p.desc}</td>
                <td className="num">{fmtNum(p.supply)}</td>
                <td className="num">{fmtNum(p.total)}</td>
                <td><StatusBadge value={p.status} /></td>
                <td>{fmtDate(p.dueDate)}</td>
                <td>{fmtDate(p.paidDate)}</td>
                <td>{p.owner}</td>
                <td className="row-actions">
                  <button className="btn-icon" title="수정" onClick={() => setEditing(p)}>✏️</button>
                  <button className="btn-icon" title="삭제" onClick={() => setDeleting(p)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}>합계 ({rows.length}건)</td>
              <td className="num">{fmtNum(sumSupply)}</td>
              <td className="num">{fmtNum(sumTotal)}</td>
              <td colSpan={5} />
            </tr>
          </tfoot>
        </table>
      </section>

      {editing && (
        <EditDialog
          title={editing === 'new' ? '매입 추가' : '매입 수정'}
          fields={purchaseFields}
          initial={purchaseToForm(editing === 'new' ? null : editing)}
          onSave={(v) => handleSave(formToPurchase(v))}
          onCancel={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmBox
          danger
          confirmLabel="삭제"
          message={`이 매입 기록을 삭제할까요?\n${fmtDate(deleting.date)} · ${deleting.client} · ${fmtNum(deleting.total)}원`}
          onConfirm={() => {
            update((d) => ({ ...d, purchases: d.purchases.filter((p) => p !== deleting) }))
            setDeleting(null)
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
