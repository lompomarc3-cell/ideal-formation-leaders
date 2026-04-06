import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

export default function Register() {
  const { user, loading, register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ nom: '', prenom: '', phone: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.push('/dashboard')
  }, [user, loading, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    setSubmitting(true)
    try {
      await register({ phone: form.phone, nom: form.nom, prenom: form.prenom, password: form.password })
      router.push('/dashboard')
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
      <Head><title>Inscription – IFL</title></Head>
      <div className="min-h-screen african-pattern flex flex-col" style={{ background: '#FFF8F0' }}>
        <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #1A2F20 100%)' }} className="shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="IFL" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '12px' }} />
              <div>
                <h1 className="text-white font-bold text-base">IFL</h1>
                <p className="text-green-200 text-xs">Formation of Leader</p>
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-start justify-center pt-6 px-4 pb-8">
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold" style={{ color: '#1A4731' }}>Créer un compte</h2>
              <p className="text-gray-500 text-sm mt-1">Inscription avec votre téléphone +226</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-5">
                  <p className="text-red-700 text-sm font-medium">⚠️ {error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nom *</label>
                    <input
                      type="text"
                      value={form.nom}
                      onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                      placeholder="OUEDRAOGO"
                      className="w-full px-3 py-3 text-base border-2 border-gray-200 rounded-xl outline-none focus:border-amber-400 transition-all uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Prénom *</label>
                    <input
                      type="text"
                      value={form.prenom}
                      onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))}
                      placeholder="Issa"
                      className="w-full px-3 py-3 text-base border-2 border-gray-200 rounded-xl outline-none focus:border-amber-400 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">📱 Téléphone (+226) *</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-amber-400 transition-all">
                    <span className="px-3 py-3 bg-gray-50 text-gray-500 font-semibold text-sm border-r border-gray-200">+226</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="XX XX XX XX"
                      className="flex-1 px-3 py-3 text-base outline-none bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">🔒 Mot de passe *</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-amber-400 transition-all">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Minimum 6 caractères"
                      className="flex-1 px-4 py-3 text-base outline-none"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 text-gray-400 hover:text-gray-600">
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">🔒 Confirmer le mot de passe *</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-amber-400 transition-all">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                      placeholder="Répétez le mot de passe"
                      className="flex-1 px-4 py-3 text-base outline-none"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="px-3 text-gray-400 hover:text-gray-600">
                      {showConfirm ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 text-lg font-bold text-white rounded-xl active:scale-95 transition-all shadow-md disabled:opacity-60 mt-2"
                  style={{ background: '#1A4731' }}
                >
                  {submitting ? '⏳ Création...' : '✅ Créer mon compte'}
                </button>
              </form>
            </div>

            <div className="text-center mt-5 space-y-2">
              <p className="text-gray-600 text-sm">
                Déjà inscrit ?{' '}
                <Link href="/login" className="font-bold hover:underline" style={{ color: '#C4521A' }}>
                  Se connecter
                </Link>
              </p>
              <Link href="/demo" className="block text-gray-500 text-xs hover:text-gray-700">
                🎯 Essayer d'abord la démo gratuite →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
