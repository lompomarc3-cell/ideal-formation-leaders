import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

export default function Register() {
  const { login } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ nom: '', prenom: '', phone: '', password: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      return setError('Les mots de passe ne correspondent pas.')
    }
    if (form.password.length < 6) {
      return setError('Le mot de passe doit faire au moins 6 caractères.')
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          nom: form.nom,
          prenom: form.prenom,
          password: form.password
        })
      })
      const data = await res.json()
      if (data.token) {
        login(data.user, data.token)
        router.push('/dashboard')
      } else {
        setError(data.error || 'Erreur lors de l\'inscription')
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
    }
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Inscription – IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen african-pattern" style={{ background: '#FFF8F0' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)' }} className="py-4 px-5 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="logo-header" style={{ width: 44, height: 44 }}>
              <img src="/logo.png" alt="IFL" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 14 }} />
            </div>
            <span className="text-white font-bold text-lg">IFL</span>
          </Link>
        </header>

        <div className="max-w-sm mx-auto px-4 py-8 animate-fadeIn">
          <div className="text-center mb-7">
            <div className="logo-hero inline-block mb-4" style={{ borderRadius: 28 }}>
              <img src="/logo.png" alt="IFL Logo" style={{ width: 82, height: 82, objectFit: 'cover', borderRadius: 28, display: 'block' }} />
            </div>
            <h1 className="text-3xl font-extrabold" style={{ color: '#1A4731' }}>Créer un compte</h1>
            <p className="text-gray-500 mt-1">Inscrivez-vous pour préparer vos concours</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 border border-amber-100">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-5 text-sm font-medium flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Nom de famille</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                  placeholder="Ex: NIAMPA"
                  className="input-field"
                  required
                />
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Prénom</label>
                <input
                  type="text"
                  value={form.prenom}
                  onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))}
                  placeholder="Ex: Issa"
                  className="input-field"
                  required
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📱 Numéro (+226)</label>
                <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-amber-500 overflow-hidden transition-all">
                  <span className="flex items-center px-3 bg-gray-50 text-gray-600 font-semibold text-base border-r border-gray-200 whitespace-nowrap">
                    🇧🇫 +226
                  </span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/^0+/, '') }))}
                    placeholder="XX XX XX XX"
                    className="flex-1 px-3 py-3.5 outline-none text-base bg-white"
                    required
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🔒 Mot de passe</label>
                <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-amber-500 overflow-hidden transition-all">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Minimum 6 caractères"
                    className="flex-1 px-4 py-3.5 outline-none text-base bg-white"
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="px-4 text-gray-400 bg-gray-50 border-l border-gray-200">
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Confirmation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🔒 Confirmer le mot de passe</label>
                <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-amber-500 overflow-hidden transition-all">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Répétez le mot de passe"
                    className="flex-1 px-4 py-3.5 outline-none text-base bg-white"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="px-4 text-gray-400 bg-gray-50 border-l border-gray-200">
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-lg font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-60 mt-2"
                style={{ background: loading ? '#999' : 'linear-gradient(135deg, #C4521A 0%, #8B2500 100%)' }}
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="spinner" style={{width:22,height:22,borderWidth:3}}></span> Inscription...</span>
                  : '🚀 Créer mon compte'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">Déjà inscrit ?</p>
              <Link href="/login" className="font-bold text-base mt-1 block" style={{ color: '#1A4731' }}>
                Se connecter →
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-gray-400 text-sm hover:text-gray-600">← Retour à l'accueil</Link>
          </div>
        </div>
      </div>
    </>
  )
}
