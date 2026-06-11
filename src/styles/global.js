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
    background: ${({ theme }) => theme.colors.bgCard};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

export default GlobalStyles
