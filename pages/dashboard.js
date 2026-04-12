import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

// Icône SVG pour les cartes de catégorie
function getCatIconSVG(nom) {
  const n = (nom || '').toLowerCase()
  const color = 'white'
  if (n.includes('culture') || n.includes('actualit')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  if (n.includes('français') || n.includes('franc')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
  if (n.includes('littérature') || n.includes('art')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="1" fill={color}/><circle cx="17.5" cy="10.5" r="1" fill={color}/><circle cx="8.5" cy="7.5" r="1" fill={color}/><circle cx="6.5" cy="12.5" r="1" fill={color}/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
  if (n.includes('histoire') || n.includes('géographie') || n.includes('h-g')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
  if (n.includes('svt') || n.includes('science')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
  if (n.includes('psycho')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.74z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.74z"/></svg>
  if (n.includes('math')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
  if (n.includes('physique') || n.includes('chimie') || n.includes('pc')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H15M9 3V13L4 20H20L15 13V3M9 3H15"/><path d="M7 18H17"/></svg>
  if (n.includes('droit')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M5 21h14M17 8l4 6-4 0M7 8 3 14l4 0M3 14h4M17 14h4M7 8h10"/></svg>
  if (n.includes('économ')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
  if (n.includes('qcm') || n.includes('entraîn')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
  if (n.includes('accompagn') || n.includes('final')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
  if (n.includes('vie scolaire') || n.includes('casu')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20M6 22V10l6-6 6 6v12"/><path d="M12 6v6m-4 4h8M9 22v-4h6v4"/></svg>
  if (n.includes('inspect')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  if (n.includes('agrég') || n.includes('capes')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
  if (n.includes('hôpital') || n.includes('santé')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10M12 7v6m-3-3h6"/></svg>
  if (n.includes('gsp') || n.includes('police')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  if (n.includes('justice') || n.includes('magistr')) return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M4 9l8 2 8-2M6 15l6 2 6-2"/></svg>
  // default
  return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
}

const APP_URL = 'https://ideal-formation-leaders.pages.dev'

export default function Dashboard() {
  const { user, loading, logout, getToken } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState({ direct: [], professionnel: [] })
  const [prices, setPrices] = useState({ direct: 5000, professionnel: 20000 })
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState('direct')
  const [shareMsg, setShareMsg] = useState('')
  // Admin mode: 'user' pour voir l'app normale, 'admin' pour le panel
  const [adminViewMode, setAdminViewMode] = useState('user')

  const [activeMainTab, setActiveMainTab] = useState('concours')

  const handleShare = async () => {
    const text = `🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n✅ Des milliers de QCM\n✅ Concours directs & professionnels\n✅ 10 questions gratuites sans inscription\n\n👉 ${APP_URL}`
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

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadCategories()
      loadPrices()
    }
  }, [user])

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

  const hasAccess = (type) => {
    if (!user) return false
    if (user.is_admin) return true // Admin a accès à tout
    const sub = user.abonnement_type
    const active = user.subscription_status === 'active'
    const notExpired = !user.abonnement_valide_jusqua || new Date(user.abonnement_valide_jusqua) > new Date()
    return active && notExpired && (sub === type || sub === 'all')
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
              <Link href="/help" className="p-2 text-orange-200 hover:text-white">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </Link>
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
          <div className="mb-5 animate-fadeIn">
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
              style={activeTab === 'professionnel' ? { background: 'linear-gradient(135deg,#0F2D5E,#1D5AB4)', boxShadow: '0 4px 12px rgba(29,90,180,0.3)' } : {}}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
              Professionnels
            </button>
          </div>

          {/* Contenu de l'onglet */}
          {loadingData ? (
            <div className="py-12 text-center"><div className="spinner mx-auto"></div></div>
          ) : (
            /* Tous les utilisateurs connectés voient les dossiers (5 premières questions gratuites) */
            <div className="animate-fadeIn">
              {/* Bannière abonnement si pas d'accès complet */}
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

              {/* Navigation horizontale PRINCIPALE */}
              <HorizontalCategoryScroll categories={catList} locked={false} hasAccess={hasCurrentAccess || user.is_admin} />

              {/* Bouton pour l'autre offre si pas d'accès */}
              {activeTab === 'direct' && !proAccess && !user.is_admin && (
                <div className="mt-6 rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg,#C4521A,#8B2500)' }}>
                  <p className="text-white font-bold mb-1">🎓 Concours Professionnels</p>
                  <p className="text-orange-200 text-sm mb-3">{prices.professionnel.toLocaleString()} FCFA</p>
                  <Link href={`/payment?type=professionnel&montant=${prices.professionnel}`} className="inline-block px-6 py-2.5 bg-white font-bold rounded-xl text-sm" style={{ color: '#C4521A' }}>
                    S'abonner →
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
            </div>
          )}

          {/* Démo gratuite + Aide + Partager */}
          <div className="mt-6 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-amber-800">🎯 Démo gratuite</p>
              <p className="text-amber-700 text-xs mt-0.5">10 questions accessibles maintenant</p>
            </div>
            <Link href="/demo" className="px-4 py-2 font-bold text-white rounded-xl text-sm active:scale-95" style={{ background: '#D4A017' }}>
              Essayer →
            </Link>
          </div>

          {/* Footer liens */}
          <div className="mt-4 flex justify-center gap-4 text-sm flex-wrap">
            <Link href="/help" className="font-semibold text-amber-700 hover:underline">❓ Aide</Link>
            <a href="https://wa.me/22676223962" target="_blank" rel="noopener noreferrer" className="font-semibold text-amber-700 hover:underline">💬 WhatsApp</a>
            <button onClick={handleShare} className="font-semibold hover:underline" style={{ color: '#C4521A' }}>📤 Partager</button>
          </div>
        </div>

        {/* Bouton flottant WhatsApp */}
        <a
          href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20j'ai%20besoin%20d'aide"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed right-4 z-50 w-13 h-13 rounded-full flex items-center justify-center shadow-xl"
          style={{ background: '#25D366', bottom: '88px', width: '52px', height: '52px' }}
          title="WhatsApp Assistance"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
        </a>

        {/* ===== BARRE DE NAVIGATION PRINCIPALE EN BAS ===== */}
        <div className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderTop: '1.5px solid #FFE4CC', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
          <div className="max-w-lg mx-auto flex">
            <Link href="/" className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all text-gray-400">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12L12 3l9 9"/>
                  <path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9"/>
                </svg>
              </div>
              <span className="text-xs font-bold text-gray-400">Accueil</span>
            </Link>
            <button
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all relative"
            >
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }} />
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE0C8)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                  <path d="M4 22h16"/>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
                </svg>
              </div>
              <span className="text-xs font-bold" style={{ color: '#C4521A' }}>Concours</span>
            </button>
            <Link href="/?tab=apropos" className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-all text-gray-400">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
              </div>
              <span className="text-xs font-bold text-gray-400">À propos</span>
            </Link>
          </div>
        </div>

      </div>
    </>
  )
}

/* ===== COMPOSANT NAVIGATION HORIZONTALE ===== */
function HorizontalCategoryScroll({ categories, locked, hasAccess }) {
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
      {/* Indicateur de scroll */}
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs text-gray-400">← Glissez pour voir tous les dossiers →</p>
      </div>
      
      {/* Scroll horizontal */}
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
        {categories.map((cat, i) => (
          <CategoryCard key={cat.id || i} cat={cat} locked={locked} hasAccess={hasAccess} index={i} />
        ))}
      </div>
    </div>
  )
}

function CategoryCard({ cat, locked, hasAccess, index }) {
  const iconSVG = getCatIconSVG(cat.nom)
  
  return (
    <Link
      href={`/quiz/${cat.id}`}
      className="flex-shrink-0 bg-white rounded-2xl border-2 border-amber-100 shadow-md overflow-hidden active:scale-95 transition-all hover:border-orange-300 hover:shadow-lg"
      style={{ scrollSnapAlign: 'start', width: '160px', minWidth: '160px' }}
    >
      <div className="p-4 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'linear-gradient(135deg,#C4521A,#D4A017)' }}>
          {iconSVG}
        </div>
        <p className="text-xs font-bold text-gray-800 leading-tight mb-2 line-clamp-2">{cat.nom}</p>
        <div className="flex items-center justify-center">
          {hasAccess ? (
            <span className="text-xs text-gray-400">{cat.question_count || 0} QCM</span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FFF0E8', color: '#C4521A' }}>
              🆓 5 gratuites
            </span>
          )}
        </div>
      </div>
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }}></div>
    </Link>
  )
}
