import { useAuth } from '../../contexts/AuthContext'
import { MainLayout } from '../../components'
import { SearchFilters } from '../../components/SearchFilters'
import { Map } from '../../components/Map'

export default function Home() {
  const { user } = useAuth()

  return (
    <MainLayout user={user}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Map />
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'white',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          gap: '8px'
        }}>
          <SearchFilters />
        </div>
      </div>
    </MainLayout>
  )
}