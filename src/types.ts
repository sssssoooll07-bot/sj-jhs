export interface SaleRow {
  date: string | null
  division: string
  site: string
  client: string
  project: string
  desc: string
  supply: number
  vat: number
  total: number
  taxInvoice: string
  dueDate: string | null
  paidDate: string | null
  status: string
  received: number
  owner: string
  note: string
}

export interface PurchaseRow {
  date: string | null
  category: string
  site: string
  client: string
  project: string
  desc: string
  supply: number
  vat: number
  total: number
  taxInvoice: string
  dueDate: string | null
  paidDate: string | null
  status: string
  owner: string
  note: string
}

export interface ProjectRow {
  code: string
  name: string
  division: string
  client: string
  site: string
  contract: number
  contractDate: string | null
  startDate: string | null
  endDate: string | null
  status: string
  progress: number
  pm: string
  note: string
  billed: number
  received: number
}

export interface EmployeeRow {
  id: string
  name: string
  dept: string
  title: string
  joined: string | null
  type: string
  site: string
  status: string
}

export interface CashRow {
  date: string | null
  kind: string
  category: string
  desc: string
  inflow: number
  outflow: number
  balance: number
  account: string
  note: string
}

export interface ClientRow {
  code: string
  name: string
  kind: string
}

export interface DashboardData {
  fileName: string
  loadedAt: string
  modifiedAt?: string | null
  sales: SaleRow[]
  purchases: PurchaseRow[]
  projects: ProjectRow[]
  employees: EmployeeRow[]
  cash: CashRow[]
  clients: ClientRow[]
}
