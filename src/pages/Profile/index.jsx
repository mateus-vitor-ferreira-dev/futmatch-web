import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { LogOut } from 'lucide-react'
import MainLayout from '../../components/MainLayout'
import { useAuth } from '../../contexts/AuthContext'
import * as usersService from '../../services/users'
import {
  PageWrapper, Section, SectionTitle, SectionDivider,
  AvatarBlock, AvatarCircle, AvatarInitials, AvatarHint,
  Form, FormGrid, Field, Label, Input, FieldError,
  SaveBtn, SuccessMsg, ErrorMsg,
  LogoutSection, LogoutBtn,
} from './styles'

const profileSchema = yup.object({
  name:     yup.string().min(2, 'Mínimo 2 caracteres'),
  pixKey:   yup.string().nullable(),
  avatarUrl: yup.string().url('URL inválida').nullable().transform((v) => v || null),
})

const passwordSchema = yup.object({
  currentPassword:    yup.string().required('Senha atual obrigatória'),
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

  // ── Formulário de dados pessoais ──────────────────────────────────────────
  const {
    register: regProfile,
    handleSubmit: handleProfile,
    reset: resetProfile,
    formState: { errors: errP, isSubmitting: savingProfile, isSubmitSuccessful: profileSaved },
  } = useForm({ resolver: yupResolver(profileSchema) })

  useEffect(() => {
    if (user) {
      resetProfile({
        name:      user.name     ?? '',
        pixKey:    user.pixKey   ?? '',
        avatarUrl: user.avatarUrl ?? '',
      })
    }
  }, [user, resetProfile])

  const onSaveProfile = async (data) => {
    await usersService.updateMe(data)
  }

  // ── Formulário de senha ───────────────────────────────────────────────────
  const {
    register: regPwd,
    handleSubmit: handlePwd,
    reset: resetPwd,
    setError: setPwdError,
    formState: { errors: errPwd, isSubmitting: savingPwd, isSubmitSuccessful: pwdSaved },
  } = useForm({ resolver: yupResolver(passwordSchema) })

  const onSavePassword = async (data) => {
    try {
      await usersService.updateMe(data)
      resetPwd()
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erro ao alterar senha.'
      setPwdError('currentPassword', { message: msg })
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

        {/* Dados pessoais */}
        <Section>
          <SectionTitle>Dados Pessoais</SectionTitle>
          <Form onSubmit={handleProfile(onSaveProfile)}>
            <FormGrid>
              <Field>
                <Label>Nome completo</Label>
                <Input {...regProfile('name')} placeholder="Seu nome" />
                {errP.name && <FieldError>{errP.name.message}</FieldError>}
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
        </Section>

        <SectionDivider />

        {/* Alterar senha */}
        <Section>
          <SectionTitle>Alterar Senha</SectionTitle>
          <Form onSubmit={handlePwd(onSavePassword)}>
            <FormGrid>
              <Field style={{ gridColumn: '1 / -1' }}>
                <Label>Senha atual</Label>
                <Input {...regPwd('currentPassword')} type="password" placeholder="••••••" />
                {errPwd.currentPassword && <FieldError>{errPwd.currentPassword.message}</FieldError>}
              </Field>
              <Field>
                <Label>Nova senha</Label>
                <Input {...regPwd('newPassword')} type="password" placeholder="Mín. 6 caracteres" />
                {errPwd.newPassword && <FieldError>{errPwd.newPassword.message}</FieldError>}
              </Field>
              <Field>
                <Label>Confirmar nova senha</Label>
                <Input {...regPwd('confirmNewPassword')} type="password" placeholder="Repita a nova senha" />
                {errPwd.confirmNewPassword && <FieldError>{errPwd.confirmNewPassword.message}</FieldError>}
              </Field>
            </FormGrid>

            {pwdSaved && <SuccessMsg>Senha alterada com sucesso!</SuccessMsg>}

            <SaveBtn type="submit" disabled={savingPwd}>
              {savingPwd ? 'Salvando...' : 'Alterar senha'}
            </SaveBtn>
          </Form>
        </Section>

        <SectionDivider />

        {/* Logout */}
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
