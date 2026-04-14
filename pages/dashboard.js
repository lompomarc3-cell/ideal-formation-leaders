import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

// ===== MAPPING ICÔNES MODERNES MULTICOLORES (identique à index.js) =====
const ICON_IMAGES_DASH = {
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

// Résout le nom de dossier vers le chemin de l'image SVG moderne
function getCatIconSrcDash(nom) {
  const n = (nom || '').toLowerCase()
  const ICON_MAP = {
    'culture': 'globe', 'actualit': 'globe',
    'français': 'book', 'franc': 'book',
    'littérature': 'palette', 'art': 'palette',
    'histoire': 'map', 'géo': 'map',
    'svt': 'leaf', 'science': 'leaf',
    'psycho': 'brain',
    'math': 'calculator',
    'physique': 'flask', 'chimie': 'flask',
    'droit': 'scale',
    'économ': 'chart',
    'vie scolaire': 'school', 'casu': 'school', 'aasu': 'school',
    'cisu': 'building', 'aisu': 'building', 'enaref': 'building',
    'ies': 'search', 'iepenf': 'search2',
    'inspect': 'search',
    'csap': 'graduation',
    'agrég': 'scroll',
    'capes': 'openbook',
    'hôpital': 'hospital', 'hopital': 'hospital',
    'santé': 'health', 'sante': 'health',
    'justice': 'justice',
    'magistr': 'judge',
    'gsp': 'shield',
    'police': 'badge',
    'civil': 'clipboard', 'administrateur': 'clipboard',
    'qcm': 'pencil', 'entraîn': 'pencil',
    'accompagn': 'target', 'final': 'target',
  }
  for (const [key, iconKey] of Object.entries(ICON_MAP)) {
    if (n.includes(key)) return ICON_IMAGES_DASH[iconKey] || '/icons/direct_book.svg'
  }
  return ICON_IMAGES_DASH[nom] || '/icons/direct_book.svg'
}

// Résout depuis le champ icone (clé directe) ou le nom
function getCatIconSrcFull(nom, iconeKey) {
  if (iconeKey && ICON_IMAGES_DASH[iconeKey]) return ICON_IMAGES_DASH[iconeKey]
  return getCatIconSrcDash(nom)
}

// ===== PALETTE COULEURS HARMONISÉES (moins sombres, plus lisibles) =====
function getCatColorStyle(nom, catType) {
  const n = (nom || '').toLowerCase()
  const isPro = catType === 'professionnel'

  // DIRECTS - palette colorée harmonisée
  if (!isPro) {
    if (n.includes('culture') || n.includes('actualit')) return { bg: '#0891B2', border: '#A5F3FC', tag: '#E0F7FF', tagText: '#0E7490' }
    if (n.includes('français') || n.includes('franc')) return { bg: '#7C3AED', border: '#DDD6FE', tag: '#F3E8FF', tagText: '#6D28D9' }
    if (n.includes('littérature') || n.includes('art')) return { bg: '#EC4899', border: '#FBCFE8', tag: '#FDF2F8', tagText: '#BE185D' }
    if (n.includes('histoire') || n.includes('géo')) return { bg: '#059669', border: '#A7F3D0', tag: '#ECFDF5', tagText: '#047857' }
    if (n.includes('svt') || n.includes('science')) return { bg: '#16A34A', border: '#BBF7D0', tag: '#F0FDF4', tagText: '#15803D' }
    if (n.includes('psycho')) return { bg: '#DC2626', border: '#FECACA', tag: '#FEF2F2', tagText: '#B91C1C' }
    if (n.includes('math')) return { bg: '#D97706', border: '#FDE68A', tag: '#FFFBEB', tagText: '#B45309' }
    if (n.includes('physique') || n.includes('chimie')) return { bg: '#2563EB', border: '#BFDBFE', tag: '#EFF6FF', tagText: '#1D4ED8' }
    if (n.includes('droit')) return { bg: '#B45309', border: '#FDE68A', tag: '#FFFBEB', tagText: '#92400E' }
    if (n.includes('économ')) return { bg: '#0F766E', border: '#99F6E4', tag: '#F0FDFA', tagText: '#0D6563' }
    if (n.includes('qcm') || n.includes('entraîn')) return { bg: '#9333EA', border: '#E9D5FF', tag: '#FAF5FF', tagText: '#7E22CE' }
    if (n.includes('accompagn') || n.includes('final')) return { bg: '#C4521A', border: '#FED7AA', tag: '#FFF7ED', tagText: '#9A3412' }
    return { bg: '#C4521A', border: '#FFD0A8', tag: '#FFF0E8', tagText: '#9A3412' }
  }

  // PROFESSIONNELS - palette colorée harmonisée
  if (n.includes('vie scolaire') || n.includes('casu') || n.includes('aasu')) return { bg: '#1E40AF', border: '#BFDBFE', tag: '#EFF6FF', tagText: '#1E3A8A' }
  if (n.includes('actualit') || n.includes('culture')) return { bg: '#047857', border: '#A7F3D0', tag: '#ECFDF5', tagText: '#065F46' }
  if (n.includes('cisu') || n.includes('aisu') || n.includes('enaref')) return { bg: '#1D4ED8', border: '#BFDBFE', tag: '#EFF6FF', tagText: '#1E3A8A' }
  if (n.includes('inspectorat') && n.includes('ies')) return { bg: '#6D28D9', border: '#DDD6FE', tag: '#F5F3FF', tagText: '#5B21B6' }
  if (n.includes('inspectorat') || n.includes('iepenf')) return { bg: '#7C3AED', border: '#EDE9FE', tag: '#F5F3FF', tagText: '#6D28D9' }
  if (n.includes('csapé') || n.includes('csape')) return { bg: '#B45309', border: '#FDE68A', tag: '#FFFBEB', tagText: '#92400E' }
  if (n.includes('agrég')) return { bg: '#92400E', border: '#FDE68A', tag: '#FFFBEB', tagText: '#78350F' }
  if (n.includes('capes')) return { bg: '#0369A1', border: '#BAE6FD', tag: '#F0F9FF', tagText: '#075985' }
  if (n.includes('hôpital') || n.includes('hopital')) return { bg: '#DC2626', border: '#FECACA', tag: '#FEF2F2', tagText: '#B91C1C' }
  if (n.includes('santé') || n.includes('sante')) return { bg: '#BE185D', border: '#FBCFE8', tag: '#FDF2F8', tagText: '#9D174D' }
  if (n.includes('justice') && !n.includes('magistr')) return { bg: '#1E3A5F', border: '#C7D2FE', tag: '#EEF2FF', tagText: '#1E3A5F' }
  if (n.includes('magistr')) return { bg: '#374151', border: '#D1D5DB', tag: '#F9FAFB', tagText: '#1F2937' }
  if (n.includes('gsp')) return { bg: '#1F2937', border: '#D1D5DB', tag: '#F9FAFB', tagText: '#111827' }
  if (n.includes('police')) return { bg: '#1E3A8A', border: '#BFDBFE', tag: '#EFF6FF', tagText: '#1E3A8A' }
  if (n.includes('civil') || n.includes('administrateur')) return { bg: '#065F46', border: '#A7F3D0', tag: '#ECFDF5', tagText: '#064E3B' }
  if (n.includes('qcm') || n.includes('entraîn')) return { bg: '#9333EA', border: '#E9D5FF', tag: '#FAF5FF', tagText: '#7E22CE' }
  if (n.includes('accompagn') || n.includes('final')) return { bg: '#B45309', border: '#FDE68A', tag: '#FFFBEB', tagText: '#92400E' }
  return { bg: '#C4521A', border: '#FFD0A8', tag: '#FFF0E8', tagText: '#9A3412' }
}

// (getCatIconSVG remplacé par images modernes — voir getCatIconSrcFull ci-dessus)

const APP_URL = 'https://ideal-formation-leaders.pages.dev'

export default function Dashboard() {
  const { user, loading, logout, getToken } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState({ direct: [], professionnel: [] })
  const [prices, setPrices] = useState({ direct: 5000, professionnel: 20000 })
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState('direct')
  const [shareMsg, setShareMsg] = useState('')
  const [activeMainTab, setActiveMainTab] = useState('accueil')
  const [activeAboutTab, setActiveAboutTab] = useState('app')
  const [openFaq, setOpenFaq] = useState(null)
  // Stats et progression
  const [userStats, setUserStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [localProgress, setLocalProgress] = useState({}) // Progression localStorage par catégorie

  const handleShare = async () => {
    const text = `🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n✅ Des milliers de QCM\n✅ Concours directs – 12 dossiers (5 000 FCFA)\n✅ Concours professionnels – 17 dossiers (20 000 FCFA)\n✅ 5 questions gratuites par dossier\n\n👉 ${APP_URL}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'IFL – Idéale Formation of Leaders', text, url: APP_URL })
        setShareMsg('✅ Partagé !')
      } catch (e) {
        if (e.name !== 'AbortError') window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }
    setTimeout(() => setShareMsg(''), 3000)
  }

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadCategories()
      loadPrices()
    }
  }, [user])

  // Charger les stats quand on ouvre l'onglet profil
  useEffect(() => {
    if (activeMainTab === 'profil' && user && !userStats) {
      loadUserStats()
    }
  }, [activeMainTab, user])

  // Charger la progression localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      try {
        const progressKeys = Object.keys(localStorage).filter(k => k.startsWith('ifl_progress_'))
        const prog = {}
        progressKeys.forEach(k => {
          const catId = k.replace('ifl_progress_', '')
          try { prog[catId] = JSON.parse(localStorage.getItem(k)) } catch {}
        })
        setLocalProgress(prog)
      } catch {}
    }
  }, [user, activeMainTab])

  const loadCategories = async () => {
    try {
      const token = getToken()
      const [r1, r2] = await Promise.all([
        fetch('/api/quiz/categories?type=direct', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/quiz/categories?type=professionnel', { headers: { Authorization: `Bearer ${token}` } })
      ])
      const d1 = await r1.json()
      const d2 = await r2.json()
      setCategories({
        direct: d1.categories || [],
        professionnel: d2.categories || []
      })
    } catch {}
    setLoadingData(false)
  }

  const loadPrices = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/prices', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.prices) {
        const priceMap = {}
        data.prices.forEach(p => { priceMap[p.type_concours] = p.prix })
        setPrices(prev => ({ ...prev, ...priceMap }))
      }
    } catch {}
  }

  const loadUserStats = async () => {
    setLoadingStats(true)
    try {
      const token = getToken()
      const res = await fetch('/api/quiz/user-stats', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) {
        setUserStats(data.stats)
      }
    } catch {}
    setLoadingStats(false)
  }

  const hasAccess = (type) => {
    if (!user) return false
    if (user.is_admin) return true
    const sub = user.abonnement_type
    const active = user.subscription_status === 'active'
    const notExpired = !user.abonnement_valide_jusqua || new Date(user.abonnement_valide_jusqua) > new Date()
    return active && notExpired && (sub === type || sub === 'all')
  }

  // Vérifie si un dossier professionnel spécifique est débloqué pour cet utilisateur
  const isDossierDebloqueForUser = (nomDossier) => {
    if (!user) return false
    if (user.is_admin) return true
    if (!hasAccess('professionnel')) return false
    // Si pas de liste dossiers_debloques (ancien format sans spécialité), tout est débloqué
    if (!user.dossiers_debloques) return true
    return user.dossiers_debloques.includes(nomDossier)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
        <div className="text-center"><div className="spinner mx-auto mb-3"></div><p className="text-white font-semibold">Chargement...</p></div>
      </div>
    )
  }

  const directAccess = hasAccess('direct')
  const proAccess = hasAccess('professionnel')
  const catList = activeTab === 'direct' ? categories.direct : categories.professionnel
  const hasCurrentAccess = activeTab === 'direct' ? directAccess : proAccess
  const currentPrice = activeTab === 'direct' ? prices.direct : prices.professionnel

  const faqs = [
    {
      q: "Comment m'abonner ?",
      a: "1. Connectez-vous ou créez un compte\n2. Allez dans \"Paiement\"\n3. Effectuez le paiement Orange Money : *144*10*76223962#\n4. Envoyez la capture via WhatsApp au +226 76 22 39 62\n5. Votre abonnement sera activé sous 24h"
    },
    {
      q: "Comment effectuer le paiement Orange Money ?",
      a: "Composez *144*10*76223962# sur votre téléphone Orange, saisissez le montant (5 000 ou 20 000 FCFA), confirmez avec votre code secret.\nBénéficiaire : +226 76 22 39 62"
    },
    {
      q: "Quelle est la différence entre les deux formules ?",
      a: "📚 Concours Directs (5 000 FCFA) : 12 dossiers thématiques (Actualité, Français, Maths, SVT, Droit, etc.)\n\n🎓 Concours Professionnels (20 000 FCFA) : 17 dossiers spécialisés (CASU, CAPES, Justice, Magistrature, Police, Santé, etc.)"
    },
    {
      q: "Mon abonnement n'est pas activé après paiement ?",
      a: "Vérifiez que vous avez bien envoyé la capture de paiement via WhatsApp au +226 76 22 39 62. L'activation prend jusqu'à 24h après réception de la preuve."
    },
    {
      q: "Comment partager l'application ?",
      a: `Utilisez le bouton "Partager" disponible dans l'application ou partagez directement le lien : ${APP_URL}`
    },
    {
      q: "Combien de questions gratuites par dossier ?",
      a: "5 questions gratuites sont disponibles par dossier, sans inscription requise. Pour accéder à toutes les questions, un abonnement est nécessaire."
    }
  ]

  return (
    <>
      <Head>
        <title>Mon Espace – IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen" style={{ background: '#FFF8F0', paddingBottom: 80 }}>

        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="logo-header" style={{ width: 44, height: 44 }}>
                <img src="/logo.png" alt="IFL" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 14 }} />
              </div>
              <div>
                <p className="text-white font-bold leading-tight">Bonjour, {user.prenom || user.nom} 👋</p>
                <p className="text-orange-200 text-xs">{user.is_admin ? '👑 Administrateur' : user.phone}</p>
              </div>
            </div>
            <div className="flex gap-1.5 items-center">
              {user.is_admin && (
                <Link href="/admin" className="px-3 py-1.5 text-xs font-bold text-white rounded-lg" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  ⚙️ Admin
                </Link>
              )}
              <button onClick={handleShare} className="p-2 text-orange-200 hover:text-white transition-colors" title="Partager">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
              <button onClick={logout} className="p-2 text-orange-200 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            </div>
          </div>
          {shareMsg && (
            <div className="text-center py-1 text-sm font-semibold text-amber-200">{shareMsg}</div>
          )}
        </header>

        {/* ===== ONGLET ACCUEIL ===== */}
        {activeMainTab === 'accueil' && (
          <div className="animate-fadeIn">
            {/* Hero Banner */}
            <div style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A,#D4A017)' }}>
              <div className="max-w-lg mx-auto px-4 py-8 text-center">
                <div className="inline-block mb-4" style={{ width: 80, height: 80 }}>
                  <img src="/logo.png" alt="IFL" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 20 }} />
                </div>
                <h1 className="text-white font-extrabold text-xl mb-1">Bienvenue, {user.prenom || user.nom} !</h1>
                <p className="text-orange-200 text-sm">Votre espace de préparation aux concours</p>
              </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-5">
              {/* Bannière admin */}
              {user.is_admin && (
                <div className="mb-4 rounded-2xl p-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                  <div>
                    <p className="text-white font-bold text-sm">👑 Mode Administrateur</p>
                    <p className="text-orange-200 text-xs">Vous voyez l'application comme un utilisateur</p>
                  </div>
                  <Link href="/admin" className="px-4 py-2 bg-white font-bold text-xs rounded-xl" style={{ color: '#C4521A' }}>
                    ⚙️ Panel Admin
                  </Link>
                </div>
              )}

              {/* Statut abonnement */}
              <div className="mb-5">
                {!directAccess && !proAccess && !user.is_admin ? (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
                    <p className="font-bold text-amber-800 text-base">⚡ Aucun abonnement actif</p>
                    <p className="text-amber-700 text-sm mt-1">Abonnez-vous pour accéder aux QCM payants</p>
                    <Link href="/payment" className="inline-block mt-3 px-5 py-2.5 font-bold text-white rounded-xl text-sm active:scale-95 shadow-md" style={{ background: '#C4521A' }}>
                      💳 S'abonner maintenant
                    </Link>
                  </div>
                ) : (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{user.is_admin ? '👑' : '✅'}</span>
                      <div>
                        <p className="font-bold text-amber-800">
                          {user.is_admin ? 'Accès complet (Administrateur)' : 'Abonnement actif'}
                        </p>
                        <p className="text-amber-700 text-sm">
                          {user.is_admin ? 'Accès illimité à toutes les ressources' :
                           user.abonnement_type === 'all' ? 'Accès complet (direct + professionnel)' :
                           user.abonnement_type === 'direct' ? '📚 Concours Directs' : '🎓 Concours Professionnels'}
                        </p>
                        {!user.is_admin && user.abonnement_valide_jusqua && (
                          <p className="text-amber-600 text-xs mt-0.5">
                            Expire le: {new Date(user.abonnement_valide_jusqua).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Nos offres */}
              <p className="text-center font-extrabold text-lg mb-4" style={{ color: '#8B2500' }}>Nos offres</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-2xl shadow-md border-2 p-5 text-center"
                  style={{ borderColor: '#FFD0A8', cursor: 'pointer' }}
                  onClick={() => setActiveMainTab('concours')}>
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
                  onClick={() => { setActiveMainTab('concours'); setActiveTab('professionnel') }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'linear-gradient(135deg,#8B2500,#D4A017)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                    </svg>
                  </div>
                  <div className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: '#FFF7E8', color: '#B45309' }}>🏅 Évolution carrière</div>
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

              {/* Démo gratuite */}
              <div className="mt-2 mb-4 rounded-2xl p-4 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '2px solid #D4A017' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#D4A017' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-800 text-sm">Démo gratuite disponible</p>
                  <p className="text-amber-700 text-xs">10 questions d'entraînement sans inscription</p>
                </div>
                <Link href="/demo" className="px-4 py-2 font-bold text-white rounded-xl text-xs active:scale-95"
                  style={{ background: '#D4A017' }}>
                  Essayer
                </Link>
              </div>

              {/* Partager */}
              <button
                onClick={handleShare}
                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-md mb-4"
                style={{ background: 'linear-gradient(135deg,#C4521A,#D4A017)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Partager l'application
              </button>

              {/* Encart note vers Mon Profil */}
              <button
                onClick={() => setActiveMainTab('profil')}
                className="w-full rounded-2xl p-4 flex items-center gap-3 mb-4 active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', border: '1.5px solid #BFDBFE' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#2563EB' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm text-blue-800">Votre progression &amp; votre score</p>
                  <p className="text-blue-600 text-xs">Consultez vos statistiques détaillées dans <strong>Mon Profil</strong></p>
                </div>
                <svg width="18" height="18" fill="none" stroke="#2563EB" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* ===== ONGLET CONCOURS ===== */}
        {activeMainTab === 'concours' && (
          <div className="animate-fadeIn">
            <div style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)' }}>
              <div className="max-w-lg mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-white font-extrabold text-2xl mb-1">Mes Concours</h2>
                    <p className="text-orange-200 text-sm">Choisissez votre catégorie</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                      <path d="M4 22h16"/>
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
                    </svg>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <div className="flex-1 rounded-xl p-3 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <span className="text-xl">📚</span>
                    <div>
                      <p className="text-white font-bold text-xs">Directs</p>
                      <p className="text-orange-200 text-xs">12 dossiers · 5 000 FCFA</p>
                    </div>
                  </div>
                  <div className="flex-1 rounded-xl p-3 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <span className="text-xl">🎓</span>
                    <div>
                      <p className="text-white font-bold text-xs">Professionnels</p>
                      <p className="text-orange-200 text-xs">17 dossiers · 20 000 FCFA</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-5">
              {/* Bannière admin */}
              {user.is_admin && (
                <div className="mb-4 rounded-2xl p-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                  <div>
                    <p className="text-white font-bold text-sm">👑 Mode Administrateur</p>
                    <p className="text-orange-200 text-xs">Accès illimité à toutes les ressources</p>
                  </div>
                  <Link href="/admin" className="px-4 py-2 bg-white font-bold text-xs rounded-xl" style={{ color: '#C4521A' }}>
                    ⚙️ Panel Admin
                  </Link>
                </div>
              )}

              {/* Onglets Directs / Professionnels */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setActiveTab('direct')}
                  className={`flex-1 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${activeTab === 'direct' ? 'text-white shadow-lg' : 'text-gray-500 bg-white border-2 border-gray-100'}`}
                  style={activeTab === 'direct' ? { background: 'linear-gradient(135deg,#8B2500,#C4521A)', boxShadow: '0 4px 12px rgba(196,82,26,0.3)' } : {}}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  Directs
                </button>
                <button
                  onClick={() => setActiveTab('professionnel')}
                  className={`flex-1 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${activeTab === 'professionnel' ? 'text-white shadow-lg' : 'text-gray-500 bg-white border-2 border-gray-100'}`}
                  style={activeTab === 'professionnel' ? { background: 'linear-gradient(135deg,#8B2500,#D4A017)', boxShadow: '0 4px 12px rgba(180,83,9,0.3)' } : {}}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                  Professionnels
                </button>
              </div>

              {/* Contenu de l'onglet */}
              {loadingData ? (
                <div className="py-12 text-center"><div className="spinner mx-auto"></div></div>
              ) : (
                <div className="animate-fadeIn">

                  {/* === BANDEAU INFO OFFRE CONCOURS PROFESSIONNELS === */}
                  {activeTab === 'professionnel' && (
                    <div className="rounded-2xl p-4 mb-4" style={{ background: 'linear-gradient(135deg,#1D4ED8,#2563EB)', border: '1.5px solid #BFDBFE' }}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.2)' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                        </div>
                        <div>
                          <p className="text-white font-extrabold text-sm mb-1">Notre offre Concours Professionnels</p>
                          <p className="text-blue-100 text-xs leading-relaxed">
                            <strong className="text-white">14 dossiers professionnels disponibles.</strong> Pour chaque dossier choisi, vous bénéficiez <strong className="text-yellow-300">gratuitement de 3 dossiers d'accompagnement :</strong>
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {['📰 Actualités & culture générale', '📝 Entraînement QCM', '🎯 Accompagnement final'].map((item, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>{item}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!hasCurrentAccess && !user.is_admin && (
                    <div className="mb-4 rounded-2xl p-4 border-2 border-amber-300" style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)' }}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🆓</span>
                        <div className="flex-1">
                          <p className="text-amber-800 font-bold text-sm">5 questions gratuites par dossier</p>
                          <p className="text-amber-700 text-xs mt-0.5">Essayez chaque dossier gratuitement. Abonnez-vous pour tout débloquer.</p>
                        </div>
                        <Link href={`/payment?type=${activeTab}&montant=${currentPrice}`}
                          className="px-3 py-1.5 text-xs font-bold text-white rounded-lg flex-shrink-0"
                          style={{ background: '#C4521A' }}>
                          {currentPrice.toLocaleString()} FCFA →
                        </Link>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mb-4">
                    {hasCurrentAccess || user.is_admin
                      ? `🎉 ${catList.length} dossier${catList.length > 1 ? 's' : ''} disponible${catList.length > 1 ? 's' : ''}`
                      : `📂 ${catList.length} dossier${catList.length > 1 ? 's' : ''} · 5 questions gratuites par dossier`}
                  </p>

                  <HorizontalCategoryScroll 
                    categories={catList} 
                    locked={false} 
                    hasAccess={hasCurrentAccess || user.is_admin} 
                    catType={activeTab}
                    isDossierDebloqueForUser={isDossierDebloqueForUser}
                    dossierPrincipal={user.dossier_principal}
                    isAdmin={user.is_admin}
                  />

                  {activeTab === 'direct' && !proAccess && !user.is_admin && (
                    <div className="mt-6 rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg,#C4521A,#8B2500)' }}>
                      <p className="text-white font-bold mb-1">🎓 Concours Professionnels</p>
                      <p className="text-orange-200 text-sm mb-3">{prices.professionnel.toLocaleString()} FCFA</p>
                      <Link href="/select-specialty" className="inline-block px-6 py-2.5 bg-white font-bold rounded-xl text-sm" style={{ color: '#C4521A' }}>
                        Choisir ma spécialité →
                      </Link>
                    </div>
                  )}
                  {activeTab === 'professionnel' && !directAccess && !user.is_admin && (
                    <div className="mt-6 rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                      <p className="text-white font-bold mb-1">📚 Concours Directs</p>
                      <p className="text-orange-200 text-sm mb-3">{prices.direct.toLocaleString()} FCFA</p>
                      <Link href={`/payment?type=direct&montant=${prices.direct}`} className="inline-block px-6 py-2.5 bg-white font-bold rounded-xl text-sm" style={{ color: '#C4521A' }}>
                        S'abonner →
                      </Link>
                    </div>
                  )}

                  {/* Bannière dossier principal pour abonné professionnel */}
                  {activeTab === 'professionnel' && proAccess && !user.is_admin && user.dossier_principal && (
                    <div className="mt-4 rounded-2xl p-3" style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE5CC)', border: '2px solid #C4521A' }}>
                      <p className="text-xs font-bold text-amber-700 mb-1">📌 Votre dossier principal</p>
                      <p className="font-extrabold text-sm" style={{ color: '#8B2500' }}>{user.dossier_principal}</p>
                      <p className="text-xs text-green-700 mt-0.5">+ Actualités · Entraînement QCM · Accompagnement final (inclus)</p>
                      <p className="text-xs text-gray-500 mt-1">🔒 Les {13} autres spécialités sont verrouillées</p>
                    </div>
                  )}
                </div>
              )}

              {/* Démo gratuite */}
              <div className="mt-6 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-amber-800">🎯 Démo gratuite</p>
                  <p className="text-amber-700 text-xs mt-0.5">10 questions accessibles maintenant</p>
                </div>
                <Link href="/demo" className="px-4 py-2 font-bold text-white rounded-xl text-sm active:scale-95" style={{ background: '#D4A017' }}>
                  Essayer →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ===== ONGLET MON PROFIL ===== */}
        {activeMainTab === 'profil' && (
          <div className="animate-fadeIn">
            <div style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)' }}>
              <div className="max-w-lg mx-auto px-4 py-8 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h2 className="text-white font-extrabold text-2xl mb-1">Mon Profil</h2>
                <p className="text-orange-200 text-sm">{user.prenom} {user.nom}</p>
              </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6">
              {/* Infos utilisateur */}
              <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5 mb-4">
                <h3 className="font-extrabold mb-4 flex items-center gap-2 text-sm" style={{ color: '#8B2500' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Mes informations
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#FFF8F0' }}>
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-xs text-gray-500">Nom complet</p>
                      <p className="font-bold text-gray-800 text-sm">{user.prenom} {user.nom}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#FFF8F0' }}>
                    <span className="text-lg">📱</span>
                    <div>
                      <p className="text-xs text-gray-500">Téléphone</p>
                      <p className="font-bold text-gray-800 text-sm">{user.phone}</p>
                    </div>
                  </div>
                  {user.is_admin && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#FFF0E8', border: '1px solid #FFD0A8' }}>
                      <span className="text-lg">👑</span>
                      <div>
                        <p className="text-xs text-gray-500">Rôle</p>
                        <p className="font-bold text-sm" style={{ color: '#C4521A' }}>Administrateur</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Abonnement */}
              <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5 mb-4">
                <h3 className="font-extrabold mb-4 flex items-center gap-2 text-sm" style={{ color: '#8B2500' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Mon abonnement
                </h3>
                {user.is_admin ? (
                  <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE4CC)', border: '2px solid #FFD0A8' }}>
                    <p className="font-extrabold" style={{ color: '#8B2500' }}>👑 Accès complet (Administrateur)</p>
                    <p className="text-gray-600 text-sm mt-1">Accès illimité à toutes les ressources</p>
                  </div>
                ) : directAccess || proAccess ? (
                  <div className="space-y-3">
                    {directAccess && (
                      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE4CC)', border: '2px solid #FFD0A8' }}>
                        <p className="font-extrabold text-sm" style={{ color: '#8B2500' }}>✅ Concours Directs</p>
                        {user.abonnement_valide_jusqua && (
                          <p className="text-gray-600 text-xs mt-1">Expire le {new Date(user.abonnement_valide_jusqua).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>
                    )}
                    {proAccess && (
                      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '2px solid #FFE68A' }}>
                        <p className="font-extrabold text-sm" style={{ color: '#B45309' }}>✅ Concours Professionnels</p>
                        {user.dossier_principal && (
                          <p className="text-xs mt-1" style={{ color: '#8B2500' }}>📌 Dossier : <strong>{user.dossier_principal}</strong></p>
                        )}
                        {user.abonnement_valide_jusqua && (
                          <p className="text-gray-600 text-xs mt-1">Expire le {new Date(user.abonnement_valide_jusqua).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="rounded-2xl p-4 mb-3" style={{ background: '#F9FAFB', border: '2px solid #E5E7EB' }}>
                      <p className="font-bold text-gray-600 text-sm">Aucun abonnement actif</p>
                      <p className="text-gray-500 text-xs mt-1">Souscrivez pour accéder à tous les QCM</p>
                    </div>
                    <Link href="/payment" className="block w-full py-3 text-center font-bold text-white rounded-xl text-sm active:scale-95 shadow-md"
                      style={{ background: 'linear-gradient(135deg,#C4521A,#D4A017)' }}>
                      💳 S'abonner maintenant
                    </Link>
                  </div>
                )}
              </div>

              {/* === PROGRESSION ET SCORE === */}
              <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5 mb-4">
                <h3 className="font-extrabold mb-4 flex items-center gap-2 text-sm" style={{ color: '#8B2500' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2.5" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                  Ma progression & mon score
                </h3>

                {loadingStats ? (
                  <div className="text-center py-6"><div className="spinner mx-auto mb-2"></div><p className="text-gray-400 text-xs">Chargement...</p></div>
                ) : userStats ? (
                  <div>
                    {/* Score global */}
                    <div className="rounded-2xl p-4 mb-4" style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE4CC)', border: '2px solid #FFD0A8' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-extrabold text-sm" style={{ color: '#8B2500' }}>Score global</p>
                          <p className="text-gray-500 text-xs">{userStats.totalCorrect} bonnes réponses sur {userStats.totalAnswered} questions</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-3xl" style={{ color: userStats.scoreGlobal >= 70 ? '#16A34A' : userStats.scoreGlobal >= 50 ? '#D97706' : '#DC2626' }}>
                            {userStats.scoreGlobal}%
                          </p>
                          <p className="text-xs font-semibold" style={{ color: userStats.scoreGlobal >= 70 ? '#16A34A' : userStats.scoreGlobal >= 50 ? '#D97706' : '#DC2626' }}>
                            {userStats.scoreGlobal >= 70 ? '🏆 Excellent' : userStats.scoreGlobal >= 50 ? '📈 Bien' : userStats.totalAnswered > 0 ? '💪 En progression' : '🚀 Commencez !'}
                          </p>
                        </div>
                      </div>
                      {/* Barre de progression globale */}
                      <div className="w-full bg-white rounded-full" style={{ height: 10, background: 'rgba(255,255,255,0.6)' }}>
                        <div className="rounded-full transition-all" style={{
                          width: `${userStats.scoreGlobal}%`,
                          height: 10,
                          background: userStats.scoreGlobal >= 70 ? 'linear-gradient(90deg,#16A34A,#22C55E)' : userStats.scoreGlobal >= 50 ? 'linear-gradient(90deg,#D97706,#F59E0B)' : 'linear-gradient(90deg,#C4521A,#D4A017)',
                          minWidth: userStats.scoreGlobal > 0 ? 10 : 0
                        }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">0%</span>
                        <span className="text-xs text-gray-400">100%</span>
                      </div>
                    </div>

                    {/* Progression par dossier */}
                    {userStats.parDossier && userStats.parDossier.length > 0 ? (
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Par dossier</p>
                        <div className="space-y-2">
                          {userStats.parDossier.slice(0, 8).map((d, i) => (
                            <div key={i} className="rounded-xl p-3" style={{ background: '#FFF8F0', border: '1px solid #FFE4CC' }}>
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-xs text-gray-700 flex-1 pr-2 truncate">{d.nom}</p>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-xs text-gray-500">{d.totalCorrect}/{d.totalAnswered}</span>
                                  <span className="font-extrabold text-xs px-2 py-0.5 rounded-full"
                                    style={{
                                      background: d.score >= 70 ? '#DCFCE7' : d.score >= 50 ? '#FEF3C7' : '#FEE2E2',
                                      color: d.score >= 70 ? '#16A34A' : d.score >= 50 ? '#D97706' : '#DC2626'
                                    }}>
                                    {d.score}%
                                  </span>
                                </div>
                              </div>
                              <div className="w-full rounded-full" style={{ height: 5, background: '#FFE4CC' }}>
                                <div className="rounded-full" style={{
                                  width: `${d.score}%`,
                                  height: 5,
                                  background: d.score >= 70 ? '#16A34A' : d.score >= 50 ? '#D97706' : '#C4521A',
                                  minWidth: d.score > 0 ? 6 : 0
                                }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-400 text-sm">Aucune réponse enregistrée pour le moment.</p>
                        <p className="text-gray-400 text-xs mt-1">Commencez un dossier pour voir votre score ici !</p>
                      </div>
                    )}

                    <button
                      onClick={loadUserStats}
                      className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold border-2 flex items-center justify-center gap-2"
                      style={{ borderColor: '#FFD0A8', color: '#C4521A', background: '#FFF8F0' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                      Actualiser les statistiques
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400 text-sm mb-3">Chargement de vos statistiques...</p>
                    <button onClick={loadUserStats} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#C4521A' }}>
                      Charger mes stats
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-5 mb-4">
                <h3 className="font-extrabold mb-4 flex items-center gap-2 text-sm" style={{ color: '#8B2500' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
                  Actions rapides
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-3 p-3 rounded-xl w-full text-left hover:opacity-90 transition-opacity"
                    style={{ background: '#FFF8F0', border: '1px solid #FFD0A8' }}>
                    <span className="text-lg">📤</span>
                    <span className="font-semibold text-gray-700 text-sm">Partager l'application</span>
                  </button>
                  <Link href="/demo" className="flex items-center gap-3 p-3 rounded-xl hover:opacity-90 transition-opacity"
                    style={{ background: '#FFF8F0', border: '1px solid #FFD0A8' }}>
                    <span className="text-lg">🎯</span>
                    <span className="font-semibold text-gray-700 text-sm">Tester la démo gratuite</span>
                  </Link>
                  {user.is_admin && (
                    <Link href="/admin" className="flex items-center gap-3 p-3 rounded-xl hover:opacity-90 transition-opacity"
                      style={{ background: '#FFF0E8', border: '1px solid #FFD0A8' }}>
                      <span className="text-lg">⚙️</span>
                      <span className="font-semibold text-sm" style={{ color: '#C4521A' }}>Panel d'administration</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Déconnexion */}
              <button
                onClick={logout}
                className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 text-sm"
                style={{ borderColor: '#E5E7EB', color: '#6B7280', background: 'white' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                Se déconnecter
              </button>
            </div>
          </div>
        )}

        {/* ===== ONGLET À PROPOS ===== */}
        {activeMainTab === 'apropos' && (
          <div className="animate-fadeIn">
            <div style={{ background: 'linear-gradient(160deg,#8B2500,#C4521A)' }}>
              <div className="max-w-lg mx-auto px-4 py-8 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8V8.01M12 11V16" strokeWidth="2.2"/>
                  </svg>
                </div>
                <h2 className="text-white font-extrabold text-2xl mb-1">À propos</h2>
                <p className="text-orange-200 text-sm">IFL, notre équipe et aide</p>
              </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-5">
              {/* Sous-onglets */}
              <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 mb-6 shadow-inner overflow-x-auto">
                {[
                  { id: 'app', label: "L'application" },
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

              {/* Bloc L'application */}
              {activeAboutTab === 'app' && (
                <div className="animate-fadeIn">
                  <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6 mb-4">
                    <div className="text-center mb-5">
                      <div className="inline-block mb-4" style={{ width: 80, height: 80 }}>
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

              {/* Bloc Équipe */}
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
                      L'équipe d'<strong style={{ color: '#8B2500' }}>Idéale Formation of Leaders</strong> est composée d'enseignants et de professionnels passionnés qui accompagnent chaque année des centaines de candidats burkinabè vers la réussite de leurs concours.
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed mb-5">
                      Notre équipe est également auteure de plusieurs documents, mémoires et livres spécialisés pour les concours directs. Notre mission est de mettre à la disposition des candidats des outils de qualité, accessibles et efficaces.
                    </p>
                    <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '2px solid #D4A017' }}>
                      <p className="font-extrabold text-amber-800 text-sm mb-3">📞 Contactez-nous</p>
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
                        <svg width="20" height="20" fill="none" stroke="#C4521A" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </a>

                      {/* Orange Money */}
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
                          <button onClick={() => { navigator.clipboard?.writeText('*144*10*76223962#'); alert('✅ Code copié !') }}
                            className="text-xl font-extrabold tracking-wider underline decoration-dotted active:opacity-70">
                            *144*10*76223962#
                          </button>
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
                      <details className="rounded-2xl border border-amber-100 overflow-hidden" style={{ background: '#FFFBF5' }}>
                        <summary className="px-4 py-3.5 font-bold text-gray-800 text-sm cursor-pointer flex items-center justify-between list-none">
                          <span className="flex items-center gap-2"><span>🔒</span> Politique de confidentialité</span>
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
                      <details className="rounded-2xl border border-amber-100 overflow-hidden" style={{ background: '#FFFBF5' }}>
                        <summary className="px-4 py-3.5 font-bold text-gray-800 text-sm cursor-pointer flex items-center justify-between list-none">
                          <span className="flex items-center gap-2"><span>🤝</span> Règles communautaires</span>
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
                        onClick={() => { navigator.clipboard?.writeText(APP_URL); }}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
                        style={{ background: '#C4521A', color: 'white' }}>
                        Copier
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Bloc Développeur */}
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
                      Passionné par les technologies éducatives, <strong style={{ color: '#8B2500' }}>Marc LOMPO</strong> conçoit des applications sur mesure pour aider les apprenants à atteindre leurs objectifs.
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
                        style={{ background: 'linear-gradient(135deg,#F0FFF4,#DCFCE7)', border: '1.5px solid #BBF7D0' }}>
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== BARRE DE NAVIGATION PRINCIPALE EN BAS ===== */}
        <div className="fixed bottom-0 left-0 right-0 z-50"
          style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderTop: '1.5px solid #FFE4CC', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
          <div className="max-w-lg mx-auto flex">

            {/* Onglet Accueil */}
            <button
              onClick={() => setActiveMainTab('accueil')}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all relative"
            >
              {activeMainTab === 'accueil' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }} />
              )}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeMainTab === 'accueil' ? 'shadow-sm' : ''}`}
                style={{ background: activeMainTab === 'accueil' ? 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' : 'transparent' }}>
                <img src="/icons/nav_home.svg" alt="Accueil" width="24" height="24" style={{ objectFit: 'contain', filter: activeMainTab === 'accueil' ? 'none' : 'grayscale(60%) opacity(0.6)' }} />
              </div>
              <span className="text-xs font-bold" style={{ color: activeMainTab === 'accueil' ? '#C4521A' : '#9CA3AF' }}>Accueil</span>
            </button>

            {/* Onglet Concours */}
            <button
              onClick={() => setActiveMainTab('concours')}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all relative"
            >
              {activeMainTab === 'concours' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }} />
              )}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeMainTab === 'concours' ? 'shadow-sm' : ''}`}
                style={{ background: activeMainTab === 'concours' ? 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' : 'transparent' }}>
                <img src="/icons/nav_concours.svg" alt="Concours" width="24" height="24" style={{ objectFit: 'contain', filter: activeMainTab === 'concours' ? 'none' : 'grayscale(60%) opacity(0.6)' }} />
              </div>
              <span className="text-xs font-bold" style={{ color: activeMainTab === 'concours' ? '#C4521A' : '#9CA3AF' }}>Concours</span>
            </button>

            {/* Onglet Mon Profil */}
            <button
              onClick={() => setActiveMainTab('profil')}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all relative"
            >
              {activeMainTab === 'profil' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }} />
              )}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeMainTab === 'profil' ? 'shadow-sm' : ''}`}
                style={{ background: activeMainTab === 'profil' ? 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' : 'transparent' }}>
                <img src="/icons/nav_profil.svg" alt="Profil" width="24" height="24" style={{ objectFit: 'contain', filter: activeMainTab === 'profil' ? 'none' : 'grayscale(60%) opacity(0.6)' }} />
              </div>
              <span className="text-xs font-bold" style={{ color: activeMainTab === 'profil' ? '#C4521A' : '#9CA3AF' }}>Mon Profil</span>
            </button>

            {/* Onglet À propos */}
            <button
              onClick={() => setActiveMainTab('apropos')}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all relative"
            >
              {activeMainTab === 'apropos' && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }} />
              )}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeMainTab === 'apropos' ? 'shadow-sm' : ''}`}
                style={{ background: activeMainTab === 'apropos' ? 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' : 'transparent' }}>
                <img src="/icons/nav_apropos.svg" alt="À propos" width="24" height="24" style={{ objectFit: 'contain', filter: activeMainTab === 'apropos' ? 'none' : 'grayscale(60%) opacity(0.6)' }} />
              </div>
              <span className="text-xs font-bold" style={{ color: activeMainTab === 'apropos' ? '#C4521A' : '#9CA3AF' }}>À propos</span>
            </button>

          </div>
        </div>

      </div>
    </>
  )
}

/* ===== COMPOSANT NAVIGATION HORIZONTALE ===== */
function HorizontalCategoryScroll({ categories, locked, hasAccess, catType, isDossierDebloqueForUser, dossierPrincipal, isAdmin }) {
  const scrollRef = useRef(null)

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-amber-100">
        <p className="text-4xl mb-3">📂</p>
        <p>Aucun dossier disponible pour le moment</p>
      </div>
    )
  }

  return (
    <div className="relative mb-4">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs text-gray-400">← Glissez pour voir tous les dossiers →</p>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {categories.map((cat, i) => {
          // Pour les professionnels : vérifier si le dossier spécifique est débloqué
          let catAccess = hasAccess
          if (catType === 'professionnel' && hasAccess && !isAdmin && isDossierDebloqueForUser) {
            catAccess = isDossierDebloqueForUser(cat.nom)
          }
          return (
            <CategoryCard 
              key={cat.id || i} 
              cat={cat} 
              locked={locked} 
              hasAccess={catAccess} 
              index={i} 
              catType={catType}
              isPrincipal={dossierPrincipal === cat.nom}
              isLocked={catType === 'professionnel' && hasAccess && !isAdmin && isDossierDebloqueForUser && !isDossierDebloqueForUser(cat.nom)}
            />
          )
        })}
      </div>
    </div>
  )
}

function CategoryCard({ cat, locked, hasAccess, index, catType, isPrincipal, isLocked }) {
  const iconSrc = getCatIconSrcFull(cat.nom, cat.icone)
  const colorStyle = getCatColorStyle(cat.nom, catType || 'direct')

  // Un dossier verrouillé (abonné pro mais ce n'est pas son dossier)
  if (isLocked) {
    return (
      <div
        className="flex-shrink-0 bg-white rounded-2xl shadow-sm overflow-hidden"
        style={{ scrollSnapAlign: 'start', width: '155px', minWidth: '155px', border: '2px dashed #D1D5DB', opacity: 0.65 }}
      >
        <div className="p-4 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 relative"
            style={{ background: '#F3F4F6', border: '1.5px solid #E5E7EB' }}>
            <img src={iconSrc} alt={cat.nom} width="36" height="36" style={{ objectFit: 'contain', filter: 'grayscale(70%) opacity(0.6)' }} />
            {/* Cadenas overlay */}
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: '#6B7280' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 leading-tight mb-2 line-clamp-2">{cat.nom}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#6B7280' }}>
            🔒 Verrouillé
          </span>
        </div>
        <div className="h-1 w-full" style={{ background: '#E5E7EB' }}></div>
      </div>
    )
  }

  return (
    <Link
      href={`/quiz/${cat.id}`}
      className="flex-shrink-0 bg-white rounded-2xl shadow-md overflow-hidden active:scale-95 transition-all hover:shadow-lg"
      style={{ 
        scrollSnapAlign: 'start', 
        width: '155px', 
        minWidth: '155px', 
        border: isPrincipal ? '2px solid #C4521A' : `2px solid ${colorStyle.border}`,
        boxShadow: `0 2px 8px ${colorStyle.border}80`,
        position: 'relative'
      }}
    >
      {/* Badge 'Principal' pour le dossier principal */}
      {isPrincipal && (
        <div className="absolute top-2 right-2 z-10">
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg text-white" style={{ background: '#C4521A' }}>📌</span>
        </div>
      )}
      <div className="p-4 text-center">
        {/* Image moderne multicolore sur fond blanc/claire */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'rgba(255,255,255,0.9)', border: `1.5px solid ${colorStyle.border}` }}>
          <img src={iconSrc} alt={cat.nom} width="36" height="36" style={{ objectFit: 'contain', display: 'block' }} />
        </div>
        <p className="text-xs font-bold text-gray-800 leading-tight mb-2 line-clamp-2">{cat.nom}</p>
        <div className="flex items-center justify-center">
          {hasAccess ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: colorStyle.tag, color: colorStyle.tagText }}>
              {cat.question_count || 0} QCM
            </span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: colorStyle.tag, color: colorStyle.tagText }}>
              🆓 5 gratuites
            </span>
          )}
        </div>
      </div>
      <div className="h-1.5 w-full" style={{ background: colorStyle.bg }}></div>
    </Link>
  )
}
