import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

interface LogoContextType {
  logoUrl: string | null
  logoVersion: number
  refreshLogo: () => void
}

const LogoContext = createContext<LogoContextType | null>(null)

export function LogoProvider({ children }: { children: React.ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoVersion, setLogoVersion] = useState(0)

  const refreshLogo = useCallback(() => {
    fetch(`${API_BASE}/settings/logo`)
      .then((r) => r.json())
      .then((d: { url: string | null }) => {
        setLogoUrl(d.url)
        setLogoVersion((v) => v + 1)
      })
      .catch(() => {
        setLogoUrl(null)
        setLogoVersion((v) => v + 1)
      })
  }, [])

  useEffect(() => {
    refreshLogo()
  }, [refreshLogo])

  return (
    <LogoContext.Provider value={{ logoUrl, logoVersion, refreshLogo }}>
      {children}
    </LogoContext.Provider>
  )
}

export function useLogo() {
  const ctx = useContext(LogoContext)
  if (!ctx) throw new Error('useLogo must be used within LogoProvider')
  return ctx
}

/** URL del logo con cache-busting para forzar recarga cuando cambia */
export function useLogoImageSrc() {
  const { logoUrl, logoVersion } = useLogo()
  const fallback = import.meta.env.VITE_LOGO_URL as string | undefined

  const base = logoUrl || fallback
  if (!base) return ''

  if (base.startsWith('http')) return base
  const full =
    API_BASE.startsWith('http')
      ? new URL(base.startsWith('/') ? base : '/' + base, new URL(API_BASE).origin).href
      : (base.startsWith('/') ? base : '/' + base)

  return full + (logoVersion > 0 ? `?t=${logoVersion}` : '')
}
