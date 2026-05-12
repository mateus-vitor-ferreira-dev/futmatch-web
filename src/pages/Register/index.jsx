import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../contexts/AuthContext'
import { useSports } from '../../hooks/useSports'
import { env } from '../../config/env'
import AuthLayout from '../../components/AuthLayout'
import { SportSelect } from '../../components'
import {
  Tabs, Tab, FormTitle, FormSubtitle,
  GoogleButton, Divider,
  Form, Field, Row, Label, Input, ErrorMsg,
  SubmitButton, SwitchText, LegalText,
} from './styles'

const registerSchema = yup.object({
  name:            yup.string().min(2, 'Mínimo 2 caracteres').required('Obrigatório'),
  email:           yup.string().email('E-mail inválido').required('Obrigatório'),
  password:        yup.string().min(6, 'Mínimo 6 caracteres').required('Obrigatório'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Senhas não coincidem')
    .required('Obrigatório'),
})

const loginSchema = yup.object({
  email:    yup.string().email('E-mail inválido').required('Obrigatório'),
  password: yup.string().required('Obrigatório'),
})

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser, login, googleLogin } = useAuth()

  const [mode, setMode]           = useState('register')   // 'register' | 'login'
  const [modalities, setModalities] = useState([])

  const { sports, loading: loadingSports } = useSports()

  const isRegister = mode === 'register'

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(isRegister ? registerSchema : loginSchema) })

  function switchMode(next) {
    setMode(next)
    reset()
  }

  async function onSubmit(data) {
    try {
      if (isRegister) {
        await registerUser({ ...data, sports: modalities })
      } else {
        await login(data)
      }
      navigate('/home')
    } catch (err) {
      const msg = err.response?.data?.message || 'Algo deu errado. Tente novamente.'
      setError('root', { message: msg })
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      try {
        await googleLogin(access_token)
        navigate('/home')
      } catch {
        setError('root', { message: 'Erro ao entrar com Google.' })
      }
    },
    onError: () => setError('root', { message: 'Login com Google cancelado.' }),
  })

  const googleEnabled = !!env.googleClientId

  return (
    <AuthLayout>
      {/* ── Tabs ── */}
      <Tabs>
        <Tab $active={!isRegister} onClick={() => switchMode('login')}>Entrar</Tab>
        <Tab $active={isRegister}  onClick={() => switchMode('register')}>Cadastrar</Tab>
      </Tabs>

      {/* ── Header ── */}
      <FormTitle>{isRegister ? 'Crie sua conta 🧡' : 'Entre na sua conta 👋'}</FormTitle>
      <FormSubtitle>
        {isRegister ? 'É rápido, grátis e sem enrolação.' : 'Bem-vindo de volta!'}
      </FormSubtitle>

      {/* ── Google ── */}
      <GoogleButton
        type="button"
        onClick={googleEnabled ? handleGoogleLogin : undefined}
        disabled={!googleEnabled || isSubmitting}
        title={!googleEnabled ? 'Configure VITE_GOOGLE_CLIENT_ID' : undefined}
      >
        <GoogleIcon />
        {isRegister ? 'Cadastrar com Google' : 'Entrar com Google'}
      </GoogleButton>

      <Divider>ou use seu e-mail</Divider>

      {/* ── Form ── */}
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

        {isRegister ? (
          <Row>
            <Field>
              <Label>Senha</Label>
              <Input
                {...register('password')}
                type="password"
                placeholder="Mín. 6 caracteres"
                $error={!!errors.password}
              />
              {errors.password && <ErrorMsg>{errors.password.message}</ErrorMsg>}
            </Field>
            <Field>
              <Label>Confirmar</Label>
              <Input
                {...register('confirmPassword')}
                type="password"
                placeholder="Repita a senha"
                $error={!!errors.confirmPassword}
              />
              {errors.confirmPassword && <ErrorMsg>{errors.confirmPassword.message}</ErrorMsg>}
            </Field>
          </Row>
        ) : (
          <Field>
            <Label>Senha</Label>
            <Input
              {...register('password')}
              type="password"
              placeholder="Sua senha"
              $error={!!errors.password}
            />
            {errors.password && <ErrorMsg>{errors.password.message}</ErrorMsg>}
          </Field>
        )}

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
        <a href="#">Termos de Uso</a> e a{' '}
        <a href="#">Política de Privacidade</a>.
      </LegalText>
    </AuthLayout>
  )
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.233 17.64 11.925 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
