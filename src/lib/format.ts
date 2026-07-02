/** 1,234,567 → "1,234,567원" */
export const fmtFull = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`

/** 숫자만 콤마 표기 */
export const fmtNum = (n: number) => Math.round(n).toLocaleString('ko-KR')

/** KPI용 축약 표기: 3.2억 / 4,500만 / 1,200 */
export function fmtKRW(n: number): string {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs >= 1e8) return `${sign}${(abs / 1e8).toFixed(1).replace(/\.0$/, '')}억`
  if (abs >= 1e4) return `${sign}${Math.round(abs / 1e4).toLocaleString('ko-KR')}만`
  return `${sign}${Math.round(abs).toLocaleString('ko-KR')}`
}

/** 차트용 백만원 단위 */
export const toMillion = (n: number) => Math.round(n / 1e5) / 10

export const fmtDate = (iso: string | null) => iso ?? '-'

/** "2026-03" → "3월" */
export const monthLabel = (ym: string) => `${Number(ym.slice(5, 7))}월`

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
