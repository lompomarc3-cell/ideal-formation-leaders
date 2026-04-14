import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

// Les 3 dossiers d'accompagnement automatiques (toujours débloqués avec pro)
export const DOSSIERS_ACCOMPAGNEMENT = [
  'Actualités et culture générale',
  'Entraînement QCM',
  'Accompagnement final'
]

// Les 17 dossiers professionnels
const DOSSIERS_PRO = [
  { nom: 'Spécialités Vie scolaire (CASU-AASU)', icone: '🏫', desc: 'Conseillers et Assistants en Vie Scolaire' },
  { nom: 'Actualités et culture générale', icone: '🌍', desc: 'Culture générale et actualités nationales', isAccompagnement: true },
  { nom: 'Spécialités CISU/AISU/ENAREF', icone: '🏛️', desc: 'Inspecteurs et Administrateurs Scolaires' },
  { nom: 'Inspectorat : IES', icone: '🔍', desc: 'Inspecteur de l\'Enseignement Secondaire' },
  { nom: 'Inspectorat : IEPENF', icone: '🔎', desc: 'Inspecteur Éducation de Base et NFE' },
  { nom: 'CSAPÉ', icone: '🎓', desc: 'Conseiller en Sciences Administratives' },
  { nom: 'Agrégés', icone: '📜', desc: 'Agrégation de l\'Enseignement Supérieur' },
  { nom: 'CAPES toutes options', icone: '📖', desc: 'Certificat d\'Aptitude au Professorat' },
  { nom: 'Administrateur des hôpitaux', icone: '🏥', desc: 'Administration hospitalière publique' },
  { nom: 'Spécialités santé', icone: '💊', desc: 'Corps médical et paramédical' },
  { nom: 'Justice', icone: '⚖️', desc: 'Greffiers, auxiliaires de justice' },
  { nom: 'Magistrature', icone: '👨‍⚖️', desc: 'Magistrats du siège et du parquet' },
  { nom: 'Spécialités GSP', icone: '🛡️', desc: 'Gestion et Sécurité Publique' },
  { nom: 'Spécialités police', icone: '👮', desc: 'Corps de police nationale' },
  { nom: 'Administrateur civil', icone: '📋', desc: 'Administration publique générale' },
  { nom: 'Entraînement QCM', icone: '✏️', desc: 'QCM d\'entraînement transversaux', isAccompagnement: true },
  { nom: 'Accompagnement final', icone: '🎯', desc: 'Révision finale et conseils', isAccompagnement: true }
]

// Dossiers qu'on peut choisir comme principal (hors dossiers d'accompagnement)
const SPECIALITES_SELECTABLES = DOSSIERS_PRO.filter(d => !d.isAccompagnement)

// Mapping nom de dossier → image SVG moderne multicolore
const PRO_ICON_MAP = {
  'vie scolaire': '/icons/pro_school.svg',
  'casu': '/icons/pro_school.svg',
  'actualit': '/icons/pro_newspaper.svg',
  'culture': '/icons/pro_newspaper.svg',
  'cisu': '/icons/pro_building.svg',
  'aisu': '/icons/pro_building.svg',
  'enaref': '/icons/pro_building.svg',
  'ies': '/icons/pro_search.svg',
  'iepenf': '/icons/pro_search2.svg',
  'inspect': '/icons/pro_search.svg',
  'csap': '/icons/pro_graduation.svg',
  'agrég': '/icons/pro_scroll.svg',
  'capes': '/icons/pro_openbook.svg',
  'hôpital': '/icons/pro_hospital.svg',
  'hopital': '/icons/pro_hospital.svg',
  'santé': '/icons/pro_health.svg',
  'sante': '/icons/pro_health.svg',
  'justice': '/icons/pro_justice.svg',
  'magistr': '/icons/pro_judge.svg',
  'gsp': '/icons/pro_shield.svg',
  'police': '/icons/pro_badge.svg',
  'civil': '/icons/pro_clipboard.svg',
  'administrateur': '/icons/pro_clipboard.svg',
  'qcm': '/icons/pro_pencil.svg',
  'entraîn': '/icons/pro_pencil.svg',
  'accompagn': '/icons/pro_target.svg',
  'final': '/icons/pro_target.svg',
}

function getCatIconSrc(nom) {
  const n = (nom || '').toLowerCase()
  for (const [key, src] of Object.entries(PRO_ICON_MAP)) {
    if (n.includes(key)) return src
  }
  return '/icons/pro_clipboard.svg'
}

function getCatIcon(nom) {
  const src = getCatIconSrc(nom)
  return <img src={src} alt={nom} width="36" height="36" style={{ objectFit: 'contain', display: 'block' }} />
}

export default function SelectSpecialty() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [step, setStep] = useState(1) // 1=selection, 2=confirmation

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    // Si l'utilisateur a déjà un abonnement pro actif avec dossier principal, rediriger vers dashboard
    if (user && user.subscription_status === 'active' && user.abonnement_type === 'professionnel' && user.dossier_principal) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSelect = (dossier) => {
    setSelected(dossier)
    setStep(2)
  }

  const handleConfirm = () => {
    if (!selected) return
    // Rediriger vers le paiement avec le dossier sélectionné
    const encodedSpecialty = encodeURIComponent(selected.nom)
    router.push(`/payment?type=professionnel&specialty=${encodedSpecialty}`)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
        <div className="spinner mx-auto"></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Choisir votre spécialité – IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen" style={{ background: '#FFF8F0' }}>

        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => step === 2 ? setStep(1) : router.back()} className="p-2 text-orange-200 hover:text-white">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div style={{ width: 38, height: 38 }}>
              <img src="/logo.png" alt="IFL" style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 12 }} />
            </div>
            <div>
              <p className="text-white font-extrabold text-sm leading-tight">Concours Professionnels</p>
              <p className="text-orange-200 text-xs">
                {step === 1 ? 'Choisissez votre spécialité' : 'Confirmez votre choix'}
              </p>
            </div>
          </div>
          {/* Indicateur d'étape */}
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="flex gap-2 items-center">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: '#C4521A' }}></div>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: step >= 2 ? '#C4521A' : 'rgba(255,255,255,0.3)' }}></div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-orange-200 text-xs">1. Choisir dossier</span>
              <span className="text-orange-200 text-xs">2. Confirmer & Payer</span>
            </div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-5 pb-24">

          {/* ÉTAPE 1 : Sélection de la spécialité */}
          {step === 1 && (
            <div>
              {/* Bannière d'info */}
              <div className="rounded-2xl p-4 mb-5 border-2" style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', borderColor: '#D4A017' }}>
                <div className="flex gap-3 items-start">
                  <span className="text-2xl flex-shrink-0">🎓</span>
                  <div>
                    <p className="font-extrabold text-amber-800">Concours Professionnels – 20 000 FCFA</p>
                    <p className="text-amber-700 text-sm mt-1">
                      Choisissez <strong>1 dossier principal</strong> (votre spécialité). Vous recevrez automatiquement <strong>3 dossiers d'accompagnement</strong> offerts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dossiers d'accompagnement inclus */}
              <div className="bg-white rounded-2xl p-4 mb-5 border border-green-200 shadow-sm">
                <p className="font-bold text-green-700 text-sm mb-3 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Inclus automatiquement avec votre abonnement :
                </p>
                <div className="space-y-2">
                  {DOSSIERS_ACCOMPAGNEMENT.map((d, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl" style={{ background: '#F0FDF4' }}>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#16a34a' }}>✓</span>
                      <span className="text-sm font-semibold text-green-800">{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Titre liste spécialités */}
              <p className="font-extrabold text-base mb-3" style={{ color: '#8B2500' }}>
                Choisissez votre dossier principal ({SPECIALITES_SELECTABLES.length} spécialités) :
              </p>

              {/* Grille des spécialités */}
              <div className="space-y-3">
                {SPECIALITES_SELECTABLES.map((dossier, idx) => {
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(dossier)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98] shadow-md hover:shadow-lg"
                      style={{
                        background: 'white',
                        border: '2px solid #FFD0A8',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Image moderne multicolore sur fond blanc */}
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: '#FFF7ED', border: '1.5px solid #FFD0A8' }}>
                        {getCatIcon(dossier.nom)}
                      </div>
                      {/* Texte */}
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-sm leading-tight" style={{ color: '#8B2500' }}>{dossier.nom}</p>
                        <p className="text-gray-500 text-xs mt-0.5 truncate">{dossier.desc}</p>
                        <p className="text-xs font-bold mt-1" style={{ color: '#C4521A' }}>20 000 FCFA → Choisir ce dossier</p>
                      </div>
                      {/* Flèche */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4521A" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                  )
                })}
              </div>

              {/* Note bas de page */}
              <div className="mt-5 p-4 rounded-2xl" style={{ background: '#FFF0E8', border: '1px solid #FFD0A8' }}>
                <p className="text-xs text-amber-800 font-medium">
                  ℹ️ <strong>Important :</strong> Votre choix de dossier principal est définitif. Les 13 autres spécialités professionnelles resteront verrouillées pour protéger l'intégrité des concours.
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : Confirmation */}
          {step === 2 && selected && (
            <div>
              {/* Carte de confirmation */}
              <div className="bg-white rounded-3xl shadow-xl border-2 border-amber-200 p-6 mb-5">
                <div className="text-center mb-5">
                  {/* Image moderne multicolore - remplace emoji */}
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: '#FFF7ED', border: '2px solid #FFD0A8', boxShadow: '0 4px 12px rgba(196,82,26,0.15)' }}>
                    <img src={getCatIconSrc(selected.nom)} alt={selected.nom} width="52" height="52" style={{ objectFit: 'contain' }} />
                  </div>
                  <h2 className="text-xl font-extrabold" style={{ color: '#8B2500' }}>Confirmez votre choix</h2>
                  <p className="text-gray-500 text-sm mt-1">Vous avez sélectionné :</p>
                </div>

                {/* Dossier principal */}
                <div className="rounded-2xl p-4 mb-4" style={{ background: 'linear-gradient(135deg,#FFF0E8,#FFE5CC)', border: '2px solid #C4521A' }}>
                  <div className="flex items-center gap-3">
                    {/* Image petite remplace emoji */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'white', border: '1.5px solid #FFD0A8' }}>
                      <img src={getCatIconSrc(selected.nom)} alt={selected.nom} width="28" height="28" style={{ objectFit: 'contain' }} />
                    </div>
                    <div>
                      <p className="text-xs text-amber-700 font-bold">📌 Votre dossier principal</p>
                      <p className="font-extrabold" style={{ color: '#8B2500' }}>{selected.nom}</p>
                      <p className="text-gray-500 text-xs">{selected.desc}</p>
                    </div>
                  </div>
                </div>

                {/* Dossiers offerts */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-green-700 mb-2">🎁 Dossiers d'accompagnement inclus GRATUITEMENT :</p>
                  {DOSSIERS_ACCOMPAGNEMENT.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl mb-1.5" style={{ background: '#F0FDF4' }}>
                      <span className="text-green-600 text-sm">✅</span>
                      <span className="text-sm font-medium text-green-800">{d}</span>
                    </div>
                  ))}
                </div>

                {/* Dossiers verrouillés */}
                <div className="p-3 rounded-xl mb-4" style={{ background: '#F8F8F8', border: '1px dashed #ccc' }}>
                  <p className="text-xs text-gray-500 font-medium">🔒 {SPECIALITES_SELECTABLES.length - 1} autres spécialités seront verrouillées</p>
                </div>

                {/* Prix */}
                <div className="text-center p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)', border: '2px solid #D4A017' }}>
                  <p className="text-gray-600 text-sm">Montant total</p>
                  <p className="text-3xl font-extrabold" style={{ color: '#C4521A' }}>20 000 FCFA</p>
                  <p className="text-xs text-amber-700 mt-1">Paiement Orange Money · Accès immédiat après validation</p>
                </div>
              </div>

              {/* Bouton confirmer */}
              <button
                onClick={handleConfirm}
                className="w-full py-4 text-white font-extrabold text-lg rounded-2xl shadow-xl active:scale-95 transition-all mb-3"
                style={{ background: 'linear-gradient(135deg,#C4521A,#8B2500)' }}
              >
                ✅ Confirmer – Procéder au paiement
              </button>

              {/* Bouton changer */}
              <button
                onClick={() => setStep(1)}
                className="w-full py-3 font-semibold rounded-2xl border-2 border-gray-200 bg-white"
                style={{ color: '#8B2500' }}
              >
                ← Changer de spécialité
              </button>

              {/* Avertissement */}
              <div className="mt-4 p-4 rounded-2xl" style={{ background: '#FFF0E8', border: '1px solid #FFD0A8' }}>
                <p className="text-xs text-amber-800">
                  ⚠️ <strong>Ce choix est définitif.</strong> Une fois votre paiement validé, votre dossier principal sera fixé et ne pourra pas être changé. Assurez-vous de choisir votre vraie spécialité de concours.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bouton flottant WhatsApp */}
        <a
          href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20j'ai%20besoin%20d'aide%20pour%20choisir%20ma%20sp%C3%A9cialit%C3%A9"
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
