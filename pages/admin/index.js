import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../_app'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({ users: 0, active: 0, pending: 0, total_revenue: 0 })
  const [requests, setRequests] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
        return
      }
      if (profile && profile.role !== 'admin') {
        router.push('/dashboard')
        return
      }
    }
  }, [user, profile, loading, router])

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchStats()
    }
  }, [user, profile])

  const fetchStats = async () => {
    setLoadingData(true)
    
    // Count users
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'admin')

    // Count active subscriptions
    const { count: activeCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active')

    // Get pending payment requests
    const { data: pendingRequests } = await supabase
      .from('correction_requests')
      .select(`
        *,
        profiles(full_name, phone, subscription_status, subscription_type)
      `)
      .eq('status', 'pending')
      .ilike('message', 'PAIEMENT_%')
      .order('created_at', { ascending: false })
      .limit(20)

    setStats({
      users: usersCount || 0,
      active: activeCount || 0,
      pending: pendingRequests?.length || 0,
    })

    if (pendingRequests) setRequests(pendingRequests)
    setLoadingData(false)
  }

  const parsePaymentMessage = (message) => {
    // Format: PAIEMENT_direct_5000FCFA or PAIEMENT_professionnel_20000FCFA
    const match = message?.match(/PAIEMENT_(\w+)_(\d+)FCFA/)
    if (match) {
      return { type: match[1], amount: parseInt(match[2]) }
    }
    return { type: 'unknown', amount: 0 }
  }

  const handleValidatePayment = async (requestId, userId, paymentType) => {
    try {
      // Update correction_request status
      await supabase
        .from('correction_requests')
        .update({ status: 'resolved', admin_response: 'Paiement validé et accès activé' })
        .eq('id', requestId)

      // Activate subscription for user
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 1 year

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_type: paymentType,
          subscription_expires_at: expiresAt.toISOString()
        })
        .eq('id', userId)

      // Refresh
      fetchStats()
      alert('✅ Abonnement activé avec succès !')
    } catch (err) {
      alert('❌ Erreur : ' + err.message)
    }
  }

  const handleRejectPayment = async (requestId) => {
    const reason = prompt('Raison du rejet (optionnel):')
    try {
      await supabase
        .from('correction_requests')
        .update({
          status: 'rejected',
          admin_response: reason || 'Paiement non confirmé'
        })
        .eq('id', requestId)

      fetchStats()
      alert('Demande rejetée.')
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner w-10 h-10"></div>
      </div>
    )
  }

  if (!profile || profile.role !== 'admin') return null

  return (
    <>
      <Head>
        <title>Administration - IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Admin Header */}
        <header className="bg-blue-900 text-white px-4 py-4 sticky top-0 z-50 shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="IFL" className="h-9 w-9 object-contain" />
              <div>
                <div className="font-bold text-sm">IFL Administration</div>
                <div className="text-blue-200 text-xs">Panneau admin</div>
              </div>
            </div>
            <button onClick={handleLogout} className="text-blue-200 hover:text-white text-sm">
              Déconnexion
            </button>
          </div>
        </header>

        {/* Nav Tabs */}
        <div className="bg-white border-b sticky top-[65px] z-40">
          <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto">
            {[
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'payments', label: '💰 Paiements' },
              { id: 'users', label: '👥 Utilisateurs' },
              { id: 'questions', label: '📝 Questions' },
              { id: 'settings', label: '⚙️ Paramètres' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-4 py-6">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Vue d'ensemble</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center">
                  <div className="text-3xl font-bold text-blue-700">{stats.users}</div>
                  <div className="text-gray-500 text-sm mt-1">Utilisateurs</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.active}</div>
                  <div className="text-gray-500 text-sm mt-1">Abonnés actifs</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
                  <div className="text-gray-500 text-sm mt-1">Paiements en attente</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-purple-600">22</div>
                  <div className="text-gray-500 text-sm mt-1">Dossiers</div>
                </div>
              </div>

              {/* Pending requests preview */}
              {requests.length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-3">⏳ Paiements en attente ({requests.length})</h3>
                  <div className="space-y-2">
                    {requests.slice(0, 3).map(req => {
                      const payment = parsePaymentMessage(req.message)
                      return (
                        <div key={req.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {req.profiles?.full_name || 'Utilisateur'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {req.profiles?.phone} • {payment.amount.toLocaleString()} FCFA • {payment.type}
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab('payments')}
                            className="text-blue-600 text-sm font-medium hover:underline"
                          >
                            Voir →
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  {requests.length > 3 && (
                    <button onClick={() => setActiveTab('payments')} className="mt-2 text-blue-600 text-sm hover:underline">
                      Voir tous ({requests.length}) →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <AdminPayments
              requests={requests}
              parsePaymentMessage={parsePaymentMessage}
              handleValidate={handleValidatePayment}
              handleReject={handleRejectPayment}
              onRefresh={fetchStats}
            />
          )}

          {/* Users Tab */}
          {activeTab === 'users' && <AdminUsers />}

          {/* Questions Tab */}
          {activeTab === 'questions' && <AdminQuestions />}

          {/* Settings Tab */}
          {activeTab === 'settings' && <AdminSettings />}
        </main>
      </div>
    </>
  )
}

// ===================== Admin Payments Component =====================
function AdminPayments({ requests, parsePaymentMessage, handleValidate, handleReject, onRefresh }) {
  const [allRequests, setAllRequests] = useState([])
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    fetchAll()
  }, [filter])

  const fetchAll = async () => {
    const query = supabase
      .from('correction_requests')
      .select(`*, profiles(full_name, phone, subscription_status, subscription_type)`)
      .ilike('message', 'PAIEMENT_%')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query.eq('status', filter)
    }

    const { data } = await query.limit(50)
    if (data) setAllRequests(data)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">💰 Paiements</h2>
        <button onClick={fetchAll} className="btn-secondary text-sm py-2">
          Actualiser
        </button>
      </div>

      <div className="flex gap-2">
        {['pending', 'resolved', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            {f === 'pending' ? 'En attente' : f === 'resolved' ? 'Validés' : 'Tous'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {allRequests.length === 0 ? (
          <div className="card text-center py-8 text-gray-500">Aucune demande de paiement trouvée.</div>
        ) : (
          allRequests.map(req => {
            const payment = parsePaymentMessage(req.message)
            const statusColors = {
              pending: 'badge-orange',
              resolved: 'badge-green',
              rejected: 'badge-red'
            }
            return (
              <div key={req.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{req.profiles?.full_name || 'Utilisateur inconnu'}</span>
                      <span className={`badge ${statusColors[req.status] || 'badge-blue'}`}>
                        {req.status === 'pending' ? 'En attente' : req.status === 'resolved' ? 'Validé' : req.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      📱 {req.profiles?.phone}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      💰 {payment.amount.toLocaleString()} FCFA • 
                      <span className={`ml-1 font-medium ${payment.type === 'professionnel' ? 'text-purple-600' : 'text-blue-600'}`}>
                        {payment.type === 'professionnel' ? 'Concours Pros' : 'Concours Directs'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(req.created_at).toLocaleString('fr-FR')}
                    </div>
                    {req.admin_response && (
                      <div className="text-xs text-gray-500 mt-1 italic">{req.admin_response}</div>
                    )}
                  </div>
                  
                  {req.status === 'pending' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleValidate(req.id, req.user_id, payment.type)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded-lg font-medium transition-colors"
                      >
                        ✅ Valider
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 text-xs py-2 px-3 rounded-lg font-medium transition-colors"
                      >
                        ❌ Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ===================== Admin Users Component =====================
function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })
      .limit(100)
    if (data) setUsers(data)
    setLoading(false)
  }

  const handleToggleSubscription = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'free' : 'active'
    await supabase
      .from('profiles')
      .update({ subscription_status: newStatus })
      .eq('id', userId)
    fetchUsers()
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">👥 Utilisateurs ({users.length})</h2>
        <button onClick={fetchUsers} className="btn-secondary text-sm py-2">Actualiser</button>
      </div>

      <input
        type="text"
        placeholder="Rechercher par nom ou téléphone..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input-field"
      />

      {loading ? (
        <div className="flex justify-center py-8"><div className="spinner w-8 h-8"></div></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <div key={u.id} className="card py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{u.full_name}</div>
                  <div className="text-sm text-gray-500">{u.phone}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`badge ${u.subscription_status === 'active' ? 'badge-green' : 'badge-blue'}`}>
                    {u.subscription_status === 'active' 
                      ? (u.subscription_type === 'professionnel' ? 'Pro' : 'Direct')
                      : 'Gratuit'
                    }
                  </span>
                  <button
                    onClick={() => handleToggleSubscription(u.id, u.subscription_status)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {u.subscription_status === 'active' ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===================== Admin Questions Component =====================
function AdminQuestions() {
  const [categories, setCategories] = useState([])
  const [selectedCat, setSelectedCat] = useState(null)
  const [questions, setQuestions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editQuestion, setEditQuestion] = useState(null)
  const [form, setForm] = useState({
    enonce: '', option_a: '', option_b: '', option_c: '', option_d: '',
    reponse_correcte: 'A', explication: '', difficulte: 'moyen'
  })
  const [saving, setSaving] = useState(false)
  const [loadingQ, setLoadingQ] = useState(false)

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('type', { ascending: true })
    if (data) setCategories(data)
  }

  const fetchQuestions = async (catId) => {
    setLoadingQ(true)
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('category_id', catId)
      .order('created_at', { ascending: false })
    if (data) setQuestions(data)
    setLoadingQ(false)
  }

  const handleSelectCat = (cat) => {
    setSelectedCat(cat)
    fetchQuestions(cat.id)
    setShowForm(false)
    setEditQuestion(null)
  }

  const resetForm = () => {
    setForm({ enonce: '', option_a: '', option_b: '', option_c: '', option_d: '', reponse_correcte: 'A', explication: '', difficulte: 'moyen' })
    setEditQuestion(null)
  }

  const handleEdit = (q) => {
    setForm({
      enonce: q.enonce,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      reponse_correcte: q.reponse_correcte,
      explication: q.explication || '',
      difficulte: q.difficulte || 'moyen'
    })
    setEditQuestion(q)
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  const handleDelete = async (qId) => {
    if (!confirm('Supprimer cette question ?')) return
    await supabase.from('questions').delete().eq('id', qId)
    fetchQuestions(selectedCat.id)
    // Update category count
    const newCount = questions.length - 1
    await supabase.from('categories').update({ question_count: newCount }).eq('id', selectedCat.id)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!selectedCat) return
    setSaving(true)

    try {
      if (editQuestion) {
        // Update
        await supabase
          .from('questions')
          .update({ ...form, is_active: true })
          .eq('id', editQuestion.id)
      } else {
        // Create
        await supabase
          .from('questions')
          .insert({ ...form, category_id: selectedCat.id, is_active: true, is_demo: false })
        
        // Update category count
        await supabase
          .from('categories')
          .update({ question_count: (selectedCat.question_count || 0) + 1 })
          .eq('id', selectedCat.id)
      }

      fetchQuestions(selectedCat.id)
      resetForm()
      setShowForm(false)
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">📝 Gestion des Questions</h2>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Category list */}
        <div className="card md:col-span-1">
          <h3 className="font-bold text-gray-700 text-sm mb-3">Dossiers</h3>
          <div className="space-y-1">
            {['direct', 'professionnel'].map(type => (
              <div key={type}>
                <div className="text-xs font-bold text-gray-400 uppercase py-1 px-2">
                  {type === 'direct' ? '🎯 Concours Directs' : '🏆 Concours Pros'}
                </div>
                {categories
                  .filter(c => c.type === type)
                  .map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCat(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCat?.id === cat.id
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="truncate">{cat.nom}</div>
                      <div className={`text-xs ${selectedCat?.id === cat.id ? 'text-blue-200' : 'text-gray-400'}`}>
                        {cat.question_count || 0} question(s)
                      </div>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* Questions panel */}
        <div className="md:col-span-2 space-y-4">
          {!selectedCat ? (
            <div className="card text-center py-12 text-gray-500">
              👈 Sélectionnez un dossier
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{selectedCat.nom}</h3>
                <button
                  onClick={() => { resetForm(); setShowForm(!showForm) }}
                  className="btn-primary text-sm py-2"
                >
                  {showForm ? 'Annuler' : '+ Ajouter une question'}
                </button>
              </div>

              {/* Add/Edit Form */}
              {showForm && (
                <div className="card border-2 border-blue-200">
                  <h4 className="font-bold text-gray-900 mb-4">
                    {editQuestion ? 'Modifier la question' : 'Nouvelle question'}
                  </h4>
                  <form onSubmit={handleSave} className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Question *</label>
                      <textarea
                        value={form.enonce}
                        onChange={e => setForm({...form, enonce: e.target.value})}
                        className="input-field h-24 resize-none"
                        placeholder="Tapez votre question ici..."
                        required
                      />
                    </div>
                    {['a', 'b', 'c', 'd'].map(opt => (
                      <div key={opt}>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Option {opt.toUpperCase()} *
                        </label>
                        <input
                          type="text"
                          value={form[`option_${opt}`]}
                          onChange={e => setForm({...form, [`option_${opt}`]: e.target.value})}
                          className="input-field"
                          placeholder={`Réponse ${opt.toUpperCase()}`}
                          required
                        />
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Bonne réponse *</label>
                        <select
                          value={form.reponse_correcte}
                          onChange={e => setForm({...form, reponse_correcte: e.target.value})}
                          className="input-field"
                        >
                          {['A', 'B', 'C', 'D'].map(o => (
                            <option key={o} value={o}>Option {o}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Difficulté</label>
                        <select
                          value={form.difficulte}
                          onChange={e => setForm({...form, difficulte: e.target.value})}
                          className="input-field"
                        >
                          <option value="facile">Facile</option>
                          <option value="moyen">Moyen</option>
                          <option value="difficile">Difficile</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Explication</label>
                      <textarea
                        value={form.explication}
                        onChange={e => setForm({...form, explication: e.target.value})}
                        className="input-field h-20 resize-none"
                        placeholder="Explication de la réponse correcte..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                        {saving ? 'Sauvegarde...' : (editQuestion ? 'Modifier' : 'Ajouter la question')}
                      </button>
                      <button type="button" onClick={() => { resetForm(); setShowForm(false) }} className="btn-secondary">
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Questions list */}
              {loadingQ ? (
                <div className="flex justify-center py-8"><div className="spinner w-8 h-8"></div></div>
              ) : questions.length === 0 ? (
                <div className="card text-center py-8 text-gray-500">
                  Aucune question dans ce dossier. Ajoutez-en une !
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="card border-l-4 border-blue-400">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-xs text-gray-400 mb-1">Q{idx + 1} • {q.difficulte}</div>
                          <p className="font-medium text-gray-900 text-sm leading-relaxed">{q.enonce}</p>
                          <div className="mt-2 grid grid-cols-2 gap-1">
                            {['A', 'B', 'C', 'D'].map(opt => (
                              <div key={opt} className={`text-xs px-2 py-1 rounded ${
                                q.reponse_correcte === opt
                                  ? 'bg-green-100 text-green-700 font-bold'
                                  : 'bg-gray-50 text-gray-600'
                              }`}>
                                {opt}: {q[`option_${opt.toLowerCase()}`]}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(q)}
                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 px-3 rounded-lg font-medium"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-700 py-1.5 px-3 rounded-lg font-medium"
                          >
                            🗑️ Sup.
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ===================== Admin Settings Component =====================
function AdminSettings() {
  const [prices, setPrices] = useState({ direct: 5000, professionnel: 20000 })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [adminPassword, setAdminPassword] = useState({ current: '', new: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const { user } = useAuth()

  const handleSavePrices = async () => {
    setSaving(true)
    try {
      // Update prices in categories
      await supabase
        .from('categories')
        .update({ prix: prices.direct })
        .eq('type', 'direct')
      
      await supabase
        .from('categories')
        .update({ prix: prices.professionnel })
        .eq('type', 'professionnel')
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwError('')

    if (adminPassword.new !== adminPassword.confirm) {
      setPwError('Les mots de passe ne correspondent pas')
      return
    }
    if (adminPassword.new.length < 6) {
      setPwError('Le nouveau mot de passe doit faire au moins 6 caractères')
      return
    }

    setPwSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: adminPassword.new
      })
      if (error) throw error
      setAdminPassword({ current: '', new: '', confirm: '' })
      alert('✅ Mot de passe modifié avec succès !')
    } catch (err) {
      setPwError('Erreur : ' + err.message)
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">⚙️ Paramètres</h2>

      {/* Prices */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">💰 Prix des abonnements</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Concours Directs (FCFA)
            </label>
            <input
              type="number"
              value={prices.direct}
              onChange={e => setPrices({...prices, direct: parseInt(e.target.value)})}
              className="input-field"
              min="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Concours Professionnels (FCFA)
            </label>
            <input
              type="number"
              value={prices.professionnel}
              onChange={e => setPrices({...prices, professionnel: parseInt(e.target.value)})}
              className="input-field"
              min="0"
            />
          </div>
        </div>
        <button onClick={handleSavePrices} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Sauvegarde...' : saved ? '✅ Sauvegardé !' : 'Sauvegarder les prix'}
        </button>
      </div>

      {/* Admin Info */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">📱 Informations admin</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div>Email admin : <strong>admin@ifl.bf</strong></div>
          <div>Téléphone WhatsApp : <strong>+226 76 22 39 62</strong></div>
          <div>Numéro Orange Money : <strong>+226 76 22 39 62</strong></div>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">🔒 Changer le mot de passe admin</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nouveau mot de passe</label>
            <input
              type="password"
              value={adminPassword.new}
              onChange={e => setAdminPassword({...adminPassword, new: e.target.value})}
              className="input-field"
              placeholder="Au moins 6 caractères"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={adminPassword.confirm}
              onChange={e => setAdminPassword({...adminPassword, confirm: e.target.value})}
              className="input-field"
              placeholder="Répétez le nouveau mot de passe"
              required
            />
          </div>
          {pwError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {pwError}
            </div>
          )}
          <button type="submit" disabled={pwSaving} className="btn-primary disabled:opacity-50">
            {pwSaving ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}
