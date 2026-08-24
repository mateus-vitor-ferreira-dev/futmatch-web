import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Copy, Share2, Link2 } from 'lucide-react'
import { criarConvite, listarConvites, revogarConvite } from '../../services/invites'
import { mensagemDeErro } from '../../utils/apiError'
import type { Partida, PartidaInvite } from '../../types/api'
import {
  ModalOverlay, ModalContent, Subtitulo,
  LinkBox, LinkTexto, Acoes, BotaoPrincipal, BotaoSecundario,
  SecaoDeLinks, TituloDaSecao, ItemDeLink, DadosDoLink, BotaoDeRevogar,
  Etiqueta, Vazio, Fechar,
} from './styles'

/**
 * Um link só está valendo quando não foi revogado, não venceu e ainda tem uso.
 *
 * A conta é repetida aqui de propósito, e não lida de um campo: a API não manda
 * um "ativo" pronto, e derivar é melhor que pedir um campo novo só para a tela
 * não pensar. As três condições são as mesmas três recusas da API — revogado,
 * vencido e esgotado.
 */
function estaValendo(convite: PartidaInvite, agora = Date.now()): boolean {
  if (convite.revokedAt) return false
  if (convite.expiresAt && new Date(convite.expiresAt).getTime() <= agora) return false
  if (convite.remainingUses !== null && convite.remainingUses <= 0) return false
  return true
}

const formataData = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso))

/** O que este link ainda oferece, em uma linha. */
function descreve(convite: PartidaInvite): string {
  const partes = [
    convite.maxUses === null ? 'usos ilimitados' : `${convite.uses} de ${convite.maxUses} usos`,
    convite.expiresAt ? `vence ${formataData(convite.expiresAt)}` : 'sem validade',
  ]
  return partes.join(' · ')
}

/** Por que este link parou de valer — a mesma distinção que a API faz. */
function motivoDeEstarInativo(convite: PartidaInvite, agora = Date.now()): string {
  if (convite.revokedAt) return 'revogado'
  if (convite.expiresAt && new Date(convite.expiresAt).getTime() <= agora) return 'expirado'
  return 'esgotado'
}

/**
 * Compartilhar a pelada por link — #229.
 *
 * O link só vira produto se chegar no grupo do WhatsApp em um toque. Por isso o
 * modal **não pergunta nada antes**: ao abrir, ele reaproveita um link válido
 * ou cria um sem validade e sem limite, que é o caso de longe mais comum.
 * Validade e limite existem na API e ficam para quem precisar deles — pedi-los
 * de todo mundo cobraria duas decisões de quem só quer chamar os amigos.
 */
export default function CompartilharPartida({
  pelada, onFechar,
}: {
  pelada: Partida
  onFechar: () => void
}) {
  const [convites, setConvites] = useState<PartidaInvite[]>([])
  const [convite, setConvite]   = useState<PartidaInvite | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [revogando, setRevogando]   = useState<string | null>(null)

  const preparar = useCallback(async () => {
    setCarregando(true)
    try {
      const existentes = (await listarConvites(pelada.courtId, pelada.id)).data ?? []
      const valendo = existentes.find((c) => estaValendo(c))

      // Reaproveitar é melhor que criar: dois links para a mesma pelada
      // significam dois links para revogar depois, e a lista vira lixo.
      if (valendo) {
        setConvites(existentes)
        setConvite(valendo)
        return
      }

      const novo = (await criarConvite(pelada.courtId, pelada.id)).data
      setConvites([novo, ...existentes])
      setConvite(novo)
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Não foi possível preparar o link de convite.'))
    } finally {
      setCarregando(false)
    }
  }, [pelada.courtId, pelada.id])

  useEffect(() => { preparar() }, [preparar])

  async function copiar() {
    if (!convite) return
    try {
      await navigator.clipboard.writeText(convite.url)
      toast.success('Link copiado!')
    } catch {
      // Área de transferência negada pelo navegador — o link continua na tela
      // para a pessoa selecionar à mão, e é isso que a mensagem diz.
      toast.error('Não foi possível copiar. O link está aí em cima para selecionar.')
    }
  }

  /**
   * O compartilhamento nativo do celular, quando existir.
   *
   * É o critério que faz a diferença no telefone: abre a folha do sistema com
   * WhatsApp, Telegram e o resto, em vez de obrigar a pessoa a copiar, sair do
   * app, abrir a conversa e colar. No desktop `navigator.share` costuma não
   * existir, e aí o botão nem aparece — oferecer o que não funciona é pior que
   * não oferecer.
   */
  async function compartilhar() {
    if (!convite) return
    try {
      await navigator.share({
        title: 'Bora jogar?',
        text: `Entra na minha pelada em ${pelada.court?.place?.name ?? 'quadra'}`,
        url: convite.url,
      })
    } catch {
      // Cancelar o compartilhamento cai aqui e não é erro: a pessoa desistiu, e
      // um toast de falha diria que algo quebrou quando nada quebrou.
    }
  }

  async function revogar(id: string) {
    setRevogando(id)
    try {
      const atualizado = (await revogarConvite(pelada.courtId, pelada.id, id)).data
      setConvites((atual) => atual.map((c) => (c.id === id ? atualizado : c)))
      if (convite?.id === id) setConvite(null)
      toast.success('Link revogado. Quem já entrou continua na pelada.')
    } catch (err) {
      toast.error(mensagemDeErro(err, 'Não foi possível revogar o link.'))
    } finally {
      setRevogando(null)
    }
  }

  const podeCompartilhar = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  return (
    <ModalOverlay onClick={onFechar} role="presentation">
      <ModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Compartilhar a pelada">
        <h2>Chamar gente para a pelada</h2>
        <Subtitulo>
          Quem abrir este link vê a pelada e entra por ele — mesmo sem conta, e mesmo
          que a pelada não apareça na busca.
        </Subtitulo>

        {carregando ? (
          <Vazio>Preparando o link...</Vazio>
        ) : convite ? (
          <>
            <LinkBox>
              <Link2 size={14} aria-hidden />
              <LinkTexto data-testid="link-do-convite">{convite.url}</LinkTexto>
            </LinkBox>

            <Acoes>
              <BotaoPrincipal type="button" onClick={copiar}>
                <Copy size={16} aria-hidden /> Copiar link
              </BotaoPrincipal>
              {podeCompartilhar && (
                <BotaoSecundario type="button" onClick={compartilhar}>
                  <Share2 size={16} aria-hidden /> Compartilhar
                </BotaoSecundario>
              )}
            </Acoes>
          </>
        ) : (
          <Vazio>Nenhum link ativo. Feche e abra de novo para gerar um.</Vazio>
        )}

        {convites.length > 0 && (
          <SecaoDeLinks>
            <TituloDaSecao>Links desta pelada</TituloDaSecao>
            {convites.map((c) => {
              const valendo = estaValendo(c)
              return (
                <ItemDeLink key={c.id} $inativo={!valendo} data-testid="item-de-link">
                  <DadosDoLink>
                    <Etiqueta $tom={valendo ? 'ativo' : 'inativo'}>
                      {valendo ? 'ativo' : motivoDeEstarInativo(c)}
                    </Etiqueta>
                    <span>{descreve(c)}</span>
                  </DadosDoLink>
                  {valendo && (
                    <BotaoDeRevogar
                      type="button"
                      onClick={() => revogar(c.id)}
                      disabled={revogando === c.id}
                    >
                      {revogando === c.id ? 'Revogando...' : 'Revogar'}
                    </BotaoDeRevogar>
                  )}
                </ItemDeLink>
              )
            })}
          </SecaoDeLinks>
        )}

        <Fechar type="button" onClick={onFechar}>Fechar</Fechar>
      </ModalContent>
    </ModalOverlay>
  )
}
