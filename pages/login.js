import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

const APP_URL = 'https://ideal-formation-leaders.pages.dev'

export default function Login() {
  const { login } = useAuth()
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      })
      const data = await res.json()
      if (data.token) {
        login(data.token, data.user)
        // Admin et utilisateurs normal arrivent tous sur /dashboard
        // L'admin peut accéder au panel via le bouton ⚙️ Admin dans le dashboard
        router.push('/dashboard')
      } else {
        setError(data.error || 'Identifiants incorrects')
      }
    } catch {
      setError('Erreur de connexion. Réessayez.')
    }
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Connexion – IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #8B2500 0%, #C4521A 50%, #D4A017 100%)' }}>
        {/* Header */}
        <div className="px-4 pt-8 pb-4 text-center">
          <div className="inline-block logo-rounded mb-4" style={{ width: 90, height: 90 }}>
            <img src="/logo.png" alt="IFL" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 20 }} />
          </div>
          <h1 className="text-white font-extrabold text-2xl">Connexion</h1>
          <p className="text-orange-200 text-sm mt-1">Accédez à vos QCM de concours</p>
        </div>

        {/* Formulaire */}
        <div className="flex-1 px-4 pb-8">
          <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-6 mt-2">
            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm font-semibold text-white" style={{ background: '#dc2626' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Téléphone */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">📱 Numéro de téléphone</label>
                <div className="flex w-full" style={{ minWidth: 0 }}>
                  <span className="flex items-center flex-shrink-0 px-3 rounded-l-xl border-2 border-r-0 border-gray-200 bg-gray-50 text-gray-600 font-semibold text-sm whitespace-nowrap" style={{ minWidth: 0 }}>
                    🇧🇫 +226
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="70 00 00 00"
                    required
                    className="min-w-0 flex-1 px-3 py-3.5 border-2 border-gray-200 rounded-r-xl focus:border-amber-500 focus:outline-none transition-colors"
                    style={{ fontSize: '16px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">🔒 Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3.5 pr-12 text-lg border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? (
                      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-white font-extrabold text-lg rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-70"
                style={{ background: loading ? '#aaa' : 'linear-gradient(135deg,#C4521A,#8B2500)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner" style={{ width: 22, height: 22, borderWidth: 3 }}></span>
                    Connexion...
                  </span>
                ) : '🔓 Se connecter'}
              </button>
            </form>

            <div className="mt-5 text-center space-y-2">
              <p className="text-gray-500 text-sm">
                Pas encore inscrit ?{' '}
                <Link href="/register" className="font-bold hover:underline" style={{ color: '#C4521A' }}>
                  Créer un compte →
                </Link>
              </p>
              <p className="text-gray-400 text-xs">
                <Link href="/" className="hover:underline">← Retour à l'accueil</Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
