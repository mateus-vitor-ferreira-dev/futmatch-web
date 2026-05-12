import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../contexts/AuthContext'
import { useSports } from '../../hooks/useSports'
import { env } from '../../config/env'
import AuthLayout from '../../components/AuthLayout'
import { SportSelect } from '../../components'
import {
  Tabs, Tab, FormTitle, FormSubtitle,
  GoogleWrapper, Divider,
  Form, Field, Row, Label, Input, ErrorMsg,
  SubmitButton, SwitchText, ForgotLink, LegalText,
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

export default function Register({ initialMode = 'register' }) {
  const navigate = useNavigate()
  const { register: registerUser, login, googleLogin } = useAuth()

  const mode                        = initialMode
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
    reset()
    navigate(next === 'login' ? '/login' : '/register')
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

  const googleEnabled = !!env.googleClientId

  async function handleGoogleSuccess({ credential }) {
    try {
      await googleLogin(credential)
      navigate('/home')
    } catch {
      setError('root', { message: 'Erro ao entrar com Google.' })
    }
  }

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
      <GoogleWrapper>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('root', { message: 'Login com Google cancelado.' })}
          text={isRegister ? 'signup_with' : 'signin_with'}
          width="340"
          theme="outline"
          size="large"
          disabled={!googleEnabled || isSubmitting}
        />
      </GoogleWrapper>

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
            <ForgotLink type="button" onClick={() => navigate('/esqueci-senha')}>
              Esqueci minha senha
            </ForgotLink>
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

