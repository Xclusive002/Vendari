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
    <div ref={containerRef} className="relative">
      <button type="button" aria-label={`View notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={handleToggle} className="relative rounded-lg border border-border bg-surface p-2.5 text-text-secondary shadow-sm hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gradient px-1 text-[10px] font-semibold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && <div role="dialog" aria-label="Notifications" className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="font-display text-sm font-semibold text-ink">Notifications</p><span className="text-xs text-text-muted">{unreadCount} unread</span></div>
        <div className="max-h-96 overflow-y-auto">{notifications.length ? notifications.map((notification) => <button key={notification.id} type="button" onClick={() => handleNotificationClick(notification)} className={`flex w-full gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-bg ${notification.read ? '' : 'bg-blue/5'}`}><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read ? 'bg-border' : 'bg-brand-gradient'}`} /><span className="min-w-0"><span className="block text-sm font-semibold text-ink">{notification.title}</span><span className="mt-1 block text-sm leading-snug text-text-secondary">{notification.message}</span><span className="mt-2 block text-xs text-text-muted">{relativeTime(notification.created_at)}</span></span></button>) : <p className="px-4 py-8 text-center text-sm text-text-muted">No notifications yet</p>}</div>
      </div>}
    </div>
  )
}
