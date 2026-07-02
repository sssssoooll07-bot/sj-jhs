import type { CashRow, ProjectRow, PurchaseRow, SaleRow } from '../types'
import { todayISO } from './format'

export type Form = Record<string, string>

export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  options?: string[]
  required?: boolean
  hint?: string
}

/** 기준정보 시트의 표준 목록 (datalist 제안용 — 직접 입력도 가능) */
export const LISTS = {
  division: ['무인로봇', '하수도준설', '화학설비크리닝', '기타'],
  site: ['여수본사', '서산지사'],
  saleStatus: ['수금완료', '부분수금', '미수금'],
  taxSale: ['발행', '미발행'],
  taxPurchase: ['수취', '미수취'],
  purchaseCategory: ['자재비', '외주비', '장비임차료', '유류비', '소모품비', '수선비',
    '복리후생비', '보험료', '지급수수료', '세금과공과', '임차료', '기타경비'],
  payStatus: ['지급완료', '미지급'],
  projectStatus: ['수주', '진행중', '완료', '보류'],
  cashKind: ['입금', '출금'],
  cashCategory: ['기초잔액', '매출대금', '매입대금', '급여', '4대보험', '부가세',
    '법인세', '보험료', '임차료', '공과금', '기타'],
}

const fnum = (s: string): number => {
  const n = Number(String(s).replace(/[,\s원]/g, ''))
  return isFinite(n) ? n : 0
}
const orNull = (s: string): string | null => (s.trim() === '' ? null : s.trim())

/* ---------------- 매출 ---------------- */

export const saleFields: FieldDef[] = [
  { key: 'date', label: '일자', type: 'date', required: true },
  { key: 'division', label: '사업부문', type: 'select', options: LISTS.division },
  { key: 'site', label: '사업장', type: 'select', options: LISTS.site },
  { key: 'client', label: '거래처명', type: 'text', required: true },
  { key: 'project', label: '프로젝트코드', type: 'text', hint: '예: P2026-001 (경비성이면 비움)' },
  { key: 'desc', label: '작업내용', type: 'text' },
  { key: 'supply', label: '공급가액(원)', type: 'number', required: true },
  { key: 'vat', label: '부가세(원)', type: 'number', hint: '비우면 공급가액의 10% 자동 계산' },
  { key: 'taxInvoice', label: '세금계산서', type: 'select', options: LISTS.taxSale },
  { key: 'dueDate', label: '수금예정일', type: 'date' },
  { key: 'paidDate', label: '수금일', type: 'date' },
  { key: 'status', label: '수금상태', type: 'select', options: LISTS.saleStatus },
  { key: 'received', label: '수금액(원)', type: 'number' },
  { key: 'owner', label: '담당자', type: 'text' },
  { key: 'note', label: '비고', type: 'text' },
]

export function saleToForm(s: SaleRow | null): Form {
  if (!s) {
    return {
      date: todayISO(), division: '', site: '', client: '', project: '', desc: '',
      supply: '', vat: '', taxInvoice: '미발행', dueDate: '', paidDate: '',
      status: '미수금', received: '0', owner: '', note: '',
    }
  }
  return {
    date: s.date ?? '', division: s.division, site: s.site, client: s.client,
    project: s.project, desc: s.desc, supply: String(s.supply), vat: String(s.vat),
    taxInvoice: s.taxInvoice, dueDate: s.dueDate ?? '', paidDate: s.paidDate ?? '',
    status: s.status, received: String(s.received), owner: s.owner, note: s.note,
  }
}

export function formToSale(f: Form): SaleRow {
  const supply = fnum(f.supply)
  const vat = f.vat.trim() === '' ? Math.round(supply * 0.1) : fnum(f.vat)
  return {
    date: orNull(f.date), division: f.division.trim(), site: f.site.trim(),
    client: f.client.trim(), project: f.project.trim(), desc: f.desc.trim(),
    supply, vat, total: supply + vat, taxInvoice: f.taxInvoice.trim(),
    dueDate: orNull(f.dueDate), paidDate: orNull(f.paidDate), status: f.status.trim(),
    received: fnum(f.received), owner: f.owner.trim(), note: f.note.trim(),
  }
}

/* ---------------- 매입 ---------------- */

export const purchaseFields: FieldDef[] = [
  { key: 'date', label: '일자', type: 'date', required: true },
  { key: 'category', label: '비용구분', type: 'select', options: LISTS.purchaseCategory },
  { key: 'site', label: '사업장', type: 'select', options: LISTS.site },
  { key: 'client', label: '거래처명', type: 'text', required: true },
  { key: 'project', label: '프로젝트코드', type: 'text', hint: '경비성 매입이면 비움' },
  { key: 'desc', label: '품목/내용', type: 'text' },
  { key: 'supply', label: '공급가액(원)', type: 'number', required: true },
  { key: 'vat', label: '부가세(원)', type: 'number', hint: '비우면 10% 자동 계산 · 면세는 0 입력' },
  { key: 'taxInvoice', label: '세금계산서', type: 'select', options: LISTS.taxPurchase },
  { key: 'dueDate', label: '지급예정일', type: 'date' },
  { key: 'paidDate', label: '지급일', type: 'date' },
  { key: 'status', label: '지급상태', type: 'select', options: LISTS.payStatus },
  { key: 'owner', label: '담당자', type: 'text' },
  { key: 'note', label: '비고', type: 'text' },
]

export function purchaseToForm(p: PurchaseRow | null): Form {
  if (!p) {
    return {
      date: todayISO(), category: '', site: '', client: '', project: '', desc: '',
      supply: '', vat: '', taxInvoice: '수취', dueDate: '', paidDate: '',
      status: '미지급', owner: '', note: '',
    }
  }
  return {
    date: p.date ?? '', category: p.category, site: p.site, client: p.client,
    project: p.project, desc: p.desc, supply: String(p.supply), vat: String(p.vat),
    taxInvoice: p.taxInvoice, dueDate: p.dueDate ?? '', paidDate: p.paidDate ?? '',
    status: p.status, owner: p.owner, note: p.note,
  }
}

export function formToPurchase(f: Form): PurchaseRow {
  const supply = fnum(f.supply)
  const vat = f.vat.trim() === '' ? Math.round(supply * 0.1) : fnum(f.vat)
  return {
    date: orNull(f.date), category: f.category.trim(), site: f.site.trim(),
    client: f.client.trim(), project: f.project.trim(), desc: f.desc.trim(),
    supply, vat, total: supply + vat, taxInvoice: f.taxInvoice.trim(),
    dueDate: orNull(f.dueDate), paidDate: orNull(f.paidDate), status: f.status.trim(),
    owner: f.owner.trim(), note: f.note.trim(),
  }
}

/* ---------------- 프로젝트 ---------------- */

export const projectFields: FieldDef[] = [
  { key: 'code', label: '프로젝트코드', type: 'text', required: true, hint: '예: P2026-011' },
  { key: 'name', label: '프로젝트명', type: 'text', required: true },
  { key: 'division', label: '사업부문', type: 'select', options: LISTS.division },
  { key: 'client', label: '발주처', type: 'text' },
  { key: 'site', label: '사업장', type: 'select', options: LISTS.site },
  { key: 'contract', label: '계약금액(공급가액,원)', type: 'number', required: true },
  { key: 'contractDate', label: '계약일', type: 'date' },
  { key: 'startDate', label: '착수일', type: 'date' },
  { key: 'endDate', label: '완료예정일', type: 'date' },
  { key: 'status', label: '진행상태', type: 'select', options: LISTS.projectStatus },
  { key: 'progress', label: '진행률(%)', type: 'number', hint: '0~100' },
  { key: 'pm', label: '담당PM', type: 'text' },
  { key: 'note', label: '비고', type: 'text' },
]

export function projectToForm(p: ProjectRow | null): Form {
  if (!p) {
    return {
      code: '', name: '', division: '', client: '', site: '', contract: '',
      contractDate: '', startDate: '', endDate: '', status: '수주', progress: '0',
      pm: '', note: '',
    }
  }
  return {
    code: p.code, name: p.name, division: p.division, client: p.client, site: p.site,
    contract: String(p.contract), contractDate: p.contractDate ?? '',
    startDate: p.startDate ?? '', endDate: p.endDate ?? '', status: p.status,
    progress: String(Math.round(p.progress * 100)), pm: p.pm, note: p.note,
  }
}

export function formToProject(f: Form, existing: ProjectRow | null): ProjectRow {
  return {
    code: f.code.trim(), name: f.name.trim(), division: f.division.trim(),
    client: f.client.trim(), site: f.site.trim(), contract: fnum(f.contract),
    contractDate: orNull(f.contractDate), startDate: orNull(f.startDate),
    endDate: orNull(f.endDate), status: f.status.trim(),
    progress: Math.max(0, Math.min(1, fnum(f.progress) / 100)),
    pm: f.pm.trim(), note: f.note.trim(),
    billed: existing?.billed ?? 0, received: existing?.received ?? 0,
  }
}

/* ---------------- 자금 ---------------- */

export const cashFields: FieldDef[] = [
  { key: 'date', label: '일자', type: 'date', required: true },
  { key: 'kind', label: '구분', type: 'select', options: LISTS.cashKind, required: true },
  { key: 'category', label: '계정과목', type: 'select', options: LISTS.cashCategory },
  { key: 'desc', label: '거래처/내역', type: 'text' },
  { key: 'inflow', label: '입금액(원)', type: 'number' },
  { key: 'outflow', label: '출금액(원)', type: 'number' },
  { key: 'account', label: '계좌', type: 'text' },
  { key: 'note', label: '비고', type: 'text' },
]

export function cashToForm(c: CashRow | null): Form {
  if (!c) {
    return {
      date: todayISO(), kind: '입금', category: '', desc: '',
      inflow: '', outflow: '', account: '', note: '',
    }
  }
  return {
    date: c.date ?? '', kind: c.kind, category: c.category, desc: c.desc,
    inflow: String(c.inflow), outflow: String(c.outflow), account: c.account, note: c.note,
  }
}

export function formToCash(f: Form): CashRow {
  return {
    date: orNull(f.date), kind: f.kind.trim(), category: f.category.trim(),
    desc: f.desc.trim(), inflow: fnum(f.inflow), outflow: fnum(f.outflow),
    balance: 0, account: f.account.trim(), note: f.note.trim(),
  }
}
