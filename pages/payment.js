import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

export default function Payment() {
  const { user, loading, getToken } = useAuth()
  const router = useRouter()
  const { type, montant } = router.query

  const [selectedType, setSelectedType] = useState('direct')
  const [numeroPaiement, setNumeroPaiement] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [prices, setPrices] = useState({ direct: 5000, professionnel: 20000 })

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (type === 'professionnel') setSelectedType('professionnel')
    else setSelectedType('direct')
  }, [type])

  useEffect(() => {
    if (user) loadPrices()
  }, [user])

  const loadPrices = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/prices', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.prices) {
        const pm = {}
        data.prices.forEach(p => { pm[p.type_concours] = p.prix })
        setPrices(prev => ({ ...prev, ...pm }))
      }
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const token = getToken()
      const currentPrice = prices[selectedType]
      const res = await fetch('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type_concours: selectedType,
          montant: currentPrice,
          numero_paiement: numeroPaiement || null,
          notes: notes || null
        })
      })
      const data = await res.json()
      if (data.success) setSuccess(true)
      else setError(data.error || 'Erreur lors de l\'envoi')
    } catch {
      setError('Erreur de connexion. Réessayez.')
    }
    setSubmitting(false)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
        <div className="spinner mx-auto"></div>
      </div>
    )
  }

  const currentPrice = prices[selectedType]

  if (success) {
    return (
      <>
        <Head><title>Paiement envoyé – IFL</title></Head>
        <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFF8F0' }}>
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-extrabold mb-3" style={{ color: '#8B2500' }}>Demande envoyée !</h2>
            <p className="text-gray-600 mb-6">Votre demande de paiement a été reçue. Voici les prochaines étapes :</p>
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-xl">
                <span className="text-xl">1️⃣</span>
                <p className="text-sm text-amber-800 font-medium">Effectuez le paiement Orange Money : <strong>*144*10*76223962#</strong></p>
              </div>
              <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-xl">
                <span className="text-xl">2️⃣</span>
                <p className="text-sm text-amber-800 font-medium">Envoyez la capture d'écran via WhatsApp au <strong>+226 76 22 39 62</strong></p>
              </div>
              <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-xl">
                <span className="text-xl">3️⃣</span>
                <p className="text-sm text-amber-800 font-medium">Validation dans les <strong>24h</strong> et accès immédiat aux QCM</p>
              </div>
            </div>
            <a
              href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20voici%20ma%20capture%20de%20paiement%20Orange%20Money"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 text-white font-bold rounded-xl mb-3 text-center"
              style={{ background: '#25D366' }}
            >
              📱 Envoyer la capture WhatsApp
            </a>
            <Link href="/dashboard" className="block text-center font-semibold py-3" style={{ color: '#C4521A' }}>
              ← Retour au tableau de bord
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Paiement – IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen" style={{ background: '#FFF8F0' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 text-orange-200 hover:text-white">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="logo-header" style={{ width: 38, height: 38 }}>
              <img src="/logo.png" alt="IFL" style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 12 }} />
            </div>
            <div>
              <p className="text-white font-extrabold text-sm leading-tight">Paiement</p>
              <p className="text-orange-200 text-xs">Orange Money</p>
            </div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-5 pb-24">
          {/* Sélection offre */}
          <h2 className="text-xl font-extrabold mb-4" style={{ color: '#8B2500' }}>Choisir une offre</h2>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { key: 'direct', label: 'Concours Directs', icon: '📚', desc: '10 dossiers' },
              { key: 'professionnel', label: 'Professionnels', icon: '🎓', desc: '12 dossiers' }
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setSelectedType(opt.key)}
                className={`p-4 rounded-2xl border-2 text-center transition-all active:scale-95 ${selectedType === opt.key ? 'border-amber-500 shadow-lg' : 'border-gray-200 bg-white'}`}
                style={selectedType === opt.key ? { background: 'linear-gradient(135deg,#FFF0E0,#FFE5CC)', borderColor: '#C4521A' } : {}}
              >
                <div className="text-3xl mb-2">{opt.icon}</div>
                <p className="font-bold text-sm leading-tight" style={{ color: '#8B2500' }}>{opt.label}</p>
                <p className="text-gray-500 text-xs mt-1">{opt.desc}</p>
                <p className="font-extrabold text-lg mt-2" style={{ color: '#C4521A' }}>
                  {(prices[opt.key] || 0).toLocaleString()} FCFA
                </p>
                {selectedType === opt.key && <span className="text-xs font-bold" style={{ color: '#C4521A' }}>✓ Sélectionné</span>}
              </button>
            ))}
          </div>

          {/* Instructions Orange Money */}
          <div className="rounded-2xl p-5 mb-5 text-white" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9500)' }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">📱</span>
              <div>
                <p className="font-extrabold text-lg">Orange Money</p>
                <p className="text-orange-100 text-sm">Paiement sécurisé</p>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-3 mb-3">
              <p className="text-sm font-bold text-orange-100 mb-1">Code USSD :</p>
              <p className="text-2xl font-extrabold tracking-wider">*144*10*76223962#</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs">Bénéficiaire</p>
                <p className="font-bold">+226 76 22 39 62</p>
              </div>
              <div className="text-right">
                <p className="text-orange-100 text-xs">Montant</p>
                <p className="font-extrabold text-xl">{currentPrice.toLocaleString()} FCFA</p>
              </div>
            </div>
          </div>

          {/* Formulaire de confirmation */}
          <div className="bg-white rounded-2xl shadow-md border border-amber-100 p-5 mb-5">
            <h3 className="font-bold text-gray-800 mb-4">📝 Confirmer votre paiement</h3>
            
            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm font-semibold text-white" style={{ background: '#dc2626' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">📱 Votre numéro Orange Money (optionnel)</label>
                <input
                  type="tel"
                  value={numeroPaiement}
                  onChange={e => setNumeroPaiement(e.target.value)}
                  placeholder="+226 XX XX XX XX"
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">💬 Note pour l'admin (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: Paiement effectué le 01/01/2025 à 10h"
                  rows={3}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none resize-none"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 text-white font-extrabold text-lg rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-70"
                style={{ background: submitting ? '#aaa' : 'linear-gradient(135deg,#C4521A,#8B2500)' }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner" style={{ width: 22, height: 22, borderWidth: 3 }}></span>
                    Envoi...
                  </span>
                ) : `✅ Confirmer – ${currentPrice.toLocaleString()} FCFA`}
              </button>
            </form>
          </div>

          {/* WhatsApp Aide */}
          <a
            href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20j'ai%20effectu%C3%A9%20mon%20paiement%20Orange%20Money"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3.5 text-white font-bold text-center rounded-xl"
            style={{ background: '#25D366' }}
          >
            💬 Envoyer la preuve WhatsApp (+226 76 22 39 62)
          </a>
        </div>

        {/* Bouton flottant WhatsApp */}
        <a
          href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20j'ai%20besoin%20d'aide%20pour%20le%20paiement"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-50 text-2xl"
          style={{ background: '#25D366' }}
          title="Aide WhatsApp"
        >
          💬
        </a>
      </div>
    </>
  )
}
