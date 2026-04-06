import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

export default function Login() {
  const { user, loading, login } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ phone: '+226', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push(user.is_admin ? '/admin' : '/dashboard')
    }
  }, [user, loading, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const userData = await login(form.phone, form.password)
      router.push(userData.is_admin ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Connexion – IFL</title>
      </Head>
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #1A4731 0%, #2D6A4F 60%, #C4521A 100%)' }}>
        {/* Header */}
        <div className="text-center pt-10 pb-6">
          <Link href="/">
            <div className="inline-block mb-3 shadow-xl" style={{ borderRadius: '20px', overflow: 'hidden', border: '3px solid rgba(212,160,23,0.8)' }}>
              <img src="/logo.png" alt="IFL" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '17px' }} />
            </div>
          </Link>
          <h1 className="text-white text-3xl font-extrabold">Connexion</h1>
          <p className="text-green-200 mt-1">Accédez à vos cours</p>
        </div>

        {/* Form Card */}
        <div className="flex-1 px-4 pb-8">
          <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-base">
                  📱 Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+226 XX XX XX XX"
                  className="input-field"
                  required
                  autoFocus
                />
                <p className="text-gray-400 text-xs mt-1">Format: +226XXXXXXXX</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-base">
                  🔒 Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Votre mot de passe"
                    className="input-field pr-14"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                    style={{ fontSize: '22px' }}
                    aria-label={showPass ? 'Masquer' : 'Afficher'}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 text-xl font-bold text-white rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-60"
                style={{ background: submitting ? '#999' : 'linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)' }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Connexion...
                  </span>
                ) : '🔑 Se connecter'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-3">
              <p className="text-gray-500 text-sm">Pas encore de compte ?</p>
              <Link href="/register" className="block w-full py-3 text-center font-bold rounded-xl border-2 transition-all active:scale-95" style={{ color: '#C4521A', borderColor: '#C4521A' }}>
                S'inscrire maintenant
              </Link>
              <Link href="/demo" className="block text-amber-600 font-medium hover:text-amber-700 text-sm">
                🎯 Essayer la démo gratuite (sans compte)
              </Link>
            </div>
          </div>

          <p className="text-center text-green-200 text-sm mt-6">
            <Link href="/" className="hover:text-white">← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </>
  )
}
