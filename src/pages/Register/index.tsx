import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../contexts/AuthContext'
import { useSports } from '../../hooks/useSports'
import AuthLayout from '../../components/AuthLayout'
import LoginComGoogle from '../../components/LoginComGoogle'
import SportSelect from '../../components/SportSelect'
import PhoneInput from '../../components/PhoneInput'
import PasswordInput from '../../components/PasswordInput'
import type { CourtType, UserRole } from '../../types/api'
import { mensagemDeErro } from '../../utils/apiError'
import {
  Tabs, Tab, FormTitle, FormSubtitle,
  Divider,
  Form, Field, Row, Label, Input, ErrorMsg,
  SubmitButton, SwitchText, ForgotLink, LegalText,
  MarketingConsent,
} from './styles'

const LEGAL_URLS = {
  termos: 'https://so-mais-um.com/termos-de-uso',
  privacidade: 'https://so-mais-um.com/politica-de-privacidade',
} as const

/** Schema de validação para cadastro (inclui nome, confirmação de senha) */
const registerSchema = yup.object({
  name:            yup.string().min(2, 'Mínimo 2 caracteres').required('Obrigatório'),
  email:           yup.string().email('E-mail inválido').required('Obrigatório'),
  phone:           yup.string()
    .test('phone-digits', 'Telefone inválido (ex: 9 9999-9999)', v => {
      if (!v) return true
      return v.replace(/\D/g, '').length >= 10
    })
    .nullable(),
  password:        yup.string().min(6, 'Mínimo 6 caracteres').required('Obrigatório'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Senhas não coincidem')
    .required('Obrigatório'),
  marketingOptIn: yup.boolean().default(false),
})

/** Schema de validação para login (apenas e-mail e senha) */
const loginSchema = yup.object({
  email:    yup.string().email('E-mail inválido').required('Obrigatório'),
  password: yup.string().required('Obrigatório'),
})

/**
 * O resolver alterna entre registerSchema e loginSchema conforme o modo, então
 * o tipo inferido seria o mais estreito dos dois (login). Usa-se o superconjunto
 * — os campos exclusivos do cadastro ficam opcionais no modo login.
 */
type FormularioAuth = yup.InferType<typeof registerSchema>

/**
 * Página unificada de login e cadastro.
 *
 * Exibe tabs para alternar entre os dois modos. A URL reflete o modo atual
 * (/login ou /register), permitindo navegação direta e uso do botão voltar.
 *
 * Funcionalidades:
 *  - Formulário com validação via React Hook Form + Yup
 *  - Login/cadastro via Google OAuth
 *  - Seleção de modalidades esportivas no cadastro (SportSelect)
 *  - Exibição de erros da API via `errors.root`
 *
 * @param {{ initialMode: 'login' | 'register' }} props
 */
export default function Register({ initialMode = 'register' }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register: registerUser, login, googleLogin } = useAuth()

  const mode = initialMode
  /** Modalidades selecionadas no cadastro */
  const [modalities, setModalities] = useState<CourtType[]>([])

  const { sports, loading: loadingSports } = useSports()

  const isRegister = mode === 'register'

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormularioAuth>({
    resolver: yupResolver(isRegister ? registerSchema : loginSchema) as unknown as Resolver<FormularioAuth>,
  })

  /**
   * Para onde voltar depois de entrar, quando alguém mandou a pessoa para cá.
   *
   * Quem chega por um link de convite passa por aqui no meio do caminho, e sem
   * isto o cadastro a jogaria na home — o vazamento que a #229 descreveu e que
   * a #302 consertou na raiz.
   *
   * **Só caminho interno.** Precisa começar com uma barra e não pode começar
   * com duas: `//outrosite.com` é URL absoluta para o navegador, e aceitá-la
   * transformaria a tela de login num redirecionador aberto para phishing.
   */
  function destinoDeVolta(): string | null {
    const next = searchParams.get('next')
    if (!next || !next.startsWith('/') || next.startsWith('//')) return null
    return next
  }

  /** Troca de modo (login ↔ register) limpando o formulário */
  function switchMode(next: 'login' | 'register') {
    reset()
    // A query vai junto: trocar de "entrar" para "criar conta" no meio do
    // caminho não pode perder para onde a pessoa estava indo.
    const destino = destinoDeVolta()
    const query = destino ? `?next=${encodeURIComponent(destino)}` : ''
    navigate(`${next === 'login' ? '/login' : '/register'}${query}`)
  }

  function redirectByRole(role: UserRole) {
    // O destino pedido ganha do padrão do papel — quem foi mandado para cá
    // estava indo a algum lugar, e a home do papel não é esse lugar.
    const destino = destinoDeVolta()
    if (destino) return navigate(destino, { replace: true })

    if (role === 'ADMIN')  return navigate('/admin')
    if (role === 'OWNER')  return navigate('/owner')
    return navigate('/home')
  }

  async function onSubmit(data: FormularioAuth) {
    try {
      let res
      if (isRegister) {
        res = await registerUser({ ...data, sports: modalities })
      } else {
        res = await login(data)
      }
      redirectByRole(res.data.user.role)
    } catch (err) {
      const msg = mensagemDeErro(err, 'Algo deu errado. Tente novamente.')
      setError('root', { message: msg })
    }
  }

  const entrarComGoogle = async (accessToken: string) => {
    try {
      const res = await googleLogin(accessToken)
      redirectByRole(res.data.user.role)
    } catch {
      setError('root', { message: 'Erro ao entrar com Google.' })
    }
  }

  return (
    <AuthLayout>
      {/* Tabs de alternância entre login e cadastro */}
      <Tabs>
        <Tab $active={!isRegister} onClick={() => switchMode('login')}>Entrar</Tab>
        <Tab $active={isRegister}  onClick={() => switchMode('register')}>Cadastrar</Tab>
      </Tabs>

      <FormTitle>{isRegister ? 'Crie sua conta 🧡' : 'Entre na sua conta 👋'}</FormTitle>
      <FormSubtitle>
        {isRegister ? 'É rápido, grátis e sem enrolação.' : 'Bem-vindo de volta!'}
      </FormSubtitle>

      {/* Botão do Google OAuth — o script do GIS só desce depois de um sinal
          de intenção. Ver src/components/LoginComGoogle. */}
      <LoginComGoogle
        rotulo={isRegister ? 'Cadastrar com o Google' : 'Fazer Login com o Google'}
        desabilitado={isSubmitting}
        onSucesso={entrarComGoogle}
        onErro={(message) => setError('root', { message })}
      />

      <Divider>ou use seu e-mail</Divider>

      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        {isRegister && (
          <Field>
            <Label>Nome completo</Label>
            <Input {...register('name')} placeholder="Ex: João da Silva" $error={!!errors.name} />
            {errors.name && <ErrorMsg>{errors.name.message}</ErrorMsg>}
          </Field>
        )}

        <Field>
          <Label>E-mail</Label>
          <Input {...register('email')} type="email" placeholder="seu@email.com" $error={!!errors.email} />
          {errors.email && <ErrorMsg>{errors.email.message}</ErrorMsg>}
        </Field>

        {isRegister && (
          <Field>
            <Label>Telefone</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput {...field} value={field.value ?? ''} error={!!errors.phone} />
              )}
            />
            {errors.phone && <ErrorMsg>{errors.phone.message}</ErrorMsg>}
          </Field>
        )}

        {isRegister ? (
          // Cadastro: senha e confirmação lado a lado
          <Row>
            <Field>
              <Label>Senha</Label>
              <PasswordInput
                {...register('password')}
                placeholder="Mín. 6 caracteres"
                $error={!!errors.password}
              />
              {errors.password && <ErrorMsg>{errors.password.message}</ErrorMsg>}
            </Field>
            <Field>
              <Label>Confirmar</Label>
              <PasswordInput
                {...register('confirmPassword')}
                placeholder="Repita a senha"
                $error={!!errors.confirmPassword}
              />
              {errors.confirmPassword && <ErrorMsg>{errors.confirmPassword.message}</ErrorMsg>}
            </Field>
          </Row>
        ) : (
          // Login: senha em campo único com link "Esqueci a senha"
          <Field>
            <Label>Senha</Label>
            <PasswordInput
              {...register('password')}
              placeholder="Sua senha"
              $error={!!errors.password}
            />
            {errors.password && <ErrorMsg>{errors.password.message}</ErrorMsg>}
            <ForgotLink type="button" onClick={() => navigate('/esqueci-senha')}>
              Esqueci minha senha
            </ForgotLink>
          </Field>
        )}

        {/* Seleção de modalidades — apenas no cadastro */}
        {isRegister && (
          <Field>
            <Label>Modalidades que você joga</Label>
            <SportSelect
              sports={sports}
              value={modalities}
              onChange={setModalities}
              loading={loadingSports}
            />
          </Field>
        )}

        {isRegister && (
          <MarketingConsent>
            <input type="checkbox" {...register('marketingOptIn')} />
            Quero receber novidades, dicas e comunicações de marketing da Só+1. Posso cancelar a qualquer momento.
          </MarketingConsent>
        )}

        {/* Erros globais da API */}
        {errors.root && <ErrorMsg>{errors.root.message}</ErrorMsg>}

        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Aguarde…'
            : isRegister ? 'Criar conta grátis 🚀' : 'Entrar'}
        </SubmitButton>
      </Form>

      <SwitchText>
        {isRegister
          ? <>Já tem conta? <button onClick={() => switchMode('login')}>Entrar</button></>
          : <>Não tem conta? <button onClick={() => switchMode('register')}>Cadastrar</button></>
        }
      </SwitchText>

      <LegalText>
        Ao entrar, você concorda com os{' '}
        <a href={LEGAL_URLS.termos} target="_blank" rel="noopener noreferrer">Termos de Uso</a> e a{' '}
        <a href={LEGAL_URLS.privacidade} target="_blank" rel="noopener noreferrer">Política de Privacidade</a>.
      </LegalText>
    </AuthLayout>
  )
}
