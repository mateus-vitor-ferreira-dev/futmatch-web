import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import * as usersService from '../../services/users'
import { useSports, getSportMeta } from '../../hooks/useSports'
import { chaves } from '../../lib/queryClient'
import { mensagemDeErro } from '../../utils/apiError'
import { NIVEIS, posicoesDe, rotuloDoNivel } from '../../constants/sportPositions'
import type { CompetitionLevel, CourtType, SportProfile } from '../../types/api'
import {
  Bloco, Explicacao, Lista, Item, BotaoDeItem, Vazio,
  Formulario, Campos, Campo, AcoesDoFormulario, AdicionarBtn, Erro,
} from './styles'

/**
 * Perfil esportivo do jogador: nível e posição preferida, uma linha por
 * modalidade (web#214, épico api#201).
 *
 * Sem esta tela ninguém preenche o dado, e sorteio equilibrado sem dado
 * preenchido é sorteio aleatório com nome bonito.
 *
 * Uma linha **por modalidade**, e não uma por jogador: a mesma pessoa pode ser
 * avançada no futsal e iniciante no vôlei, e um nível único mentiria em onze das
 * doze.
 */

interface EmEdicao {
  sport: CourtType | ''
  level: CompetitionLevel
  position: string
  /** `true` quando a modalidade já existe e está sendo editada — trava o select. */
  editando: boolean
}

const NOVO: EmEdicao = { sport: '', level: 'INTERMEDIATE', position: '', editando: false }

export function PerfilEsportivo() {
  const queryClient = useQueryClient()
  const { sports } = useSports()

  const [form, setForm] = useState<EmEdicao | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [removendo, setRemovendo] = useState<CourtType | null>(null)

  const {
    data: perfis = [],
    isPending,
    isError,
    refetch,
  } = useQuery<SportProfile[]>({
    queryKey: chaves.perfisEsportivos(),
    queryFn: async () => (await usersService.getSportProfiles()).data.data ?? [],
  })

  const jaCadastradas = new Set(perfis.map(p => p.sport))
  // Ao editar, a própria modalidade continua na lista — senão o select abriria
  // vazio e o rótulo sumiria justamente na tela que a está editando.
  const disponiveis = sports.filter(
    s => !jaCadastradas.has(s.id) || (form?.editando && form.sport === s.id),
  )

  const posicoes = form?.sport ? posicoesDe(form.sport) : []

  function abrirNovo() {
    setForm({ ...NOVO, sport: disponiveis[0]?.id ?? '' })
  }

  function abrirEdicao(perfil: SportProfile) {
    setForm({
      sport: perfil.sport,
      level: perfil.level,
      position: perfil.position ?? '',
      editando: true,
    })
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    if (!form?.sport) return

    setSalvando(true)
    try {
      // String vazia vira `null` de propósito: o formulário está dizendo "não
      // tenho posição", e não "guarde vazio".
      await usersService.upsertSportProfile(form.sport, {
        level: form.level,
        position: form.position || null,
      })
      await queryClient.invalidateQueries({ queryKey: chaves.perfisEsportivos() })
      toast.success(form.editando ? 'Modalidade atualizada.' : 'Modalidade adicionada.')
      setForm(null)
    } catch (erro) {
      toast.error(mensagemDeErro(erro, 'Não foi possível salvar a modalidade.'))
    } finally {
      setSalvando(false)
    }
  }

  async function remover(sport: CourtType) {
    setRemovendo(sport)
    try {
      await usersService.deleteSportProfile(sport)
      await queryClient.invalidateQueries({ queryKey: chaves.perfisEsportivos() })
      toast.success('Modalidade removida.')
      if (form?.sport === sport) setForm(null)
    } catch (erro) {
      toast.error(mensagemDeErro(erro, 'Não foi possível remover a modalidade.'))
    } finally {
      setRemovendo(null)
    }
  }

  if (isPending) {
    return (
      <Bloco>
        <Explicacao role="status" aria-live="polite">Carregando suas modalidades...</Explicacao>
      </Bloco>
    )
  }

  if (isError) {
    return (
      <Bloco>
        <Erro role="alert">Não foi possível carregar suas modalidades.</Erro>
        <AdicionarBtn type="button" onClick={() => refetch()}>
          Tentar de novo
        </AdicionarBtn>
      </Bloco>
    )
  }

  return (
    <Bloco>
      <Explicacao>
        Diga em quais modalidades você joga, seu nível e a posição preferida. É o que
        permite ao organizador sortear times equilibrados em vez de aleatórios — e
        cada modalidade tem o seu nível, porque ninguém joga tudo igual.
      </Explicacao>

      {perfis.length === 0 && !form && (
        <Vazio>
          Você ainda não cadastrou nenhuma modalidade.
          <br />
          Sem isso, o sorteio equilibrado trata você como jogador de nível médio.
        </Vazio>
      )}

      {perfis.length > 0 && (
        <Lista>
          {perfis.map(perfil => {
            const meta = getSportMeta(perfil.sport)
            return (
              <Item key={perfil.sport}>
                <span className="icone" aria-hidden="true">{meta.icon}</span>
                <span className="texto">
                  <span className="modalidade">{meta.label}</span>
                  <span className="detalhe">
                    {rotuloDoNivel(perfil.level)}
                    {perfil.position ? ` · ${perfil.position}` : ' · qualquer posição'}
                  </span>
                </span>
                <span className="acoes">
                  <BotaoDeItem
                    type="button"
                    onClick={() => abrirEdicao(perfil)}
                    aria-label={`Editar ${meta.label}`}
                    disabled={removendo === perfil.sport}
                  >
                    <Pencil size={15} aria-hidden="true" />
                  </BotaoDeItem>
                  <BotaoDeItem
                    type="button"
                    $perigo
                    onClick={() => remover(perfil.sport)}
                    aria-label={`Remover ${meta.label}`}
                    disabled={removendo === perfil.sport}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </BotaoDeItem>
                </span>
              </Item>
            )
          })}
        </Lista>
      )}

      {form ? (
        <Formulario onSubmit={salvar}>
          <Campos>
            <Campo>
              <label htmlFor="modalidade-esportiva">Modalidade</label>
              <select
                id="modalidade-esportiva"
                value={form.sport}
                // Editar não troca de modalidade: trocar seria criar outra e
                // deixar a primeira para trás sem ninguém pedir isso.
                disabled={form.editando}
                onChange={e =>
                  // A posição é limpa junto: "Goleiro" não existe no vôlei, e
                  // manter o valor antigo gravaria uma posição que a nova
                  // modalidade não oferece.
                  setForm({ ...form, sport: e.target.value as CourtType, position: '' })
                }
              >
                {disponiveis.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo>
              <label htmlFor="nivel-esportivo">Seu nível</label>
              <select
                id="nivel-esportivo"
                value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value as CompetitionLevel })}
              >
                {NIVEIS.map(nivel => (
                  <option key={nivel.id} value={nivel.id}>
                    {nivel.label} — {nivel.descricao}
                  </option>
                ))}
              </select>
            </Campo>
          </Campos>

          <Campo>
            <label htmlFor="posicao-esportiva">Posição preferida</label>
            <select
              id="posicao-esportiva"
              value={form.position}
              disabled={posicoes.length === 0}
              onChange={e => setForm({ ...form, position: e.target.value })}
            >
              <option value="">Qualquer posição</option>
              {posicoes.map(posicao => (
                <option key={posicao} value={posicao}>
                  {posicao}
                </option>
              ))}
            </select>
            <span className="ajuda">
              {posicoes.length === 0
                ? 'Esta modalidade não tem posições fixas.'
                : 'Opcional. O sorteio usa a posição para não juntar dois goleiros no mesmo time.'}
            </span>
          </Campo>

          <AcoesDoFormulario>
            <button type="button" className="cancelar" onClick={() => setForm(null)} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="salvar" disabled={salvando || !form.sport}>
              {salvando ? 'Salvando...' : 'Salvar modalidade'}
            </button>
          </AcoesDoFormulario>
        </Formulario>
      ) : (
        <AdicionarBtn type="button" onClick={abrirNovo} disabled={disponiveis.length === 0}>
          <Plus size={16} aria-hidden="true" />
          {disponiveis.length === 0 ? 'Você já cadastrou todas as modalidades' : 'Adicionar modalidade'}
        </AdicionarBtn>
      )}
    </Bloco>
  )
}

export default PerfilEsportivo
