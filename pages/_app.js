import '../styles/globals.css'
import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// ===== SPLASH SCREEN AMÉLIORÉ =====
function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0) // 0=logo, 1=texte, 2=fadeout

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 2400)
    const t3 = setTimeout(() => onDone(), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(160deg, #6B1A00 0%, #8B2500 25%, #C4521A 65%, #D4A017 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 0.6s ease',
      opacity: phase === 2 ? 0 : 1,
      pointerEvents: phase === 2 ? 'none' : 'all'
    }}>
      {/* Cercles décoratifs en arrière-plan */}
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)', top: -60, right: -80
      }} />
      <div style={{
        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)', bottom: 40, left: -60
      }} />

      {/* Logo principal */}
      <div style={{
        transform: phase >= 0 ? 'scale(1)' : 'scale(0.3)',
        opacity: phase >= 0 ? 1 : 0,
        transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
        marginBottom: 28,
        position: 'relative'
      }}>
        {/* Halo lumineux */}
        <div style={{
          position: 'absolute', inset: -12, borderRadius: 44,
          background: 'rgba(212, 160, 23, 0.25)',
          animation: 'splashHalo 2s ease-in-out 0.8s infinite'
        }} />
        <div style={{
          width: 120, height: 120, borderRadius: 32,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 3px rgba(212,160,23,0.5)',
          position: 'relative', zIndex: 1,
          animation: 'splashFloat 3s ease-in-out 1s infinite'
        }}>
          <img src="/logo.png" alt="IFL" style={{ width: 120, height: 120, objectFit: 'cover', display: 'block' }} />
        </div>
      </div>

      {/* Nom et slogan */}
      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease 0.1s',
        textAlign: 'center'
      }}>
        <p style={{
          color: 'white', fontWeight: 900, fontSize: 32,
          letterSpacing: 2, marginBottom: 6,
          fontFamily: 'Poppins, sans-serif',
          textShadow: '0 2px 12px rgba(0,0,0,0.3)'
        }}>IFL</p>
        <p style={{
          color: 'rgba(255,224,160,0.95)', fontWeight: 600, fontSize: 13.5,
          letterSpacing: 0.8, fontFamily: 'Poppins, sans-serif'
        }}>Idéale Formation of Leaders</p>
      </div>

      {/* Slogan */}
      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s ease 0.3s',
        marginTop: 14, textAlign: 'center', padding: '0 40px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '8px 20px',
          backdropFilter: 'blur(4px)'
        }}>
          <p style={{
            color: 'rgba(255,224,160,0.9)', fontWeight: 500, fontSize: 12,
            fontFamily: 'Poppins, sans-serif'
          }}>🎓 Réussissez vos concours du Burkina Faso</p>
        </div>
      </div>

      {/* Points de chargement */}
      <div style={{
        display: 'flex', gap: 10, marginTop: 52,
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 0.4s ease 0.5s'
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'rgba(255,224,160,0.85)',
            animation: `splashDot 1.4s ease-in-out ${0.1 + i * 0.2}s infinite`
          }} />
        ))}
      </div>

      {/* Ligne décorative */}
      <div style={{
        position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
        opacity: phase >= 1 ? 0.5 : 0,
        transition: 'opacity 0.6s ease 0.6s'
      }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'Poppins, sans-serif', letterSpacing: 1 }}>
          Burkina Faso • 2025
        </p>
      </div>

      <style>{`
        @keyframes splashFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes splashHalo {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes splashDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.3); opacity: 1; }
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
      <div style={{ opacity: splashDone ? 1 : 0, transition: 'opacity 0.4s ease', minHeight: '100vh' }}>
        {children}
      </div>
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
