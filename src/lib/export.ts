import * as XLSX from 'xlsx'
import type { DashboardData } from '../types'
import { todayISO } from './format'
import { loadRaw } from './storage'

type Cell = XLSX.CellObject | null

const MONEY = '#,##0'
const DATE_FMT = 'yyyy-mm-dd'

/** yyyy-mm-dd → 엑셀 날짜 일련번호 (타임존 무관) */
function dateSerial(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000)
}

const S = (v: string): Cell => (v === '' ? null : { t: 's', v })
const N = (v: number, z = MONEY): Cell => ({ t: 'n', v, z })
const D = (iso: string | null): Cell => (iso ? { t: 'n', v: dateSerial(iso), z: DATE_FMT } : null)
/** 수식 + 계산된 캐시값 (엑셀에서 다시 열면 수식으로 동작) */
const F = (f: string, v: number, z = MONEY): Cell => ({ t: 'n', f, v, z })

function buildSheet(headers: string[], rows: Cell[][], widths: number[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {}
  headers.forEach((h, c) => {
    ws[XLSX.utils.encode_cell({ r: 0, c })] = { t: 's', v: h }
  })
  rows.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell) ws[XLSX.utils.encode_cell({ r: r + 1, c })] = cell
    }),
  )
  ws['!ref'] = `A1:${XLSX.utils.encode_cell({ r: Math.max(rows.length, 1), c: headers.length - 1 })}`
  ws['!cols'] = widths.map((wch) => ({ wch }))
  return ws
}

function salesSheet(data: DashboardData): XLSX.WorkSheet {
  const headers = ['일자', '사업부문', '사업장', '거래처명', '프로젝트코드', '작업내용',
    '공급가액(원)', '부가세(원)', '합계금액(원)', '세금계산서', '수금예정일', '수금일',
    '수금상태', '수금액(원)', '담당자', '비고']
  const rows = data.sales.map((s, i) => {
    const r = i + 2
    return [
      D(s.date), S(s.division), S(s.site), S(s.client), S(s.project), S(s.desc),
      N(s.supply), N(s.vat), F(`G${r}+H${r}`, s.supply + s.vat), S(s.taxInvoice),
      D(s.dueDate), D(s.paidDate), S(s.status), N(s.received), S(s.owner), S(s.note),
    ]
  })
  return buildSheet(headers, rows, [11, 13, 10, 20, 12, 38, 13, 11, 13, 10, 11, 11, 9, 13, 8, 20])
}

function purchasesSheet(data: DashboardData): XLSX.WorkSheet {
  const headers = ['일자', '비용구분', '사업장', '거래처명', '프로젝트코드', '품목/내용',
    '공급가액(원)', '부가세(원)', '합계금액(원)', '세금계산서', '지급예정일', '지급일',
    '지급상태', '담당자', '비고']
  const rows = data.purchases.map((p, i) => {
    const r = i + 2
    return [
      D(p.date), S(p.category), S(p.site), S(p.client), S(p.project), S(p.desc),
      N(p.supply), N(p.vat), F(`G${r}+H${r}`, p.supply + p.vat), S(p.taxInvoice),
      D(p.dueDate), D(p.paidDate), S(p.status), S(p.owner), S(p.note),
    ]
  })
  return buildSheet(headers, rows, [11, 11, 10, 18, 12, 34, 13, 11, 13, 10, 11, 11, 9, 8, 16])
}

function projectsSheet(data: DashboardData): XLSX.WorkSheet {
  const headers = ['프로젝트코드', '프로젝트명', '사업부문', '발주처', '사업장',
    '계약금액(공급가액,원)', '계약일', '착수일', '완료예정일', '진행상태', '진행률',
    '기성청구액(원)', '수금액(원)', '잔여계약액(원)', '담당PM', '비고']
  const rows = data.projects.map((p, i) => {
    const r = i + 2
    return [
      S(p.code), S(p.name), S(p.division), S(p.client), S(p.site), N(p.contract),
      D(p.contractDate), D(p.startDate), D(p.endDate), S(p.status),
      { t: 'n', v: p.progress, z: '0%' } as Cell,
      F(`SUMIFS(매출관리!$G:$G,매출관리!$E:$E,$A${r})`, p.billed),
      F(`SUMIFS(매출관리!$N:$N,매출관리!$E:$E,$A${r})`, p.received),
      F(`$F${r}-$L${r}`, p.contract - p.billed),
      S(p.pm), S(p.note),
    ]
  })
  return buildSheet(headers, rows, [12, 36, 13, 20, 10, 17, 11, 11, 11, 9, 8, 14, 14, 14, 9, 16])
}

function cashSheet(data: DashboardData): XLSX.WorkSheet {
  const headers = ['일자', '구분', '계정과목', '거래처/내역', '입금액(원)', '출금액(원)',
    '잔액(원)', '계좌', '비고']
  const rows = data.cash.map((c, i) => {
    const r = i + 2
    return [
      D(c.date), S(c.kind), S(c.category), S(c.desc), N(c.inflow), N(c.outflow),
      F(r === 2 ? 'E2-F2' : `G${r - 1}+E${r}-F${r}`, c.balance),
      S(c.account), S(c.note),
    ]
  })
  return buildSheet(headers, rows, [11, 7, 11, 30, 14, 14, 15, 12, 20])
}

const EDITED_SHEETS: [string, (d: DashboardData) => XLSX.WorkSheet][] = [
  ['매출관리', salesSheet],
  ['매입관리', purchasesSheet],
  ['프로젝트', projectsSheet],
  ['자금관리', cashSheet],
]

/** 내보낼 워크북 생성: 원본 사본이 있으면 편집한 시트만 교체하고 나머지는 보존 */
export function buildWorkbook(data: DashboardData): { wb: XLSX.WorkBook; preserved: boolean } {
  const raw = loadRaw()
  let wb: XLSX.WorkBook
  let preserved = false

  if (raw) {
    try {
      wb = XLSX.read(raw, { type: 'base64', cellStyles: true, cellNF: true })
      preserved = true
    } catch {
      wb = XLSX.utils.book_new()
    }
  } else {
    wb = XLSX.utils.book_new()
  }

  for (const [name, build] of EDITED_SHEETS) {
    wb.Sheets[name] = build(data)
    if (!wb.SheetNames.includes(name)) wb.SheetNames.push(name)
  }

  // 열 때 전체 재계산 강제 (월별요약 등 수식 시트가 최신 값으로 갱신되도록)
  const wbAny = wb as unknown as { Workbook?: { CalcPr?: Record<string, unknown> } }
  wbAny.Workbook = { ...wbAny.Workbook, CalcPr: { ...wbAny.Workbook?.CalcPr, fullCalcOnLoad: true } }

  return { wb, preserved }
}

export function downloadWorkbook(data: DashboardData): void {
  const { wb, preserved } = buildWorkbook(data)
  if (!preserved) {
    alert(
      '원본 파일 사본이 없어 매출관리 · 매입관리 · 프로젝트 · 자금관리 시트만 내보냅니다.\n' +
      '인사 · 거래처 · 기준정보 등 다른 시트는 원본 엑셀 파일에서 그대로 유지하세요.',
    )
  }
  XLSX.writeFile(wb, `sj-management_${todayISO()}.xlsx`, { compression: true })
}
