import { Card, Accent, Label, Value } from './styles'

/**
 * @param {{ label: string, value: string|number, accent: string }} props
 */
export default function StatCard({ label, value, accent }) {
  return (
    <Card>
      <Accent style={{ background: accent }} />
      <Label>{label}</Label>
      <Value>{value}</Value>
    </Card>
  )
}
