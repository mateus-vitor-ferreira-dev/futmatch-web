import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SportIcon from '.'
import { sportTextLabel } from '../../utils/sportText'

describe('SportIcon', () => {
  it.each(['futevolei', 'volei-areia', 'peteca'])('renderiza %s como vetor próprio', (icon) => {
    const { container } = render(<SportIcon icon={icon} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('mantém emoji somente como fallback de superfície textual', () => {
    render(<SportIcon icon="tenis" fallback="🥎" title="Tênis" />)
    expect(screen.getByLabelText('Tênis')).toHaveTextContent('🥎')
    expect(sportTextLabel({ label: 'Peteca', iconFallback: null })).toBe('Peteca')
  })
})
