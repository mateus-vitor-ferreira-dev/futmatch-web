import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { notificationService } from '../../services/notificationService'
import {
  Wrapper, BellBtn, Badge, Dropdown, DropHeader, DropTitle,
  MarkAllBtn, NotifList, NotifItem, NotifDot, NotifText,
  NotifTime, EmptyMsg,
} from './styles'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  async function load() {
    try {
      const data = await notificationService.list()
      setNotifs(data)
    } catch {
      // silently fail — not critical
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleMarkAll() {
    await notificationService.readAll()
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function handleRead(id) {
    await notificationService.readOne(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const unread = notifs.filter(n => !n.read).length

  return (
    <Wrapper ref={ref}>
      <BellBtn onClick={() => setOpen(o => !o)} aria-label="Notificações">
        <Bell size={20} />
        {unread > 0 && <Badge>{unread > 9 ? '9+' : unread}</Badge>}
      </BellBtn>

      {open && (
        <Dropdown>
          <DropHeader>
            <DropTitle>Notificações</DropTitle>
            {unread > 0 && (
              <MarkAllBtn onClick={handleMarkAll}>Marcar todas como lidas</MarkAllBtn>
            )}
          </DropHeader>
          <NotifList>
            {notifs.length === 0 ? (
              <EmptyMsg>Nenhuma notificação</EmptyMsg>
            ) : (
              notifs.slice(0, 10).map(n => (
                <NotifItem key={n.id} $read={n.read} onClick={() => handleRead(n.id)}>
                  {!n.read && <NotifDot />}
                  <div style={{ flex: 1 }}>
                    <NotifText>{n.message}</NotifText>
                    <NotifTime>{timeAgo(n.createdAt)}</NotifTime>
                  </div>
                </NotifItem>
              ))
            )}
          </NotifList>
        </Dropdown>
      )}
    </Wrapper>
  )
}
