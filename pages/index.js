import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

const APP_URL = 'https://ideal-formation-leaders.pages.dev'

// ===== DONNÉES STATIQUES =====
const CATEGORIES_DIRECT_STATIC = [
  { nom: 'Actualité / Culture générale', icone: 'globe' },
  { nom: 'Français', icone: 'book' },
  { nom: 'Littérature et art', icone: 'palette' },
  { nom: 'Histoire-Géographie', icone: 'map' },
  { nom: 'SVT', icone: 'leaf' },
  { nom: 'Psychotechniques', icone: 'brain' },
  { nom: 'Maths', icone: 'calculator' },
  { nom: 'Physique-Chimie', icone: 'flask' },
  { nom: 'Droit', icone: 'scale' },
  { nom: 'Économie', icone: 'chart' },
  { nom: 'Entraînement QCM', icone: 'pencil' },
  { nom: 'Accompagnement final', icone: 'target' }
]

const CATEGORIES_PRO_STATIC = [
  { nom: 'Spécialités Vie scolaire (CASU-AASU)', icone: 'school' },
  { nom: 'Actualités et culture générale', icone: 'newspaper' },
  { nom: 'Spécialités CISU/AISU/ENAREF', icone: 'building' },
  { nom: 'Inspectorat : IES', icone: 'search' },
  { nom: 'Inspectorat : IEPENF', icone: 'search2' },
  { nom: 'CSAPÉ', icone: 'graduation' },
  { nom: 'Agrégés', icone: 'scroll' },
  { nom: 'CAPES toutes options', icone: 'openbook' },
  { nom: 'Administrateur des hôpitaux', icone: 'hospital' },
  { nom: 'Spécialités santé', icone: 'health' },
  { nom: 'Justice', icone: 'justice' },
  { nom: 'Magistrature', icone: 'judge' },
  { nom: 'Spécialités GSP', icone: 'shield' },
  { nom: 'Spécialités police', icone: 'badge' },
  { nom: 'Administrateur civil', icone: 'clipboard' },
  { nom: 'Entraînement QCM', icone: 'pencil' },
  { nom: 'Accompagnement final', icone: 'target' }
]

// ===== ICÔNES IMAGE MODERNES MULTICOLORES =====
// Utilisation de vraies images SVG riches avec dégradés et plusieurs couleurs
function CatIconImage({ src, alt, size = 28 }) {
  return (
    <img
      src={src}
      alt={alt || ''}
      width={size}
      height={size}
      style={{ display: 'block', objectFit: 'contain' }}
      draggable={false}
    />
  )
}

// Mapping clé → chemin image SVG moderne multicolore
const ICON_IMAGES = {
  // Concours directs (12)
  globe:      '/icons/direct_globe.svg',
  book:       '/icons/direct_book.svg',
  palette:    '/icons/direct_palette.svg',
  map:        '/icons/direct_map.svg',
  leaf:       '/icons/direct_leaf.svg',
  brain:      '/icons/direct_brain.svg',
  calculator: '/icons/direct_calculator.svg',
  flask:      '/icons/direct_flask.svg',
  scale:      '/icons/direct_scale.svg',
  chart:      '/icons/direct_chart.svg',
  pencil:     '/icons/direct_pencil.svg',
  target:     '/icons/direct_target.svg',
  // Concours professionnels (17)
  school:     '/icons/pro_school.svg',
  newspaper:  '/icons/pro_newspaper.svg',
  building:   '/icons/pro_building.svg',
  search:     '/icons/pro_search.svg',
  search2:    '/icons/pro_search2.svg',
  graduation: '/icons/pro_graduation.svg',
  scroll:     '/icons/pro_scroll.svg',
  openbook:   '/icons/pro_openbook.svg',
  hospital:   '/icons/pro_hospital.svg',
  health:     '/icons/pro_health.svg',
  justice:    '/icons/pro_justice.svg',
  judge:      '/icons/pro_judge.svg',
  shield:     '/icons/pro_shield.svg',
  badge:      '/icons/pro_badge.svg',
  clipboard:  '/icons/pro_clipboard.svg',
}

function CatIcon({ name, color = 'white', size = 28 }) {
  // Mapping emoji DB → clé image moderne
  const EMOJI_TO_KEY = {
    '🌍': 'globe', '🌎': 'globe', '🌐': 'globe',
    '📚': 'book', '📕': 'book', '📗': 'book', '📘': 'book',
    '🎨': 'palette',
    '🗺️': 'map', '🗺': 'map', '📍': 'map', '📌': 'map',
    '🧬': 'leaf', '🌿': 'leaf', '🌱': 'leaf',
    '🧠': 'brain',
    '📐': 'calculator', '🔢': 'calculator', '🧮': 'calculator',
    '⚗️': 'flask', '⚗': 'flask', '🔬': 'flask',
    '⚖️': 'scale', '⚖': 'scale',
    '💹': 'chart', '📊': 'chart', '📈': 'chart',
    '✏️': 'pencil', '✏': 'pencil', '📝': 'pencil',
    '🎯': 'target',
    '🏫': 'school', '🏠': 'school',
    '📰': 'newspaper',
    '🏛️': 'building', '🏛': 'building',
    '🔍': 'search',
    '🔎': 'search2',
    '🎓': 'graduation',
    '📜': 'scroll',
    '📖': 'openbook',
    '🏥': 'hospital', '💉': 'hospital',
    '💊': 'health', '❤️': 'health', '❤': 'health',
    '👨‍⚖️': 'judge', '👩‍⚖️': 'judge',
    '🛡️': 'shield', '🛡': 'shield',
    '👮': 'badge', '👮‍♂️': 'badge',
    '📋': 'clipboard', '📄': 'clipboard',
  }
  // Résoudre la clé : emoji → image ou clé directe
  const key = EMOJI_TO_KEY[name] || name || 'book'
  const src = ICON_IMAGES[key] || ICON_IMAGES['book']
  return (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CatIconImage src={src} alt={key} size={size} />
    </span>
  )
}

// ===== SKELETON LOADER =====
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden"
      style={{ width: '150px', minWidth: '150px', height: '160px', background: '#f5f5f5', animation: 'pulse 1.5s ease-in-out infinite' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
    </div>
  )
}

// ===== PALETTE COULEURS INDIVIDUELLES PAR ICÔNE =====
// Concours Directs : palette verte/émeraude/teal moderne
const DIRECT_ICON_COLORS = {
  globe:      { bg: 'linear-gradient(135deg,#0891B2,#06B6D4)', border: '#A5F3FC', tag: '#E0F7FF', tagText: '#0891B2' }, // cyan
  book:       { bg: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: '#DDD6FE', tag: '#F3E8FF', tagText: '#7C3AED' }, // violet
  palette:    { bg: 'linear-gradient(135deg,#EC4899,#F472B6)', border: '#FBCFE8', tag: '#FDF2F8', tagText: '#EC4899' }, // rose
  map:        { bg: 'linear-gradient(135deg,#059669,#10B981)', border: '#A7F3D0', tag: '#ECFDF5', tagText: '#059669' }, // vert émeraude
  leaf:       { bg: 'linear-gradient(135deg,#16A34A,#22C55E)', border: '#BBF7D0', tag: '#F0FDF4', tagText: '#16A34A' }, // vert vif
  brain:      { bg: 'linear-gradient(135deg,#DC2626,#EF4444)', border: '#FECACA', tag: '#FEF2F2', tagText: '#DC2626' }, // rouge
  calculator: { bg: 'linear-gradient(135deg,#D97706,#F59E0B)', border: '#FDE68A', tag: '#FFFBEB', tagText: '#D97706' }, // ambre
  flask:      { bg: 'linear-gradient(135deg,#2563EB,#3B82F6)', border: '#BFDBFE', tag: '#EFF6FF', tagText: '#2563EB' }, // bleu
  scale:      { bg: 'linear-gradient(135deg,#B45309,#D97706)', border: '#FDE68A', tag: '#FFFBEB', tagText: '#B45309' }, // brun/or
  chart:      { bg: 'linear-gradient(135deg,#0F766E,#14B8A6)', border: '#99F6E4', tag: '#F0FDFA', tagText: '#0F766E' }, // teal
  pencil:     { bg: 'linear-gradient(135deg,#9333EA,#C084FC)', border: '#E9D5FF', tag: '#FAF5FF', tagText: '#9333EA' }, // pourpre
  target:     { bg: 'linear-gradient(135deg,#C4521A,#D4A017)', border: '#FED7AA', tag: '#FFF7ED', tagText: '#C4521A' }, // orange IFL
}

// Concours Professionnels : palette marine/or/prestige
const PRO_ICON_COLORS = {
  school:     { bg: 'linear-gradient(135deg,#1E40AF,#3B82F6)', border: '#BFDBFE', tag: '#EFF6FF', tagText: '#1E40AF' }, // bleu royal
  newspaper:  { bg: 'linear-gradient(135deg,#047857,#10B981)', border: '#A7F3D0', tag: '#ECFDF5', tagText: '#047857' }, // vert forêt
  building:   { bg: 'linear-gradient(135deg,#1D4ED8,#2563EB)', border: '#BFDBFE', tag: '#EFF6FF', tagText: '#1D4ED8' }, // bleu admin
  search:     { bg: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', border: '#DDD6FE', tag: '#F5F3FF', tagText: '#6D28D9' }, // violet profond
  search2:    { bg: 'linear-gradient(135deg,#7C3AED,#A78BFA)', border: '#EDE9FE', tag: '#F5F3FF', tagText: '#7C3AED' }, // violet moyen
  graduation: { bg: 'linear-gradient(135deg,#B45309,#F59E0B)', border: '#FDE68A', tag: '#FFFBEB', tagText: '#B45309' }, // or diplôme
  scroll:     { bg: 'linear-gradient(135deg,#92400E,#D97706)', border: '#FDE68A', tag: '#FFFBEB', tagText: '#92400E' }, // brun parchemin
  openbook:   { bg: 'linear-gradient(135deg,#0369A1,#0EA5E9)', border: '#BAE6FD', tag: '#F0F9FF', tagText: '#0369A1' }, // bleu ciel
  hospital:   { bg: 'linear-gradient(135deg,#DC2626,#F87171)', border: '#FECACA', tag: '#FEF2F2', tagText: '#DC2626' }, // rouge médical
  health:     { bg: 'linear-gradient(135deg,#BE185D,#EC4899)', border: '#FBCFE8', tag: '#FDF2F8', tagText: '#BE185D' }, // rose santé
  justice:    { bg: 'linear-gradient(135deg,#1E3A5F,#1D5AB4)', border: '#C7D2FE', tag: '#EEF2FF', tagText: '#1E3A5F' }, // bleu justice
  judge:      { bg: 'linear-gradient(135deg,#374151,#6B7280)', border: '#D1D5DB', tag: '#F9FAFB', tagText: '#374151' }, // gris magistrat
  shield:     { bg: 'linear-gradient(135deg,#1F2937,#374151)', border: '#D1D5DB', tag: '#F9FAFB', tagText: '#1F2937' }, // gris GSP
  badge:      { bg: 'linear-gradient(135deg,#1E3A8A,#1D4ED8)', border: '#BFDBFE', tag: '#EFF6FF', tagText: '#1E3A8A' }, // bleu police
  clipboard:  { bg: 'linear-gradient(135deg,#065F46,#059669)', border: '#A7F3D0', tag: '#ECFDF5', tagText: '#065F46' }, // vert admin
  pencil:     { bg: 'linear-gradient(135deg,#9333EA,#C084FC)', border: '#E9D5FF', tag: '#FAF5FF', tagText: '#9333EA' }, // pourpre
  target:     { bg: 'linear-gradient(135deg,#B45309,#D97706)', border: '#FDE68A', tag: '#FFFBEB', tagText: '#B45309' }, // or cible
}

function getIconStyle(iconName, catType) {
  const isPro = catType === 'professionnel'
  const palette = isPro ? PRO_ICON_COLORS : DIRECT_ICON_COLORS
  return palette[iconName] || (isPro
    ? { bg: 'linear-gradient(135deg,#1D5AB4,#2E7DD6)', border: '#A8C4F0', tag: '#EEF3FF', tagText: '#1D5AB4' }
    : { bg: 'linear-gradient(135deg,#059669,#10B981)', border: '#A7F3D0', tag: '#ECFDF5', tagText: '#059669' }
  )
}

// ===== CARTE CATÉGORIE PUBLIQUE =====
function PublicCategoryCard({ cat, index, catType }) {
  const iconName = cat.icone || 'book'
  const isPro = catType === 'professionnel'
  const style = getIconStyle(iconName, catType)

  if (cat.id) {
    return (
      <Link
        href={`/quiz/public/${cat.id}`}
        className="flex-shrink-0 bg-white rounded-2xl overflow-hidden active:scale-95 transition-all hover:shadow-lg"
        style={{ scrollSnapAlign: 'start', width: '150px', minWidth: '150px', border: `2px solid ${style.border}`, boxShadow: `0 2px 8px ${style.border}80` }}
      >
        <div className="p-4 text-center">
          {/* Image moderne multicolore sur fond blanc/transparent */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(255,255,255,0.85)', border: `1.5px solid ${style.border}` }}>
            <CatIcon name={iconName} size={36} />
          </div>
          <p className="text-xs font-bold text-gray-700 leading-tight mb-2 line-clamp-2">{cat.nom}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: style.tag, color: style.tagText }}>
            🆓 5 gratuites
          </span>
        </div>
        <div className="h-1.5 w-full" style={{ background: style.bg }}></div>
      </Link>
    )
  }

  return (
    <div className="flex-shrink-0 bg-white rounded-2xl overflow-hidden"
      style={{ scrollSnapAlign: 'start', width: '150px', minWidth: '150px', border: '2px solid #E5E7EB' }}>
      <div className="p-4 text-center">
        {/* Image moderne multicolore sur fond blanc */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB' }}>
          <CatIcon name={iconName} size={36} />
        </div>
        <p className="text-xs font-bold text-gray-700 leading-tight mb-2 line-clamp-2">{cat.nom}</p>
        <span className="text-gray-400 text-xs">🔒 Bientôt</span>
      </div>
      <div className="h-1.5 w-full" style={{ background: '#E5E7EB' }}></div>
    </div>
  )
}

// ===== PAGE PRINCIPALE =====
export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [shareMsg, setShareMsg] = useState('')
  const [categoriesDirect, setCategoriesDirect] = useState([])
  const [categoriesPro, setCategoriesPro] = useState([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [activeTab, setActiveTab] = useState('accueil')  // 'accueil' | 'concours-direct' | 'concours-professionnel' | 'profil' | 'apropos'
  const [activeConcoursTab, setActiveConcoursTab] = useState('direct')  // 'direct' | 'professionnel' (gardé pour compatibilité)
  const [activeAboutTab, setActiveAboutTab] = useState('app')  // 'app' | 'equipe' | 'aide' | 'dev'
  const [openFaq, setOpenFaq] = useState(null)

  // Lire les paramètres URL pour retour depuis QCM
  useEffect(() => {
    if (!router.isReady) return
    const { tab, catType } = router.query
    if (tab === 'concours') {
      if (catType === 'professionnel') setActiveTab('concours-professionnel')
      else setActiveTab('concours-direct')
    }
  }, [router.isReady, router.query])

  useEffect(() => {
    if (!loading && user) {
      // Tous les utilisateurs (admin inclus) vont vers /dashboard
      // L'admin peut accéder au panel admin via le bouton dans le dashboard
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!loading && !user) loadPublicCategories()
  }, [loading, user])

  const loadPublicCategories = async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/quiz/public-categories?type=direct'),
        fetch('/api/quiz/public-categories?type=professionnel')
      ])
      const d1 = await r1.json()
      const d2 = await r2.json()
      setCategoriesDirect(d1.categories?.length > 0 ? d1.categories : CATEGORIES_DIRECT_STATIC)
      setCategoriesPro(d2.categories?.length > 0 ? d2.categories : CATEGORIES_PRO_STATIC)
    } catch {
      setCategoriesDirect(CATEGORIES_DIRECT_STATIC)
      setCategoriesPro(CATEGORIES_PRO_STATIC)
    }
    setLoadingCats(false)
  }

  const handleShare = async () => {
    const text = `🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n✅ Des milliers de QCM\n✅ Concours directs – 12 dossiers (5 000 FCFA)\n✅ Concours professionnels – 17 dossiers (20 000 FCFA)\n✅ 5 questions gratuites par dossier sans inscription\n\n👉 ${APP_URL}`
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
        <meta name="description" content="Préparez vos concours du Burkina Faso avec des milliers de QCM. 5 questions gratuites par dossier sans inscription. Concours directs (12 dossiers) et professionnels (17 dossiers)." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#8B2500" />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="IFL" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" type="image/png" href="/logo.png" />
      </Head>

      <div className="min-h-screen" style={{ background: '#FFF8F0', paddingBottom: 80 }}>

        {/* ===== HEADER FIXE ===== */}
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
              <button onClick={handleShare} className="p-2 text-orange-200 hover:text-white transition-colors" title="Partager">
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

        {/* ===== ONGLET ACCUEIL ===== */}
        {activeTab === 'accueil' && (
          <div className="animate-fadeIn">
            {/* Hero Banner */}
            <div className="african-pattern" style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A,#D4A017)' }}>
              <div className="max-w-lg mx-auto px-4 py-10 text-center">
                <div className="inline-block logo-hero mb-4" style={{ width: 96, height: 96 }}>
                  <img src="/logo.png" alt="IFL" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 24 }} />
                </div>
                <h1 className="text-white font-extrabold text-2xl mb-2 leading-tight">
                  Réussissez vos concours<br/>du Burkina Faso
                </h1>
                <p className="text-orange-200 text-sm mb-1">Des milliers de QCM pour vous préparer</p>
                <div className="inline-block bg-white bg-opacity-20 text-white text-xs font-bold px-3 py-1 rounded-full mb-5">
                  🆓 5 questions gratuites par dossier – sans inscription
                </div>
              </div>
            </div>

            {/* Contenu Accueil */}
            <div className="max-w-lg mx-auto px-4 py-6">

              {/* === DÉMO GRATUITE - MISE EN AVANT PRINCIPALE === */}
              <div className="rounded-3xl overflow-hidden shadow-xl mb-6 border-2 border-amber-300"
                style={{ background: 'linear-gradient(135deg, #D4A017 0%, #F0B429 50%, #D4A017 100%)' }}>
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-white bg-opacity-30">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <h2 className="text-white font-extrabold text-xl mb-2">Démo gratuite</h2>
                  <p className="text-amber-100 text-sm mb-1">10 questions pour découvrir IFL</p>
                  <p className="text-amber-200 text-xs mb-5">Aucune inscription requise – Commencez maintenant !</p>
                  <Link
                    href="/demo"
                    className="inline-block px-10 py-4 text-base font-extrabold rounded-2xl shadow-lg active:scale-95 transition-all"
                    style={{ background: 'white', color: '#C4521A' }}
                  >
                    🎯 Tester la démo gratuite
                  </Link>
                </div>
              </div>

              {/* Présentation rapide */}
              <p className="text-center font-extrabold text-lg mb-4" style={{ color: '#8B2500' }}>Nos offres</p>

              {/* Cartes offres */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-2xl shadow-md border-2 p-5 text-center"
                  style={{ borderColor: '#FFD0A8', cursor: 'pointer' }}
                  onClick={() => setActiveTab('concours-direct')}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  </div>
                  <div className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: '#FFF0E8', color: '#C4521A' }}>🎯 Entrée initiale</div>
                  <h3 className="font-extrabold text-sm mb-1" style={{ color: '#8B2500' }}>Concours Directs</h3>
                  <p className="text-gray-500 text-xs mb-2">12 dossiers thématiques</p>
                  <p className="text-xl font-extrabold" style={{ color: '#C4521A' }}>5 000</p>
                  <p className="text-gray-400 text-xs">FCFA</p>
                  <p className="text-xs mt-2 font-semibold" style={{ color: '#C4521A' }}>Voir les dossiers →</p>
                </div>
                <div className="bg-white rounded-2xl shadow-md border-2 p-5 text-center"
                  style={{ borderColor: '#FFD0A8', cursor: 'pointer' }}
                  onClick={() => setActiveTab('concours-professionnel')}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'linear-gradient(135deg,#8B2500,#D4A017)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                    </svg>
                  </div>
                  <div className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: '#FFF7E8', color: '#B45309' }}>🏅 Évolution de carrière</div>
                  <h3 className="font-extrabold text-sm mb-1" style={{ color: '#8B2500' }}>Professionnels</h3>
                  <p className="text-gray-500 text-xs mb-2">17 dossiers spécialisés</p>
                  <p className="text-xl font-extrabold" style={{ color: '#C4521A' }}>20 000</p>
                  <p className="text-gray-400 text-xs">FCFA</p>
                  <p className="text-xs mt-2 font-semibold" style={{ color: '#C4521A' }}>Voir les dossiers →</p>
                </div>
              </div>



              {/* Paiement Orange Money */}
              <div className="rounded-2xl p-5 mb-6 text-white" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9500)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-extrabold text-base">Paiement Orange Money</p>
                    <p className="text-orange-100 text-xs">Simple et rapide</p>
                  </div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-xl p-3 mb-2">
                  <p className="text-xs text-orange-100 mb-1">Code USSD (appuyez pour copier) :</p>
                  <button
                    onClick={() => { navigator.clipboard?.writeText('*144*10*76223962#'); alert('✅ Code copié : *144*10*76223962#') }}
                    className="text-lg font-extrabold underline decoration-dotted active:opacity-70"
                  >*144*10*76223962#</button>
                </div>
                <p className="text-orange-100 text-sm">Bénéficiaire : <a href="tel:+22676223962" className="font-extrabold text-white underline">+226 76 22 39 62</a></p>
              </div>

              {/* Pourquoi IFL */}
              <p className="font-extrabold text-lg mb-4" style={{ color: '#8B2500' }}>Pourquoi choisir IFL ?</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>, text: 'Milliers de QCM' },
                  { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, text: 'Mobile-friendly' },
                  { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, text: 'Résultats immédiats' },
                  { svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>, text: 'Tous concours BF' }
                ].map((f, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-amber-100">
                    {f.svg}
                    <p className="font-semibold text-sm text-gray-700">{f.text}</p>
                  </div>
                ))}
              </div>

              {/* CTA Inscription */}
              <div className="rounded-2xl p-6 text-center mb-6" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                <p className="text-white font-extrabold text-lg mb-2">🚀 Commencez aujourd'hui !</p>
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
                <div className="flex justify-center gap-4 flex-wrap mb-2">
                  <a href="https://wa.me/22676223962" target="_blank" rel="noopener noreferrer" className="font-semibold text-sm" style={{ color: '#C4521A' }}>
                    💬 WhatsApp: +226 76 22 39 62
                  </a>
                </div>
                <div className="flex justify-center gap-4 text-sm text-gray-500 mb-2">
                  <Link href="/login" className="hover:underline">Connexion</Link>
                  <Link href="/register" className="hover:underline">Inscription</Link>
                  <button onClick={() => setActiveTab('apropos')} className="hover:underline">Aide</button>
                  <button onClick={handleShare} className="hover:underline">Partager</button>
                </div>
                <p className="text-gray-400 text-xs">© IFL Burkina Faso – Version 3</p>
              </footer>
            </div>
          </div>
        )}

        {/* ===== ONGLET CONCOURS DIRECT ===== */}
        {activeTab === 'concours-direct' && (
          <div className="animate-fadeIn">
            {/* Header orange */}
            <div style={{ background: 'linear-gradient(160deg,#F97316,#FB923C,#FED7AA)' }}>
              <div className="max-w-lg mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-white font-extrabold text-2xl mb-1">Concours Directs</h2>
                    <p className="text-orange-100 text-sm">12 dossiers thématiques</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)' }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  </div>
                </div>
                <div className="mt-4 bg-white bg-opacity-20 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">📚 Entrée initiale dans la Fonction Publique</p>
                    <p className="text-orange-100 text-xs mt-0.5">5 questions gratuites par dossier</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-extrabold text-lg">5 000</p>
                    <p className="text-orange-100 text-xs">FCFA</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-5" style={{ background: '#FFF8F0' }}>
              <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2" style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE4CC)', border: '1px solid #FFD0A8' }}>
                <span className="text-sm">🆓</span>
                <p className="text-xs font-semibold flex-1" style={{ color: '#8B2500' }}>5 questions gratuites par dossier · Glissez pour voir tous les dossiers</p>
                <Link href="/payment?type=direct&montant=5000" className="px-2.5 py-1 text-xs font-bold text-white rounded-lg flex-shrink-0" style={{ background: '#C4521A' }}>5 000 FCFA</Link>
              </div>

              {loadingCats ? (
                <div className="flex gap-3 overflow-x-hidden pb-3">
                  {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-4"
                  style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {categoriesDirect.map((cat, i) => (
                    <PublicCategoryCard key={cat.id || i} cat={cat} index={i} catType="direct" />
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-2xl p-4 flex items-center justify-between border-2 bg-white" style={{ borderColor: '#C4521A' }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#8B2500' }}>Accès complet</p>
                  <p className="text-gray-500 text-xs">Débloquer tous les 12 dossiers</p>
                </div>
                <Link href="/payment?type=direct&montant=5000"
                  className="px-5 py-2.5 font-extrabold text-white rounded-xl text-sm active:scale-95 shadow-md"
                  style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                  5 000 FCFA →
                </Link>
              </div>

              {/* CTA vers pro */}
              <div className="mt-4 rounded-2xl p-4 text-center mb-2" style={{ background: 'linear-gradient(135deg,#1D4ED8,#2563EB)' }}>
                <p className="text-white font-bold text-sm mb-1">🎓 Vous visez un concours professionnel ?</p>
                <button onClick={() => setActiveTab('concours-professionnel')} className="mt-2 inline-block px-5 py-2 bg-white font-bold rounded-xl text-xs" style={{ color: '#1D4ED8' }}>
                  Voir les concours professionnels →
                </button>
              </div>

              <Link href="/register" className="block mt-3 text-center py-3 font-bold rounded-xl text-sm border-2 border-orange-300 mb-4"
                style={{ color: '#C4521A', background: '#FFF8F0' }}>
                📝 Créer un compte gratuit
              </Link>

              <div className="mb-4 rounded-2xl p-3 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '1.5px solid #D4A017' }}>
                <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="flex-1"><p className="font-bold text-amber-800 text-sm">Démo gratuite – 10 questions</p></div>
                <Link href="/demo" className="px-4 py-2 font-bold text-white rounded-xl text-xs active:scale-95" style={{ background: '#FFB300' }}>Essayer</Link>
              </div>
            </div>
          </div>
        )}

        {/* ===== ONGLET CONCOURS PROFESSIONNEL ===== */}
        {activeTab === 'concours-professionnel' && (
          <div className="animate-fadeIn">
            {/* Header bleu */}
            <div style={{ background: 'linear-gradient(160deg,#1E3A8A,#1D4ED8,#3B82F6)' }}>
              <div className="max-w-lg mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-white font-extrabold text-2xl mb-1">Concours Professionnels</h2>
                    <p className="text-blue-200 text-sm">17 dossiers spécialisés</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                    </svg>
                  </div>
                </div>
                <div className="mt-4 bg-white bg-opacity-15 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">🎓 Évolution de carrière</p>
                    <p className="text-blue-200 text-xs mt-0.5">5 questions gratuites par dossier</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-extrabold text-lg">20 000</p>
                    <p className="text-blue-200 text-xs">FCFA</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-5" style={{ background: '#EFF6FF' }}>
              <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2" style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', border: '1px solid #BFDBFE' }}>
                <span className="text-sm">🆓</span>
                <p className="text-xs font-semibold flex-1" style={{ color: '#1D4ED8' }}>5 questions gratuites · 14 dossiers pro + 3 bonus inclus</p>
                <Link href="/select-specialty" className="px-2.5 py-1 text-xs font-bold text-white rounded-lg flex-shrink-0" style={{ background: '#1D4ED8' }}>20 000 FCFA</Link>
              </div>
              <div className="rounded-xl px-3 py-1.5 mb-3 flex flex-wrap gap-1">
                {['📰 Actualités', '📝 Entraînement QCM', '🎯 Accompagnement final'].map((item, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>{item}</span>
                ))}
              </div>

              {loadingCats ? (
                <div className="flex gap-3 overflow-x-hidden pb-3">
                  {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-4"
                  style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {categoriesPro.map((cat, i) => (
                    <PublicCategoryCard key={cat.id || i} cat={cat} index={i} catType="professionnel" />
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-2xl p-4 flex items-center justify-between border-2 bg-white" style={{ borderColor: '#1D4ED8' }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#1D4ED8' }}>Choisir votre spécialité</p>
                  <p className="text-gray-500 text-xs">14 dossiers spécialisés disponibles</p>
                </div>
                <Link href="/select-specialty"
                  className="px-5 py-2.5 font-extrabold text-white rounded-xl text-sm active:scale-95 shadow-md"
                  style={{ background: 'linear-gradient(135deg,#1D4ED8,#2563EB)' }}>
                  20 000 FCFA →
                </Link>
              </div>



              <Link href="/register" className="block mt-3 text-center py-3 font-bold rounded-xl text-sm border-2 mb-4"
                style={{ color: '#1D4ED8', background: '#EFF6FF', borderColor: '#BFDBFE' }}>
                📝 Créer un compte gratuit
              </Link>

              <div className="mb-4 rounded-2xl p-3 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '1.5px solid #D4A017' }}>
                <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="flex-1"><p className="font-bold text-amber-800 text-sm">Démo gratuite – 10 questions</p></div>
                <Link href="/demo" className="px-4 py-2 font-bold text-white rounded-xl text-xs active:scale-95" style={{ background: '#2563EB' }}>Essayer</Link>
              </div>
            </div>
          </div>
        )}

        {/* ===== ONGLET PROFIL ===== */}
        {activeTab === 'profil' && (
          <div className="animate-fadeIn">
            {/* Header Profil */}
            <div className="african-pattern" style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)' }}>
              <div className="max-w-lg mx-auto px-4 py-8 text-center">
                {/* Logo IFL officiel */}
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div style={{
                    width: 96, height: 96, borderRadius: 24,
                    background: 'rgba(255,255,255,0.15)',
                    border: '3px solid rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 2px 4px rgba(255,255,255,0.2)',
                    overflow: 'hidden'
                  }}>
                    <img src="/logo.png" alt="IFL" style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 18 }} />
                  </div>
                  {/* Anneau animé */}
                  <div style={{
                    position: 'absolute', inset: -4, borderRadius: 28,
                    border: '2px dashed rgba(212,160,23,0.6)',
                    animation: 'spin 8s linear infinite'
                  }}/>
                </div>
                <h2 className="text-white font-extrabold text-2xl mb-1">Mon Profil</h2>
                <p className="text-orange-200 text-sm">Gérez votre compte et votre progression</p>
              </div>
            </div>

            {/* Contenu Profil - Non connecté */}
            <div className="max-w-lg mx-auto px-4 py-6">
              <div className="rounded-3xl overflow-hidden shadow-xl mb-6 border-2 border-orange-200 bg-white p-8 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' }}>
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h3 className="font-extrabold text-xl text-gray-800 mb-2">Vous n'êtes pas connecté</h3>
                <p className="text-gray-500 text-sm mb-6">Connectez-vous pour accéder à votre profil, suivre votre progression et gérer votre abonnement.</p>
                <Link href="/login"
                  className="block w-full py-3.5 rounded-2xl text-white font-bold text-base shadow-md mb-3"
                  style={{ background: 'linear-gradient(135deg,#C4521A,#D4A017)' }}>
                  Se connecter
                </Link>
                <Link href="/register"
                  className="block w-full py-3.5 rounded-2xl font-bold text-base border-2"
                  style={{ borderColor: '#C4521A', color: '#C4521A' }}>
                  Créer un compte
                </Link>
              </div>

              {/* Aperçu des fonctionnalités du profil */}
              <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 mb-4">
                <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Ce que vous pouvez faire avec un compte :</h4>
                {[
                  { icon: '📊', text: 'Suivre votre progression par dossier' },
                  { icon: '🎓', text: 'Accéder à tous les QCM selon votre abonnement' },
                  { icon: '📱', text: 'Partager l\'application avec vos amis' },
                  { icon: '⭐', text: 'Évaluer l\'application sur le Play Store' },
                  { icon: '🔔', text: 'Recevoir les nouvelles questions' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm text-gray-600">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Bouton Partager */}
              <button
                onClick={handleShare}
                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-md"
                style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Partager l'application
              </button>
            </div>
          </div>
        )}

        {/* ===== ONGLET À PROPOS ===== */}
        {activeTab === 'apropos' && (
          <div className="animate-fadeIn">
            {/* Sous-header À propos */}
            <div className="african-pattern" style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)' }}>
              <div className="max-w-lg mx-auto px-4 py-8 text-center">
                {/* Logo IFL officiel */}
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div style={{
                    width: 80, height: 80, borderRadius: 20,
                    background: 'rgba(255,255,255,0.15)',
                    border: '2.5px solid rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2), inset 0 1px 3px rgba(255,255,255,0.25)',
                    overflow: 'hidden'
                  }}>
                    <img src="/logo.png" alt="IFL" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 16 }} />
                  </div>
                  <div style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#D4A017', boxShadow: '0 2px 6px rgba(212,160,23,0.5)' }}/>
                  <div style={{ position: 'absolute', bottom: -2, left: -2, width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }}/>
                </div>
                <h2 className="text-white font-extrabold text-2xl mb-1">À propos</h2>
                <p className="text-orange-200 text-sm">Découvrez IFL, notre équipe et notre développeur</p>
              </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-5">
              {/* Sous-onglets */}
              <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 mb-6 shadow-inner overflow-x-auto">
                {[
                  { id: 'app', label: "L'appli" },
                  { id: 'equipe', label: "Équipe" },
                  { id: 'aide', label: "Assistance" },
                  { id: 'dev', label: "Développeur" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveAboutTab(t.id)}
                    className={`flex-shrink-0 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeAboutTab === t.id ? 'text-white shadow-md' : 'text-gray-500'}`}
                    style={activeAboutTab === t.id ? { background: 'linear-gradient(135deg,#C4521A,#D4A017)' } : {}}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Bloc 1 : L'application */}
              {activeAboutTab === 'app' && (
                <div className="animate-fadeIn">
                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6 mb-4">
                    <div className="text-center mb-5">
                      <div className="inline-block logo-rounded mb-4" style={{ width: 80, height: 80 }}>
                        <img src="/logo.png" alt="IFL" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 20 }} />
                      </div>
                      <h2 className="font-extrabold text-xl mb-1" style={{ color: '#8B2500' }}>Idéale Formation of Leaders</h2>
                      <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#FFF0E8', color: '#C4521A' }}>IFL</span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-5">
                      <strong style={{ color: '#8B2500' }}>Idéale Formation of Leaders (IFL)</strong> est une application spécialisée dans la préparation aux concours directs et professionnels au Burkina Faso. Elle propose des milliers de QCM classés par sous-dossiers thématiques, avec un système de progression et des explications détaillées pour chaque question.
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, val: '12', label: 'Dossiers directs' },
                        { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>, val: '17', label: 'Dossiers pro' },
                        { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>, val: '5', label: 'Questions gratuites' },
                        { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>, val: '100%', label: 'Burkina Faso' }
                      ].map((s, i) => (
                        <div key={i} className="rounded-xl p-3 text-center" style={{ background: '#FFF8F0', border: '1px solid #FFE4CC' }}>
                          <div className="flex justify-center mb-1">{s.icon}</div>
                          <p className="font-extrabold text-sm" style={{ color: '#C4521A' }}>{s.val}</p>
                          <p className="text-gray-500 text-xs">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5">
                    <h3 className="font-extrabold mb-3 flex items-center gap-2" style={{ color: '#8B2500' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      Nos offres
                    </h3>
                    <div className="space-y-3">
                      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE4CC)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#C4521A' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                        </div>
                        <div>
                          <p className="font-extrabold text-sm" style={{ color: '#8B2500' }}>Concours Directs</p>
                          <p className="text-gray-500 text-xs">12 dossiers – <strong style={{ color: '#C4521A' }}>5 000 FCFA</strong></p>
                        </div>
                      </div>
                      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#FFF8E0,#FFE8A0)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#D4A017' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                        </div>
                        <div>
                          <p className="font-extrabold text-sm" style={{ color: '#8B2500' }}>Concours Professionnels</p>
                          <p className="text-gray-500 text-xs">17 dossiers – <strong style={{ color: '#C4521A' }}>20 000 FCFA</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bloc 2 : Notre équipe */}
              {activeAboutTab === 'equipe' && (
                <div className="animate-fadeIn">
                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6 mb-4">
                    <div className="text-center mb-5">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' }}>
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </div>
                      <h2 className="font-extrabold text-xl" style={{ color: '#8B2500' }}>Notre équipe</h2>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">
                      L&apos;équipe d&apos;<strong style={{ color: '#8B2500' }}>Idéale Formation of Leaders</strong> est composée d&apos;enseignants et de professionnels passionnés qui accompagnent chaque année des centaines de candidats burkinabè vers la réussite de leurs concours.
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed mb-5">
                      Notre équipe est également auteure de plusieurs documents, mémoires et livres spécialisés pour les concours directs. Notre mission est de mettre à la disposition des candidats des outils de qualité, accessibles et efficaces.
                    </p>
                    <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '2px solid #D4A017' }}>
                      <p className="font-extrabold text-amber-800 text-sm mb-3 flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12 19.79 19.79 0 0 1 1.98 3.42 2 2 0 0 1 3.96 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        Contactez-nous
                      </p>
                      <a href="tel:+22676223962" className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity active:scale-95">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#C4521A' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3"/></svg>
                        </div>
                        <span className="font-bold text-sm" style={{ color: '#C4521A' }}>+226 76 22 39 62</span>
                      </a>
                      <a href="https://wa.me/22676223962?text=Bonjour%20IFL" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity active:scale-95">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#25D366' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        </div>
                        <span className="font-bold text-sm" style={{ color: '#25D366' }}>WhatsApp : +226 76 22 39 62</span>
                      </a>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5">
                    <h3 className="font-extrabold mb-4 flex items-center gap-2" style={{ color: '#8B2500' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                      Notre mission
                    </h3>
                    {[
                      { svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>, text: 'Des milliers de QCM mis à jour régulièrement' },
                      { svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8V8.01M12 11V16"/></svg>, text: 'Explications détaillées pour chaque question' },
                      { svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3"/></svg>, text: 'Application mobile-friendly, disponible partout' },
                      { svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>, text: 'Taux de réussite amélioré pour nos candidats' }
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-3 mb-3 p-3 rounded-xl" style={{ background: '#FFF8F0' }}>
                        {f.svg}
                        <p className="text-gray-700 text-sm">{f.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== BLOC ASSISTANCE ===== */}
              {activeAboutTab === 'aide' && (
                <div className="animate-fadeIn">
                  {/* Contact rapide */}
                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5 mb-4">
                    <h3 className="font-extrabold mb-4 text-sm" style={{ color: '#8B2500' }}>📞 Contactez-nous</h3>
                    <div className="space-y-3">
                      <a href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20j'ai%20besoin%20d'aide"
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-4 bg-amber-50 rounded-2xl p-4 border border-amber-100 active:scale-95 transition-all">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#E8F5E9' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">WhatsApp Assistance</p>
                          <p className="text-gray-500 text-sm">+226 76 22 39 62</p>
                        </div>
                        <svg width="20" height="20" fill="none" stroke="#C4521A" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </a>
                      <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9500)' }}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">📱</span>
                          <div>
                            <p className="font-extrabold">Paiement Orange Money</p>
                            <p className="text-orange-100 text-xs">Pour votre abonnement</p>
                          </div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-xl p-3 mb-2">
                          <p className="text-orange-100 text-xs">Code USSD (appuyez pour copier) :</p>
                          <button onClick={() => { if(typeof navigator !== 'undefined') navigator.clipboard?.writeText('*144*10*76223962#'); }} className="text-xl font-extrabold tracking-wider underline decoration-dotted active:opacity-70">*144*10*76223962#</button>
                        </div>
                        <p className="text-orange-100 text-sm">Bénéficiaire : <a href="tel:+22676223962" className="font-extrabold text-white underline">+226 76 22 39 62</a></p>
                        <div className="flex gap-3 mt-3">
                          <div className="flex-1 bg-white bg-opacity-15 rounded-xl p-2 text-center">
                            <p className="text-xs text-orange-100">Directs</p>
                            <p className="font-extrabold">5 000 FCFA</p>
                          </div>
                          <div className="flex-1 bg-white bg-opacity-15 rounded-xl p-2 text-center">
                            <p className="text-xs text-orange-100">Professionnels</p>
                            <p className="font-extrabold">20 000 FCFA</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1. Bouton Noter sur Play Store */}
                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5 mb-4">
                    <h3 className="font-extrabold mb-3 text-sm flex items-center gap-2" style={{ color: '#8B2500' }}>
                      <span className="text-lg">⭐</span> Évaluez l&apos;application
                    </h3>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.ifl.app"
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-4 rounded-2xl p-4 active:scale-95 transition-all"
                      style={{ background: 'linear-gradient(135deg,#1B7E3E,#34A853)', border: '1.5px solid #A7F3D0' }}>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M3 0L15 12 3 24V0zM3 0l18 7.5L15 12M3 24l18-7.5L15 12"/></svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-extrabold text-white text-sm">Noter sur Google Play Store</p>
                        <p className="text-green-100 text-xs mt-0.5">Votre avis nous aide à améliorer IFL</p>
                        <div className="flex gap-0.5 mt-1">
                          {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#FFD700', fontSize: 14 }}>★</span>)}
                        </div>
                      </div>
                      <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </a>
                  </div>

                  {/* 2. Politique de confidentialité & règles communautaires */}
                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5 mb-4">
                    <h3 className="font-extrabold mb-3 text-sm flex items-center gap-2" style={{ color: '#8B2500' }}>
                      <span className="text-lg">📋</span> Politique & règles communautaires
                    </h3>
                    <div className="space-y-2">
                      {/* Politique de confidentialité */}
                      <details className="rounded-2xl border border-amber-100 overflow-hidden" style={{ background: '#FFFBF5' }}>
                        <summary className="px-4 py-3.5 font-bold text-gray-800 text-sm cursor-pointer flex items-center justify-between list-none">
                          <span className="flex items-center gap-2">
                            <span>🔒</span> Politique de confidentialité
                          </span>
                          <span style={{ color: '#C4521A', fontSize: 18, fontWeight: 700 }}>+</span>
                        </summary>
                        <div className="px-4 pb-4 pt-2">
                          <div className="h-px bg-amber-100 mb-3"></div>
                          <div className="text-gray-600 text-xs leading-relaxed space-y-2">
                            <p><strong className="text-gray-800">1. Données collectées</strong><br/>IFL collecte uniquement les informations nécessaires à la création et à la gestion de votre compte : numéro de téléphone, nom, prénom et données de progression dans les dossiers.</p>
                            <p><strong className="text-gray-800">2. Utilisation des données</strong><br/>Vos données sont utilisées exclusivement pour gérer votre abonnement, sauvegarder votre progression et améliorer nos services. Elles ne sont jamais vendues ni partagées avec des tiers.</p>
                            <p><strong className="text-gray-800">3. Sécurité</strong><br/>Vos informations sont stockées de manière sécurisée. Votre mot de passe est chiffré et inaccessible à notre équipe.</p>
                            <p><strong className="text-gray-800">4. Suppression du compte</strong><br/>Vous pouvez demander la suppression de votre compte à tout moment en contactant notre équipe via WhatsApp au +226 76 22 39 62.</p>
                            <p><strong className="text-gray-800">5. Contact</strong><br/>Pour toute question relative à vos données personnelles, contactez-nous au +226 76 22 39 62.</p>
                          </div>
                        </div>
                      </details>

                      {/* Règles communautaires */}
                      <details className="rounded-2xl border border-amber-100 overflow-hidden" style={{ background: '#FFFBF5' }}>
                        <summary className="px-4 py-3.5 font-bold text-gray-800 text-sm cursor-pointer flex items-center justify-between list-none">
                          <span className="flex items-center gap-2">
                            <span>🤝</span> Règles communautaires
                          </span>
                          <span style={{ color: '#C4521A', fontSize: 18, fontWeight: 700 }}>+</span>
                        </summary>
                        <div className="px-4 pb-4 pt-2">
                          <div className="h-px bg-amber-100 mb-3"></div>
                          <div className="text-gray-600 text-xs leading-relaxed space-y-2">
                            <p><strong className="text-gray-800">1. Respect et bienveillance</strong><br/>Traitez chaque membre de la communauté IFL avec respect. Toute forme de discrimination, d'insulte ou de harcèlement est strictement interdite.</p>
                            <p><strong className="text-gray-800">2. Pas de partage de contenu payant</strong><br/>Il est interdit de partager, copier ou diffuser les questions, dossiers ou contenus payants de la plateforme. Cela nuit aux instructeurs et à la communauté.</p>
                            <p><strong className="text-gray-800">3. Honnêteté dans la progression</strong><br/>Utilisez la plateforme pour apprendre sincèrement. Ne cherchez pas à contourner les systèmes de vérification.</p>
                            <p><strong className="text-gray-800">4. Signalement des abus</strong><br/>Si vous constatez un contenu ou un comportement inapproprié, signalez-le à notre équipe via WhatsApp.</p>
                            <p><strong className="text-gray-800">5. Utilisation légale</strong><br/>Vous vous engagez à utiliser IFL uniquement à des fins personnelles et légales de préparation aux concours.</p>
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>

                  {/* 3. Bouton Partager */}
                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5 mb-4">
                    <h3 className="font-extrabold mb-3 text-sm flex items-center gap-2" style={{ color: '#8B2500' }}>
                      <span className="text-lg">📤</span> Partager l&apos;application
                    </h3>
                    <p className="text-gray-500 text-xs mb-4">Partagez IFL avec vos amis et collègues qui préparent un concours.</p>
                    <button
                      onClick={handleShare}
                      className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                      style={{ background: 'linear-gradient(135deg,#C4521A,#D4A017)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                      Partager avec un ami
                    </button>
                    {shareMsg && <p className="text-center text-green-600 text-xs mt-2 font-semibold">{shareMsg}</p>}
                    <div className="mt-3 rounded-xl p-3 flex items-center gap-2" style={{ background: '#F5F5F5' }}>
                      <span className="text-xs text-gray-500 flex-1 truncate font-mono">{APP_URL}</span>
                      <button
                        onClick={() => { if(typeof navigator !== 'undefined') { navigator.clipboard?.writeText(APP_URL); } }}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
                        style={{ background: '#C4521A', color: 'white' }}>
                        Copier
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Bloc 3 : Le développeur */}
              {activeAboutTab === 'dev' && (
                <div className="animate-fadeIn">
                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6 mb-4">
                    <div className="text-center mb-5">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' }}>
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                        </svg>
                      </div>
                      <h2 className="font-extrabold text-xl mb-1" style={{ color: '#8B2500' }}>Marc LOMPO</h2>
                      <p className="text-sm font-semibold px-3 py-1 rounded-full inline-block" style={{ color: '#C4521A', background: '#FFF0E8' }}>Ingénieur Digital</p>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-5">
                      Passionné par les technologies éducatives, <strong style={{ color: '#8B2500' }}>Marc LOMPO</strong> conçoit des applications sur mesure pour aider les apprenants à atteindre leurs objectifs. Disponible pour tout projet ou partenariat.
                    </p>
                    <div className="space-y-3">
                      <a href="tel:+22672662161" className="flex items-center gap-4 p-4 rounded-2xl hover:opacity-80 transition-opacity active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE4CC)', border: '1.5px solid #FFD0A0' }}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#C4521A' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12 19.79 19.79 0 0 1 1.98 3.42 2 2 0 0 1 3.96 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: '#8B2500' }}>Téléphone</p>
                          <p className="font-extrabold text-base" style={{ color: '#C4521A' }}>+226 72 66 21 61</p>
                        </div>
                      </a>
                      <a href="https://wa.me/22672662161?text=Bonjour%20Marc%2C%20je%20vous%20contacte%20via%20l%27application%20IFL"
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-2xl hover:opacity-80 transition-opacity active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#E8FFF0,#C8FFD8)', border: '1.5px solid #A0FFB8' }}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#25D366' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-green-800">WhatsApp</p>
                          <p className="font-extrabold text-base text-green-700">+226 72 66 21 61</p>
                        </div>
                      </a>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5">
                    <h3 className="font-extrabold mb-4 flex items-center gap-2" style={{ color: '#8B2500' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2.5" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                      Services proposés
                    </h3>
                    {[
                      { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, text: 'Développement d\'applications web' },
                      { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/></svg>, text: 'Applications mobiles' },
                      { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>, text: 'Plateformes éducatives' },
                      { svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, text: 'Solutions numériques sur mesure' }
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-3 mb-3 p-3 rounded-xl" style={{ background: '#FFF8F0' }}>
                        {s.svg}
                        <p className="text-gray-700 text-sm">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== BARRE DE NAVIGATION PRINCIPALE EN BAS ===== */}
        <div className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderTop: '1.5px solid #FFE4CC', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
          <div className="max-w-lg mx-auto flex">

            {/* Onglet Accueil */}
            <button
              onClick={() => setActiveTab('accueil')}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-all relative"
            >
              {activeTab === 'accueil' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }} />
              )}
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all"
                style={{ background: activeTab === 'accueil' ? 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' : 'rgba(196,82,26,0.07)' }}>
                <img src="/icons/nav_home.svg" alt="Accueil" width="22" height="22" style={{ objectFit: 'contain', filter: activeTab === 'accueil' ? 'none' : 'grayscale(20%) opacity(0.75)' }} />
              </div>
              <span className="text-xs font-bold" style={{ color: activeTab === 'accueil' ? '#C4521A' : '#7C6A5A', fontSize: '10px' }}>Accueil</span>
            </button>

            {/* Onglet Concours Direct */}
            <button
              onClick={() => setActiveTab('concours-direct')}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-all relative"
            >
              {activeTab === 'concours-direct' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg,#F97316,#FB923C)' }} />
              )}
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all"
                style={{ background: activeTab === 'concours-direct' ? 'linear-gradient(135deg,#FFF7ED,#FFEDD5)' : 'rgba(249,115,22,0.08)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'concours-direct' ? '#F97316' : '#EA7C45'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="font-bold" style={{ color: activeTab === 'concours-direct' ? '#F97316' : '#EA7C45', fontSize: '10px' }}>C. Direct</span>
            </button>

            {/* Onglet Concours Professionnel */}
            <button
              onClick={() => setActiveTab('concours-professionnel')}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-all relative"
            >
              {activeTab === 'concours-professionnel' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg,#1D4ED8,#3B82F6)' }} />
              )}
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all"
                style={{ background: activeTab === 'concours-professionnel' ? 'linear-gradient(135deg,#EFF6FF,#DBEAFE)' : 'rgba(29,78,216,0.08)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'concours-professionnel' ? '#1D4ED8' : '#3B67CC'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
              <span className="font-bold" style={{ color: activeTab === 'concours-professionnel' ? '#1D4ED8' : '#3B67CC', fontSize: '10px' }}>C. Pro</span>
            </button>

            {/* Onglet Mon Profil */}
            <button
              onClick={() => setActiveTab('profil')}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-all relative"
            >
              {activeTab === 'profil' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }} />
              )}
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all"
                style={{ background: activeTab === 'profil' ? 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' : 'rgba(196,82,26,0.07)' }}>
                <img src="/icons/nav_profil.svg" alt="Profil" width="22" height="22" style={{ objectFit: 'contain', filter: activeTab === 'profil' ? 'none' : 'grayscale(20%) opacity(0.75)' }} />
              </div>
              <span className="font-bold" style={{ color: activeTab === 'profil' ? '#C4521A' : '#7C6A5A', fontSize: '10px' }}>Profil</span>
            </button>

            {/* Onglet À propos */}
            <button
              onClick={() => setActiveTab('apropos')}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-all relative"
            >
              {activeTab === 'apropos' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }} />
              )}
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all"
                style={{ background: activeTab === 'apropos' ? 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' : 'rgba(196,82,26,0.07)' }}>
                <img src="/icons/nav_apropos.svg" alt="À propos" width="22" height="22" style={{ objectFit: 'contain', filter: activeTab === 'apropos' ? 'none' : 'grayscale(20%) opacity(0.75)' }} />
              </div>
              <span className="font-bold" style={{ color: activeTab === 'apropos' ? '#C4521A' : '#7C6A5A', fontSize: '10px' }}>À propos</span>
            </button>

          </div>
        </div>

      </div>
    </>
  )
}
