import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

export default function Login() {
  const { user, loading, login } = useAuth()
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      if (user.is_admin) router.push('/admin')
      else router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const loggedUser = await login(phone, password)
      if (loggedUser.is_admin) router.push('/admin')
      else router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1A4731 0%, #C4521A 100%)' }}>
        <div className="spinner mx-auto"></div>
      </div>
    )
  }

  return (
    <>
      <Head><title>Connexion – IFL</title></Head>
      <div className="min-h-screen african-pattern flex flex-col" style={{ background: '#FFF8F0' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #1A2F20 100%)' }} className="shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="IFL" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '12px' }} />
              <div>
                <h1 className="text-white font-bold text-base leading-tight">IFL</h1>
                <p className="text-green-200 text-xs">Formation of Leader</p>
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-start justify-center pt-8 px-4 pb-8">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 overflow-hidden shadow-lg" style={{ borderRadius: '20px' }}>
                <img src="/logo.png" alt="IFL" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '20px' }} />
              </div>
              <h2 className="text-2xl font-extrabold" style={{ color: '#1A4731' }}>Connexion</h2>
              <p className="text-gray-500 text-sm mt-1">Entrez votre numéro et mot de passe</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-5">
                  <p className="text-red-700 text-sm font-medium">⚠️ {error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📱 Numéro de téléphone (+226)
                  </label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-amber-400 transition-all">
                    <span className="px-3 py-3.5 bg-gray-50 text-gray-500 font-semibold text-sm border-r border-gray-200">+226</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="XX XX XX XX"
                      className="flex-1 px-3 py-3.5 text-base outline-none bg-white"
                      required
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔒 Mot de passe
                  </label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-amber-400 transition-all">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Votre mot de passe"
                      className="flex-1 px-4 py-3.5 text-base outline-none bg-white"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-4 py-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 text-lg font-bold text-white rounded-xl active:scale-95 transition-all shadow-md disabled:opacity-60"
                  style={{ background: '#C4521A' }}
                >
                  {submitting ? '⏳ Connexion...' : '🔓 Se connecter'}
                </button>
              </form>
            </div>

            <div className="text-center mt-6 space-y-3">
              <p className="text-gray-600">
                Pas encore de compte ?{' '}
                <Link href="/register" className="font-bold hover:underline" style={{ color: '#C4521A' }}>
                  S'inscrire
                </Link>
              </p>
              <Link href="/demo" className="block text-gray-500 text-sm hover:text-gray-700">
                🎯 Essayer la démo gratuite d'abord →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
