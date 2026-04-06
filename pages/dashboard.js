import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

const CATEGORIES_DIRECT = [
  { nom: 'Actualité / Culture générale', icone: '🌍' },
  { nom: 'Français', icone: '📚' },
  { nom: 'Littérature et art', icone: '🎨' },
  { nom: 'Histoire-Géographie', icone: '🗺️' },
  { nom: 'SVT', icone: '🧬' },
  { nom: 'Psychotechniques', icone: '🧠' },
  { nom: 'Maths', icone: '📐' },
  { nom: 'Physique-Chimie', icone: '⚗️' },
  { nom: 'Entraînement QCM', icone: '✏️' },
  { nom: 'Accompagnement final', icone: '🎯' },
]

const CATEGORIES_PRO = [
  { nom: 'Spécialités Vie scolaire (CASU/AASU)', icone: '🏫' },
  { nom: 'Spécialités CISU/AISU/ENAREF', icone: '🏛️' },
  { nom: 'Inspectorat (IES/IEPENF)', icone: '🔍' },
  { nom: 'Agrégés', icone: '🎓' },
  { nom: 'CAPES toutes options', icone: '📖' },
  { nom: 'Administrateur des hôpitaux', icone: '🏥' },
  { nom: 'Spécialités santé', icone: '💊' },
  { nom: 'Spécialités GSP', icone: '🛡️' },
  { nom: 'Spécialités police', icone: '👮' },
  { nom: 'Administrateur civil', icone: '📋' },
  { nom: 'Entraînement QCM', icone: '✏️' },
  { nom: 'Accompagnement final', icone: '🎯' },
]

export default function Dashboard() {
  const { user, loading, logout, getToken } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [progress, setProgress] = useState({})
  const [activeTab, setActiveTab] = useState('direct')
  const [loadingCats, setLoadingCats] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchCategories()
      fetchProgress()
    }
  }, [user])

  const fetchCategories = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/quiz/categories', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (e) {}
    setLoadingCats(false)
  }

  const fetchProgress = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/quiz/progress', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const progressMap = {}
      data.progress?.forEach(p => { progressMap[p.category_id] = p })
      setProgress(progressMap)
    } catch (e) {}
  }

  const hasSubscription = (type) => {
    if (!user) return false
    if (user.is_admin) return true
    if (!user.abonnement_type || !user.abonnement_valide_jusqua) return false
    if (new Date(user.abonnement_valide_jusqua) < new Date()) return false
    return user.abonnement_type === type || user.abonnement_type === 'all'
  }

  const hasDirectSub = hasSubscription('direct')
  const hasProSub = hasSubscription('professionnel')

  const getCategoryByName = (nom) => {
    return categories.find(c => c.nom.toLowerCase().includes(nom.toLowerCase().split(' ')[0]))
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1A4731 0%, #C4521A 100%)' }}>
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-white">Chargement...</p>
        </div>
      </div>
    )
  }

  const displayCats = activeTab === 'direct' ? CATEGORIES_DIRECT : CATEGORIES_PRO
  const hasSub = activeTab === 'direct' ? hasDirectSub : hasProSub
  const subPrice = activeTab === 'direct' ? 5000 : 20000

  return (
    <>
      <Head><title>Mon espace – IFL</title></Head>
      <div className="min-h-screen" style={{ background: '#FFF8F0' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #1A2F20 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="IFL" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '12px' }} />
              <div>
                <p className="text-white font-bold text-sm leading-tight">{user.nom} {user.prenom}</p>
                <p className="text-green-200 text-xs">{user.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user.is_admin && (
                <Link href="/admin" className="px-3 py-1.5 text-xs font-bold text-white rounded-lg" style={{ background: '#C4521A' }}>
                  ⚙️ Admin
                </Link>
              )}
              <button onClick={() => { logout(); router.push('/') }} className="p-2 text-green-200 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Statut abonnement */}
          <div className="mb-6">
            {!hasDirectSub && !hasProSub ? (
              <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4">
                <p className="text-amber-800 font-bold">🔓 Aucun abonnement actif</p>
                <p className="text-amber-700 text-sm mt-1">Abonnez-vous pour accéder aux dossiers de préparation.</p>
                <Link href="/payment" className="inline-block mt-3 px-5 py-2 font-bold text-white rounded-xl text-sm active:scale-95" style={{ background: '#C4521A' }}>
                  Voir les offres →
                </Link>
              </div>
            ) : (
              <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-4">
                <p className="text-green-800 font-bold">✅ Abonnement actif</p>
                <p className="text-green-700 text-sm mt-1">
                  {user.abonnement_type === 'all' ? 'Accès Directs + Professionnels' :
                   user.abonnement_type === 'direct' ? 'Accès Concours Directs' :
                   'Accès Concours Professionnels'}
                  {user.abonnement_valide_jusqua && (
                    <> | Valide jusqu'au {new Date(user.abonnement_valide_jusqua).toLocaleDateString('fr-FR')}</>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Onglets */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'direct' ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
              style={activeTab === 'direct' ? { background: '#1A4731' } : {}}
            >
              📚 Concours Directs
              {hasDirectSub && <span className="ml-1 text-green-300 text-xs">✓</span>}
            </button>
            <button
              onClick={() => setActiveTab('professionnel')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'professionnel' ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
              style={activeTab === 'professionnel' ? { background: '#C4521A' } : {}}
            >
              🎓 Professionnels
              {hasProSub && <span className="ml-1 text-orange-200 text-xs">✓</span>}
            </button>
          </div>

          {/* Prix si pas d'abonnement */}
          {!hasSub && (
            <div className="mb-5 rounded-2xl p-4 text-white text-center" style={{ background: activeTab === 'direct' ? 'linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)' : 'linear-gradient(135deg, #C4521A 0%, #8B2500 100%)' }}>
              <p className="font-extrabold text-3xl">{subPrice.toLocaleString()} FCFA</p>
              <p className="text-sm opacity-80">Accès annuel – {displayCats.length} dossiers</p>
              <Link href={`/payment?type=${activeTab}`} className="inline-block mt-3 px-6 py-2.5 font-bold bg-white rounded-xl text-sm active:scale-95" style={{ color: activeTab === 'direct' ? '#1A4731' : '#C4521A' }}>
                S'abonner maintenant
              </Link>
            </div>
          )}

          {/* Dossiers */}
          <h2 className="text-lg font-extrabold mb-4" style={{ color: '#1A4731' }}>
            {activeTab === 'direct' ? '📚 Dossiers Concours Directs' : '🎓 Dossiers Professionnels'}
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {displayCats.map((cat, i) => {
              const dbCat = getCategoryByName(cat.nom)
              const prog = dbCat ? progress[dbCat.id] : null
              const questionCount = dbCat?.question_count || 0
              
              return (
                <div key={i} className={`rounded-2xl p-4 border-2 transition-all ${hasSub ? 'bg-white border-amber-100 hover:border-amber-300 cursor-pointer active:scale-95' : 'bg-gray-50 border-gray-200'}`}>
                  {hasSub ? (
                    <Link href={dbCat ? `/quiz/${dbCat.id}` : '/payment'} className="block">
                      <div className="text-4xl mb-2">{cat.icone}</div>
                      <p className="text-sm font-bold text-gray-800 leading-tight">{cat.nom}</p>
                      <p className="text-xs text-gray-400 mt-1">{questionCount} question{questionCount !== 1 ? 's' : ''}</p>
                      {prog && prog.total_answered > 0 && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.min(100, Math.round((prog.score / prog.total_answered) * 100))}%` }}></div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{prog.score}/{prog.total_answered}</p>
                        </div>
                      )}
                    </Link>
                  ) : (
                    <>
                      <div className="text-4xl mb-2 opacity-40">{cat.icone}</div>
                      <p className="text-sm font-bold text-gray-400 leading-tight">{cat.nom}</p>
                      <p className="text-xs text-gray-300 mt-1">🔒 Abonnement requis</p>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* CTA paiement Orange Money */}
          {!hasSub && (
            <div className="mt-6 rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF9500 100%)' }}>
              <p className="font-bold text-lg mb-2">📱 Paiement Orange Money</p>
              <p className="text-orange-100 text-sm mb-3">Payez facilement avec votre mobile</p>
              <div className="bg-white/20 rounded-xl p-3 text-sm">
                <p className="font-semibold">📲 Numéro : <span className="text-yellow-200">+226 76 22 39 62</span></p>
                <p className="text-orange-100 mt-1">USSD : <code className="bg-white/20 px-1.5 py-0.5 rounded text-xs">*144*2*1*76223962#</code></p>
                <p className="text-orange-100 mt-1">📸 Envoyez la capture par WhatsApp</p>
              </div>
              <Link href="/payment" className="block mt-3 py-3 text-center font-bold bg-white rounded-xl text-orange-600 active:scale-95 text-sm">
                Demander mon accès
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
