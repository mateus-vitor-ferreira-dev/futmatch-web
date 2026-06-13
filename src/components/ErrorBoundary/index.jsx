import { Component } from 'react'
import logoSoMaisUm from '../../assets/logo-so-mais-um.svg'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          fontFamily: 'sans-serif',
          textAlign: 'center',
        }}>
          <img src={logoSoMaisUm} alt="Só+1" style={{ height: 56, marginBottom: 8 }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Algo deu errado</h2>
          <p style={{ color: '#6b7280', margin: 0, maxWidth: 360 }}>
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: 8,
              padding: '10px 24px',
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 15,
            }}
          >
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
