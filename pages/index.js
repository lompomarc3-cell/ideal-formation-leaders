import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'
import { CATEGORIES_DIRECT, CATEGORIES_PRO } from '../lib/data'

const APP_URL = 'https://ideal-formation-leaders.pages.dev'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [shareMsg, setShareMsg] = useState('')

  useEffect(() => {
    // Tous les utilisateurs connectés (y compris admin) vont au dashboard
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleShare = async () => {
    const text = `🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n✅ Des milliers de QCM\n✅ Concours directs (5 000 FCFA)\n✅ Concours professionnels (20 000 FCFA)\n✅ 10 questions gratuites sans inscription\n\n👉 ${APP_URL}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'IFL – Idéale Formation of Leader', text, url: APP_URL })
        setShareMsg('✅ Partagé !')
      } catch (e) {
        if (e.name !== 'AbortError') window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }
    setTimeout(() => setShareMsg(''), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)' }}>
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
        <header style={{ background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="logo-rounded overflow-hidden shadow-md" style={{ borderRadius: '16px', width: '52px', height: '52px' }}>
                <img src="/logo.png" alt="IFL Logo" style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '16px' }} />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">IFL</h1>
                <p className="text-orange-200 text-xs">Formation of Leader</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {/* Bouton Partager */}
              <button
                onClick={handleShare}
                className="p-2 text-orange-200 hover:text-white transition-colors"
                title="Partager l'application"
                aria-label="Partager"
              >
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
              <Link href="/login" className="px-4 py-2 text-sm font-semibold text-white border-2 border-amber-400 rounded-xl hover:bg-amber-400 transition-all">
                Connexion
              </Link>
              <Link href="/register" className="px-4 py-2 text-sm font-semibold text-white rounded-xl hidden sm:block transition-all" style={{ background: '#C4521A' }}>
                S'inscrire
              </Link>
            </div>
          </div>
          {shareMsg && (
            <div className="text-center py-1 text-sm font-semibold text-amber-200">{shareMsg}</div>
          )}
        </header>

        {/* Hero Section */}
        <section style={{ background: 'linear-gradient(160deg, #8B2500 0%, #C4521A 50%, #D4A017 100%)' }} className="relative overflow-hidden">
          <div className="absolute inset-0 african-pattern opacity-20"></div>
          <div className="relative max-w-lg mx-auto px-4 py-16 text-center text-white">
            <div className="logo-rounded overflow-hidden shadow-2xl mx-auto mb-6 border-4 border-amber-400" style={{ borderRadius: '24px', width: '110px', height: '110px', display: 'inline-block' }}>
              <img src="/logo.png" alt="IFL Logo" style={{ width: '110px', height: '110px', objectFit: 'cover', borderRadius: '24px' }} />
            </div>
            <h1 className="text-4xl font-extrabold mb-3 leading-tight">
              Idéale Formation<br />
              <span style={{ color: '#D4A017' }}>of Leader</span>
            </h1>
            <p className="text-orange-100 text-xl mb-2 font-medium">🇧🇫 Préparation aux concours du Burkina Faso</p>
            <p className="text-orange-200 text-base mb-8">Des milliers de QCM pour réussir vos concours directs et professionnels</p>
            
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Link href="/demo" className="block w-full py-4 px-6 text-lg font-bold rounded-2xl text-white shadow-lg hover:shadow-xl transition-all active:scale-95" style={{ background: '#D4A017' }}>
                🎯 Tester la Démo Gratuite
              </Link>
              <Link href="/register" className="block w-full py-4 px-6 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-white" style={{ background: '#C4521A' }}>
                🚀 S'inscrire Maintenant
              </Link>
              {/* Bouton Partager dans Hero */}
              <button
                onClick={handleShare}
                className="block w-full py-3 px-6 text-base font-bold rounded-2xl shadow-md transition-all active:scale-95 text-white border-2 border-white/40"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                📤 Partager à vos amis
              </button>
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
          <h2 className="text-3xl font-extrabold text-center mb-2" style={{ color: '#8B2500' }}>Nos Offres</h2>
          <p className="text-center text-gray-500 mb-8">Choisissez votre parcours de préparation</p>

          {/* Offre 1 - Concours Directs */}
          <div className="card-african mb-6 overflow-hidden">
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-orange-300 uppercase tracking-wider">Offre 1</span>
                  <h3 className="text-white text-2xl font-extrabold mt-1">Concours Directs</h3>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold" style={{ color: '#D4A017' }}>5 000</p>
                  <p className="text-orange-200 text-sm">FCFA / an</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-gray-600 text-sm mb-4">Accès à tous les dossiers pour les concours directs</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {CATEGORIES_DIRECT.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-lg p-2">
                    <span className="text-xl">{cat.icone}</span>
                    <span className="text-xs text-amber-800 font-medium leading-tight">{cat.nom}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className="block w-full py-4 text-center text-lg font-bold text-white rounded-xl transition-all active:scale-95 shadow-md" style={{ background: '#8B2500' }}>
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
            <a
              href="https://wa.me/22676223962"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-6 py-3 font-bold text-white rounded-xl shadow-md active:scale-95"
              style={{ background: 'rgba(0,0,0,0.25)' }}
            >
              💬 Contacter sur WhatsApp
            </a>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-lg mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-center mb-6" style={{ color: '#8B2500' }}>Pourquoi choisir IFL ?</h2>
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
        <section className="max-w-lg mx-auto px-4 pb-8 pt-4">
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">Déjà inscrit ?</p>
            <Link href="/login" className="text-amber-700 font-bold text-lg hover:text-amber-800">
              Se connecter →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-6 text-gray-500 text-sm border-t border-amber-100" style={{ background: '#FFF0E0' }}>
          <p className="font-semibold">© 2025 IFL – Idéale Formation of Leader 🇧🇫</p>
          <p className="mt-1">
            <a href="https://wa.me/22676223962" className="font-bold" style={{ color: '#C4521A' }}>
              💬 WhatsApp : +226 76 22 39 62
            </a>
          </p>
          <p className="mt-2 text-xs text-gray-400">Orange Money : +226 76 22 39 62</p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/demo" className="text-amber-700 font-semibold text-sm hover:underline">🎯 Démo gratuite</Link>
            <Link href="/help" className="text-amber-700 font-semibold text-sm hover:underline">❓ Aide</Link>
            <button onClick={handleShare} className="font-semibold text-sm hover:underline" style={{ color: '#C4521A' }}>📤 Partager</button>
          </div>
        </footer>
      </div>
    </>
  )
}
