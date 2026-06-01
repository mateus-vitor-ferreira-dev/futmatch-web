import api from './api'

export const list         = ()          => api.get('/places')
export const getOne       = (id)        => api.get(`/places/${id}`)
export const create       = (data)      => api.post('/places', data)
export const update       = (id, data)  => api.patch(`/places/${id}`, data)
export const updateStatus = (id, status) => api.patch(`/places/${id}/status`, { status })
export const assignOwner  = (id, ownerId) => api.patch(`/places/${id}/owner`, { ownerId })
