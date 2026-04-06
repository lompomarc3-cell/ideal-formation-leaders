import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

export default function Payment() {
  const { user, loading, getToken, refreshUser } = useAuth()
  const router = useRouter()
  const { type, montant } = router.query

  const [form, setForm] = useState({ numero_paiement: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [prices, setPrices] = useState({ direct: 5000, professionnel: 20000 })
  const [selectedType, setSelectedType] = useState(type || 'direct')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (type) setSelectedType(type)
    loadPrices()
  }, [type])

  const loadPrices = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/prices', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.prices) {
        const map = {}
        data.prices.forEach(p => { map[p.type_concours] = p.prix })
        setPrices(prev => ({ ...prev, ...map }))
      }
    } catch {}
  }

  const currentPrice = prices[selectedType] || (selectedType === 'direct' ? 5000 : 20000)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const token = getToken()
      const res = await fetch('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type_concours: selectedType,
          montant: currentPrice,
          numero_paiement: form.numero_paiement,
          notes: form.notes
        })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        await refreshUser()
      } else {
        setError(data.error || 'Erreur lors de l\'envoi')
      }
    } catch {
      setError('Erreur réseau')
    }
    setSubmitting(false)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1A4731,#C4521A)' }}>
        <div className="text-center"><div className="spinner mx-auto mb-3"></div><p className="text-white font-semibold">Chargement...</p></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Paiement Orange Money – IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen" style={{ background: '#FFF8F0' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)' }} className="sticky top-0 z-40 shadow-lg py-3 px-4">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="text-green-200 hover:text-white p-1">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="logo-header" style={{ width: 38, height: 38 }}>
                <img src="/logo.png" alt="IFL" style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 12 }} />
              </div>
              <span className="text-white font-bold">Paiement Orange Money</span>
            </div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-6">
          {success ? (
            <div className="text-center animate-popIn">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-200">
                <div className="text-7xl mb-4">✅</div>
                <h2 className="text-2xl font-extrabold text-green-800 mb-2">Demande envoyée !</h2>
                <p className="text-gray-600 mb-2">Votre demande de paiement a été transmise à l'administrateur.</p>
                <div className="bg-green-50 rounded-2xl p-4 mb-6 text-left">
                  <p className="font-bold text-green-800 mb-2">📋 Prochaines étapes :</p>
                  <ol className="space-y-2 text-sm text-green-700">
                    <li>1️⃣ Effectuez le paiement Orange Money si ce n'est pas encore fait</li>
                    <li>2️⃣ Envoyez la capture d'écran sur WhatsApp au <strong>+226 76 22 39 62</strong></li>
                    <li>3️⃣ L'admin valide votre abonnement dans les 24h</li>
                    <li>4️⃣ Vous recevez accès immédiat à tous les QCM</li>
                  </ol>
                </div>
                <Link href="/dashboard" className="block w-full py-4 text-center text-lg font-bold text-white rounded-xl shadow-md active:scale-95" style={{ background: '#1A4731' }}>
                  🏠 Retour au tableau de bord
                </Link>
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn space-y-5">
              {/* Sélection du type */}
              <div>
                <h2 className="text-2xl font-extrabold mb-4" style={{ color: '#1A4731' }}>Choisissez votre offre</h2>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => setSelectedType('direct')}
                    className={`p-4 rounded-2xl border-3 text-left transition-all ${selectedType === 'direct' ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 bg-white'}`}
                    style={{ borderWidth: 2.5, borderColor: selectedType === 'direct' ? '#1A4731' : '#e5e7eb' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-extrabold text-lg" style={{ color: '#1A4731' }}>📚 Concours Directs</p>
                        <p className="text-gray-500 text-sm mt-0.5">10 dossiers complets</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold" style={{ color: '#D4A017' }}>{prices.direct.toLocaleString()}</p>
                        <p className="text-gray-400 text-xs">FCFA / an</p>
                      </div>
                    </div>
                    {selectedType === 'direct' && <div className="mt-2 flex items-center gap-1.5 text-green-700 text-xs font-semibold"><span>✅</span> Sélectionné</div>}
                  </button>

                  <button
                    onClick={() => setSelectedType('professionnel')}
                    className="p-4 rounded-2xl text-left transition-all bg-white"
                    style={{ borderWidth: 2.5, border: `2.5px solid ${selectedType === 'professionnel' ? '#C4521A' : '#e5e7eb'}`, background: selectedType === 'professionnel' ? '#FFF0E8' : 'white' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-extrabold text-lg" style={{ color: '#C4521A' }}>🎓 Concours Professionnels</p>
                        <p className="text-gray-500 text-sm mt-0.5">12 dossiers complets</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold" style={{ color: '#D4A017' }}>{prices.professionnel.toLocaleString()}</p>
                        <p className="text-gray-400 text-xs">FCFA / an</p>
                      </div>
                    </div>
                    {selectedType === 'professionnel' && <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#C4521A' }}><span>✅</span> Sélectionné</div>}
                  </button>
                </div>
              </div>

              {/* Instructions Orange Money */}
              <div className="om-gradient rounded-2xl p-5 text-white">
                <h3 className="font-extrabold text-lg mb-3 flex items-center gap-2">
                  <span className="text-2xl">📱</span> Comment payer avec Orange Money
                </h3>
                <div className="space-y-2.5">
                  <div className="bg-white/20 rounded-xl p-3.5">
                    <p className="font-bold text-base mb-1">Option 1 — USSD (Sans internet)</p>
                    <div className="bg-white/20 rounded-lg px-3 py-2 font-mono text-lg font-bold tracking-wider">
                      *144*2*1*76223962#
                    </div>
                    <p className="text-orange-100 text-xs mt-1.5">Composez ce code et entrez le montant : <strong>{currentPrice.toLocaleString()} FCFA</strong></p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-3.5">
                    <p className="font-bold text-base mb-1">Option 2 — Application Orange Money</p>
                    <p className="text-orange-100 text-sm">Numéro du bénéficiaire :</p>
                    <p className="font-extrabold text-xl mt-1">📞 +226 76 22 39 62</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-3.5">
                    <p className="font-bold text-base">📸 Après le paiement :</p>
                    <p className="text-orange-100 text-sm mt-1">Envoyez la capture d'écran sur WhatsApp au <strong>+226 76 22 39 62</strong></p>
                  </div>
                </div>
              </div>

              {/* Formulaire de confirmation */}
              <div className="bg-white rounded-2xl shadow-md border border-amber-100 p-5">
                <h3 className="font-bold text-gray-800 mb-4 text-base">📋 Confirmer votre demande</h3>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">⚠️ {error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">📱 Votre numéro Orange Money (optionnel)</label>
                    <div className="flex rounded-xl border-2 border-gray-200 focus-within:border-amber-500 overflow-hidden">
                      <span className="flex items-center px-3 bg-gray-50 text-gray-600 font-semibold border-r border-gray-200 whitespace-nowrap">🇧🇫 +226</span>
                      <input
                        type="tel"
                        value={form.numero_paiement}
                        onChange={e => setForm(p => ({ ...p, numero_paiement: e.target.value }))}
                        placeholder="XX XX XX XX"
                        className="flex-1 px-3 py-3.5 outline-none text-base bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">💬 Message pour l'admin (optionnel)</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Ex: Paiement effectué le 05/01/2025 à 14h30"
                      className="input-field min-h-[80px] resize-none"
                    />
                  </div>

                  {/* Résumé */}
                  <div className="rounded-xl p-4" style={{ background: selectedType === 'direct' ? '#E8F5EE' : '#FFF0E8' }}>
                    <p className="font-bold text-sm mb-1" style={{ color: selectedType === 'direct' ? '#1A4731' : '#C4521A' }}>
                      📋 Récapitulatif
                    </p>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-600">Offre :</span>
                      <span className="font-bold">{selectedType === 'direct' ? 'Concours Directs' : 'Concours Professionnels'}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Montant :</span>
                      <span className="font-extrabold text-lg">{currentPrice.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Durée :</span>
                      <span className="font-bold">1 an</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 text-lg font-bold text-white rounded-xl shadow-lg active:scale-95 disabled:opacity-60"
                    style={{ background: submitting ? '#999' : selectedType === 'direct' ? 'linear-gradient(135deg,#1A4731,#2D6A4F)' : 'linear-gradient(135deg,#C4521A,#8B2500)' }}
                  >
                    {submitting
                      ? <span className="flex items-center justify-center gap-2"><span className="spinner" style={{width:22,height:22,borderWidth:3}}></span> Envoi...</span>
                      : `✅ Confirmer ma demande – ${currentPrice.toLocaleString()} FCFA`}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
