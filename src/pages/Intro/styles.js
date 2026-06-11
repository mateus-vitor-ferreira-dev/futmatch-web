import styled from 'styled-components'

export const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  background: #0a0a0a;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  position: relative;
  z-index: 1;
`

export const Letter = styled.span`
  font-size: 96px;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 2px 24px rgba(255, 255, 255, 0.25);
  display: inline-block;
  font-family: 'Impact', 'Arial Black', sans-serif;
  letter-spacing: -2px;
  line-height: 1;
  opacity: 0;
  will-change: transform, opacity;
`

export const Ball = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  font-size: 64px;
  line-height: 1;
  z-index: 0;
  will-change: transform;
`

export const FadeOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: #0a0a0a;
  opacity: 0;
  z-index: 100;
  pointer-events: none;
`
