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
      if (data.stats) { setStats(data.stats); setRecentUsers(data.recentUsers || []) }
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
    { id: 'dashboard', label: '📊 Stats' },
    { id: 'payments', label: '💳 Paiements' },
    { id: 'users', label: '👥 Utilisateurs' },
    { id: 'questions', label: '❓ QCM' },
    { id: 'prices', label: '💰 Prix' },
  ]

  return (
    <>
      <Head><title>Admin – IFL</title></Head>
      <div className="min-h-screen" style={{ background: '#1A0500' }}>
        {/* Notification globale */}
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
              {/* Bouton Voir l'App (vue utilisateur) */}
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all"
                style={{ background: 'rgba(255,255,255,0.2)' }}
                title="Voir l'application comme un utilisateur"
              >
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
                className={`px-3 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeSection === t.id ? 'text-white shadow-md' : 'text-gray-400 bg-gray-800 hover:bg-gray-700'}`}
                style={activeSection === t.id ? { background: '#C4521A' } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-10">
          {activeSection === 'dashboard' && <AdminStats stats={stats} recentUsers={recentUsers} loading={loadingStats} onRefresh={fetchStats} />}
          {activeSection === 'payments' && <AdminPayments getToken={getToken} onNotif={showNotif} />}
          {activeSection === 'users' && <AdminUsers getToken={getToken} onNotif={showNotif} />}
          {activeSection === 'questions' && <AdminQuestions getToken={getToken} onNotif={showNotif} />}
          {activeSection === 'prices' && <AdminPrices getToken={getToken} onNotif={showNotif} />}
        </div>
      </div>
    </>
  )
}

/* =================== STATS =================== */
function AdminStats({ stats, recentUsers, loading, onRefresh }) {
  if (loading) return <div className="py-16 text-center"><div className="spinner mx-auto"></div></div>
  const cards = [
    { label: 'Utilisateurs', value: stats?.totalUsers || 0, icon: '👥', color: '#C4521A' },
    { label: 'Abonnés actifs', value: stats?.activeSubscriptions || 0, icon: '✅', color: '#D4A017' },
    { label: 'Paiements en attente', value: stats?.pendingPayments || 0, icon: '⏳', color: '#C4521A' },
    { label: 'Questions', value: stats?.totalQuestions || 0, icon: '❓', color: '#D4A017' },
  ]
  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-1">
        <h2 className="text-white text-xl font-bold">📊 Tableau de bord</h2>
        <button onClick={onRefresh} className="text-gray-400 hover:text-white p-2">🔄</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl p-5 text-white" style={{ background: c.color }}>
            <div className="text-3xl mb-2">{c.icon}</div>
            <div className="text-3xl font-extrabold">{c.value}</div>
            <div className="text-sm opacity-80 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
      <h3 className="text-white font-bold mb-3">👤 Derniers inscrits</h3>
      <div className="space-y-2">
        {recentUsers.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-6 text-center text-gray-400">Aucun utilisateur inscrit</div>
        ) : recentUsers.map(u => (
          <div key={u.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">{u.prenom} {u.nom}</p>
              <p className="text-gray-400 text-sm">{u.phone}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.abonnement_type ? 'bg-amber-800 text-amber-200' : 'bg-gray-700 text-gray-400'}`}>
              {u.abonnement_type || 'Gratuit'}
            </span>
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
        body: JSON.stringify({ id: payment.id, valide, user_id: payment.user_id, type_concours: payment.type_concours })
      })
      const d = await r.json()
      if (d.success) {
        onNotif(d.message, 'success')
        fetchPayments()
      } else onNotif(d.error || 'Erreur', 'error')
    } catch {}
  }

  if (loading) return <div className="py-16 text-center"><div className="spinner mx-auto"></div></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-1">
        <h2 className="text-white text-xl font-bold">💳 Demandes de paiement</h2>
        <button onClick={fetchPayments} className="text-gray-400 hover:text-white p-2">🔄</button>
      </div>
      {payments.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-400">Aucune demande de paiement</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => (
            <div key={p.id} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-bold">{p.ifl_users?.prenom} {p.ifl_users?.nom}</p>
                  <p className="text-gray-400 text-sm">{p.ifl_users?.phone}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.valide ? 'bg-amber-800 text-amber-200' : 'bg-orange-900 text-orange-200'}`}>
                  {p.valide ? '✅ Validé' : '⏳ En attente'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm font-bold">
                  {(p.montant || 0).toLocaleString()} FCFA
                </span>
                <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-lg text-sm">
                  {p.type_concours === 'direct' ? '📚 Directs' : '🎓 Professionnels'}
                </span>
                <span className="text-gray-500 text-xs self-center">
                  {p.date_demande ? new Date(p.date_demande).toLocaleDateString('fr-FR') : ''}
                </span>
              </div>
              {p.numero_paiement && (
                <p className="text-gray-400 text-sm mb-3">📱 {p.numero_paiement}</p>
              )}
              {!p.valide && (
                <div className="flex gap-2">
                  <button onClick={() => handleValidate(p, true)}
                    className="flex-1 py-3 font-bold text-white rounded-xl text-sm active:scale-95"
                    style={{ background: '#C4521A' }}>
                    ✅ Valider & Activer
                  </button>
                  <button onClick={() => handleValidate(p, false)}
                    className="px-4 py-3 font-bold text-white rounded-xl text-sm active:scale-95"
                    style={{ background: '#8B0000' }}>
                    ❌ Rejeter
                  </button>
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
      const r = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(updates)
      })
      const d = await r.json()
      if (d.user) { onNotif('✅ Utilisateur mis à jour', 'success'); fetchUsers(); setEditId(null) }
      else onNotif(d.error || 'Erreur', 'error')
    } catch {}
  }

  if (loading) return <div className="py-16 text-center"><div className="spinner mx-auto"></div></div>

  const nonAdminUsers = users.filter(u => !u.is_admin)

  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-1">
        <h2 className="text-white text-xl font-bold">👥 Utilisateurs ({nonAdminUsers.length})</h2>
        <button onClick={fetchUsers} className="text-gray-400 hover:text-white p-2">🔄</button>
      </div>
      <div className="space-y-3">
        {nonAdminUsers.map(u => (
          <div key={u.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-white font-bold">{u.prenom} {u.nom}</p>
                <p className="text-gray-400 text-sm">{u.phone}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-800 text-amber-300">
                    Actif
                  </span>
                  {u.abonnement_type && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-800 text-orange-300">
                      {u.abonnement_type === 'direct' ? '📚 Directs' : u.abonnement_type === 'professionnel' ? '🎓 Pro' : '🎯 Tout'}
                    </span>
                  )}
                  {u.abonnement_valide_jusqua && (
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400">
                      exp: {new Date(u.abonnement_valide_jusqua).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setEditId(editId === u.id ? null : u.id)} className="ml-3 p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm">✏️</button>
            </div>
            {editId === u.id && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <UserEditForm user={u} onSave={updateUser} onCancel={() => setEditId(null)} />
              </div>
            )}
          </div>
        ))}
        {nonAdminUsers.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
            <p className="text-3xl mb-2">👥</p>
            <p>Aucun utilisateur inscrit</p>
          </div>
        )}
      </div>
    </div>
  )
}

function UserEditForm({ user, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: user.id,
    abonnement_type: user.abonnement_type || '',
    abonnement_valide_jusqua: user.abonnement_valide_jusqua ? new Date(user.abonnement_valide_jusqua).toISOString().split('T')[0] : '',
    is_active: true
  })
  return (
    <div className="space-y-3">
      <div>
        <label className="text-gray-400 text-xs mb-1 block">Type d'abonnement</label>
        <select value={form.abonnement_type} onChange={e => setForm(p => ({ ...p, abonnement_type: e.target.value }))}
          className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm">
          <option value="">Aucun abonnement</option>
          <option value="direct">📚 Concours Directs (5 000 FCFA)</option>
          <option value="professionnel">🎓 Concours Professionnels (20 000 FCFA)</option>
          <option value="all">🎯 Les deux (direct + professionnel)</option>
        </select>
      </div>
      <div>
        <label className="text-gray-400 text-xs mb-1 block">Valide jusqu'au</label>
        <input type="date" value={form.abonnement_valide_jusqua}
          onChange={e => setForm(p => ({ ...p, abonnement_valide_jusqua: e.target.value }))}
          className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave({
          ...form,
          abonnement_valide_jusqua: form.abonnement_valide_jusqua ? new Date(form.abonnement_valide_jusqua).toISOString() : null
        })}
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

  useEffect(() => {
    fetchCategories()
    fetchQuestions()
  }, [])

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
      if (d.question) {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4 mt-1">
        <h2 className="text-white text-xl font-bold">❓ QCM ({questions.length})</h2>
        <div className="flex gap-2">
          <button onClick={() => { setShowBulkAdd(true); setShowForm(false); setEditQ(null) }}
            className="px-4 py-2 font-bold text-white rounded-xl text-sm active:scale-95"
            style={{ background: '#D4A017' }}>
            📦 Ajout Massif
          </button>
          <button onClick={() => { setShowForm(true); setShowBulkAdd(false); setEditQ(null) }}
            className="px-4 py-2 font-bold text-white rounded-xl text-sm active:scale-95"
            style={{ background: '#C4521A' }}>
            ➕ Ajouter 1
          </button>
        </div>
      </div>
      <select value={filterCat} onChange={e => { setFilterCat(e.target.value); fetchQuestions(e.target.value) }}
        className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 mb-4 text-sm border border-gray-700">
        <option value="">📂 Toutes les catégories</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.type_concours === 'direct' ? '📚' : '🎓'} {c.nom}</option>
        ))}
      </select>
      {showBulkAdd && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-bold text-lg">📦 Ajout Massif de QCM</h3>
            <button
              onClick={() => setShowBulkAdd(false)}
              className="text-white hover:text-gray-300"
            >
              ❌ Fermer
            </button>
          </div>
          <BulkQCMAdd
            token={getToken()}
            onSuccess={() => {
              setShowBulkAdd(false)
              fetchQuestions(filterCat)
              onNotif('✅ Questions ajoutées avec succès', 'success')
            }}
          />
        </div>
      )}
      {(showForm || editQ) && (
        <QuestionForm initial={editQ} categories={categories} onSave={saveQuestion}
          onCancel={() => { setShowForm(false); setEditQ(null) }} />
      )}
      {loading ? <div className="py-8 text-center"><div className="spinner mx-auto"></div></div> : (
        <div className="space-y-3">
          {questions.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">❓</p>
              <p>Aucune question pour cette catégorie</p>
              <p className="text-xs mt-2">Cliquez sur ➕ Ajouter pour créer des QCM</p>
            </div>
          ) : questions.map(q => (
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
                <span className="text-xs text-gray-500 truncate max-w-[60%]">{q.ifl_categories?.nom}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditQ(q); setShowForm(false) }} className="text-amber-400 hover:text-amber-300 p-1">✏️</button>
                  <button onClick={() => deleteQuestion(q.id)} className="text-red-400 hover:text-red-300 p-1">🗑️</button>
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
          <select value={form.categorie_id} onChange={e => set('categorie_id', e.target.value)}
            className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm" required>
            <option value="">Choisir une catégorie</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.type_concours === 'direct' ? '📚' : '🎓'} {c.nom}</option>
            ))}
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
          <label className="text-gray-400 text-xs mb-1 block">Explication *</label>
          <textarea value={form.explication} onChange={e => set('explication', e.target.value)}
            className="w-full bg-gray-700 text-white rounded-xl px-3 py-2.5 text-sm min-h-[80px]"
            placeholder="Explication détaillée..." required />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => onSave(form)}
            className="flex-1 py-3.5 font-bold text-white rounded-xl active:scale-95"
            style={{ background: '#C4521A' }}>
            {initial ? '💾 Modifier' : '➕ Ajouter'}
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
      <h2 className="text-white text-xl font-bold mb-5 mt-1">💰 Configuration des prix</h2>
      <div className="space-y-4">
        {prices.map(p => <PriceEditor key={p.id} price={p} onSave={updatePrice} />)}
      </div>
    </div>
  )
}

function PriceEditor({ price, onSave }) {
  const [prix, setPrix] = useState(price.prix)
  const [saved, setSaved] = useState(false)
  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
      <p className="text-white font-bold mb-1">
        {price.type_concours === 'direct' ? '📚 Concours Directs' : '🎓 Concours Professionnels'}
      </p>
      <p className="text-gray-400 text-sm mb-4">Modifier le prix d'abonnement annuel</p>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-gray-400 text-xs mb-1 block">Prix (FCFA)</label>
          <input type="number" value={prix} onChange={e => { setPrix(e.target.value); setSaved(false) }}
            className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 text-lg font-bold" min="100" />
        </div>
        <button onClick={async () => { await onSave(price.type_concours, prix); setSaved(true) }}
          className="px-5 py-3 font-bold text-white rounded-xl active:scale-95 self-end"
          style={{ background: saved ? '#C4521A' : '#D4A017' }}>
          {saved ? '✅' : '💾'}
        </button>
      </div>
    </div>
  )
}
