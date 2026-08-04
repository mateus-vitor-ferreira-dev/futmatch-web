import { AxiosError } from 'axios'
import type { ApiErrorBody } from '../types/api'

/**
 * Extrai a mensagem de erro da API de forma segura.
 *
 * Em `catch (err)` o valor é `unknown` — pode ser um AxiosError, um Error
 * comum, ou qualquer coisa que tenha sido lançada. O padrão
 * `err.response?.data?.message` estava repetido em dez pontos das páginas,
 * cada um assumindo silenciosamente que o erro era do axios.
 */
export function mensagemDeErro(err: unknown, padrao = 'Algo deu errado. Tente novamente.'): string {
  if (err instanceof AxiosError) {
    const corpo = err.response?.data as ApiErrorBody | undefined
    return corpo?.message ?? err.message ?? padrao
  }
  if (err instanceof Error) return err.message || padrao
  return padrao
}
