export const runtime = 'experimental-edge'
import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'
import { IFL_USSD_CODE, IFL_USSD_TEL, IFL_PHONE, IFL_PHONE_DISPLAY, whatsappLink, telLink } from '../lib/contact'
import { externalLinkHandler, ussdLinkHandler, apiCall } from '../lib/external-link'

export default function Payment() {
  const { user, loading, getToken } = useAuth()
  const router = useRouter()
  const { type, montant, specialty } = router.query

  const [selectedType, setSelectedType] = useState('direct')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [numeroPaiement, setNumeroPaiement] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [prices, setPrices] = useState({ direct: 5000, professionnel: 20000 })
  // 🎯 Phase 2 — Promotions actives
  const [promos, setPromos] = useState({ direct: null, professionnel: null })

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (type === 'professionnel') setSelectedType('professionnel')
    else if (type === 'direct') setSelectedType('direct')
    
    if (specialty) setSelectedSpecialty(decodeURIComponent(specialty))
  }, [type, specialty])

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
        const promoMap = { direct: null, professionnel: null }
        data.prices.forEach(p => {
          pm[p.type_concours] = p.prix
          if (p.promo_active && p.prix_promo) {
            promoMap[p.type_concours] = { prix: p.prix_promo, date_fin: p.promo_date_fin }
          }
        })
        setPrices(prev => ({ ...prev, ...pm }))
        setPromos(promoMap)
      }
    } catch {}
  }

  // Si type=professionnel et pas de spécialité, rediriger vers la sélection
  useEffect(() => {
    if (!loading && user && type === 'professionnel' && !specialty && router.isReady) {
      router.replace('/select-specialty')
    }
  }, [type, specialty, loading, user, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation: pour un abonnement professionnel, la spécialité est obligatoire
    if (selectedType === 'professionnel' && !selectedSpecialty) {
      setError('Veuillez d\'abord choisir votre dossier principal.')
      return
    }

    // Validation côté client du numéro de téléphone (si renseigné)
    if (numeroPaiement && numeroPaiement.trim()) {
      const cleaned = numeroPaiement.replace(/[\s+\-]/g, '')
      if (!/^(226)?\d{8,}$/.test(cleaned)) {
        setError('Numéro Orange Money invalide. Format attendu : +226 XX XX XX XX')
        return
      }
    }

    setSubmitting(true)
    try {
      const token = getToken()
      const effectivePrice = promos[selectedType]?.prix ?? prices[selectedType]
      const result = await apiCall('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type_concours: selectedType,
          montant: effectivePrice,
          numero_paiement: numeroPaiement || null,
          notes: (promos[selectedType] ? `[PROMO appliquée] ` : '') + (notes || ''),
          dossier_principal: selectedType === 'professionnel' ? selectedSpecialty : null
        })
      }, 20000)
      if (result.ok && result.data?.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Erreur lors de l\'envoi. Veuillez réessayer.')
      }
    } catch (err) {
      setError(err.message || 'Erreur de connexion. Réessayez.')
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

  const currentPrice = promos[selectedType]?.prix ?? prices[selectedType]
  const originalPrice = prices[selectedType]
  const hasPromo = !!promos[selectedType]

  if (success) {
    return (
      <>
        <Head><title>Paiement envoyé – IFL</title></Head>
        <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#FFF8F0' }}>
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-extrabold mb-3" style={{ color: '#8B2500' }}>Demande envoyée !</h2>
            {selectedType === 'professionnel' && selectedSpecialty && (
              <div className="mb-4 p-3 rounded-2xl" style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE5CC)', border: '2px solid #C4521A' }}>
                <p className="text-xs text-amber-700 font-bold">📌 Dossier principal choisi</p>
                <p className="font-extrabold" style={{ color: '#8B2500' }}>{selectedSpecialty}</p>
              </div>
            )}
            <p className="text-gray-600 mb-6">Votre demande de paiement a été reçue. Voici les prochaines étapes :</p>
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-xl">
                <span className="text-xl">1️⃣</span>
                <p className="text-sm text-amber-800 font-medium">Effectuez le paiement Orange Money : <a
                  href={IFL_USSD_TEL}
                  {...ussdLinkHandler(IFL_USSD_CODE)}
                  className="font-extrabold underline decoration-dotted cursor-pointer"
                  title="Cliquer pour composer ou copier"
                >{IFL_USSD_CODE}</a></p>
              </div>
              <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-xl">
                <span className="text-xl">2️⃣</span>
                <p className="text-sm text-amber-800 font-medium">Envoyez la capture d'écran via WhatsApp au <a href={telLink()} {...externalLinkHandler(telLink())} className="font-extrabold underline">{IFL_PHONE_DISPLAY}</a></p>
              </div>
              <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-xl">
                <span className="text-xl">3️⃣</span>
                <p className="text-sm text-amber-800 font-medium">Validation dans les <strong>24h</strong> et accès immédiat aux QCM</p>
              </div>
            </div>
            <a
              href={whatsappLink('Bonjour IFL, voici ma capture de paiement Orange Money')}
              {...externalLinkHandler(whatsappLink('Bonjour IFL, voici ma capture de paiement Orange Money'))}
              className="flex items-center justify-center gap-2 w-full py-4 text-white font-bold rounded-xl mb-3 text-center active:scale-95 transition-all"
              style={{ background: '#25D366' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Envoyer la capture WhatsApp
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
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Concours Directs */}
            <button
              onClick={() => { setSelectedType('direct'); setSelectedSpecialty('') }}
              className={`p-4 rounded-2xl border-2 text-center transition-all active:scale-95 ${selectedType === 'direct' ? 'border-amber-500 shadow-lg' : 'border-gray-200 bg-white'}`}
              style={selectedType === 'direct' ? { background: 'linear-gradient(135deg,#FFF0E0,#FFE5CC)', borderColor: '#C4521A' } : {}}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: selectedType === 'direct' ? '#FFF7ED' : '#F9FAFB', border: '1.5px solid #FFD0A8' }}>
                <img src="/icons/direct_book.svg" alt="Directs" width="36" height="36" style={{ objectFit: 'contain' }} />
              </div>
              <p className="font-bold text-sm leading-tight" style={{ color: '#8B2500' }}>Concours Directs</p>
              <p className="text-gray-500 text-xs mt-1">12 dossiers thématiques</p>
              {promos.direct ? (
                <div className="mt-2">
                  <p className="text-xs font-extrabold inline-block px-1.5 py-0.5 rounded" style={{ background: '#FEF3C7', color: '#16a34a' }}>🎯 PROMO</p>
                  <p className="text-xs line-through text-gray-400 mt-0.5">{(prices.direct || 5000).toLocaleString()} FCFA par an</p>
                  <p className="font-extrabold text-lg" style={{ color: '#16a34a' }}>{promos.direct.prix.toLocaleString()} FCFA par an</p>
                </div>
              ) : (
                <p className="font-extrabold text-lg mt-2" style={{ color: '#C4521A' }}>
                  {(prices.direct || 5000).toLocaleString()} FCFA par an
                </p>
              )}
              {selectedType === 'direct' && <span className="text-xs font-bold" style={{ color: '#C4521A' }}>✓ Sélectionné</span>}
            </button>

            {/* Concours Professionnels */}
            <button
              onClick={() => { router.push('/select-specialty') }}
              className={`p-4 rounded-2xl border-2 text-center transition-all active:scale-95 ${selectedType === 'professionnel' ? 'border-amber-500 shadow-lg' : 'border-gray-200 bg-white'}`}
              style={selectedType === 'professionnel' ? { background: 'linear-gradient(135deg,#FFF0E0,#FFE5CC)', borderColor: '#C4521A' } : {}}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: selectedType === 'professionnel' ? '#FFF7ED' : '#F9FAFB', border: '1.5px solid #FFD0A8' }}>
                <img src="/icons/pro_graduation.svg" alt="Professionnels" width="36" height="36" style={{ objectFit: 'contain' }} />
              </div>
              <p className="font-bold text-sm leading-tight" style={{ color: '#8B2500' }}>Professionnels</p>
              <p className="text-gray-500 text-xs mt-1">38 dossiers spécialisés</p>
              {promos.professionnel ? (
                <div className="mt-2">
                  <p className="text-xs font-extrabold inline-block px-1.5 py-0.5 rounded" style={{ background: '#FEF3C7', color: '#16a34a' }}>🎯 PROMO</p>
                  <p className="text-xs line-through text-gray-400 mt-0.5">{(prices.professionnel || 20000).toLocaleString()} FCFA par an</p>
                  <p className="font-extrabold text-lg" style={{ color: '#16a34a' }}>{promos.professionnel.prix.toLocaleString()} FCFA par an</p>
                </div>
              ) : (
                <p className="font-extrabold text-lg mt-2" style={{ color: '#C4521A' }}>
                  {(prices.professionnel || 20000).toLocaleString()} FCFA par an
                </p>
              )}
              {selectedType === 'professionnel' ? (
                <span className="text-xs font-bold" style={{ color: '#C4521A' }}>✓ Sélectionné</span>
              ) : (
                <span className="text-xs text-orange-600">→ Choisir spécialité</span>
              )}
            </button>
          </div>

          {/* Affichage de la spécialité sélectionnée (pour professionnel) */}
          {selectedType === 'professionnel' && selectedSpecialty && (
            <div className="mb-4 rounded-2xl p-3 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE5CC)', border: '2px solid #C4521A' }}>
              <div>
                <p className="text-xs font-bold text-amber-700">📌 Dossier principal sélectionné</p>
                <p className="font-extrabold text-sm" style={{ color: '#8B2500' }}>{selectedSpecialty}</p>
                <p className="text-xs text-green-700 mt-0.5">+ Actualités — Entraînement QCM — Accompagnement final (offerts)</p>
              </div>
              <Link href="/select-specialty" className="ml-auto px-3 py-1.5 text-xs font-bold rounded-xl border" style={{ color: '#8B2500', borderColor: '#C4521A' }}>
                Changer
              </Link>
            </div>
          )}

          {/* Alerte si professionnel sans spécialité */}
          {selectedType === 'professionnel' && !selectedSpecialty && (
            <div className="mb-4 p-3 rounded-xl text-sm font-semibold" style={{ background: '#FFF3CD', color: '#856404', border: '1px solid #FFD700' }}>
              ⚠️ Pour les Concours Professionnels, vous devez d'abord choisir votre spécialité.
              <Link href="/select-specialty" className="block mt-2 font-bold underline" style={{ color: '#C4521A' }}>
                → Choisir ma spécialité maintenant
              </Link>
            </div>
          )}

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
              <p className="text-sm font-bold text-orange-100 mb-1 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                Code USSD (cliquez pour composer / copier) :
              </p>
              <a
                href={IFL_USSD_TEL}
                {...ussdLinkHandler(IFL_USSD_CODE)}
                className="text-2xl font-extrabold tracking-wider underline decoration-dotted active:opacity-70 inline-block"
                title="Cliquer pour composer ou copier"
              >{IFL_USSD_CODE}</a>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs">Bénéficiaire</p>
                <a href={telLink()} {...externalLinkHandler(telLink())} className="font-bold underline">{IFL_PHONE_DISPLAY}</a>
              </div>
              <div className="text-right">
                <p className="text-orange-100 text-xs">Montant</p>
                {hasPromo ? (
                  <>
                    <p className="text-orange-100 text-sm line-through opacity-80">{originalPrice.toLocaleString()} FCFA par an</p>
                    <p className="font-extrabold text-xl">{currentPrice.toLocaleString()} FCFA par an</p>
                    <p className="text-yellow-300 text-xs font-bold">🎯 PROMO</p>
                  </>
                ) : (
                  <p className="font-extrabold text-xl">{currentPrice.toLocaleString()} FCFA par an</p>
                )}
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
                disabled={submitting || (selectedType === 'professionnel' && !selectedSpecialty)}
                className="w-full py-4 text-white font-extrabold text-lg rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-70"
                style={{ background: submitting ? '#aaa' : 'linear-gradient(135deg,#C4521A,#8B2500)' }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner" style={{ width: 22, height: 22, borderWidth: 3 }}></span>
                    Envoi...
                  </span>
                ) : (
                  hasPromo
                    ? <>✅ Confirmer – <span className="line-through opacity-70 text-base">{originalPrice.toLocaleString()}</span> {currentPrice.toLocaleString()} FCFA par an 🎯</>
                    : `✅ Confirmer – ${currentPrice.toLocaleString()} FCFA par an`
                )}
              </button>
            </form>
          </div>

          {/* WhatsApp Aide */}
          <a
            href={whatsappLink("Bonjour IFL, j'ai effectué mon paiement Orange Money")}
            {...externalLinkHandler(whatsappLink("Bonjour IFL, j'ai effectué mon paiement Orange Money"))}
            className="flex items-center justify-center gap-2 w-full py-3.5 text-white font-bold text-center rounded-xl active:scale-95 transition-all"
            style={{ background: '#25D366' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Envoyer la preuve WhatsApp ({IFL_PHONE_DISPLAY})
          </a>
        </div>

        {/* Bouton flottant WhatsApp */}
        <a
          href={whatsappLink("Bonjour IFL, j'ai besoin d'aide pour le paiement")}
          {...externalLinkHandler(whatsappLink("Bonjour IFL, j'ai besoin d'aide pour le paiement"))}
          className="fixed bottom-6 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-50 active:scale-90 transition-transform"
          style={{ background: '#25D366' }}
          title="Aide WhatsApp"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      </div>
    </>
  )
}
