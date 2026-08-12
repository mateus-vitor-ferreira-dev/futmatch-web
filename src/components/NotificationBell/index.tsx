import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { notificationService } from '../../services/notificationService'
import { temSessao } from '../../services/api'
import { env } from '../../config/env'
import type { Notification } from '../../types/api'
import {
  Wrapper, BellBtn, Badge, Dropdown, DropHeader, DropTitle,
  MarkAllBtn, NotifList, NotifItem, NotifDot, NotifText,
  NotifTime, EmptyMsg,
} from './styles'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [open, setOpen]     = useState(false)
  const ref                 = useRef<HTMLDivElement>(null)
  const esRef               = useRef<EventSource | null>(null)

  async function load() {
    try {
      const data = await notificationService.list()
      setNotifs(data)
    } catch {
      // não crítico
    }
  }

  useEffect(() => {
    load()

    if (!temSessao()) return

    /**
     * `withCredentials` é o que manda o cookie de sessão na conexão. Antes o
     * JWT ia na query string — o `EventSource` não aceita header customizado —,
     * e URL com token acaba em log de proxy, histórico e `Referer`.
     */
    const es = new EventSource(`${env.apiUrl}/notifications/stream`, { withCredentials: true })
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const notification = JSON.parse(e.data as string) as Notification
        setNotifs(prev => [notification, ...prev])
      } catch {
        // ignora payloads malformados
      }
    }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [])

  useEffect(() => {
    function handleClick(e: globalThis.MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleMarkAll() {
    await notificationService.readAll()
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function handleRead(id: string) {
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
                    {/*
                      * Era `n.title || n.message`: `message` não existe no
                      * payload da API (os campos são `title` e `body`), então o
                      * fallback nunca resolvia para nada. Como `title` é sempre
                      * preenchido, o efeito era nenhum — mas o campo era resquício
                      * de um formato antigo.
                      */}
                    <NotifText>{n.title}</NotifText>
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
