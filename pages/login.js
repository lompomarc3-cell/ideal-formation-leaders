import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

export default function Login() {
  const { login } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ phone: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
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
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.token) {
        login(data.user, data.token)
        if (data.user.is_admin) router.push('/admin')
        else router.push('/dashboard')
      } else {
        setError(data.error || 'Erreur de connexion')
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
    }
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Connexion – IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen african-pattern flex flex-col" style={{ background: '#FFF8F0' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)' }} className="py-4 px-5 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="logo-header" style={{ width: 44, height: 44 }}>
              <img src="/logo.png" alt="IFL" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 14 }} />
            </div>
            <span className="text-white font-bold text-lg">IFL</span>
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm animate-fadeIn">
            {/* Logo centré */}
            <div className="text-center mb-8">
              <div className="logo-hero inline-block mb-4" style={{ borderRadius: 28 }}>
                <img src="/logo.png" alt="IFL Logo" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 28, display: 'block' }} />
              </div>
              <h1 className="text-3xl font-extrabold" style={{ color: '#1A4731' }}>Connexion</h1>
              <p className="text-gray-500 mt-1">Accédez à votre espace IFL</p>
            </div>

            {/* Formulaire */}
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-amber-100">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-5 text-sm font-medium flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📱 Numéro de téléphone (+226)
                  </label>
                  <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-amber-500 overflow-hidden transition-all">
                    <span className="flex items-center px-3 bg-gray-50 text-gray-600 font-semibold text-base border-r border-gray-200">
                      🇧🇫 +226
                    </span>
                    <input
                      type="tel"
                      value={form.phone.replace(/^\+226/, '')}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/^0+/, '') }))}
                      placeholder="XX XX XX XX"
                      className="flex-1 px-3 py-3.5 outline-none text-base bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔒 Mot de passe
                  </label>
                  <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-amber-500 overflow-hidden transition-all">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Votre mot de passe"
                      className="flex-1 px-4 py-3.5 outline-none text-base bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="px-4 text-gray-400 hover:text-gray-600 bg-gray-50 border-l border-gray-200 transition-colors"
                    >
                      {showPwd ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-lg font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: loading ? '#999' : 'linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)' }}
                >
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="spinner" style={{width:22,height:22,borderWidth:3}}></span> Connexion...</span> : '🔐 Se connecter'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">Pas encore de compte ?</p>
                <Link href="/register" className="font-bold text-base mt-1 block" style={{ color: '#C4521A' }}>
                  Créer un compte gratuitement →
                </Link>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-gray-400 text-sm hover:text-gray-600">
                ← Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
