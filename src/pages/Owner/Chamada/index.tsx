import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { chaves } from '../../../lib/queryClient'
import { aulasService } from '../../../services/aulas'
import { toastErroDeApi } from '../../../utils/toastErro'
import { Ajuda, Botao, Caixa, Data, Estado, Linha, Lista, NaoChamado, Opcoes, Titulo, Topo, Voltar } from './styles'

const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const intervalo = (dia: string) => ({ de: new Date(`${dia}T00:00:00-03:00`).toISOString(), ate: new Date(`${dia}T23:59:59-03:00`).toISOString() })
const hora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export default function OwnerChamada() {
  const { turmaId = '' } = useParams(); const [params] = useSearchParams(); const placeId = params.get('placeId') ?? ''
  const [dia, setDia] = useState(hoje); const [aulaId, setAulaId] = useState(''); const [marcacoes, setMarcacoes] = useState<Record<string, boolean | null>>({})
  const navigate = useNavigate(); const cliente = useQueryClient(); usePageHeader('Chamada', 'Quem veio nesta aula')
  const datas = intervalo(dia)
  const aulas = useQuery({ queryKey: chaves.aulasDaTurma(turmaId, dia), queryFn: () => aulasService.listar(placeId, turmaId, datas.de, datas.ate), enabled: Boolean(placeId && turmaId) })
  const chamada = useQuery({ queryKey: chaves.chamada(aulaId), queryFn: () => aulasService.chamada(placeId, aulaId), enabled: Boolean(placeId && aulaId) })
  useEffect(() => { if (chamada.data) setMarcacoes(Object.fromEntries(chamada.data.alunos.map(a => [a.matriculaId, a.presente]))) }, [chamada.data])
  const salvar = useMutation({ mutationFn: () => aulasService.registrar(placeId, aulaId, Object.entries(marcacoes).filter(([,v]) => v !== null).map(([matriculaId,presente]) => ({ matriculaId, presente: presente! }))), onSuccess: () => { toast.success('Chamada salva.'); void cliente.invalidateQueries({queryKey: chaves.chamada(aulaId)}); void cliente.invalidateQueries({queryKey: chaves.aulasDaTurma(turmaId,dia)}) }, onError: toastErroDeApi })
  const marcadas = Object.values(marcacoes).filter(v => v !== null).length
  return <div><Voltar onClick={() => navigate(`/owner/turmas?placeId=${placeId}`)}><ArrowLeft size={16}/>Voltar para as turmas</Voltar>
    <Caixa><Topo><div><Titulo>Aulas da turma</Titulo><Ajuda>Aulas dadas continuam aqui, para a chamada poder ser corrigida.</Ajuda></div><label>Dia <Data aria-label="Dia" type="date" value={dia} onChange={e=>{setDia(e.target.value);setAulaId('')}}/></label></Topo>
      {/* Ver o comentário em `Owner/Turmas`: consulta desabilitada fica
          `isPending` para sempre, e o `placeId` vem da query string. Sem o
          `!placeId` primeiro, quem abre a URL sem ele lia "Nenhuma aula neste
          dia" — que é pior que o esqueleto, porque afirma algo falso. */}
      {!placeId || !turmaId ? <Estado role="alert">Falta o espaço no endereço. Volte para Turmas e abra a turma por lá.</Estado> : aulas.isPending ? <Estado>Carregando aulas…</Estado> : aulas.data?.length ? <Lista>{aulas.data.map(a => <Linha key={a.id}><span>{hora(a.inicio)}–{hora(a.fim)} · {a.status.toLowerCase()}</span><Botao onClick={()=>setAulaId(a.id)} disabled={a.status==='CANCELADA'}>{a.status==='DADA'?'Corrigir chamada':'Abrir chamada'}</Botao></Linha>)}</Lista> : <Estado>Nenhuma aula neste dia.</Estado>}
    </Caixa>
    {aulaId && <Caixa><Titulo>Alunos</Titulo>{chamada.isPending ? <Estado>Carregando alunos…</Estado> : <Lista>{chamada.data?.alunos.map(a => <Linha key={a.matriculaId}><span><strong>{a.nome}</strong>{marcacoes[a.matriculaId]===null && <NaoChamado> · não chamado</NaoChamado>}</span><Opcoes><label><input type="radio" name={a.matriculaId} checked={marcacoes[a.matriculaId]===true} onChange={()=>setMarcacoes(m=>({...m,[a.matriculaId]:true}))}/>Veio</label><label><input type="radio" name={a.matriculaId} checked={marcacoes[a.matriculaId]===false} onChange={()=>setMarcacoes(m=>({...m,[a.matriculaId]:false}))}/>Faltou</label></Opcoes></Linha>)}</Lista>}<Botao disabled={!marcadas||salvar.isPending} onClick={()=>salvar.mutate(undefined)}>Salvar chamada</Botao></Caixa>}
  </div>
}
