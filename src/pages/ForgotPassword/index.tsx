import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import AuthLayout from '../../components/AuthLayout'
import * as authService from '../../services/auth'
import {
  FormTitle, FormSubtitle,
  Form, Field, Label, Input, ErrorMsg,
  SubmitButton, SwitchText,
} from '../Register/styles'
import { SuccessBox } from './styles'

const schema = yup.object({
  email: yup.string().email('E-mail inválido').required('Obrigatório'),
})

type FormularioValores = yup.InferType<typeof schema>

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormularioValores>({ resolver: yupResolver(schema) })

  async function onSubmit({ email }: FormularioValores) {
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch {
      setError('root', { message: 'Erro ao enviar o e-mail. Tente novamente.' })
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <FormTitle>Verifique seu e-mail 📬</FormTitle>
        <FormSubtitle>
          Se o endereço estiver cadastrado, você receberá um link de redefinição em alguns minutos.
          Verifique também a caixa de spam.
        </FormSubtitle>
        <SuccessBox>
          O link expira em <strong>1 hora</strong>.
        </SuccessBox>
        <SwitchText>
          <button onClick={() => navigate('/login')}>Voltar para o login</button>
        </SwitchText>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <FormTitle>Esqueceu a senha? 🔑</FormTitle>
      <FormSubtitle>
        Digite seu e-mail e enviaremos um link para redefinir sua senha.
      </FormSubtitle>

      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field>
          <Label>E-mail</Label>
          <Input
            {...register('email')}
            type="email"
            placeholder="seu@email.com"
            $error={!!errors.email}
          />
          {errors.email && <ErrorMsg>{errors.email.message}</ErrorMsg>}
        </Field>

        {errors.root && <ErrorMsg>{errors.root.message}</ErrorMsg>}

        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar link de redefinição'}
        </SubmitButton>
      </Form>

      <SwitchText>
        Lembrou a senha? <button onClick={() => navigate('/login')}>Entrar</button>
      </SwitchText>
    </AuthLayout>
  )
}
