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

// ===== ICÔNES SVG VECTORIELLES =====
const SVG_ICONS = {
  // Onglets navigation
  home: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V16H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/>
    </svg>
  ),
  competition: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L9 9H2L7.5 13.5L5.5 21L12 17L18.5 21L16.5 13.5L22 9H15L12 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/>
    </svg>
  ),
  info: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor"/>
      <path d="M12 8V8.01M12 11V16" strokeWidth="2" strokeLinecap="round" stroke="currentColor"/>
    </svg>
  ),
  // Icônes dossiers
  globe: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  book: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  palette: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  ),
  map: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  leaf: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 19.44a.81.81 0 0 0-.17.78 1 1 0 0 0 .65.58c.17.06.34.07.5.03C5.82 20.35 8.31 19.85 10 19c1.63-.8 3.59-2.17 5-5 .96-1.9 2-5 2-5l-4 3c2.28-4.58 4-9 4-12-3.18.99-5.7 2.5-7 5z"/>
    </svg>
  ),
  brain: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.74z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.74z"/>
    </svg>
  ),
  calculator: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/>
    </svg>
  ),
  flask: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H15M9 3V13L4 20H20L15 13V3M9 3H15"/><path d="M7 18H17"/>
    </svg>
  ),
  scale: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="3" x2="12" y2="21"/><path d="M5 21h14M17 8l4 6-4 0M7 8 3 14l4 0M3 14h4M17 14h4M7 8h10"/>
    </svg>
  ),
  chart: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  pencil: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  target: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  school: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22h20M6 22V10l6-6 6 6v12"/><path d="M12 6v6m-4 4h8M9 22v-4h6v4"/>
    </svg>
  ),
  newspaper: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
    </svg>
  ),
  building: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9m6 12V9"/>
    </svg>
  ),
  search: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  search2: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M8 11h6M11 8v6"/>
    </svg>
  ),
  graduation: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
    </svg>
  ),
  scroll: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h12a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4z"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M15 17H4a2 2 0 0 1 0-4h11"/>
    </svg>
  ),
  openbook: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  hospital: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10M12 7v6m-3-3h6"/>
    </svg>
  ),
  health: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><path d="M12 8v8m-4-4h8"/>
    </svg>
  ),
  justice: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="3" x2="12" y2="21"/><path d="M4 9l8 2 8-2M6 15l6 2 6-2"/>
    </svg>
  ),
  judge: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      <path d="M8 20h8"/>
    </svg>
  ),
  shield: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  badge: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  clipboard: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
}

function CatIcon({ name, color = '#C4521A' }) {
  const icon = SVG_ICONS[name] || SVG_ICONS['book']
  return (
    <span style={{ color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
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

// ===== CARTE CATÉGORIE PUBLIQUE =====
function PublicCategoryCard({ cat, index, catType }) {
  const iconName = cat.icone || 'book'
  const bgDirect = 'linear-gradient(135deg,#FFF0E8,#FFE0C8)'
  const bgPro = 'linear-gradient(135deg,#FFF8E0,#FFE8A0)'

  if (cat.id) {
    return (
      <Link
        href={`/quiz/public/${cat.id}`}
        className="flex-shrink-0 bg-white rounded-2xl border-2 border-amber-100 shadow-sm overflow-hidden active:scale-95 transition-all hover:border-orange-300 hover:shadow-md"
        style={{ scrollSnapAlign: 'start', width: '150px', minWidth: '150px' }}
      >
        <div className="p-4 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: catType === 'direct' ? bgDirect : bgPro }}>
            <CatIcon name={iconName} color="#C4521A" />
          </div>
          <p className="text-xs font-bold text-gray-700 leading-tight mb-2 line-clamp-2">{cat.nom}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FFF0E8', color: '#C4521A' }}>
            🆓 5 gratuites
          </span>
        </div>
        <div className="h-1.5 w-full" style={{ background: catType === 'direct' ? 'linear-gradient(90deg,#C4521A,#D4A017)' : 'linear-gradient(90deg,#D4A017,#C4521A)' }}></div>
      </Link>
    )
  }

  return (
    <div className="flex-shrink-0 bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden"
      style={{ scrollSnapAlign: 'start', width: '150px', minWidth: '150px' }}>
      <div className="p-4 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: catType === 'direct' ? bgDirect : bgPro }}>
          <CatIcon name={iconName} color="#C4521A" />
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
  const [activeTab, setActiveTab] = useState('accueil')  // 'accueil' | 'concours' | 'apropos'
  const [activeConcoursTab, setActiveConcoursTab] = useState('direct')  // 'direct' | 'professionnel'
  const [activeAboutTab, setActiveAboutTab] = useState('app')  // 'app' | 'equipe' | 'dev'

  useEffect(() => {
    if (!loading && user) {
      if (user.is_admin) router.push('/admin')
      else router.push('/dashboard')
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
                <div className="bg-white rounded-2xl shadow-md border-2 border-amber-100 p-5 text-center"
                  onClick={() => setActiveTab('concours')} style={{ cursor: 'pointer' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-sm mb-1" style={{ color: '#8B2500' }}>Concours Directs</h3>
                  <p className="text-gray-500 text-xs mb-2">12 dossiers thématiques</p>
                  <p className="text-xl font-extrabold" style={{ color: '#C4521A' }}>5 000</p>
                  <p className="text-gray-400 text-xs">FCFA</p>
                  <p className="text-xs mt-2 font-semibold" style={{ color: '#C4521A' }}>Voir les dossiers →</p>
                </div>
                <div className="bg-white rounded-2xl shadow-md border-2 border-amber-100 p-5 text-center"
                  onClick={() => { setActiveTab('concours'); setActiveConcoursTab('professionnel') }} style={{ cursor: 'pointer' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'linear-gradient(135deg,#FFF8E0,#FFE8A0)' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-sm mb-1" style={{ color: '#8B2500' }}>Professionnels</h3>
                  <p className="text-gray-500 text-xs mb-2">17 dossiers spécialisés</p>
                  <p className="text-xl font-extrabold" style={{ color: '#C4521A' }}>20 000</p>
                  <p className="text-gray-400 text-xs">FCFA</p>
                  <p className="text-xs mt-2 font-semibold" style={{ color: '#C4521A' }}>Voir les dossiers →</p>
                </div>
              </div>

              {/* Bannière 5 questions gratuites */}
              <div className="rounded-2xl p-4 mb-6 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '2px solid #D4A017' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#D4A017' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                  </svg>
                </div>
                <div>
                  <p className="font-extrabold text-amber-800 text-sm">5 questions gratuites par dossier</p>
                  <p className="text-amber-700 text-xs mt-0.5">Essayez chaque dossier sans créer de compte. Inscrivez-vous pour tout débloquer !</p>
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
                  <Link href="/help" className="hover:underline">Aide</Link>
                  <button onClick={handleShare} className="hover:underline">Partager</button>
                </div>
                <p className="text-gray-400 text-xs">© 2025 IFL – Burkina Faso</p>
              </footer>
            </div>
          </div>
        )}

        {/* ===== ONGLET CONCOURS ===== */}
        {activeTab === 'concours' && (
          <div className="animate-fadeIn">
            {/* Sous-header Concours */}
            <div className="african-pattern" style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)' }}>
              <div className="max-w-lg mx-auto px-4 py-8 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L9 9H2L7.5 13.5L5.5 21L12 17L18.5 21L16.5 13.5L22 9H15L12 2Z"/>
                  </svg>
                </div>
                <h2 className="text-white font-extrabold text-2xl mb-1">Nos Concours</h2>
                <p className="text-orange-200 text-sm">Choisissez votre catégorie et commencez les QCM</p>
              </div>
            </div>

            {/* Sélecteur Directs / Professionnels */}
            <div className="max-w-lg mx-auto px-4 pt-5">
              <div className="flex gap-2 bg-gray-100 rounded-2xl p-1.5 mb-6 shadow-inner">
                <button
                  onClick={() => setActiveConcoursTab('direct')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeConcoursTab === 'direct' ? 'text-white shadow-md' : 'text-gray-500'}`}
                  style={activeConcoursTab === 'direct' ? { background: 'linear-gradient(135deg,#C4521A,#D4A017)' } : {}}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    Directs <span className="text-xs opacity-70">(12)</span>
                  </span>
                </button>
                <button
                  onClick={() => setActiveConcoursTab('professionnel')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeConcoursTab === 'professionnel' ? 'text-white shadow-md' : 'text-gray-500'}`}
                  style={activeConcoursTab === 'professionnel' ? { background: 'linear-gradient(135deg,#C4521A,#D4A017)' } : {}}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                    </svg>
                    Professionnels <span className="text-xs opacity-70">(17)</span>
                  </span>
                </button>
              </div>

              {/* Section Concours Directs */}
              {activeConcoursTab === 'direct' && (
                <div className="animate-fadeIn">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-extrabold" style={{ color: '#8B2500' }}>Concours directs</h3>
                      <p className="text-gray-500 text-xs">12 dossiers thématiques</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-lg" style={{ color: '#C4521A' }}>5 000</p>
                      <p className="text-gray-400 text-xs">FCFA</p>
                    </div>
                  </div>

                  <div className="rounded-2xl p-3 mb-4 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '1.5px solid #D4A017' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                    </svg>
                    <p className="text-amber-800 text-xs font-semibold">← Glissez horizontalement pour voir tous les dossiers →</p>
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

                  <div className="mt-4 rounded-2xl p-4 flex items-center justify-between border-2 border-amber-100 bg-white">
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#8B2500' }}>Accès complet</p>
                      <p className="text-gray-500 text-xs">Débloquer tous les dossiers</p>
                    </div>
                    <Link href="/payment?type=direct&montant=5000"
                      className="px-5 py-2.5 font-extrabold text-white rounded-xl text-sm active:scale-95 shadow-md"
                      style={{ background: 'linear-gradient(135deg,#C4521A,#D4A017)' }}>
                      5 000 FCFA →
                    </Link>
                  </div>

                  <Link href="/register" className="block mt-3 text-center py-3 font-bold rounded-xl text-sm border-2 border-orange-300"
                    style={{ color: '#C4521A', background: '#FFF8F0' }}>
                    📝 Créer un compte gratuit
                  </Link>
                </div>
              )}

              {/* Section Concours Professionnels */}
              {activeConcoursTab === 'professionnel' && (
                <div className="animate-fadeIn">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-extrabold" style={{ color: '#8B2500' }}>Concours professionnels</h3>
                      <p className="text-gray-500 text-xs">17 dossiers spécialisés</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-lg" style={{ color: '#C4521A' }}>20 000</p>
                      <p className="text-gray-400 text-xs">FCFA</p>
                    </div>
                  </div>

                  <div className="rounded-2xl p-3 mb-4 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '1.5px solid #D4A017' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                    </svg>
                    <p className="text-amber-800 text-xs font-semibold">← Glissez horizontalement pour voir tous les dossiers →</p>
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

                  <div className="mt-4 rounded-2xl p-4 flex items-center justify-between border-2 border-amber-100 bg-white">
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#8B2500' }}>Accès complet</p>
                      <p className="text-gray-500 text-xs">Débloquer tous les dossiers</p>
                    </div>
                    <Link href="/payment?type=professionnel&montant=20000"
                      className="px-5 py-2.5 font-extrabold text-white rounded-xl text-sm active:scale-95 shadow-md"
                      style={{ background: 'linear-gradient(135deg,#C4521A,#D4A017)' }}>
                      20 000 FCFA →
                    </Link>
                  </div>

                  <Link href="/register" className="block mt-3 text-center py-3 font-bold rounded-xl text-sm border-2 border-orange-300"
                    style={{ color: '#C4521A', background: '#FFF8F0' }}>
                    📝 Créer un compte gratuit
                  </Link>
                </div>
              )}

              {/* Bannière démo gratuite en bas */}
              <div className="mt-6 mb-4 rounded-2xl p-4 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '2px solid #D4A017' }}>
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-800 text-sm">Démo gratuite disponible</p>
                  <p className="text-amber-700 text-xs">10 questions d'entraînement</p>
                </div>
                <Link href="/demo" className="px-4 py-2 font-bold text-white rounded-xl text-xs active:scale-95"
                  style={{ background: '#D4A017' }}>
                  Essayer
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ===== ONGLET À PROPOS ===== */}
        {activeTab === 'apropos' && (
          <div className="animate-fadeIn">
            {/* Sous-header À propos */}
            <div className="african-pattern" style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)' }}>
              <div className="max-w-lg mx-auto px-4 py-8 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8V8.01M12 11V16" strokeWidth="2.2"/>
                  </svg>
                </div>
                <h2 className="text-white font-extrabold text-2xl mb-1">À propos</h2>
                <p className="text-orange-200 text-sm">Découvrez IFL, notre équipe et notre développeur</p>
              </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-5">
              {/* Sous-onglets */}
              <div className="flex gap-1.5 bg-gray-100 rounded-2xl p-1.5 mb-6 shadow-inner">
                {[
                  { id: 'app', label: "L'application", svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/></svg> },
                  { id: 'equipe', label: "Notre équipe", svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                  { id: 'dev', label: "Développeur", svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveAboutTab(t.id)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${activeAboutTab === t.id ? 'text-white shadow-md' : 'text-gray-500'}`}
                    style={activeAboutTab === t.id ? { background: 'linear-gradient(135deg,#C4521A,#D4A017)' } : {}}
                  >
                    {t.svg}{t.label}
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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl" style={{ borderTop: '2px solid #FFE4CC' }}>
          <div className="max-w-lg mx-auto flex">

            {/* Onglet Accueil */}
            <button
              onClick={() => setActiveTab('accueil')}
              className="flex-1 flex flex-col items-center py-3 gap-0.5 transition-all relative"
              style={{ color: activeTab === 'accueil' ? '#C4521A' : '#9CA3AF' }}
            >
              {activeTab === 'accueil' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full" style={{ background: '#C4521A' }} />
              )}
              <svg width="24" height="24" viewBox="0 0 24 24" fill={activeTab === 'accueil' ? '#C4521A' : 'none'} stroke={activeTab === 'accueil' ? '#C4521A' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"/>
              </svg>
              <span className="text-xs font-bold">Accueil</span>
            </button>

            {/* Onglet Concours */}
            <button
              onClick={() => setActiveTab('concours')}
              className="flex-1 flex flex-col items-center py-3 gap-0.5 transition-all relative"
              style={{ color: activeTab === 'concours' ? '#C4521A' : '#9CA3AF' }}
            >
              {activeTab === 'concours' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full" style={{ background: '#C4521A' }} />
              )}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'concours' ? '#C4521A' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L9.5 8.5H2.5L8 12.5L5.5 19.5L12 15.5L18.5 19.5L16 12.5L21.5 8.5H14.5L12 2Z" fill={activeTab === 'concours' ? '#FFE4CC' : 'none'} stroke={activeTab === 'concours' ? '#C4521A' : '#9CA3AF'}/>
              </svg>
              <span className="text-xs font-bold">Concours</span>
            </button>

            {/* Onglet À propos */}
            <button
              onClick={() => setActiveTab('apropos')}
              className="flex-1 flex flex-col items-center py-3 gap-0.5 transition-all relative"
              style={{ color: activeTab === 'apropos' ? '#C4521A' : '#9CA3AF' }}
            >
              {activeTab === 'apropos' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full" style={{ background: '#C4521A' }} />
              )}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'apropos' ? '#C4521A' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" fill={activeTab === 'apropos' ? '#FFE4CC' : 'none'}/>
                <path d="M12 8V8.01" strokeWidth="2.5"/>
                <path d="M12 11V16" strokeWidth="2"/>
              </svg>
              <span className="text-xs font-bold">À propos</span>
            </button>

          </div>
        </div>

        {/* Bouton flottant WhatsApp */}
        <a
          href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20je%20voudrais%20des%20informations"
          target="_blank" rel="noopener noreferrer"
          className="fixed right-4 z-50 w-13 h-13 rounded-full flex items-center justify-center shadow-xl"
          style={{ background: '#25D366', bottom: '88px', width: '52px', height: '52px' }}
          title="WhatsApp"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
        </a>

      </div>
    </>
  )
}
