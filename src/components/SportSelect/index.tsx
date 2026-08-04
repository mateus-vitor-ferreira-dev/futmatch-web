import { useState, useRef, useEffect } from 'react'
import {
  Wrapper, Trigger, Placeholder, Tag, TagRemove, ChevronIcon,
  Dropdown, Option, Checkbox, OptionIcon,
} from './styles'

/**
 * Multiselect customizado para modalidades esportivas.
 *
 * Exibe as modalidades selecionadas como tags removíveis e abre um dropdown
 * com todas as opções disponíveis ao clicar. Fecha ao clicar fora.
 *
 * @param {{
 *   sports:   Array<{ id: string, label: string, icon: string }>,
 *   value:    string[],
 *   onChange: (ids: string[]) => void,
 *   loading:  boolean,
 * }} props
 */
export default function SportSelect({ sports = [], value = [], onChange, loading }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef()

  // Fecha o dropdown ao clicar fora do componente
  useEffect(() => {
    function onClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  /** Adiciona ou remove um esporte da seleção */
  function toggle(id) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  /** Remove uma tag sem propagar o clique para o Trigger (que abriria o dropdown) */
  function remove(e, id) {
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
              {s.icon} {s.label}
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
                <OptionIcon>{s.icon}</OptionIcon>
                {s.label}
              </Option>
            )
          })}
        </Dropdown>
      )}
    </Wrapper>
  )
}
