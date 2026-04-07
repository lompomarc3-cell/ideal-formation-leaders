import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

const APP_URL = 'https://ideal-formation-leaders.pages.dev'
const WHATSAPP_NUMBER = '22676223962'
const OM_NUMBER = '+226 76 22 39 62'

export default function Help() {
  const [shareMsg, setShareMsg] = useState('')

  const handleShare = async () => {
    const text = `🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n✅ Des milliers de QCM\n✅ Concours directs (5 000 FCFA)\n✅ Concours professionnels (20 000 FCFA)\n✅ 10 questions gratuites sans inscription\n\n👉 ${APP_URL}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'IFL – Idéale Formation of Leader',
          text: text,
          url: APP_URL
        })
        setShareMsg('✅ Partagé avec succès !')
      } catch (e) {
        if (e.name !== 'AbortError') {
          fallbackShare(text)
        }
      }
    } else {
      fallbackShare(text)
    }
    setTimeout(() => setShareMsg(''), 3000)
  }

  const fallbackShare = (text) => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }

  const handleWhatsApp = () => {
    const msg = encodeURIComponent("Bonjour, j'ai besoin d'aide pour IFL – Idéale Formation of Leader.")
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank')
  }

  return (
    <>
      <Head>
        <title>Aide & Contact – IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen" style={{ background: '#FFF8F0' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)' }} className="sticky top-0 z-40 shadow-lg py-3 px-4">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <Link href="/" className="text-orange-200 hover:text-white p-1">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <div style={{ borderRadius: 12, overflow: 'hidden', width: 38, height: 38, flexShrink: 0 }}>
                <img src="/logo.png" alt="IFL" style={{ width: 38, height: 38, objectFit: 'cover' }} />
              </div>
              <span className="text-white font-bold text-lg">Aide & Contact</span>
            </div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* Contacter l'équipe WhatsApp */}
          <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6">
            <h2 className="text-xl font-extrabold mb-4" style={{ color: '#8B2500' }}>📞 Contacter l'équipe</h2>

            <button
              onClick={handleWhatsApp}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp : +226 76 22 39 62
            </button>

            <div className="mt-4 rounded-xl p-4" style={{ background: '#FFF0E8' }}>
              <p className="text-sm font-semibold" style={{ color: '#8B2500' }}>📱 Numéro WhatsApp direct :</p>
              <p className="text-2xl font-extrabold mt-1" style={{ color: '#C4521A' }}>+226 76 22 39 62</p>
              <p className="text-xs text-gray-500 mt-1">Disponible pour toute assistance</p>
            </div>
          </div>

          {/* Partager l'application */}
          <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6">
            <h2 className="text-xl font-extrabold mb-2" style={{ color: '#8B2500' }}>📤 Partager l'application</h2>
            <p className="text-gray-500 text-sm mb-4">Recommandez IFL à vos amis qui préparent des concours</p>

            <div className="rounded-xl p-3 mb-4 font-mono text-sm text-center border-2 border-dashed border-amber-300" style={{ background: '#FFF8F0', color: '#8B2500', wordBreak: 'break-all' }}>
              {APP_URL}
            </div>

            <button
              onClick={handleShare}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all mb-3"
              style={{ background: 'linear-gradient(135deg, #C4521A 0%, #8B2500 100%)' }}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Partager l'application
            </button>

            {/* Partage direct WhatsApp */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n✅ Des milliers de QCM\n✅ Concours directs & professionnels\n✅ 10 questions gratuites sans inscription\n\n👉 ${APP_URL}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-md active:scale-95 transition-all"
              style={{ background: '#25D366', color: 'white', display: 'flex' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Partager via WhatsApp
            </a>

            {shareMsg && (
              <p className="text-center font-bold mt-3" style={{ color: '#C4521A' }}>{shareMsg}</p>
            )}
          </div>

          {/* Paiement Orange Money */}
          <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF9500 100%)' }}>
            <h3 className="text-xl font-extrabold mb-3 flex items-center gap-2">
              <span className="text-2xl">📱</span> Paiement Orange Money
            </h3>
            <div className="space-y-3">
              <div className="bg-white/20 rounded-xl p-4">
                <p className="font-bold text-base">📞 Numéro de paiement :</p>
                <p className="text-3xl font-extrabold mt-1">{OM_NUMBER}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <p className="font-bold text-sm mb-2">Code USSD :</p>
                <code className="bg-white/30 px-3 py-2 rounded-lg font-mono text-xl font-bold block text-center">
                  *144*2*1*76223962#
                </code>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <p className="font-bold text-sm">📸 Après le paiement :</p>
                <p className="text-orange-100 text-sm mt-1">Envoyez la capture d'écran via WhatsApp au <strong>+226 76 22 39 62</strong></p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6">
            <h2 className="text-xl font-extrabold mb-4" style={{ color: '#8B2500' }}>❓ Questions fréquentes</h2>
            <div className="space-y-4">
              {[
                {
                  q: "Comment s'inscrire ?",
                  a: "Cliquez sur 'S'inscrire', entrez votre nom, prénom, numéro +226 et mot de passe."
                },
                {
                  q: "Comment payer ?",
                  a: "Utilisez Orange Money : composez *144*2*1*76223962# ou envoyez au +226 76 22 39 62. Ensuite envoyez la capture par WhatsApp."
                },
                {
                  q: "Combien de temps pour l'activation ?",
                  a: "Votre abonnement est activé dans les 24h après réception du paiement."
                },
                {
                  q: "La démo est-elle vraiment gratuite ?",
                  a: "Oui ! 10 questions gratuites, accessible sans inscription et sans connexion."
                },
                {
                  q: "Quelle est la durée de l'abonnement ?",
                  a: "1 an à partir de la date d'activation. Concours Directs : 5 000 FCFA. Concours Professionnels : 20 000 FCFA."
                }
              ].map((item, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: '#FFF8F0' }}>
                  <p className="font-bold text-base mb-1" style={{ color: '#8B2500' }}>❓ {item.q}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA bas */}
          <div className="text-center pb-6">
            <Link href="/" className="text-gray-400 text-sm hover:text-gray-600">← Retour à l'accueil</Link>
          </div>
        </div>
      </div>
    </>
  )
}
