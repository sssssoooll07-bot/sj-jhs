const TONE: Record<string, string> = {
  수금완료: 'good',
  지급완료: 'good',
  완료: 'good',
  부분수금: 'warn',
  진행중: 'info',
  수주: 'purple',
  미수금: 'bad',
  미지급: 'bad',
  보류: 'muted',
  입금: 'good',
  출금: 'bad',
}

export function StatusBadge({ value }: { value: string }) {
  if (!value) return <span>-</span>
  return <span className={`badge badge--${TONE[value] ?? 'muted'}`}>{value}</span>
}
