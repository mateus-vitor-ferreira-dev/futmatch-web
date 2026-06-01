import api from './api'

/**
 * Retorna a lista de modalidades esportivas disponíveis na plataforma.
 * Endpoint público — não requer autenticação.
 * @returns {Promise<Array<{ id: string, label: string, icon: string }>>}
 */
export const getSports = () =>
  api.get('/sports').then((r) => r.data.data)
