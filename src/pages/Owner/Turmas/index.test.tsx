/**
 * As turmas do espaço, na tela do dono (web#390, api#472).
 *
 * ## O que estes testes carregam
 *
 * Três coisas que a tela pode errar sozinha, e que nenhum typecheck pega:
 *
 * 1. **`diaDaSemana` é 0–6 com 0 = domingo.** Um array na ordem errada põe toda
 *    turma no dia errado, e o erro é invisível até alguém olhar a agenda.
 * 2. **`""` do `<select>` não é `null`.** A api recusa string vazia em
 *    `professorId`, e é assim que o dono tira o professor sem apagar a turma.
 * 3. **Não existe `DELETE` de turma.** Desativar é `PATCH { ativa: false }`, e
 *    um botão "Excluir" prometeria o que a api recusa a fazer.
 *
 * O quarto é o **fim da aula por aritmética de relógio**: passar por `Date`
 * traria o fuso do navegador para uma conta que não tem instante nenhum — o
 * mesmo defeito que obrigou a api a escrever o `horarioDeParede.ts`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders } from '../../../test/render'
import { turmasService } from '../../../services/turmas'
import * as placesService from '../../../services/places'
import * as courtsService from '../../../services/courts'
import { ownerNavItems } from '../../../constants/navItems'
import OwnerTurmas from './index'
import type { AxiosResponse } from 'axios'
import type { ApiEnvelope, Court, MembroDoEspaco, Place, Turma } from '../../../types/api'

vi.mock('../../../services/turmas')
vi.mock('../../../services/places')
vi.mock('../../../services/courts')

const servico = vi.mocked(turmasService)
const espacos = vi.mocked(placesService)
const quadras = vi.mocked(courtsService)

function turma(over: Partial<Turma> = {}): Turma {
  return {
    id: 't1',
    courtId: 'q1',
    modalidade: 'FUTSAL',
    diaDaSemana: 2,
    horario: '19:00',
    duracaoMinutos: 60,
    vagas: 20,
    valorMensalidade: '120',
    professorId: null,
    ativa: true,
    court: { id: 'q1', name: 'Quadra 1' },
    professor: null,
    matriculasAtivas: 0,
    ...over,
  }
}

const PROFESSORA: MembroDoEspaco = {
  id: 'vinculo-1',
  papel: 'PROFESSOR',
  createdAt: new Date().toISOString(),
  user: { id: 'user-1', name: 'Rita Souza', avatarUrl: null },
}

const monta = (query = '?placeId=ltc') =>
  renderWithProviders(<OwnerTurmas />, { route: `/owner/turmas${query}`, path: '/owner/turmas' })

const auth = vi.hoisted(() => ({ estado: { user: { id: 'dono', role: 'OWNER' } } }))
vi.mock('../../../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

beforeEach(() => {
  vi.clearAllMocks()
  espacos.list.mockResolvedValue({
    data: {
      success: true,
      data: [
        { id: 'ltc', name: 'Lavras Tênis Clube', ownerId: 'dono' },
        { id: 'aabb', name: 'AABB Lavras', ownerId: 'dono' },
      ] as Place[],
    },
  } as AxiosResponse<ApiEnvelope<Place[]>>)
  quadras.getCourtsByPlace.mockResolvedValue({
    success: true,
    data: [{ id: 'q1', name: 'Quadra 1' }] as Court[],
  } as ApiEnvelope<Court[]>)
  servico.listar.mockResolvedValue([])
  servico.membros.mockResolvedValue([PROFESSORA])
  servico.cadastrar.mockResolvedValue(turma())
  servico.atualizar.mockResolvedValue(turma())
})

describe('OwnerTurmas', () => {
  it('está no menu do owner, e nunca com cadeado', () => {
    // Sem plano nenhum: a api deixou as rotas de turma fora do
    // `requireActiveSubscription`, e o cadeado aqui contradiria ela.
    const item = ownerNavItems('OWNER', () => false).find((i) => i.to === '/owner/turmas')

    expect(item?.label).toBe('Turmas')
    expect(item?.bloqueado).toBeFalsy()
  })

  it('respeita o ?placeId= e troca de espaço pelo seletor', async () => {
    monta('?placeId=aabb')

    expect(await screen.findByLabelText('Estabelecimento')).toHaveValue('aabb')
    await waitFor(() => expect(servico.listar).toHaveBeenCalledWith('aabb'))
  })

  it('sem ?placeId=, cai no primeiro espaço do dono', async () => {
    monta('')
    await waitFor(() => expect(servico.listar).toHaveBeenCalledWith('ltc'))
  })

  describe('a lista', () => {
    it('põe a turma no dia certo — 0 é domingo', async () => {
      // `diaDaSemana: 0` precisa virar "Domingo", e não "Segunda". É o erro que
      // um array deslocado produz e que nada mais denuncia.
      servico.listar.mockResolvedValue([turma({ diaDaSemana: 0 })])
      monta()

      expect(await screen.findByText('Domingo')).toBeInTheDocument()
      expect(screen.queryByText('Segunda')).not.toBeInTheDocument()
    })

    it('mostra a faixa de horário somando a duração, sem passar por Date', async () => {
      servico.listar.mockResolvedValue([turma({ horario: '22:30', duracaoMinutos: 90 })])
      monta()

      // 22:30 + 90min vira 00:00 do dia seguinte — e o fim é hora de parede,
      // não instante: nenhum fuso entra nessa conta.
      expect(await screen.findByText('22:30 – 00:00')).toBeInTheDocument()
    })

    it('mostra a ocupação, e não só as vagas', async () => {
      servico.listar.mockResolvedValue([turma({ vagas: 20, matriculasAtivas: 17 })])
      monta()

      expect(await screen.findByText('17 / 20')).toBeInTheDocument()
    })

    it('turma sem professor diz que está sem, e não fica em branco', async () => {
      servico.listar.mockResolvedValue([turma({ professor: null })])
      monta()

      expect(await screen.findByText('Sem professor')).toBeInTheDocument()
    })

    it('turma inativa continua na lista, marcada', async () => {
      // Desativar não é apagar: sumir da lista contaria outra história.
      servico.listar.mockResolvedValue([turma({ ativa: false })])
      monta()

      expect(await screen.findByText('Inativa')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reativar' })).toBeInTheDocument()
    })

    it('nunca oferece excluir — a api não tem DELETE de turma', async () => {
      servico.listar.mockResolvedValue([turma()])
      monta()

      expect(await screen.findByRole('button', { name: 'Desativar' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /excluir|apagar|remover turma/i })).not.toBeInTheDocument()
    })

    it('desativar manda só `ativa`, e não o resto da turma', async () => {
      // A api recusa corpo vazio, e mandar o resto junto reescreveria campo que
      // ninguém tocou.
      servico.listar.mockResolvedValue([turma()])
      const { user } = monta()

      await user.click(await screen.findByRole('button', { name: 'Desativar' }))

      await waitFor(() => expect(servico.atualizar).toHaveBeenCalledWith('ltc', 't1', { ativa: false }))
    })

    it('lista vazia explica o que é uma turma', async () => {
      monta()
      expect(await screen.findByText(/nenhuma turma ainda/i)).toBeInTheDocument()
    })
  })

  describe('o professor é o vínculo, não a pessoa', () => {
    it('o seletor manda o id do PlaceMember, e não o do usuário', async () => {
      const { user } = monta()

      await user.click(await screen.findByRole('button', { name: /nova turma/i }))
      await user.selectOptions(await screen.findByLabelText('Quadra'), 'q1')
      await user.selectOptions(screen.getByLabelText('Modalidade'), 'FUTSAL')
      await user.selectOptions(screen.getByLabelText('Professor'), 'vinculo-1')
      await user.click(screen.getByRole('button', { name: /cadastrar turma/i }))

      await waitFor(() => expect(servico.cadastrar).toHaveBeenCalled())
      // `vinculo-1`, e nunca `user-1`: mandar o userId dá 422
      // PROFESSOR_NOT_IN_PLACE, e a mensagem não explica o engano.
      expect(servico.cadastrar.mock.calls[0][1].professorId).toBe('vinculo-1')
    })

    it('sem professor escolhido manda null, e não string vazia', async () => {
      const { user } = monta()

      await user.click(await screen.findByRole('button', { name: /nova turma/i }))
      await user.selectOptions(await screen.findByLabelText('Quadra'), 'q1')
      await user.selectOptions(screen.getByLabelText('Modalidade'), 'FUTSAL')
      await user.click(screen.getByRole('button', { name: /cadastrar turma/i }))

      await waitFor(() => expect(servico.cadastrar).toHaveBeenCalled())
      expect(servico.cadastrar.mock.calls[0][1].professorId).toBeNull()
    })

    it('tirar o professor manda null, e não apaga a turma', async () => {
      servico.listar.mockResolvedValue([
        turma({ professorId: 'vinculo-1', professor: { id: 'vinculo-1', user: { id: 'user-1', name: 'Rita Souza' } } }),
      ])
      const { user } = monta()

      await user.click(await screen.findByRole('button', { name: /tirar professor/i }))

      await waitFor(() => expect(servico.atualizar).toHaveBeenCalledWith('ltc', 't1', { professorId: null }))
    })

    it('espaço sem nenhum professor explica onde convidar', async () => {
      servico.membros.mockResolvedValue([])
      const { user } = monta()

      await user.click(await screen.findByRole('button', { name: /nova turma/i }))

      expect(await screen.findByText(/convide em professores/i)).toBeInTheDocument()
    })
  })

  /**
   * O caminho de volta (#407).
   *
   * *Tirar professor* existia sozinho: a turma ficava sem professor para sempre
   * e a única saída era apagá-la e refazer, perdendo matrículas, chamadas e
   * mensalidades. A api sempre soube reatribuir — `turma.test.ts` tem o teste —
   * e o critério estava escrito desde a #390. Faltava a tela.
   */
  describe('pôr professor numa turma que está sem', () => {
    const COM_PROFESSOR = {
      professorId: 'vinculo-1',
      professor: { id: 'vinculo-1', user: { id: 'user-1', name: 'Rita Souza' } },
    }

    it('oferece o seletor, e escolher atribui mandando o id do VÍNCULO', async () => {
      servico.listar.mockResolvedValue([turma({ professor: null })])
      const { user } = monta()

      await user.selectOptions(await screen.findByLabelText(/escolher o professor/i), 'vinculo-1')

      // `vinculo-1`, e nunca `user-1` — a mesma armadilha do formulário de
      // cadastro: mandar o userId dá 422 PROFESSOR_NOT_IN_PLACE.
      await waitFor(() =>
        expect(servico.atualizar).toHaveBeenCalledWith('ltc', 't1', { professorId: 'vinculo-1' }),
      )
    })

    it('não manda nada quando a escolha volta para o vazio', async () => {
      servico.listar.mockResolvedValue([turma({ professor: null })])
      monta()

      /*
       * `fireEvent`, e não `user.selectOptions`.
       *
       * O seletor é controlado em `value=""`, então escolher a opção vazia pelo
       * teclado não muda valor nenhum e o `onChange` nem dispara — o teste
       * passaria sem tocar na guarda. Disparar o evento à mão é o que de fato a
       * exercita: sem ela, isto mandaria `professorId: ''`, que a api recusa
       * com 422 dizendo que o vínculo não existe.
       */
      fireEvent.change(await screen.findByLabelText(/escolher o professor/i), { target: { value: '' } })

      expect(servico.atualizar).not.toHaveBeenCalled()
    })

    it('turma que já tem professor não mostra o seletor — mostra o de tirar', async () => {
      servico.listar.mockResolvedValue([turma(COM_PROFESSOR)])
      monta()

      expect(await screen.findByText('Prof. Rita Souza')).toBeInTheDocument()
      expect(screen.queryByLabelText(/escolher o professor/i)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /tirar professor/i })).toBeInTheDocument()
    })

    it('espaço sem vínculo nenhum não oferece seletor, e aponta para Professores', async () => {
      // Um seletor sem nenhuma opção seria uma porta que não abre. O cartão diz
      // onde se resolve, como o formulário de cadastro já dizia.
      servico.membros.mockResolvedValue([])
      servico.listar.mockResolvedValue([turma({ professor: null })])
      monta()

      expect(await screen.findByText(/ninguém tem vínculo aqui ainda/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/escolher o professor/i)).not.toBeInTheDocument()
    })

    it('tirar e pôr de volta devolve a turma ao estado inicial', async () => {
      // O teste do bug inteiro, ida e volta: é a sequência que antes só tinha ida.
      servico.listar
        .mockResolvedValueOnce([turma(COM_PROFESSOR)])
        .mockResolvedValue([turma({ professor: null })])
      const { user } = monta()

      await user.click(await screen.findByRole('button', { name: /tirar professor/i }))
      await waitFor(() =>
        expect(servico.atualizar).toHaveBeenCalledWith('ltc', 't1', { professorId: null }),
      )

      // A lista recarrega sem professor — e agora existe o caminho de volta.
      servico.listar.mockResolvedValue([turma(COM_PROFESSOR)])
      await user.selectOptions(await screen.findByLabelText(/escolher o professor/i), 'vinculo-1')

      await waitFor(() =>
        expect(servico.atualizar).toHaveBeenLastCalledWith('ltc', 't1', { professorId: 'vinculo-1' }),
      )
    })
  })

  describe('cadastrar', () => {
    it('avisa que a turma ocupa a quadra por 8 semanas', async () => {
      // A api gera as aulas dentro do `criarTurma`. Sem este aviso, o dono
      // descobre pela agenda e acha que é defeito.
      const { user } = monta()

      await user.click(await screen.findByRole('button', { name: /nova turma/i }))

      // Pelo `role`, e não pelo texto: a explicação do topo também fala em
      // ocupar a quadra, e um regex solto casaria com as duas.
      const aviso = await screen.findByRole('note')
      expect(aviso).toHaveTextContent(/ocupa a quadra/i)
      expect(aviso).toHaveTextContent(/8 semanas/i)
      expect(aviso).toHaveTextContent(/desativar a turma devolve a quadra/i)
    })

    it('não manda horário fora do formato para a api', async () => {
      const { user } = monta()

      await user.click(await screen.findByRole('button', { name: /nova turma/i }))
      await user.selectOptions(await screen.findByLabelText('Quadra'), 'q1')
      await user.selectOptions(screen.getByLabelText('Modalidade'), 'FUTSAL')
      await user.clear(screen.getByLabelText('Vagas'))
      await user.click(screen.getByRole('button', { name: /cadastrar turma/i }))

      await waitFor(() => expect(servico.cadastrar).not.toHaveBeenCalled())
    })

    it('espaço sem quadra não deixa cadastrar, e diz por quê', async () => {
      quadras.getCourtsByPlace.mockResolvedValue({ success: true, data: [] } as ApiEnvelope<Court[]>)
      monta()

      expect(await screen.findByText(/ainda não tem quadra cadastrada/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /nova turma/i })).toBeDisabled()
    })

    it('recarrega a lista depois de cadastrar', async () => {
      const { user } = monta()

      await user.click(await screen.findByRole('button', { name: /nova turma/i }))
      await user.selectOptions(await screen.findByLabelText('Quadra'), 'q1')
      await user.selectOptions(screen.getByLabelText('Modalidade'), 'FUTSAL')
      await user.click(screen.getByRole('button', { name: /cadastrar turma/i }))

      await waitFor(() => expect(servico.listar.mock.calls.length).toBeGreaterThan(1))
    })
  })

  it('sem espaço nenhum, diz o que fazer em vez de carregar para sempre', async () => {
    /* O bug que isto trava: a consulta de turmas tem `enabled: Boolean(placeId)`,
       e no TanStack Query v5 consulta desabilitada fica `isPending` para
       sempre. Quem não tem espaço via dois esqueletos girando sem fim, sem erro
       e sem estado vazio — foi assim que a tela subiu para produção. */
    espacos.list.mockResolvedValue({ data: { success: true, data: [] as Place[] } } as AxiosResponse<ApiEnvelope<Place[]>>)
    monta()

    expect(await screen.findByText(/nenhum espaço cadastrado ainda/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Estabelecimento')).toHaveValue('')
    expect(servico.listar).not.toHaveBeenCalled()
  })

  it('agrupa por dia, na ordem que a api mandou', async () => {
    servico.listar.mockResolvedValue([
      turma({ id: 'a', diaDaSemana: 2, horario: '19:00' }),
      turma({ id: 'b', diaDaSemana: 2, horario: '20:00' }),
      turma({ id: 'c', diaDaSemana: 4, horario: '18:00' }),
    ])
    monta()

    const terca = (await screen.findByText('Terça')).closest('li')!
    expect(within(terca).getAllByText(/–/)).toHaveLength(2)
    expect(await screen.findByText('Quinta')).toBeInTheDocument()
  })
})
