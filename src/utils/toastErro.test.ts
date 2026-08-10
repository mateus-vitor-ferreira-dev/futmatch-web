/**
 * Desde a #119 a API recusa ações de dono sem assinatura paga, com `402` e
 * código `SUBSCRIPTION_REQUIRED`. Antes disso, as telas do dono mostravam
 * `toast.error('Erro ao salvar quadra.')` para qualquer falha — a mesma frase
 * para um campo inválido e para uma assinatura vencida.
 *
 * O que estes testes garantem é que os dois casos deixaram de ser a mesma
 * coisa: o de assinatura ganha um caminho para pagar, o resto segue igual.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError } from 'axios'
import { erroDaApi } from '../test/factories'
import { toastErroDeApi } from './toastErro'
import { ehErroDeAssinatura, ehErroDeLimiteDePlano, ehErroDeStripeIndisponivel } from './apiError'

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))
import { toast } from 'sonner'

const toastDeErro = vi.mocked(toast.error)

/** Monta um erro com o código que a API manda no corpo. */
function erroComCodigo(codigo: string, status: number, mensagem = 'Recusado') {
  const err = erroDaApi(mensagem, status)
  ;(err.response!.data as { code?: string }).code = codigo
  return err
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ehErroDeAssinatura', () => {
  it('reconhece pelo código, que é o que a API promete', () => {
    expect(ehErroDeAssinatura(erroComCodigo('SUBSCRIPTION_REQUIRED', 402))).toBe(true)
  })

  it('reconhece pelo status 402 mesmo sem código', () => {
    expect(ehErroDeAssinatura(erroDaApi('Pagamento necessário', 402))).toBe(true)
  })

  it.each([
    ['401 — não autenticado', 401],
    ['403 — não é seu', 403],
    ['422 — corpo inválido', 422],
    ['500 — erro do servidor', 500],
  ])('não confunde com %s', (_caso, status) => {
    // É o ponto da issue: o front precisa saber que a resposta é "assine", e
    // não "faça login" nem "não é seu".
    expect(ehErroDeAssinatura(erroDaApi('x', status))).toBe(false)
  })

  it('não confunde com erro sem resposta — rede fora do ar', () => {
    expect(ehErroDeAssinatura(new AxiosError('Network Error'))).toBe(false)
  })

  it('não confunde com o que nem é erro do axios', () => {
    expect(ehErroDeAssinatura(new Error('quebrou'))).toBe(false)
    expect(ehErroDeAssinatura('string solta')).toBe(false)
  })
})

describe('ehErroDeLimiteDePlano', () => {
  it('reconhece apenas o código específico devolvido pela API', () => {
    expect(ehErroDeLimiteDePlano(erroComCodigo('PLAN_LIMIT_REACHED', 403))).toBe(true)
    expect(ehErroDeLimiteDePlano(erroComCodigo('FORBIDDEN', 403))).toBe(false)
  })
})

describe('ehErroDeStripeIndisponivel', () => {
  it('reconhece o código da Stripe indisponível com status 503', () => {
    expect(ehErroDeStripeIndisponivel(erroComCodigo('STRIPE_NOT_CONFIGURED', 503))).toBe(true)
  })

  it('não confunde com outro erro 503', () => {
    expect(ehErroDeStripeIndisponivel(erroComCodigo('SERVICE_UNAVAILABLE', 503))).toBe(false)
    expect(ehErroDeStripeIndisponivel(erroDaApi('Serviço indisponível', 503))).toBe(false)
  })

  it('não reconhece o código fora do status contratado', () => {
    expect(ehErroDeStripeIndisponivel(erroComCodigo('STRIPE_NOT_CONFIGURED', 500))).toBe(false)
  })

  it('não confunde com erro de rede', () => {
    expect(ehErroDeStripeIndisponivel(new AxiosError('Network Error'))).toBe(false)
  })

  it('não confunde com valores que não são erros do axios', () => {
    expect(ehErroDeStripeIndisponivel(new Error('quebrou'))).toBe(false)
    expect(ehErroDeStripeIndisponivel('string solta')).toBe(false)
  })
})

describe('toastErroDeApi', () => {
  it('oferece o caminho da assinatura quando o erro é 402', () => {
    toastErroDeApi(erroComCodigo('SUBSCRIPTION_REQUIRED', 402, 'É preciso ter uma assinatura ativa'))

    expect(toastDeErro).toHaveBeenCalledWith(
      'É preciso ter uma assinatura ativa',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Assinar' }),
      }),
    )
  })

  it('dá mais tempo de leitura no erro de assinatura', () => {
    toastErroDeApi(erroComCodigo('SUBSCRIPTION_REQUIRED', 402))

    // Aqui o usuário precisa ler e decidir, não só registrar que falhou.
    const opcoes = toastDeErro.mock.calls[0][1] as { duration: number }
    expect(opcoes.duration).toBeGreaterThan(4000)
  })

  it('o botão leva à página de assinatura', () => {
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { assign },
    })

    toastErroDeApi(erroComCodigo('SUBSCRIPTION_REQUIRED', 402))
    // Dois passos pelo unknown: o `action` do sonner aceita ReactNode ou Action,
    // e o onClick real recebe o evento do clique. O dublê aqui só precisa da
    // forma que o teste exercita.
    const opcoes = toastDeErro.mock.calls[0][1] as unknown as { action: { onClick: () => void } }
    opcoes.action.onClick()

    expect(assign).toHaveBeenCalledWith('/owner/plans')
  })

  it('explica o limite atingido e oferece a troca de plano', () => {
    toastErroDeApi(erroComCodigo('PLAN_LIMIT_REACHED', 403, 'Limite de 3 quadras atingido'))

    expect(toastDeErro).toHaveBeenCalledWith(
      'Limite de 3 quadras atingido',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Ver planos' }),
      }),
    )
  })

  it('erro comum segue como toast simples, sem botão', () => {
    toastErroDeApi(erroDaApi('Nome já cadastrado', 422), 'Erro ao salvar quadra.')

    expect(toastDeErro).toHaveBeenCalledWith('Nome já cadastrado')
  })

  it('usa o padrão de quem chamou quando o erro não traz mensagem', () => {
    toastErroDeApi(new Error(''), 'Erro ao salvar quadra.')

    expect(toastDeErro).toHaveBeenCalledWith('Erro ao salvar quadra.')
  })
})
