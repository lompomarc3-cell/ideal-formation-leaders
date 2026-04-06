import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from './_app'
import { supabase } from '../lib/supabase'

export default function Payment() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const { type } = router.query
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [captureDesc, setCaptureDesc] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  // Check if already subscribed
  useEffect(() => {
    if (profile) {
      if (type === 'direct' && profile.subscription_status === 'active') {
        router.push('/courses/direct')
      }
      if (type === 'professionnel' && profile.subscription_status === 'active' && profile.subscription_type === 'professionnel') {
        router.push('/courses/professionnel')
      }
    }
  }, [profile, type])

  const amount = type === 'professionnel' ? 20000 : 5000
  const label = type === 'professionnel' ? 'Concours Professionnels' : 'Concours Directs'

  const handleSubmitRequest = async () => {
    setSubmitting(true)
    setError('')

    try {
      // Save payment request
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          montant: amount,
          typeAbonnement: type,
          description: captureDesc || `Paiement Orange Money - ${label} - ${amount} FCFA`
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erreur')

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-10 h-10"></div>
      </div>
    )
  }

  if (submitted) {
    return (
      <>
        <Head><title>Paiement envoyé - IFL</title></Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
            <p className="text-gray-600 text-sm mb-6">
              Votre demande d'accès pour <strong>{label}</strong> a été enregistrée.<br/><br/>
              L'administrateur va vérifier votre paiement et activer votre accès dans les plus brefs délais.
            </p>
            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-blue-800 text-sm font-semibold mb-1">📱 N'oubliez pas !</p>
              <p className="text-blue-700 text-sm">
                Envoyez la capture de votre paiement Orange Money sur WhatsApp au :
                <strong> +226 76 22 39 62</strong>
              </p>
            </div>
            <Link href="/dashboard" className="w-full btn-primary block text-center">
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Abonnement {label} - IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-900 text-white px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Link href="/dashboard" className="text-blue-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <div className="font-bold">Paiement Orange Money</div>
              <div className="text-blue-200 text-xs">{label}</div>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6 space-y-4">
          
          {/* Amount Card */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white text-center">
            <div className="text-sm opacity-80 mb-1">{label}</div>
            <div className="text-4xl font-bold">{amount.toLocaleString()} FCFA</div>
            <div className="text-sm opacity-80 mt-1">Accès illimité</div>
          </div>

          {/* Step 1: Orange Money Instructions */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-700 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Effectuez le paiement Orange Money
            </h3>
            
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
              <p className="text-orange-800 font-semibold text-sm mb-2">📲 Numéro Orange Money :</p>
              <p className="text-orange-900 text-2xl font-bold text-center py-2">+226 76 22 39 62</p>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 text-sm mb-2">Code USSD :</p>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <code className="text-blue-700 font-bold text-lg">*144*2*1*76223962#</code>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  Composez ce code → Entrez le montant : <strong>{amount.toLocaleString()}</strong>
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 text-sm mb-1">Montant exact :</p>
                <p className="text-blue-700 font-bold text-xl">{amount.toLocaleString()} FCFA</p>
              </div>
            </div>
          </div>

          {/* Step 2: WhatsApp */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-green-100 text-green-700 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Envoyez la preuve sur WhatsApp
            </h3>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-green-800 text-sm mb-1">Envoyez la capture d'écran de votre paiement sur WhatsApp :</p>
              <p className="text-green-900 text-xl font-bold text-center py-1">+226 76 22 39 62</p>
              <p className="text-green-700 text-xs mt-1">Mentionnez : votre numéro et "<strong>{label}</strong>"</p>
            </div>

            <a
              href={`https://wa.me/22676223962?text=Bonjour%2C%20j'ai%20effectu%C3%A9%20un%20paiement%20Orange%20Money%20de%20${amount}%20FCFA%20pour%20${encodeURIComponent(label)}.%20Mon%20num%C3%A9ro%20est%20${profile?.phone || ''}. %20Voici%20ma%20capture.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Ouvrir WhatsApp
            </a>
          </div>

          {/* Step 3: Confirm */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Confirmer votre demande
            </h3>
            
            <p className="text-gray-600 text-sm mb-4">
              Après avoir effectué le paiement et envoyé la capture WhatsApp, cliquez sur le bouton ci-dessous pour enregistrer votre demande.
            </p>

            <textarea
              value={captureDesc}
              onChange={e => setCaptureDesc(e.target.value)}
              placeholder="Notes optionnelles (ex: numéro utilisé pour le paiement...)"
              className="input-field text-sm mb-4 h-20 resize-none"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmitRequest}
              disabled={submitting}
              className="w-full btn-primary disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner w-4 h-4"></div>
                  Envoi en cours...
                </span>
              ) : (
                'J\'ai payé - Enregistrer ma demande'
              )}
            </button>
          </div>

          <p className="text-center text-gray-400 text-xs pb-4">
            L'accès sera activé sous 24h après validation du paiement.
          </p>
        </main>
      </div>
    </>
  )
}
