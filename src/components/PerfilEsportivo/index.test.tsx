/**
 * A aba de modalidades do perfil (web#214, épico api#201).
 *
 * O que estes testes protegem, além de a tela abrir:
 *
 * - **uma linha por modalidade** — quem já cadastrou futsal não pode cadastrar
 *   futsal de novo, senão o índice de nível passa a depender de qual linha vier
 *   primeiro (api#204);
 * - **as posições mudam com a modalidade**, e trocar de modalidade **limpa** a
 *   posição: "Goleiro" não existe no vôlei, e manter o valor antigo gravaria uma
 *   posição que a modalidade nova não oferece;
 * - **`Goleiro` é escrito exatamente assim** — é a palavra que o sorteio
 *   equilibrado procura para não juntar dois goleiros no mesmo time (api#206).
 *   Mudar a grafia desligaria aquele comportamento sem quebrar nada, que é o
 *   pior tipo de defeito.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '../../test/render'
import { envelope } from '../../test/factories'
import type { SportProfile } from '../../types/api'
import { PerfilEsportivo } from './index'

vi.mock('../../services/users')
vi.mock('../../services/sports')
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}))

import * as usersService from '../../services/users'
import { getSports } from '../../services/sports'
import { toast } from 'sonner'

const buscaPerfis = vi.mocked(usersService.getSportProfiles)
const salvaPerfil = vi.mocked(usersService.upsertSportProfile)
const removePerfil = vi.mocked(usersService.deleteSportProfile)

function perfil(over: Partial<SportProfile> = {}): SportProfile {
  return {
    sport: 'FUTSAL',
    level: 'ADVANCED',
    position: 'Goleiro',
    updatedAt: '2026-08-18T12:00:00.000Z',
    ...over,
  }
}

const resposta = (perfis: SportProfile[]) =>
  ({ data: envelope(perfis) }) as Awaited<ReturnType<typeof usersService.getSportProfiles>>

beforeEach(() => {
  vi.clearAllMocks()
  // O hook de modalidades cai no fallback local quando a API não responde, e é
  // ele que dá rótulo e ícone — não precisa de rede para os testes.
  vi.mocked(getSports).mockRejectedValue(new Error('offline'))
  buscaPerfis.mockResolvedValue(resposta([]))
  salvaPerfil.mockResolvedValue({ data: envelope(perfil()) } as Awaited<
    ReturnType<typeof usersService.upsertSportProfile>
  >)
  removePerfil.mockResolvedValue({} as Awaited<ReturnType<typeof usersService.deleteSportProfile>>)
})

describe('PerfilEsportivo — estados da tela', () => {
  it('mostra o estado vazio de quem ainda não cadastrou nada', async () => {
    renderWithProviders(<PerfilEsportivo />)

    expect(await screen.findByText(/ainda não cadastrou nenhuma modalidade/i)).toBeInTheDocument()
    // E diz a consequência, que é o que faz alguém preencher.
    expect(screen.getByText(/trata você como jogador de nível médio/i)).toBeInTheDocument()
  })

  it('anuncia o carregamento', () => {
    renderWithProviders(<PerfilEsportivo />)

    expect(screen.getByRole('status')).toHaveTextContent(/carregando/i)
  })

  it('mostra erro e oferece tentar de novo quando a busca falha', async () => {
    buscaPerfis.mockRejectedValue(new Error('500'))
    renderWithProviders(<PerfilEsportivo />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível carregar/i)
    expect(screen.getByRole('button', { name: /tentar de novo/i })).toBeInTheDocument()
  })

  it('lista as modalidades já cadastradas com nível e posição', async () => {
    buscaPerfis.mockResolvedValue(
      resposta([perfil(), perfil({ sport: 'VOLEI', level: 'BEGINNER', position: null })]),
    )

    renderWithProviders(<PerfilEsportivo />)

    expect(await screen.findByText('Futsal')).toBeInTheDocument()
    expect(screen.getByText('Avançado · Goleiro')).toBeInTheDocument()
    // Sem posição declarada, a tela diz o que isso significa em vez de deixar
    // um espaço vazio.
    expect(screen.getByText('Iniciante · qualquer posição')).toBeInTheDocument()
  })
})

describe('PerfilEsportivo — adicionar', () => {
  it('salva modalidade, nível e posição', async () => {
    const { user } = renderWithProviders(<PerfilEsportivo />)
    await user.click(await screen.findByRole('button', { name: /adicionar modalidade/i }))

    await user.selectOptions(screen.getByLabelText('Modalidade'), 'FUTSAL')
    await user.selectOptions(screen.getByLabelText('Seu nível'), 'ADVANCED')
    await user.selectOptions(screen.getByLabelText('Posição preferida'), 'Goleiro')
    await user.click(screen.getByRole('button', { name: /salvar modalidade/i }))

    await waitFor(() => {
      expect(salvaPerfil).toHaveBeenCalledWith('FUTSAL', { level: 'ADVANCED', position: 'Goleiro' })
    })
  })

  // `null` e não `""`: a API trata os três estados, e string vazia significaria
  // "guarde vazio" em vez de "não tenho posição".
  it('sem posição escolhida, manda null', async () => {
    const { user } = renderWithProviders(<PerfilEsportivo />)
    await user.click(await screen.findByRole('button', { name: /adicionar modalidade/i }))

    await user.selectOptions(screen.getByLabelText('Modalidade'), 'BASQUETE')
    await user.click(screen.getByRole('button', { name: /salvar modalidade/i }))

    await waitFor(() => {
      expect(salvaPerfil).toHaveBeenCalledWith('BASQUETE', { level: 'INTERMEDIATE', position: null })
    })
  })

  it('as posições oferecidas mudam conforme a modalidade', async () => {
    const { user } = renderWithProviders(<PerfilEsportivo />)
    await user.click(await screen.findByRole('button', { name: /adicionar modalidade/i }))

    await user.selectOptions(screen.getByLabelText('Modalidade'), 'FUTSAL')
    const posicaoNoFutsal = screen.getByLabelText('Posição preferida')
    expect(within(posicaoNoFutsal).getByRole('option', { name: 'Goleiro' })).toBeInTheDocument()
    expect(within(posicaoNoFutsal).queryByRole('option', { name: 'Levantador' })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Modalidade'), 'VOLEI')
    const posicaoNoVolei = screen.getByLabelText('Posição preferida')
    expect(within(posicaoNoVolei).getByRole('option', { name: 'Levantador' })).toBeInTheDocument()
    expect(within(posicaoNoVolei).queryByRole('option', { name: 'Goleiro' })).not.toBeInTheDocument()
  })

  it('trocar de modalidade limpa a posição escolhida', async () => {
    const { user } = renderWithProviders(<PerfilEsportivo />)
    await user.click(await screen.findByRole('button', { name: /adicionar modalidade/i }))

    await user.selectOptions(screen.getByLabelText('Modalidade'), 'FUTSAL')
    await user.selectOptions(screen.getByLabelText('Posição preferida'), 'Goleiro')
    await user.selectOptions(screen.getByLabelText('Modalidade'), 'VOLEI')
    await user.click(screen.getByRole('button', { name: /salvar modalidade/i }))

    await waitFor(() => {
      expect(salvaPerfil).toHaveBeenCalledWith('VOLEI', { level: 'INTERMEDIATE', position: null })
    })
  })

  it('modalidade sem posições fixas desabilita o campo e explica', async () => {
    const { user } = renderWithProviders(<PerfilEsportivo />)
    await user.click(await screen.findByRole('button', { name: /adicionar modalidade/i }))

    await user.selectOptions(screen.getByLabelText('Modalidade'), 'TENIS')

    expect(screen.getByLabelText('Posição preferida')).toBeDisabled()
    expect(screen.getByText(/não tem posições fixas/i)).toBeInTheDocument()
  })

  // Duas linhas da mesma modalidade fariam o índice de nível depender de qual o
  // banco devolvesse primeiro (api#204).
  it('não oferece modalidade que o jogador já cadastrou', async () => {
    buscaPerfis.mockResolvedValue(resposta([perfil({ sport: 'FUTSAL' })]))
    const { user } = renderWithProviders(<PerfilEsportivo />)

    await user.click(await screen.findByRole('button', { name: /adicionar modalidade/i }))

    // Pelos valores, e não pelo rótulo: "Futevôlei" e "Vôlei de Areia" casam
    // com quase qualquer expressão que sirva para "Vôlei".
    const oferecidas = within(screen.getByLabelText('Modalidade'))
      .getAllByRole('option')
      .map(o => (o as HTMLOptionElement).value)

    expect(oferecidas).not.toContain('FUTSAL')
    expect(oferecidas).toContain('VOLEI')
  })

  it('mostra a mensagem da API quando salvar falha, e mantém o formulário aberto', async () => {
    salvaPerfil.mockRejectedValue(new Error('falhou'))
    const { user } = renderWithProviders(<PerfilEsportivo />)
    await user.click(await screen.findByRole('button', { name: /adicionar modalidade/i }))

    await user.click(screen.getByRole('button', { name: /salvar modalidade/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: /salvar modalidade/i })).toBeInTheDocument()
  })
})

describe('PerfilEsportivo — editar e remover', () => {
  it('editar abre o formulário preenchido e trava a modalidade', async () => {
    buscaPerfis.mockResolvedValue(resposta([perfil()]))
    const { user } = renderWithProviders(<PerfilEsportivo />)

    await user.click(await screen.findByRole('button', { name: 'Editar Futsal' }))

    expect(screen.getByLabelText('Modalidade')).toHaveValue('FUTSAL')
    expect(screen.getByLabelText('Seu nível')).toHaveValue('ADVANCED')
    expect(screen.getByLabelText('Posição preferida')).toHaveValue('Goleiro')
    // Trocar a modalidade aqui criaria outra e deixaria a primeira para trás.
    expect(screen.getByLabelText('Modalidade')).toBeDisabled()
  })

  it('editar salva na mesma modalidade', async () => {
    buscaPerfis.mockResolvedValue(resposta([perfil()]))
    const { user } = renderWithProviders(<PerfilEsportivo />)

    await user.click(await screen.findByRole('button', { name: 'Editar Futsal' }))
    await user.selectOptions(screen.getByLabelText('Seu nível'), 'BEGINNER')
    await user.click(screen.getByRole('button', { name: /salvar modalidade/i }))

    await waitFor(() => {
      expect(salvaPerfil).toHaveBeenCalledWith('FUTSAL', { level: 'BEGINNER', position: 'Goleiro' })
    })
  })

  it('remover chama a API da modalidade certa', async () => {
    buscaPerfis.mockResolvedValue(resposta([perfil(), perfil({ sport: 'VOLEI', position: null })]))
    const { user } = renderWithProviders(<PerfilEsportivo />)

    await user.click(await screen.findByRole('button', { name: 'Remover Vôlei' }))

    await waitFor(() => expect(removePerfil).toHaveBeenCalledWith('VOLEI'))
  })

  it('mostra erro quando remover falha', async () => {
    removePerfil.mockRejectedValue(new Error('falhou'))
    buscaPerfis.mockResolvedValue(resposta([perfil()]))
    const { user } = renderWithProviders(<PerfilEsportivo />)

    await user.click(await screen.findByRole('button', { name: 'Remover Futsal' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })

  it('cancelar fecha o formulário sem salvar', async () => {
    const { user } = renderWithProviders(<PerfilEsportivo />)
    await user.click(await screen.findByRole('button', { name: /adicionar modalidade/i }))

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByLabelText('Modalidade')).not.toBeInTheDocument()
    expect(salvaPerfil).not.toHaveBeenCalled()
  })
})

describe('PerfilEsportivo — acessibilidade', () => {
  it('cada campo tem rótulo associado', async () => {
    const { user } = renderWithProviders(<PerfilEsportivo />)
    await user.click(await screen.findByRole('button', { name: /adicionar modalidade/i }))

    expect(screen.getByLabelText('Modalidade')).toBeInTheDocument()
    expect(screen.getByLabelText('Seu nível')).toBeInTheDocument()
    expect(screen.getByLabelText('Posição preferida')).toBeInTheDocument()
  })

  // Ícone sozinho não diz nada para quem usa leitor de tela — e são dois botões
  // por linha, um deles destrutivo.
  it('os botões de ícone dizem em qual modalidade agem', async () => {
    buscaPerfis.mockResolvedValue(resposta([perfil()]))
    renderWithProviders(<PerfilEsportivo />)

    expect(await screen.findByRole('button', { name: 'Editar Futsal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover Futsal' })).toBeInTheDocument()
  })
})
