import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import AuthLayout from '../../components/AuthLayout'
import { PasswordInput } from '../../components'
import * as authService from '../../services/auth'
import { mensagemDeErro } from '../../utils/apiError'
import {
  FormTitle, FormSubtitle,
  Form, Field, Label, ErrorMsg,
  SubmitButton, SwitchText,
} from '../Register/styles'

const schema = yup.object({
  newPassword:     yup.string().min(6, 'Mínimo 6 caracteres').required('Obrigatório'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Senhas não coincidem')
    .required('Obrigatório'),
})

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm({ resolver: yupResolver(schema) })

  async function onSubmit({ newPassword, confirmPassword }) {
    try {
      await authService.resetPassword(token, newPassword, confirmPassword)
    } catch (err) {
      const msg = mensagemDeErro(err, 'Link inválido ou expirado. Solicite um novo.')
      setError('root', { message: msg })
    }
  }

  if (!token) {
    return (
      <AuthLayout>
        <FormTitle>Link inválido ⚠️</FormTitle>
        <FormSubtitle>Este link de redefinição é inválido ou já expirou.</FormSubtitle>
        <SwitchText>
          <button onClick={() => navigate('/esqueci-senha')}>Solicitar novo link</button>
        </SwitchText>
      </AuthLayout>
    )
  }

  if (isSubmitSuccessful) {
    return (
      <AuthLayout>
        <FormTitle>Senha redefinida! ✅</FormTitle>
        <FormSubtitle>Sua senha foi atualizada com sucesso. Agora você pode entrar.</FormSubtitle>
        <SubmitButton type="button" onClick={() => navigate('/login')}>
          Ir para o login
        </SubmitButton>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <FormTitle>Nova senha 🔐</FormTitle>
      <FormSubtitle>Escolha uma senha segura para sua conta.</FormSubtitle>

      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field>
          <Label>Nova senha</Label>
          <PasswordInput
            {...register('newPassword')}
            placeholder="Mín. 6 caracteres"
            $error={!!errors.newPassword}
          />
          {errors.newPassword && <ErrorMsg>{errors.newPassword.message}</ErrorMsg>}
        </Field>
        <Field>
          <Label>Confirmar nova senha</Label>
          <PasswordInput
            {...register('confirmPassword')}
            placeholder="Repita a nova senha"
            $error={!!errors.confirmPassword}
          />
          {errors.confirmPassword && <ErrorMsg>{errors.confirmPassword.message}</ErrorMsg>}
        </Field>

        {errors.root && <ErrorMsg>{errors.root.message}</ErrorMsg>}

        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Redefinir senha'}
        </SubmitButton>
      </Form>
    </AuthLayout>
  )
}
