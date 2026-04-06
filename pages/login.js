import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({ phone: '+226', password: '' })
  const [isAdminLogin, setIsAdminLogin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Admin login with admin@ifl.bf, or phone login
      let email
      if (form.phone === 'admin@ifl.bf' || form.phone.includes('@')) {
        email = form.phone
      } else {
        email = `${form.phone.replace(/\+/g, '')}@ifl.bf`
      }
      
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: form.password
      })

      if (loginError) {
        if (loginError.message.includes('Invalid login')) {
          setError('Téléphone ou mot de passe incorrect')
        } else {
          setError(loginError.message)
        }
        return
      }

      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Connexion - IFL</title>
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
        <div className="flex-1 flex items-start px-4 pt-8 pb-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-white mb-8">
              <h1 className="text-2xl font-bold">Connexion</h1>
              <p className="text-blue-200 mt-1">Accédez à votre espace formation</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de téléphone ou email admin
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+22670000000 ou admin@ifl.bf"
                    className="input-field"
                    required
                  />
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
                    placeholder="Votre mot de passe"
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
                      Connexion...
                    </span>
                  ) : (
                    'Se connecter'
                  )}
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                  S'inscrire gratuitement
                </Link>
              </div>
            </div>

            {/* Admin hint */}
            <div className="mt-6 text-center">
              <p className="text-blue-200 text-xs">
                Administrateur ? Connectez-vous avec votre compte admin
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
