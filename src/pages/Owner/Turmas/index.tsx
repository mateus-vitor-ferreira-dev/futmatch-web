import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { useAuth } from '../../../contexts/AuthContext'
import { useSports } from '../../../hooks/useSports'
import { turmasService } from '../../../services/turmas'
import * as placesService from '../../../services/places'
import * as courtsService from '../../../services/courts'
import { chaves } from '../../../lib/queryClient'
import { toastErroDeApi } from '../../../utils/toastErro'
import { Skeleton } from '../../../components/Skeleton'
import type { Court, CourtType, Place, Turma } from '../../../types/api'
import {
  Acoes, AcoesDoForm, Aviso, Botao, BotaoLeve, Caixa, Campo, Cartao, Dados, Detalhe, Erro,
  ErroDoCampo, Explicacao, Form, GrupoDoDia, Horario, Input, Lado, Lista, Ocupacao, Rotulo,
  Select, Selo, SemProfessor, SeletorDeEspaco, TituloDaCaixa, TituloDoDia, Topo, Valor, Vazio,
} from './styles'

/**
 * `0 = domingo`, e a ordem é a da api.
 *
 * Mesma convenção do expediente do espaço (api#454) e do `Turma.diaDaSemana`.
 * Um array indexado por 0..6 é o que impede a tradução de escorregar — é o
 * índice que manda, não a posição na frase.
 */
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/

const schema = yup.object({
  courtId: yup.string().required('Escolha a quadra'),
  modalidade: yup.string().required('Escolha a modalidade'),
  diaDaSemana: yup.number().typeError('Escolha o dia').min(0).max(6).required('Escolha o dia'),
  horario: yup.string().matches(HORA, 'Horário inválido — use HH:mm').required('Informe o horário'),
  duracaoMinutos: yup.number().typeError('Informe a duração').integer().positive('Duração inválida').required('Informe a duração'),
  vagas: yup.number().typeError('Informe as vagas').integer().positive('Vagas inválidas').required('Informe as vagas'),
  valorMensalidade: yup.number().typeError('Informe a mensalidade').min(0, 'Valor inválido').required('Informe a mensalidade'),
  /**
   * `""` no `<select>` quer dizer "sem professor".
   *
   * A api espera `null` para isso — string vazia não passa na validação dela.
   * A conversão é da tela, e acontece no `paraApi` abaixo.
   */
  professorId: yup.string().defined(),
})

type Formulario = yup.InferType<typeof schema>

const VAZIO: Formulario = {
  courtId: '', modalidade: '', diaDaSemana: 2, horario: '19:00',
  duracaoMinutos: 60, vagas: 20, valorMensalidade: 0, professorId: '',
}

/**
 * O fim da aula, por aritmética de relógio.
 *
 * Não usa `Date`: `horario` é hora de parede — `"19:00"` na quadra é 19h na
 * quadra — e passar por `Date` traria o fuso do navegador para dentro de uma
 * conta que não tem instante nenhum. É o mesmo motivo pelo qual a api precisou
 * escrever o `horarioDeParede.ts`.
 */
function faixaDeHorario(horario: string, duracaoMinutos: number) {
  const [h, m] = horario.split(':').map(Number)
  const fim = (h * 60 + m + duracaoMinutos) % (24 * 60)
  const doisDigitos = (n: number) => String(n).padStart(2, '0')
  return `${horario} – ${doisDigitos(Math.floor(fim / 60))}:${doisDigitos(fim % 60)}`
}

/** `valorMensalidade` vem string (é `Decimal` na api) — some com `Number` antes. */
const emReais = (valor: string | number) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/**
 * As turmas do espaço, para o dono (web#390, api#472).
 *
 * ## Sem `PlanGate`, na rota e aqui
 *
 * A api deixou estas rotas fora do `requireActiveSubscription` de propósito — a
 * mesma decisão do expediente e do convite de professor. Trancá-las na tela
 * contradiria a api: o dono veria a página de planos para uma coisa que ele já
 * pode fazer.
 *
 * ## Desativar não é apagar
 *
 * Não existe `DELETE` de turma. Turma que já teve aula e matrícula não pode
 * sumir levando a história junto — então o botão diz **Desativar**, a turma
 * continua na lista, esmaecida, e dá para reativar.
 */
export default function OwnerTurmas() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [espacos, setEspacos] = useState<Place[]>([])
  const [placeId, setPlaceId] = useState('')
  const [abrindo, setAbrindo] = useState(false)
  const { sports } = useSports()

  usePageHeader('Turmas', 'O que o seu espaço vende: quadra, dia, horário e mensalidade')

  /* O espaço vem do seletor, e não da rota — menu não carrega parâmetro. O
     `?placeId=` mantém funcionando quem chega por atalho já no espaço certo. */
  useEffect(() => {
    placesService.list().then((resposta) => {
      const meus = user?.role === 'ADMIN'
        ? resposta.data.data
        : resposta.data.data.filter((espaco) => espaco.ownerId === user?.id)
      setEspacos(meus)
      const pedido = searchParams.get('placeId')
      setPlaceId(meus.some((espaco) => espaco.id === pedido) ? pedido! : meus[0]?.id ?? '')
    }).catch(() => setEspacos([]))
  }, [searchParams, user?.id, user?.role])

  const trocarEspaco = (id: string) => {
    setPlaceId(id)
    setSearchParams({ placeId: id })
    setAbrindo(false)
  }

  const turmas = useQuery({
    queryKey: chaves.turmas(placeId),
    queryFn: () => turmasService.listar(placeId),
    enabled: Boolean(placeId),
  })

  const membros = useQuery({
    queryKey: chaves.membrosDoEspaco(placeId),
    queryFn: () => turmasService.membros(placeId),
    enabled: Boolean(placeId),
  })

  const quadras = useQuery({
    queryKey: chaves.quadrasDoEspaco(placeId),
    queryFn: () => courtsService.getCourtsByPlace(placeId).then((envelope) => envelope.data),
    enabled: Boolean(placeId),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Formulario>({
    resolver: yupResolver(schema),
    defaultValues: VAZIO,
  })

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: chaves.turmas(placeId) })
  }

  const cadastrar = useMutation({
    mutationFn: (dados: Formulario) => turmasService.cadastrar(placeId, {
      courtId: dados.courtId,
      modalidade: dados.modalidade as CourtType,
      diaDaSemana: Number(dados.diaDaSemana),
      horario: dados.horario,
      duracaoMinutos: Number(dados.duracaoMinutos),
      vagas: Number(dados.vagas),
      valorMensalidade: Number(dados.valorMensalidade),
      // `""` é "sem professor", e a api quer `null`.
      professorId: dados.professorId === '' ? null : dados.professorId,
    }),
    onSuccess: (turma) => {
      toast.success(`Turma de ${DIAS[turma.diaDaSemana].toLowerCase()} às ${turma.horario} cadastrada.`)
      reset(VAZIO)
      setAbrindo(false)
      invalidar()
    },
    onError: (err) => toastErroDeApi(err),
  })

  /**
   * Editar e desativar são o mesmo `PATCH`.
   *
   * Manda **só** o que mudou: a api recusa corpo vazio (`ao-menos-um`), e
   * mandar o resto junto reescreveria campo que ninguém tocou.
   */
  const alternarAtiva = useMutation({
    mutationFn: ({ turma }: { turma: Turma }) =>
      turmasService.atualizar(placeId, turma.id, { ativa: !turma.ativa }),
    onSuccess: (turma) => {
      toast.success(turma.ativa
        ? 'Turma reativada — a quadra volta a ficar ocupada nesse horário.'
        : 'Turma desativada. Ela continua no histórico, e a quadra ficou livre.')
      invalidar()
    },
    onError: (err) => toastErroDeApi(err),
  })

  const tirarProfessor = useMutation({
    mutationFn: (turma: Turma) => turmasService.atualizar(placeId, turma.id, { professorId: null }),
    onSuccess: () => {
      toast.success('Professor removido da turma. A turma continua como está.')
      invalidar()
    },
    onError: (err) => toastErroDeApi(err),
  })

  const rotuloDaModalidade = (tipo: CourtType) =>
    sports.find((s) => s.id === tipo)?.label ?? tipo

  /* A api já entrega ordenada por dia e horário; agrupar só quebra a lista onde
     o dia vira, sem reordenar nada. */
  const porDia = useMemo(() => {
    const grupos = new Map<number, Turma[]>()
    for (const turma of turmas.data ?? []) {
      const lista = grupos.get(turma.diaDaSemana) ?? []
      lista.push(turma)
      grupos.set(turma.diaDaSemana, lista)
    }
    return [...grupos.entries()]
  }, [turmas.data])

  const nomeDoEspaco = espacos.find((espaco) => espaco.id === placeId)?.name
  const semQuadra = quadras.isSuccess && quadras.data.length === 0
  const semProfessor = membros.isSuccess && membros.data.length === 0

  return (
    <div>
      <SeletorDeEspaco
        aria-label="Estabelecimento"
        value={placeId}
        onChange={(evento) => trocarEspaco(evento.target.value)}
      >
        {espacos.length === 0 && <option value="">Nenhum estabelecimento</option>}
        {espacos.map((espaco) => (
          <option key={espaco.id} value={espaco.id}>{espaco.name}</option>
        ))}
      </SeletorDeEspaco>

      <Caixa>
        <Topo>
          <div>
            <TituloDaCaixa>
              Cadastrar turma{nomeDoEspaco ? ` em ${nomeDoEspaco}` : ''}
            </TituloDaCaixa>
            <Explicacao>
              A turma é a regra — <strong>toda</strong> terça às 19h, e não uma terça
              específica. Quem ocupa a quadra é cada aula gerada a partir dela.
            </Explicacao>
          </div>
          {!abrindo && (
            <Botao type="button" onClick={() => setAbrindo(true)} disabled={!placeId || semQuadra}>
              <Plus size={16} aria-hidden />
              Nova turma
            </Botao>
          )}
        </Topo>

        {semQuadra && (
          <Vazio>
            Este espaço ainda não tem quadra cadastrada, e a turma precisa de uma.
            Cadastre a primeira em <strong>Meus Estabelecimentos</strong>.
          </Vazio>
        )}

        {abrindo && !semQuadra && (
          <Form onSubmit={handleSubmit((dados) => cadastrar.mutate(dados))} noValidate>
            <Campo>
              <Rotulo htmlFor="courtId">Quadra</Rotulo>
              <Select id="courtId" $erro={Boolean(errors.courtId)} {...register('courtId')}>
                <option value="">Escolha a quadra</option>
                {(quadras.data ?? []).map((quadra: Court) => (
                  <option key={quadra.id} value={quadra.id}>{quadra.name}</option>
                ))}
              </Select>
              {errors.courtId && <ErroDoCampo>{errors.courtId.message}</ErroDoCampo>}
            </Campo>

            <Campo>
              <Rotulo htmlFor="modalidade">Modalidade</Rotulo>
              <Select id="modalidade" $erro={Boolean(errors.modalidade)} {...register('modalidade')}>
                <option value="">Escolha a modalidade</option>
                {sports.map((esporte) => (
                  <option key={esporte.id} value={esporte.id}>{esporte.label}</option>
                ))}
              </Select>
              {errors.modalidade && <ErroDoCampo>{errors.modalidade.message}</ErroDoCampo>}
            </Campo>

            <Campo>
              <Rotulo htmlFor="diaDaSemana">Dia da semana</Rotulo>
              <Select id="diaDaSemana" $erro={Boolean(errors.diaDaSemana)} {...register('diaDaSemana')}>
                {DIAS.map((dia, indice) => (
                  <option key={dia} value={indice}>{dia}</option>
                ))}
              </Select>
              {errors.diaDaSemana && <ErroDoCampo>{errors.diaDaSemana.message}</ErroDoCampo>}
            </Campo>

            <Campo>
              <Rotulo htmlFor="horario">Horário</Rotulo>
              <Input id="horario" type="time" $erro={Boolean(errors.horario)} {...register('horario')} />
              {errors.horario && <ErroDoCampo>{errors.horario.message}</ErroDoCampo>}
            </Campo>

            <Campo>
              <Rotulo htmlFor="duracaoMinutos">Duração (min)</Rotulo>
              <Input id="duracaoMinutos" type="number" min={1} $erro={Boolean(errors.duracaoMinutos)} {...register('duracaoMinutos')} />
              {errors.duracaoMinutos && <ErroDoCampo>{errors.duracaoMinutos.message}</ErroDoCampo>}
            </Campo>

            <Campo>
              <Rotulo htmlFor="vagas">Vagas</Rotulo>
              <Input id="vagas" type="number" min={1} $erro={Boolean(errors.vagas)} {...register('vagas')} />
              {errors.vagas && <ErroDoCampo>{errors.vagas.message}</ErroDoCampo>}
            </Campo>

            <Campo>
              <Rotulo htmlFor="valorMensalidade">Mensalidade (R$)</Rotulo>
              <Input id="valorMensalidade" type="number" min={0} step="0.01" $erro={Boolean(errors.valorMensalidade)} {...register('valorMensalidade')} />
              {errors.valorMensalidade && <ErroDoCampo>{errors.valorMensalidade.message}</ErroDoCampo>}
            </Campo>

            <Campo>
              <Rotulo htmlFor="professorId">Professor</Rotulo>
              <Select id="professorId" {...register('professorId')}>
                <option value="">Sem professor por enquanto</option>
                {(membros.data ?? []).map((membro) => (
                  <option key={membro.id} value={membro.id}>{membro.user.name}</option>
                ))}
              </Select>
              {semProfessor && (
                <ErroDoCampo as="span">
                  Ninguém tem vínculo de professor aqui ainda — convide em Professores.
                </ErroDoCampo>
              )}
            </Campo>

            <Aviso role="note">
              Cadastrar já <strong>ocupa a quadra</strong> nesse horário pelas próximas 8 semanas.
              Ninguém consegue marcar partida por cima, e desativar a turma devolve a quadra.
            </Aviso>

            <AcoesDoForm>
              <Botao type="submit" disabled={cadastrar.isPending}>
                {cadastrar.isPending ? 'Cadastrando…' : 'Cadastrar turma'}
              </Botao>
              <BotaoLeve type="button" onClick={() => { setAbrindo(false); reset(VAZIO) }}>
                <X size={14} aria-hidden />
                Cancelar
              </BotaoLeve>
            </AcoesDoForm>
          </Form>
        )}
      </Caixa>

      <Caixa>
        <TituloDaCaixa>Turmas cadastradas</TituloDaCaixa>
        <Explicacao>Do domingo para o sábado, na ordem em que acontecem.</Explicacao>

        {turmas.isPending ? (
          <Lista aria-busy><Skeleton height="72px" /><Skeleton height="72px" /></Lista>
        ) : turmas.isError ? (
          <Erro role="alert">Não foi possível carregar as turmas.</Erro>
        ) : turmas.data.length === 0 ? (
          <Vazio>
            Nenhuma turma ainda. Cadastre a primeira acima — é o que o seu espaço
            vende: um grupo fixo, no mesmo dia e horário, com mensalidade.
          </Vazio>
        ) : (
          <Lista>
            {porDia.map(([dia, doDia]) => (
              <GrupoDoDia key={dia}>
                <TituloDoDia>{DIAS[dia]}</TituloDoDia>
                <Lista>
                  {doDia.map((turma) => {
                    const lotada = turma.matriculasAtivas >= turma.vagas
                    return (
                      <li key={turma.id}>
                        <Cartao $inativa={!turma.ativa}>
                          <Dados>
                            <Horario>{faixaDeHorario(turma.horario, turma.duracaoMinutos)}</Horario>
                            <Detalhe>
                              {rotuloDaModalidade(turma.modalidade)} · {turma.court.name}
                              {!turma.ativa && <> · <Selo>Inativa</Selo></>}
                            </Detalhe>
                            {turma.professor
                              ? <Detalhe>Prof. {turma.professor.user.name}</Detalhe>
                              : <SemProfessor>Sem professor</SemProfessor>}
                          </Dados>

                          <Lado>
                            <Ocupacao
                              $lotada={lotada}
                              title={lotada ? 'Turma lotada' : `${turma.vagas - turma.matriculasAtivas} vaga(s) livre(s)`}
                            >
                              {turma.matriculasAtivas} / {turma.vagas}
                            </Ocupacao>
                            <Valor>{emReais(turma.valorMensalidade)}/mês</Valor>
                            <Acoes>
                              {turma.professor && (
                                <BotaoLeve
                                  type="button"
                                  onClick={() => tirarProfessor.mutate(turma)}
                                  disabled={tirarProfessor.isPending}
                                >
                                  Tirar professor
                                </BotaoLeve>
                              )}
                              <BotaoLeve
                                type="button"
                                onClick={() => alternarAtiva.mutate({ turma })}
                                disabled={alternarAtiva.isPending}
                              >
                                {turma.ativa ? 'Desativar' : 'Reativar'}
                              </BotaoLeve>
                            </Acoes>
                          </Lado>
                        </Cartao>
                      </li>
                    )
                  })}
                </Lista>
              </GrupoDoDia>
            ))}
          </Lista>
        )}
      </Caixa>
    </div>
  )
}
