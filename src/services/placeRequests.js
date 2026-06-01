import api from './api'

export const listAll   = (status) => api.get('/place-requests',    { params: status ? { status } : undefined })
export const listMine  = (status) => api.get('/place-requests/my', { params: status ? { status } : undefined })
export const create    = (data)   => api.post('/place-requests', data)
export const approve   = (id)     => api.patch(`/place-requests/${id}/approve`)
export const reject    = (id, reason) => api.patch(`/place-requests/${id}/reject`, { reason })
