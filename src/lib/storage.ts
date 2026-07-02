import type { DashboardData } from '../types'

const KEY = 'sj-dashboard-data-v1'

export function saveData(data: DashboardData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // 저장 공간 부족 등 — 저장 실패해도 화면 동작에는 지장 없음
  }
}

export function loadData(): DashboardData | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as DashboardData
    if (!Array.isArray(data.sales) || !Array.isArray(data.purchases)) return null
    return data
  } catch {
    return null
  }
}

export function clearData(): void {
  localStorage.removeItem(KEY)
}
