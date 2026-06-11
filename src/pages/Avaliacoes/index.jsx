import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { playerService } from '../../services/playerService'
import { MainLayout } from '../../components'
import {
  Container, StatsCard, Section,
  TagsGrid, TagChip,
  ReviewList, ReviewCard, ReviewHeader, TagBadge, ReviewComment,
  EmptyState,
} from './styles'

const TAG_LABELS = {
  CRAQUE_DA_PELADA: 'Craque da Pelada',
  JOGA_FACIL:       'Joga Fácil',
  PASSA_DE_ANO:     'Passa de Ano',
  PONTUAL:          'Pontual',
  FAIR_PLAY:        'Fair Play',
  BOA_COMUNICACAO:  'Boa Comunicação',
}

function renderStars(count) {
  return '⭐'.repeat(Math.min(Math.max(count, 1), 5))
}

export default function Avaliacoes() {
  const { user } = useAuth()
  const [summary, setSummary] = useState({})
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        const res = await playerService.getUserReviews(user.id)
        setSummary(res.data?.summary || {})
        setReviews(res.data?.reviews || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    if (user?.id) fetchReviews()
  }, [user])

  const avgStars = summary.averageStars
    ? Number(summary.averageStars).toFixed(1)
    : 'N/A'

  return (
    <MainLayout user={user}>
      <Container>
        <h1>Minhas Avaliações</h1>

        <StatsCard>
          <div className="stat-item">
            <h2>⭐ {avgStars}</h2>
            <p>Nota Média</p>
          </div>
          <div className="stat-item">
            <h2>{summary.totalReviews ?? 0}</h2>
            <p>Avaliações Recebidas</p>
          </div>
        </StatsCard>

        {loading ? (
          <p>Carregando...</p>
        ) : (
          <>
            {summary.tags?.length > 0 && (
              <Section>
                <h3>Tags Recebidas</h3>
                <TagsGrid>
                  {summary.tags.map(({ tag, count }) => (
                    <TagChip key={tag}>
                      <span className="label">{TAG_LABELS[tag] || tag}</span>
                      <span className="count">×{count}</span>
                    </TagChip>
                  ))}
                </TagsGrid>
              </Section>
            )}

            <Section>
              <h3>Histórico de Avaliações</h3>

              {reviews.length === 0 ? (
                <EmptyState>
                  <p>Você ainda não recebeu nenhuma avaliação.</p>
                  <p>Participe de peladas e peça aos colegas para te avaliarem!</p>
                </EmptyState>
              ) : (
                <ReviewList>
                  {reviews.map(review => (
                    <ReviewCard key={review.id}>
                      <ReviewHeader>
                        <div className="avatar">
                          {review.reviewer?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="meta">
                          <div className="reviewer-name">{review.reviewer?.name}</div>
                          <div className="game-info">
                            {review.pelada?.court?.place?.name && (
                              <>{review.pelada.court.place.name} &mdash; </>
                            )}
                            {review.createdAt
                              ? new Date(review.createdAt).toLocaleDateString('pt-BR')
                              : ''}
                          </div>
                        </div>
                        <div className="stars">{renderStars(review.stars)}</div>
                      </ReviewHeader>

                      <TagBadge>{TAG_LABELS[review.tag] || review.tag}</TagBadge>

                      {review.comment && (
                        <ReviewComment>"{review.comment}"</ReviewComment>
                      )}
                    </ReviewCard>
                  ))}
                </ReviewList>
              )}
            </Section>
          </>
        )}
      </Container>
    </MainLayout>
  )
}
