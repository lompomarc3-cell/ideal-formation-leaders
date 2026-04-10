import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

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
      <div className="min-h-screen" style={{ background: '#FFF8F0' }}>
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
          <div className="flex gap-2 mb-5 bg-gray-100 rounded-2xl p-1.5">
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'direct' ? 'text-white shadow-md' : 'text-gray-500'}`}
              style={activeTab === 'direct' ? { background: '#C4521A' } : {}}
            >
              📚 Concours Directs
            </button>
            <button
              onClick={() => setActiveTab('professionnel')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'professionnel' ? 'text-white shadow-md' : 'text-gray-500'}`}
              style={activeTab === 'professionnel' ? { background: '#C4521A' } : {}}
            >
              🎓 Professionnels
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
                  <p className="text-orange-200 text-sm mb-3">{prices.professionnel.toLocaleString()} FCFA / an</p>
                  <Link href={`/payment?type=professionnel&montant=${prices.professionnel}`} className="inline-block px-6 py-2.5 bg-white font-bold rounded-xl text-sm" style={{ color: '#C4521A' }}>
                    S'abonner →
                  </Link>
                </div>
              )}
              {activeTab === 'professionnel' && !directAccess && !user.is_admin && (
                <div className="mt-6 rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                  <p className="text-white font-bold mb-1">📚 Concours Directs</p>
                  <p className="text-orange-200 text-sm mb-3">{prices.direct.toLocaleString()} FCFA / an</p>
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
          className="fixed bottom-6 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-50 text-2xl"
          style={{ background: '#25D366' }}
          title="WhatsApp Assistance"
        >
          💬
        </a>
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
  const icone = cat.icone || getCatIcon(cat.nom)
  
  // Tous les dossiers sont cliquables (pour accéder aux 5 questions gratuites)
  return (
    <Link
      href={`/quiz/${cat.id}`}
      className="flex-shrink-0 bg-white rounded-2xl border-2 border-amber-100 shadow-md overflow-hidden active:scale-95 transition-all hover:border-amber-400 hover:shadow-lg"
      style={{
        scrollSnapAlign: 'start',
        width: '180px',
        minWidth: '180px'
      }}
    >
      <div className="p-4 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE0C8)', fontSize: '40px', minHeight: '64px' }}>
          <span style={{ fontSize: '36px' }}>{icone}</span>
        </div>
        <p className="text-sm font-bold text-gray-800 leading-tight mb-2">{cat.nom}</p>
        <div className="flex items-center justify-center gap-1">
          {hasAccess ? (
            <span className="text-xs text-gray-400">{cat.question_count || 0} QCM</span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FFF0E8', color: '#C4521A' }}>
              🆓 5 gratuites
            </span>
          )}
          <span className="text-gray-300 ml-1">›</span>
        </div>
      </div>
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#C4521A,#D4A017)' }}></div>
    </Link>
  )
}

function getCatIcon(nom) {
  const n = (nom || '').toLowerCase()
  if (n.includes('culture') || n.includes('actualit')) return '🌍'
  if (n.includes('français') || n.includes('franc')) return '📚'
  if (n.includes('littérature') || n.includes('art')) return '🎨'
  if (n.includes('histoire') || n.includes('géographie') || n.includes('h-g')) return '🗺️'
  if (n.includes('svt') || n.includes('science')) return '🧬'
  if (n.includes('psycho')) return '🧠'
  if (n.includes('math') || n.includes('match')) return '📐'
  if (n.includes('physique') || n.includes('chimie') || n.includes('pc')) return '⚗️'
  if (n.includes('qcm') || n.includes('entraîn')) return '✏️'
  if (n.includes('accompagn') || n.includes('final')) return '🎯'
  if (n.includes('vie scolaire') || n.includes('casu')) return '🏫'
  if (n.includes('cisu') || n.includes('enaref')) return '🏛️'
  if (n.includes('inspect')) return '🔍'
  if (n.includes('agrég')) return '🎓'
  if (n.includes('capes')) return '📖'
  if (n.includes('hôpital')) return '🏥'
  if (n.includes('santé')) return '💊'
  if (n.includes('gsp')) return '🛡️'
  if (n.includes('police')) return '👮'
  if (n.includes('civil') || n.includes('admin')) return '📋'
  return '📋'
}
