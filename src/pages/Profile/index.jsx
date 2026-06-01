import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { LogOut } from 'lucide-react'
import MainLayout from '../../components/MainLayout'
import { PhoneInput, PasswordInput } from '../../components'
import { useAuth } from '../../contexts/AuthContext'
import * as usersService from '../../services/users'
import {
  PageWrapper, TabsRow, TabBtn,
  SectionTitle, SectionDivider,
  AvatarBlock, AvatarCircle, AvatarInitials, AvatarHint,
  Form, FormGrid, Field, Label, Input, FieldError,
  SaveBtn, SuccessMsg,
  LogoutSection, LogoutBtn,
  StepBox,
} from './styles'

const profileSchema = yup.object({
  name:      yup.string().min(2, 'Mínimo 2 caracteres'),
  phone:     yup.string()
    .test('phone-digits', 'Telefone inválido (ex: 9 9999-9999)', v => {
      if (!v) return true
      return v.replace(/\D/g, '').length >= 10
    })
    .nullable(),
  pixKey:    yup.string().nullable(),
  avatarUrl: yup.string().url('URL inválida').nullable().transform((v) => v || null),
})

const newPasswordSchema = yup.object({
  newPassword:        yup.string().min(6, 'Mínimo 6 caracteres').required('Obrigatório'),
  confirmNewPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Senhas não coincidem')
    .required('Obrigatório'),
})

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')
}

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('personal')

  // ── Fluxo de senha (dois passos) ──────────────────────────────────────────
  const [pwdStep, setPwdStep]           = useState(1)
  const [currentPwd, setCurrentPwd]     = useState('')
  const [currentPwdErr, setCurrentPwdErr] = useState('')
  const [pwdSuccess, setPwdSuccess]     = useState(false)

  function switchTab(tab) {
    setActiveTab(tab)
    if (tab !== 'password') {
      setPwdStep(1)
      setCurrentPwd('')
      setCurrentPwdErr('')
      setPwdSuccess(false)
      resetPwd()
    }
  }

  function handleVerify() {
    if (currentPwd.length < 6) {
      setCurrentPwdErr('Mínimo 6 caracteres')
      return
    }
    setCurrentPwdErr('')
    setPwdStep(2)
  }

  // ── Formulário de dados pessoais ──────────────────────────────────────────
  const {
    register: regProfile,
    handleSubmit: handleProfile,
    reset: resetProfile,
    control: profileControl,
    formState: { errors: errP, isSubmitting: savingProfile, isSubmitSuccessful: profileSaved },
  } = useForm({ resolver: yupResolver(profileSchema) })

  useEffect(() => {
    if (user) {
      resetProfile({
        name:      user.name      ?? '',
        phone:     user.phone     ?? '',
        pixKey:    user.pixKey    ?? '',
        avatarUrl: user.avatarUrl ?? '',
      })
    }
  }, [user, resetProfile])

  const onSaveProfile = async (data) => {
    await usersService.updateMe(data)
  }

  // ── Formulário de nova senha (passo 2) ────────────────────────────────────
  const {
    register: regPwd,
    handleSubmit: handlePwd,
    reset: resetPwd,
    formState: { errors: errPwd, isSubmitting: savingPwd },
  } = useForm({ resolver: yupResolver(newPasswordSchema) })

  const onSavePassword = async (data) => {
    try {
      await usersService.updateMe({
        currentPassword:    currentPwd,
        newPassword:        data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      })
      resetPwd()
      setCurrentPwd('')
      setPwdStep(1)
      setPwdSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erro ao alterar senha.'
      setPwdStep(1)
      setCurrentPwdErr(msg)
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <MainLayout user={user}>
      <PageWrapper>

        {/* Avatar */}
        <AvatarBlock>
          <AvatarCircle>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={user?.name} />
              : <AvatarInitials>{getInitials(user?.name)}</AvatarInitials>
            }
          </AvatarCircle>
          <div>
            <strong>{user?.name}</strong>
            <AvatarHint>{user?.email}</AvatarHint>
            <AvatarHint>Role: {user?.role}</AvatarHint>
          </div>
        </AvatarBlock>

        <SectionDivider />

        {/* Tabs */}
        <TabsRow>
          <TabBtn $active={activeTab === 'personal'} onClick={() => switchTab('personal')}>
            Dados Pessoais
          </TabBtn>
          <TabBtn $active={activeTab === 'password'} onClick={() => switchTab('password')}>
            Alterar Senha
          </TabBtn>
        </TabsRow>

        {/* Tab: Dados Pessoais */}
        {activeTab === 'personal' && (
          <Form onSubmit={handleProfile(onSaveProfile)}>
            <FormGrid>
              <Field>
                <Label>Nome completo</Label>
                <Input {...regProfile('name')} placeholder="Seu nome" />
                {errP.name && <FieldError>{errP.name.message}</FieldError>}
              </Field>
              <Field>
                <Label>Telefone</Label>
                <Controller
                  name="phone"
                  control={profileControl}
                  render={({ field }) => (
                    <PhoneInput {...field} error={!!errP.phone} />
                  )}
                />
                {errP.phone && <FieldError>{errP.phone.message}</FieldError>}
              </Field>
              <Field>
                <Label>Chave Pix</Label>
                <Input {...regProfile('pixKey')} placeholder="CPF, e-mail, telefone ou chave aleatória" />
                {errP.pixKey && <FieldError>{errP.pixKey.message}</FieldError>}
              </Field>
              <Field style={{ gridColumn: '1 / -1' }}>
                <Label>URL do Avatar</Label>
                <Input {...regProfile('avatarUrl')} placeholder="https://..." />
                {errP.avatarUrl && <FieldError>{errP.avatarUrl.message}</FieldError>}
              </Field>
            </FormGrid>

            {profileSaved && <SuccessMsg>Perfil atualizado com sucesso!</SuccessMsg>}

            <SaveBtn type="submit" disabled={savingProfile}>
              {savingProfile ? 'Salvando...' : 'Salvar alterações'}
            </SaveBtn>
          </Form>
        )}

        {/* Tab: Alterar Senha */}
        {activeTab === 'password' && (
          <Form onSubmit={handlePwd(onSavePassword)}>

            {/* Passo 1 — confirmar senha atual */}
            <Field>
              <Label>Confirme sua senha atual</Label>
              <PasswordInput
                value={currentPwd}
                onChange={e => { setCurrentPwd(e.target.value); setCurrentPwdErr('') }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleVerify() } }}
                placeholder="••••••"
                $error={!!currentPwdErr}
                name="currentPassword"
                disabled={pwdStep === 2}
              />
              {currentPwdErr && <FieldError>{currentPwdErr}</FieldError>}
              {pwdSuccess && <SuccessMsg>Senha alterada com sucesso!</SuccessMsg>}
            </Field>

            {pwdStep === 1 && (
              <SaveBtn type="button" onClick={handleVerify}>
                Continuar
              </SaveBtn>
            )}

            {/* Passo 2 — nova senha (aparece após confirmar a senha atual) */}
            {pwdStep === 2 && (
              <StepBox>
                <FormGrid>
                  <Field>
                    <Label>Nova senha</Label>
                    <PasswordInput
                      {...regPwd('newPassword')}
                      placeholder="Mín. 6 caracteres"
                      $error={!!errPwd.newPassword}
                    />
                    {errPwd.newPassword && <FieldError>{errPwd.newPassword.message}</FieldError>}
                  </Field>
                  <Field>
                    <Label>Confirmar nova senha</Label>
                    <PasswordInput
                      {...regPwd('confirmNewPassword')}
                      placeholder="Repita a nova senha"
                      $error={!!errPwd.confirmNewPassword}
                    />
                    {errPwd.confirmNewPassword && <FieldError>{errPwd.confirmNewPassword.message}</FieldError>}
                  </Field>
                </FormGrid>
                <SaveBtn type="submit" disabled={savingPwd}>
                  {savingPwd ? 'Salvando...' : 'Alterar senha'}
                </SaveBtn>
              </StepBox>
            )}

          </Form>
        )}

        <SectionDivider />

        {/* Sessão / Logout */}
        <LogoutSection>
          <SectionTitle>Sessão</SectionTitle>
          <LogoutBtn onClick={handleLogout}>
            <LogOut size={16} />
            Sair da conta
          </LogoutBtn>
        </LogoutSection>

      </PageWrapper>
    </MainLayout>
  )
}
