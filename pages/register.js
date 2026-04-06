import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Register() {
  const router = useRouter()
  const [form, setForm] = useState({
    phone: '+226',
    nom: '',
    prenom: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validations
    if (!form.phone.match(/^\+226[0-9]{8}$/)) {
      setError('Numéro de téléphone invalide. Format: +226XXXXXXXX')
      return
    }
    if (form.nom.trim().length < 2) {
      setError('Le nom doit contenir au moins 2 caractères')
      return
    }
    if (form.prenom.trim().length < 2) {
      setError('Le prénom doit contenir au moins 2 caractères')
      return
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    try {
      // Check if phone already exists
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', form.phone)
        .limit(1)

      if (existingProfiles && existingProfiles.length > 0) {
        setError('Ce numéro de téléphone est déjà utilisé')
        setLoading(false)
        return
      }

      // Create auth user
      const email = `${form.phone.replace(/\+/g, '')}@ifl.bf`
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            phone: form.phone,
            nom: form.nom,
            prenom: form.prenom,
            full_name: `${form.prenom} ${form.nom}`
          }
        }
      })

      if (authError) throw authError

      // Create profile via API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          phone: form.phone,
          nom: form.nom,
          prenom: form.prenom
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erreur d\'inscription')

      // Auto login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: form.password
      })

      if (loginError) throw loginError

      router.push('/dashboard')
    } catch (err) {
      console.error('Register error:', err)
      setError(err.message || 'Erreur lors de l\'inscription. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Inscription - IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex flex-col">
        {/* Header */}
        <div className="py-6 px-4 flex items-center">
          <Link href="/" className="text-white mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <img src="/logo.png" alt="IFL" className="h-10 w-10 object-contain" />
        </div>

        {/* Form */}
        <div className="flex-1 px-4 pb-8">
          <div className="max-w-md mx-auto">
            <div className="text-white mb-8">
              <h1 className="text-2xl font-bold">Créer votre compte</h1>
              <p className="text-blue-200 mt-1">Commencez par la démo gratuite</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone (+226)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+22670000000"
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      name="prenom"
                      value={form.prenom}
                      onChange={handleChange}
                      placeholder="Jean"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={form.nom}
                      onChange={handleChange}
                      placeholder="OUEDRAOGO"
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Au moins 6 caractères"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Répétez votre mot de passe"
                    className="input-field"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="spinner w-4 h-4"></div>
                      Inscription en cours...
                    </span>
                  ) : (
                    'Créer mon compte'
                  )}
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-gray-600">
                Déjà un compte ?{' '}
                <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
