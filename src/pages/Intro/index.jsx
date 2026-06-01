import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Wrapper, TitleRow, Letter, Ball, FadeOverlay } from './styles'

const LETTERS = ['F', 'u', 't', 'M', 'a', 't', 'c', 'h']

export default function Intro({ onComplete }) {
  const wrapperRef  = useRef()
  const ballRef     = useRef()
  const letterRefs  = useRef([])
  const overlayRef  = useRef()
  const revealedRef = useRef(new Set())

  useEffect(() => {
    const vw = window.innerWidth

    gsap.set(ballRef.current, { x: vw + 80, yPercent: -50, rotation: 0 })

    requestAnimationFrame(() => {
      const wrapperRect = wrapperRef.current.getBoundingClientRect()

      const letterCenterXs = letterRefs.current.map((el) => {
        if (!el) return 0
        const r = el.getBoundingClientRect()
        return r.left + r.width / 2 - wrapperRect.left
      })

      const firstLetterLeft = letterRefs.current[0].getBoundingClientRect().left - wrapperRect.left
      const ballWidth       = ballRef.current.getBoundingClientRect().width
      const ballStopX       = firstLetterLeft - ballWidth - 14

      const tl = gsap.timeline()

      tl.to(ballRef.current, {
        x: ballStopX,
        rotation: -1440,
        duration: 2.5,
        ease: 'power1.inOut',
        onUpdate() {
          const ballX = gsap.getProperty(ballRef.current, 'x')
          letterCenterXs.forEach((letterX, i) => {
            if (ballX <= letterX && !revealedRef.current.has(i)) {
              revealedRef.current.add(i)
              gsap.fromTo(
                letterRefs.current[i],
                { opacity: 0, y: 20, scale: 0.7 },
                { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: 'back.out(2)' }
              )
            }
          })
        },
      })

      tl.to({}, { duration: 0.9 })
      tl.to(overlayRef.current, { opacity: 1, duration: 0.6, ease: 'power2.in' })
      tl.call(() => onComplete?.())
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Wrapper ref={wrapperRef}>
      <TitleRow>
        {LETTERS.map((letter, i) => (
          <Letter key={i} ref={(el) => (letterRefs.current[i] = el)}>
            {letter}
          </Letter>
        ))}
      </TitleRow>

      <Ball ref={ballRef}>⚽</Ball>

      <FadeOverlay ref={overlayRef} />
    </Wrapper>
  )
}
