import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { playerService } from '../../services/playerService'
import { MainLayout } from '../../components'
import type { Review } from '../../types/api'
import {
  Container, StatsCard, Section,
  TagsGrid, TagChip,
  ReviewList, ReviewCard, ReviewHeader, TagBadge, ReviewComment,
  EmptyState,
} from './styles'

const TAG_LABELS: Record<string, string> = {
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

function formatDate(dateStr) {
  return dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : ''
}

export default function Avaliacoes() {
  const { user } = useAuth()
  const [summary, setSummary]           = useState({})
  const [reviews, setReviews]           = useState<Review[]>([])
  const [reviewsGiven, setReviewsGiven] = useState<Review[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const fetch = async () => {
      try {
        setLoading(true)
        const [received, given] = await Promise.all([
          playerService.getUserReviews(user.id),
          playerService.getUserReviewsGiven(user.id),
        ])
        setSummary(received.data?.summary || {})
        setReviews(received.data?.reviews || [])
        setReviewsGiven(given.data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
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
          <div className="stat-item">
            <h2>{reviewsGiven.length}</h2>
            <p>Avaliações Feitas</p>
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

            {/* Avaliações recebidas */}
            <Section>
              <h3>Avaliações Recebidas</h3>

              {reviews.length === 0 ? (
                <EmptyState>
                  <p>Você ainda não recebeu nenhuma avaliação.</p>
                  <p>Participe de peladas e peça aos colegas para te avaliarem!</p>
                </EmptyState>
              ) : (
                <ReviewList>
                  {reviews.map((review: Review) => (
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
                            {formatDate(review.createdAt)}
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

            {/* Avaliações feitas pelo usuário */}
            <Section>
              <h3>Avaliações que Fiz</h3>

              {reviewsGiven.length === 0 ? (
                <EmptyState>
                  <p>Você ainda não avaliou nenhum jogador.</p>
                  <p>Após uma pelada finalizada, avalie seus colegas de jogo!</p>
                </EmptyState>
              ) : (
                <ReviewList>
                  {reviewsGiven.map((review: Review) => (
                    <ReviewCard key={review.id}>
                      <ReviewHeader>
                        <div className="avatar">
                          {review.reviewed?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="meta">
                          <div className="reviewer-name">{review.reviewed?.name}</div>
                          <div className="game-info">
                            {review.pelada?.court?.place?.name && (
                              <>{review.pelada.court.place.name} &mdash; </>
                            )}
                            {formatDate(review.createdAt)}
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
