import styled, { keyframes } from 'styled-components'

const shimmer = keyframes`
  0%   { background-position: -400px 0 }
  100% { background-position: 400px 0 }
`

export const Base = styled.div`
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.border} 25%,
    ${({ theme }) => theme.colors.borderLight ?? theme.colors.border} 50%,
    ${({ theme }) => theme.colors.border} 75%
  );
  background-size: 800px 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
  border-radius: 6px;
  flex-shrink: 0;
`

export const CardWrap = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 20px;
`

export const CardLine = styled.div`
  margin-bottom: 10px;
  &:last-child { margin-bottom: 0; }
`

export const ListWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

export const ListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight ?? theme.colors.border};
`

export const ListAvatar = styled(Base)`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
`

export const ListLines = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const Line = styled(Base)`
  height: 14px;
  border-radius: 4px;
`
