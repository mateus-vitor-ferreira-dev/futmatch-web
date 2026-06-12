import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    color-scheme: ${({ theme }) => theme.mode};
  }

  body {
    background: ${({ theme }) => theme.colors.bgApp};
    font-family: 'Inter', 'Segoe UI', sans-serif;
    overflow: hidden;
    transition: background-color 0.2s;
  }

  #root {
    width: 100vw;
    height: 100vh;
  }

  input, select, textarea {
    background: ${({ theme }) => theme.colors.bgInput};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px ${({ theme }) => theme.colors.bgInput} inset !important;
    -webkit-text-fill-color: ${({ theme }) => theme.colors.textPrimary} !important;
    transition: background-color 5000s ease-in-out 0s;
  }
`

export default GlobalStyles
