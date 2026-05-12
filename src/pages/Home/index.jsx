import { useAuth } from '../../contexts/AuthContext'
import MainLayout from '../../components/MainLayout'
import styled from 'styled-components'

const Placeholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PlaceholderTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`

export default function Home() {
  const { user } = useAuth()

  return (
    <MainLayout user={user}>
      <Placeholder>
        <span style={{ fontSize: '3rem' }}>⚽</span>
        <PlaceholderTitle>Em breve por aqui</PlaceholderTitle>
        <p>A página inicial está a caminho.</p>
      </Placeholder>
    </MainLayout>
  )
}
