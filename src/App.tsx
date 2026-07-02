import { useEffect, useRef, useState } from 'react'
import type { DashboardData } from './types'
import { parseWorkbook } from './lib/parse'
import { rederive } from './lib/aggregate'
import { buildWorkbook, downloadWorkbook } from './lib/export'
import { clearData, loadData, saveData, saveRaw } from './lib/storage'
import { FileDrop } from './components/FileDrop'
import { DashboardView } from './views/DashboardView'
import { SalesView } from './views/SalesView'
import { PurchasesView } from './views/PurchasesView'
import { ProjectsView } from './views/ProjectsView'
import { CashView } from './views/CashView'

const TABS = ['대시보드', '매출', '매입', '프로젝트', '자금'] as const
type Tab = (typeof TABS)[number]

export type Updater = (fn: (d: DashboardData) => DashboardData) => void

export default function App() {
  const [data, setData] = useState<DashboardData | null>(() => loadData())
  const [tab, setTab] = useState<Tab>('대시보드')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleLoaded(d: DashboardData, raw: ArrayBuffer) {
    saveRaw(raw)
    const next = { ...d, modifiedAt: null }
    setData(next)
    saveData(next)
    setTab('대시보드')
  }

  /** 편집 반영: 파생값(잔액·프로젝트 집계 등) 재계산 후 저장 */
  const update: Updater = (fn) => {
    setData((prev) => {
      if (!prev) return prev
      const next = rederive(fn(prev))
      saveData(next)
      return next
    })
  }

  useEffect(() => {
    // 개발 환경 전용: E2E 검증용 훅 (프로덕션 번들에서는 제거됨)
    if (import.meta.env.DEV) {
      const w = window as unknown as Record<string, unknown>
      w.__loadWorkbook = (buf: ArrayBuffer, name: string) =>
        handleLoaded(parseWorkbook(buf, name), buf)
      w.__exportInfo = () => {
        const d = loadData()
        if (!d) return null
        const { wb, preserved } = buildWorkbook(d)
        return {
          preserved,
          sheets: wb.SheetNames,
          salesRef: wb.Sheets['매출관리']?.['!ref'],
          cashRef: wb.Sheets['자금관리']?.['!ref'],
        }
      }
    }
  }, [])

  if (!data) return <FileDrop onLoaded={handleLoaded} />

  return (
    <div className="app">
      <header className="header">
        <div className="header__brand">
          <span className="header__logo">신</span>
          <div>
            <div className="header__title">신정개발 경영지원 대시보드</div>
            <div className="header__file" title={data.fileName}>
              📄 {data.fileName} · {new Date(data.loadedAt).toLocaleString('ko-KR')} 불러옴
              {data.modifiedAt && <span className="header__dirty"> · ✏️ 수정됨</span>}
            </div>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`tab ${tab === t ? 'tab--active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
        <div className="header__actions">
          <input
            ref={inputRef} type="file" accept=".xlsx,.xlsm,.xls" hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (f) {
                try {
                  const buf = await f.arrayBuffer()
                  handleLoaded(parseWorkbook(buf, f.name), buf)
                } catch (err) {
                  alert(err instanceof Error ? err.message : '파일을 읽을 수 없습니다.')
                }
              }
              e.target.value = ''
            }}
          />
          <button
            className="btn btn--primary"
            title="수정 내용을 반영한 엑셀 파일을 이 컴퓨터에 저장합니다"
            onClick={() => downloadWorkbook(data)}
          >
            ⬇ 엑셀 다운로드
          </button>
          <button className="btn" onClick={() => inputRef.current?.click()}>
            새 파일 불러오기
          </button>
          <button
            className="btn btn--danger"
            onClick={() => {
              const warn = data.modifiedAt
                ? '⚠️ 저장하지 않은 수정 내용이 있습니다. 먼저 [엑셀 다운로드]로 보관하는 것을 권장합니다.\n\n'
                : ''
              if (confirm(`${warn}브라우저에 저장된 데이터를 모두 지울까요?\n(엑셀 원본 파일에는 영향이 없습니다)`)) {
                clearData()
                setData(null)
              }
            }}
          >
            데이터 지우기
          </button>
        </div>
      </header>

      <main className="main">
        {tab === '대시보드' && <DashboardView data={data} />}
        {tab === '매출' && <SalesView data={data} update={update} />}
        {tab === '매입' && <PurchasesView data={data} update={update} />}
        {tab === '프로젝트' && <ProjectsView data={data} update={update} />}
        {tab === '자금' && <CashView data={data} update={update} />}
      </main>

      <footer className="footer">
        🔒 모든 데이터는 이 브라우저 안에서만 처리됩니다 · 서버 전송 없음 · (주)신정개발 경영지원
      </footer>
    </div>
  )
}
