import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../contexts/AuthContext'
import { useSports } from '../../hooks/useSports'
import { env } from '../../config/env'
import AuthLayout from '../../components/AuthLayout'
import { SportSelect, PhoneInput, PasswordInput } from '../../components'
import type { CourtType, UserRole } from '../../types/api'
import { mensagemDeErro } from '../../utils/apiError'
import {
  Tabs, Tab, FormTitle, FormSubtitle,
  GoogleWrapper, GoogleButton, Divider,
  Form, Field, Row, Label, Input, ErrorMsg,
  SubmitButton, SwitchText, ForgotLink, LegalText,
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

  /** Troca de modo (login ↔ register) limpando o formulário */
  function switchMode(next: 'login' | 'register') {
    reset()
    navigate(next === 'login' ? '/login' : '/register')
  }

  function redirectByRole(role: UserRole) {
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

  const googleEnabled = !!env.googleClientId

  // useGoogleLogin devolve uma função que aceita config opcional, não um
  // MouseEventHandler — por isso o onClick usa um wrapper que descarta o evento.
  const handleGoogleClick = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async ({ access_token }) => {
      try {
        const res = await googleLogin(access_token)
        redirectByRole(res.data.user.role)
      } catch {
        setError('root', { message: 'Erro ao entrar com Google.' })
      }
    },
    onError: () => setError('root', { message: 'Login com Google cancelado.' }),
  })

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

      {/* Botão do Google OAuth */}
      <GoogleWrapper>
        <GoogleButton
          type="button"
          onClick={() => handleGoogleClick()}
          disabled={!googleEnabled || isSubmitting}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {isRegister ? 'Cadastrar com o Google' : 'Fazer Login com o Google'}
        </GoogleButton>
      </GoogleWrapper>

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
