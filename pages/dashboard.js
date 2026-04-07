import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

export default function Dashboard() {
  const { user, loading, logout, getToken } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState({ direct: [], professionnel: [] })
  const [prices, setPrices] = useState({ direct: 5000, professionnel: 20000 })
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState('direct')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (!loading && user?.is_admin) router.push('/admin')
  }, [user, loading, router])

  useEffect(() => {
    if (user && !user.is_admin) {
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
                <p className="text-orange-200 text-xs">{user.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/demo" className="p-2 text-orange-200 hover:text-white">
                <span className="text-xl">🎯</span>
              </Link>
              <button onClick={logout} className="p-2 text-orange-200 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-5">
          {/* Statut abonnement */}
          <div className="mb-5 animate-fadeIn">
            {!directAccess && !proAccess ? (
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
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-bold text-amber-800">Abonnement actif</p>
                    <p className="text-amber-700 text-sm">
                      {user.abonnement_type === 'all' ? 'Accès complet (direct + professionnel)' :
                       user.abonnement_type === 'direct' ? '📚 Concours Directs' : '🎓 Concours Professionnels'}
                    </p>
                    {user.abonnement_valide_jusqua && (
                      <p className="text-amber-600 text-xs mt-0.5">
                        Expire le: {new Date(user.abonnement_valide_jusqua).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Onglets */}
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
          ) : !hasCurrentAccess ? (
            /* Pas d'accès → afficher le verrou */
            <div className="animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-8 text-center mb-5">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-extrabold mb-2" style={{ color: '#8B2500' }}>
                  {activeTab === 'direct' ? 'Concours Directs' : 'Concours Professionnels'}
                </h3>
                <p className="text-gray-500 mb-4">
                  Accédez à {catList.length || (activeTab === 'direct' ? 10 : 12)} dossiers complets avec des milliers de QCM
                </p>
                <p className="text-3xl font-extrabold mb-1" style={{ color: '#C4521A' }}>
                  {currentPrice.toLocaleString()} FCFA
                </p>
                <p className="text-gray-400 text-sm mb-5">par an</p>
                <Link
                  href={`/payment?type=${activeTab}&montant=${currentPrice}`}
                  className="block w-full py-4 text-center text-lg font-bold text-white rounded-xl shadow-lg active:scale-95"
                  style={{ background: activeTab === 'direct' ? '#C4521A' : '#8B2500' }}
                >
                  💳 S'abonner – {currentPrice.toLocaleString()} FCFA
                </Link>
              </div>

              {/* Aperçu des dossiers verrouillés */}
              <h4 className="font-bold text-gray-700 mb-3 text-sm">📂 Dossiers inclus :</h4>
              <div className="grid grid-cols-2 gap-2">
                {catList.map((cat, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-2 opacity-60">
                    <span className="text-2xl">{getCatIcon(cat.nom, activeTab)}</span>
                    <span className="text-xs text-gray-600 font-medium leading-tight">{cat.nom}</span>
                    <span className="ml-auto text-gray-300">🔒</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Accès débloqué → liste des dossiers */
            <div className="animate-fadeIn">
              <p className="text-sm text-gray-500 mb-4">
                🎉 {catList.length} dossier{catList.length > 1 ? 's' : ''} disponible{catList.length > 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 gap-3">
                {catList.map((cat, i) => (
                  <Link
                    key={cat.id}
                    href={`/quiz/${cat.id}`}
                    className="card-african flex items-center gap-4 p-4 active:scale-98"
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ background: '#FFF0E8' }}>
                      {getCatIcon(cat.nom, activeTab)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 leading-tight">{cat.nom}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {cat.question_count || 0} question{(cat.question_count || 0) > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-gray-300 text-xl flex-shrink-0">›</span>
                  </Link>
                ))}
              </div>

              {/* Bouton pour l'autre offre si pas d'accès */}
              {activeTab === 'direct' && !proAccess && (
                <div className="mt-6 rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg,#C4521A,#8B2500)' }}>
                  <p className="text-white font-bold mb-1">🎓 Concours Professionnels</p>
                  <p className="text-orange-200 text-sm mb-3">{prices.professionnel.toLocaleString()} FCFA / an</p>
                  <Link href={`/payment?type=professionnel&montant=${prices.professionnel}`} className="inline-block px-6 py-2.5 bg-white font-bold rounded-xl text-sm" style={{ color: '#C4521A' }}>
                    S'abonner →
                  </Link>
                </div>
              )}
              {activeTab === 'professionnel' && !directAccess && (
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

          {/* Démo gratuite */}
          <div className="mt-6 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between">
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
    </>
  )
}

function getCatIcon(nom, type) {
  const n = nom.toLowerCase()
  if (n.includes('culture') || n.includes('actualit')) return '🌍'
  if (n.includes('français') || n.includes('franc')) return '📚'
  if (n.includes('littérature') || n.includes('art')) return '🎨'
  if (n.includes('histoire') || n.includes('géographie')) return '🗺️'
  if (n.includes('svt') || n.includes('science')) return '🧬'
  if (n.includes('psycho')) return '🧠'
  if (n.includes('math')) return '📐'
  if (n.includes('physique') || n.includes('chimie')) return '⚗️'
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
  return type === 'direct' ? '📚' : '🎓'
}
