import { useState } from 'react'
import { searchEvents } from '../../services/events'

export function SearchFilters() {
  const [cidade, setCidade] = useState('')

  async function handleBuscar() {
    const resultado = await searchEvents({ city: cidade })
    console.log('Peladas encontradas:', resultado)
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Digite sua cidade..."
        value={cidade}
        onChange={(e) => setCidade(e.target.value)}
      />
      <button onClick={handleBuscar}>
        Buscar
      </button>
    </div>
  )
}