import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'
import { CATEGORIES_DIRECT, CATEGORIES_PRO } from '../lib/data'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && !user.is_admin) {
      router.push('/dashboard')
    } else if (!loading && user && user.is_admin) {
      router.push('/admin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1A4731 0%, #C4521A 100%)' }}>
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>IFL - Idéale Formation of Leader | Burkina Faso</title>
        <meta name="description" content="Préparez vos concours du Burkina Faso avec IFL. Concours directs et professionnels." />
      </Head>

      <div className="min-h-screen african-pattern" style={{ background: '#FFF8F0' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #1A2F20 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="logo-rounded overflow-hidden shadow-md" style={{ borderRadius: '16px', width: '52px', height: '52px' }}>
                <img src="/logo.png" alt="IFL Logo" style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '16px' }} />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">IFL</h1>
                <p className="text-green-200 text-xs">Formation of Leader</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/login" className="px-4 py-2 text-sm font-semibold text-white border-2 border-amber-400 rounded-xl hover:bg-amber-400 transition-all">
                Connexion
              </Link>
              <Link href="/register" className="px-4 py-2 text-sm font-semibold text-white rounded-xl hidden sm:block transition-all" style={{ background: '#C4521A' }}>
                S'inscrire
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section style={{ background: 'linear-gradient(160deg, #1A4731 0%, #2D6A4F 50%, #C4521A 100%)' }} className="relative overflow-hidden">
          <div className="absolute inset-0 african-pattern opacity-20"></div>
          <div className="relative max-w-lg mx-auto px-4 py-16 text-center text-white">
            <div className="logo-rounded overflow-hidden shadow-2xl mx-auto mb-6 border-4 border-amber-400" style={{ borderRadius: '24px', width: '110px', height: '110px', display: 'inline-block' }}>
              <img src="/logo.png" alt="IFL Logo" style={{ width: '110px', height: '110px', objectFit: 'cover', borderRadius: '24px' }} />
            </div>
            <h1 className="text-4xl font-extrabold mb-3 leading-tight">
              Idéale Formation<br />
              <span style={{ color: '#D4A017' }}>of Leader</span>
            </h1>
            <p className="text-green-100 text-xl mb-2 font-medium">🇧🇫 Préparation aux concours du Burkina Faso</p>
            <p className="text-green-200 text-base mb-8">Des milliers de QCM pour réussir vos concours directs et professionnels</p>
            
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Link href="/demo" className="block w-full py-4 px-6 text-lg font-bold rounded-2xl text-white shadow-lg hover:shadow-xl transition-all active:scale-95" style={{ background: '#D4A017' }}>
                🎯 Tester la Démo Gratuite
              </Link>
              <Link href="/register" className="block w-full py-4 px-6 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-white" style={{ background: '#C4521A' }}>
                🚀 S'inscrire Maintenant
              </Link>
            </div>
          </div>
        </section>

        {/* Badge Free Demo */}
        <div className="max-w-lg mx-auto px-4 -mt-4 relative z-10">
          <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 text-center shadow-lg">
            <p className="text-amber-800 font-bold text-lg">🆓 10 questions gratuites sans inscription !</p>
            <p className="text-amber-700 text-sm mt-1">Testez notre plateforme maintenant</p>
            <Link href="/demo" className="inline-block mt-3 px-6 py-2 font-bold text-white rounded-xl text-sm transition-all active:scale-95" style={{ background: '#C4521A' }}>
              Commencer la démo →
            </Link>
          </div>
        </div>

        {/* Offres */}
        <section className="max-w-lg mx-auto px-4 py-10">
          <h2 className="text-3xl font-extrabold text-center mb-2" style={{ color: '#1A4731' }}>Nos Offres</h2>
          <p className="text-center text-gray-500 mb-8">Choisissez votre parcours de préparation</p>

          {/* Offre 1 - Concours Directs */}
          <div className="card-african mb-6 overflow-hidden">
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-green-300 uppercase tracking-wider">Offre 1</span>
                  <h3 className="text-white text-2xl font-extrabold mt-1">Concours Directs</h3>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold" style={{ color: '#D4A017' }}>5 000</p>
                  <p className="text-green-200 text-sm">FCFA / an</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-gray-600 text-sm mb-4">Accès à tous les dossiers pour les concours directs</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {CATEGORIES_DIRECT.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 bg-green-50 rounded-lg p-2">
                    <span className="text-xl">{cat.icone}</span>
                    <span className="text-xs text-green-800 font-medium leading-tight">{cat.nom}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className="block w-full py-4 text-center text-lg font-bold text-white rounded-xl transition-all active:scale-95 shadow-md" style={{ background: '#1A4731' }}>
                S'abonner – 5 000 FCFA
              </Link>
            </div>
          </div>

          {/* Offre 2 - Concours Professionnels */}
          <div className="card-african overflow-hidden border-2" style={{ borderColor: '#C4521A' }}>
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #C4521A 0%, #8B2500 100%)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-orange-200 uppercase tracking-wider">Offre 2</span>
                  <h3 className="text-white text-2xl font-extrabold mt-1">Concours Professionnels</h3>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold" style={{ color: '#D4A017' }}>20 000</p>
                  <p className="text-orange-200 text-sm">FCFA / an</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-gray-600 text-sm mb-4">Accès complet aux concours professionnels</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {CATEGORIES_PRO.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 bg-orange-50 rounded-lg p-2">
                    <span className="text-xl">{cat.icone}</span>
                    <span className="text-xs text-orange-800 font-medium leading-tight">{cat.nom}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className="block w-full py-4 text-center text-lg font-bold text-white rounded-xl transition-all active:scale-95 shadow-md" style={{ background: '#C4521A' }}>
                S'abonner – 20 000 FCFA
              </Link>
            </div>
          </div>
        </section>

        {/* Orange Money Section */}
        <section className="max-w-lg mx-auto px-4 py-6">
          <div className="rounded-2xl p-6 text-white text-center" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF9500 100%)' }}>
            <p className="text-3xl mb-2">📱</p>
            <h3 className="text-xl font-bold mb-2">Paiement Orange Money</h3>
            <p className="text-orange-100 text-sm mb-4">Payez facilement avec votre mobile</p>
            <div className="bg-white/20 rounded-xl p-4 text-left">
              <p className="font-bold text-lg mb-2">📲 Numéro : <span className="text-yellow-200">+226 76 22 39 62</span></p>
              <p className="text-sm text-orange-100">USSD : <code className="bg-white/20 px-2 py-1 rounded">*144*2*1*76223962#</code></p>
              <p className="text-sm text-orange-100 mt-2">📸 Envoyez la capture par WhatsApp</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-lg mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-center mb-6" style={{ color: '#1A4731' }}>Pourquoi choisir IFL ?</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '📱', title: 'Mobile-first', desc: 'Apprenez depuis votre téléphone' },
              { icon: '💾', title: 'Progression sauvée', desc: 'Reprenez où vous avez arrêté' },
              { icon: '✅', title: 'Corrections', desc: 'Réponses et explications détaillées' },
              { icon: '🏆', title: 'Expert Burkina', desc: 'QCM spécialisés concours BF' }
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-md border border-amber-100 text-center">
                <div className="text-4xl mb-2">{f.icon}</div>
                <h4 className="font-bold text-gray-800 text-sm">{f.title}</h4>
                <p className="text-gray-500 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Footer */}
        <section className="max-w-lg mx-auto px-4 pb-12 pt-4">
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">Déjà inscrit ?</p>
            <Link href="/login" className="text-amber-700 font-bold text-lg hover:text-amber-800">
              Se connecter →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-6 text-gray-400 text-sm border-t border-amber-100">
          <p>© 2025 IFL – Idéale Formation of Leader</p>
          <p className="mt-1">Burkina Faso 🇧🇫 | Contact WhatsApp: +226 76 22 39 62</p>
        </footer>
      </div>
    </>
  )
}
