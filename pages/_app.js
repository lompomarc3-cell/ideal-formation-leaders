import '../styles/globals.css'
import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// ===== ÉCRAN DE BIENVENUE =====
function WelcomeScreen({ onDone }) {
  const [phase, setPhase] = useState(0) // 0=invisible, 1=visible

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80)
    return () => clearTimeout(t1)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'linear-gradient(160deg, #FFFBF5 0%, #FFF0E0 50%, #FFF8F0 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 24px 40px',
      opacity: phase === 1 ? 1 : 0,
      transition: 'opacity 0.5s ease'
    }}>
      {/* Cercles décoratifs */}
      <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'rgba(196,82,26,0.05)', top: -80, right: -80, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(212,160,23,0.06)', bottom: 60, left: -60, pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{
        opacity: phase === 1 ? 1 : 0,
        transform: phase === 1 ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.9)',
        transition: 'all 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s',
        marginBottom: 28
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: 28,
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(196,82,26,0.25), 0 0 0 3px rgba(212,160,23,0.3)',
          animation: 'welcomeFloat 3s ease-in-out infinite'
        }}>
          <img src="/logo.png" alt="IFL" style={{ width: 96, height: 96, objectFit: 'cover', display: 'block' }} />
        </div>
      </div>

      {/* Titre */}
      <div style={{
        opacity: phase === 1 ? 1 : 0,
        transform: phase === 1 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease 0.3s',
        textAlign: 'center', marginBottom: 20, maxWidth: 340
      }}>
        <h1 style={{
          fontSize: 24, fontWeight: 900, lineHeight: 1.2,
          fontFamily: 'Poppins, sans-serif',
          background: 'linear-gradient(135deg, #8B2500, #C4521A)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 8
        }}>
          Bienvenue sur notre plateforme d&apos;apprentissage
        </h1>
        <div style={{
          width: 48, height: 3, borderRadius: 2,
          background: 'linear-gradient(90deg,#C4521A,#D4A017)',
          margin: '0 auto'
        }} />
      </div>

      {/* Message */}
      <div style={{
        opacity: phase === 1 ? 1 : 0,
        transform: phase === 1 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease 0.5s',
        textAlign: 'center', maxWidth: 360, marginBottom: 36
      }}>
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '20px 22px',
          boxShadow: '0 4px 20px rgba(196,82,26,0.1)',
          border: '1.5px solid #FFE4CC'
        }}>
          <p style={{
            color: '#374151', fontSize: 14, lineHeight: 1.75,
            fontFamily: 'Poppins, sans-serif', fontWeight: 400
          }}>
            Vous êtes sur <strong style={{ color: '#8B2500', fontWeight: 700 }}>Idéale Formation of Leaders</strong> — une communauté d&apos;instructeurs engagés pour une même cause : la réussite des candidats aux concours directs et professionnels de la <strong style={{ color: '#C4521A' }}>fonction publique du Burkina Faso</strong>.
          </p>
          <div style={{ height: 1, background: '#FFE4CC', margin: '14px 0' }} />
          <p style={{
            color: '#6B7280', fontSize: 13, lineHeight: 1.65,
            fontFamily: 'Poppins, sans-serif', fontWeight: 400
          }}>
            Chaque année, nous accompagnons des milliers de candidats — des premières révisions jusqu&apos;à l&apos;épreuve finale.
          </p>
        </div>
      </div>

      {/* Bouton Commencer */}
      <div style={{
        opacity: phase === 1 ? 1 : 0,
        transform: phase === 1 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease 0.7s',
        width: '100%', maxWidth: 320
      }}>
        <button
          onClick={onDone}
          style={{
            width: '100%',
            padding: '16px 32px',
            background: 'linear-gradient(135deg, #8B2500, #C4521A, #D4A017)',
            color: 'white',
            fontWeight: 800,
            fontSize: 16,
            borderRadius: 18,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(196,82,26,0.4)',
            fontFamily: 'Poppins, sans-serif',
            letterSpacing: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(196,82,26,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(196,82,26,0.4)' }}
        >
          <span>🎓</span>
          <span>Commencer</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
        <p style={{ textAlign: 'center', marginTop: 12, color: '#9CA3AF', fontSize: 12, fontFamily: 'Poppins, sans-serif' }}>
          5 questions gratuites par dossier — sans inscription
        </p>
      </div>

      <style>{`
        @keyframes welcomeFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}

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
          Burkina Faso
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
  const [welcomeDone, setWelcomeDone] = useState(false)
  const router = useRouter()

  // Vérifier si l'utilisateur a déjà vu l'écran de bienvenue
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('ifl_welcome_seen')
      if (seen) setWelcomeDone(true)
    }
  }, [])

  const handleWelcomeDone = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ifl_welcome_seen', '1')
    }
    setWelcomeDone(true)
  }

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
      {splashDone && !welcomeDone && !user && <WelcomeScreen onDone={handleWelcomeDone} />}
      <div style={{ opacity: (splashDone && (welcomeDone || !!user)) ? 1 : 0, transition: 'opacity 0.4s ease', minHeight: '100vh' }}>
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
