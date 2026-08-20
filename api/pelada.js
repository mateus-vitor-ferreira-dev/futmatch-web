/**
 * A prévia do link da pelada, para quem cola o link numa conversa — web#229.
 *
 * O app é uma SPA: toda rota devolve o mesmo `index.html`, e o rastreador do
 * WhatsApp **não roda JavaScript**. Ele lê o HTML que chega e vai embora. Por
 * isso uma meta tag no `index.html` seria necessariamente igual para todas as
 * peladas, e a prévia com data, local e vagas precisa ser montada no servidor.
 *
 * **Só rastreador passa por aqui.** O `vercel.json` roteia para esta função
 * apenas quando o `user-agent` casa com a lista de bots; gente de verdade
 * continua indo direto para o `index.html`, sem servidor no caminho e sem
 * nenhum risco novo de a página da pelada parar de abrir. Se a lista de bots
 * errar para menos, o efeito é o de hoje: link sem prévia.
 *
 * Se errar para mais — um humano cair aqui —, o documento tem um `refresh` e um
 * link visível, então ele chega ao app do mesmo jeito.
 */

/**
 * Lido a cada chamada, e não uma vez no topo do módulo.
 *
 * Contêiner de função é reaproveitado entre invocações, e uma constante de
 * módulo congelaria a configuração no primeiro pedido que caísse naquele
 * contêiner. Ler aqui custa um acesso a objeto e mantém a função honesta com o
 * ambiente — inclusive no teste, que troca a variável entre um caso e outro.
 */
const apiUrl = () => process.env.API_URL || process.env.VITE_API_URL || ''

const GENERICO = {
  titulo: 'Só+1 — Achou jogo.',
  descricao: 'Organize sua pelada, chame a galera e complete o time.',
}

const escapa = (valor) =>
  String(valor).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const formataQuando = (iso) => {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(data)
}

const formataDinheiro = (valor) => {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return null
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * O título e a descrição desta pelada.
 *
 * A descrição junta o que decide se a pessoa clica: onde, quantas vagas
 * sobraram e quanto custa. Cada pedaço só entra se existir — pelada sem valor
 * cadastrado não ganha um "R$ NaN".
 */
function descreve(pelada) {
  const quando = formataQuando(pelada.date)
  const local = [pelada.court?.place?.name, pelada.court?.name].filter(Boolean).join(' · ')

  const confirmados = pelada._count?.participations ?? pelada.participations?.length ?? 0
  const vagas = (pelada.maxPlayers ?? 0) - confirmados
  const porPessoa = pelada.maxPlayers > 0 ? Number(pelada.totalValue) / pelada.maxPlayers : null

  const detalhes = [
    local || null,
    vagas > 0 ? `${vagas} vaga${vagas !== 1 ? 's' : ''}` : 'Lotada',
    porPessoa ? `${formataDinheiro(porPessoa)} por pessoa` : null,
  ].filter(Boolean)

  return {
    titulo: quando ? `Pelada ${quando}` : 'Pelada no Só+1',
    descricao: detalhes.join(' · ') || GENERICO.descricao,
  }
}

/**
 * Pergunta à API exatamente como o visitante perguntaria, com o convite junto.
 *
 * **A regra de quem pode ver continua sendo a da API.** Pelada que ela recusa
 * para este pedido não ganha prévia com dados — cai na genérica. Reproduzir
 * aqui a lógica de visibilidade criaria uma segunda fonte de verdade, e a que
 * vaza é sempre a cópia.
 */
async function buscaPelada(id, convite) {
  const base = apiUrl()
  if (!base) return null

  const url = new URL(`${base.replace(/\/$/, '')}/events/${encodeURIComponent(id)}`)
  if (convite) url.searchParams.set('convite', convite)

  const controle = new AbortController()
  const relogio = setTimeout(() => controle.abort(), 2500)

  try {
    const resposta = await fetch(url, { signal: controle.signal, headers: { accept: 'application/json' } })
    if (!resposta.ok) return null
    const corpo = await resposta.json()
    return corpo?.data ?? null
  } catch {
    // Rede, timeout, 404, pelada privada sem convite: todos caem na genérica. A
    // prévia é enfeite, e enfeite não pode derrubar nada.
    return null
  } finally {
    clearTimeout(relogio)
  }
}

function documento({ titulo, descricao, urlDaPagina, urlDaImagem }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escapa(titulo)}</title>
<meta name="description" content="${escapa(descricao)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Só+1">
<meta property="og:title" content="${escapa(titulo)}">
<meta property="og:description" content="${escapa(descricao)}">
<meta property="og:url" content="${escapa(urlDaPagina)}">
<meta property="og:image" content="${escapa(urlDaImagem)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapa(titulo)}">
<meta name="twitter:description" content="${escapa(descricao)}">
<meta name="twitter:image" content="${escapa(urlDaImagem)}">
<meta http-equiv="refresh" content="0; url=${escapa(urlDaPagina)}">
</head>
<body>
<p><a href="${escapa(urlDaPagina)}">${escapa(titulo)}</a></p>
</body>
</html>`
}

export default async function handler(req, res) {
  const { id, convite } = req.query ?? {}

  const protocolo = (req.headers['x-forwarded-proto'] || 'https').split(',')[0]
  const host = req.headers['x-forwarded-host'] || req.headers.host || ''
  const origem = `${protocolo}://${host}`

  const urlDaPagina = `${origem}/pelada/${encodeURIComponent(id ?? '')}${
    convite ? `?convite=${encodeURIComponent(convite)}` : ''
  }`

  const pelada = id ? await buscaPelada(id, convite) : null
  const { titulo, descricao } = pelada ? descreve(pelada) : GENERICO

  // O cartão fica no cache da borda por 5 minutos. Prévia é leitura pública e
  // repetida — o WhatsApp busca uma vez por link colado —, e cinco minutos é
  // curto o bastante para uma pelada que mudou de vagas não mentir por muito
  // tempo.
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

  return res.status(200).send(
    documento({ titulo, descricao, urlDaPagina, urlDaImagem: `${origem}/og-image.png` }),
  )
}
