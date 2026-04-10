import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

const APP_URL = 'https://ideal-formation-leaders.pages.dev'

const CATEGORIES_DIRECT = [
  { nom: 'Actualité / Culture générale', icone: '🌍' },
  { nom: 'Français', icone: '📚' },
  { nom: 'Littérature et art', icone: '🎨' },
  { nom: 'H-G (Histoire-Géographie)', icone: '🗺️' },
  { nom: 'SVT (Sciences de la Vie)', icone: '🧬' },
  { nom: 'Psychotechniques', icone: '🧠' },
  { nom: 'Mathématiques', icone: '📐' },
  { nom: 'PC (Physique-Chimie)', icone: '⚗️' },
  { nom: 'Entraînement QCM', icone: '✏️' },
  { nom: 'Accompagnement final', icone: '🎯' }
]

const CATEGORIES_PRO = [
  { nom: 'Spécialités Vie Scolaire (CASU/AASU)', icone: '🏫' },
  { nom: 'Actualités et Culture Générale', icone: '📰' },
  { nom: 'Spécialités CISU/AISU/ENAREF', icone: '🏛️' },
  { nom: 'Inspectorat (IES/IEPENF)', icone: '🔍' },
  { nom: 'Professeurs Agrégés', icone: '🎓' },
  { nom: 'CAPES – Toutes Options', icone: '📖' },
  { nom: 'Administrateur des Hôpitaux', icone: '🏥' },
  { nom: 'Spécialités Santé', icone: '💊' },
  { nom: 'Justice', icone: '⚖️' },
  { nom: 'Magistrature', icone: '🏛️' },
  { nom: 'Spécialités GSP', icone: '🛡️' },
  { nom: 'Spécialités Police', icone: '👮' },
  { nom: 'Administrateur Civil', icone: '📋' },
  { nom: 'Entraînement QCM', icone: '✏️' },
  { nom: 'Accompagnement final', icone: '🎯' }
]

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [shareMsg, setShareMsg] = useState('')
  const scrollDirectRef = useRef(null)
  const scrollProRef = useRef(null)

  useEffect(() => {
    if (!loading && user) {
      if (user.is_admin) router.push('/admin')
      else router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleShare = async () => {
    const text = `🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n✅ Des milliers de QCM\n✅ Concours directs (5 000 FCFA/an)\n✅ Concours professionnels (20 000 FCFA/an)\n✅ 10 questions gratuites sans inscription\n\n👉 ${APP_URL}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'IFL – Formation Burkina Faso', text, url: APP_URL })
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
        <div className="text-center"><div className="spinner mx-auto mb-3"></div><p className="text-white font-semibold">Chargement...</p></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>IFL – Idéale Formation of Leaders | Concours Burkina Faso</title>
        <meta name="description" content="Préparez vos concours du Burkina Faso avec des milliers de QCM. Concours directs et professionnels." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen" style={{ background: '#FFF8F0' }}>

        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="logo-header" style={{ width: 44, height: 44 }}>
                <img src="/logo.png" alt="IFL" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 14 }} />
              </div>
              <div>
                <p className="text-white font-extrabold text-base leading-tight">IFL</p>
                <p className="text-orange-200 text-xs">Idéale Formation of Leaders</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleShare}
                className="p-2 text-orange-200 hover:text-white transition-colors"
                title="Partager"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
              <Link href="/login" className="px-3 py-1.5 text-xs font-bold text-white rounded-lg" style={{ background: 'rgba(255,255,255,0.2)' }}>
                Connexion
              </Link>
            </div>
          </div>
          {shareMsg && <div className="text-center py-1 text-sm font-semibold text-amber-200">{shareMsg}</div>}
        </header>

        {/* Hero */}
        <div className="african-pattern" style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A,#D4A017)' }}>
          <div className="max-w-lg mx-auto px-4 py-12 text-center">
            <div className="inline-block logo-hero mb-5" style={{ width: 110, height: 110 }}>
              <img src="/logo.png" alt="IFL" style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 28 }} />
            </div>
            <h1 className="text-white font-extrabold text-3xl mb-3 leading-tight">
              Réussissez vos concours<br/>du Burkina Faso
            </h1>
            <p className="text-orange-200 text-base mb-2">Des milliers de QCM pour vous préparer</p>
            <div className="inline-block bg-white bg-opacity-20 text-white text-xs font-bold px-3 py-1 rounded-full mb-6">
              🎯 10 questions gratuites sans inscription
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/demo"
                className="px-8 py-4 text-base font-extrabold text-white rounded-xl shadow-lg active:scale-95 transition-all text-center"
                style={{ background: '#D4A017' }}
              >
                🎯 Démo gratuite
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 text-base font-extrabold rounded-xl shadow-lg active:scale-95 transition-all text-center"
                style={{ background: 'white', color: '#C4521A' }}
              >
                🚀 S'inscrire →
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6">

          {/* Offres */}
          <h2 className="text-2xl font-extrabold mb-4" style={{ color: '#8B2500' }}>Nos offres</h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-md border-2 border-amber-100 p-5 text-center">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="font-extrabold text-base mb-1" style={{ color: '#8B2500' }}>Concours Directs</h3>
              <p className="text-gray-500 text-xs mb-3">10 dossiers thématiques</p>
              <p className="text-2xl font-extrabold" style={{ color: '#C4521A' }}>5 000</p>
              <p className="text-gray-400 text-xs">FCFA / an</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md border-2 border-amber-100 p-5 text-center">
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="font-extrabold text-base mb-1" style={{ color: '#8B2500' }}>Professionnels</h3>
              <p className="text-gray-500 text-xs mb-3">15 dossiers spécialisés</p>
              <p className="text-2xl font-extrabold" style={{ color: '#C4521A' }}>20 000</p>
              <p className="text-gray-400 text-xs">FCFA / an</p>
            </div>
          </div>

          {/* Dossiers Concours Directs - Scroll horizontal */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-extrabold" style={{ color: '#8B2500' }}>📚 Concours Directs</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">10 dossiers</span>
            </div>
            <p className="text-gray-400 text-xs mb-3">← Glissez pour voir tous les dossiers →</p>
            <div
              ref={scrollDirectRef}
              className="flex gap-3 overflow-x-auto pb-3"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {CATEGORIES_DIRECT.map((cat, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 bg-white rounded-2xl border-2 border-amber-100 shadow-sm overflow-hidden"
                  style={{ scrollSnapAlign: 'start', width: '160px', minWidth: '160px', opacity: 0.85 }}
                >
                  <div className="p-4 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE0C8)', minHeight: '64px', minWidth: '64px' }}>
                      <span style={{ fontSize: '36px' }}>{cat.icone}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-700 leading-tight mb-2">{cat.nom}</p>
                    <span className="text-gray-300 text-sm">🔒</span>
                  </div>
                  <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Dossiers Concours Professionnels - Scroll horizontal */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-extrabold" style={{ color: '#8B2500' }}>🎓 Professionnels</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">15 dossiers</span>
            </div>
            <p className="text-gray-400 text-xs mb-3">← Glissez pour voir tous les dossiers →</p>
            <div
              ref={scrollProRef}
              className="flex gap-3 overflow-x-auto pb-3"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {CATEGORIES_PRO.map((cat, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 bg-white rounded-2xl border-2 border-amber-100 shadow-sm overflow-hidden"
                  style={{ scrollSnapAlign: 'start', width: '160px', minWidth: '160px', opacity: 0.85 }}
                >
                  <div className="p-4 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#F0E8FF,#E0C8FF)', minHeight: '64px', minWidth: '64px' }}>
                      <span style={{ fontSize: '36px' }}>{cat.icone}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-700 leading-tight mb-2">{cat.nom}</p>
                    <span className="text-gray-300 text-sm">🔒</span>
                  </div>
                  <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#8B2500,#C4521A)' }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Orange Money paiement */}
          <div className="rounded-2xl p-5 mb-6 text-white" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9500)' }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">📱</span>
              <div>
                <p className="font-extrabold text-base">Paiement Orange Money</p>
                <p className="text-orange-100 text-sm">Simple et rapide</p>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-3 mb-2">
              <p className="text-sm text-orange-100">Code USSD (appuyez pour copier) :</p>
              <button
                onClick={() => { navigator.clipboard?.writeText('*144*10*76223962#'); }}
                className="text-xl font-extrabold underline decoration-dotted active:opacity-70"
                title="Copier le code USSD"
              >*144*10*76223962#</button>
            </div>
            <p className="text-orange-100 text-sm">Bénéficiaire : <a href="tel:+22676223962" className="font-extrabold text-white underline">+226 76 22 39 62</a></p>
          </div>

          {/* Fonctionnalités */}
          <h2 className="text-xl font-extrabold mb-4" style={{ color: '#8B2500' }}>Pourquoi IFL ?</h2>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: '📊', text: 'Milliers de QCM' },
              { icon: '📱', text: 'Mobile-friendly' },
              { icon: '⚡', text: 'Résultats immédiats' },
              { icon: '🎯', text: 'Tous concours BF' }
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-amber-100">
                <span className="text-2xl">{f.icon}</span>
                <p className="font-semibold text-sm text-gray-700">{f.text}</p>
              </div>
            ))}
          </div>

          {/* CTA inscription */}
          <div className="rounded-2xl p-6 text-center mb-6" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
            <p className="text-white font-extrabold text-xl mb-2">🚀 Commencez aujourd'hui !</p>
            <p className="text-orange-200 text-sm mb-4">Créez votre compte gratuitement</p>
            <div className="flex gap-3">
              <Link href="/register" className="flex-1 py-3.5 text-center font-extrabold rounded-xl text-sm active:scale-95" style={{ background: 'white', color: '#C4521A' }}>
                📝 S'inscrire
              </Link>
              <Link href="/demo" className="flex-1 py-3.5 text-center font-extrabold text-white rounded-xl text-sm border-2 border-white active:scale-95">
                🎯 Démo gratuite
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center py-4 border-t border-amber-100">
            <div className="flex justify-center gap-4 flex-wrap mb-3">
              <a href="https://wa.me/22676223962" target="_blank" rel="noopener noreferrer" className="font-semibold text-sm" style={{ color: '#C4521A' }}>
                💬 WhatsApp: +226 76 22 39 62
              </a>
            </div>
            <div className="flex justify-center gap-4 text-sm text-gray-500 mb-2">
              <Link href="/login" className="hover:underline">Connexion</Link>
              <Link href="/register" className="hover:underline">Inscription</Link>
              <Link href="/help" className="hover:underline">Aide</Link>
              <button onClick={handleShare} className="hover:underline">Partager</button>
            </div>
            <p className="text-gray-400 text-xs">© 2025 IFL – Burkina Faso</p>
          </footer>
        </div>

        {/* Bouton flottant WhatsApp */}
        <a
          href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20je%20voudrais%20des%20informations"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-50 text-2xl"
          style={{ background: '#25D366' }}
          title="WhatsApp"
        >
          💬
        </a>
      </div>
    </>
  )
}
