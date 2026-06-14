import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../contexts/AuthContext'
import * as authService from '../../services/auth'
import {
  Page, HeroCol, HeroLogo, HeroTitle, HeroSub, BenefitsList, BenefitItem,
  FormCol, Card, CardHead, CardTitle, CardSub,
  Tabs, Tab, Form, Field, Row, Label, Input, ErrorMsg, SubmitBtn, ForgotLink,
  LockBadge,
} from './styles'

const BENEFITS = [
  'Painel de gestão completo',
  'Quadras e horários ilimitados',
  'Solicitações de jogadores em tempo real',
  'Relatórios e histórico de eventos',
  'Suporte prioritário',
]

const loginSchema = yup.object({
  email:    yup.string().email('E-mail inválido').required('Obrigatório'),
  password: yup.string().required('Obrigatório'),
})

const registerSchema = yup.object({
  name:            yup.string().min(2, 'Mínimo 2 caracteres').required('Obrigatório'),
  password:        yup.string().min(6, 'Mínimo 6 caracteres').required('Obrigatório'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Senhas não coincidem')
    .required('Obrigatório'),
})

export default function OwnerAccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, registerOwner, logout } = useAuth()

  const inviteToken = searchParams.get('convite')

  const [status, setStatus]         = useState('loading') // 'loading' | 'invalid' | 'ready'
  const [inviteEmail, setInviteEmail] = useState('')
  const [tab, setTab]               = useState('register')

  const loginForm = useForm({ resolver: yupResolver(loginSchema) })
  const regForm   = useForm({ resolver: yupResolver(registerSchema) })

  useEffect(() => {
    if (!inviteToken) {
      setStatus('invalid')
      return
    }
    authService.verifyInvite(inviteToken)
      .then((res) => {
        setInviteEmail(res.data.email)
        setStatus('ready')
      })
      .catch(() => setStatus('invalid'))
  }, [inviteToken])

  async function onLogin(data) {
    loginForm.clearErrors()
    try {
      const res = await login(data)
      const role = res.data.user.role
      if (role !== 'OWNER' && role !== 'ADMIN') {
        await logout()
        loginForm.setError('root', { message: 'Esta conta não tem acesso ao portal de parceiros.' })
        return
      }
      navigate('/owner')
    } catch (err) {
      const msg = err.response?.data?.message || 'Credenciais inválidas.'
      loginForm.setError('root', { message: msg })
    }
  }

  async function onRegister(data) {
    regForm.clearErrors()
    try {
      await registerOwner({ ...data, inviteToken })
      navigate('/owner')
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao criar conta. Tente novamente.'
      regForm.setError('root', { message: msg })
    }
  }

  return (
    <Page>
      <HeroCol>
        <HeroLogo>
          Só+1
          <span>Portal de Parceiros</span>
        </HeroLogo>
        <HeroTitle>Gerencie sua arena na palma da mão</HeroTitle>
        <HeroSub>
          Cadastre seu estabelecimento, gerencie quadras e receba solicitações de jogadores — tudo em um único painel.
        </HeroSub>
        <BenefitsList>
          {BENEFITS.map((b) => <BenefitItem key={b}>{b}</BenefitItem>)}
        </BenefitsList>
      </HeroCol>

      <FormCol>
        <Card>
          {status === 'loading' && (
            <CardHead>
              <CardTitle>Verificando convite…</CardTitle>
              <CardSub>Aguarde um momento.</CardSub>
            </CardHead>
          )}

          {status === 'invalid' && (
            <CardHead>
              <CardTitle>Convite inválido</CardTitle>
              <CardSub>
                Este link de convite é inválido ou já expirou. Entre em contato com a equipe Só+1 para receber um novo convite.
              </CardSub>
            </CardHead>
          )}

          {status === 'ready' && (
            <>
              <CardHead>
                <CardTitle>Portal de Parceiros</CardTitle>
                <CardSub>Convite verificado para <strong>{inviteEmail}</strong>.</CardSub>
              </CardHead>

              <LockBadge>
                Convite válido — bem-vindo ao portal de parceiros
              </LockBadge>

              <Tabs>
                <Tab $active={tab === 'register'} onClick={() => { setTab('register'); regForm.reset(); }}>
                  Criar conta
                </Tab>
                <Tab $active={tab === 'login'}    onClick={() => { setTab('login');    loginForm.reset(); }}>
                  Já tenho conta
                </Tab>
              </Tabs>

              {tab === 'register' ? (
                <Form onSubmit={regForm.handleSubmit(onRegister)} noValidate>
                  <Field>
                    <Label>E-mail (do convite)</Label>
                    <Input value={inviteEmail} disabled />
                  </Field>

                  <Field>
                    <Label>Nome completo</Label>
                    <Input
                      {...regForm.register('name')}
                      placeholder="Ex: João da Silva"
                      $error={!!regForm.formState.errors.name}
                    />
                    {regForm.formState.errors.name && (
                      <ErrorMsg>{regForm.formState.errors.name.message}</ErrorMsg>
                    )}
                  </Field>

                  <Row>
                    <Field>
                      <Label>Senha</Label>
                      <Input
                        {...regForm.register('password')}
                        type="password"
                        placeholder="Mín. 6 caracteres"
                        $error={!!regForm.formState.errors.password}
                      />
                      {regForm.formState.errors.password && (
                        <ErrorMsg>{regForm.formState.errors.password.message}</ErrorMsg>
                      )}
                    </Field>
                    <Field>
                      <Label>Confirmar</Label>
                      <Input
                        {...regForm.register('confirmPassword')}
                        type="password"
                        placeholder="Repita a senha"
                        $error={!!regForm.formState.errors.confirmPassword}
                      />
                      {regForm.formState.errors.confirmPassword && (
                        <ErrorMsg>{regForm.formState.errors.confirmPassword.message}</ErrorMsg>
                      )}
                    </Field>
                  </Row>

                  {regForm.formState.errors.root && (
                    <ErrorMsg>{regForm.formState.errors.root.message}</ErrorMsg>
                  )}

                  <SubmitBtn type="submit" disabled={regForm.formState.isSubmitting}>
                    {regForm.formState.isSubmitting ? 'Criando conta…' : 'Criar conta de parceiro →'}
                  </SubmitBtn>
                </Form>
              ) : (
                <Form onSubmit={loginForm.handleSubmit(onLogin)} noValidate>
                  <Field>
                    <Label>E-mail</Label>
                    <Input
                      {...loginForm.register('email')}
                      type="email"
                      placeholder="seu@email.com"
                      $error={!!loginForm.formState.errors.email}
                    />
                    {loginForm.formState.errors.email && (
                      <ErrorMsg>{loginForm.formState.errors.email.message}</ErrorMsg>
                    )}
                  </Field>

                  <Field>
                    <Label>Senha</Label>
                    <Input
                      {...loginForm.register('password')}
                      type="password"
                      placeholder="Sua senha"
                      $error={!!loginForm.formState.errors.password}
                    />
                    {loginForm.formState.errors.password && (
                      <ErrorMsg>{loginForm.formState.errors.password.message}</ErrorMsg>
                    )}
                    <ForgotLink type="button" onClick={() => navigate('/esqueci-senha')}>
                      Esqueci minha senha
                    </ForgotLink>
                  </Field>

                  {loginForm.formState.errors.root && (
                    <ErrorMsg>{loginForm.formState.errors.root.message}</ErrorMsg>
                  )}

                  <SubmitBtn type="submit" disabled={loginForm.formState.isSubmitting}>
                    {loginForm.formState.isSubmitting ? 'Entrando…' : 'Entrar no painel →'}
                  </SubmitBtn>
                </Form>
              )}
            </>
          )}
        </Card>
      </FormCol>
    </Page>
  )
}
