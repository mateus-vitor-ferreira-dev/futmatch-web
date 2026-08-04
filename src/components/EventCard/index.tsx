import { useState } from 'react'
import type { CourtType, PeladaStatus } from '../../types/api'
import styled, { keyframes } from 'styled-components'
import { getSportMeta } from '../../hooks/useSports'

// ---- Animações ----
const flipToBack = keyframes`
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(180deg); }
`
const flipToFront = keyframes`
  from { transform: rotateY(180deg); }
  to   { transform: rotateY(0deg); }
`

// ---- Styled Components ----
const Scene = styled.div`
  width: 220px;
  height: 320px;
  perspective: 1000px;
  cursor: pointer;
`

const Card = styled.div<{ $flipped?: boolean }>`
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: ${({ $flipped }) => ($flipped ? flipToBack : flipToFront)} 0.6s ease forwards;
`

const Face = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
`

const Front = styled(Face)`
  background: linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px;
  border: 2px solid #00e676;
`

const Back = styled(Face)`
  background: linear-gradient(160deg, #0f3460 0%, #16213e 100%);
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  gap: 10px;
  border: 2px solid #00e676;
`

const CourtIcon = styled.div`
  font-size: 3.5rem;
  line-height: 1;
`

const CourtType = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: #00e676;
  letter-spacing: 2px;
  text-transform: uppercase;
`

const ArenaName = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: #ffffff;
  text-align: center;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const Divider = styled.div`
  width: 80%;
  height: 1px;
  background: rgba(0, 230, 118, 0.3);
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
`

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`

const StatValue = styled.span`
  font-size: 1.1rem;
  font-weight: 800;
  color: #ffffff;
`

const StatLabel = styled.span`
  font-size: 0.6rem;
  font-weight: 600;
  color: #00e676;
  letter-spacing: 1px;
  text-transform: uppercase;
`

const BackTitle = styled.h4`
  font-size: 0.65rem;
  font-weight: 700;
  color: #00e676;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0;
`

const BackValue = styled.p`
  font-size: 0.85rem;
  color: #ffffff;
  margin: 0;
  font-weight: 500;
`

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-bottom: 1px solid rgba(0,230,118,0.15);
  padding-bottom: 8px;
`

const StatusBadge = styled.span<{ $status?: PeladaStatus }>`
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
  align-self: flex-start;
  background: ${({ $status }) =>
    $status === 'WAITING' ? 'rgba(0,230,118,0.15)' :
    $status === 'FULL'    ? 'rgba(255,82,82,0.15)'  :
    'rgba(255,255,255,0.1)'};
  color: ${({ $status }) =>
    $status === 'WAITING' ? '#00e676' :
    $status === 'FULL'    ? '#ff5252' :
    '#ffffff'};
  border: 1px solid ${({ $status }) =>
    $status === 'WAITING' ? '#00e676' :
    $status === 'FULL'    ? '#ff5252' :
    'rgba(255,255,255,0.3)'};
`

/**
 * Forma que este card espera — ACHATADA, diferente do `Pelada` que a API
 * devolve: aqui `place`/`courtName`/`city` são strings soltas e `participations`
 * é um número, enquanto a API aninha tudo sob `court.place` e devolve
 * `participations` como array.
 *
 * ⚠️ Nenhuma tela importa este componente (só o barrel components/index.ts o
 * reexporta), então não existe hoje nada que produza esta forma. Mantido como
 * está; se voltar a ser usado, o adaptador precisa ser escrito.
 */
export interface EventCardData {
  place: string
  courtName: string
  city: string
  type: CourtType
  status: PeladaStatus
  date: string
  maxPlayers: number
  /** Contagem de participantes, não a lista. */
  participations: number
  totalValue: string | number
}

// ---- Componente ----
export function EventCard({ event }: { event: EventCardData }) {
  const [flipped, setFlipped] = useState(false)

  const vagas = event.maxPlayers - event.participations
  const valorPorPessoa = (Number(event.totalValue) / event.maxPlayers).toFixed(2)
  const sport = getSportMeta(event.type)
  const icon = sport.icon

  const date = new Date(event.date)
  const dateStr = date.toLocaleDateString('pt-BR')
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <Scene onClick={() => setFlipped((f) => !f)}>
      <Card $flipped={flipped}>

        {/* FRENTE */}
        <Front>
          <CourtType>{sport.icon} {sport.label}</CourtType>
          <CourtIcon>{icon}</CourtIcon>
          <ArenaName>{event.place}</ArenaName>
          <Divider />
          <StatsGrid>
            <Stat>
              <StatValue>{vagas}</StatValue>
              <StatLabel>Vagas</StatLabel>
            </Stat>
            <Stat>
              <StatValue>R${valorPorPessoa}</StatValue>
              <StatLabel>Por pessoa</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{event.maxPlayers}</StatValue>
              <StatLabel>Total</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{dateStr}</StatValue>
              <StatLabel>Data</StatLabel>
            </Stat>
          </StatsGrid>
        </Front>

        {/* VERSO */}
        <Back>
          <ArenaName>{event.place}</ArenaName>
          <Divider />
          <InfoRow>
            <BackTitle>Quadra</BackTitle>
            <BackValue>{event.courtName}</BackValue>
          </InfoRow>
          <InfoRow>
            <BackTitle>Horário</BackTitle>
            <BackValue>{dateStr} às {timeStr}</BackValue>
          </InfoRow>
          <InfoRow>
            <BackTitle>Endereço</BackTitle>
            <BackValue>{event.city}</BackValue>
          </InfoRow>
          <InfoRow>
            <BackTitle>Jogadores</BackTitle>
            <BackValue>{event.participations}/{event.maxPlayers} confirmados</BackValue>
          </InfoRow>
          <InfoRow>
            <BackTitle>Valor total</BackTitle>
            <BackValue>R$ {event.totalValue}</BackValue>
          </InfoRow>
          <StatusBadge $status={event.status}>{event.status}</StatusBadge>
        </Back>

      </Card>
    </Scene>
  )
}