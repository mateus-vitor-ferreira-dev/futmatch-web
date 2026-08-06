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

/**
 * O erro é "assine", e não "faça login" nem "não é seu"?
 *
 * A API passou a recusar as ações de dono que exigem assinatura paga, com
 * `402` e código `SUBSCRIPTION_REQUIRED`. O status é próprio justamente para
 * ser distinguível: 401 manda para o login, 403 diz que o recurso é de outra
 * pessoa, e 402 é o único em que a saída do usuário é pagar.
 *
 * Checa o código antes do status: o status sozinho é do protocolo, o código é
 * o que a API promete. Se um dia outro 402 aparecer, este continua certo.
 */
export function ehErroDeAssinatura(err: unknown): boolean {
  if (!(err instanceof AxiosError)) return false
  const corpo = err.response?.data as ApiErrorBody | undefined
  if (corpo?.code === 'SUBSCRIPTION_REQUIRED') return true
  return err.response?.status === 402
}
