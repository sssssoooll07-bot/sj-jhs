import type { DashboardData, SaleRow } from '../types'
import { todayISO } from './format'

export interface MonthlyAgg {
  month: string // "2026-01"
  sales: number
  purchases: number
  profit: number
}

export function monthlyAgg(data: DashboardData): MonthlyAgg[] {
  const map = new Map<string, MonthlyAgg>()
  const get = (ym: string) => {
    let m = map.get(ym)
    if (!m) {
      m = { month: ym, sales: 0, purchases: 0, profit: 0 }
      map.set(ym, m)
    }
    return m
  }
  for (const s of data.sales) if (s.date) get(s.date.slice(0, 7)).sales += s.supply
  for (const p of data.purchases) if (p.date) get(p.date.slice(0, 7)).purchases += p.supply
  const list = [...map.values()].sort((a, b) => a.month.localeCompare(b.month))
  for (const m of list) m.profit = m.sales - m.purchases
  return list
}

export function divisionAgg(sales: SaleRow[]): { name: string; value: number }[] {
  const map = new Map<string, number>()
  for (const s of sales) {
    const key = s.division || '기타'
    map.set(key, (map.get(key) ?? 0) + s.supply)
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export const outstanding = (s: SaleRow) => Math.max(0, s.total - s.received)

export interface Kpis {
  totalSales: number
  totalPurchases: number
  grossProfit: number
  ar: number          // 미수금 (합계금액 - 수금액)
  arOverdueCount: number
  ap: number          // 미지급 매입
  cashBalance: number | null
  activeProjects: number
  headcount: number
}

export function computeKpis(data: DashboardData): Kpis {
  const today = todayISO()
  let ar = 0
  let arOverdueCount = 0
  for (const s of data.sales) {
    const o = outstanding(s)
    if (o > 0) {
      ar += o
      if (s.dueDate && s.dueDate < today) arOverdueCount++
    }
  }
  const ap = data.purchases
    .filter((p) => p.status !== '' && p.status !== '지급완료')
    .reduce((sum, p) => sum + p.total, 0)
  return {
    totalSales: data.sales.reduce((s, r) => s + r.supply, 0),
    totalPurchases: data.purchases.reduce((s, r) => s + r.supply, 0),
    grossProfit:
      data.sales.reduce((s, r) => s + r.supply, 0) -
      data.purchases.reduce((s, r) => s + r.supply, 0),
    ar,
    arOverdueCount,
    ap,
    cashBalance: data.cash.length > 0 ? data.cash[data.cash.length - 1].balance : null,
    activeProjects: data.projects.filter((p) => p.status === '진행중').length,
    headcount: data.employees.filter((e) => e.status === '재직').length,
  }
}
