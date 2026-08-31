'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getNotifications, markNotificationRead, type NotificationData } from '@/app/actions/notifications'

function relativeTime(createdAt: string) {
  const seconds = Math.round((new Date(createdAt).getTime() - Date.now()) / 1000)
  const absoluteSeconds = Math.abs(seconds)
  if (absoluteSeconds < 60) return 'Just now'
  const unit = absoluteSeconds < 3600 ? 'minute' : absoluteSeconds < 86400 ? 'hour' : 'day'
  const divisor = unit === 'minute' ? 60 : unit === 'hour' ? 3600 : 86400
  const value = Math.round(seconds / divisor)
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(value, unit)
}

export default function NotificationBell() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [open, setOpen] = useState(false)

  const loadNotifications = async () => {
    const result = await getNotifications()
    if (result.success) setNotifications(result.data)
  }

  useEffect(() => {
    loadNotifications()
    const interval = window.setInterval(loadNotifications, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleToggle = async () => {
    const nextOpen = !open
    setOpen(nextOpen)
    if (nextOpen) await loadNotifications()
  }

  const handleNotificationClick = async (notification: NotificationData) => {
    if (!notification.read) {
      const result = await markNotificationRead(notification.id)
      if (result.success) {
        setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item))
      }
    }
    if (notification.link) {
      if (notification.link.startsWith('/')) router.push(notification.link)
      else window.location.assign(notification.link)
      setOpen(false)
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <div ref={containerRef} className="relative z-40">
      <button type="button" aria-label={`View notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={handleToggle} className="mobile-tap-target relative rounded-lg border border-border bg-surface p-2.5 text-text-secondary shadow-sm hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gradient px-1 text-[10px] font-semibold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] sm:hidden" onClick={() => setOpen(false)} />
          <div role="dialog" aria-label="Notifications" className="fixed inset-x-0 bottom-0 z-50 h-[85vh] overflow-hidden rounded-t-[1.5rem] border-t border-border bg-surface shadow-2xl sm:absolute sm:inset-auto sm:bottom-auto sm:left-auto sm:right-0 sm:top-12 sm:h-auto sm:w-[min(22rem,calc(100vw-2rem))] sm:rounded-xl sm:border-t-0 sm:border">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border/80 sm:hidden" />
            <div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="font-display text-sm font-semibold text-ink">Notifications</p><span className="text-xs text-text-muted">{unreadCount} unread</span></div>
            <div className="max-h-[calc(100vh-120px)] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:max-h-96">{notifications.length ? notifications.map((notification) => <button key={notification.id} type="button" onClick={() => handleNotificationClick(notification)} className={`mobile-tap-target flex w-full gap-3 border-b border-border px-4 py-4 text-left transition-colors last:border-0 hover:bg-bg sm:py-3 ${notification.read ? '' : 'bg-blue/5'}`}><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read ? 'bg-border' : 'bg-brand-gradient'}`} /><span className="min-w-0"><span className="block text-sm font-semibold text-ink">{notification.title}</span><span className="mt-1 block text-sm leading-snug text-text-secondary">{notification.message}</span><span className="mt-2 block text-xs text-text-muted">{relativeTime(notification.created_at)}</span></span></button>) : <p className="px-4 py-8 text-center text-sm text-text-muted">No notifications yet</p>}</div>
          </div>
        </>
      )}
    </div>
  )
}
