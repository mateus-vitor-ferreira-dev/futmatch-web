import type { CSSProperties } from 'react'
import { Card, Accent, Label, Value } from './styles'

export interface StatCardProps {
  label: string
  value: string | number
  /** Cor da faixa de destaque, aplicada inline. */
  accent: CSSProperties['background']
}

export default function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <Card>
      <Accent style={{ background: accent }} />
      <Label>{label}</Label>
      <Value>{value}</Value>
    </Card>
  )
}
