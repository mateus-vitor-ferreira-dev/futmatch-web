import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { chaves } from '../../../lib/queryClient'
import { mensalidadesService } from '../../../services/mensalidades'
import { toastErroDeApi } from '../../../utils/toastErro'
import { Botao, Caixa, CampoMes, Detalhe, Estado, Explicacao, Linha, Lista, Mes, Nome, Selo, Titulo, Topo, Voltar } from './styles'

const competenciaAtual = () => {
  const agora = new Date()
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`
}
const reais = (valor: string) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function OwnerMensalidades() {
  const { turmaId = '' } = useParams()
  const [params] = useSearchParams()
  const placeId = params.get('placeId') ?? ''
  const [competencia, setCompetencia] = useState(competenciaAtual)
  const navigate = useNavigate()
  const cliente = useQueryClient()
  usePageHeader('Mensalidades', 'Registro manual do que foi pago — o Só+1 não processa cobranças')

  const consulta = useQuery({
    queryKey: chaves.mensalidades(turmaId, competencia),
    queryFn: () => mensalidadesService.listar(placeId, turmaId, competencia),
    enabled: Boolean(placeId && turmaId),
  })
  const invalidar = () => cliente.invalidateQueries({ queryKey: chaves.mensalidades(turmaId, competencia) })
  const marcar = useMutation({
    mutationFn: (matriculaId: string) => mensalidadesService.marcar(placeId, turmaId, matriculaId, competencia),
    onSuccess: () => { toast.success('Mensalidade marcada como paga.'); void invalidar() },
    onError: toastErroDeApi,
  })
  const desmarcar = useMutation({
    mutationFn: (matriculaId: string) => mensalidadesService.desmarcar(placeId, turmaId, matriculaId, competencia),
    onSuccess: () => { toast.success('Marcação desfeita.'); void invalidar() },
    onError: toastErroDeApi,
  })

  return <div>
    <Voltar type="button" onClick={() => navigate(`/owner/turmas?placeId=${placeId}`)}><ArrowLeft size={16} />Voltar para as turmas</Voltar>
    <Caixa>
      <Topo>
        <div><Titulo>Competência da turma</Titulo><Explicacao>Marque o que o espaço já recebeu. Isto é registro, não cobrança.</Explicacao></div>
        <CampoMes>Competência<Mes type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} /></CampoMes>
      </Topo>
      {consulta.isPending ? <Estado>Carregando mensalidades…</Estado> : consulta.isError ? <Estado role="alert">Não foi possível carregar as mensalidades.</Estado> : consulta.data.alunos.length === 0 ? <Estado>Nenhum aluno nesta competência.</Estado> : <Lista>
        {consulta.data.alunos.map((aluno) => {
          const diverge = Number(aluno.valor) !== Number(consulta.data.valorAtualDaTurma)
          return <Linha key={aluno.matriculaId}>
            <div><Nome>{aluno.nome}{aluno.saiuNoMes && <Selo>saiu neste mês</Selo>}</Nome>
              <Detalhe>{reais(aluno.valor)} · {aluno.pago ? 'pago' : 'em aberto'}</Detalhe>
              {diverge && <Detalhe>Registrado por {reais(aluno.valor)}; hoje a turma custa {reais(consulta.data.valorAtualDaTurma)}.</Detalhe>}
            </div>
            <Botao type="button" disabled={marcar.isPending || desmarcar.isPending} onClick={() => aluno.pago ? desmarcar.mutate(aluno.matriculaId) : marcar.mutate(aluno.matriculaId)}>{aluno.pago ? 'Desmarcar' : 'Marcar como paga'}</Botao>
          </Linha>
        })}
      </Lista>}
    </Caixa>
  </div>
}
