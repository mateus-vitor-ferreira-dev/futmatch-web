import { useState, useEffect, useCallback } from 'react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { toastErroDeApi } from '../../../utils/toastErro'
import StatCard from '../../../components/StatCard'
import SubscriptionGate from '../../../components/SubscriptionGate'
import { useAuth } from '../../../contexts/AuthContext'
import { useSubscription } from '../../../hooks/useSubscription'
import * as placesService from '../../../services/places'
import type { PlaceInput } from '../../../services/places'
import type { Place } from '../../../types/api'
import {
  StatsRow, PlaceGrid, PlaceCard, PlaceCardHeader, PlaceInfo,
  PlaceName, PlaceMeta, StatusBadge, PlaceDesc, PlaceActions,
  ActionBtn, EmptyState, ErrorMsg,
  Modal, ModalOverlay, ModalBox, ModalHeader, ModalTitle,
  Form, FormGroup, Label, Input, FieldError, ModalActions, CancelBtn, SubmitBtn,
} from './styles'

const editSchema = yup.object({
  name:         yup.string().required('Nome obrigatório'),
  city:         yup.string(),
  neighborhood: yup.string(),
  street:       yup.string(),
  number:       yup.string(),
  complement:   yup.string(),
})

const STATUS_LABEL = { OPEN: 'Aberto', CLOSED: 'Fechado' }
const STATUS_COLOR = { OPEN: '#16a34a', CLOSED: '#6b7280' }
const STATUS_BG    = { OPEN: '#dcfce7', CLOSED: '#f3f4f6' }

export default function OwnerPlaces() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { sub, isActive, loading: subLoading, podeAlterar } = useSubscription()
  const [places, setPlaces]   = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [toggling, setToggling]       = useState<string | null>(null)
  const [editingPlace, setEditingPlace] = useState<Place | null>(null)
  const [saving, setSaving]             = useState(false)

  const { register: regEdit, handleSubmit: handleEdit, reset: resetEdit, formState: { errors: editErrors } } = useForm({
    resolver: yupResolver(editSchema),
  })

  const fetchPlaces = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await placesService.list()
      const mine = res.data.data.filter((p) => p.ownerId === user?.id)
      setPlaces(mine)
    } catch {
      setError('Não foi possível carregar seus estabelecimentos.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchPlaces() }, [fetchPlaces])

  function openEdit(place: Place) {
    setEditingPlace(place)
    resetEdit({
      name:         place.name         ?? '',
      city:         place.city         ?? '',
      neighborhood: place.neighborhood ?? '',
      street:       place.street       ?? '',
      number:       place.number       ?? '',
      complement:   place.complement   ?? '',
    })
  }

  function closeEdit() {
    setEditingPlace(null)
    resetEdit()
  }

  const onEditSubmit = async (data: Partial<PlaceInput>) => {
    setSaving(true)
    try {
      await placesService.update(editingPlace!.id, data)
      toast.success('Estabelecimento atualizado!')
      closeEdit()
      await fetchPlaces()
    } catch (err) {
      toastErroDeApi(err, 'Erro ao atualizar estabelecimento.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (place: Place) => {
    const next = place.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    setToggling(place.id)
    try {
      await placesService.updateStatus(place.id, next)
      await fetchPlaces()
    } catch (err) {
      toastErroDeApi(err, 'Erro ao alterar status.')
    } finally {
      setToggling(null)
    }
  }

  const totalCourts = places.reduce((acc, p) => acc + (p._count?.courts ?? 0), 0)

  /*
   * ⚠️ Estes dois indicadores nunca tiveram dado real:
   *
   * - `_count.events` não existe no retorno de GET /places — o include do
   *   backend só conta `courts`. O total de partidas sempre soma 0.
   * - `averageRating` não existe no modelo Place. A média sempre resulta
   *   "0.0", nunca '—', porque places.length é > 0 quando há estabelecimentos.
   *
   * Mantidos como estão para não alterar a UI nesta migração; corrigir exige
   * o backend passar a devolver os campos (ou remover os cards).
   */
  const totalEvents = places.reduce((acc, p) => acc + ((p._count as { events?: number })?.events ?? 0), 0)
  const avgRating   = places.length
    ? (places.reduce((acc, p) => acc + ((p as { averageRating?: number }).averageRating ?? 0), 0) / places.length).toFixed(1)
    : '—'

  usePageHeader("Meus Estabelecimentos", "Gerencie seus locais, quadras e status de cada estabelecimento")

  return (
    <>
      <SubscriptionGate isActive={isActive} loading={subLoading} sub={sub}>
      <StatsRow>
        <StatCard label="Estabelecimentos" value={places.length} accent="#f59e0b" />
        <StatCard label="Quadras"          value={totalCourts}   accent="#22c55e" />
        <StatCard label="Partidas Ativas"  value={totalEvents}   accent="#3b82f6" />
        <StatCard label="Avaliação Média"  value={avgRating ? `${avgRating} ⭐` : '—'} accent="#f59e0b" />
      </StatsRow>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {!loading && places.length === 0 && !error && (
        <EmptyState>
          Você ainda não possui estabelecimentos cadastrados.
          <br />
          Envie uma solicitação para o Admin em <strong>Solicitações</strong>.
        </EmptyState>
      )}

      <PlaceGrid>
        {places.map((place: Place) => (
          <PlaceCard key={place.id}>
            <PlaceCardHeader>
              <PlaceInfo>
                <PlaceName>{place.name}</PlaceName>
                <PlaceMeta>
                  {place.city && `${place.city}`}
                  {place._count?.courts != null && ` · ${place._count.courts} quadra(s)`}
                </PlaceMeta>
              </PlaceInfo>
              <StatusBadge bg={STATUS_BG[place.status]} color={STATUS_COLOR[place.status]}>
                {STATUS_LABEL[place.status] ?? place.status}
              </StatusBadge>
            </PlaceCardHeader>

            {/* `description` não existe no modelo Place — nunca renderiza. */}
            {(place as { description?: string }).description && (
              <PlaceDesc>{(place as { description?: string }).description}</PlaceDesc>
            )}

            <PlaceActions>
              <ActionBtn variant="secondary" onClick={() => navigate(`/owner/inventory?placeId=${place.id}`)}>
                Estoque
              </ActionBtn>
              <ActionBtn variant="secondary" onClick={() => navigate(`/owner/equipment?placeId=${place.id}`)}>
                Equipamentos
              </ActionBtn>
              <ActionBtn variant="secondary" onClick={() => navigate(`/owner/places/${place.id}/courts`)}>
                Quadras
              </ActionBtn>
              {/* Convidar professor não depende de assinatura (api#451), então
                  entra na parte da linha que só navega — e não junto de editar
                  e abrir/fechar, que a API tranca sem plano em dia. */}
              <ActionBtn variant="secondary" onClick={() => navigate(`/owner/professores?placeId=${place.id}`)}>
                Professores
              </ActionBtn>
              {/* Editar e abrir/fechar gravam; o resto desta linha navega. Sem
                  assinatura em dia os dois ficam desabilitados, e a leitura do
                  estabelecimento continua de pé — é o que a API faz. */}
              <ActionBtn variant="secondary" onClick={() => openEdit(place)} disabled={!podeAlterar}>
                Editar
              </ActionBtn>
              <ActionBtn
                variant={place.status === 'OPEN' ? 'danger' : 'success'}
                onClick={() => handleToggleStatus(place)}
                disabled={toggling === place.id || !podeAlterar}
              >
                {toggling === place.id
                  ? '...'
                  : place.status === 'OPEN' ? 'Fechar' : 'Abrir'}
              </ActionBtn>
            </PlaceActions>
          </PlaceCard>
        ))}
      </PlaceGrid>
      </SubscriptionGate>

      {editingPlace && (
        <Modal>
          <ModalOverlay onClick={closeEdit} />
          <ModalBox>
            <ModalHeader>
              <ModalTitle>Editar Estabelecimento</ModalTitle>
            </ModalHeader>

            <Form onSubmit={handleEdit(onEditSubmit)}>
              <FormGroup>
                <Label>Nome *</Label>
                <Input {...regEdit('name')} placeholder="Nome do estabelecimento" />
                {editErrors.name && <FieldError>{editErrors.name.message}</FieldError>}
              </FormGroup>
              <FormGroup>
                <Label>Rua</Label>
                <Input {...regEdit('street')} placeholder="Nome da rua" />
              </FormGroup>
              <FormGroup>
                <Label>Número</Label>
                <Input {...regEdit('number')} placeholder="Ex.: 123" />
              </FormGroup>
              <FormGroup>
                <Label>Complemento</Label>
                <Input {...regEdit('complement')} placeholder="Apto, sala, bloco..." />
              </FormGroup>
              <FormGroup>
                <Label>Bairro</Label>
                <Input {...regEdit('neighborhood')} placeholder="Nome do bairro" />
              </FormGroup>
              <FormGroup>
                <Label>Cidade</Label>
                <Input {...regEdit('city')} placeholder="Ex.: São Paulo" />
              </FormGroup>

              <ModalActions>
                <CancelBtn type="button" onClick={closeEdit}>Cancelar</CancelBtn>
                <SubmitBtn type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </SubmitBtn>
              </ModalActions>
            </Form>
          </ModalBox>
        </Modal>
      )}
    </>
  )
}
