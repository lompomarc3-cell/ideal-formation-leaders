import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>IFL - Idéale Formation of Leader</title>
        <meta name="description" content="Préparez vos concours avec la plateforme IFL - Idéale Formation of Leader" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.png" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
        {/* Header */}
        <header className="py-6 px-4">
          <div className="max-w-lg mx-auto flex justify-center">
            <img src="/logo.png" alt="IFL Logo" className="h-24 w-24 object-contain" />
          </div>
        </header>

        {/* Hero Section */}
        <main className="px-4 pb-12">
          <div className="max-w-lg mx-auto text-center text-white mb-10">
            <h1 className="text-3xl font-bold mb-2">Idéale Formation of Leader</h1>
            <p className="text-blue-200 text-lg font-medium mb-1">
              Déterminer • Travailler • Réussir
            </p>
            <p className="text-blue-300 text-sm">
              La plateforme de préparation aux concours du Burkina Faso
            </p>
          </div>

          {/* Stats */}
          <div className="max-w-lg mx-auto grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center text-white">
              <div className="text-2xl font-bold">10+</div>
              <div className="text-xs text-blue-200 mt-1">Matières</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center text-white">
              <div className="text-2xl font-bold">22</div>
              <div className="text-xs text-blue-200 mt-1">Dossiers</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center text-white">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-xs text-blue-200 mt-1">BF Focus</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="max-w-md mx-auto space-y-4">
            <Link href="/register" className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-200 text-lg active:scale-95">
              Créer mon compte gratuit
            </Link>
            <Link href="/login" className="block w-full bg-white/20 hover:bg-white/30 text-white text-center font-semibold py-4 px-6 rounded-2xl border border-white/30 transition-all duration-200 active:scale-95">
              Se connecter
            </Link>
          </div>

          {/* Features */}
          <div className="max-w-lg mx-auto mt-12 grid grid-cols-1 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-white flex items-start gap-4">
              <div className="text-3xl">🆓</div>
              <div>
                <h3 className="font-semibold mb-1">Démo Gratuite</h3>
                <p className="text-blue-200 text-sm">10 questions pour découvrir la plateforme sans payer</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-white flex items-start gap-4">
              <div className="text-3xl">🎯</div>
              <div>
                <h3 className="font-semibold mb-1">Concours Directs</h3>
                <p className="text-blue-200 text-sm">10 matières - Culture générale, Français, Maths, SVT... à 5 000 FCFA</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-white flex items-start gap-4">
              <div className="text-3xl">🏆</div>
              <div>
                <h3 className="font-semibold mb-1">Concours Professionnels</h3>
                <p className="text-blue-200 text-sm">12 spécialités - CAPES, CASU, Santé, Police... à 20 000 FCFA</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-white flex items-start gap-4">
              <div className="text-3xl">📱</div>
              <div>
                <h3 className="font-semibold mb-1">Paiement Orange Money</h3>
                <p className="text-blue-200 text-sm">Paiement simple et sécurisé via Orange Money Burkina</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="max-w-lg mx-auto mt-12 text-center text-blue-300 text-sm">
            <p>© 2025 IFL - Idéale Formation of Leader</p>
            <p className="mt-1">Burkina Faso | +226 76 22 39 62</p>
          </div>
        </main>
      </div>
    </>
  )
}
