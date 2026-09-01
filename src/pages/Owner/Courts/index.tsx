import { useState, useEffect, useCallback } from 'react'
import { usePageHeader, PageActions } from '../../../components/DashboardLayout/pageHeader'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { toastErroDeApi } from '../../../utils/toastErro'
import { ArrowLeft } from 'lucide-react'
import { useSubscription } from '../../../hooks/useSubscription'
import SubscriptionGate from '../../../components/SubscriptionGate'
import { getSportMeta } from '../../../hooks/useSports'
import SportIcon from '../../../components/SportIcon'
import * as courtsService from '../../../services/courts'
import * as placesService from '../../../services/places'
import type { Court, CourtType, Place } from '../../../types/api'
import {
  BackBtn, CourtsGrid, CourtCard, CourtCardHeader, CourtIconBox,
  CourtInfo, CourtName, CourtMeta, StatusBadge, CourtActions, ActionBtn,
  EmptyState, ErrorMsg, NewBtn,
  Modal, ModalOverlay, ModalBox, ModalHeader, ModalTitle,
  Form, FormGroup, Label, Input, Select, FieldError, ModalActions, CancelBtn, SubmitBtn,
} from './styles'

const COURT_TYPES = [
  { value: 'SOCIETY',      label: 'Society' },
  { value: 'CAMPO',        label: 'Campo de Futebol' },
  { value: 'FUTSAL',       label: 'Futsal' },
  { value: 'AREIA',        label: 'Areia (Futevôlei)' },
  { value: 'VOLEI',        label: 'Vôlei Indoor' },
  { value: 'VOLEI_AREIA',  label: 'Vôlei de Areia' },
  { value: 'HANDBALL',     label: 'Handball' },
  { value: 'PETECA',       label: 'Peteca' },
  { value: 'BEACH_TENNIS', label: 'Beach Tennis' },
  { value: 'BASQUETE',     label: 'Basquete' },
  { value: 'TENIS',        label: 'Tênis' },
  { value: 'POKER',        label: 'Poker' },
]

const STATUS_LABEL = { OPEN: 'Aberta', CLOSED: 'Fechada' }
const STATUS_COLOR = { OPEN: '#16a34a', CLOSED: '#6b7280' }
const STATUS_BG    = { OPEN: '#dcfce7', CLOSED: '#f3f4f6' }

const schema = yup.object({
  name:         yup.string().required('Nome obrigatório'),
  type:         yup.string().required('Modalidade obrigatória'),
  pricePerHour: yup.number().typeError('Valor inválido').min(0).nullable().transform((v, o) => (o === '' ? null : v)),
})

type FormValues = yup.InferType<typeof schema>

export default function OwnerCourts() {
  const { placeId } = useParams<{ placeId: string }>()
  const navigate = useNavigate()
  const { sub, isActive, loading: subLoading, podeAlterar } = useSubscription()

  const [place, setPlace]       = useState<Place | null>(null)
  const [courts, setCourts]     = useState<Court[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const [showModal, setShowModal]       = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [toggling, setToggling]         = useState<string | null>(null)
  const [deleting, setDeleting]         = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [placeRes, courtsRes] = await Promise.all([
        placesService.getOne(placeId!),
        courtsService.getCourtsByPlace(placeId!),
      ])
      setPlace(placeRes.data?.data ?? placeRes.data)
      const raw = courtsRes?.data ?? courtsRes
      setCourts(Array.isArray(raw) ? raw : [])
    } catch {
      setError('Não foi possível carregar as quadras.')
    } finally {
      setLoading(false)
    }
  }, [placeId])

  useEffect(() => { fetchData() }, [fetchData])

  function openCreate() {
    setEditingCourt(null)
    // pricePerHour usa null (não '') porque o schema o transforma de '' para
    // null e o tipo inferido é number | null | undefined.
    reset({ name: '', type: 'SOCIETY', pricePerHour: null })
    setShowModal(true)
  }

  function openEdit(court: Court) {
    setEditingCourt(court)
    reset({
      name: court.name,
      type: court.type,
      // Decimal do Prisma chega como string no JSON; o campo do form é number.
      pricePerHour: court.pricePerHour != null ? Number(court.pricePerHour) : null,
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingCourt(null)
    reset()
  }

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true)
    try {
      const payload = {
        name: data.name,
        type: data.type as CourtType,
        ...(data.pricePerHour != null ? { pricePerHour: data.pricePerHour } : {}),
      }
      if (editingCourt) {
        await courtsService.updateCourt(placeId!, editingCourt.id, payload)
        toast.success('Quadra atualizada!')
      } else {
        await courtsService.createCourt(placeId!, payload)
        toast.success('Quadra criada!')
      }
      closeModal()
      await fetchData()
    } catch (err) {
      toastErroDeApi(err, 'Erro ao salvar quadra.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (court: Court) => {
    const next = court.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    setToggling(court.id)
    try {
      await courtsService.updateCourtStatus(placeId!, court.id, next)
      await fetchData()
    } catch (err) {
      toastErroDeApi(err, 'Erro ao alterar status.')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (court: Court) => {
    if (!window.confirm(`Excluir a quadra "${court.name}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(court.id)
    try {
      await courtsService.deleteCourt(placeId!, court.id)
      toast.success('Quadra excluída.')
      await fetchData()
    } catch (err) {
      toastErroDeApi(err, 'Erro ao excluir quadra.')
    } finally {
      setDeleting(null)
    }
  }

  const placeName = place?.name ?? 'Estabelecimento'

  usePageHeader(`Quadras — ${placeName}`, "Gerencie as quadras deste estabelecimento")

  return (
    <>
      {/* Ficava clicável com a assinatura vencida, porque mora fora do
          portão: o conteúdo abaixo era apagado e este botão não. */}
      <PageActions>
        <NewBtn onClick={openCreate} disabled={!podeAlterar}>+ Nova Quadra</NewBtn>
      </PageActions>
      <SubscriptionGate isActive={isActive} loading={subLoading} sub={sub}>
        <BackBtn onClick={() => navigate('/owner/places')}>
          <ArrowLeft size={15} />
          Voltar
        </BackBtn>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        {!loading && courts.length === 0 && !error && (
          <EmptyState>
            Nenhuma quadra cadastrada ainda.
            <br />
            Clique em <strong>+ Nova Quadra</strong> para começar.
          </EmptyState>
        )}

        <CourtsGrid>
          {courts.map((court: Court) => {
            const sport = getSportMeta(court.type)
            return (
              <CourtCard key={court.id}>
                <CourtCardHeader>
                  <CourtIconBox><SportIcon icon={sport.icon} fallback={sport.iconFallback} /></CourtIconBox>
                  <CourtInfo>
                    <CourtName>{court.name}</CourtName>
                    <CourtMeta>
                      {sport.label}
                      {court.pricePerHour != null && ` · R$ ${Number(court.pricePerHour).toFixed(2).replace('.', ',')}/h`}
                    </CourtMeta>
                  </CourtInfo>
                  <StatusBadge bg={STATUS_BG[court.status]} color={STATUS_COLOR[court.status]}>
                    {STATUS_LABEL[court.status] ?? court.status}
                  </StatusBadge>
                </CourtCardHeader>

                <CourtActions>
                  <ActionBtn variant="secondary" onClick={() => openEdit(court)} disabled={!podeAlterar}>
                    Editar
                  </ActionBtn>
                  <ActionBtn
                    variant={court.status === 'OPEN' ? 'danger' : 'success'}
                    onClick={() => handleToggleStatus(court)}
                    disabled={toggling === court.id || !podeAlterar}
                  >
                    {toggling === court.id ? '...' : court.status === 'OPEN' ? 'Fechar' : 'Abrir'}
                  </ActionBtn>
                  <ActionBtn
                    variant="danger"
                    onClick={() => handleDelete(court)}
                    disabled={deleting === court.id || !podeAlterar}
                  >
                    {deleting === court.id ? '...' : 'Excluir'}
                  </ActionBtn>
                </CourtActions>
              </CourtCard>
            )
          })}
        </CourtsGrid>

        {showModal && (
          <Modal>
            <ModalOverlay onClick={closeModal} />
            <ModalBox>
              <ModalHeader>
                <ModalTitle>{editingCourt ? 'Editar Quadra' : 'Nova Quadra'}</ModalTitle>
              </ModalHeader>

              <Form onSubmit={handleSubmit(onSubmit)}>
                <FormGroup>
                  <Label>Nome da Quadra *</Label>
                  <Input {...register('name')} placeholder="Ex.: Quadra 1" />
                  {errors.name && <FieldError>{errors.name.message}</FieldError>}
                </FormGroup>

                <FormGroup>
                  <Label>Modalidade *</Label>
                  <Select {...register('type')}>
                    {COURT_TYPES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                  {errors.type && <FieldError>{errors.type.message}</FieldError>}
                </FormGroup>

                <FormGroup>
                  <Label>Preço por Hora (R$)</Label>
                  <Input
                    {...register('pricePerHour')}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex.: 120.00"
                  />
                  {errors.pricePerHour && <FieldError>{errors.pricePerHour.message}</FieldError>}
                </FormGroup>

                <ModalActions>
                  <CancelBtn type="button" onClick={closeModal}>Cancelar</CancelBtn>
                  <SubmitBtn type="submit" disabled={submitting}>
                    {submitting ? 'Salvando...' : editingCourt ? 'Salvar Alterações' : 'Criar Quadra'}
                  </SubmitBtn>
                </ModalActions>
              </Form>
            </ModalBox>
          </Modal>
        )}
      </SubscriptionGate>
    </>
  )
}
