import { useEffect, useState } from 'react'

export interface CountryOption {
  name: string
  flag: string
  dialCode: string
}

/** Formato relevante da resposta do restcountries.com. */
interface RestCountry {
  name?: { common?: string }
  flags?: { emoji?: string }
  idd?: { root?: string; suffixes?: string[] }
}

// Módulo-level cache: evita re-fetch entre remontagens do componente
let _cache: CountryOption[] | null = null

/**
 * Busca países com bandeira emoji e código discagem (DDI).
 * Brasil aparece primeiro na lista.
 */
export function useCountries(): { countries: CountryOption[]; loading: boolean } {
  const [countries, setCountries] = useState<CountryOption[]>(_cache ?? [])
  const [loading, setLoading]     = useState(!_cache)

  useEffect(() => {
    if (_cache) return

    fetch('https://restcountries.com/v3.1/all?fields=name,flags,idd')
      .then(r => r.json() as Promise<RestCountry[]>)
      .then(data => {
        const list: CountryOption[] = data
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
