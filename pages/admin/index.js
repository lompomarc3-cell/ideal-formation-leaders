import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../_app'
import BulkQCMAdd from '../../components/BulkQCMAdd'

export default function AdminDashboard() {
  const { user, loading, logout, getToken } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [questionsByCategory, setQuestionsByCategory] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [notification, setNotification] = useState({ msg: '', type: '' })

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user?.is_admin) fetchStats()
  }, [user])

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification({ msg: '', type: '' }), 4000)
  }

  const fetchStats = async () => {
    setLoadingStats(true)
    try {
      const token = getToken()
      const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.stats) {
        setStats(data.stats)
        setRecentUsers(data.recentUsers || [])
        setQuestionsByCategory(data.questionsByCategory || [])
      }
    } catch {}
    setLoadingStats(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A0500' }}>
      <div className="text-center"><div className="spinner mx-auto"></div></div>
    </div>
  )
  if (!user?.is_admin) return null

  const tabs = [
    { id: 'dashboard', label: '📊 Stats', icon: '📊' },
    { id: 'payments', label: '💳 Paiements', icon: '💳' },
    { id: 'users', label: '👥 Utilisateurs', icon: '👥' },
    { id: 'questions', label: '❓ QCM', icon: '❓' },
    { id: 'dissertations', label: '📝 Dissertations', icon: '📝' },
    { id: 'categories', label: '📁 Dossiers', icon: '📁' },
    { id: 'schedules', label: '⏰ Programmation', icon: '⏰' },
    { id: 'prices', label: '💰 Prix', icon: '💰' },
    { id: 'promotions', label: '🎯 Promotions', icon: '🎯' },
    { id: 'password', label: '🔑 Mot de passe', icon: '🔑' },
  ]

  return (
    <>
      <Head><title>Admin – IFL</title></Head>
      <div className="min-h-screen" style={{ background: '#1A0500' }}>
        {notification.msg && (
          <div className={`notification ${notification.type}`}>{notification.msg}</div>
        )}

        {/* Header admin */}
        <header style={{ background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div style={{ width: 42, height: 42, borderRadius: 12, overflow: 'hidden' }}>
                <img src="/logo.png" alt="IFL" style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 12 }} />
              </div>
              <div>
                <p className="text-white font-extrabold leading-tight">⚙️ ADMIN IFL</p>
                <p className="text-orange-200 text-xs">{user.nom} {user.prenom}</p>
              </div>
            </div>
            <div className="flex gap-1 items-center">
              <Link href="/dashboard" className="px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all" style={{ background: 'rgba(255,255,255,0.2)' }} title="Voir l'app utilisateur">
                🏠 App
              </Link>
              <button onClick={logout} className="p-2.5 text-orange-200 hover:text-white rounded-lg hover:bg-white/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Onglets de navigation */}
        <div className="max-w-lg mx-auto px-3 py-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveSection(t.id)}
                className={`px-3 py-2 rounded-xl font-semibold text-xs whitespace-nowrap transition-all flex-shrink-0 ${activeSection === t.id ? 'text-white shadow-md' : 'text-gray-400 bg-gray-800 hover:bg-gray-700'}`}
                style={activeSection === t.id ? { background: '#C4521A' } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-10">
          {activeSection === 'dashboard' && <AdminStats stats={stats} recentUsers={recentUsers} questionsByCategory={questionsByCategory} loading={loadingStats} onRefresh={fetchStats} />}
          {activeSection === 'payments' && <AdminPayments getToken={getToken} onNotif={showNotif} />}
          {activeSection === 'users' && <AdminUsers getToken={getToken} onNotif={showNotif} />}
          {activeSection === 'questions' && <AdminQuestions getToken={getToken} onNotif={showNotif} />}
          {activeSection === 'dissertations' && <AdminDissertations getToken={getToken} onNotif={showNotif} />}
          {activeSection === 'categories' && <AdminCategories getToken={getToken} onNotif={showNotif} />}
          {activeSection === 'schedules' && <AdminSchedules getToken={getToken} onNotif={showNotif} />}
          {activeSection === 'prices' && <AdminPrices getToken={getToken} onNotif={showNotif} />}
          {activeSection === 'promotions' && <AdminPromotions getToken={getToken} onNotif={showNotif} />}
          {activeSection === 'password' && <AdminChangePassword getToken={getToken} onNotif={showNotif} user={user} />}
        </div>
      </div>
    </>
  )
}

/* =================== STATS =================== */
function AdminStats({ stats, recentUsers, questionsByCategory, loading, onRefresh }) {
  const [showQByCat, setShowQByCat] = useState(false)
  if (loading) return <div className="py-16 text-center"><div className="spinner mx-auto"></div></div>

  const topCards = [
    { label: 'Utilisateurs', value: stats?.totalUsers || 0, icon: '👥', color: '#C4521A', sub: `${stats?.activeSubscriptions || 0} abonné(s)` },
    { label: 'Paiements en attente', value: stats?.pendingPayments || 0, icon: '⏳', color: stats?.pendingPayments > 0 ? '#D4A017' : '#374151', sub: `${stats?.approvedPayments || 0} validé(s)` },
    { label: 'Abonnés Directs', value: stats?.directSubscribers || 0, icon: '📚', color: '#7C3AED', sub: `Concours directs` },
    { label: 'Abonnés Pro', value: stats?.proSubscribers || 0, icon: '🎓', color: '#0F766E', sub: `Concours professionnels` },
    { label: 'Questions', value: stats?.totalQuestions || 0, icon: '❓', color: '#C4521A', sub: `${stats?.totalCategories || 0} dossiers actifs` },
    { label: 'Dossiers', value: `${stats?.totalDirect || 0} / ${stats?.totalPro || 0}`, icon: '📁', color: '#1D4ED8', sub: `Directs / Professionnels` },
  ]

  const directCats = questionsByCategory.filter(c => c.type === 'direct')
  const proCats = questionsByCategory.filter(c => c.type === 'professionnel')

  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-1">
        <h2 className="text-white text-xl font-bold">📊 Tableau de bord</h2>
        <button onClick={onRefresh} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800">🔄 Actualiser</button>
      </div>

      {/* Cards statistiques */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {topCards.map((c, i) => (
          <div key={i} className="rounded-2xl p-4 text-white" style={{ background: c.color }}>
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-2xl font-extrabold leading-tight">{c.value}</div>
            <div className="text-sm font-semibold mt-0.5 opacity-90">{c.label}</div>
            <div className="text-xs opacity-70 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Questions par dossier */}
      <div className="bg-gray-800 rounded-2xl p-4 mb-5 border border-gray-700">
        <button
          onClick={() => setShowQByCat(!showQByCat)}
          className="w-full flex items-center justify-between text-white font-bold mb-1"
        >
          <span>📁 Questions par dossier</span>
          <span className="text-gray-400 text-sm">{showQByCat ? '▲ Masquer' : '▼ Voir'}</span>
        </button>
        {showQByCat && (
          <div className="mt-3 space-y-3">
            {directCats.length > 0 && (
              <div>
                <p className="text-amber-400 text-xs font-bold mb-2 uppercase tracking-wider">📚 Concours Directs ({directCats.length} dossiers)</p>
                <div className="space-y-1.5">
                  {directCats.map(c => (
                    <div key={c.id} className="flex items-center justify-between bg-gray-700 rounded-xl px-3 py-2">
                      <span className="text-gray-200 text-xs truncate flex-1">{c.nom}</span>
                      <span className="text-amber-400 text-xs font-bold ml-2 flex-shrink-0">{c.question_count} Q</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {proCats.length > 0 && (
              <div>
                <p className="text-emerald-400 text-xs font-bold mb-2 uppercase tracking-wider">🎓 Concours Professionnels ({proCats.length} dossiers)</p>
                <div className="space-y-1.5">
                  {proCats.map(c => (
                    <div key={c.id} className="flex items-center justify-between bg-gray-700 rounded-xl px-3 py-2">
                      <span className="text-gray-200 text-xs truncate flex-1">{c.nom}</span>
                      <span className="text-emerald-400 text-xs font-bold ml-2 flex-shrink-0">{c.question_count} Q</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Derniers inscrits */}
      <h3 className="text-white font-bold mb-3">👤 Derniers inscrits</h3>
      <div className="space-y-2">
        {recentUsers.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-6 text-center text-gray-400">Aucun utilisateur inscrit</div>
        ) : recentUsers.map(u => (
          <div key={u.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between border border-gray-700">
            <div>
              <p className="text-white font-semibold text-sm">{u.prenom} {u.nom}</p>
              <p className="text-gray-400 text-xs">{u.phone}</p>
              {u.created_at && <p className="text-gray-600 text-xs mt-0.5">{new Date(u.created_at).toLocaleDateString('fr-FR')}</p>}
            </div>
            <div className="text-right">
              {u.subscription_status === 'active' ? (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold block mb-1 ${u.abonnement_type === 'direct' ? 'bg-blue-900 text-blue-200' : 'bg-amber-800 text-amber-200'}`}>
                  {u.abonnement_type === 'direct' ? '📚 Directs' : '🎓 Pro'}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs bg-gray-700 text-gray-400 block mb-1">Gratuit</span>
              )}
              {u.abonnement_type === 'professionnel' && u.dossiers_principaux && u.dossiers_principaux.length > 0 && (() => {
                const acc = ['Actualités et culture générale','Entraînement QCM','Accompagnement final']
                const dp = u.dossiers_principaux.filter(d => !acc.includes(d))
                if (dp.length === 0) return null
                if (dp.length >= 14) return <span className="text-xs font-bold block text-right" style={{ color: '#D4A017' }}>🏆 17 dossiers</span>
                return <span className="text-xs text-amber-300 block text-right">{dp.map(d => `🎓 ${d}`).join(', ')}</span>
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* =================== PAIEMENTS =================== */
function AdminPayments({ getToken, onNotif }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchPayments() }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/payments', { headers: { Authorization: `Bearer ${getToken()}` } })
      const d = await r.json()
      setPayments(d.payments || [])
    } catch {}
    setLoading(false)
  }

  const handleValidate = async (payment, valide) => {
    try {
      const r = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ id: payment.id, valide, user_id: payment.user_id, type_concours: payment.type_concours, dossier_principal: payment.dossier_principal || null })
      })
      const d = await r.json()
      if (d.success) { onNotif(d.message, 'success'); fetchPayments() }
      else onNotif(d.error || 'Erreur', 'error')
    } catch {}
  }

  const filtered = filter === 'pending' ? payments.filter(p => !p.valide) : filter === 'validated' ? payments.filter(p => p.valide) : payments

  if (loading) return <div className="py-16 text-center"><div className="spinner mx-auto"></div></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-1">
        <h2 className="text-white text-xl font-bold">💳 Paiements</h2>
        <button onClick={fetchPayments} className="text-gray-400 hover:text-white p-2">🔄</button>
      </div>
      <div className="flex gap-2 mb-4">
        {[['all','Tous'],['pending','En attente'],['validated','Validés']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter === v ? 'text-white' : 'text-gray-400 bg-gray-800'}`} style={filter === v ? { background: '#C4521A' } : {}}>{l}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl p-10 text-center"><p className="text-4xl mb-3">📭</p><p className="text-gray-400">Aucune demande</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-bold">{p.full_name || `${p.prenom || ''} ${p.nom || ''}`.trim() || 'Utilisateur'}</p>
                  <p className="text-gray-400 text-sm">{p.phone}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.valide ? 'bg-green-900 text-green-300' : 'bg-orange-900 text-orange-200'}`}>
                  {p.valide ? '✅ Validé' : '⏳ En attente'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm font-bold">{(p.montant || 0).toLocaleString()} FCFA</span>
                <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-lg text-sm">{p.type_concours === 'direct' ? '📚 Directs' : '🎓 Professionnels'}</span>
                <span className="text-gray-500 text-xs self-center">{p.date_demande ? new Date(p.date_demande).toLocaleDateString('fr-FR') : ''}</span>
              </div>
              {p.type_concours === 'professionnel' && p.dossier_principal && (
                <div className="mb-3 p-2.5 rounded-xl" style={{ background: 'rgba(196,82,26,0.15)', border: '1px solid rgba(196,82,26,0.3)' }}>
                  <p className="text-xs text-orange-300 font-bold">📌 Dossier principal :</p>
                  <p className="text-white font-extrabold text-sm">{p.dossier_principal}</p>
                </div>
              )}
              {p.numero_paiement && <p className="text-gray-400 text-sm mb-3">📱 {p.numero_paiement}</p>}
              {!p.valide && (
                <div className="flex gap-2">
                  <button onClick={() => handleValidate(p, true)} className="flex-1 py-3 font-bold text-white rounded-xl text-sm active:scale-95" style={{ background: '#C4521A' }}>✅ Valider & Activer</button>
                  <button onClick={() => handleValidate(p, false)} className="px-4 py-3 font-bold text-white rounded-xl text-sm active:scale-95" style={{ background: '#8B0000' }}>❌ Rejeter</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* =================== UTILISATEURS =================== */
function AdminUsers({ getToken, onNotif }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${getToken()}` } })
      const d = await r.json()
      setUsers(d.users || [])
    } catch {}
    setLoading(false)
  }

  const updateUser = async (updates) => {
    try {
      // Extraire dossier_principal si format "professionnel:xxx"
      let cleanType = updates.abonnement_type
      let dossierPrincipal = null
      if (cleanType && cleanType.startsWith('professionnel:')) {
        dossierPrincipal = cleanType.substring('professionnel:'.length)
        cleanType = 'professionnel'
      }

      const apiPayload = {
        id: updates.id,
        subscription_type: cleanType || null,
        subscription_status: cleanType ? 'active' : 'free',
        subscription_expires_at: updates.abonnement_valide_jusqua || null,
        dossier_principal: dossierPrincipal,
        is_active: updates.is_active
      }
      const r = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(apiPayload)
      })
      const d = await r.json()
      if (d.user || d.success) { onNotif('✅ Utilisateur mis à jour', 'success'); fetchUsers(); setEditId(null) }
      else onNotif(d.error || 'Erreur', 'error')
    } catch {}
  }

  const deleteUser = async (u) => {
    const ok = typeof window !== 'undefined' && window.confirm(
      `⚠️ Supprimer définitivement l'utilisateur ${u.prenom || ''} ${u.nom || ''} (${u.phone || ''}) ?\n\n` +
      `Cette action est IRRÉVERSIBLE. Toutes les données associées (paiements, progression) seront supprimées.`
    )
    if (!ok) return
    try {
      const r = await fetch(`/api/admin/users?id=${encodeURIComponent(u.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const d = await r.json()
      if (d.success) { onNotif('🗑️ Utilisateur supprimé', 'success'); fetchUsers() }
      else onNotif(d.error || 'Erreur lors de la suppression', 'error')
    } catch {
      onNotif('Erreur réseau', 'error')
    }
  }

  if (loading) return <div className="py-16 text-center"><div className="spinner mx-auto"></div></div>

  const nonAdminUsers = users.filter(u => !u.is_admin)
  const filtered = search ? nonAdminUsers.filter(u => `${u.prenom} ${u.nom} ${u.phone}`.toLowerCase().includes(search.toLowerCase())) : nonAdminUsers

  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-1">
        <h2 className="text-white text-xl font-bold">👥 Utilisateurs ({nonAdminUsers.length})</h2>
        <button onClick={fetchUsers} className="text-gray-400 hover:text-white p-2">🔄</button>
      </div>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Rechercher par nom ou téléphone..."
        className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm border border-gray-700 mb-4 focus:outline-none focus:border-amber-500"
      />
      <div className="space-y-3">
        {filtered.map(u => (
          <div key={u.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-white font-bold">{u.prenom} {u.nom}</p>
                <p className="text-gray-400 text-sm">{u.phone}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {u.abonnement_type ? (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-800 text-orange-300">
                      {u.abonnement_type === 'direct' ? '📚 Concours directs (12 dossiers)' : u.abonnement_type === 'professionnel' ? '🎓 Professionnel' : '🎯 Tout'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400">Gratuit</span>
                  )}
                  {u.abonnement_type === 'professionnel' && (() => {
                    const acc = ['Actualités et culture générale','Entraînement QCM','Accompagnement final']
                    const dp = (u.dossiers_principaux || []).filter(d => !acc.includes(d))
                    if (dp.length >= 14) return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'linear-gradient(135deg,#8B2500,#D4A017)', color: 'white' }}>
                        🏆 Accès complet (17 dossiers)
                      </span>
                    )
                    if (dp.length > 0) return (
                      <div className="flex flex-wrap gap-1">
                        {dp.map((d, i) => (
                          <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'linear-gradient(135deg,#C4521A,#D4A017)', color: 'white' }}>🎓 {d}</span>
                        ))}
                      </div>
                    )
                    return <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400">Accompagnements inclus</span>
                  })()}
                </div>
              </div>
              <div className="ml-3 flex flex-col gap-1.5">
                <button
                  onClick={() => setEditId(editId === u.id ? null : u.id)}
                  className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm"
                  title="Modifier l'abonnement"
                >✏️</button>
                <button
                  onClick={() => deleteUser(u)}
                  className="p-2 rounded-lg bg-red-900 text-red-200 hover:bg-red-800 text-sm"
                  title="Supprimer l'utilisateur"
                >🗑️</button>
              </div>
            </div>
            {editId === u.id && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <UserEditForm user={u} onSave={updateUser} onCancel={() => setEditId(null)} />
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
            <p className="text-3xl mb-2">👥</p>
            <p>{search ? 'Aucun résultat pour cette recherche' : 'Aucun utilisateur inscrit'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

const SPECIALITES_PRO = [
  'Spécialités Vie scolaire (CASU-AASU)',
  'Spécialités CISU/AISU/ENAREF',
  'Inspectorat : IES',
  'Inspectorat : IEPENF',
  'CSAPÉ',
  'Agrégés',
  'CAPES toutes options',
  'Administrateur des hôpitaux',
  'Spécialités santé',
  'Justice',
  'Magistrature',
  'Spécialités GSP',
  'Spécialités police',
  'Administrateur civil'
]

function UserEditForm({ user, onSave, onCancel }) {
  const getCurrentDossier = () => {
    const t = user.abonnement_type || ''
    if (t.startsWith('professionnel:')) return t.substring('professionnel:'.length)
    return ''
  }
  const getCurrentType = () => {
    const t = user.abonnement_type || ''
    if (t.startsWith('professionnel:')) return 'professionnel'
    return t
  }

  const [form, setForm] = useState({
    id: user.id,
    abonnement_type: getCurrentType(),
    dossier_principal: getCurrentDossier(),
    abonnement_valide_jusqua: user.abonnement_valide_jusqua ? new Date(user.abonnement_valide_jusqua).toISOString().split('T')[0] : '',
    is_active: true
  })

  const buildSubscriptionType = () => {
    if (form.abonnement_type === 'professionnel' && form.dossier_principal) return `professionnel:${form.dossier_principal}`
    return form.abonnement_type
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-gray-400 text-xs mb-1 block">Type d'abonnement</label>
        <select value={form.abonnement_type} onChange={e => setForm(p => ({ ...p, abonnement_type: e.target.value, dossier_principal: '' }))}
          className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm">
          <option value="">Aucun abonnement</option>
          <option value="direct">📚 Concours Directs (5 000 FCFA)</option>
          <option value="professionnel">🎓 Concours Professionnels (20 000 FCFA)</option>
          <option value="all">🎯 Les deux</option>
        </select>
      </div>
      {form.abonnement_type === 'professionnel' && (
        <div>
          <label className="text-gray-400 text-xs mb-1 block">📌 Dossier principal</label>
          <select value={form.dossier_principal} onChange={e => setForm(p => ({ ...p, dossier_principal: e.target.value }))}
            className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm">
            <option value="">-- Sélectionner --</option>
            {SPECIALITES_PRO.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="text-gray-400 text-xs mb-1 block">Date d&apos;activation (optionnel, usage interne)</label>
        <input type="date" value={form.abonnement_valide_jusqua}
          onChange={e => setForm(p => ({ ...p, abonnement_valide_jusqua: e.target.value }))}
          className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave({ ...form, abonnement_type: buildSubscriptionType(), abonnement_valide_jusqua: form.abonnement_valide_jusqua ? new Date(form.abonnement_valide_jusqua).toISOString() : null })}
          className="flex-1 py-2.5 font-bold text-white rounded-xl text-sm active:scale-95" style={{ background: '#C4521A' }}>
          ✅ Sauvegarder
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 bg-gray-700 text-gray-300 rounded-xl text-sm">Annuler</button>
      </div>
    </div>
  )
}

/* =================== QUESTIONS =================== */
function AdminQuestions({ getToken, onNotif }) {
  const [questions, setQuestions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [editQ, setEditQ] = useState(null)
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchCategories(); fetchQuestions() }, [])

  const fetchCategories = async () => {
    try {
      const r = await fetch('/api/quiz/categories', { headers: { Authorization: `Bearer ${getToken()}` } })
      const d = await r.json()
      setCategories(d.categories || [])
    } catch {}
  }

  const fetchQuestions = async (catId = '') => {
    setLoading(true)
    try {
      const url = catId ? `/api/admin/questions?categorie_id=${catId}` : '/api/admin/questions'
      const r = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
      const d = await r.json()
      setQuestions(d.questions || [])
    } catch {}
    setLoading(false)
  }

  const saveQuestion = async (formData) => {
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const r = await fetch('/api/admin/questions', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(formData)
      })
      const d = await r.json()
      if (d.success || d.question) {
        onNotif(formData.id ? '✅ Question modifiée' : '✅ Question ajoutée', 'success')
        setShowForm(false); setEditQ(null)
        fetchQuestions(filterCat)
      } else onNotif(d.error || 'Erreur', 'error')
    } catch {}
  }

  const deleteQuestion = async (id) => {
    if (!confirm('Supprimer cette question ?')) return
    try {
      await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })
      onNotif('🗑️ Question supprimée', 'info')
      fetchQuestions(filterCat)
    } catch {}
  }

  const filtered = search ? questions.filter(q => q.question_text?.toLowerCase().includes(search.toLowerCase())) : questions

  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-1">
        <h2 className="text-white text-xl font-bold">❓ QCM ({questions.length})</h2>
        <div className="flex gap-2">
          <button onClick={() => { setShowBulkAdd(true); setShowForm(false); setEditQ(null) }}
            className="px-3 py-2 font-bold text-white rounded-xl text-xs active:scale-95" style={{ background: '#D4A017' }}>
            📦 Massif
          </button>
          <button onClick={() => { setShowForm(true); setShowBulkAdd(false); setEditQ(null) }}
            className="px-3 py-2 font-bold text-white rounded-xl text-xs active:scale-95" style={{ background: '#C4521A' }}>
            ➕ Ajouter
          </button>
        </div>
      </div>

      <select value={filterCat} onChange={e => { setFilterCat(e.target.value); fetchQuestions(e.target.value); setSearch('') }}
        className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 mb-3 text-sm border border-gray-700">
        <option value="">📂 Toutes les catégories</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.type === 'direct' ? '📚' : '🎓'} {c.nom}</option>)}
      </select>

      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Rechercher dans les questions..."
        className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm border border-gray-700 mb-4 focus:outline-none focus:border-amber-500" />

      {showBulkAdd && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-bold text-lg">📦 Ajout Massif</h3>
            <button onClick={() => setShowBulkAdd(false)} className="text-gray-400 hover:text-white text-sm">✕ Fermer</button>
          </div>
          <BulkQCMAdd token={getToken()} onSuccess={() => { setShowBulkAdd(false); fetchQuestions(filterCat); onNotif('✅ Questions ajoutées', 'success') }} />
        </div>
      )}
      {(showForm || editQ) && (
        <QuestionForm initial={editQ} categories={categories} onSave={saveQuestion} onCancel={() => { setShowForm(false); setEditQ(null) }} />
      )}
      {loading ? <div className="py-8 text-center"><div className="spinner mx-auto"></div></div> : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">❓</p>
              <p>{search ? 'Aucun résultat' : 'Aucune question'}</p>
            </div>
          ) : filtered.map(q => (
            <div key={q.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-white text-sm font-medium mb-3 leading-relaxed">{q.question_text}</p>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {['A','B','C','D'].map(opt => (
                  <p key={opt} className={`text-xs rounded-lg px-2 py-1.5 ${q.bonne_reponse === opt ? 'bg-amber-800 text-amber-200 font-bold' : 'bg-gray-700 text-gray-400'}`}>
                    <span className="font-bold">{opt}:</span> {q[`option_${opt.toLowerCase()}`]}
                  </p>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 truncate max-w-[60%]">{q.categorie_nom}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditQ(q); setShowForm(false); setShowBulkAdd(false) }} className="text-amber-400 hover:text-amber-300 p-1 rounded hover:bg-gray-700">✏️</button>
                  <button onClick={() => deleteQuestion(q.id)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-700">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function QuestionForm({ initial, categories, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    categorie_id: '', question_text: '', option_a: '', option_b: '',
    option_c: '', option_d: '', bonne_reponse: 'A', explication: ''
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="bg-gray-800 rounded-2xl p-5 mb-4 border border-amber-800">
      <h3 className="text-white font-bold mb-4">{initial ? '✏️ Modifier la question' : '➕ Nouvelle question'}</h3>
      <div className="space-y-3">
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Catégorie *</label>
          <select value={form.categorie_id || form.category_id || ''} onChange={e => set('categorie_id', e.target.value)}
            className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm" required>
            <option value="">Choisir une catégorie</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.type === 'direct' ? '📚' : '🎓'} {c.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Question *</label>
          <textarea value={form.question_text} onChange={e => set('question_text', e.target.value)}
            className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm min-h-[80px]"
            placeholder="Texte de la question..." required />
        </div>
        {['a','b','c','d'].map(opt => (
          <div key={opt}>
            <label className="text-gray-400 text-xs mb-1 block">Option {opt.toUpperCase()} *</label>
            <input type="text" value={form[`option_${opt}`]} onChange={e => set(`option_${opt}`, e.target.value)}
              className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm"
              placeholder={`Réponse ${opt.toUpperCase()}`} required />
          </div>
        ))}
        <div>
          <label className="text-gray-400 text-xs mb-1.5 block">Bonne réponse *</label>
          <div className="flex gap-2">
            {['A','B','C','D'].map(opt => (
              <button key={opt} type="button" onClick={() => set('bonne_reponse', opt)}
                className={`flex-1 py-3 font-extrabold rounded-xl text-sm transition-all ${form.bonne_reponse === opt ? 'text-white' : 'bg-gray-700 text-gray-400'}`}
                style={form.bonne_reponse === opt ? { background: '#D4A017' } : {}}>
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Explication</label>
          <textarea value={form.explication} onChange={e => set('explication', e.target.value)}
            className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm min-h-[80px]"
            placeholder="Explication détaillée..." />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => onSave(form)} className="flex-1 py-3.5 font-bold text-white rounded-xl active:scale-95" style={{ background: '#C4521A' }}>
            {initial ? '💾 Modifier' : '➕ Ajouter'}
          </button>
          <button onClick={onCancel} className="px-5 py-3.5 bg-gray-700 text-gray-300 rounded-xl font-semibold">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* =================== DOSSIERS (CATÉGORIES) =================== */
function AdminCategories({ getToken, onNotif }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editCat, setEditCat] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${getToken()}` } })
      const d = await r.json()
      setCategories(d.categories || [])
    } catch {}
    setLoading(false)
  }

  const saveCategory = async (formData) => {
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const r = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(formData)
      })
      const d = await r.json()
      if (d.success) {
        onNotif(formData.id ? '✅ Dossier modifié' : '✅ Dossier créé', 'success')
        setShowForm(false); setEditCat(null)
        fetchCategories()
      } else onNotif(d.error || 'Erreur', 'error')
    } catch {}
  }

  const handleDelete = async (cat, force = false) => {
    try {
      const url = `/api/admin/categories?id=${cat.id}${force ? '&force=true' : ''}`
      const r = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })
      const d = await r.json()
      if (d.success) {
        onNotif(`🗑️ Dossier supprimé${d.deletedQuestions > 0 ? ` (${d.deletedQuestions} questions supprimées)` : ''}`, 'info')
        setConfirmDelete(null)
        fetchCategories()
      } else if (d.requiresConfirmation) {
        setConfirmDelete({ cat, count: d.questionCount })
      } else {
        onNotif(d.error || 'Erreur', 'error')
        setConfirmDelete(null)
      }
    } catch {}
  }

  const filtered = filterType === 'all' ? categories : categories.filter(c => c.type === filterType)
  const activeFiltered = filtered.filter(c => c.is_active)
  const directCount = categories.filter(c => c.type === 'direct' && c.is_active).length
  const proCount = categories.filter(c => c.type === 'professionnel' && c.is_active).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-1">
        <h2 className="text-white text-xl font-bold">📁 Dossiers ({activeFiltered.length})</h2>
        <div className="flex gap-2">
          <button onClick={fetchCategories} className="text-gray-400 hover:text-white p-2">🔄</button>
          <button onClick={() => { setShowForm(true); setEditCat(null) }}
            className="px-3 py-2 font-bold text-white rounded-xl text-xs active:scale-95" style={{ background: '#C4521A' }}>
            ➕ Nouveau
          </button>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
          <p className="text-2xl font-extrabold text-amber-400">{directCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">📚 Dossiers Directs</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
          <p className="text-2xl font-extrabold text-emerald-400">{proCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">🎓 Dossiers Pro</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[['all','Tous'],['direct','📚 Directs'],['professionnel','🎓 Pro']].map(([v,l]) => (
          <button key={v} onClick={() => setFilterType(v)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterType === v ? 'text-white' : 'text-gray-400 bg-gray-800'}`} style={filterType === v ? { background: '#C4521A' } : {}}>{l}</button>
        ))}
      </div>

      {(showForm || editCat) && (
        <CategoryForm initial={editCat} onSave={saveCategory} onCancel={() => { setShowForm(false); setEditCat(null) }} />
      )}

      {/* Modal de confirmation de suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-red-800">
            <p className="text-white font-bold text-lg mb-2">⚠️ Confirmer la suppression</p>
            <p className="text-gray-300 text-sm mb-1">Dossier : <strong className="text-white">{confirmDelete.cat.nom}</strong></p>
            <p className="text-red-400 text-sm mb-4">Ce dossier contient <strong>{confirmDelete.count} question(s)</strong>. Toutes seront supprimées.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDelete.cat, true)}
                className="flex-1 py-3 font-bold text-white rounded-xl text-sm" style={{ background: '#8B0000' }}>
                🗑️ Supprimer tout
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-3 bg-gray-700 text-gray-300 rounded-xl text-sm">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="py-8 text-center"><div className="spinner mx-auto"></div></div> : (
        <div className="space-y-2.5">
          {activeFiltered.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">📁</p>
              <p>Aucun dossier pour cette catégorie</p>
            </div>
          ) : activeFiltered.map(c => (
            <div key={c.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.type === 'direct' ? 'bg-amber-900 text-amber-300' : 'bg-emerald-900 text-emerald-300'}`}>
                      {c.type === 'direct' ? '📚 Direct' : '🎓 Pro'}
                    </span>

                  </div>
                  <p className="text-white font-semibold text-sm">{c.nom}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-amber-400">{c.question_count_real !== undefined ? c.question_count_real : c.question_count || 0} questions</span>
                    {c.prix && <span className="text-xs text-gray-400">{c.prix.toLocaleString()} FCFA</span>}
                  </div>
                </div>
                <div className="flex gap-2 ml-3">
                  <button onClick={() => { setEditCat(c); setShowForm(false) }} className="p-2 rounded-lg bg-gray-700 text-amber-400 hover:bg-gray-600 text-sm">✏️</button>
                  <button onClick={() => handleDelete(c)} className="p-2 rounded-lg bg-gray-700 text-red-400 hover:bg-gray-600 text-sm">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? {
    id: initial.id,
    nom: initial.nom || '',
    type: initial.type || 'direct',
    description: initial.description || '',
  } : {
    nom: '', type: 'direct', description: ''
  })

  // Icônes modernes SVG multicolores (clé → chemin image)
  const ICONES_SVG = [
    { key: 'book', src: '/icons/direct_book.svg', label: 'Livre' },
    { key: 'globe', src: '/icons/direct_globe.svg', label: 'Globe' },
    { key: 'palette', src: '/icons/direct_palette.svg', label: 'Art' },
    { key: 'map', src: '/icons/direct_map.svg', label: 'Carte' },
    { key: 'leaf', src: '/icons/direct_leaf.svg', label: 'SVT' },
    { key: 'brain', src: '/icons/direct_brain.svg', label: 'Psycho' },
    { key: 'calculator', src: '/icons/direct_calculator.svg', label: 'Maths' },
    { key: 'flask', src: '/icons/direct_flask.svg', label: 'Physique' },
    { key: 'scale', src: '/icons/direct_scale.svg', label: 'Droit' },
    { key: 'chart', src: '/icons/direct_chart.svg', label: 'Économie' },
    { key: 'pencil', src: '/icons/direct_pencil.svg', label: 'QCM' },
    { key: 'target', src: '/icons/direct_target.svg', label: 'Objectif' },
    { key: 'school', src: '/icons/pro_school.svg', label: 'École' },
    { key: 'newspaper', src: '/icons/pro_newspaper.svg', label: 'Actu' },
    { key: 'building', src: '/icons/pro_building.svg', label: 'Admin' },
    { key: 'search', src: '/icons/pro_search.svg', label: 'Inspect.' },
    { key: 'search2', src: '/icons/pro_search2.svg', label: 'Inspect.2' },
    { key: 'graduation', src: '/icons/pro_graduation.svg', label: 'Diplôme' },
    { key: 'scroll', src: '/icons/pro_scroll.svg', label: 'Parchemin' },
    { key: 'openbook', src: '/icons/pro_openbook.svg', label: 'Ouvrage' },
    { key: 'hospital', src: '/icons/pro_hospital.svg', label: 'Hôpital' },
    { key: 'health', src: '/icons/pro_health.svg', label: 'Santé' },
    { key: 'justice', src: '/icons/pro_justice.svg', label: 'Justice' },
    { key: 'judge', src: '/icons/pro_judge.svg', label: 'Magistr.' },
    { key: 'shield', src: '/icons/pro_shield.svg', label: 'Sécurité' },
    { key: 'badge', src: '/icons/pro_badge.svg', label: 'Police' },
    { key: 'clipboard', src: '/icons/pro_clipboard.svg', label: 'Admin civil' },
  ]
  const [selectedIcon, setSelectedIcon] = useState('book')

  return (
    <div className="bg-gray-800 rounded-2xl p-5 mb-4 border border-amber-800">
      <h3 className="text-white font-bold mb-4">{initial ? '✏️ Modifier le dossier' : '➕ Nouveau dossier'}</h3>
      <div className="space-y-3">
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Nom du dossier *</label>
          <input type="text" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
            className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm"
            placeholder="Ex: Droit administratif" required />
        </div>
        {!initial && (
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Type *</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm">
              <option value="direct">📚 Concours Directs</option>
              <option value="professionnel">🎓 Concours Professionnels</option>
            </select>
          </div>
        )}
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Description</label>
          <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm"
            placeholder="Description courte (optionnel)" />
        </div>
        {!initial && (
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Icône du dossier (icônes modernes)</label>
            <div className="flex flex-wrap gap-2">
              {ICONES_SVG.map(ic => (
                <button key={ic.key} type="button" onClick={() => setSelectedIcon(ic.key)}
                  title={ic.label}
                  className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all gap-0.5 ${selectedIcon === ic.key ? 'ring-2 ring-amber-400' : 'bg-gray-700'}`}
                  style={selectedIcon === ic.key ? { background: 'rgba(255,255,255,0.15)' } : {}}>
                  <img src={ic.src} alt={ic.label} width="28" height="28" style={{ objectFit: 'contain' }} />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {selectedIcon && ICONES_SVG.find(i => i.key === selectedIcon) && (
                <>
                  <img src={ICONES_SVG.find(i => i.key === selectedIcon).src} alt="" width="24" height="24" style={{ objectFit: 'contain' }} />
                  <p className="text-gray-400 text-xs">Icône sélectionnée : <span className="text-white font-bold">{ICONES_SVG.find(i => i.key === selectedIcon)?.label}</span></p>
                </>
              )}
            </div>
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={() => onSave({ ...form, icone: selectedIcon })}
            className="flex-1 py-3.5 font-bold text-white rounded-xl active:scale-95" style={{ background: '#C4521A' }}>
            {initial ? '💾 Modifier' : '➕ Créer'}
          </button>
          <button onClick={onCancel} className="px-5 py-3.5 bg-gray-700 text-gray-300 rounded-xl font-semibold">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* =================== PRIX =================== */
function AdminPrices({ getToken, onNotif }) {
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPrices() }, [])

  const fetchPrices = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/prices', { headers: { Authorization: `Bearer ${getToken()}` } })
      const d = await r.json()
      setPrices(d.prices || [])
    } catch {}
    setLoading(false)
  }

  const updatePrice = async (type_concours, prix) => {
    try {
      const r = await fetch('/api/admin/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ type_concours, prix: parseInt(prix) })
      })
      const d = await r.json()
      if (d.success) { onNotif(d.message || '✅ Prix mis à jour', 'success'); fetchPrices() }
      else onNotif(d.error || 'Erreur', 'error')
    } catch {}
  }

  if (loading) return <div className="py-8 text-center"><div className="spinner mx-auto"></div></div>

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-2 mt-1">💰 Configuration des prix</h2>
      <p className="text-gray-400 text-sm mb-5">Les prix sont définis par l&apos;administrateur. Aucune durée n&apos;est affichée.</p>
      <div className="space-y-4">
        {prices.map(p => <PriceEditor key={p.id} price={p} onSave={updatePrice} />)}
      </div>
    </div>
  )
}

function PriceEditor({ price, onSave }) {
  // Le prix « actuel/normal » à afficher : si l'API renvoie prix_normal, on le préfère ;
  // sinon on retombe sur price.prix (qui peut être le prix promo si une promo est active).
  const normalPrice = price.prix_normal != null ? price.prix_normal : price.prix
  const [prix, setPrix] = useState(normalPrice)
  const [saved, setSaved] = useState(false)
  const hasActivePromo = !!price.promo_active && price.prix_promo != null
  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
      <p className="text-white font-bold mb-1">
        {price.type_concours === 'direct' ? '📚 Concours Directs' : '🎓 Concours Professionnels'}
      </p>
      <p className="text-gray-400 text-sm mb-3">
        Prix normal : <span className="text-amber-400 font-bold">{(normalPrice || 0).toLocaleString()} FCFA</span>
      </p>
      {hasActivePromo && (
        <div className="rounded-xl p-3 mb-3" style={{ background: 'linear-gradient(135deg,#7c2d12,#9a3412)' }}>
          <p className="text-amber-200 text-xs font-bold mb-1">🎯 PROMOTION EN COURS</p>
          <p className="text-white text-sm">
            Prix promo actif : <span className="font-extrabold text-amber-300">{(price.prix_promo || 0).toLocaleString()} FCFA</span>
          </p>
          {price.promo_date_fin && (
            <p className="text-amber-200 text-xs mt-1">
              Jusqu'au {new Date(price.promo_date_fin).toLocaleString('fr-FR')}
            </p>
          )}
        </div>
      )}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-gray-400 text-xs mb-1 block">Nouveau prix normal (FCFA)</label>
          <input type="number" value={prix} onChange={e => { setPrix(e.target.value); setSaved(false) }}
            className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 text-lg font-bold" min="100" />
        </div>
        <button onClick={async () => { await onSave(price.type_concours, prix); setSaved(true) }}
          className="px-5 py-3 font-bold text-white rounded-xl active:scale-95 self-end"
          style={{ background: saved ? '#16a34a' : '#D4A017' }}>
          {saved ? '✅' : '💾'}
        </button>
      </div>
    </div>
  )
}

/* =================== PROMOTIONS (PHASE 2) =================== */
function AdminPromotions({ getToken, onNotif }) {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPromo, setEditPromo] = useState(null)
  const [tableMissing, setTableMissing] = useState(false)

  useEffect(() => { fetchPromotions() }, [])

  const fetchPromotions = async () => {
    setLoading(true)
    setTableMissing(false)
    try {
      const r = await fetch('/api/admin/promotions', { headers: { Authorization: `Bearer ${getToken()}` } })
      const d = await r.json()
      if (d.error && /promotions.*introuvable|exécutez.*sql/i.test(d.error)) {
        setTableMissing(true)
        setPromotions([])
      } else {
        setPromotions(d.promotions || [])
      }
    } catch {}
    setLoading(false)
  }

  const savePromotion = async (formData) => {
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const r = await fetch('/api/admin/promotions', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(formData)
      })
      const d = await r.json()
      if (d.success || d.promotion) {
        onNotif(formData.id ? '✅ Promotion modifiée' : '✅ Promotion créée', 'success')
        setShowForm(false); setEditPromo(null)
        fetchPromotions()
      } else {
        onNotif(d.error || 'Erreur', 'error')
      }
    } catch {
      onNotif('Erreur réseau', 'error')
    }
  }

  const togglePromotion = async (p) => {
    try {
      const r = await fetch('/api/admin/promotions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ id: p.id, is_active: !p.is_active })
      })
      const d = await r.json()
      if (d.success) {
        onNotif(p.is_active ? '🚫 Promotion désactivée' : '✅ Promotion activée', 'success')
        fetchPromotions()
      } else onNotif(d.error || 'Erreur', 'error')
    } catch {}
  }

  const deletePromotion = async (id) => {
    if (!confirm('Supprimer définitivement cette promotion ?')) return
    try {
      await fetch(`/api/admin/promotions?id=${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` }
      })
      onNotif('🗑️ Promotion supprimée', 'info')
      fetchPromotions()
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-1">
        <h2 className="text-white text-xl font-bold">🎯 Promotions ({promotions.length})</h2>
        <button onClick={() => { setShowForm(true); setEditPromo(null) }}
          className="px-3 py-2 font-bold text-white rounded-xl text-xs active:scale-95" style={{ background: '#C4521A' }}>
          ➕ Nouvelle promotion
        </button>
      </div>

      <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-3 mb-4 text-xs text-amber-200">
        💡 Lancez des promotions sur les prix (Concours directs et/ou professionnels). Pendant la période active, le prix barré et le prix promo s'afficheront automatiquement dans l'application.
      </div>

      {tableMissing && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-4 text-sm text-red-200">
          ⚠️ <strong>Table "promotions" introuvable.</strong>
          <p className="mt-2 text-xs">Exécutez le fichier <code className="bg-black/30 px-1.5 py-0.5 rounded">SQL_PROMOTIONS_PHASE2.sql</code> dans le SQL Editor Supabase pour créer la table.</p>
          <a href="https://app.supabase.com/project/cyasoaihjjochwhnhwqf/sql/new" target="_blank" rel="noopener noreferrer"
            className="mt-2 inline-block px-3 py-1.5 bg-red-700 text-white rounded-lg text-xs font-bold">
            🔗 Ouvrir SQL Editor Supabase
          </a>
        </div>
      )}

      {(showForm || editPromo) && (
        <PromotionForm
          initial={editPromo}
          onSave={savePromotion}
          onCancel={() => { setShowForm(false); setEditPromo(null) }}
        />
      )}

      {loading ? <div className="py-8 text-center"><div className="spinner mx-auto"></div></div> : (
        <div className="space-y-3">
          {promotions.length === 0 && !tableMissing ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">🎯</p>
              <p>Aucune promotion pour le moment</p>
              <p className="text-xs text-gray-500 mt-2">Cliquez sur "Nouvelle promotion" pour en créer une.</p>
            </div>
          ) : promotions.map(p => {
            const isActiveNow = p.is_currently_active
            const dateDebut = new Date(p.date_debut).toLocaleString('fr-FR')
            const dateFin = new Date(p.date_fin).toLocaleString('fr-FR')
            const expired = new Date(p.date_fin) < new Date()
            return (
              <div key={p.id} className={`bg-gray-800 rounded-xl p-4 border ${isActiveNow ? 'border-green-600' : expired ? 'border-gray-700 opacity-60' : 'border-amber-700'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-white font-bold">
                      {p.type_concours === 'direct' ? '📚 Concours Directs' : '🎓 Concours Professionnels'}
                    </p>
                    <p className="text-2xl font-extrabold mt-1" style={{ color: '#D4A017' }}>
                      {(p.prix_promo || 0).toLocaleString()} FCFA
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isActiveNow ? (
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-green-700 text-white">✅ ACTIVE</span>
                    ) : expired ? (
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-gray-600 text-gray-300">⏰ TERMINÉE</span>
                    ) : !p.is_active ? (
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-red-800 text-red-200">🚫 DÉSACTIVÉE</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-amber-800 text-amber-200">⏳ À VENIR</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  📅 Du <strong className="text-amber-400">{dateDebut}</strong> au <strong className="text-amber-400">{dateFin}</strong>
                </p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => togglePromotion(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${p.is_active ? 'bg-red-800 text-red-200 hover:bg-red-700' : 'bg-green-800 text-green-200 hover:bg-green-700'}`}>
                    {p.is_active ? '🚫 Désactiver' : '✅ Activer'}
                  </button>
                  <button onClick={() => { setEditPromo(p); setShowForm(false) }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-800 text-amber-200 hover:bg-amber-700">
                    ✏️ Modifier
                  </button>
                  <button onClick={() => deletePromotion(p.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-700 text-red-300 hover:bg-gray-600">
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PromotionForm({ initial, onSave, onCancel }) {
  const toLocalInput = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  const [form, setForm] = useState(initial ? {
    id: initial.id,
    type_concours: initial.type_concours || 'direct',
    prix_promo: initial.prix_promo || 0,
    date_debut: toLocalInput(initial.date_debut),
    date_fin: toLocalInput(initial.date_fin),
    is_active: initial.is_active !== false
  } : {
    type_concours: 'direct',
    prix_promo: '',
    date_debut: toLocalInput(new Date().toISOString()),
    date_fin: '',
    is_active: true
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = () => {
    if (!form.type_concours) return alert('Choisissez un type de concours')
    if (!form.prix_promo || parseInt(form.prix_promo) < 0) return alert('Saisissez un prix promo valide')
    if (!form.date_debut) return alert('Saisissez une date de début')
    if (!form.date_fin) return alert('Saisissez une date de fin')
    if (new Date(form.date_fin) <= new Date(form.date_debut)) return alert('La date de fin doit être après la date de début')

    onSave({
      ...form,
      prix_promo: parseInt(form.prix_promo),
      date_debut: new Date(form.date_debut).toISOString(),
      date_fin: new Date(form.date_fin).toISOString()
    })
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-5 mb-4 border border-amber-800">
      <h3 className="text-white font-bold mb-4">{initial ? '✏️ Modifier la promotion' : '🎯 Nouvelle promotion'}</h3>
      <div className="space-y-3">
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Type de concours *</label>
          <select value={form.type_concours} onChange={e => set('type_concours', e.target.value)}
            className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm">
            <option value="direct">📚 Concours Directs</option>
            <option value="professionnel">🎓 Concours Professionnels</option>
          </select>
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Prix promotionnel (FCFA) *</label>
          <input type="number" value={form.prix_promo} onChange={e => set('prix_promo', e.target.value)}
            className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-lg font-bold"
            min="0" placeholder="Ex: 3500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Date début *</label>
            <input type="datetime-local" value={form.date_debut} onChange={e => set('date_debut', e.target.value)}
              className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Date fin *</label>
            <input type="datetime-local" value={form.date_fin} onChange={e => set('date_fin', e.target.value)}
              className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
            className="w-4 h-4 accent-amber-500" />
          <span>Activer la promotion</span>
        </label>
        <div className="flex gap-2 pt-1">
          <button onClick={submit} className="flex-1 py-3.5 font-bold text-white rounded-xl active:scale-95"
            style={{ background: '#C4521A' }}>
            {initial ? '💾 Modifier' : '🎯 Créer la promotion'}
          </button>
          <button onClick={onCancel} className="px-5 py-3.5 bg-gray-700 text-gray-300 rounded-xl font-semibold">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* =================== MOT DE PASSE =================== */
function AdminChangePassword({ getToken, onNotif, user }) {
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPwd !== confirmPwd) { onNotif('❌ Les mots de passe ne correspondent pas', 'error'); return }
    if (newPwd.length < 6) { onNotif('❌ Minimum 6 caractères requis', 'error'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd })
      })
      const data = await res.json()
      if (data.success) { onNotif('✅ Mot de passe modifié avec succès', 'success'); setOldPwd(''); setNewPwd(''); setConfirmPwd('') }
      else onNotif(data.error || '❌ Erreur', 'error')
    } catch { onNotif('❌ Erreur de connexion', 'error') }
    setLoading(false)
  }

  const EyeIcon = ({ show }) => show ? (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-5 mt-1">🔑 Modifier mon mot de passe</h2>
      <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{ background: 'rgba(196,82,26,0.2)' }}>
          <span className="text-2xl">👤</span>
          <div>
            <p className="text-white font-bold text-sm">{user?.prenom} {user?.nom}</p>
            <p className="text-gray-400 text-xs">{user?.phone}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Ancien mot de passe', val: oldPwd, set: setOldPwd, show: showOld, setShow: setShowOld },
            { label: 'Nouveau mot de passe', val: newPwd, set: setNewPwd, show: showNew, setShow: setShowNew, hint: 'Minimum 6 caractères' },
            { label: 'Confirmer le nouveau mot de passe', val: confirmPwd, set: setConfirmPwd, show: showConfirm, setShow: setShowConfirm },
          ].map((f, i) => (
            <div key={i}>
              <label className="text-gray-400 text-xs mb-1.5 block">{f.label} *</label>
              <div className="relative">
                <input type={f.show ? 'text' : 'password'} value={f.val} onChange={e => f.set(e.target.value)}
                  placeholder={f.hint || f.label} required
                  className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 pr-12 text-sm" />
                <button type="button" onClick={() => f.setShow(!f.show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <EyeIcon show={f.show} />
                </button>
              </div>
            </div>
          ))}
          {newPwd && confirmPwd && newPwd !== confirmPwd && <p className="text-red-400 text-xs">❌ Les mots de passe ne correspondent pas</p>}
          {newPwd && confirmPwd && newPwd === confirmPwd && newPwd.length >= 6 && <p className="text-green-400 text-xs">✅ Les mots de passe correspondent</p>}
          <button type="submit" disabled={loading}
            className="w-full py-4 font-bold text-white rounded-xl active:scale-95 disabled:opacity-70 text-base"
            style={{ background: loading ? '#555' : 'linear-gradient(135deg,#C4521A,#8B2500)' }}>
            {loading ? <span className="flex items-center justify-center gap-2"><span className="spinner" style={{ width: 20, height: 20, borderWidth: 3 }}></span>Modification...</span> : '🔑 Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* =================== DISSERTATIONS =================== */
// 🚨 PHASE 2 — Liste blanche des sous-dossiers PROFESSIONNELS qui acceptent les dissertations.
// Les concours DIRECTS ne proposent JAMAIS l'option "dissertation".
// Cette liste correspond aux concours à contenu long (épreuves rédactionnelles).
const DISSERTATION_ALLOWED_KEYWORDS = [
  'csapé', 'csape',
  'agrégé', 'agrege',
  'capes',
  'magistrature',
  'inspectorat', 'ies', 'iepenf',
  'administrateur civil',
  'administrateur des hôpitaux', 'administrateur des hopitaux',
  'justice',
  'casu', 'aasu', 'cisu', 'aisu', 'enaref'
]

// Fonction utilitaire: une catégorie peut-elle recevoir une dissertation ?
function canCategoryHaveDissertation(cat) {
  if (!cat) return false
  // Règle 1 : Les concours DIRECTS sont exclus
  if (cat.type === 'direct') return false
  // Règle 2 : Pour les PROFESSIONNELS, on accepte par défaut tous les sous-dossiers
  // (car la liste fournie couvre tous les concours pro à contenu long).
  // On affine en vérifiant le nom contre la liste blanche pour exclure d'éventuels
  // sous-dossiers futurs qui ne seraient pas concernés.
  if (cat.type === 'professionnel') {
    const nom = (cat.nom || '').toLowerCase()
    // Si aucun mot-clé ne correspond explicitement, on autorise quand même
    // car tout concours professionnel principal a potentiellement une dissertation.
    return DISSERTATION_ALLOWED_KEYWORDS.some(k => nom.includes(k))
      // Exception : tout dossier professionnel non listé reste autorisé sauf
      // s'il s'agit d'un dossier d'accompagnement (Actualités, Entraînement, Accompagnement final)
      || !/(actualité|actualite|entraînement|entrainement|accompagnement)/i.test(nom)
  }
  return false
}

function AdminDissertations({ getToken, onNotif }) {
  const [dissertations, setDissertations] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editDiss, setEditDiss] = useState(null)
  const [filterCat, setFilterCat] = useState('')

  useEffect(() => { fetchCategories(); fetchDissertations() }, [])

  const fetchCategories = async () => {
    try {
      const r = await fetch('/api/quiz/categories', { headers: { Authorization: `Bearer ${getToken()}` } })
      const d = await r.json()
      // 🚨 PHASE 2 — Filtrage des catégories autorisées pour les dissertations
      const allCats = d.categories || []
      const allowedCats = allCats.filter(canCategoryHaveDissertation)
      setCategories(allowedCats)
    } catch {}
  }

  const fetchDissertations = async (catId = '') => {
    setLoading(true)
    try {
      const url = catId ? `/api/admin/dissertations?categorie_id=${catId}` : '/api/admin/dissertations'
      const r = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
      const d = await r.json()
      setDissertations(d.dissertations || [])
    } catch {}
    setLoading(false)
  }

  const saveDissertation = async (formData) => {
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const r = await fetch('/api/admin/dissertations', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(formData)
      })
      const d = await r.json()
      if (d.success || d.dissertation) {
        onNotif(formData.id ? '✅ Dissertation modifiée' : '✅ Dissertation ajoutée', 'success')
        setShowForm(false); setEditDiss(null)
        fetchDissertations(filterCat)
      } else {
        onNotif(d.error || 'Erreur', 'error')
      }
    } catch (e) {
      onNotif('Erreur réseau', 'error')
    }
  }

  const deleteDissertation = async (id) => {
    if (!confirm('Supprimer définitivement cette dissertation ?')) return
    try {
      await fetch(`/api/admin/dissertations?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })
      onNotif('🗑️ Dissertation supprimée', 'info')
      fetchDissertations(filterCat)
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-1">
        <h2 className="text-white text-xl font-bold">📝 Dissertations ({dissertations.length})</h2>
        <button onClick={() => { setShowForm(true); setEditDiss(null) }}
          className="px-3 py-2 font-bold text-white rounded-xl text-xs active:scale-95" style={{ background: '#C4521A' }}>
          ➕ Ajouter une dissertation
        </button>
      </div>

      <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-3 mb-4 text-xs text-amber-200">
        💡 Les dissertations sont des contenus longs (sans QCM). Le titre s'affiche en haut et le contenu complet (corrigé détaillé) est visible dès l'ouverture par l'utilisateur.
      </div>

      <select value={filterCat} onChange={e => { setFilterCat(e.target.value); fetchDissertations(e.target.value) }}
        className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 mb-4 text-sm border border-gray-700">
        <option value="">📂 Toutes les catégories</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.type === 'direct' ? '📚' : '🎓'} {c.nom}</option>)}
      </select>

      {(showForm || editDiss) && (
        <DissertationForm initial={editDiss} categories={categories} onSave={saveDissertation} onCancel={() => { setShowForm(false); setEditDiss(null) }} />
      )}

      {loading ? <div className="py-8 text-center"><div className="spinner mx-auto"></div></div> : (
        <div className="space-y-3">
          {dissertations.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">📝</p>
              <p>Aucune dissertation pour l'instant</p>
              <p className="text-xs text-gray-500 mt-2">Cliquez sur "Ajouter une dissertation" pour en créer une.</p>
            </div>
          ) : dissertations.map(d => (
            <div key={d.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-white text-sm font-bold leading-relaxed flex-1">📝 {d.titre}</p>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#8B2500', color: '#fff' }}>DISSERTATION</span>
              </div>
              <p className="text-gray-400 text-xs mb-3 line-clamp-3 whitespace-pre-wrap">{(d.contenu || '').substring(0, 280)}{d.contenu && d.contenu.length > 280 ? '...' : ''}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 truncate max-w-[60%]">{d.categorie_nom}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditDiss(d); setShowForm(false) }} className="text-amber-400 hover:text-amber-300 p-1 rounded hover:bg-gray-700">✏️</button>
                  <button onClick={() => deleteDissertation(d.id)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-700">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DissertationForm({ initial, categories, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? {
    id: initial.id,
    category_id: initial.category_id,
    titre: initial.titre || '',
    contenu: initial.contenu || ''
  } : {
    category_id: '',
    titre: '',
    contenu: ''
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = () => {
    if (!form.category_id) return alert('Choisissez une catégorie')
    if (!form.titre.trim()) return alert('Saisissez un titre')
    if (!form.contenu.trim()) return alert('Saisissez le contenu')
    onSave(form)
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-5 mb-4 border border-amber-800">
      <h3 className="text-white font-bold mb-4">{initial ? '✏️ Modifier la dissertation' : '📝 Nouvelle dissertation'}</h3>
      <div className="space-y-3">
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Sous-dossier / Catégorie *</label>
          <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
            className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm" required>
            <option value="">Choisir un sous-dossier</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.type === 'direct' ? '📚 (Direct)' : '🎓 (Pro)'} {c.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Titre de la dissertation *</label>
          <input type="text" value={form.titre} onChange={e => set('titre', e.target.value)}
            className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm"
            placeholder="Ex: L'État de droit en Afrique – Analyse et perspectives" />
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Contenu (texte long, corrigé complet) *</label>
          <textarea value={form.contenu} onChange={e => set('contenu', e.target.value)}
            className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono"
            style={{ minHeight: '300px', lineHeight: '1.6' }}
            placeholder="Saisissez ici le texte complet de la dissertation ou du corrigé. Les sauts de ligne sont conservés." />
          <p className="text-xs text-gray-500 mt-1">{form.contenu.length} caractères</p>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={submit} className="flex-1 py-3.5 font-bold text-white rounded-xl active:scale-95" style={{ background: '#C4521A' }}>
            {initial ? '💾 Modifier' : '📝 Ajouter la dissertation'}
          </button>
          <button onClick={onCancel} className="px-5 py-3.5 bg-gray-700 text-gray-300 rounded-xl font-semibold">Annuler</button>
        </div>
      </div>
    </div>
  )
}

/* =================== PROGRAMMATION DISPARITION =================== */
function AdminSchedules({ getToken, onNotif }) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [date, setDate] = useState('')
  const [time, setTime] = useState('23:59')
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => { fetchSchedules() }, [])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/schedules', { headers: { Authorization: `Bearer ${getToken()}` } })
      const d = await r.json()
      // l'API /api/admin/schedules renvoie { categories: [...] }
      setSchedules(d.categories || d.schedules || [])
    } catch {}
    setLoading(false)
  }

  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = schedules.filter(s => filterType === 'all' ? true : s.type === filterType)

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(s => s.id)))
  }

  const save = async () => {
    if (selected.size === 0) return onNotif('Sélectionnez au moins une catégorie', 'error')
    if (enabled && !date) return onNotif('Choisissez une date de fin de validité', 'error')

    setSaving(true)
    try {
      // Construire la date ISO complète
      let iso = null
      if (enabled && date) {
        const [h, m] = (time || '23:59').split(':')
        const localDate = new Date(`${date}T${h.padStart(2,'0')}:${m.padStart(2,'0')}:00`)
        iso = localDate.toISOString()
      }

      const r = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          category_ids: Array.from(selected),
          date_validite: iso,
          enabled: enabled
        })
      })
      const d = await r.json()
      if (d.success) {
        onNotif(enabled
          ? `✅ Programmation appliquée à ${d.updated} sous-dossier(s)`
          : `✅ Programmation désactivée sur ${d.updated} sous-dossier(s)`, 'success')
        setSelected(new Set())
        fetchSchedules()
      } else {
        onNotif(d.error || 'Erreur', 'error')
      }
    } catch (e) {
      onNotif('Erreur réseau', 'error')
    }
    setSaving(false)
  }

  const disableSelected = async () => {
    if (selected.size === 0) return onNotif('Sélectionnez au moins une catégorie', 'error')
    setSaving(true)
    try {
      const r = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          category_ids: Array.from(selected),
          date_validite: null,
          enabled: false
        })
      })
      const d = await r.json()
      if (d.success) {
        onNotif(`✅ Programmation désactivée sur ${d.updated} sous-dossier(s)`, 'success')
        setSelected(new Set())
        fetchSchedules()
      } else {
        onNotif(d.error || 'Erreur', 'error')
      }
    } catch (e) {
      onNotif('Erreur réseau', 'error')
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-1">
        <h2 className="text-white text-xl font-bold">⏰ Programmation des contenus</h2>
        <button onClick={fetchSchedules} className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-800">🔄</button>
      </div>

      <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl p-3 mb-4 text-xs text-amber-200">
        💡 Programmez la <b>disparition automatique</b> d'un ou plusieurs sous-dossiers à une date précise. Après cette date, les utilisateurs non-admin ne verront plus ce contenu. L'administrateur continue de le voir même après expiration.
      </div>

      {/* Formulaire date/heure */}
      <div className="bg-gray-800 rounded-2xl p-4 border border-amber-800 mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="w-4 h-4 accent-amber-500" />
            <span>Activer la programmation</span>
          </label>
        </div>
        {enabled && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Date de fin de validité *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Heure</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm" />
            </div>
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={saving || selected.size === 0}
            className="flex-1 py-3 font-bold text-white rounded-xl active:scale-95 disabled:opacity-50"
            style={{ background: enabled ? '#C4521A' : '#6B7280' }}>
            {saving ? '⏳...' : (enabled ? `⏰ Programmer (${selected.size})` : `🚫 Désactiver (${selected.size})`)}
          </button>
          {enabled && (
            <button onClick={disableSelected} disabled={saving || selected.size === 0}
              className="px-4 py-3 font-bold rounded-xl active:scale-95 disabled:opacity-50 bg-gray-700 text-gray-300 text-xs">
              Retirer prog.
            </button>
          )}
        </div>
      </div>

      {/* Filtre type + select all */}
      <div className="flex gap-2 mb-3">
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="flex-1 bg-gray-800 text-white rounded-xl px-3 py-2 text-sm border border-gray-700">
          <option value="all">Tous types</option>
          <option value="direct">📚 Concours directs</option>
          <option value="professionnel">🎓 Concours pro</option>
        </select>
        <button onClick={toggleAll}
          className="px-3 py-2 text-xs font-bold rounded-xl bg-gray-800 text-white hover:bg-gray-700">
          {selected.size === filtered.length && filtered.length > 0 ? '❌ Aucun' : '✅ Tous'}
        </button>
      </div>

      {loading ? <div className="py-8 text-center"><div className="spinner mx-auto"></div></div> : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-6 text-center text-gray-400">Aucune catégorie</div>
          ) : filtered.map(s => {
            const isSel = selected.has(s.id)
            const dateTxt = s.date_validite ? new Date(s.date_validite).toLocaleString('fr-FR') : '—'
            return (
              <label key={s.id}
                className={`flex items-center gap-3 bg-gray-800 rounded-xl p-3 border cursor-pointer transition-all ${isSel ? 'border-amber-500' : 'border-gray-700'}`}>
                <input type="checkbox" checked={isSel} onChange={() => toggleOne(s.id)} className="w-4 h-4 accent-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">
                    {s.type === 'direct' ? '📚' : '🎓'} {s.nom}
                  </p>
                  <p className="text-xs text-gray-400">
                    {s.question_count} élément(s)
                    {s.is_programmed && (
                      <span className={`ml-2 ${s.expired ? 'text-red-400' : 'text-amber-400'}`}>
                        {s.expired ? '⚠️ EXPIRÉ' : '⏰ programmé'} : {dateTxt}
                      </span>
                    )}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
