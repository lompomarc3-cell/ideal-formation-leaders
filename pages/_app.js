import '../styles/globals.css'
import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// ===== SPLASH SCREEN =====
function SplashScreen({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(), 2800)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(160deg, #8B2500 0%, #C4521A 55%, #D4A017 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        animation: 'splashFadeOut 0.6s ease 2.2s forwards'
      }}
    >
      {/* Logo animé */}
      <div style={{ animation: 'splashScale 0.7s cubic-bezier(.34,1.56,.64,1) 0.1s both' }}>
        <div style={{
          width: 120, height: 120, borderRadius: 32,
          overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
          animation: 'splashPulse 1.6s ease-in-out 0.8s infinite'
        }}>
          <img
            src="/logo.png"
            alt="IFL"
            style={{ width: 120, height: 120, objectFit: 'cover', display: 'block' }}
          />
        </div>
      </div>

      {/* Nom app */}
      <div style={{ animation: 'splashFadeIn 0.6s ease 0.5s both', marginTop: 28, textAlign: 'center' }}>
        <p style={{
          color: 'white', fontWeight: 900, fontSize: 28,
          letterSpacing: 1, marginBottom: 6,
          fontFamily: 'Poppins, sans-serif'
        }}>IFL</p>
        <p style={{
          color: 'rgba(255,220,160,0.95)', fontWeight: 600, fontSize: 13,
          letterSpacing: 0.5, fontFamily: 'Poppins, sans-serif'
        }}>Idéale Formation of Leaders</p>
      </div>

      {/* Slogan */}
      <div style={{ animation: 'splashFadeIn 0.6s ease 0.9s both', marginTop: 16 }}>
        <p style={{
          color: 'rgba(255,220,160,0.8)', fontWeight: 500, fontSize: 12,
          fontFamily: 'Poppins, sans-serif', textAlign: 'center'
        }}>🎓 Réussissez vos concours du Burkina Faso</p>
      </div>

      {/* Points de chargement */}
      <div style={{
        display: 'flex', gap: 8, marginTop: 48,
        animation: 'splashFadeIn 0.4s ease 1.2s both'
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'rgba(255,220,160,0.8)',
            animation: `splashDot 1.2s ease-in-out ${0.1 + i * 0.2}s infinite`
          }} />
        ))}
      </div>

      <style>{`
        @keyframes splashScale {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes splashFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashFadeOut {
          from { opacity: 1; pointer-events: all; }
          to   { opacity: 0; pointer-events: none; }
        }
        @keyframes splashPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 16px 48px rgba(0,0,0,0.35); }
          50%       { transform: scale(1.05); box-shadow: 0 20px 56px rgba(0,0,0,0.45); }
        }
        @keyframes splashDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [splashDone, setSplashDone] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('ifl_token')
    if (token) {
      fetchUser(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async (token) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.id) {
        setUser(data)
      } else {
        localStorage.removeItem('ifl_token')
        setUser(null)
      }
    } catch {
      localStorage.removeItem('ifl_token')
      setUser(null)
    }
    setLoading(false)
  }

  const login = (token, userData) => {
    localStorage.setItem('ifl_token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('ifl_token')
    setUser(null)
    router.push('/')
  }

  const getToken = () => {
    return localStorage.getItem('ifl_token')
  }

  const refreshUser = async () => {
    const token = localStorage.getItem('ifl_token')
    if (token) await fetchUser(token)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getToken, refreshUser }}>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      {children}
    </AuthContext.Provider>
  )
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}
