import { useState } from 'react'
import type { FieldDef, Form } from '../lib/editing'

interface Props {
  title: string
  fields: FieldDef[]
  initial: Form
  onSave: (values: Form) => void
  onCancel: () => void
}

export function EditDialog({ title, fields, initial, onSave, onCancel }: Props) {
  const [values, setValues] = useState<Form>(initial)
  const [error, setError] = useState<string | null>(null)

  function submit() {
    for (const f of fields) {
      if (f.required && (values[f.key] ?? '').trim() === '') {
        setError(`[${f.label}] 항목을 입력해 주세요.`)
        return
      }
    }
    onSave(values)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h3>{title}</h3>
          <button className="modal__close" onClick={onCancel} aria-label="닫기">✕</button>
        </div>
        <div className="modal__body">
          {fields.map((f) => (
            <label key={f.key} className="field">
              <span className="field__label">
                {f.label}{f.required && <em className="field__req">*</em>}
              </span>
              <input
                type={f.type === 'number' ? 'text' : f.type === 'date' ? 'date' : 'text'}
                inputMode={f.type === 'number' ? 'numeric' : undefined}
                list={f.options ? `dl-${f.key}` : undefined}
                value={values[f.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
              {f.options && (
                <datalist id={`dl-${f.key}`}>
                  {f.options.map((o) => <option key={o} value={o} />)}
                </datalist>
              )}
              {f.hint && <span className="field__hint">{f.hint}</span>}
            </label>
          ))}
        </div>
        {error && <div className="modal__error">⚠️ {error}</div>}
        <div className="modal__foot">
          <button className="btn-solid btn-solid--gray" onClick={onCancel}>취소</button>
          <button className="btn-solid" onClick={submit}>저장</button>
        </div>
      </div>
    </div>
  )
}
