import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../test/render'
import { mensalidadesService } from '../../../services/mensalidades'
import OwnerMensalidades from './index'

vi.mock('../../../services/mensalidades')
const servico = vi.mocked(mensalidadesService)

const resposta = {
  competencia: '2026-08',
  valorAtualDaTurma: '150',
  alunos: [
    { matriculaId: 'm1', nome: 'Ana', valor: '120', pagoEm: '2026-08-05T12:00:00Z', pago: true, saiuNoMes: false },
    { matriculaId: 'm2', nome: 'Beto', valor: '150', pagoEm: null, pago: false, saiuNoMes: true },
  ],
}

const monta = () => renderWithProviders(<OwnerMensalidades />, {
  route: '/owner/turmas/t1/mensalidades?placeId=p1',
  path: '/owner/turmas/:turmaId/mensalidades',
})

beforeEach(() => {
  vi.clearAllMocks()
  servico.listar.mockResolvedValue(resposta)
  servico.marcar.mockResolvedValue({})
  servico.desmarcar.mockResolvedValue({})
})

describe('OwnerMensalidades', () => {
  it('abre no mês corrente e usa seletor de mês', async () => {
    monta()
    const seletor = await screen.findByLabelText('Competência')
    expect(seletor).toHaveAttribute('type', 'month')
    expect(seletor).toHaveValue(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)
  })

  it('mostra o valor congelado da linha e explica quando o preço atual difere', async () => {
    monta()
    expect(await screen.findByText(/R\$\s*120,00 · pago/i)).toBeInTheDocument()
    expect(screen.getByText(/registrado por R\$\s*120,00; hoje a turma custa R\$\s*150,00/i)).toBeInTheDocument()
  })

  it('marca e desmarca com a competência selecionada', async () => {
    const { user } = monta()
    await user.click(await screen.findByRole('button', { name: 'Marcar como paga' }))
    await waitFor(() => expect(servico.marcar).toHaveBeenCalledWith('p1', 't1', 'm2', expect.stringMatching(/^\d{4}-\d{2}$/)))
    await user.click(screen.getByRole('button', { name: 'Desmarcar' }))
    await waitFor(() => expect(servico.desmarcar).toHaveBeenCalledWith('p1', 't1', 'm1', expect.stringMatching(/^\d{4}-\d{2}$/)))
  })

  it('marca quem saiu no mês e não oferece cobrança', async () => {
    monta()
    expect(await screen.findByText('saiu neste mês')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cobrar|boleto|pagamento/i })).not.toBeInTheDocument()
  })
})
