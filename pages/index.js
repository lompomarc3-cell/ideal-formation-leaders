import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

const APP_URL_LOCAL = 'https://ideal-formation-leaders.pages.dev'

// Catégories statiques de fallback (si Supabase non disponible)
const CATEGORIES_DIRECT_STATIC = [
  { nom: 'Actualité / Culture générale', icone: '🌍' },
  { nom: 'Français', icone: '📚' },
  { nom: 'Littérature et art', icone: '🎨' },
  { nom: 'H-G (Histoire-Géographie)', icone: '🗺️' },
  { nom: 'SVT (Sciences de la Vie)', icone: '🧬' },
  { nom: 'Psychotechniques', icone: '🧠' },
  { nom: 'Mathématiques', icone: '📐' },
  { nom: 'PC (Physique-Chimie)', icone: '⚗️' },
  { nom: 'Droit', icone: '⚖️' },
  { nom: 'Économie', icone: '💹' },
  { nom: 'Entraînement QCM', icone: '✏️' },
  { nom: 'Accompagnement final', icone: '🎯' }
]

const CATEGORIES_PRO_STATIC = [
  { nom: 'Spécialités Vie Scolaire (CASU/AASU)', icone: '🏫' },
  { nom: 'Actualités et Culture Générale', icone: '📰' },
  { nom: 'Spécialités CISU/AISU/ENAREF', icone: '🏛️' },
  { nom: 'Inspectorat : IES', icone: '🔍' },
  { nom: 'Inspectorat : IEPENF', icone: '🔎' },
  { nom: 'CSAPÉ', icone: '🎓' },
  { nom: 'Agrégés', icone: '📜' },
  { nom: 'CAPES toutes options', icone: '📖' },
  { nom: 'Administrateur des Hôpitaux', icone: '🏥' },
  { nom: 'Spécialités Santé', icone: '💊' },
  { nom: 'Justice', icone: '⚖️' },
  { nom: 'Magistrature', icone: '👨‍⚖️' },
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
  const [categoriesDirect, setCategoriesDirect] = useState([])
  const [categoriesPro, setCategoriesPro] = useState([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [activeTab, setActiveTab] = useState('direct')
  const [activeMainTab, setActiveMainTab] = useState('accueil')
  const [activeAboutTab, setActiveAboutTab] = useState('app')
  const scrollDirectRef = useRef(null)
  const scrollProRef = useRef(null)

  useEffect(() => {
    if (!loading && user) {
      if (user.is_admin) router.push('/admin')
      else router.push('/dashboard')
    }
  }, [user, loading, router])

  // Charger les catégories publiques depuis Supabase (sans authentification)
  useEffect(() => {
    if (!loading && !user) {
      loadPublicCategories()
    }
  }, [loading, user])

  const loadPublicCategories = async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/quiz/public-categories?type=direct'),
        fetch('/api/quiz/public-categories?type=professionnel')
      ])
      const d1 = await r1.json()
      const d2 = await r2.json()
      if (d1.categories && d1.categories.length > 0) {
        setCategoriesDirect(d1.categories)
      } else {
        setCategoriesDirect(CATEGORIES_DIRECT_STATIC)
      }
      if (d2.categories && d2.categories.length > 0) {
        setCategoriesPro(d2.categories)
      } else {
        setCategoriesPro(CATEGORIES_PRO_STATIC)
      }
    } catch {
      setCategoriesDirect(CATEGORIES_DIRECT_STATIC)
      setCategoriesPro(CATEGORIES_PRO_STATIC)
    }
    setLoadingCats(false)
  }

  const handleShare = async () => {
    const text = `🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n✅ Des milliers de QCM\n✅ Concours directs – 12 dossiers (5 000 FCFA)\n✅ Concours professionnels – 17 dossiers (20 000 FCFA)\n✅ 5 questions gratuites par dossier sans inscription\n\n👉 ${APP_URL_LOCAL}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'IFL – Formation Burkina Faso', text, url: APP_URL_LOCAL })
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

  const currentCats = activeTab === 'direct' ? categoriesDirect : categoriesPro

  return (
    <>
      <Head>
        <title>IFL – Idéale Formation of Leaders | Concours Burkina Faso</title>
        <meta name="description" content="Préparez vos concours du Burkina Faso avec des milliers de QCM. 5 questions gratuites par dossier sans inscription. Concours directs (12 dossiers) et professionnels (17 dossiers)." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen" style={{ background: '#FFF8F0', paddingBottom: 72 }}>

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
              🆓 5 questions gratuites par dossier – sans inscription
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

        {activeMainTab === 'accueil' && (
        <div className="max-w-lg mx-auto px-4 py-6">

          {/* Offres */}
          <h2 className="text-2xl font-extrabold mb-4" style={{ color: '#8B2500' }}>Nos offres</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-md border-2 border-amber-100 p-5 text-center">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="font-extrabold text-base mb-1" style={{ color: '#8B2500' }}>Concours Directs</h3>
              <p className="text-gray-500 text-xs mb-3">12 dossiers thématiques</p>
              <p className="text-2xl font-extrabold" style={{ color: '#C4521A' }}>5 000</p>
              <p className="text-gray-400 text-xs">FCFA</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md border-2 border-amber-100 p-5 text-center">
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="font-extrabold text-base mb-1" style={{ color: '#8B2500' }}>Professionnels</h3>
              <p className="text-gray-500 text-xs mb-3">17 dossiers spécialisés</p>
              <p className="text-2xl font-extrabold" style={{ color: '#C4521A' }}>20 000</p>
              <p className="text-gray-400 text-xs">FCFA</p>
            </div>
          </div>

          {/* Bannière accès gratuit */}
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '2px solid #D4A017' }}>
            <span className="text-3xl flex-shrink-0">🆓</span>
            <div>
              <p className="font-extrabold text-amber-800 text-sm">5 questions gratuites par dossier</p>
              <p className="text-amber-700 text-xs mt-0.5">Essayez chaque dossier sans créer de compte. Inscrivez-vous pour tout débloquer !</p>
            </div>
          </div>

          {/* Onglets Directs / Professionnels */}
          <div className="flex gap-2 mb-4 bg-gray-100 rounded-2xl p-1.5">
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'direct' ? 'text-white shadow-md' : 'text-gray-500'}`}
              style={activeTab === 'direct' ? { background: '#C4521A' } : {}}
            >
              📚 Concours Directs <span className="text-xs opacity-70">(12)</span>
            </button>
            <button
              onClick={() => setActiveTab('professionnel')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'professionnel' ? 'text-white shadow-md' : 'text-gray-500'}`}
              style={activeTab === 'professionnel' ? { background: '#C4521A' } : {}}
            >
              🎓 Professionnels <span className="text-xs opacity-70">(17)</span>
            </button>
          </div>

          {/* Section dossiers avec liens cliquables */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-extrabold" style={{ color: '#8B2500' }}>
                {activeTab === 'direct' ? '📚 Concours Directs' : '🎓 Professionnels'}
              </h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                {activeTab === 'direct' ? '12 dossiers' : '17 dossiers'}
              </span>
            </div>
            <p className="text-gray-400 text-xs mb-3">← Glissez pour voir tous les dossiers →</p>
            
            {loadingCats ? (
              <div className="flex gap-3 overflow-x-auto pb-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex-shrink-0 bg-white rounded-2xl border-2 border-gray-100 shadow-sm" style={{ width: '160px', minWidth: '160px', height: '140px', opacity: 0.5 }}></div>
                ))}
              </div>
            ) : (
              <div
                ref={activeTab === 'direct' ? scrollDirectRef : scrollProRef}
                className="flex gap-3 overflow-x-auto pb-3"
                style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {currentCats.map((cat, i) => (
                  <PublicCategoryCard key={cat.id || i} cat={cat} index={i} catType={activeTab} />
                ))}
              </div>
            )}
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
                onClick={() => {
                  navigator.clipboard?.writeText('*144*10*76223962#')
                  alert('✅ Code copié : *144*10*76223962#')
                }}
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
        )}

        {/* ====== SECTION À PROPOS ====== */}
        {activeMainTab === 'apropos' && (
          <div className="max-w-lg mx-auto px-4 py-6">
            {/* Sous-onglets À propos */}
            <div className="flex gap-1.5 bg-gray-100 rounded-2xl p-1.5 mb-6">
              {[
                { id: 'app', label: "L'application" },
                { id: 'equipe', label: "Notre équipe" },
                { id: 'dev', label: "Développeur" }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveAboutTab(t.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeAboutTab === t.id ? 'text-white shadow-md' : 'text-gray-500'}`}
                  style={activeAboutTab === t.id ? { background: '#C4521A' } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sous-onglet 1 : À propos de l'application */}
            {activeAboutTab === 'app' && (
              <div className="animate-fadeIn">
                <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6 mb-4">
                  <div className="text-center mb-5">
                    <div className="inline-block logo-rounded mb-4" style={{ width: 80, height: 80 }}>
                      <img src="/logo.png" alt="IFL" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 18 }} />
                    </div>
                    <h2 className="font-extrabold text-xl mb-1" style={{ color: '#8B2500' }}>Idéale Formation of Leaders</h2>
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#FFF0E8', color: '#C4521A' }}>IFL</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    <strong style={{ color: '#8B2500' }}>Idéale Formation of Leaders (IFL)</strong> est une application spécialisée dans la préparation aux concours directs et professionnels au Burkina Faso. Elle propose des milliers de QCM classés par sous-dossiers thématiques, avec un système de progression et des explications détaillées pour chaque question.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: '📚', val: '12', label: 'Dossiers directs' },
                      { icon: '🎓', val: '17', label: 'Dossiers pro' },
                      { icon: '🆓', val: '5', label: 'Questions gratuites' },
                      { icon: '🇧🇫', val: '100%', label: 'Burkina Faso' }
                    ].map((s, i) => (
                      <div key={i} className="rounded-xl p-3 text-center" style={{ background: '#FFF8F0', border: '1px solid #FFE4CC' }}>
                        <p className="text-2xl mb-1">{s.icon}</p>
                        <p className="font-extrabold text-sm" style={{ color: '#C4521A' }}>{s.val}</p>
                        <p className="text-gray-500 text-xs">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5">
                  <h3 className="font-extrabold mb-3" style={{ color: '#8B2500' }}>📋 Nos offres</h3>
                  <div className="space-y-3">
                    <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE4CC)' }}>
                      <span className="text-3xl">📚</span>
                      <div>
                        <p className="font-extrabold text-sm" style={{ color: '#8B2500' }}>Concours Directs</p>
                        <p className="text-gray-500 text-xs">12 dossiers – <strong style={{ color: '#C4521A' }}>5 000 FCFA</strong></p>
                      </div>
                    </div>
                    <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#F5E8FF,#ECD0FF)' }}>
                      <span className="text-3xl">🎓</span>
                      <div>
                        <p className="font-extrabold text-sm" style={{ color: '#8B2500' }}>Concours Professionnels</p>
                        <p className="text-gray-500 text-xs">17 dossiers – <strong style={{ color: '#C4521A' }}>20 000 FCFA</strong></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sous-onglet 2 : Notre équipe */}
            {activeAboutTab === 'equipe' && (
              <div className="animate-fadeIn">
                <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6 mb-4">
                  <div className="text-center mb-4">
                    <span className="text-5xl mb-3 block">👨‍🏫</span>
                    <h2 className="font-extrabold text-xl" style={{ color: '#8B2500' }}>Notre équipe</h2>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    L&apos;équipe d&apos;<strong style={{ color: '#8B2500' }}>Idéale Formation of Leaders</strong> est composée d&apos;enseignants et de professionnels passionnés qui accompagnent chaque année des centaines de candidats burkinabè vers la réussite de leurs concours.
                  </p>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    Notre équipe est également auteure de plusieurs documents, mémoires et livres spécialisés pour les concours directs. Notre mission est de mettre à la disposition des candidats des outils de qualité, accessibles et efficaces.
                  </p>
                  <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '2px solid #D4A017' }}>
                    <p className="font-extrabold text-amber-800 text-sm mb-2">📞 Contactez-nous</p>
                    <a href="tel:+22676223962" className="flex items-center gap-3 mb-2 hover:opacity-80 transition-opacity">
                      <span className="text-xl">📱</span>
                      <span className="font-bold text-sm" style={{ color: '#C4521A' }}>+226 76 22 39 62</span>
                    </a>
                    <a href="https://wa.me/22676223962?text=Bonjour%20IFL" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <span className="text-xl">💬</span>
                      <span className="font-bold text-sm" style={{ color: '#25D366' }}>WhatsApp : +226 76 22 39 62</span>
                    </a>
                  </div>
                </div>
                <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5">
                  <h3 className="font-extrabold mb-3" style={{ color: '#8B2500' }}>🎯 Notre mission</h3>
                  {[
                    { icon: '📊', text: 'Des milliers de QCM mis à jour régulièrement' },
                    { icon: '💡', text: 'Explications détaillées pour chaque question' },
                    { icon: '📱', text: 'Application mobile-friendly, disponible partout' },
                    { icon: '🏆', text: 'Taux de réussite amélioré pour nos candidats' }
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{f.icon}</span>
                      <p className="text-gray-700 text-sm">{f.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sous-onglet 3 : Développeur */}
            {activeAboutTab === 'dev' && (
              <div className="animate-fadeIn">
                <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6 mb-4">
                  <div className="text-center mb-5">
                    <span className="text-6xl mb-3 block">💻</span>
                    <h2 className="font-extrabold text-xl mb-1" style={{ color: '#8B2500' }}>Marc LOMPO</h2>
                    <p className="text-sm font-semibold" style={{ color: '#C4521A' }}>Ingénieur Digital</p>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-5">
                    Passionné par les technologies éducatives, <strong style={{ color: '#8B2500' }}>Marc LOMPO</strong> conçoit des applications sur mesure pour aider les apprenants à atteindre leurs objectifs. Disponible pour tout projet ou partenariat.
                  </p>
                  <div className="space-y-3">
                    <a href="tel:+22672662161" className="flex items-center gap-3 p-4 rounded-2xl hover:opacity-80 transition-opacity active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE4CC)', border: '1px solid #FFD0A0' }}>
                      <span className="text-2xl">📱</span>
                      <div>
                        <p className="font-bold text-sm" style={{ color: '#8B2500' }}>Téléphone</p>
                        <p className="font-extrabold" style={{ color: '#C4521A' }}>+226 72 66 21 61</p>
                      </div>
                    </a>
                    <a href="https://wa.me/22672662161?text=Bonjour%20Marc%2C%20je%20vous%20contacte%20via%20l%27application%20IFL" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-2xl hover:opacity-80 transition-opacity active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#E8FFF0,#C8FFD8)', border: '1px solid #A0FFB8' }}>
                      <span className="text-2xl">💬</span>
                      <div>
                        <p className="font-bold text-sm text-green-800">WhatsApp</p>
                        <p className="font-extrabold text-green-700">+226 72 66 21 61</p>
                      </div>
                    </a>
                  </div>
                </div>
                <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5">
                  <h3 className="font-extrabold mb-3" style={{ color: '#8B2500' }}>🛠️ Services</h3>
                  {[
                    '🌐 Développement d\'applications web',
                    '📱 Applications mobiles',
                    '🎓 Plateformes éducatives',
                    '💼 Solutions numériques sur mesure'
                  ].map((s, i) => (
                    <p key={i} className="text-gray-700 text-sm mb-2">{s}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====== BARRE DE NAVIGATION PRINCIPALE EN BAS ====== */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-amber-100 shadow-lg">
          <div className="max-w-lg mx-auto flex">
            <button
              onClick={() => setActiveMainTab('accueil')}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-all ${activeMainTab === 'accueil' ? 'text-orange-700' : 'text-gray-400'}`}
            >
              <span className="text-xl">🏠</span>
              <span className="text-xs font-semibold">Accueil</span>
            </button>
            <button
              onClick={() => setActiveMainTab('apropos')}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-all ${activeMainTab === 'apropos' ? 'text-orange-700' : 'text-gray-400'}`}
            >
              <span className="text-xl">ℹ️</span>
              <span className="text-xs font-semibold">À propos</span>
            </button>
            <Link href="/login" className="flex-1 flex flex-col items-center py-3 gap-0.5 text-gray-400">
              <span className="text-xl">👤</span>
              <span className="text-xs font-semibold">Connexion</span>
            </Link>
          </div>
        </div>

        {/* Bouton flottant WhatsApp */}
        <a
          href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20je%20voudrais%20des%20informations"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-50 text-2xl"
          style={{ background: '#25D366' }}
          title="WhatsApp"
        >
          💬
        </a>
      </div>
    </>
  )
}

// Carte de catégorie cliquable pour les visiteurs non connectés
function PublicCategoryCard({ cat, index, catType }) {
  const icone = cat.icone || '📋'
  const bgDirect = 'linear-gradient(135deg,#FFF0E8,#FFE0C8)'
  const bgPro = 'linear-gradient(135deg,#F0E8FF,#E0C8FF)'
  const barDirect = 'linear-gradient(90deg,#C4521A,#D4A017)'
  const barPro = 'linear-gradient(90deg,#8B2500,#C4521A)'

  // Si la catégorie a un ID Supabase, on peut accéder aux 5 questions gratuites
  if (cat.id) {
    return (
      <Link
        href={`/quiz/public/${cat.id}`}
        className="flex-shrink-0 bg-white rounded-2xl border-2 border-amber-100 shadow-sm overflow-hidden active:scale-95 transition-all hover:border-amber-400 hover:shadow-md"
        style={{ scrollSnapAlign: 'start', width: '160px', minWidth: '160px' }}
      >
        <div className="p-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 flex-shrink-0"
            style={{ background: catType === 'direct' ? bgDirect : bgPro, minHeight: '64px', minWidth: '64px' }}>
            <span style={{ fontSize: '36px' }}>{icone}</span>
          </div>
          <p className="text-xs font-bold text-gray-700 leading-tight mb-2">{cat.nom}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FFF0E8', color: '#C4521A' }}>
            🆓 5 gratuites
          </span>
        </div>
        <div className="h-1 w-full" style={{ background: catType === 'direct' ? barDirect : barPro }}></div>
      </Link>
    )
  }

  // Catégorie statique (pas d'ID Supabase) → affichage sans lien
  return (
    <div
      className="flex-shrink-0 bg-white rounded-2xl border-2 border-amber-100 shadow-sm overflow-hidden"
      style={{ scrollSnapAlign: 'start', width: '160px', minWidth: '160px' }}
    >
      <div className="p-4 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 flex-shrink-0"
          style={{ background: catType === 'direct' ? bgDirect : bgPro, minHeight: '64px', minWidth: '64px' }}>
          <span style={{ fontSize: '36px' }}>{icone}</span>
        </div>
        <p className="text-xs font-bold text-gray-700 leading-tight mb-2">{cat.nom}</p>
        <span className="text-gray-400 text-xs">🔒 Bientôt</span>
      </div>
      <div className="h-1 w-full" style={{ background: catType === 'direct' ? barDirect : barPro }}></div>
    </div>
  )
}
