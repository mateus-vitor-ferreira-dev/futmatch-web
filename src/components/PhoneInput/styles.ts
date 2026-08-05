import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
`

export const InputWrapper = styled.div<{ $error?: boolean; }>`
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  border: 1.5px solid ${({ $error, theme }) => $error ? theme.colors.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgInput};
  transition: border-color 0.15s;

  &:focus-within {
    border-color: ${({ $error, theme }) => $error ? theme.colors.error : theme.colors.primary};
  }
`

export const CountryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  height: 100%;
  background: none;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;

  &:disabled { cursor: default; opacity: 0.55; }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: -2px;
    border-radius: ${({ theme }) => theme.radii.md} 0 0 ${({ theme }) => theme.radii.md};
  }
`

export const Flag = styled.span`
  font-size: 18px;
  line-height: 1;
`

export const DialCode = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`

export const Chevron = styled.span<{ $open?: boolean; }>`
  font-size: 9px;
  color: ${({ theme }) => theme.colors.textMuted};
  transition: transform 0.15s;
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0deg)'};
`

export const Divider = styled.span`
  width: 1px;
  height: 20px;
  background: ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`

export const PhoneNumberInput = styled.input`
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  padding: 0 12px;
  min-width: 0;

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
  &:disabled { opacity: 0.55; }
`

export const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.bgInput};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  z-index: 200;
  overflow: hidden;
`

export const SearchInput = styled.input`
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-bottom: 1.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  outline: none;
  box-sizing: border-box;

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`

export const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 6px 0;
  max-height: 220px;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
  }
`

export const ListItem = styled.li<{ $selected?: boolean; }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  transition: background 0.1s;
  background: ${({ $selected, theme }) => $selected ? theme.colors.primarySubtle : 'transparent'};
  font-weight: ${({ $selected, theme }) =>
    $selected ? theme.fontWeights.semibold : theme.fontWeights.regular};

  &:hover { background: ${({ theme }) => theme.colors.borderLight}; }
`

export const CountryName = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`
