import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { Plus, RefreshCcw, Undo2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import SubscriptionGate from '../../../components/SubscriptionGate'
import { useAuth } from '../../../contexts/AuthContext'
import { useSubscription } from '../../../hooks/useSubscription'
import { getSportMeta } from '../../../hooks/useSports'
import * as placesService from '../../../services/places'
import * as equipmentService from '../../../services/equipmentService'
import { toastErroDeApi } from '../../../utils/toastErro'
import type {
  CourtType,
  Equipment,
  EquipmentBorrower,
  EquipmentCondition,
  EquipmentLoan,
  EquipmentPelada,
  EquipmentSettlementType,
  Place,
} from '../../../types/api'
import {
  Badge, Card, CardActions, CardTitle, CardTop, Empty, ErrorBox, Field, Form, Grid, Help,
  Input, LoanInfo, Meta, Modal, ModalActions, ModalBox, ModalTitle, Overlay, PrimaryButton,
  Quantity, SecondaryButton, SectionHeader, SectionHint, SectionTitle, Select, SummaryCard,
  SummaryGrid, SummaryLabel, SummaryValue, Textarea, Timeline, TimelineItem, Toolbar, ToolbarActions,
} from './styles'

const CONDITIONS: Array<{ value: EquipmentCondition; label: string }> = [
  { value: 'BOM', label: 'Bom estado' },
  { value: 'DESGASTADO', label: 'Desgastado' },
  { value: 'MANUTENCAO', label: 'Em manutenção' },
  { value: 'INATIVO', label: 'Inativo' },
]

const MODALITIES: CourtType[] = [
  'SOCIETY', 'CAMPO', 'FUTSAL', 'AREIA', 'VOLEI', 'VOLEI_AREIA', 'HANDBALL',
  'PETECA', 'BEACH_TENNIS', 'BASQUETE', 'TENIS', 'POKER',
]

const CONDITION_TONE: Record<EquipmentCondition, 'green' | 'orange' | 'gray' | 'red'> = {
  BOM: 'green', DESGASTADO: 'orange', MANUTENCAO: 'red', INATIVO: 'gray',
}

const SETTLEMENT_LABEL: Record<EquipmentSettlementType, string> = {
  DEVOLUCAO: 'Devolução', PERDA: 'Perda', QUEBRA: 'Quebra',
}

function elapsed(date: string) {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 3_600_000))
  if (hours < 1) return 'há menos de 1 hora'
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`
}

function localDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date))
}

export default function OwnerEquipment() {
  const { user } = useAuth()
  const { sub, isActive, loading: subLoading, podeAlterar } = useSubscription()
  const [searchParams, setSearchParams] = useSearchParams()
  const [places, setPlaces] = useState<Place[]>([])
  const [placeId, setPlaceId] = useState(searchParams.get('placeId') ?? '')
  const [items, setItems] = useState<Equipment[]>([])
  const [loans, setLoans] = useState<EquipmentLoan[]>([])
  const [peladas, setPeladas] = useState<EquipmentPelada[]>([])
  const [borrowers, setBorrowers] = useState<EquipmentBorrower[]>([])
  const [borrowerSearch, setBorrowerSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [itemModal, setItemModal] = useState<Equipment | 'new' | null>(null)
  const [loanModal, setLoanModal] = useState<Equipment | null>(null)
  const [settlementModal, setSettlementModal] = useState<EquipmentLoan | null>(null)

  useEffect(() => {
    placesService.list().then((response) => {
      const available = user?.role === 'ADMIN'
        ? response.data.data
        : response.data.data.filter((place) => place.ownerId === user?.id)
      setPlaces(available)
      const requested = searchParams.get('placeId')
      const selected = available.some((place) => place.id === requested) ? requested! : available[0]?.id ?? ''
      setPlaceId(selected)
    }).catch(() => setError('Não foi possível carregar seus estabelecimentos.'))
  }, [searchParams, user?.id, user?.role])

  const refresh = useCallback(async () => {
    if (!placeId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const [loadedItems, loadedLoans, loadedPeladas] = await Promise.all([
        equipmentService.listItems(placeId),
        equipmentService.listLoans(placeId, 'all'),
        equipmentService.listPeladas(placeId),
      ])
      setItems(loadedItems)
      setLoans(loadedLoans)
      setPeladas(loadedPeladas)
    } catch {
      setError('Não foi possível carregar os equipamentos deste estabelecimento.')
    } finally {
      setLoading(false)
    }
  }, [placeId])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!placeId || !loanModal) return
    const timer = window.setTimeout(() => {
      equipmentService.searchBorrowers(placeId, borrowerSearch)
        .then(setBorrowers)
        .catch(() => setBorrowers([]))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [borrowerSearch, loanModal, placeId])

  const pendingLoans = useMemo(() => loans.filter((loan) => loan.quantidadePendente > 0), [loans])
  const total = items.reduce((sum, item) => sum + item.quantidadeTotal, 0)
  const available = items.reduce((sum, item) => sum + item.quantidadeDisponivel, 0)
  const outside = items.reduce((sum, item) => sum + item.quantidadeFora, 0)

  function changePlace(next: string) {
    setPlaceId(next)
    setSearchParams({ placeId: next })
  }

  async function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const current = itemModal
    if (!current) return
    const data = new FormData(event.currentTarget)
    setSaving(true)
    try {
      const payload = {
        nome: String(data.get('nome') ?? '').trim(),
        modalidade: (String(data.get('modalidade') ?? '') || null) as CourtType | null,
        estado: String(data.get('estado')) as EquipmentCondition,
      }
      if (current === 'new') {
        await equipmentService.createItem(placeId, {
          ...payload,
          quantidadeTotal: Number(data.get('quantidadeTotal')),
        })
        toast.success('Equipamento cadastrado.')
      } else {
        await equipmentService.updateItem(placeId, current.id, payload)
        toast.success('Equipamento atualizado.')
      }
      setItemModal(null)
      await refresh()
    } catch (err) {
      toastErroDeApi(err, 'Não foi possível salvar o equipamento.')
    } finally { setSaving(false) }
  }

  async function submitLoan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!loanModal) return
    const data = new FormData(event.currentTarget)
    setSaving(true)
    try {
      await equipmentService.createLoan(placeId, {
        equipmentId: loanModal.id,
        borrowerId: String(data.get('borrowerId')),
        peladaId: String(data.get('peladaId') ?? '') || null,
        quantidade: Number(data.get('quantidade')),
        observacao: String(data.get('observacao') ?? '') || null,
      })
      toast.success('Saída registrada.')
      setLoanModal(null)
      setBorrowerSearch('')
      await refresh()
    } catch (err) {
      toastErroDeApi(err, 'Não foi possível registrar a saída.')
    } finally { setSaving(false) }
  }

  async function submitSettlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!settlementModal) return
    const data = new FormData(event.currentTarget)
    setSaving(true)
    try {
      const tipo = String(data.get('tipo')) as EquipmentSettlementType
      await equipmentService.settleLoan(placeId, settlementModal.id, {
        tipo,
        quantidade: Number(data.get('quantidade')),
        observacao: String(data.get('observacao') ?? '') || null,
      })
      toast.success(tipo === 'DEVOLUCAO' ? 'Devolução registrada.' : 'Baixa registrada no histórico.')
      setSettlementModal(null)
      await refresh()
    } catch (err) {
      toastErroDeApi(err, 'Não foi possível registrar a devolução ou baixa.')
    } finally { setSaving(false) }
  }

  const selectedPlace = places.find((place) => place.id === placeId)

  usePageHeader("Equipamentos", "Controle o que saiu, voltou, quebrou ou foi perdido")

  return (
    <>
      <SubscriptionGate isActive={isActive} loading={subLoading} sub={sub}>
        <Toolbar>
          <Select aria-label="Estabelecimento" value={placeId} onChange={(event) => changePlace(event.target.value)}>
            {places.length === 0 && <option value="">Nenhum estabelecimento</option>}
            {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
          </Select>
          <ToolbarActions>
            <SecondaryButton type="button" onClick={refresh} disabled={!placeId || loading}><RefreshCcw size={16} /> Atualizar</SecondaryButton>
            <PrimaryButton type="button" onClick={() => setItemModal('new')} disabled={!placeId || !podeAlterar}><Plus size={17} /> Novo equipamento</PrimaryButton>
          </ToolbarActions>
        </Toolbar>

        {error && <ErrorBox>{error}</ErrorBox>}
        {!placeId && !loading && <Empty>Cadastre ou selecione um estabelecimento para controlar equipamentos.</Empty>}

        {placeId && (
          <>
            <SummaryGrid>
              <SummaryCard><SummaryLabel>Total no armário e fora</SummaryLabel><SummaryValue>{total}</SummaryValue></SummaryCard>
              <SummaryCard><SummaryLabel>Disponíveis agora</SummaryLabel><SummaryValue>{available}</SummaryValue></SummaryCard>
              <SummaryCard $warning={outside > 0}><SummaryLabel>Fora agora</SummaryLabel><SummaryValue>{outside}</SummaryValue></SummaryCard>
            </SummaryGrid>

            <SectionHeader>
              <div><SectionTitle>Pendências</SectionTitle><SectionHint>Quem levou, o que falta e há quanto tempo</SectionHint></div>
            </SectionHeader>
            {!loading && pendingLoans.length === 0 && <Empty>Nada pendente em {selectedPlace?.name ?? 'este estabelecimento'}.</Empty>}
            <Grid>
              {pendingLoans.map((loan) => (
                <Card key={loan.id} $attention>
                  <CardTop>
                    <div><CardTitle>{loan.equipment.nome}</CardTitle><Meta>Saíram {loan.quantidadeEmprestada} · faltam {loan.quantidadePendente}</Meta></div>
                    <Badge $tone="orange">{elapsed(loan.emprestadoEm)}</Badge>
                  </CardTop>
                  <LoanInfo>
                    <strong>{loan.borrower.nickname || loan.borrower.name}</strong><br />
                    {loan.pelada ? `${loan.pelada.court?.name ?? 'Partida'} · ${localDate(loan.pelada.date)}` : 'Sem partida vinculada'}
                    {loan.observacao && <><br />{loan.observacao}</>}
                  </LoanInfo>
                  <CardActions><PrimaryButton type="button" onClick={() => setSettlementModal(loan)} disabled={!podeAlterar}><Undo2 size={16} /> Devolver / baixar</PrimaryButton></CardActions>
                </Card>
              ))}
            </Grid>

            <SectionHeader>
              <div><SectionTitle>Equipamentos</SectionTitle><SectionHint>Disponível versus total cadastrado</SectionHint></div>
            </SectionHeader>
            {!loading && items.length === 0 && <Empty>Nenhum equipamento cadastrado. Use “Novo equipamento” para começar.</Empty>}
            <Grid>
              {items.map((item) => (
                <Card key={item.id}>
                  <CardTop>
                    <div><CardTitle>{item.nome}</CardTitle><Meta>{item.modalidade ? getSportMeta(item.modalidade).label : 'Sem modalidade'}</Meta></div>
                    <Badge $tone={CONDITION_TONE[item.estado]}>{CONDITIONS.find((entry) => entry.value === item.estado)?.label}</Badge>
                  </CardTop>
                  <Quantity><strong>{item.quantidadeDisponivel}</strong> disponíveis de {item.quantidadeTotal}</Quantity>
                  <CardActions>
                    <SecondaryButton type="button" onClick={() => setItemModal(item)} disabled={!podeAlterar}>Editar</SecondaryButton>
                    <PrimaryButton type="button" onClick={() => setLoanModal(item)} disabled={!podeAlterar || item.quantidadeDisponivel < 1 || ['MANUTENCAO', 'INATIVO'].includes(item.estado)}>Registrar saída</PrimaryButton>
                  </CardActions>
                </Card>
              ))}
            </Grid>

            <SectionHeader>
              <div><SectionTitle>Histórico</SectionTitle><SectionHint>Devoluções, perdas e quebras ficam auditáveis</SectionHint></div>
              <SecondaryButton type="button" onClick={() => setShowHistory((value) => !value)}>{showHistory ? 'Ocultar' : 'Mostrar'}</SecondaryButton>
            </SectionHeader>
            {showHistory && (
              <Grid>
                {loans.length === 0 && <Empty>Nenhuma movimentação registrada.</Empty>}
                {loans.map((loan) => (
                  <Card key={`history-${loan.id}`}>
                    <CardTop><div><CardTitle>{loan.equipment.nome}</CardTitle><Meta>{loan.borrower.nickname || loan.borrower.name} · {localDate(loan.emprestadoEm)}</Meta></div><Badge $tone={loan.encerradoEm ? 'green' : 'orange'}>{loan.encerradoEm ? 'Encerrado' : `${loan.quantidadePendente} pendente`}</Badge></CardTop>
                    <Timeline>
                      <TimelineItem>Saída de {loan.quantidadeEmprestada} por {loan.createdBy.name}</TimelineItem>
                      {loan.settlements.map((entry) => <TimelineItem key={entry.id}>{SETTLEMENT_LABEL[entry.tipo]} de {entry.quantidade} · {localDate(entry.createdAt)}{entry.observacao ? ` — ${entry.observacao}` : ''}</TimelineItem>)}
                    </Timeline>
                  </Card>
                ))}
              </Grid>
            )}
          </>
        )}
      </SubscriptionGate>

      {itemModal && (
        <Modal role="dialog" aria-modal="true" aria-label={itemModal === 'new' ? 'Novo equipamento' : 'Editar equipamento'}>
          <Overlay type="button" aria-label="Fechar" onClick={() => setItemModal(null)} />
          <ModalBox>
            <ModalTitle>{itemModal === 'new' ? 'Novo equipamento' : 'Editar equipamento'}</ModalTitle>
            <Meta>Cadastre por quantidade; não é necessário numerar cada unidade.</Meta>
            <Form onSubmit={submitItem}>
              <Field>Nome<Input name="nome" required maxLength={100} defaultValue={itemModal === 'new' ? '' : itemModal.nome} placeholder="Ex.: Bola de beach tennis" /></Field>
              <Field>Modalidade<Select name="modalidade" defaultValue={itemModal === 'new' ? '' : itemModal.modalidade ?? ''}><option value="">Sem modalidade</option>{MODALITIES.map((type) => <option key={type} value={type}>{getSportMeta(type).label}</option>)}</Select></Field>
              {itemModal === 'new' ? <Field>Quantidade total<Input name="quantidadeTotal" type="number" min={1} step={1} required defaultValue={1} /></Field> : <Help>Total atual: {itemModal.quantidadeTotal}. Perdas e quebras devem ser lançadas na pendência correspondente.</Help>}
              <Field>Estado<Select name="estado" defaultValue={itemModal === 'new' ? 'BOM' : itemModal.estado}>{CONDITIONS.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}</Select></Field>
              <ModalActions><SecondaryButton type="button" onClick={() => setItemModal(null)}>Cancelar</SecondaryButton><PrimaryButton type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</PrimaryButton></ModalActions>
            </Form>
          </ModalBox>
        </Modal>
      )}

      {loanModal && (
        <Modal role="dialog" aria-modal="true" aria-label="Registrar saída">
          <Overlay type="button" aria-label="Fechar" onClick={() => setLoanModal(null)} />
          <ModalBox>
            <ModalTitle>Registrar saída</ModalTitle><Meta>{loanModal.nome} · {loanModal.quantidadeDisponivel} disponíveis agora</Meta>
            <Form onSubmit={submitLoan}>
              <Field>Buscar quem levou<Input value={borrowerSearch} onChange={(event) => setBorrowerSearch(event.target.value)} placeholder="Nome ou apelido" /></Field>
              <Field>Quem levou<Select name="borrowerId" required defaultValue=""><option value="" disabled>Selecione a pessoa</option>{borrowers.map((person) => <option key={person.id} value={person.id}>{person.nickname ? `${person.nickname} (${person.name})` : person.name}</option>)}</Select></Field>
              <Field>Quantidade<Input name="quantidade" type="number" min={1} max={loanModal.quantidadeDisponivel} step={1} defaultValue={1} required /></Field>
              <Field>Partida (opcional)<Select name="peladaId" defaultValue=""><option value="">Sem vínculo com partida</option>{peladas.map((pelada) => <option key={pelada.id} value={pelada.id}>{pelada.court.name} · {localDate(pelada.date)}</option>)}</Select></Field>
              <Field>Observação<Textarea name="observacao" maxLength={300} placeholder="Ex.: Material entregue ao organizador" /></Field>
              <ModalActions><SecondaryButton type="button" onClick={() => setLoanModal(null)}>Cancelar</SecondaryButton><PrimaryButton type="submit" disabled={saving}>{saving ? 'Registrando…' : 'Confirmar saída'}</PrimaryButton></ModalActions>
            </Form>
          </ModalBox>
        </Modal>
      )}

      {settlementModal && (
        <Modal role="dialog" aria-modal="true" aria-label="Devolver ou baixar equipamento">
          <Overlay type="button" aria-label="Fechar" onClick={() => setSettlementModal(null)} />
          <ModalBox>
            <ModalTitle>Resolver pendência</ModalTitle><Meta>{settlementModal.equipment.nome} com {settlementModal.borrower.nickname || settlementModal.borrower.name} · {settlementModal.quantidadePendente} pendentes</Meta>
            <Form onSubmit={submitSettlement}>
              <Field>O que aconteceu?<Select name="tipo" defaultValue="DEVOLUCAO"><option value="DEVOLUCAO">Devolução</option><option value="PERDA">Perda</option><option value="QUEBRA">Quebra</option></Select><Help>Perda ou quebra reduz a quantidade total e fica registrada no histórico.</Help></Field>
              <Field>Quantidade<Input name="quantidade" type="number" min={1} max={settlementModal.quantidadePendente} step={1} defaultValue={settlementModal.quantidadePendente} required /><Help>Pode devolver só uma parte agora; o restante continua pendente.</Help></Field>
              <Field>Observação<Textarea name="observacao" maxLength={300} placeholder="Opcional" /></Field>
              <ModalActions><SecondaryButton type="button" onClick={() => setSettlementModal(null)}>Cancelar</SecondaryButton><PrimaryButton type="submit" disabled={saving}>{saving ? 'Registrando…' : 'Confirmar'}</PrimaryButton></ModalActions>
            </Form>
          </ModalBox>
        </Modal>
      )}
    </>
  )
}
