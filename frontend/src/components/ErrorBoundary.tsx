import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          maxWidth: '600px',
          margin: '2rem auto',
          background: '#fee',
          border: '1px solid #c00',
          borderRadius: '8px',
        }}>
          <h2 style={{ color: '#c00', marginBottom: '1rem' }}>Error en la aplicación</h2>
          <pre style={{ overflow: 'auto', fontSize: '0.9rem' }}>{this.state.error.message}</pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
