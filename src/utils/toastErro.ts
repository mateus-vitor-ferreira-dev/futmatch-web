import { toast } from 'sonner'
import { ehErroDeAssinatura, ehErroDeLimiteDePlano, mensagemDeErro } from './apiError'

/** Onde o dono assina ou gerencia o Só+1 Pro. */
const ROTA_PLANOS = '/owner/plans'

/**
 * Mostra o erro de uma chamada à API, com o caminho da assinatura quando for
 * o caso.
 *
 * Existe porque o `toast.error('Erro ao salvar quadra.')` das telas do dono
 * era um beco sem saída: desde que a API passou a exigir assinatura ativa
 * (#119), a mesma frase aparece para um campo inválido e para uma assinatura
 * vencida. No segundo caso o usuário não tem o que corrigir no formulário — e
 * não fica sabendo disso.
 *
 * O erro de assinatura ganha um toast mais longo e um botão que leva ao
 * pagamento. Todo o resto segue igual.
 */
export function toastErroDeApi(err: unknown, padrao?: string): void {
  if (ehErroDeLimiteDePlano(err)) {
    toast.error(mensagemDeErro(err, 'Você atingiu o limite do seu plano.'), {
      duration: 8000,
      action: {
        label: 'Ver planos',
        onClick: () => window.location.assign(ROTA_PLANOS),
      },
    })
    return
  }

  if (ehErroDeAssinatura(err)) {
    toast.error(mensagemDeErro(err, 'É preciso ter uma assinatura ativa para esta ação.'), {
      // Mais tempo que o padrão: aqui o usuário precisa ler e decidir, não só
      // registrar que algo falhou.
      duration: 8000,
      action: {
        label: 'Assinar',
        // Navegação fora de componente — o toast pode ser disparado de
        // qualquer camada, inclusive de fora da árvore do React Router.
        onClick: () => window.location.assign(ROTA_PLANOS),
      },
    })
    return
  }

  toast.error(mensagemDeErro(err, padrao))
}
