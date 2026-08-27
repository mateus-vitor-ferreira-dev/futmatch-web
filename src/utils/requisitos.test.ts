/**
 * A copy que o organizador lê para escolher quem entra na partida dele.
 *
 * Não é texto de apoio: é a informação sobre a qual ele decide. A `PUBLIC`
 * dizia *"qualquer pessoa encontra e **pede** para entrar"*, e pedir não
 * existe — `POST .../participations` grava a participação direto, o `entryGate`
 * devolve a recusa na mesma requisição, e `Participation` nem tem campo de
 * status. O único fluxo de aprovação do produto é o de campeonato (#333).
 *
 * Quem quer controlar entrada lia aquilo, escolhia `PUBLIC` achando que
 * aprovaria cada pessoa, e descobria o contrário com a partida cheia. O produto
 * **tem** como fechar a entrada — requisitos de reputação, selo e time, mais a
 * janela de prioridade —, mas quem foi induzido a esperar aprovação não vai
 * procurar por eles.
 *
 * O teste olha o texto porque o defeito é do texto. Nenhuma asserção sobre a
 * tela montada pegaria uma frase reescrita que volte a prometer aprovação.
 */

import { describe, it, expect } from 'vitest'
import { VISIBILIDADES, fraseDoAlcance } from './requisitos'
import type { FaixaDeAlcance } from '../types/api'

const descricoes = VISIBILIDADES.map((v) => v.descricao).join(' ')

describe('as descrições de visibilidade', () => {
  it('cobrem as três opções, sem buraco', () => {
    expect(VISIBILIDADES.map((v) => v.valor)).toEqual(['PUBLIC', 'LINK', 'PRIVATE'])
    for (const v of VISIBILIDADES) expect(v.descricao.trim(), v.valor).not.toBe('')
  })

  /**
   * "Pedir", "solicitar", "aprovar", "autorizar" — qualquer um deles descreve
   * um fluxo que a partida não tem. O de campeonato existe e é outro produto
   * dentro do produto.
   */
  it('não prometem aprovação, solicitação nem fila — nada disso existe para partida', () => {
    expect(descricoes).not.toMatch(/pede para entrar|pedir para entrar|solicit|aprova|autoriz|fila de espera/i)
  })

  it('a pública diz o que acontece de verdade: entra, se atender aos requisitos', () => {
    const publica = VISIBILIDADES.find((v) => v.valor === 'PUBLIC')?.descricao ?? ''

    expect(publica).toMatch(/aparece na busca/i)
    expect(publica).toMatch(/entra/i)
    // A segunda metade aponta para o recurso que resolve a intenção de quem
    // queria filtrar — sem ela, a frase corrige e não ajuda.
    expect(publica).toMatch(/requisitos/i)
  })

  /**
   * As duas de baixo foram conferidas contra a api: `podeVer` deixa `LINK`
   * passar para qualquer um, porque ter o id **é** a credencial; em `PRIVATE` o
   * id sozinho não vale nada. O teste guarda o que as separa, que é justamente
   * o que a #333 pediu para conferir.
   */
  it('link e privada continuam se distinguindo pelo que o endereço sozinho faz', () => {
    const link = VISIBILIDADES.find((v) => v.valor === 'LINK')?.descricao ?? ''
    const privada = VISIBILIDADES.find((v) => v.valor === 'PRIVATE')?.descricao ?? ''

    expect(link).toMatch(/fora da busca/i)
    expect(link).toMatch(/abre e entra/i)

    expect(privada).toMatch(/fora da busca/i)
    expect(privada).toMatch(/não abre/i)
    expect(privada).toMatch(/convidar/i)
  })
})

/**
 * A frase do alcance estimado (#388).
 *
 * `POUCOS` significa **duas coisas opostas**, e a frase é o único lugar onde
 * essa diferença aparece para quem está configurando:
 *
 * - poucos porque as regras cortaram → afrouxar resolve;
 * - poucos porque não há gente por perto → afrouxar não muda nada, e o
 *   organizador ficaria removendo requisito atrás de um efeito que não vem.
 *
 * Trocar as duas é pior do que não ter estimativa nenhuma: manda a pessoa
 * consertar o que não está quebrado, com a confiança de quem viu um dado.
 */
describe('a frase do alcance', () => {
  const alcance = (
    faixa: FaixaDeAlcance,
    faixaSemRequisitos: FaixaDeAlcance = 'MUITOS',
    raioKm = 10,
  ) => fraseDoAlcance({ faixa, faixaSemRequisitos, raioKm })

  it('ninguém atende: diz que a partida não enche assim', () => {
    const { tom, texto } = alcance('NENHUM')

    expect(tom).toBe('ruim')
    expect(texto).toMatch(/nenhum jogador/i)
    expect(texto).toMatch(/não enche/i)
  })

  it('poucos, com gente por perto: a culpa é das regras', () => {
    const { tom, texto } = alcance('POUCOS', 'MUITOS')

    expect(tom).toBe('atencao')
    expect(texto).toMatch(/atendem a essas regras/i)
  })

  /**
   * O caso que a `faixaSemRequisitos` existe para pegar. Sem ela, a frase
   * culparia as regras por um vazio que elas não causaram.
   */
  it('poucos, e poucos também sem regra nenhuma: a culpa não é das regras', () => {
    const { texto } = alcance('POUCOS', 'POUCOS')

    expect(texto).toMatch(/com ou sem essas regras/i)
    expect(texto).not.toMatch(/atendem a essas regras/i)
  })

  it('sem ninguém no raio, nem tenta estimar o efeito das regras', () => {
    const { tom, texto } = alcance('NENHUM', 'NENHUM')

    expect(tom).toBe('atencao')
    expect(texto).toMatch(/não dá para estimar/i)
  })

  it('alcance confortável fala baixo — o esperado não vira alarme', () => {
    expect(alcance('ALGUNS').tom).toBe('bom')
    expect(alcance('MUITOS').tom).toBe('bom')
    expect(alcance('MUITOS').texto).toMatch(/mais de cinquenta/i)
  })

  it('diz o raio, porque "por perto" sozinho não quer dizer nada', () => {
    expect(alcance('ALGUNS', 'MUITOS', 25).texto).toContain('25 km')
  })

  /**
   * A ressalva não é rodapé: a estimativa só enxerga quem tem endereço salvo,
   * e nenhum cadastro pede endereço (#328). Sem ela, a tela promete uma
   * precisão que não tem — a mesma classe de erro que a landing já cometeu
   * três vezes.
   */
  it('avisa que só conta quem tem endereço salvo, sempre que houver número a defender', () => {
    for (const faixa of ['NENHUM', 'POUCOS'] as const) {
      expect(alcance(faixa, 'MUITOS').texto, faixa).toMatch(/endereço salvo/i)
    }
  })
})
