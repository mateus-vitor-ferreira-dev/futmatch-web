import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background: #0a0a0a;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    overflow: hidden;
  }

  #root {
    width: 100vw;
    height: 100vh;
  }
`

export default GlobalStyles
