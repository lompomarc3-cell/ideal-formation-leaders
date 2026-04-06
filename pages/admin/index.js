import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../_app'

export default function AdminDashboard() {
  const { user, loading, logout, getToken } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [activeSection, setActiveSection] = useState('dashboard')
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.is_admin) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.stats) {
        setStats(data.stats)
        setRecentUsers(data.recentUsers || [])
      }
    } catch (e) {}
    setLoadingStats(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A0A00' }}>
        <div className="text-center"><div className="spinner mx-auto"></div></div>
      </div>
    )
  }

  if (!user?.is_admin) return null

  return (
    <>
      <Head><title>Admin – IFL</title></Head>
      <div className="min-h-screen" style={{ background: '#0F1A0F' }}>
        {/* Admin Header */}
        <header style={{ background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="IFL" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '10px' }} />
              <div>
                <p className="text-white font-bold leading-tight">ADMIN IFL</p>
                <p className="text-orange-200 text-xs">{user.nom} {user.prenom}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard" className="text-orange-200 hover:text-white p-2 text-sm">
                🏠
              </Link>
              <button onClick={logout} className="text-orange-200 hover:text-white p-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: 'dashboard', label: '📊 Stats', },
              { id: 'payments', label: '💳 Paiements' },
              { id: 'users', label: '👥 Utilisateurs' },
              { id: 'questions', label: '❓ QCM' },
              { id: 'prices', label: '💰 Prix' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${activeSection === s.id ? 'text-white' : 'text-gray-400 bg-gray-800 hover:bg-gray-700'}`}
                style={activeSection === s.id ? { background: '#C4521A' } : {}}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-8">
          {/* Dashboard Stats */}
          {activeSection === 'dashboard' && (
            <AdminStats stats={stats} recentUsers={recentUsers} loading={loadingStats} getToken={getToken} />
          )}
          
          {activeSection === 'payments' && <AdminPayments getToken={getToken} />}
          {activeSection === 'users' && <AdminUsers getToken={getToken} />}
          {activeSection === 'questions' && <AdminQuestions getToken={getToken} />}
          {activeSection === 'prices' && <AdminPrices getToken={getToken} />}
        </div>
      </div>
    </>
  )
}

// =================== STATS ===================
function AdminStats({ stats, recentUsers, loading, getToken }) {
  if (loading) return <div className="py-12 text-center"><div className="spinner mx-auto"></div></div>

  const statCards = [
    { label: 'Utilisateurs', value: stats?.totalUsers || 0, icon: '👥', color: '#1A4731' },
    { label: 'Abonnés actifs', value: stats?.activeSubscriptions || 0, icon: '✅', color: '#D4A017' },
    { label: 'Paiements en attente', value: stats?.pendingPayments || 0, icon: '⏳', color: '#C4521A' },
    { label: 'Questions totales', value: stats?.totalQuestions || 0, icon: '❓', color: '#1A4731' },
  ]

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-5 mt-2">📊 Tableau de bord</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((s, i) => (
          <div key={i} className="rounded-2xl p-5 text-white" style={{ background: s.color }}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-3xl font-extrabold">{s.value}</div>
            <div className="text-sm opacity-80 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <h3 className="text-white font-bold mb-3">👤 Derniers inscrits</h3>
      <div className="space-y-2">
        {recentUsers.map(u => (
          <div key={u.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">{u.prenom} {u.nom}</p>
              <p className="text-gray-400 text-sm">{u.phone}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.abonnement_type ? 'bg-green-800 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
              {u.abonnement_type || 'Gratuit'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// =================== PAIEMENTS ===================
function AdminPayments({ getToken }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState('')

  useEffect(() => { fetchPayments() }, [])

  const fetchPayments = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/payments', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setPayments(data.payments || [])
    } catch (e) {}
    setLoading(false)
  }

  const handleValidate = async (payment, valide) => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: payment.id,
          valide,
          user_id: payment.user_id,
          type_concours: payment.type_concours,
          notes_admin: valide ? 'Validé par admin' : 'Rejeté par admin'
        })
      })
      const data = await res.json()
      if (data.success) {
        setNotification(data.message)
        setTimeout(() => setNotification(''), 4000)
        fetchPayments()
      }
    } catch (e) {}
  }

  if (loading) return <div className="py-12 text-center"><div className="spinner mx-auto"></div></div>

  return (
    <div>
      {notification && (
        <div className="notification success mb-4 relative" style={{ position: 'relative', top: 'auto', right: 'auto' }}>
          ✅ {notification}
        </div>
      )}
      <h2 className="text-white text-xl font-bold mb-5 mt-2">💳 Demandes de paiement</h2>
      {payments.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-lg">📭 Aucune demande de paiement</p>
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
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.valide ? 'bg-green-800 text-green-200' : 'bg-amber-800 text-amber-200'}`}>
                  {p.valide ? '✅ Validé' : '⏳ En attente'}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm font-bold">
                  {p.montant?.toLocaleString()} FCFA
                </span>
                <span className="text-gray-400 text-sm">{p.type_concours}</span>
                <span className="text-gray-500 text-xs">{new Date(p.date_demande).toLocaleDateString()}</span>
              </div>
              {!p.valide && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleValidate(p, true)}
                    className="flex-1 py-2.5 font-bold text-white rounded-xl text-sm active:scale-95"
                    style={{ background: '#1A4731' }}
                  >
                    ✅ Valider & Activer
                  </button>
                  <button
                    onClick={() => handleValidate(p, false)}
                    className="px-4 py-2.5 font-bold text-white rounded-xl text-sm active:scale-95"
                    style={{ background: '#8B0000' }}
                  >
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

// =================== UTILISATEURS ===================
function AdminUsers({ getToken }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState(null)
  const [notification, setNotification] = useState('')

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e) {}
    setLoading(false)
  }

  const updateUser = async (updates) => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates)
      })
      const data = await res.json()
      if (data.user) {
        setNotification('Utilisateur mis à jour')
        setTimeout(() => setNotification(''), 3000)
        fetchUsers()
        setEditUser(null)
      }
    } catch (e) {}
  }

  if (loading) return <div className="py-12 text-center"><div className="spinner mx-auto"></div></div>

  return (
    <div>
      {notification && (
        <div className="bg-green-700 text-white rounded-xl p-3 mb-4 text-sm font-medium">✅ {notification}</div>
      )}
      <h2 className="text-white text-xl font-bold mb-5 mt-2">👥 Utilisateurs ({users.length})</h2>
      
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-white font-bold">{u.prenom} {u.nom}</p>
                <p className="text-gray-400 text-sm">{u.phone}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.is_active ? 'bg-green-800 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {u.is_active ? 'Actif' : 'Bloqué'}
                  </span>
                  {u.abonnement_type && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-800 text-amber-300">
                      {u.abonnement_type}
                    </span>
                  )}
                  {u.abonnement_valide_jusqua && (
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400">
                      exp: {new Date(u.abonnement_valide_jusqua).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditUser(editUser?.id === u.id ? null : u)}
                className="ml-3 p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm"
              >
                ✏️
              </button>
            </div>

            {editUser?.id === u.id && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <UserEditForm user={u} onSave={updateUser} onCancel={() => setEditUser(null)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function UserEditForm({ user, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: user.id,
    abonnement_type: user.abonnement_type || '',
    abonnement_valide_jusqua: user.abonnement_valide_jusqua ? new Date(user.abonnement_valide_jusqua).toISOString().split('T')[0] : '',
    is_active: user.is_active
  })

  return (
    <div className="space-y-3">
      <div>
        <label className="text-gray-400 text-xs mb-1 block">Type abonnement</label>
        <select
          value={form.abonnement_type}
          onChange={e => setForm(p => ({ ...p, abonnement_type: e.target.value }))}
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Aucun</option>
          <option value="direct">Concours Directs</option>
          <option value="professionnel">Concours Professionnels</option>
          <option value="all">Les deux</option>
        </select>
      </div>
      <div>
        <label className="text-gray-400 text-xs mb-1 block">Valide jusqu'au</label>
        <input
          type="date"
          value={form.abonnement_valide_jusqua}
          onChange={e => setForm(p => ({ ...p, abonnement_valide_jusqua: e.target.value }))}
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-gray-400 text-sm">Compte actif</label>
        <button
          onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
          className={`w-12 h-6 rounded-full transition-all ${form.is_active ? 'bg-green-600' : 'bg-gray-600'}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_active ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave({
            ...form,
            abonnement_valide_jusqua: form.abonnement_valide_jusqua ? new Date(form.abonnement_valide_jusqua).toISOString() : null
          })}
          className="flex-1 py-2 font-bold text-white rounded-lg text-sm active:scale-95"
          style={{ background: '#1A4731' }}
        >
          ✅ Sauvegarder
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm">Annuler</button>
      </div>
    </div>
  )
}

// =================== QUESTIONS ===================
function AdminQuestions({ getToken }) {
  const [questions, setQuestions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editQ, setEditQ] = useState(null)
  const [filterCat, setFilterCat] = useState('')
  const [notification, setNotification] = useState('')

  useEffect(() => {
    fetchCategories()
    fetchQuestions()
  }, [])

  const fetchCategories = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/prices', { headers: { Authorization: `Bearer ${token}` } })
      // On utilise l'API categories directement
      const res2 = await fetch('/api/quiz/categories', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res2.json()
      setCategories(data.categories || [])
    } catch (e) {}
  }

  const fetchQuestions = async (catId) => {
    setLoading(true)
    try {
      const token = getToken()
      const url = catId ? `/api/admin/questions?categorie_id=${catId}` : '/api/admin/questions'
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setQuestions(data.questions || [])
    } catch (e) {}
    setLoading(false)
  }

  const saveQuestion = async (formData) => {
    try {
      const token = getToken()
      const method = formData.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/questions', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.question) {
        setNotification(formData.id ? 'Question modifiée' : 'Question ajoutée')
        setTimeout(() => setNotification(''), 3000)
        setShowForm(false)
        setEditQ(null)
        fetchQuestions(filterCat)
      } else {
        alert(data.error)
      }
    } catch (e) {}
  }

  const deleteQuestion = async (id) => {
    if (!confirm('Supprimer cette question ?')) return
    try {
      const token = getToken()
      await fetch(`/api/admin/questions?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchQuestions(filterCat)
    } catch (e) {}
  }

  return (
    <div>
      {notification && (
        <div className="bg-green-700 text-white rounded-xl p-3 mb-4 text-sm font-medium">✅ {notification}</div>
      )}
      <div className="flex items-center justify-between mb-5 mt-2">
        <h2 className="text-white text-xl font-bold">❓ QCM</h2>
        <button
          onClick={() => { setShowForm(true); setEditQ(null) }}
          className="px-4 py-2 font-bold text-white rounded-xl text-sm active:scale-95"
          style={{ background: '#C4521A' }}
        >
          + Ajouter
        </button>
      </div>

      {/* Filtre */}
      <select
        value={filterCat}
        onChange={e => { setFilterCat(e.target.value); fetchQuestions(e.target.value) }}
        className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 mb-4 text-sm border border-gray-700"
      >
        <option value="">Toutes les catégories</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.type_concours === 'direct' ? '📚' : '🎓'} {c.nom}</option>
        ))}
      </select>

      {(showForm || editQ) && (
        <QuestionForm
          initial={editQ}
          categories={categories}
          onSave={saveQuestion}
          onCancel={() => { setShowForm(false); setEditQ(null) }}
        />
      )}

      {loading ? (
        <div className="py-8 text-center"><div className="spinner mx-auto"></div></div>
      ) : (
        <div className="space-y-3">
          {questions.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
              Aucune question pour cette catégorie
            </div>
          ) : questions.map(q => (
            <div key={q.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-white text-sm font-medium mb-2 leading-relaxed">{q.question_text}</p>
              <div className="grid grid-cols-2 gap-1 mb-3">
                {['A', 'B', 'C', 'D'].map(opt => (
                  <p key={opt} className={`text-xs rounded px-2 py-1 ${q.bonne_reponse === opt ? 'bg-green-800 text-green-300 font-bold' : 'text-gray-400'}`}>
                    {opt}: {q[`option_${opt.toLowerCase()}`]}
                  </p>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{q.ifl_categories?.nom}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditQ(q); setShowForm(false) }} className="text-amber-400 text-sm hover:text-amber-300">✏️</button>
                  <button onClick={() => deleteQuestion(q.id)} className="text-red-400 text-sm hover:text-red-300">🗑️</button>
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
    categorie_id: '',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    bonne_reponse: 'A',
    explication: ''
  })

  return (
    <div className="bg-gray-800 rounded-2xl p-5 mb-4 border border-amber-700">
      <h3 className="text-white font-bold mb-4">{initial ? '✏️ Modifier' : '➕ Nouvelle question'}</h3>
      <div className="space-y-3">
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Catégorie *</label>
          <select
            value={form.categorie_id}
            onChange={e => setForm(p => ({ ...p, categorie_id: e.target.value }))}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            required
          >
            <option value="">Choisir une catégorie</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.type_concours === 'direct' ? '📚' : '🎓'} {c.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Question *</label>
          <textarea
            value={form.question_text}
            onChange={e => setForm(p => ({ ...p, question_text: e.target.value }))}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm min-h-[80px]"
            placeholder="Texte de la question..."
            required
          />
        </div>
        {['a', 'b', 'c', 'd'].map(opt => (
          <div key={opt}>
            <label className="text-gray-400 text-xs mb-1 block">Option {opt.toUpperCase()} *</label>
            <input
              type="text"
              value={form[`option_${opt}`]}
              onChange={e => setForm(p => ({ ...p, [`option_${opt}`]: e.target.value }))}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
              placeholder={`Réponse ${opt.toUpperCase()}`}
              required
            />
          </div>
        ))}
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Bonne réponse *</label>
          <div className="flex gap-2">
            {['A', 'B', 'C', 'D'].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setForm(p => ({ ...p, bonne_reponse: opt }))}
                className={`flex-1 py-2.5 font-extrabold rounded-lg text-sm transition-all ${form.bonne_reponse === opt ? 'text-white' : 'bg-gray-700 text-gray-400'}`}
                style={form.bonne_reponse === opt ? { background: '#16a34a' } : {}}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block">Explication *</label>
          <textarea
            value={form.explication}
            onChange={e => setForm(p => ({ ...p, explication: e.target.value }))}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm min-h-[80px]"
            placeholder="Explication détaillée de la réponse..."
            required
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-3 font-bold text-white rounded-xl active:scale-95"
            style={{ background: '#C4521A' }}
          >
            {initial ? '💾 Modifier' : '➕ Ajouter'}
          </button>
          <button onClick={onCancel} className="px-5 py-3 bg-gray-700 text-gray-300 rounded-xl font-semibold">Annuler</button>
        </div>
      </div>
    </div>
  )
}

// =================== PRIX ===================
function AdminPrices({ getToken }) {
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState('')

  useEffect(() => { fetchPrices() }, [])

  const fetchPrices = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/prices', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setPrices(data.prices || [])
    } catch (e) {}
    setLoading(false)
  }

  const updatePrice = async (type_concours, prix) => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type_concours, prix: parseInt(prix) })
      })
      const data = await res.json()
      if (data.price) {
        setNotification('Prix mis à jour')
        setTimeout(() => setNotification(''), 3000)
        fetchPrices()
      }
    } catch (e) {}
  }

  if (loading) return <div className="py-8 text-center"><div className="spinner mx-auto"></div></div>

  return (
    <div>
      {notification && (
        <div className="bg-green-700 text-white rounded-xl p-3 mb-4 text-sm font-medium">✅ {notification}</div>
      )}
      <h2 className="text-white text-xl font-bold mb-5 mt-2">💰 Configuration des prix</h2>
      <div className="space-y-4">
        {prices.map(p => (
          <PriceEditor key={p.id} price={p} onSave={updatePrice} />
        ))}
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
      <p className="text-gray-400 text-sm mb-4">{price.description}</p>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-gray-400 text-xs mb-1 block">Prix (FCFA)</label>
          <input
            type="number"
            value={prix}
            onChange={e => { setPrix(e.target.value); setSaved(false) }}
            className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 text-lg font-bold"
            min="100"
          />
        </div>
        <button
          onClick={async () => { await onSave(price.type_concours, prix); setSaved(true) }}
          className="px-5 py-3 font-bold text-white rounded-xl active:scale-95 self-end"
          style={{ background: saved ? '#1A4731' : '#C4521A' }}
        >
          {saved ? '✅' : '💾'}
        </button>
      </div>
    </div>
  )
}
