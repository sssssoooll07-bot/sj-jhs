interface Props {
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** 브라우저 confirm() 대신 사용하는 앱 내 확인창 (임베디드 환경에서도 동작) */
export function ConfirmBox({ message, confirmLabel = '확인', danger, onConfirm, onCancel }: Props) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal--confirm" onClick={(e) => e.stopPropagation()}>
        <div className="confirm__message">{message}</div>
        <div className="modal__foot">
          <button className="btn-solid btn-solid--gray" onClick={onCancel}>취소</button>
          <button
            className={`btn-solid ${danger ? 'btn-solid--danger' : ''}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
