import type { AxiosResponse } from 'axios'
import api from './api'
import type { ApiEnvelope, Notification, NotificationList } from '../types/api'

export const notificationService = {
  /** Desembrulha até a lista; devolve [] se o corpo vier fora do formato esperado. */
  list: (): Promise<Notification[]> =>
    api
      .get<ApiEnvelope<NotificationList>>('/notifications')
      .then((r) => r.data.data?.notifications ?? []),

  readAll: (): Promise<AxiosResponse<void>> => api.patch('/notifications/read-all'),

  readOne: (id: string): Promise<AxiosResponse<void>> => api.patch(`/notifications/${id}/read`),
}
