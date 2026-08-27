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
import { VISIBILIDADES } from './requisitos'

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
