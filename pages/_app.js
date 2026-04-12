import '../styles/globals.css'
import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// ===== SPLASH SCREEN ANIMÉ PREMIUM =====
function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0) // 0=initial, 1=logo, 2=texte, 3=fadeout

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100)
    const t2 = setTimeout(() => setPhase(2), 700)
    const t3 = setTimeout(() => setPhase(3), 2500)
    const t4 = setTimeout(() => onDone(), 3100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(160deg, #6B1A00 0%, #8B2500 30%, #C4521A 70%, #D4A017 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 0.6s ease',
      opacity: phase === 3 ? 0 : 1,
      pointerEvents: phase === 3 ? 'none' : 'all',
      overflow: 'hidden'
    }}>
      {/* Particules décoratives */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', width: 320, height: 320, borderRadius: '50%',
          background: 'rgba(212,160,23,0.08)', top: -80, right: -80,
          animation: 'splashCircle1 4s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', bottom: 60, left: -60,
          animation: 'splashCircle2 3s ease-in-out 0.5s infinite'
        }} />
        <div style={{
          position: 'absolute', width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(212,160,23,0.1)', top: '40%', left: '10%',
          animation: 'splashCircle2 5s ease-in-out 1s infinite'
        }} />
        {/* Lignes décoratives diagonales */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 80px)',
        }} />
      </div>

      {/* Logo avec animation zoom + bounce */}
      <div style={{
        transform: phase >= 1 ? 'scale(1)' : 'scale(0.2)',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        marginBottom: 32,
        position: 'relative', zIndex: 2
      }}>
        {/* Halo pulsant */}
        <div style={{
          position: 'absolute', inset: -16, borderRadius: 48,
          background: 'rgba(212,160,23,0.2)',
          animation: phase >= 1 ? 'splashHalo 2s ease-in-out 0.5s infinite' : 'none'
        }} />
        <div style={{
          position: 'absolute', inset: -8, borderRadius: 40,
          background: 'rgba(212,160,23,0.15)',
          animation: phase >= 1 ? 'splashHalo 2s ease-in-out 0.8s infinite' : 'none'
        }} />
        {/* Logo */}
        <div style={{
          width: 128, height: 128, borderRadius: 34,
          overflow: 'hidden', position: 'relative', zIndex: 1,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 3px rgba(212,160,23,0.6), 0 0 0 6px rgba(212,160,23,0.2)',
          animation: phase >= 1 ? 'splashFloat 3s ease-in-out 1s infinite' : 'none'
        }}>
          <img src="/logo.png" alt="IFL" style={{ width: 128, height: 128, objectFit: 'cover', display: 'block' }} />
        </div>
      </div>

      {/* Nom IFL */}
      <div style={{
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0)' : 'translateY(24px)',
        transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
        textAlign: 'center', zIndex: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ height: 2, width: 32, background: 'rgba(212,160,23,0.7)', borderRadius: 2 }} />
          <p style={{
            color: 'white', fontWeight: 900, fontSize: 38,
            letterSpacing: 4, fontFamily: 'Poppins, sans-serif',
            textShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}>IFL</p>
          <div style={{ height: 2, width: 32, background: 'rgba(212,160,23,0.7)', borderRadius: 2 }} />
        </div>
        <p style={{
          color: 'rgba(255,224,160,0.95)', fontWeight: 600, fontSize: 13,
          letterSpacing: 1, fontFamily: 'Poppins, sans-serif'
        }}>Idéale Formation of Leaders</p>
      </div>

      {/* Slogan dans capsule */}
      <div style={{
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.9)',
        transition: 'all 0.6s ease 0.3s',
        marginTop: 16, textAlign: 'center', zIndex: 2
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: '8px 24px',
          backdropFilter: 'blur(8px)', border: '1px solid rgba(212,160,23,0.3)'
        }}>
          <p style={{
            color: 'rgba(255,224,160,0.9)', fontWeight: 500, fontSize: 12,
            fontFamily: 'Poppins, sans-serif'
          }}>🎓 Réussissez vos concours du Burkina Faso</p>
        </div>
      </div>

      {/* Points de chargement animés */}
      <div style={{
        display: 'flex', gap: 10, marginTop: 56, zIndex: 2,
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 0.4s ease 0.5s'
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 9, height: 9, borderRadius: '50%',
            background: 'rgba(255,224,160,0.85)',
            animation: `splashDot 1.4s ease-in-out ${0.1 + i * 0.2}s infinite`
          }} />
        ))}
      </div>

      {/* Copyright bas de page */}
      <div style={{
        position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
        opacity: phase >= 2 ? 0.45 : 0, transition: 'opacity 0.6s ease 0.6s', zIndex: 2,
        textAlign: 'center', whiteSpace: 'nowrap'
      }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Poppins, sans-serif', letterSpacing: 1.5 }}>
          BURKINA FASO • 2025
        </p>
      </div>

      <style>{`
        @keyframes splashFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-8px) rotate(0.5deg); }
          66% { transform: translateY(-4px) rotate(-0.5deg); }
        }
        @keyframes splashHalo {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes splashDot {
          0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
          40% { transform: scale(1.4); opacity: 1; }
        }
        @keyframes splashCircle1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-20px, 20px) scale(1.1); }
        }
        @keyframes splashCircle2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(15px, -15px) scale(1.05); }
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
      // Support both response formats: { id: ... } or { user: { id: ... } }
      const userData = data.user || data
      if (userData && userData.id) {
        setUser(userData)
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
      <div style={{
        opacity: splashDone ? 1 : 0,
        transition: 'opacity 0.5s ease',
        minHeight: '100vh'
      }}>
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
