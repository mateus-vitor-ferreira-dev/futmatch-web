import { AlertTriangle, X } from 'lucide-react'
import type {
  PartidaRequirement,
  PartidaRequirementType,
  PartidaVisibility,
  TeamSummary,
  UserBadge,
} from '../../types/api'
import {
  SELOS,
  TIPOS_DE_REQUISITO,
  TODOS_OS_SELOS,
  VISIBILIDADES,
  avisoDeRestricao,
} from '../../utils/requisitos'
import {
  Adicionar,
  Ajuda,
  Aviso,
  BotaoRemover,
  CabecalhoDaRegra,
  CorpoDaRegra,
  Legenda,
  ListaDeRegras,
  Opcao,
  Opcoes,
  Regra,
  Secao,
  Selo,
  Selos,
  SemRegra,
  Subtexto,
  TextoDaOpcao,
} from './styles'

interface Props {
  visibilidade: PartidaVisibility
  aoMudarVisibilidade: (valor: PartidaVisibility) => void
  requisitos: PartidaRequirement[]
  aoMudarRequisitos: (valor: PartidaRequirement[]) => void
  /** Os times de que o organizador é membro. Sem nenhum, o requisito de time não é oferecido. */
  times?: TeamSummary[]
  desabilitado?: boolean
}

/** O `params` com que cada tipo nasce ao ser adicionado. */
function paramsIniciais(tipo: PartidaRequirementType, times: TeamSummary[]) {
  switch (tipo) {
    case 'MIN_ATTENDANCE_RATE':
      return { min: 0.7 }
    case 'MIN_AVERAGE_RATING':
      return { min: 3.5 }
    case 'MIN_MATCHES_PLAYED':
      return { min: 5 }
    case 'BADGE':
      return { badges: [] as UserBadge[] }
    case 'TEAM_MEMBER':
      return { teamId: times[0]?.id ?? '' }
  }
}

/**
 * Visibilidade e requisitos de entrada, na mesma tela (#228).
 *
 * **São dois eixos, e a tela existe para eles não se confundirem.** Quem *vê* a
 * pelada e quem *pode entrar* nela decidem coisas diferentes, e "pública, mas
 * só para quem costuma aparecer" é combinação legítima. Por isso são duas
 * seções separadas, cada uma com a própria pergunta escrita por extenso, e não
 * um seletor único de "privacidade".
 *
 * O componente é **controlado**: ele não salva nada. Quem o usa decide quando
 * persistir — na criação, depois de a pelada existir; na edição, ao confirmar.
 * É o que permite a mesma tela servir aos dois momentos sem saber de nenhum.
 */
export function ConfiguracaoDeAcesso({
  visibilidade,
  aoMudarVisibilidade,
  requisitos,
  aoMudarRequisitos,
  times = [],
  desabilitado = false,
}: Props) {
  const jaUsados = new Set(requisitos.map((r) => r.type))
  // Um requisito por tipo, como a API impõe. Oferecer o que já está na lista
  // faria o organizador "adicionar" algo que na verdade substitui.
  const disponiveis = TIPOS_DE_REQUISITO.filter(
    ({ tipo }) => !jaUsados.has(tipo) && (tipo !== 'TEAM_MEMBER' || times.length > 0),
  )

  const trocarParams = (tipo: PartidaRequirementType, params: PartidaRequirement['params']) =>
    aoMudarRequisitos(requisitos.map((r) => (r.type === tipo ? { ...r, params } : r)))

  const alternarSelo = (atuais: UserBadge[], selo: UserBadge) =>
    atuais.includes(selo) ? atuais.filter((s) => s !== selo) : [...atuais, selo]

  const aviso = avisoDeRestricao(requisitos)

  return (
    <>
      <Secao>
        <Legenda>Quem vê esta pelada</Legenda>
        <Subtexto>É sobre como se chega até ela — não sobre quem pode entrar.</Subtexto>

        <Opcoes>
          {VISIBILIDADES.map(({ valor, titulo, descricao }) => (
            <Opcao key={valor} $ativa={visibilidade === valor}>
              <input
                type="radio"
                name="visibilidade"
                value={valor}
                checked={visibilidade === valor}
                disabled={desabilitado}
                onChange={() => aoMudarVisibilidade(valor)}
              />
              <TextoDaOpcao>
                <strong>{titulo}</strong>
                <small>{descricao}</small>
              </TextoDaOpcao>
            </Opcao>
          ))}
        </Opcoes>
      </Secao>

      <Secao>
        <Legenda>Quem pode entrar</Legenda>
        <Subtexto>Sem nenhuma regra, qualquer pessoa que chegar até a pelada entra.</Subtexto>

        {requisitos.length === 0 ? (
          <SemRegra>Nenhuma regra por enquanto.</SemRegra>
        ) : (
          <ListaDeRegras>
            {requisitos.map((requisito) => {
              const meta = TIPOS_DE_REQUISITO.find((t) => t.tipo === requisito.type)
              const selosMarcados = requisito.params?.badges ?? []

              return (
                <Regra key={requisito.type}>
                  <CabecalhoDaRegra>
                    <strong>{meta?.titulo ?? requisito.type}</strong>
                    <BotaoRemover
                      type="button"
                      disabled={desabilitado}
                      aria-label={`Remover regra: ${meta?.titulo ?? requisito.type}`}
                      onClick={() =>
                        aoMudarRequisitos(requisitos.filter((r) => r.type !== requisito.type))
                      }
                    >
                      <X size={13} aria-hidden /> Remover
                    </BotaoRemover>
                  </CabecalhoDaRegra>

                  <CorpoDaRegra>
                    {requisito.type === 'MIN_ATTENDANCE_RATE' && (
                      <label>
                        Presença mínima (%)
                        {/* A API guarda fração de 0 a 1 e não aceita
                            porcentagem, porque `1` seria ambíguo. Quem digita
                            pensa em porcentagem, então a conversão fica aqui. */}
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={5}
                          disabled={desabilitado}
                          value={Math.round((requisito.params?.min ?? 0) * 100)}
                          onChange={(e) =>
                            trocarParams(requisito.type, { min: Number(e.target.value) / 100 })
                          }
                        />
                      </label>
                    )}

                    {requisito.type === 'MIN_AVERAGE_RATING' && (
                      <label>
                        Nota média mínima
                        <input
                          type="number"
                          min={0}
                          max={5}
                          step={0.5}
                          disabled={desabilitado}
                          value={requisito.params?.min ?? 0}
                          onChange={(e) => trocarParams(requisito.type, { min: Number(e.target.value) })}
                        />
                      </label>
                    )}

                    {requisito.type === 'MIN_MATCHES_PLAYED' && (
                      <label>
                        Partidas já jogadas
                        <input
                          type="number"
                          min={0}
                          step={1}
                          disabled={desabilitado}
                          value={requisito.params?.min ?? 0}
                          onChange={(e) => trocarParams(requisito.type, { min: Number(e.target.value) })}
                        />
                      </label>
                    )}

                    {requisito.type === 'BADGE' && (
                      <Selos role="group" aria-label="Selos aceitos">
                        {TODOS_OS_SELOS.map((selo) => (
                          <Selo key={selo} $ativo={selosMarcados.includes(selo)}>
                            <input
                              type="checkbox"
                              checked={selosMarcados.includes(selo)}
                              disabled={desabilitado}
                              onChange={() =>
                                trocarParams(requisito.type, {
                                  badges: alternarSelo(selosMarcados, selo),
                                })
                              }
                            />
                            {SELOS[selo]}
                          </Selo>
                        ))}
                      </Selos>
                    )}

                    {requisito.type === 'TEAM_MEMBER' && (
                      <label>
                        Time
                        <select
                          disabled={desabilitado}
                          value={requisito.params?.teamId ?? ''}
                          onChange={(e) => trocarParams(requisito.type, { teamId: e.target.value })}
                        >
                          {times.map((time) => (
                            <option key={time.id} value={time.id}>
                              {time.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {meta && <Ajuda>{meta.ajuda}</Ajuda>}
                  </CorpoDaRegra>
                </Regra>
              )
            })}
          </ListaDeRegras>
        )}

        {disponiveis.length > 0 && (
          <Adicionar>
            <select
              aria-label="Adicionar uma regra de entrada"
              value=""
              disabled={desabilitado}
              onChange={(e) => {
                const tipo = e.target.value as PartidaRequirementType
                if (!tipo) return
                aoMudarRequisitos([...requisitos, { type: tipo, params: paramsIniciais(tipo, times) }])
              }}
            >
              <option value="">Adicionar uma regra…</option>
              {disponiveis.map(({ tipo, titulo }) => (
                <option key={tipo} value={tipo}>
                  {titulo}
                </option>
              ))}
            </select>
          </Adicionar>
        )}

        {/* `role="status"` e não `alert`: o aviso é consequência do que a pessoa
            acabou de escolher, e um alerta interromperia a montagem da regra. */}
        {aviso && (
          <Aviso role="status">
            <AlertTriangle size={14} aria-hidden />
            <span>{aviso}</span>
          </Aviso>
        )}
      </Secao>
    </>
  )
}
