import { Spinner, Wrapper } from './styles'

/**
 * Fallback de `Suspense` para troca de rota.
 *
 * Ocupa só a área de conteúdo. O `PageLoader` antigo tinha `height: 100vh` e
 * ficava por fora do layout, então cada navegação apagava sidebar e topbar e
 * piscava a tela inteira — parte grande da lentidão percebida na #197 era
 * isso, e não tempo de rede.
 */
export default function ContentLoader() {
  return (
    <Wrapper role="status" aria-live="polite" aria-label="Carregando página">
      <Spinner />
    </Wrapper>
  )
}
