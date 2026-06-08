import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Wrapper, StyledInput, ToggleBtn } from './styles'

/**
 * Campo de senha com botão de mostrar/ocultar.
 * Compatível com react-hook-form via spread de register():
 *   <PasswordInput {...register('password')} $error={!!errors.password} />
 */
const PasswordInput = forwardRef(function PasswordInput({ $error, disabled, ...props }, ref) {
  const [visible, setVisible] = useState(false)

  return (
    <Wrapper>
      <StyledInput
        {...props}
        ref={ref}
        type={visible ? 'text' : 'password'}
        $error={$error}
        disabled={disabled}
      />
      <ToggleBtn
        type="button"
        tabIndex={-1}
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        disabled={disabled}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </ToggleBtn>
    </Wrapper>
  )
})

export default PasswordInput
