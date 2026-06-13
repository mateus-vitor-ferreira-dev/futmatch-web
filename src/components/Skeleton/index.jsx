import { Base, CardWrap, CardLine, ListWrap, ListItem, ListAvatar, ListLines, Line } from './styles'

export function Skeleton({ width = '100%', height = 16, radius = 6, style }) {
  return <Base style={{ width, height, borderRadius: radius, ...style }} />
}

export function SkeletonCard({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CardWrap key={i}>
          <CardLine><Base style={{ height: 20, width: '60%', borderRadius: 4 }} /></CardLine>
          <CardLine><Base style={{ height: 14, width: '80%', borderRadius: 4 }} /></CardLine>
          <CardLine><Base style={{ height: 14, width: '40%', borderRadius: 4 }} /></CardLine>
          <CardLine style={{ marginTop: 12 }}><Base style={{ height: 36, borderRadius: 8 }} /></CardLine>
        </CardWrap>
      ))}
    </>
  )
}

export function SkeletonList({ count = 4 }) {
  return (
    <ListWrap>
      {Array.from({ length: count }).map((_, i) => (
        <ListItem key={i}>
          <ListAvatar />
          <ListLines>
            <Line style={{ width: '50%' }} />
            <Line style={{ width: '30%', height: 12 }} />
          </ListLines>
        </ListItem>
      ))}
    </ListWrap>
  )
}
