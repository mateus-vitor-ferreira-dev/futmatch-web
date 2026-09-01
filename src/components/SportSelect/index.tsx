import { useState, useRef, useEffect } from 'react'
import type { MouseEvent } from 'react'
import type { CourtType } from '../../types/api'
import type { SportOption } from '../../hooks/useSports'
import SportIcon from '../SportIcon'
import {
  Wrapper, Trigger, Placeholder, Tag, TagRemove, ChevronIcon,
  Dropdown, Option, Checkbox, OptionIcon,
} from './styles'

export interface SportSelectProps {
  sports?: SportOption[]
  value?: CourtType[]
  onChange: (ids: CourtType[]) => void
  loading?: boolean
}

/**
 * Multiselect customizado para modalidades esportivas.
 *
 * Exibe as modalidades selecionadas como tags removíveis e abre um dropdown
 * com todas as opções disponíveis ao clicar. Fecha ao clicar fora.
 */
export default function SportSelect({
  sports = [],
  value = [],
  onChange,
  loading,
}: SportSelectProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Fecha o dropdown ao clicar fora do componente
  useEffect(() => {
    function onClickOutside(e: globalThis.MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  /** Adiciona ou remove um esporte da seleção */
  function toggle(id: CourtType) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  /** Remove uma tag sem propagar o clique para o Trigger (que abriria o dropdown) */
  function remove(e: MouseEvent<HTMLElement>, id: CourtType) {
    e.stopPropagation()
    onChange(value.filter((v) => v !== id))
  }

  const selectedSports = sports.filter((s) => value.includes(s.id))

  return (
    <Wrapper ref={wrapperRef}>
      <Trigger $open={open} onClick={() => setOpen((v) => !v)}>
        {loading ? (
          <Placeholder>Carregando…</Placeholder>
        ) : selectedSports.length === 0 ? (
          <Placeholder>Selecione as modalidades</Placeholder>
        ) : (
          selectedSports.map((s) => (
            <Tag key={s.id}>
              <SportIcon icon={s.icon} fallback={s.iconFallback} /> {s.label}
              <TagRemove onClick={(e) => remove(e, s.id)}>×</TagRemove>
            </Tag>
          ))
        )}
        <ChevronIcon $open={open}>▾</ChevronIcon>
      </Trigger>

      {open && (
        <Dropdown
          onWheel={(e) => e.stopPropagation()} // impede que o scroll do dropdown suba para a página
        >
          {sports.map((s) => {
            const checked = value.includes(s.id)
            return (
              <Option key={s.id} $selected={checked} onClick={() => toggle(s.id)}>
                <Checkbox $checked={checked}>{checked ? '✓' : ''}</Checkbox>
                <OptionIcon><SportIcon icon={s.icon} fallback={s.iconFallback} /></OptionIcon>
                {s.label}
              </Option>
            )
          })}
        </Dropdown>
      )}
    </Wrapper>
  )
}
