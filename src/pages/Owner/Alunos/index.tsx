import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { turmasService } from '../../../services/turmas'
import { matriculasService } from '../../../services/matriculas'
import { chaves } from '../../../lib/queryClient'
import { toastErroDeApi } from '../../../utils/toastErro'
import { Skeleton } from '../../../components/Skeleton'
import type { Matricula } from '../../../types/api'
import {
  Acoes, Alternador, Botao, BotaoLeve, Caixa, Campo, Contato, Dados, Erro, ErroDoCampo, Explicacao,
  Form, Input, Item, Lista, Lotada, Nome, Ocupacao, Quando, Rotulo, TemConta, TituloDaCaixa, Topo,
  Vazio, Voltar,
} from './styles'

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

/** Espelha o `criarMatriculaSchema` da api, campo a campo. */
const schema = yup.object({
  nome: yup.string().trim().min(2, 'Nome muito curto').required('Informe o nome do aluno'),
  /*
   * `contato` é texto livre, e o mínimo é o da api: 3.
   *
   * Não é validado como telefone nem normalizado para E.164 de propósito — o
   * schema da api o descreve como *"telefone ou e-mail, é o que o dono já tem
   * na agenda dele"*. Exigir formato aqui recusaria "mãe do João — 35 9…", que
   * é exatamente o que está escrito no caderno da academia.
   */
  contato: yup.string().trim().min(3, 'Contato muito curto').required('Informe um contato'),
})

type Formulario = yup.InferType<typeof schema>

const data = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/**
 * Os alunos de uma turma, para o dono (web#391, api#474).
 *
 * ## O aluno sem conta é o caso normal
 *
 * É a decisão que decide a adoção do produto, e está no épico api#444: exigir
 * conta faria o dono só poder usar o Só+1 depois de convencer a turma inteira a
 * se cadastrar — ou seja, nunca. Então a tela pede **nome e contato**, nunca
 * oferece buscar uma conta, e quem tem conta ganha só uma marca discreta.
 *
 * ## Não existe `GET /turmas/:id`
 *
 * A api tem listagem e não tem detalhe. O cabeçalho desta tela sai da **lista**
 * do espaço, pela mesma chave de cache que a tela de turmas já preencheu — quem
 * chega pelo botão "Alunos" não paga requisição nenhuma por isso. Quem chega
 * pela URL direta paga uma, e é a mesma que a outra tela faria.
 */
export default function OwnerAlunos() {
  const { turmaId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const placeId = searchParams.get('placeId') ?? ''
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [comHistorico, setComHistorico] = useState(false)
  const [editando, setEditando] = useState<Matricula | null>(null)

  usePageHeader('Alunos da turma', 'Quem está matriculado — e o aluno não precisa ter conta')

  const turmas = useQuery({
    queryKey: chaves.turmas(placeId),
    queryFn: () => turmasService.listar(placeId),
    enabled: Boolean(placeId),
  })

  const turma = turmas.data?.find((t) => t.id === turmaId)

  const matriculas = useQuery({
    queryKey: chaves.matriculas(turmaId, comHistorico),
    queryFn: () => matriculasService.listar(placeId, turmaId, comHistorico),
    enabled: Boolean(placeId && turmaId),
  })

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Formulario>({
    resolver: yupResolver(schema),
    defaultValues: { nome: '', contato: '' },
  })

  /* Invalida as duas listas — com e sem histórico —, porque as duas mudaram. E
     a contagem da turma também, que é o `matriculasAtivas` do cartão. */
  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ['turmas', turmaId, 'matriculas'] })
    void queryClient.invalidateQueries({ queryKey: chaves.turmas(placeId) })
  }

  const matricular = useMutation({
    mutationFn: (dados: Formulario) => matriculasService.matricular(placeId, turmaId, dados),
    onSuccess: (aluno) => {
      toast.success(`${aluno.nome} entrou na turma.`)
      reset({ nome: '', contato: '' })
      invalidar()
    },
    onError: (err) => toastErroDeApi(err),
  })

  const corrigir = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Formulario }) =>
      matriculasService.corrigir(placeId, turmaId, id, dados),
    onSuccess: () => {
      toast.success('Dados corrigidos.')
      setEditando(null)
      reset({ nome: '', contato: '' })
      invalidar()
    },
    onError: (err) => toastErroDeApi(err),
  })

  const tirar = useMutation({
    mutationFn: (aluno: Matricula) => matriculasService.tirarDaTurma(placeId, turmaId, aluno.id),
    onSuccess: (aluno) => {
      toast.success(`${aluno.nome} saiu da turma. A vaga foi liberada, e o histórico fica.`)
      invalidar()
    },
    onError: (err) => toastErroDeApi(err),
  })

  const comecarEdicao = (aluno: Matricula) => {
    setEditando(aluno)
    setValue('nome', aluno.nome)
    setValue('contato', aluno.contato)
  }

  const cancelarEdicao = () => {
    setEditando(null)
    reset({ nome: '', contato: '' })
  }

  const lotada = turma ? turma.matriculasAtivas >= turma.vagas : false

  return (
    <div>
      <Voltar type="button" onClick={() => navigate(`/owner/turmas?placeId=${placeId}`)}>
        <ArrowLeft size={16} aria-hidden />
        Voltar para as turmas
      </Voltar>

      <Caixa>
        <Topo>
          <div>
            <TituloDaCaixa>
              {turma
                ? `${DIAS[turma.diaDaSemana]} às ${turma.horario} · ${turma.court.name}`
                : 'Turma'}
            </TituloDaCaixa>
            <Explicacao>
              O aluno entra com <strong>nome e contato</strong>. Ele não precisa ter conta no
              Só+1 — a maioria não tem, e isso não muda nada aqui.
            </Explicacao>
          </div>
          {turma && (
            <Ocupacao $lotada={lotada}>
              {turma.matriculasAtivas} / {turma.vagas}
            </Ocupacao>
          )}
        </Topo>

        {lotada && !editando ? (
          <Lotada role="note">
            A turma está lotada: {turma!.vagas} de {turma!.vagas} vagas ocupadas. Para matricular
            mais alguém, tire um aluno da turma ou aumente as vagas na tela de turmas.
          </Lotada>
        ) : (
          <Form
            onSubmit={handleSubmit((dados) =>
              editando ? corrigir.mutate({ id: editando.id, dados }) : matricular.mutate(dados),
            )}
            noValidate
          >
            <Campo>
              <Rotulo htmlFor="nome">Nome do aluno</Rotulo>
              <Input id="nome" placeholder="Joana Ribeiro" $erro={Boolean(errors.nome)} {...register('nome')} />
              {errors.nome && <ErroDoCampo>{errors.nome.message}</ErroDoCampo>}
            </Campo>

            <Campo>
              <Rotulo htmlFor="contato">Contato</Rotulo>
              <Input
                id="contato"
                placeholder="35 99999-1234, um e-mail, ou o que você tiver"
                $erro={Boolean(errors.contato)}
                {...register('contato')}
              />
              {errors.contato && <ErroDoCampo>{errors.contato.message}</ErroDoCampo>}
            </Campo>

            <Acoes>
              <Botao type="submit" disabled={matricular.isPending || corrigir.isPending}>
                <UserPlus size={16} aria-hidden />
                {editando ? 'Salvar' : 'Matricular'}
              </Botao>
              {editando && (
                <BotaoLeve type="button" onClick={cancelarEdicao}>Cancelar</BotaoLeve>
              )}
            </Acoes>
          </Form>
        )}
      </Caixa>

      <Caixa>
        <Topo>
          <TituloDaCaixa>Na turma</TituloDaCaixa>
          <Alternador>
            <input
              type="checkbox"
              checked={comHistorico}
              onChange={(evento) => setComHistorico(evento.target.checked)}
            />
            Mostrar quem já saiu
          </Alternador>
        </Topo>

        {/* Ver o comentário em `Owner/Turmas`: consulta desabilitada fica
            `isPending` para sempre. Aqui o `placeId` vem da query string, e
            quem abre a URL sem ele ficava olhando esqueleto. */}
        {!placeId || !turmaId ? (
          <Erro role="alert">
            Falta o espaço no endereço. Volte para <strong>Turmas</strong> e abra
            a turma por lá.
          </Erro>
        ) : matriculas.isPending ? (
          <Lista aria-busy><Skeleton height="56px" /><Skeleton height="56px" /></Lista>
        ) : matriculas.isError ? (
          <Erro role="alert">Não foi possível carregar os alunos.</Erro>
        ) : matriculas.data.length === 0 ? (
          <Vazio>
            {comHistorico
              ? 'Ninguém passou por esta turma ainda.'
              : 'Nenhum aluno matriculado. Cadastre o primeiro acima — bastam nome e contato.'}
          </Vazio>
        ) : (
          <Lista>
            {matriculas.data.map((aluno) => {
              const saiu = aluno.saiuEm !== null
              return (
                <Item key={aluno.id} $saiu={saiu}>
                  <Dados>
                    <Nome>
                      {aluno.nome}
                      {/* Discreto: ter conta não muda o que dá para fazer aqui. */}
                      {aluno.userId && <> <TemConta>tem conta</TemConta></>}
                    </Nome>
                    <Contato>{aluno.contato}</Contato>
                    <Quando>
                      {saiu
                        ? `saiu em ${data(aluno.saiuEm!)}`
                        : `na turma desde ${data(aluno.entrouEm)}`}
                    </Quando>
                  </Dados>

                  {/* Quem já saiu não recebe ação: tirar de novo é 422
                      MATRICULA_JA_ENCERRADA, porque a segunda data de saída
                      seria mentira. */}
                  {!saiu && (
                    <Acoes>
                      <BotaoLeve type="button" onClick={() => comecarEdicao(aluno)}>
                        Corrigir
                      </BotaoLeve>
                      <BotaoLeve
                        type="button"
                        onClick={() => tirar.mutate(aluno)}
                        disabled={tirar.isPending}
                      >
                        Tirar da turma
                      </BotaoLeve>
                    </Acoes>
                  )}
                </Item>
              )
            })}
          </Lista>
        )}
      </Caixa>
    </div>
  )
}
