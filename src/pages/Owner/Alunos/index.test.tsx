/**
 * Os alunos de uma turma, na tela do dono (web#391, api#474).
 *
 * ## O que estes testes carregam
 *
 * **O aluno sem conta é o caso normal.** É a decisão que decide a adoção do
 * produto — exigir conta faria o dono só poder usar o Só+1 depois de convencer
 * a turma inteira a se cadastrar. Uma tela que tratasse "sem conta" como
 * pendência desfaria isso sem mudar uma linha de api, e é o que o primeiro
 * grupo trava.
 *
 * **Sair não é apagar.** O `DELETE` carimba `saiuEm` e mantém a linha, porque a
 * mensalidade aponta para a matrícula: apagar quem saiu levaria junto o
 * registro de quem pagou março. E tirar duas vezes é 422 de propósito — a
 * segunda data de saída seria mentira.
 *
 * **`contato` é texto livre.** O schema da api o descreve como *"o que o dono já
 * tem na agenda dele"*. Validar como telefone recusaria "mãe do João — 35 9…".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../test/render'
import { turmasService } from '../../../services/turmas'
import { matriculasService } from '../../../services/matriculas'
import OwnerAlunos from './index'
import type { Matricula, Turma } from '../../../types/api'

vi.mock('../../../services/turmas')
vi.mock('../../../services/matriculas')

/* O `renderWithProviders` monta um `MemoryRouter`, que não mexe em
   `window.location` — observar a navegação pede o próprio `useNavigate`. */
const navegou = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useNavigate: () => navegou,
}))

const turmas = vi.mocked(turmasService)
const servico = vi.mocked(matriculasService)

const TURMA: Turma = {
  id: 't1', courtId: 'q1', modalidade: 'FUTSAL', diaDaSemana: 2, horario: '19:00',
  duracaoMinutos: 60, vagas: 3, valorMensalidade: '120', professorId: null, ativa: true,
  court: { id: 'q1', name: 'Quadra 1' }, professor: null, matriculasAtivas: 1,
}

function aluno(over: Partial<Matricula> = {}): Matricula {
  return {
    id: 'm1',
    turmaId: 't1',
    nome: 'Joana Ribeiro',
    contato: '35 99999-1234',
    userId: null,
    entrouEm: '2026-08-01T12:00:00.000Z',
    saiuEm: null,
    user: null,
    ...over,
  }
}

const monta = () =>
  renderWithProviders(<OwnerAlunos />, {
    route: '/owner/turmas/t1/alunos?placeId=ltc',
    path: '/owner/turmas/:turmaId/alunos',
  })

beforeEach(() => {
  vi.clearAllMocks()
  turmas.listar.mockResolvedValue([TURMA])
  servico.listar.mockResolvedValue([aluno()])
  servico.matricular.mockResolvedValue(aluno({ id: 'm2', nome: 'Pedro Alves' }))
  servico.corrigir.mockResolvedValue(aluno({ nome: 'Joana R. Silva' }))
  servico.tirarDaTurma.mockResolvedValue(aluno({ saiuEm: '2026-09-01T12:00:00.000Z' }))
})

describe('OwnerAlunos', () => {
  it('mostra de que turma é, tirando da listagem — não há GET de detalhe na api', async () => {
    monta()

    expect(await screen.findByText(/terça às 19:00 · quadra 1/i)).toBeInTheDocument()
    expect(turmas.listar).toHaveBeenCalledWith('ltc')
  })

  it('mostra a ocupação da turma', async () => {
    monta()
    expect(await screen.findByText('1 / 3')).toBeInTheDocument()
  })

  describe('o aluno sem conta é o caso normal', () => {
    it('matricula só com nome e contato, e nunca pede uma conta', async () => {
      const { user } = monta()

      await user.type(await screen.findByLabelText('Nome do aluno'), 'Pedro Alves')
      await user.type(screen.getByLabelText('Contato'), '35 98888-4321')
      await user.click(screen.getByRole('button', { name: /matricular/i }))

      await waitFor(() =>
        expect(servico.matricular).toHaveBeenCalledWith('ltc', 't1', {
          nome: 'Pedro Alves',
          contato: '35 98888-4321',
        }),
      )
      // Exatamente dois campos: nome e contato. Um terceiro seria a busca de
      // conta, que abriria uma tela de gente que não é desta issue e
      // contradiria a decisão do épico — o aluno não precisa ter conta.
      expect(screen.getAllByRole('textbox')).toHaveLength(2)
    })

    it('não marca nem alerta quem está sem conta', async () => {
      monta()

      expect(await screen.findByText('Joana Ribeiro')).toBeInTheDocument()
      expect(screen.queryByText(/tem conta/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/pendente|sem cadastro|incompleto/i)).not.toBeInTheDocument()
    })

    it('quem tem conta ganha uma marca discreta, e a lista segue usando o nome da matrícula', async () => {
      // O dono escreveu "Joãozinho"; a conta diz "João Pedro Silva". Quem manda
      // é o nome da matrícula — é por ele que o professor chama.
      servico.listar.mockResolvedValue([
        aluno({ nome: 'Joãozinho', userId: 'u1', user: { id: 'u1', name: 'João Pedro Silva' } }),
      ])
      monta()

      expect(await screen.findByText('tem conta')).toBeInTheDocument()
      expect(screen.getByText('Joãozinho')).toBeInTheDocument()
      expect(screen.queryByText('João Pedro Silva')).not.toBeInTheDocument()
    })
  })

  describe('o contato é texto livre', () => {
    it('aceita o que o dono tem na agenda, sem exigir formato de telefone', async () => {
      const { user } = monta()

      await user.type(await screen.findByLabelText('Nome do aluno'), 'Ana Paula')
      await user.type(screen.getByLabelText('Contato'), 'mãe da Ana — 35 9')
      await user.click(screen.getByRole('button', { name: /matricular/i }))

      await waitFor(() => expect(servico.matricular).toHaveBeenCalled())
      expect(servico.matricular.mock.calls[0][2].contato).toBe('mãe da Ana — 35 9')
    })

    it('recusa contato curto demais antes de chamar a api', async () => {
      const { user } = monta()

      await user.type(await screen.findByLabelText('Nome do aluno'), 'Ana Paula')
      await user.type(screen.getByLabelText('Contato'), 'a')
      await user.click(screen.getByRole('button', { name: /matricular/i }))

      expect(await screen.findByText('Contato muito curto')).toBeInTheDocument()
      expect(servico.matricular).not.toHaveBeenCalled()
    })
  })

  describe('sair não é apagar', () => {
    it('o botão diz "Tirar da turma", e nunca excluir', async () => {
      monta()

      expect(await screen.findByRole('button', { name: 'Tirar da turma' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /excluir|apagar|deletar/i })).not.toBeInTheDocument()
    })

    it('tirar chama o DELETE da matrícula', async () => {
      const { user } = monta()

      await user.click(await screen.findByRole('button', { name: 'Tirar da turma' }))

      await waitFor(() => expect(servico.tirarDaTurma).toHaveBeenCalledWith('ltc', 't1', 'm1'))
    })

    it('quem já saiu não recebe ação — tirar de novo é 422 na api', async () => {
      servico.listar.mockResolvedValue([aluno({ saiuEm: '2026-08-20T12:00:00.000Z' })])
      monta()

      expect(await screen.findByText(/saiu em 20\/08\/2026/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Tirar da turma' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Corrigir' })).not.toBeInTheDocument()
    })
  })

  describe('o histórico', () => {
    it('começa desligado, e pede à api só os ativos', async () => {
      monta()
      await waitFor(() => expect(servico.listar).toHaveBeenCalledWith('ltc', 't1', false))
    })

    it('ligado, pede quem já saiu junto', async () => {
      const { user } = monta()

      await user.click(await screen.findByLabelText(/mostrar quem já saiu/i))

      await waitFor(() => expect(servico.listar).toHaveBeenCalledWith('ltc', 't1', true))
    })
  })

  describe('turma lotada', () => {
    it('não deixa matricular, e explica por quê', async () => {
      turmas.listar.mockResolvedValue([{ ...TURMA, vagas: 2, matriculasAtivas: 2 }])
      monta()

      expect(await screen.findByRole('note')).toHaveTextContent(/lotada/i)
      expect(screen.queryByRole('button', { name: /matricular/i })).not.toBeInTheDocument()
    })
  })

  describe('corrigir', () => {
    it('carrega os dados atuais no formulário e manda o PATCH', async () => {
      const { user } = monta()

      await user.click(await screen.findByRole('button', { name: 'Corrigir' }))

      expect(screen.getByLabelText('Nome do aluno')).toHaveValue('Joana Ribeiro')
      expect(screen.getByLabelText('Contato')).toHaveValue('35 99999-1234')

      await user.clear(screen.getByLabelText('Nome do aluno'))
      await user.type(screen.getByLabelText('Nome do aluno'), 'Joana R. Silva')
      await user.click(screen.getByRole('button', { name: 'Salvar' }))

      await waitFor(() =>
        expect(servico.corrigir).toHaveBeenCalledWith('ltc', 't1', 'm1', {
          nome: 'Joana R. Silva',
          contato: '35 99999-1234',
        }),
      )
    })

    it('corrigir funciona mesmo com a turma lotada — não é matricular', async () => {
      // O formulário some quando lota; corrigir precisa dele de volta, senão o
      // dono não conserta um nome errado numa turma cheia.
      turmas.listar.mockResolvedValue([{ ...TURMA, vagas: 1, matriculasAtivas: 1 }])
      const { user } = monta()

      await user.click(await screen.findByRole('button', { name: 'Corrigir' }))

      expect(screen.getByLabelText('Nome do aluno')).toHaveValue('Joana Ribeiro')
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
    })
  })

  it('lista vazia explica que bastam nome e contato', async () => {
    servico.listar.mockResolvedValue([])
    monta()

    expect(await screen.findByText(/bastam nome e contato/i)).toBeInTheDocument()
  })

  it('dá para voltar para as turmas sem perder o espaço', async () => {
    // O `placeId` viaja na query, e perdê-lo na volta jogaria o dono no
    // primeiro espaço da lista — que pode não ser o que ele estava vendo.
    const { user } = monta()

    await user.click(await screen.findByRole('button', { name: /voltar para as turmas/i }))

    await waitFor(() => expect(navegou).toHaveBeenCalledWith('/owner/turmas?placeId=ltc'))
  })
})
