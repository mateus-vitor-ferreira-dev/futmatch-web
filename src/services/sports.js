import api from './api'

export const getSports = () =>
  api.get('/sports').then((r) => r.data.data)
