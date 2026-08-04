import { useEffect, useRef, useState } from 'react'
import { COUNTRIES, DEFAULT_COUNTRY } from '../../constants/countries'
import { formatPhoneBR } from '../../utils/masks'
import {
  Container, InputWrapper, CountryButton,
  Flag, DialCode, Chevron, Divider, PhoneNumberInput,
  Dropdown, SearchInput, List, ListItem, CountryName,
} from './styles'

/**
 * Campo de telefone com seletor de país customizado.
 * - Bandeiras via Unicode regional indicators (sem API externa)
 * - Nomes de países via Intl.DisplayNames em pt-BR
 * - Dropdown com busca por nome ou DDI
 * - Máscara automática para Brasil: (11) 99999-9999
 *
 * Compatível com react-hook-form via <Controller>:
 *   value  → string combinada, ex: "+55 (11) 99999-9999"
 *   onChange → recebe a nova string combinada
 */
export default function PhoneInput({ value = '', onChange, error, disabled, name }) {
  const [country, setCountry]         = useState(DEFAULT_COUNTRY)
  const [localNumber, setLocalNumber] = useState('')
  const [isOpen, setIsOpen]           = useState(false)
  const [search, setSearch]           = useState('')
  const containerRef = useRef(null)
  const searchRef    = useRef(null)

  // Sincroniza quando o form faz reset (ex: carregar dados do usuário)
  useEffect(() => {
    if (!value) return
    const matched = COUNTRIES.find(c => value.startsWith(c.dialCode + ' '))
    if (matched) {
      setCountry(matched)
      setLocalNumber(value.slice(matched.dialCode.length + 1))
    }
  }, [value])

  // Foca no campo de busca ao abrir e fecha ao clicar fora
  useEffect(() => {
    if (!isOpen) return
    searchRef.current?.focus()

    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [isOpen])

  function selectCountry(selected) {
    setCountry(selected)
    setIsOpen(false)
    setSearch('')
    onChange?.(`${selected.dialCode} ${localNumber}`)
  }

  function handleNumberChange(e) {
    const formatted = country.code === 'BR'
      ? formatPhoneBR(e.target.value)
      : e.target.value.replace(/[^\d\s\-()+]/g, '').slice(0, 20)
    setLocalNumber(formatted)
    onChange?.(`${country.dialCode} ${formatted}`)
  }

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dialCode.includes(search)
  )

  const placeholder = country.code === 'BR' ? '(11) 99999-9999' : 'Número de telefone'

  return (
    <Container ref={containerRef}>
      <InputWrapper $error={error}>
        <CountryButton
          type="button"
          onClick={() => !disabled && setIsOpen(o => !o)}
          aria-label="Selecionar país"
          aria-expanded={isOpen}
          disabled={disabled}
        >
          <Flag>{country.flag}</Flag>
          <DialCode>{country.dialCode}</DialCode>
          <Chevron $open={isOpen}>▼</Chevron>
        </CountryButton>

        <Divider />

        <PhoneNumberInput
          inputMode="tel"
          name={name}
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      </InputWrapper>

      {isOpen && (
        <Dropdown>
          <SearchInput
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar país..."
          />
          <List>
            {filtered.map(c => (
              <ListItem
                key={c.code}
                $selected={c.code === country.code}
                onClick={() => selectCountry(c)}
              >
                <Flag>{c.flag}</Flag>
                <CountryName>{c.name}</CountryName>
                <DialCode>{c.dialCode}</DialCode>
              </ListItem>
            ))}
          </List>
        </Dropdown>
      )}
    </Container>
  )
}
