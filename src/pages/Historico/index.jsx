import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { SkeletonList } from '../../components/Skeleton'
import { getSportMeta } from '../../hooks/useSports'
import { useAuth } from '../../contexts/AuthContext'
import { playerService } from '../../services/playerService'
import { MainLayout } from '../../components'
import {
  Container, StatsCard, HistoryList, HistoryCard,
  EvalModalOverlay, EvalModalContent, ParticipantRow,
  ProgressInfo, ProgressBarWrap, CommentTextarea,
} from './styles'

const TAG_OPTIONS = [
  { label: 'Craque da Pelada', value: 'CRAQUE_DA_PELADA' },
  { label: 'Joga Fácil',       value: 'JOGA_FACIL'       },
  { label: 'Passa de Ano',     value: 'PASSA_DE_ANO'     },
  { label: 'Pontual',          value: 'PONTUAL'           },
  { label: 'Fair Play',        value: 'FAIR_PLAY'         },
  { label: 'Boa Comunicação',  value: 'BOA_COMUNICACAO'  },
]

export default function Historico() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [reviewSummary, setReviewSummary] = useState({})
  const [loading, setLoading] = useState(true)

  // Modal de avaliação
  const [evalEvent, setEvalEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [evaluations, setEvaluations] = useState({})
  const [reviewProgress, setReviewProgress] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchHistoric = async () => {
      try {
        setLoading(true)
        const partRes = await playerService.getMyParticipatingEvents()
        const pastEvents = (partRes.data || []).filter(p => p.pelada?.status === 'FINISHED')
        setHistory(pastEvents)

        const revRes = await playerService.getUserReviews(user.id)
        setReviewSummary(revRes.data?.summary || {})
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    if (user?.id) fetchHistoric()
  }, [user])

  const openEvaluation = async (event) => {
    try {
      const pelada = event.pelada
      const [participantsRes, progressRes] = await Promise.all([
        playerService.getEventParticipants(pelada.courtId, pelada.id),
        playerService.getReviewProgress(pelada.courtId, pelada.id).catch(() => null),
      ])

      const others = (participantsRes.data || []).filter(p => p.userId !== user.id)
      setParticipants(others)
      setEvalEvent(pelada)
      setReviewProgress(progressRes?.data || null)

      const initialEvals = {}
      others.forEach(p => {
        initialEvals[p.userId] = { stars: 5, tag: 'JOGA_FACIL', comment: '' }
      })
      setEvaluations(initialEvals)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar participantes')
    }
  }

  const handleReviewChange = (userId, field, value) => {
    setEvaluations(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }))
  }

  const submitEvaluations = async () => {
    try {
      setSubmitting(true)
      for (const p of participants) {
        const review = evaluations[p.userId]
        await playerService.submitReview(evalEvent.courtId, evalEvent.id, {
          reviewedId: p.userId,
          stars: parseInt(review.stars),
          tag: review.tag,
          comment: review.comment || null,
        })
      }
      toast.success('Avaliações enviadas com sucesso!')
      setEvalEvent(null)
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Erro ao enviar avaliações')
    } finally {
      setSubmitting(false)
    }
  }

  const avgStars = reviewSummary.averageStars
    ? Number(reviewSummary.averageStars).toFixed(1)
    : 'N/A'

  const progressPct = reviewProgress
    ? Math.round((reviewProgress.reviewed / Math.max(reviewProgress.total, 1)) * 100)
    : 0

  return (
    <MainLayout user={user}>
      <Container>
        <h1>Meu Histórico</h1>

        <StatsCard>
          <div className="stat-item">
            <h2>⭐ {avgStars}</h2>
            <p>Sua Nota Média</p>
          </div>
          <div className="stat-item">
            <h2>{history.length}</h2>
            <p>Jogos Disputados</p>
          </div>
          <div className="stat-item">
            <h2>{reviewSummary.totalReviews ?? 0}</h2>
            <p>Avaliações Recebidas</p>
          </div>
        </StatsCard>

        <h3>Partidas Concluídas</h3>
        <HistoryList>
          {loading ? <SkeletonList count={4} /> : history.map((event) => {
            const ev = event.pelada
            return (
              <HistoryCard key={ev.id}>
                <div className="info">
                  <h4>{ev.court?.place?.name} — {getSportMeta(ev.court?.type).icon} {getSportMeta(ev.court?.type).label}</h4>
                  <p>
                    {new Date(ev.date).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="action">
                  <button onClick={() => openEvaluation(event)}>Avaliar Jogadores</button>
                </div>
              </HistoryCard>
            )
          })}
        </HistoryList>

        {/* Modal de Avaliação Pós-Jogo */}
        {evalEvent && (
          <EvalModalOverlay>
            <EvalModalContent>
              <h2>Avaliar Partida</h2>

              {reviewProgress && (
                <ProgressInfo>
                  <span>
                    Avaliações: <strong>{reviewProgress.reviewed} de {reviewProgress.total}</strong>
                  </span>
                  <ProgressBarWrap $pct={progressPct}>
                    <div />
                  </ProgressBarWrap>
                </ProgressInfo>
              )}

              <p style={{ marginBottom: 16, color: '#6b7280' }}>
                Selecione a nota, classificação e deixe um comentário (opcional).
              </p>

              {participants.map(p => (
                <ParticipantRow key={p.userId}>
                  <div className="avatar">{p.user?.name?.charAt(0)}</div>
                  <div className="details">
                    <div className="name">{p.user?.name}</div>
                  </div>
                  <div className="controls">
                    <select
                      value={evaluations[p.userId]?.stars}
                      onChange={e => handleReviewChange(p.userId, 'stars', e.target.value)}
                    >
                      <option value="5">⭐⭐⭐⭐⭐</option>
                      <option value="4">⭐⭐⭐⭐</option>
                      <option value="3">⭐⭐⭐</option>
                      <option value="2">⭐⭐</option>
                      <option value="1">⭐</option>
                    </select>
                    <select
                      value={evaluations[p.userId]?.tag}
                      onChange={e => handleReviewChange(p.userId, 'tag', e.target.value)}
                    >
                      {TAG_OPTIONS.map(tag => (
                        <option key={tag.value} value={tag.value}>{tag.label}</option>
                      ))}
                    </select>
                    <CommentTextarea
                      placeholder="Comentário (opcional, máx. 300 caracteres)"
                      maxLength={300}
                      value={evaluations[p.userId]?.comment || ''}
                      onChange={e => handleReviewChange(p.userId, 'comment', e.target.value)}
                    />
                  </div>
                </ParticipantRow>
              ))}

              <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                <button
                  onClick={() => setEvalEvent(null)}
                  style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={submitEvaluations}
                  disabled={submitting}
                  style={{
                    flex: 1, padding: 12, borderRadius: 8, border: 'none',
                    background: '#22c55e', color: 'white', fontWeight: 'bold',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Enviando...' : 'Salvar Avaliações'}
                </button>
              </div>
            </EvalModalContent>
          </EvalModalOverlay>
        )}
      </Container>
    </MainLayout>
  )
}
