import api from './api'

export const listUsers = (role) =>
  api.get('/admin/users', { params: role ? { role } : undefined })

export const updateUserRole = (userId, role) =>
  api.patch(`/admin/users/${userId}/role`, { role })
