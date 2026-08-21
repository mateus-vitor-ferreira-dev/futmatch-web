import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Loader, MapPin, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import * as usersService from '../../services/users'
import { mensagemDeErro } from '../../utils/apiError'
import {
  Acoes,
  Apagar,
  Aviso,
  Campo,
  Dica,
  Entrada,
  Explicacao,
  Grade,
  Rotulo,
  Salvar,
  Secao,
} from './styles'
import { SectionTitle } from '../../pages/Profile/styles'

/** `37200000` vira `37200-000`. Só isso: o resto do formato a API normaliza. */
function comHifen(bruto: string): string {
  const digitos = bruto.replace(/\D/g, '').slice(0, 8)
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos
}

const soDigitos = (valor: string) => valor.replace(/\D/g, '')

/**
 * O endereço do jogador (#221).
 *
 * **Ele existe para uma coisa só: calcular distância.** É por isso que a
 * explicação vem antes dos campos e diz que é opcional — pedir endereço sem
 * dizer para quê é o tipo de campo que a pessoa pula, e um endereço que
 * ninguém preenche deixa a recomendação inteira devolvendo lista vazia.
 *
 * São CEP, cidade e UF, e nada mais. Rua e número ficam de fora de propósito
 * (api#215): o CEP resolve a distância com precisão de quadra, e guardar o
 * endereço residencial completo ampliaria o que precisa ser protegido sob LGPD
 * sem melhorar a consulta.
 *
 * **O CEP preenche cidade e UF sozinho** (api#372), e enquanto ele estiver
 * preenchido os dois campos ficam bloqueados — não por capricho, mas porque a
 * API ignora o que for mandado neles quando há CEP. Deixá-los editáveis
 * mostraria à pessoa um valor que não seria salvo.
 */
export function EnderecoDoJogador() {
  const { user, refreshUser } = useAuth()
  const salvo = user?.address

  const [cep, setCep] = useState(() => comHifen(salvo?.zipCode ?? ''))
  const [cidade, setCidade] = useState(salvo?.city ?? '')
  const [uf, setUf] = useState(salvo?.state ?? '')

  const [consultando, setConsultando] = useState(false)
  const [erroDoCep, setErroDoCep] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [apagando, setApagando] = useState(false)
  const [erroAoSalvar, setErroAoSalvar] = useState<string | null>(null)

  /**
   * O último CEP consultado, para não repetir a chamada.
   *
   * O efeito abaixo roda a cada tecla, e sem esta guarda um CEP completo
   * consultaria de novo a cada caractere apagado e redigitado no fim.
   */
  const ultimoConsultado = useRef(soDigitos(salvo?.zipCode ?? ''))

  useEffect(() => {
    const digitos = soDigitos(cep)

    if (digitos.length !== 8) {
      setErroDoCep(null)
      return
    }
    if (digitos === ultimoConsultado.current) return

    let cancelado = false
    // Espera a digitação parar. Sem isso, um CEP colado dispararia até oito
    // consultas — e a última é a única que interessa.
    const relogio = setTimeout(async () => {
      setConsultando(true)
      setErroDoCep(null)
      try {
        const res = await usersService.consultarCep(digitos)
        if (cancelado) return
        ultimoConsultado.current = digitos
        setCidade(res.data.data.city)
        setUf(res.data.data.state)
      } catch (erro) {
        if (cancelado) return
        // O CEP não é apagado: quem digitou 7 dígitos e um errado corrige um
        // caractere, e limpar o campo o obrigaria a redigitar tudo.
        setErroDoCep(mensagemDeErro(erro, 'Não foi possível consultar este CEP.'))
      } finally {
        if (!cancelado) setConsultando(false)
      }
    }, 500)

    return () => {
      cancelado = true
      clearTimeout(relogio)
    }
  }, [cep])

  const temCep = soDigitos(cep).length === 8
  const podeSalvar = temCep ? !erroDoCep : Boolean(cidade.trim() && uf.trim().length === 2)

  const salvar = async () => {
    setSalvando(true)
    setErroAoSalvar(null)
    try {
      // Cidade e UF vão junto mesmo com CEP: a API os ignora quando consegue
      // derivá-los, e são eles que sustentam o cadastro quando o ViaCEP e a
      // Google estão os dois fora do ar.
      await usersService.salvarEndereco({
        zipCode: temCep ? soDigitos(cep) : null,
        city: cidade.trim() || undefined,
        state: uf.trim().toUpperCase() || undefined,
      })
      await refreshUser()
      toast.success('Endereço salvo!')
    } catch (erro) {
      setErroAoSalvar(mensagemDeErro(erro, 'Não foi possível salvar o endereço.'))
    } finally {
      setSalvando(false)
    }
  }

  const apagar = async () => {
    setApagando(true)
    setErroAoSalvar(null)
    try {
      await usersService.apagarEndereco()
      await refreshUser()
      setCep('')
      setCidade('')
      setUf('')
      ultimoConsultado.current = ''
      toast.success('Endereço removido.')
    } catch (erro) {
      setErroAoSalvar(mensagemDeErro(erro, 'Não foi possível remover o endereço.'))
    } finally {
      setApagando(false)
    }
  }

  const ocupado = salvando || apagando

  return (
    <Secao aria-labelledby="titulo-endereco">
      <SectionTitle id="titulo-endereco">Endereço</SectionTitle>

      <Explicacao>
        Usamos só para achar peladas perto de você e mostrar a distância de cada uma.{' '}
        <strong>É opcional</strong> — o app funciona inteiro sem ele. Pedimos CEP, cidade e estado,
        e nada mais: rua e número não melhoram um raio em quilômetros.
      </Explicacao>

      <Grade>
        <Campo>
          <Rotulo htmlFor="endereco-cep">CEP</Rotulo>
          <Entrada
            id="endereco-cep"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="37200-000"
            value={cep}
            $erro={Boolean(erroDoCep)}
            disabled={ocupado}
            aria-describedby="dica-cep"
            onChange={(e) => setCep(comHifen(e.target.value))}
          />
          <Dica id="dica-cep" $erro={Boolean(erroDoCep)}>
            {consultando
              ? 'Consultando…'
              : (erroDoCep ?? 'Preenche cidade e estado sozinho. Não sabe? Deixe em branco.')}
          </Dica>
        </Campo>

        <Campo>
          <Rotulo htmlFor="endereco-cidade">Cidade</Rotulo>
          <Entrada
            id="endereco-cidade"
            autoComplete="address-level2"
            placeholder="Lavras"
            value={cidade}
            // Bloqueado com CEP porque a API ignora o que vier aqui: editável,
            // o campo mostraria um valor que não seria salvo.
            disabled={ocupado || temCep}
            onChange={(e) => setCidade(e.target.value)}
          />
        </Campo>

        <Campo>
          <Rotulo htmlFor="endereco-uf">UF</Rotulo>
          <Entrada
            id="endereco-uf"
            autoComplete="address-level1"
            placeholder="MG"
            maxLength={2}
            value={uf}
            disabled={ocupado || temCep}
            onChange={(e) => setUf(e.target.value.toUpperCase())}
          />
        </Campo>
      </Grade>

      <Acoes>
        <Salvar type="button" onClick={() => void salvar()} disabled={!podeSalvar || ocupado}>
          {salvando ? <Loader size={15} aria-hidden /> : <MapPin size={15} aria-hidden />}
          {salvando ? 'Salvando…' : 'Salvar endereço'}
        </Salvar>

        {salvo?.zipCode || salvo?.city ? (
          <Apagar type="button" onClick={() => void apagar()} disabled={ocupado}>
            <Trash2 size={15} aria-hidden />
            {apagando ? 'Removendo…' : 'Remover endereço'}
          </Apagar>
        ) : null}
      </Acoes>

      {erroAoSalvar && (
        <Aviso $erro role="alert">
          <AlertCircle size={14} aria-hidden />
          <span>{erroAoSalvar}</span>
        </Aviso>
      )}

      {!erroAoSalvar && salvo?.latitude != null && (
        <Aviso role="status">
          <MapPin size={14} aria-hidden />
          <span>
            Endereço confirmado em {salvo.city}/{salvo.state}. Já dá para ver as peladas mais
            próximas.
          </span>
        </Aviso>
      )}
    </Secao>
  )
}
