'use server'

import { apiJson } from '@/lib/api-client'

export type NotificationData = {
  id: number
  title: string
  message: string
  created_at: string
  link: string
  read: boolean
}

type NotificationResult =
  | { success: true; data: NotificationData[] }
  | { success: false; error: string; data: NotificationData[] }

export async function getNotifications(): Promise<NotificationResult> {
  try {
    return { success: true, data: await apiJson<NotificationData[]>('/notifications/') }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load notifications',
      data: [],
    }
  }
}

export async function markNotificationRead(notificationId: number) {
  try {
    return {
      success: true as const,
      data: await apiJson<{ read: boolean }>(`/notifications/${notificationId}/mark-read/`, { method: 'POST' }),
    }
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed to mark notification as read' }
  }
}
