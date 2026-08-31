export function sportTextLabel(sport: { label: string; iconFallback?: string | null }) {
  return sport.iconFallback ? `${sport.iconFallback} ${sport.label}` : sport.label
}
