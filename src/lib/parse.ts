import * as XLSX from 'xlsx'
import type {
  CashRow, ClientRow, DashboardData, EmployeeRow, ProjectRow, PurchaseRow, SaleRow,
} from '../types'

type Raw = Record<string, unknown>

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`

/** 셀 값을 yyyy-mm-dd 문자열로 정규화 (엑셀 날짜 일련번호/Date/문자열 모두 지원) */
function toISO(v: unknown): string | null {
  if (v == null || v === '') return null
  if (v instanceof Date && !isNaN(v.getTime())) return ymd(v.getFullYear(), v.getMonth() + 1, v.getDate())
  if (typeof v === 'number' && isFinite(v) && v > 0) {
    const d = XLSX.SSF.parse_date_code(v)
    return d ? ymd(d.y, d.m, d.d) : null
  }
  const m = String(v).trim().match(/^(\d{4})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})/)
  return m ? ymd(+m[1], +m[2], +m[3]) : null
}

function toNum(v: unknown): number {
  if (typeof v === 'number' && isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v.replace(/[,\s원₩]/g, ''))
    return isFinite(n) ? n : 0
  }
  return 0
}

const toStr = (v: unknown): string => (v == null ? '' : String(v).trim())

/** 진행률: 0.5 / 50 / "50%" 모두 0~1로 정규화 */
function toRatio(v: unknown): number {
  if (v == null || v === '') return 0
  let n: number
  if (typeof v === 'number') n = v
  else n = Number(String(v).replace(/[%\s]/g, '')) || 0
  if (n > 1) n = n / 100
  return Math.max(0, Math.min(1, n))
}

/** 헤더 이름으로 값 찾기: 정확히 일치 우선, 없으면 접두어 일치 ("공급가액" → "공급가액(원)") */
function pick(row: Raw, ...names: string[]): unknown {
  const keys = Object.keys(row)
  for (const name of names) {
    const exact = keys.find((k) => k.replace(/\s/g, '') === name)
    if (exact !== undefined) return row[exact]
  }
  for (const name of names) {
    const prefixed = keys.find((k) => k.replace(/\s/g, '').startsWith(name))
    if (prefixed !== undefined) return row[prefixed]
  }
  return null
}

function rows(wb: XLSX.WorkBook, sheetName: string): Raw[] {
  const ws = wb.Sheets[sheetName]
  if (!ws) return []
  return XLSX.utils.sheet_to_json<Raw>(ws, { defval: null })
}

const byDate = <T extends { date: string | null }>(a: T, b: T) =>
  (a.date ?? '').localeCompare(b.date ?? '')

export function parseWorkbook(buf: ArrayBuffer, fileName: string): DashboardData {
  const wb = XLSX.read(buf, { type: 'array' })

  const required = ['매출관리', '매입관리']
  const missing = required.filter((s) => !wb.SheetNames.includes(s))
  if (missing.length > 0) {
    throw new Error(
      `필수 시트가 없습니다: [${missing.join(', ')}]. ` +
      `엑셀 파일에 매출관리 / 매입관리 시트가 있는지 확인해 주세요.`,
    )
  }

  const sales: SaleRow[] = rows(wb, '매출관리')
    .map((r) => {
      const supply = toNum(pick(r, '공급가액'))
      const vatRaw = pick(r, '부가세')
      const vat = vatRaw == null ? Math.round(supply * 0.1) : toNum(vatRaw)
      const totalRaw = pick(r, '합계금액', '합계')
      return {
        date: toISO(pick(r, '일자', '날짜')),
        division: toStr(pick(r, '사업부문')),
        site: toStr(pick(r, '사업장')),
        client: toStr(pick(r, '거래처명', '거래처')),
        project: toStr(pick(r, '프로젝트코드', '프로젝트')),
        desc: toStr(pick(r, '작업내용', '내용')),
        supply,
        vat,
        total: totalRaw == null ? supply + vat : toNum(totalRaw),
        taxInvoice: toStr(pick(r, '세금계산서')),
        dueDate: toISO(pick(r, '수금예정일')),
        paidDate: toISO(pick(r, '수금일')),
        status: toStr(pick(r, '수금상태')),
        received: toNum(pick(r, '수금액')),
        owner: toStr(pick(r, '담당자')),
        note: toStr(pick(r, '비고')),
      }
    })
    .filter((r) => r.date !== null || r.client !== '')
    .sort(byDate)

  const purchases: PurchaseRow[] = rows(wb, '매입관리')
    .map((r) => {
      const supply = toNum(pick(r, '공급가액'))
      const vatRaw = pick(r, '부가세')
      const vat = vatRaw == null ? Math.round(supply * 0.1) : toNum(vatRaw)
      const totalRaw = pick(r, '합계금액', '합계')
      return {
        date: toISO(pick(r, '일자', '날짜')),
        category: toStr(pick(r, '비용구분', '구분')),
        site: toStr(pick(r, '사업장')),
        client: toStr(pick(r, '거래처명', '거래처')),
        project: toStr(pick(r, '프로젝트코드', '프로젝트')),
        desc: toStr(pick(r, '품목', '내용')),
        supply,
        vat,
        total: totalRaw == null ? supply + vat : toNum(totalRaw),
        taxInvoice: toStr(pick(r, '세금계산서')),
        dueDate: toISO(pick(r, '지급예정일')),
        paidDate: toISO(pick(r, '지급일')),
        status: toStr(pick(r, '지급상태')),
        owner: toStr(pick(r, '담당자')),
        note: toStr(pick(r, '비고')),
      }
    })
    .filter((r) => r.date !== null || r.client !== '')
    .sort(byDate)

  // 프로젝트별 기성청구/수금은 파일의 수식 값 대신 매출 데이터에서 직접 집계
  const billedBy = new Map<string, number>()
  const receivedBy = new Map<string, number>()
  for (const s of sales) {
    if (!s.project) continue
    billedBy.set(s.project, (billedBy.get(s.project) ?? 0) + s.supply)
    receivedBy.set(s.project, (receivedBy.get(s.project) ?? 0) + s.received)
  }

  const projects: ProjectRow[] = rows(wb, '프로젝트')
    .map((r) => {
      const code = toStr(pick(r, '프로젝트코드'))
      return {
        code,
        name: toStr(pick(r, '프로젝트명')),
        division: toStr(pick(r, '사업부문')),
        client: toStr(pick(r, '발주처', '거래처명')),
        site: toStr(pick(r, '사업장')),
        contract: toNum(pick(r, '계약금액')),
        contractDate: toISO(pick(r, '계약일')),
        startDate: toISO(pick(r, '착수일')),
        endDate: toISO(pick(r, '완료예정일')),
        status: toStr(pick(r, '진행상태', '상태')),
        progress: toRatio(pick(r, '진행률')),
        pm: toStr(pick(r, '담당PM', '담당자')),
        note: toStr(pick(r, '비고')),
        billed: billedBy.get(code) ?? 0,
        received: receivedBy.get(code) ?? 0,
      }
    })
    .filter((r) => r.code !== '')

  // 인사: 인원 현황 파악에 필요한 최소 정보만 읽는다 (급여·연락처 등 민감정보는 읽지 않음)
  const employees: EmployeeRow[] = rows(wb, '인사')
    .map((r) => ({
      id: toStr(pick(r, '사번')),
      name: toStr(pick(r, '성명', '이름')),
      dept: toStr(pick(r, '부서')),
      title: toStr(pick(r, '직급')),
      joined: toISO(pick(r, '입사일')),
      type: toStr(pick(r, '고용형태')),
      site: toStr(pick(r, '근무지', '사업장')),
      status: toStr(pick(r, '재직상태')),
    }))
    .filter((r) => r.name !== '')

  // 자금: 잔액은 파일의 수식 값 대신 입출금 누계로 재계산
  let balance = 0
  const cash: CashRow[] = rows(wb, '자금관리')
    .map((r) => ({
      date: toISO(pick(r, '일자', '날짜')),
      kind: toStr(pick(r, '구분')),
      category: toStr(pick(r, '계정과목')),
      desc: toStr(pick(r, '거래처', '내역', '적요')),
      inflow: toNum(pick(r, '입금액', '입금')),
      outflow: toNum(pick(r, '출금액', '출금')),
      balance: 0,
      account: toStr(pick(r, '계좌')),
      note: toStr(pick(r, '비고')),
    }))
    .filter((r) => r.date !== null)
    .map((r) => {
      balance += r.inflow - r.outflow
      return { ...r, balance }
    })

  const clients: ClientRow[] = rows(wb, '거래처')
    .map((r) => ({
      code: toStr(pick(r, '거래처코드')),
      name: toStr(pick(r, '거래처명')),
      kind: toStr(pick(r, '구분')),
    }))
    .filter((r) => r.name !== '')

  return {
    fileName,
    loadedAt: new Date().toISOString(),
    sales, purchases, projects, employees, cash, clients,
  }
}
