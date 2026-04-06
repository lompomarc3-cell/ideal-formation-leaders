import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'
import { CATEGORIES_DIRECT, CATEGORIES_PRO } from '../lib/data'

export default function Dashboard() {
  const { user, loading, logout, getToken } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [loadingCats, setLoadingCats] = useState(false)
  const [activeTab, setActiveTab] = useState('direct')
  const [prices, setPrices] = useState({ direct: 5000, professionnel: 20000 })
  const [showPayment, setShowPayment] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState('')
  const [requestingSub, setRequestingSub] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchCategories()
      fetchPrices()
    }
  }, [user])

  const fetchCategories = async () => {
    setLoadingCats(true)
    try {
      const token = getToken()
      const res = await fetch('/api/quiz/categories', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.categories) setCategories(data.categories)
    } catch (e) {}
    setLoadingCats(false)
  }

  const fetchPrices = async () => {
    try {
      const res = await fetch('/api/admin/prices')
      const data = await res.json()
      if (data.prices) {
        const p = {}
        data.prices.forEach(pr => p[pr.type_concours] = pr.prix)
        setPrices(p)
      }
    } catch (e) {}
  }

  const requestSubscription = async (type) => {
    setRequestingSub(true)
    setPaymentStatus('')
    try {
      const token = getToken()
      const res = await fetch('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          montant: prices[type],
          type_concours: type,
          numero_paiement: user.phone
        })
      })
      const data = await res.json()
      if (data.success) {
        setPaymentStatus(data.message)
      }
    } catch (e) {
      setPaymentStatus('Erreur lors de la demande.')
    }
    setRequestingSub(false)
  }

  const hasAccess = (type) => {
    if (!user) return false
    if (user.is_admin) return true
    if (!user.abonnement_type) return false
    if (user.abonnement_valide_jusqua && new Date(user.abonnement_valide_jusqua) < new Date()) return false
    return user.abonnement_type === type || user.abonnement_type === 'all'
  }

  const getCats = (type) => {
    const dbCats = categories.filter(c => c.type_concours === type)
    if (dbCats.length > 0) return dbCats
    return (type === 'direct' ? CATEGORIES_DIRECT : CATEGORIES_PRO).map((c, i) => ({
      id: `local-${type}-${i}`,
      ...c,
      type_concours: type
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFF8F0' }}>
        <div className="text-center"><div className="spinner mx-auto"></div></div>
      </div>
    )
  }

  if (!user) return null

  const subExpired = user.abonnement_valide_jusqua && new Date(user.abonnement_valide_jusqua) < new Date()
  const hasDirectAccess = hasAccess('direct')
  const hasProAccess = hasAccess('professionnel')

  return (
    <>
      <Head><title>Tableau de bord – IFL</title></Head>
      <div className="min-h-screen african-pattern" style={{ background: '#FFF8F0' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="IFL" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '12px' }} />
              <div>
                <p className="text-white font-bold leading-tight">Bonjour, {user.prenom} 👋</p>
                <p className="text-green-200 text-xs">{user.abonnement_type ? (subExpired ? '⚠️ Abonnement expiré' : `✅ Abonné ${user.abonnement_type}`) : '🆓 Compte gratuit'}</p>
              </div>
            </div>
            <button onClick={logout} className="text-green-200 hover:text-white p-2 rounded-lg transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Status Card */}
          {!user.is_admin && !user.abonnement_type && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-6">
              <p className="font-bold text-amber-800 text-lg mb-1">📌 Accès au contenu payant</p>
              <p className="text-amber-700 text-sm mb-4">Abonnez-vous pour accéder aux dossiers de préparation</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowPayment('direct')} className="py-3 text-sm font-bold text-white rounded-xl" style={{ background: '#1A4731' }}>
                  Directs: {prices.direct?.toLocaleString()} FCFA
                </button>
                <button onClick={() => setShowPayment('professionnel')} className="py-3 text-sm font-bold text-white rounded-xl" style={{ background: '#C4521A' }}>
                  Pro: {prices.professionnel?.toLocaleString()} FCFA
                </button>
              </div>
            </div>
          )}

          {/* Payment Modal */}
          {showPayment && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4">
              <div className="bg-white rounded-3xl p-6 w-full max-w-md animate-slideIn">
                <h3 className="text-xl font-bold mb-2">
                  {showPayment === 'direct' ? '📚 Concours Directs' : '🎓 Concours Professionnels'}
                </h3>
                <p className="text-3xl font-extrabold mb-4" style={{ color: '#C4521A' }}>
                  {(prices[showPayment] || 0).toLocaleString()} FCFA
                </p>

                {paymentStatus ? (
                  <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-4">
                    <p className="text-green-700 font-medium text-sm">✅ {paymentStatus}</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-5">
                    <div className="om-gradient rounded-xl p-4 text-white">
                      <p className="font-bold text-lg mb-2">📱 Paiement Orange Money</p>
                      <p className="text-sm opacity-90 mb-2">Numéro : <strong>+226 76 22 39 62</strong></p>
                      <p className="text-sm opacity-90 mb-2">Code USSD : <code className="bg-white/20 px-2 py-0.5 rounded">*144*2*1*76223962#</code></p>
                      <p className="text-sm opacity-90">Montant : <strong>{(prices[showPayment] || 0).toLocaleString()} FCFA</strong></p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                      <p className="font-bold mb-1">📸 Étapes :</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Effectuez le paiement Orange Money</li>
                        <li>Prenez une capture d'écran</li>
                        <li>Envoyez sur WhatsApp : <strong>+226 76 22 39 62</strong></li>
                        <li>Indiquez votre numéro : <strong>{user.phone}</strong></li>
                        <li>Cliquez "J'ai payé" ci-dessous</li>
                      </ol>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {!paymentStatus ? (
                    <button
                      onClick={() => requestSubscription(showPayment)}
                      disabled={requestingSub}
                      className="flex-1 py-4 font-bold text-white rounded-xl active:scale-95"
                      style={{ background: '#C4521A' }}
                    >
                      {requestingSub ? 'Envoi...' : "✅ J'ai payé – Notifier l'admin"}
                    </button>
                  ) : (
                    <button
                      onClick={() => { setShowPayment(null); setPaymentStatus('') }}
                      className="flex-1 py-4 font-bold text-white rounded-xl"
                      style={{ background: '#1A4731' }}
                    >
                      Fermer
                    </button>
                  )}
                  {!paymentStatus && (
                    <button onClick={() => setShowPayment(null)} className="px-4 py-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-600">
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden shadow-sm mb-6 border border-gray-200">
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-3 font-bold text-sm transition-all ${activeTab === 'direct' ? 'text-white' : 'text-gray-600 bg-white hover:bg-gray-50'}`}
              style={activeTab === 'direct' ? { background: '#1A4731' } : {}}
            >
              📚 Concours Directs
            </button>
            <button
              onClick={() => setActiveTab('professionnel')}
              className={`flex-1 py-3 font-bold text-sm transition-all ${activeTab === 'professionnel' ? 'text-white' : 'text-gray-600 bg-white hover:bg-gray-50'}`}
              style={activeTab === 'professionnel' ? { background: '#C4521A' } : {}}
            >
              🎓 Concours Pro
            </button>
          </div>

          {/* Access Lock Message */}
          {!hasAccess(activeTab) && !user.is_admin && (
            <div className="mb-4 p-4 rounded-2xl border-2 text-center" style={{ background: activeTab === 'direct' ? '#F0FFF4' : '#FFF5F5', borderColor: activeTab === 'direct' ? '#1A4731' : '#C4521A' }}>
              <p className="text-2xl mb-2">🔒</p>
              <p className="font-bold text-gray-800 mb-1">Accès réservé aux abonnés</p>
              <p className="text-gray-500 text-sm mb-3">
                Abonnement {activeTab === 'direct' ? 'Directs' : 'Professionnels'} : {(prices[activeTab] || 0).toLocaleString()} FCFA/an
              </p>
              <button
                onClick={() => setShowPayment(activeTab)}
                className="px-6 py-3 font-bold text-white rounded-xl active:scale-95"
                style={{ background: activeTab === 'direct' ? '#1A4731' : '#C4521A' }}
              >
                S'abonner maintenant
              </button>
            </div>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-2 gap-3">
            {getCats(activeTab).map((cat, i) => {
              const locked = !hasAccess(activeTab) && !user.is_admin
              return (
                <div
                  key={cat.id || i}
                  onClick={() => !locked && router.push(`/quiz/${cat.id}`)}
                  className={`bg-white rounded-2xl p-4 shadow-md border transition-all ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-95'} ${activeTab === 'direct' ? 'border-green-100' : 'border-orange-100'}`}
                >
                  <div className="text-4xl mb-3">{cat.icone || '📖'}</div>
                  <p className="font-bold text-gray-800 text-sm leading-tight mb-2">{cat.nom}</p>
                  {locked ? (
                    <span className="text-xs text-gray-400">🔒 Abonnement requis</span>
                  ) : (
                    <span className="text-xs font-medium" style={{ color: activeTab === 'direct' ? '#1A4731' : '#C4521A' }}>Accéder →</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Demo CTA */}
          <div className="mt-8 p-5 bg-white rounded-2xl border border-amber-200 shadow-sm text-center">
            <p className="text-gray-600 text-sm mb-2">Vous n'avez pas encore testé la démo ?</p>
            <Link href="/demo" className="inline-block px-5 py-2 font-bold rounded-xl text-sm active:scale-95" style={{ background: '#D4A017', color: 'white' }}>
              🎯 Démo gratuite (10 questions)
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
