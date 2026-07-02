import { useEffect, useRef, useState } from 'react'
import type { DashboardData } from './types'
import { parseWorkbook } from './lib/parse'
import { clearData, loadData, saveData } from './lib/storage'
import { FileDrop } from './components/FileDrop'
import { DashboardView } from './views/DashboardView'
import { SalesView } from './views/SalesView'
import { PurchasesView } from './views/PurchasesView'
import { ProjectsView } from './views/ProjectsView'
import { CashView } from './views/CashView'

const TABS = ['대시보드', '매출', '매입', '프로젝트', '자금'] as const
type Tab = (typeof TABS)[number]

export default function App() {
  const [data, setData] = useState<DashboardData | null>(() => loadData())
  const [tab, setTab] = useState<Tab>('대시보드')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleLoaded(d: DashboardData) {
    setData(d)
    saveData(d)
    setTab('대시보드')
  }

  useEffect(() => {
    // 개발 환경 전용: E2E 검증용 훅 (프로덕션 번들에서는 제거됨)
    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__loadWorkbook =
        (buf: ArrayBuffer, name: string) => handleLoaded(parseWorkbook(buf, name))
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
                  handleLoaded(parseWorkbook(await f.arrayBuffer(), f.name))
                } catch (err) {
                  alert(err instanceof Error ? err.message : '파일을 읽을 수 없습니다.')
                }
              }
              e.target.value = ''
            }}
          />
          <button className="btn" onClick={() => inputRef.current?.click()}>
            새 파일 불러오기
          </button>
          <button
            className="btn btn--danger"
            onClick={() => {
              if (confirm('브라우저에 저장된 데이터를 모두 지울까요?\n(엑셀 원본 파일에는 영향이 없습니다)')) {
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
        {tab === '매출' && <SalesView data={data} />}
        {tab === '매입' && <PurchasesView data={data} />}
        {tab === '프로젝트' && <ProjectsView data={data} />}
        {tab === '자금' && <CashView data={data} />}
      </main>

      <footer className="footer">
        🔒 모든 데이터는 이 브라우저 안에서만 처리됩니다 · 서버 전송 없음 · (주)신정개발 경영지원
      </footer>
    </div>
  )
}
