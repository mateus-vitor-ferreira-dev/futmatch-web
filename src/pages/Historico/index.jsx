import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { playerService } from '../../services/playerService'
import { MainLayout } from '../../components'
import { 
  Container, StatsCard, HistoryList, HistoryCard, 
  EvalModalOverlay, EvalModalContent, ParticipantRow 
} from './styles'

const TAG_OPTIONS = [
  { label: 'Sumiu do jogo', value: 'PASSA_DE_ANO' }, // Adaptado aos ENUMs reais
  { label: 'Perna de pau', value: 'PASSA_DE_ANO' },
  { label: 'Passa de ano', value: 'PASSA_DE_ANO' },
  { label: 'Joga fácil', value: 'JOGA_FACIL' },
  { label: 'Craque da pelada', value: 'CRAQUE_DA_PELADA' }
]

export default function Historico() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [reviewsReceived, setReviewsReceived] = useState([])
  const [loading, setLoading] = useState(true)

  // Avaliação Modal States
  const [evalEvent, setEvalEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [evaluations, setEvaluations] = useState({}) // { userId: { stars: 5, tag: '' } }

  useEffect(() => {
    const fetchHistoric = async () => {
      try {
        setLoading(true)
        // Histórico pode ser derivado das participações (finalizadas)
        const partRes = await playerService.getMyParticipatingEvents()
        const pastEvents = (partRes.data || []).filter(p => p.pelada?.status === 'FINISHED')
        setHistory(pastEvents)

        // Pegar reputação (nota média) via reviews recebidas
        const revRes = await playerService.getUserReviews(user.id)
        setReviewsReceived(revRes.data || [])
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
      const res = await playerService.getEventParticipants(pelada.courtId, pelada.id)
      const others = (res.data || []).filter(p => p.userId !== user.id)
      
      setParticipants(others)
      setEvalEvent(pelada)
      
      // Inicializar state do form
      const initialEvals = {}
      others.forEach(p => { initialEvals[p.userId] = { stars: 5, tag: 'JOGA_FACIL' } })
      setEvaluations(initialEvals)
    } catch (error) {
      alert('Erro ao carregar participantes')
    }
  }

  const handleReviewChange = (userId, field, value) => {
    setEvaluations(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value }
    }))
  }

  const submitEvaluations = async () => {
    try {
      for (const p of participants) {
        const review = evaluations[p.userId]
        await playerService.submitReview(evalEvent.courtId, evalEvent.id, {
          reviewedId: p.userId,
          stars: parseInt(review.stars),
          tag: review.tag,
        })
      }
      alert('Avaliações enviadas com sucesso!')
      setEvalEvent(null)
    } catch (error) {
      alert('Erro ao enviar avaliações')
    }
  }

  // Calculo de estatisticas
  const avgStars = reviewsReceived.length 
    ? (reviewsReceived.reduce((acc, r) => acc + r.stars, 0) / reviewsReceived.length).toFixed(1)
    : 'N/A';

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
            <h2>{reviewsReceived.length}</h2>
            <p>Avaliações Recebidas</p>
          </div>
        </StatsCard>

        <h3>Partidas Concluídas</h3>
        <HistoryList>
          {loading ? <p>Carregando...</p> : history.map((event) => {
            const ev = event.pelada
            return (
              <HistoryCard key={ev.id}>
                <div className="info">
                  <h4>{ev.court?.place?.name} - {ev.court?.type?.replace('_', ' ')}</h4>
                  <p>{new Date(ev.date).toLocaleDateString()} às {new Date(ev.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
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
              <p style={{marginBottom: 16, color: '#6b7280'}}>Selecione a nota e classificação para cada jogador.</p>
              
              {participants.map(p => (
                <ParticipantRow key={p.userId}>
                  <div className="avatar">{p.user?.name?.charAt(0)}</div>
                  <div className="details">
                    <div className="name">{p.user?.name}</div>
                  </div>
                  <div className="controls">
                    <select 
                      value={evaluations[p.userId]?.stars}
                      onChange={(e) => handleReviewChange(p.userId, 'stars', e.target.value)}
                    >
                      <option value="5">⭐⭐⭐⭐⭐</option>
                      <option value="4">⭐⭐⭐⭐</option>
                      <option value="3">⭐⭐⭐</option>
                      <option value="2">⭐⭐</option>
                      <option value="1">⭐</option>
                    </select>
                    <select 
                      value={evaluations[p.userId]?.tag}
                      onChange={(e) => handleReviewChange(p.userId, 'tag', e.target.value)}
                    >
                      {TAG_OPTIONS.map(tag => (
                        <option key={tag.value} value={tag.value}>{tag.label}</option>
                      ))}
                    </select>
                  </div>
                </ParticipantRow>
              ))}

              <div style={{display: 'flex', gap: 16, marginTop: 24}}>
                <button onClick={() => setEvalEvent(null)} style={{flex: 1, padding: 12, borderRadius: 8, border: 'none', cursor: 'pointer'}}>Cancelar</button>
                <button onClick={submitEvaluations} style={{flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#22c55e', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>
                  Salvar Avaliações
                </button>
              </div>
            </EvalModalContent>
          </EvalModalOverlay>
        )}
      </Container>
    </MainLayout>
  )
}