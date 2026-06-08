import { useEffect, useState } from 'react'

// Módulo-level cache: evita re-fetch entre remontagens do componente
let _cache = null

/**
 * Busca países com bandeira emoji e código discagem (DDI).
 * Brasil aparece primeiro na lista.
 */
export function useCountries() {
  const [countries, setCountries] = useState(_cache ?? [])
  const [loading, setLoading]     = useState(!_cache)

  useEffect(() => {
    if (_cache) return

    fetch('https://restcountries.com/v3.1/all?fields=name,flags,idd')
      .then(r => r.json())
      .then(data => {
        const list = data
          .map(c => {
            const suffixes = c.idd?.suffixes ?? []
            const dialCode = (c.idd?.root ?? '') + (suffixes.length === 1 ? suffixes[0] : '')
            return { name: c.name?.common ?? '', flag: c.flags?.emoji ?? '🏳️', dialCode }
          })
          .filter(c => c.dialCode && c.dialCode !== '+')
          .sort((a, b) => {
            if (a.name === 'Brazil') return -1
            if (b.name === 'Brazil') return 1
            return a.name.localeCompare(b.name)
          })
        _cache = list
        setCountries(list)
      })
      .catch(() => {
        // Fallback mínimo em caso de falha na API
        _cache = [{ name: 'Brazil', flag: '🇧🇷', dialCode: '+55' }]
        setCountries(_cache)
      })
      .finally(() => setLoading(false))
  }, [])

  return { countries, loading }
}
