import type { DashboardData } from '../types'

const KEY = 'sj-dashboard-data-v1'
const RAW_KEY = 'sj-dashboard-raw-v1'

/** 원본 엑셀 사본(base64) — 다운로드 시 편집하지 않는 시트(인사·거래처 등)를 보존하기 위함.
 *  localStorage 용량 초과 시에도 세션 동안은 메모리에 유지된다. */
let rawMem: string | null = null

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

export function saveRaw(buf: ArrayBuffer): void {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  rawMem = btoa(bin)
  try {
    localStorage.setItem(RAW_KEY, rawMem)
  } catch {
    // 파일이 너무 크면 localStorage에는 저장하지 않는다 (메모리에는 유지)
  }
}

export function loadRaw(): string | null {
  if (rawMem) return rawMem
  try {
    return localStorage.getItem(RAW_KEY)
  } catch {
    return null
  }
}

export function clearData(): void {
  rawMem = null
  localStorage.removeItem(KEY)
  localStorage.removeItem(RAW_KEY)
}
