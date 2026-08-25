import type { PartidaRequirementParams, PartidaRequirementType, PartidaVisibility, UserBadge } from '../types/api'

/**
 * O vocabulário das regras de entrada, num lugar só (#228).
 *
 * A tela que **configura** e a que **mostra** precisam dizer a mesma coisa. Se
 * o organizador lê "Presença mínima de 80%" ao montar e o jogador lê outra
 * frase ao chegar, os dois estão olhando a mesma regra e discordando sobre ela
 * — que é o tipo de divergência que ninguém percebe até virar reclamação.
 */

/** Como cada selo se escreve para gente. O valor do enum não vai para a tela. */
export const SELOS: Record<UserBadge, string> = {
  CRAQUE: 'Craque',
  CONFIAVEL: 'Confiável',
  ORGANIZADOR_NATO: 'Organizador nato',
  PONTUAL: 'Pontual',
}

export const TODOS_OS_SELOS = Object.keys(SELOS) as UserBadge[]

/**
 * As três visibilidades, explicadas sem jargão.
 *
 * A `descricao` é critério de aceite da #228, e não enfeite: "por link" e
 * "privada" soam iguais para quem nunca leu a documentação, e o organizador que
 * escolhe errado publica para a cidade inteira uma pelada que queria fechada.
 */
export const VISIBILIDADES: Array<{
  valor: PartidaVisibility
  titulo: string
  descricao: string
}> = [
  {
    valor: 'PUBLIC',
    titulo: 'Pública',
    descricao: 'Aparece na busca. Qualquer pessoa encontra e pede para entrar.',
  },
  {
    valor: 'LINK',
    titulo: 'Por link',
    descricao: 'Fora da busca. Quem recebe o endereço abre e entra — e pode repassá-lo.',
  },
  {
    valor: 'PRIVATE',
    titulo: 'Privada',
    descricao: 'Fora da busca, e o endereço sozinho não abre. Só entra quem você convidar.',
  },
]

/** O catálogo de requisitos, na ordem em que a tela os oferece. */
export const TIPOS_DE_REQUISITO: Array<{
  tipo: PartidaRequirementType
  titulo: string
  ajuda: string
}> = [
  {
    tipo: 'MIN_MATCHES_PLAYED',
    titulo: 'Partidas já jogadas',
    ajuda: 'Conta as presenças confirmadas. Quem está começando não passa — é o único que não perdoa o estreante.',
  },
  {
    tipo: 'MIN_ATTENDANCE_RATE',
    titulo: 'Presença mínima',
    ajuda: 'Quem tem menos de 5 partidas registradas passa: não dá para cobrar uma taxa que ainda não existe.',
  },
  {
    tipo: 'MIN_AVERAGE_RATING',
    titulo: 'Nota média',
    ajuda: 'Quem nunca foi avaliado passa. Média de zero avaliações é ausência, não nota baixa.',
  },
  {
    tipo: 'BADGE',
    titulo: 'Selo conquistado',
    ajuda: 'Passa quem tem qualquer um dos selos marcados.',
  },
  {
    tipo: 'TEAM_MEMBER',
    titulo: 'Ser do meu time',
    ajuda: 'Fecha a partida para os membros do time, sem prazo.',
  },
]

/**
 * A regra escrita por extenso.
 *
 * `nomeDoTime` é opcional porque nem sempre está à mão: o `params` guarda só o
 * id, e a leitura pública da pelada não devolve o time. Quem sabe o nome passa;
 * quem não sabe recebe a frase genérica, que continua verdadeira.
 */
export function descreveRequisito(
  type: PartidaRequirementType,
  params: PartidaRequirementParams | null | undefined,
  nomeDoTime?: string,
): string {
  const min = params?.min

  switch (type) {
    case 'MIN_ATTENDANCE_RATE':
      // O `params.min` é fração de 0 a 1 — a API não aceita porcentagem, porque
      // `1` seria ambíguo. A tela é quem traduz para o número que se lê.
      return `Presença mínima de ${Math.round((min ?? 0) * 100)}%`
    case 'MIN_AVERAGE_RATING':
      return `Nota média a partir de ${(min ?? 0).toFixed(1)}`
    case 'MIN_MATCHES_PLAYED':
      return min === 1 ? 'Ter jogado ao menos 1 partida' : `Ter jogado ao menos ${min ?? 0} partidas`
    case 'BADGE': {
      const selos = (params?.badges ?? []).map((b) => SELOS[b] ?? b)
      if (selos.length === 0) return 'Selo exigido pelo organizador'
      // "Qualquer um" é o que a API faz (api#380), e escrever "e" aqui inverteria
      // a regra na cabeça de quem lê.
      return selos.length === 1 ? `Ter o selo ${selos[0]}` : `Ter algum destes selos: ${selos.join(', ')}`
    }
    case 'TEAM_MEMBER':
      return nomeDoTime ? `Ser do time ${nomeDoTime}` : 'Ser membro do time indicado pelo organizador'
  }
}

/**
 * O aviso de combinação restritiva demais (#228).
 *
 * O critério da issue pedia uma **estimativa** de quantos jogadores passariam,
 * e a API não sabe responder isso — virou issue própria. O que dá para fazer
 * hoje, e resolve o essencial, é avisar quando a combinação é notoriamente
 * fechada: sem nenhum retorno, o organizador empilha requisitos e só descobre o
 * efeito quando ninguém aparece.
 *
 * Os cortes são deliberadamente conservadores. Avisar demais ensina a ignorar o
 * aviso, e um aviso ignorado é pior que nenhum.
 */
export function avisoDeRestricao(requisitos: Array<{ type: PartidaRequirementType; params: PartidaRequirementParams | null }>): string | null {
  if (requisitos.length === 0) return null

  const de = (tipo: PartidaRequirementType) => requisitos.find((r) => r.type === tipo)

  // Time fecha a pelada por completo: nenhum outro requisito muda o alcance
  // depois dele, e por isso ele fala primeiro.
  if (de('TEAM_MEMBER')) {
    return 'Só quem é do time entra. Os outros requisitos só se aplicam a quem já passou por esse.'
  }

  const presenca = de('MIN_ATTENDANCE_RATE')?.params?.min
  const nota = de('MIN_AVERAGE_RATING')?.params?.min
  const jogadas = de('MIN_MATCHES_PLAYED')?.params?.min

  if ((presenca ?? 0) >= 0.9) return 'Presença de 90% ou mais deixa de fora quem faltou uma vez em dez. Isso é bem pouca gente.'
  if ((nota ?? 0) >= 4.5) return 'Nota 4,5 é praticamente a nota máxima. Poucos jogadores chegam lá.'
  if ((jogadas ?? 0) >= 20) return 'Exigir 20 partidas ou mais deixa de fora quase todo mundo que ainda está construindo histórico.'

  if (requisitos.length >= 3) {
    return 'Três regras ou mais se somam, e cada uma corta um pedaço. Vale conferir se ainda sobra gente para encher a partida.'
  }

  return null
}
