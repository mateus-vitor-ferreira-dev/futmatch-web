import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'sonner'
import { Camera, Loader, LogOut } from 'lucide-react'
import MainLayout from '../../components/MainLayout'
import { PhoneInput, PasswordInput } from '../../components'
import { useAuth } from '../../contexts/AuthContext'
import * as usersService from '../../services/users'
import { uploadImage } from '../../services/cloudinary'
import { env } from '../../config/env'
import {
  PageWrapper, TabsRow, TabBtn,
  SectionTitle, SectionDivider,
  AvatarBlock, AvatarUploadWrapper, AvatarOverlay, AvatarCircle, AvatarInitials, AvatarHint,
  Form, FormGrid, Field, Label, Input, FieldError,
  SaveBtn,
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
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()

  // ── Upload de avatar ───────────────────────────────────────────────────────
  const fileInputRef = useRef(null)
  const [uploading, setUploading]     = useState(false)
  const [uploadError, setUploadError] = useState('')
  const cloudinaryReady = Boolean(env.cloudinaryCloud && env.cloudinaryPreset)

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('personal')

  // ── Fluxo de senha (dois passos) ──────────────────────────────────────────
  const [pwdStep, setPwdStep]           = useState(1)
  const [currentPwd, setCurrentPwd]     = useState('')
  const [currentPwdErr, setCurrentPwdErr] = useState('')

  function switchTab(tab) {
    setActiveTab(tab)
    if (tab !== 'password') {
      setPwdStep(1)
      setCurrentPwd('')
      setCurrentPwdErr('')
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
    setValue: setProfileValue,

    control: profileControl,
    formState: { errors: errP, isSubmitting: savingProfile },
  } = useForm({ resolver: yupResolver(profileSchema) })

  const avatarUrlValue = useWatch({ control: profileControl, name: 'avatarUrl' })

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

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const url = await uploadImage(file)
      setProfileValue('avatarUrl', url, { shouldValidate: true })
    } catch {
      setUploadError('Erro ao fazer upload. Tente novamente.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const onSaveProfile = async (data) => {
    await usersService.updateMe(data)
    await refreshUser()
    toast.success('Perfil atualizado com sucesso!')
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
      toast.success('Senha alterada com sucesso!')
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
          <AvatarUploadWrapper onClick={() => cloudinaryReady && fileInputRef.current?.click()}>
            <AvatarCircle>
              {(avatarUrlValue || user?.avatarUrl)
                ? <img src={avatarUrlValue || user?.avatarUrl} alt={user?.name} />
                : <AvatarInitials>{getInitials(user?.name)}</AvatarInitials>
              }
            </AvatarCircle>
            {cloudinaryReady && (
              <AvatarOverlay $visible={uploading}>
                {uploading
                  ? <Loader size={20} className="spinning" />
                  : <Camera size={20} />
                }
              </AvatarOverlay>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarFileChange}
            />
          </AvatarUploadWrapper>
          <div>
            <strong>{user?.name}</strong>
            <AvatarHint>{user?.email}</AvatarHint>
            {cloudinaryReady
              ? <AvatarHint>Clique na foto para alterar</AvatarHint>
              : <AvatarHint>Role: {user?.role}</AvatarHint>
            }
            {uploadError && (
              <AvatarHint style={{ color: '#ef4444' }}>{uploadError}</AvatarHint>
            )}
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
              <input type="hidden" {...regProfile('avatarUrl')} />
            </FormGrid>

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
