import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { APP_NAME } from './config'

function SetDocumentTitle() {
  useEffect(() => {
    document.title = APP_NAME
  }, [])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SetDocumentTitle />
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
