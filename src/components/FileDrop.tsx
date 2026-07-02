import { useRef, useState } from 'react'
import type { DashboardData } from '../types'
import { parseWorkbook } from '../lib/parse'

interface Props {
  onLoaded: (data: DashboardData, raw: ArrayBuffer) => void
}

export function FileDrop({ onLoaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File) {
    setError(null)
    setBusy(true)
    try {
      if (!/\.(xlsx|xlsm|xls)$/i.test(file.name)) {
        throw new Error('엑셀 파일(.xlsx)만 불러올 수 있습니다.')
      }
      const buf = await file.arrayBuffer()
      onLoaded(parseWorkbook(buf, file.name), buf)
    } catch (e) {
      setError(e instanceof Error ? e.message : '파일을 읽는 중 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="landing">
      <div className="landing__brand">
        <div className="landing__logo">신</div>
        <h1>신정개발 경영지원 대시보드</h1>
        <p className="landing__desc">무인로봇 · 하수도 준설 · 화학설비 크리닝</p>
      </div>

      <div
        className={`dropzone ${dragging ? 'dropzone--active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const f = e.dataTransfer.files[0]
          if (f) void handleFile(f)
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xlsm,.xls"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
            e.target.value = ''
          }}
        />
        <div className="dropzone__icon">📂</div>
        <div className="dropzone__title">
          {busy ? '파일을 읽는 중…' : '경영지원 엑셀 파일을 여기에 끌어다 놓거나 클릭해서 선택'}
        </div>
        <div className="dropzone__hint">sj-management.xlsx (매출관리 · 매입관리 시트 필수)</div>
      </div>

      {error && <div className="landing__error">⚠️ {error}</div>}

      <div className="security-note">
        <strong>🔒 데이터는 이 컴퓨터를 떠나지 않습니다.</strong>
        <ul>
          <li>엑셀 파일은 서버로 전송되지 않고, 브라우저 안에서만 읽고 계산합니다.</li>
          <li>화면 데이터와 [엑셀 다운로드]용 원본 사본은 이 브라우저의 저장소에만 보관되며, [데이터 지우기]로 언제든 삭제할 수 있습니다.</li>
          <li>급여·연락처 등 민감정보는 화면에 표시하지 않습니다.</li>
          <li>웹에서 수정한 내용은 [엑셀 다운로드]로 새 엑셀 파일로 저장할 수 있습니다.</li>
          <li>공용 PC에서는 사용 후 반드시 [데이터 지우기]를 눌러 주세요.</li>
        </ul>
      </div>
    </div>
  )
}
