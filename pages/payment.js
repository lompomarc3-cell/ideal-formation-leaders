import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

export default function Payment() {
  const { user, loading, getToken } = useAuth()
  const router = useRouter()
  const { type } = router.query
  const [selectedType, setSelectedType] = useState(type || 'direct')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (type) setSelectedType(type)
  }, [type])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    
    try {
      const token = getToken()
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type_concours: selectedType,
          numero_paiement: phone
        })
      })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Erreur de connexion. Réessayez.')
    }
    setSubmitting(false)
  }

  const prix = selectedType === 'direct' ? 5000 : 20000
  const label = selectedType === 'direct' ? 'Concours Directs' : 'Concours Professionnels'

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>
  }

  return (
    <>
      <Head><title>Paiement – IFL</title></Head>
      <div className="min-h-screen african-pattern" style={{ background: '#FFF8F0' }}>
        <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #1A2F20 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/dashboard" className="text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-white font-bold text-base">Paiement Orange Money</h1>
              <p className="text-green-200 text-xs">Activation manuelle sous 24h</p>
            </div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-6">
          {success ? (
            <div className="text-center py-8 animate-fadeIn">
              <div className="text-7xl mb-4">✅</div>
              <h2 className="text-2xl font-extrabold text-green-800 mb-3">Demande envoyée !</h2>
              <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 mb-6 text-left">
                <p className="text-green-800 font-bold mb-3">📋 Prochaines étapes :</p>
                <ol className="text-green-700 text-sm space-y-2">
                  <li><strong>1.</strong> Effectuez le paiement Orange Money : <code className="bg-green-100 px-1 rounded">*144*2*1*76223962#</code></li>
                  <li><strong>2.</strong> Prenez une capture d'écran de la confirmation</li>
                  <li><strong>3.</strong> Envoyez la capture via WhatsApp au <strong>+226 76 22 39 62</strong></li>
                  <li><strong>4.</strong> Votre accès sera activé dans les 24h</li>
                </ol>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-5">
                <p className="text-orange-800 font-bold text-sm">📱 Paiement à effectuer :</p>
                <p className="text-orange-700 text-2xl font-extrabold mt-1">{prix.toLocaleString()} FCFA</p>
                <p className="text-orange-600 text-sm">Pour : {label}</p>
              </div>
              <a
                href={`https://wa.me/22676223962?text=Bonjour%20IFL%2C%20j'ai%20effectu%C3%A9%20le%20paiement%20de%20${prix}%20FCFA%20pour%20${encodeURIComponent(label)}.%20Voici%20ma%20capture%20d'%C3%A9cran%20de%20confirmation.%20Mon%20num%C3%A9ro%20:%20${user.phone}`}
                target="_blank" rel="noreferrer"
                className="block w-full py-4 text-center font-bold text-white rounded-2xl shadow-lg active:scale-95 mb-3"
                style={{ background: '#25D366' }}
              >
                📲 Envoyer la capture WhatsApp
              </a>
              <Link href="/dashboard" className="block text-center text-gray-500 py-2">← Retour au tableau de bord</Link>
            </div>
          ) : (
            <>
              {/* Sélection type */}
              <h2 className="text-xl font-extrabold mb-5" style={{ color: '#1A4731' }}>Choisissez votre offre</h2>
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setSelectedType('direct')}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${selectedType === 'direct' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-extrabold text-lg ${selectedType === 'direct' ? 'text-green-800' : 'text-gray-800'}`}>📚 Concours Directs</p>
                      <p className="text-gray-500 text-sm mt-1">10 dossiers • Accès 1 an</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {['Culture gén.', 'Français', 'Maths', 'SVT', 'H-G', '+5 autres'].map(t => (
                          <span key={t} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-extrabold" style={{ color: '#D4A017' }}>5 000</p>
                      <p className="text-gray-400 text-xs">FCFA / an</p>
                      {selectedType === 'direct' && <span className="text-green-500 text-lg">✓</span>}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType('professionnel')}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${selectedType === 'professionnel' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-extrabold text-lg ${selectedType === 'professionnel' ? 'text-orange-800' : 'text-gray-800'}`}>🎓 Concours Professionnels</p>
                      <p className="text-gray-500 text-sm mt-1">12 dossiers • Accès 1 an</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {['CAPES', 'Admin civil', 'Santé', 'Police', '+8 autres'].map(t => (
                          <span key={t} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-extrabold" style={{ color: '#D4A017' }}>20 000</p>
                      <p className="text-gray-400 text-xs">FCFA / an</p>
                      {selectedType === 'professionnel' && <span className="text-orange-500 text-lg">✓</span>}
                    </div>
                  </div>
                </button>
              </div>

              {/* Instructions paiement */}
              <div className="rounded-2xl p-5 text-white mb-5" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF9500 100%)' }}>
                <p className="font-bold text-lg mb-3">📱 Comment payer ?</p>
                <div className="space-y-2 text-orange-50 text-sm">
                  <div className="bg-white/20 rounded-xl p-3">
                    <p className="font-bold text-white">Étape 1 – Effectuez le virement</p>
                    <p>Composez : <code className="bg-white/20 px-2 py-0.5 rounded font-mono">*144*2*1*76223962#</code></p>
                    <p>Montant : <strong className="text-yellow-200">{prix.toLocaleString()} FCFA</strong></p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-3">
                    <p className="font-bold text-white">Étape 2 – Prenez une capture</p>
                    <p>Photographiez l'écran de confirmation du paiement</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-3">
                    <p className="font-bold text-white">Étape 3 – Envoyez sur WhatsApp</p>
                    <p>Numéro : <strong className="text-yellow-200">+226 76 22 39 62</strong></p>
                    <p>Votre accès sera activé sous 24h</p>
                  </div>
                </div>
              </div>

              {/* Formulaire */}
              <div className="bg-white rounded-2xl shadow-md p-5">
                <h3 className="font-bold text-gray-800 mb-4">Enregistrer votre demande</h3>
                
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 mb-4">
                    <p className="text-red-700 text-sm">⚠️ {error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📱 Numéro Orange Money utilisé (optionnel)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+226 XX XX XX XX"
                      className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl outline-none focus:border-orange-400"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-700">
                    💡 En cliquant sur "Confirmer", votre demande sera enregistrée. Envoyez ensuite la capture WhatsApp pour validation.
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 text-lg font-bold text-white rounded-xl active:scale-95 transition-all disabled:opacity-60"
                    style={{ background: '#C4521A' }}
                  >
                    {submitting ? '⏳ Envoi...' : `✅ Confirmer – ${prix.toLocaleString()} FCFA`}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
