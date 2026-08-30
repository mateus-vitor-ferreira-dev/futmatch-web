import { GraduationCap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Bloco, Espaco, Explicacao, Lista, Titulo } from './styles'

/**
 * Onde a pessoa dá aula (web#377, api#451).
 *
 * ## Por que no perfil, e não no menu
 *
 * A api#451 diz que a entrada do professor deve aparecer *"do mesmo jeito que
 * 'Painel Owner' aparece hoje no menu do jogador"* — só que o painel do
 * professor **é a lista de aulas**, e aula não existe no schema: ela é o épico
 * api#444, que ainda não começou. Um item de menu levaria a uma tela vazia sem
 * nada que a possa preencher.
 *
 * O que dá para fazer hoje, e resolve o essencial, é o vínculo ficar **visível
 * para quem o tem**: aceitar um convite tem de produzir algo que a pessoa
 * consiga ver depois, senão o aceite parece não ter acontecido.
 *
 * ## Não aparece para quem não tem vínculo
 *
 * Nada de "você ainda não é professor de nenhum espaço". Professor é papel de
 * poucos, e um bloco vazio no perfil de todo mundo anunciaria uma
 * funcionalidade que a pessoa não pode alcançar sozinha — só o dono de um
 * espaço a concede.
 */
export function VinculosDeProfessor() {
  const { user } = useAuth()
  const espacos = user?.vinculos?.professorEm ?? []

  if (espacos.length === 0) return null

  return (
    <Bloco>
      <Titulo>
        <GraduationCap size={16} aria-hidden /> Você dá aula em
      </Titulo>
      <Lista>
        {espacos.map((espaco) => (
          <Espaco key={espaco.id}>{espaco.name}</Espaco>
        ))}
      </Lista>
      <Explicacao>
        {/*
          O papel por espaço é a coisa que a api#451 existe para dizer, e é
          contraintuitiva: o resto do produto trata papel como atributo da
          conta. Quem tem vínculo em dois lugares precisa saber que são dois
          papéis, e não um.
        */}
        Este papel vale só dentro {espacos.length === 1 ? 'deste espaço' : 'destes espaços'} —
        não muda nada no resto da sua conta. Quem concede é o dono, e o vínculo nasce de um
        convite que você aceitou.
      </Explicacao>
    </Bloco>
  )
}
