/**
 * Os convites de professor, na tela do dono (web#377, api#451).
 *
 * O teste que carrega o arquivo é o do **pendente vencido**. O banco só guarda
 * os quatro estados do enum; "pendente e o prazo passou" não é um deles — é um
 * `PENDING` que o serviço recusa em tempo de leitura. Uma tela que lesse só o
 * `status` mostraria "aguardando resposta" para sempre num convite que ninguém
 * mais consegue aceitar, e o dono nunca saberia que precisa reenviar. É o mesmo
 * convite que some quando alguém filtra por `PENDING` e esquece o prazo.
 *
 * O segundo é o da **ressalva**. Esta lista é o livro de convites, e não a de
 * professores: a api ainda não lista os `PlaceMember` de um espaço (api#461).
 * A tela poderia chamar os aceitos de "professores" e quase sempre acertaria —
 * e afirmaria o que não sabe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../test/render'
import { professoresService } from '../../../services/professores'
import * as placesService from '../../../services/places'
import { ownerNavItems } from '../../../constants/navItems'
import OwnerProfessores from './index'
import type { AxiosResponse } from 'axios'
import type { ApiEnvelope, ConviteDeProfessor, Place } from '../../../types/api'
import { toast } from 'sonner'

vi.mock('../../../services/professores')
vi.mock('../../../services/places')

// O aviso de cópia é toast, e é a única saída visível quando o navegador nega a
// área de transferência — sem mockar, não há como afirmar que ele apareceu.
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }))

const servico = vi.mocked(professoresService)
const espacos = vi.mocked(placesService)

const DIA = 24 * 60 * 60 * 1000

function convite(over: Partial<ConviteDeProfessor> = {}): ConviteDeProfessor {
  const base = {
    id: 'c1',
    email: 'professor@exemplo.com',
    papel: 'PROFESSOR' as const,
    status: 'PENDING' as ConviteDeProfessor['status'],
    expiresAt: new Date(Date.now() + 5 * DIA).toISOString(),
    respondedAt: null,
    createdAt: new Date(Date.now() - 2 * DIA).toISOString(),
    ...over,
  }

  /**
   * O `inviteUrl` do fixture segue a MESMA regra da api (#509): nulo quando o
   * convite não abre mais nada.
   *
   * Um valor fixo seria mais curto e faria os outros testes deste arquivo
   * concordarem com uma tela que a api nunca produz — link de copiar embaixo de
   * um convite aceito. Quem quiser o caso torto passa `inviteUrl` explícito.
   */
  const abreAPorta = base.status === 'PENDING' && new Date(base.expiresAt) > new Date()

  return {
    ...base,
    inviteUrl: 'inviteUrl' in over
      ? over.inviteUrl ?? null
      : abreAPorta ? `https://app.exemplo/convite-professor?convite=tk-${base.id}` : null,
  }
}

const monta = (query = '?placeId=ltc') =>
  renderWithProviders(<OwnerProfessores />, {
    route: `/owner/professores${query}`,
    path: '/owner/professores',
  })

beforeEach(() => {
  vi.clearAllMocks()
  espacos.list.mockResolvedValue({
    data: {
      success: true,
      data: [
        { id: 'ltc', name: 'Lavras Tênis Clube', ownerId: 'dono' },
        { id: 'aabb', name: 'AABB Lavras', ownerId: 'dono' },
        // A tela usa só id, name e ownerId; o resto do `Place` não muda nada
        // aqui, e escrevê-lo por inteiro esconderia isso.
      ] as Place[],
    },
  } as AxiosResponse<ApiEnvelope<Place[]>>)
  servico.convites.mockResolvedValue([])
  servico.convidar.mockResolvedValue(convite({ email: 'nova@exemplo.com' }))
})

const auth = vi.hoisted(() => ({ estado: { user: { id: 'dono', role: 'OWNER' } } }))
vi.mock('../../../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

describe('OwnerProfessores', () => {
  it('está no menu do owner, e nunca com cadeado', () => {
    // Sem plano nenhum: a api deixou a rota fora do `requireActiveSubscription`,
    // e um cadeado aqui mandaria o dono pagar pelo que ele já pode fazer.
    const semPlano = ownerNavItems('OWNER', () => false)
    const item = semPlano.find((i) => i.to === '/owner/professores')

    expect(item?.label).toBe('Professores')
    expect(item?.bloqueado).toBeFalsy()
  })

  it('escolhe o espaço pelo seletor, e respeita o ?placeId= de quem veio pelo card', async () => {
    monta('?placeId=aabb')

    const seletor = await screen.findByLabelText('Estabelecimento')
    expect(seletor).toHaveValue('aabb')

    await waitFor(() => expect(servico.convites).toHaveBeenCalledWith('aabb'))
  })

  it('sem ?placeId=, cai no primeiro espaço do dono', async () => {
    monta('')

    await waitFor(() => expect(servico.convites).toHaveBeenCalledWith('ltc'))
  })

  it('convida por e-mail e recarrega a lista', async () => {
    const { user } = monta()

    await user.type(await screen.findByLabelText('E-mail do professor'), 'nova@exemplo.com')
    await user.click(screen.getByRole('button', { name: /convidar/i }))

    await waitFor(() => expect(servico.convidar).toHaveBeenCalledWith('ltc', 'nova@exemplo.com'))
    // Duas chamadas: a da montagem e a da invalidação depois do convite.
    await waitFor(() => expect(servico.convites.mock.calls.length).toBeGreaterThan(1))
  })

  it('não manda e-mail inválido para a api', async () => {
    const { user } = monta()

    await user.type(await screen.findByLabelText('E-mail do professor'), 'não-é-email')
    await user.click(screen.getByRole('button', { name: /convidar/i }))

    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument()
    expect(servico.convidar).not.toHaveBeenCalled()
  })

  it('separa o pendente vencido do pendente que ainda vale', async () => {
    servico.convites.mockResolvedValue([
      convite({ id: 'vale', email: 'vale@exemplo.com' }),
      convite({
        id: 'venceu',
        email: 'venceu@exemplo.com',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 2 * DIA).toISOString(),
      }),
    ])

    monta()

    // Os dois são PENDING no banco, e a tela precisa dizer coisas diferentes.
    expect(await screen.findByText('Aguardando resposta')).toBeInTheDocument()
    expect(screen.getByText('Venceu sem resposta')).toBeInTheDocument()
  })

  it('mostra os quatro estados do enum', async () => {
    servico.convites.mockResolvedValue([
      convite({ id: '1', email: 'a@x.com', status: 'ACCEPTED', respondedAt: new Date().toISOString() }),
      convite({ id: '2', email: 'b@x.com', status: 'DECLINED', respondedAt: new Date().toISOString() }),
      convite({ id: '3', email: 'c@x.com', status: 'EXPIRED' }),
      convite({ id: '4', email: 'd@x.com' }),
    ])

    monta()

    expect(await screen.findByText('Aceito')).toBeInTheDocument()
    expect(screen.getByText('Recusado')).toBeInTheDocument()
    expect(screen.getByText('Expirado')).toBeInTheDocument()
    expect(screen.getByText('Aguardando resposta')).toBeInTheDocument()
  })

  it('avisa que esta é a lista de convites, e não a de professores', async () => {
    servico.convites.mockResolvedValue([convite({ status: 'ACCEPTED', respondedAt: new Date().toISOString() })])

    monta()

    // Sem a ressalva, "Aceito" leria como "é professor daqui" — e vínculo criado
    // por outro caminho não aparece nesta lista.
    expect(await screen.findByText(/lista de convites, e não a de professores/i)).toBeInTheDocument()
  })

  it('lista que não carrega avisa, em vez de parecer vazia', async () => {
    servico.convites.mockRejectedValue(new Error('500'))

    monta()

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar os convites.'),
    )
    // "Nenhum convite ainda" seria mentira: pode haver muitos.
    expect(screen.queryByText(/Nenhum convite ainda/)).not.toBeInTheDocument()
  })
})

/**
 * O link do convite na lista (api#509).
 *
 * O `inviteUrl` chegava só na resposta do POST e se perdia na troca de tela.
 * Como o envio do e-mail não bloqueia a criação do convite, *criado* e
 * *entregue* são coisas diferentes — e quando a mensagem não chegava o dono não
 * tinha como recuperar o endereço de um convite que ele mesmo criou.
 */
describe('OwnerProfessores — o link do convite', () => {
  /**
   * `navigator.clipboard` é um **getter** no jsdom, e `Object.assign` estoura
   * nele. Mesmo helper do `CompartilharPartida`, pelo mesmo motivo.
   */
  function fingeClipboard(valor: unknown) {
    Object.defineProperty(navigator, 'clipboard', { value: valor, configurable: true, writable: true })
  }

  beforeEach(() => {
    fingeClipboard({ writeText: vi.fn().mockResolvedValue(undefined) })
  })

  it('mostra o link do convite pendente e copia', async () => {
    servico.convites.mockResolvedValue([convite({ id: 'c9', email: 'nova@exemplo.com' })])

    const { user } = monta()

    const endereco = 'https://app.exemplo/convite-professor?convite=tk-c9'
    expect(await screen.findByText(endereco)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /copiar o link do convite de nova@exemplo.com/i }))

    // Lido de volta da área de transferência, e não de um espião: o
    // `userEvent.setup()` do `monta()` instala o próprio stub e substitui
    // qualquer mock posto antes dele.
    expect(await navigator.clipboard.readText()).toBe(endereco)
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Link copiado')))
  })

  /**
   * Os dois estados em que a api devolve `inviteUrl` nulo. Mostrar o link neles
   * seria oferecer ao dono um endereço que só produz 404 em quem clicar.
   */
  it('não mostra link em convite já respondido', async () => {
    servico.convites.mockResolvedValue([
      convite({ status: 'ACCEPTED', respondedAt: new Date().toISOString() }),
    ])

    monta()

    expect(await screen.findByText('Aceito')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /copiar o link/i })).not.toBeInTheDocument()
  })

  it('não mostra link em convite vencido, que continua PENDING', async () => {
    servico.convites.mockResolvedValue([
      convite({ status: 'PENDING', expiresAt: new Date(Date.now() - 2 * DIA).toISOString() }),
    ])

    monta()

    expect(await screen.findByText('Venceu sem resposta')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /copiar o link/i })).not.toBeInTheDocument()
  })

  it('avisa, sem sumir com o link, quando o navegador nega a cópia', async () => {
    servico.convites.mockResolvedValue([convite({ id: 'c9', email: 'nova@exemplo.com' })])

    const { user } = monta()

    const endereco = 'https://app.exemplo/convite-professor?convite=tk-c9'
    await screen.findByText(endereco)
    // Depois do `monta()`, que é quem chama o `userEvent.setup()` — antes dele
    // o stub do user-event apagaria esta recusa.
    fingeClipboard({ writeText: vi.fn().mockRejectedValue(new Error('negado')) })

    await user.click(screen.getByRole('button', { name: /copiar o link/i }))

    // O endereço continua na tela para selecionar à mão, e a mensagem diz isso.
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('selecionar')))
    expect(screen.getByText(endereco)).toBeInTheDocument()
  })
})
