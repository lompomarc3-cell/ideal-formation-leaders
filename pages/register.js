import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

export default function Register() {
  const { user, loading, register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ nom: '', prenom: '', phone: '+226', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
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
      const userData = await register({
        nom: form.nom,
        prenom: form.prenom,
        phone: form.phone,
        password: form.password
      })
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Inscription – IFL</title>
      </Head>
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #C4521A 0%, #8B2500 50%, #1A4731 100%)' }}>
        {/* Header */}
        <div className="text-center pt-8 pb-4">
          <Link href="/">
            <div className="inline-block mb-3 shadow-xl" style={{ borderRadius: '20px', overflow: 'hidden', border: '3px solid rgba(212,160,23,0.8)' }}>
              <img src="/logo.png" alt="IFL" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '17px' }} />
            </div>
          </Link>
          <h1 className="text-white text-3xl font-extrabold">Créer un compte</h1>
          <p className="text-orange-200 mt-1">Rejoignez IFL maintenant</p>
        </div>

        {/* Form */}
        <div className="flex-1 px-4 pb-8">
          <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1.5 text-sm">Nom *</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                    placeholder="NIAMPA"
                    className="input-field text-base py-2.5"
                    required
                    autoCapitalize="characters"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1.5 text-sm">Prénom *</label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))}
                    placeholder="Issa"
                    className="input-field text-base py-2.5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1.5 text-sm">📱 Téléphone (+226) *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+226 XX XX XX XX"
                  className="input-field"
                  required
                />
                <p className="text-gray-400 text-xs mt-1">Burkina Faso uniquement (+226)</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1.5 text-sm">🔒 Mot de passe *</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Min. 6 caractères"
                    className="input-field pr-14"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                    style={{ fontSize: '22px' }}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1.5 text-sm">🔒 Confirmer le mot de passe *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Répéter le mot de passe"
                    className="input-field pr-14"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                    style={{ fontSize: '22px' }}
                  >
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {form.confirm && form.password !== form.confirm && (
                  <p className="text-red-500 text-xs mt-1">⚠️ Mots de passe différents</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 text-xl font-bold text-white rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-60 mt-2"
                style={{ background: submitting ? '#999' : 'linear-gradient(135deg, #C4521A 0%, #8B2500 100%)' }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Création...
                  </span>
                ) : '✅ Créer mon compte'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm">Déjà inscrit ?</p>
              <Link href="/login" className="block mt-2 font-bold hover:opacity-80 text-lg" style={{ color: '#1A4731' }}>
                Se connecter →
              </Link>
            </div>
          </div>

          <p className="text-center text-orange-200 text-sm mt-4">
            <Link href="/" className="hover:text-white">← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </>
  )
}
