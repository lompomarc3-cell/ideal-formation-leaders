import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './_app'

const APP_URL = 'https://ideal-formation-leaders.pages.dev'

export default function Help() {
  const { user } = useAuth()
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState(null)

  const handleShare = async () => {
    const text = `🎓 Préparez vos concours du Burkina Faso avec IFL !\n\n✅ Des milliers de QCM\n✅ Concours directs (5 000 FCFA/an)\n✅ Concours professionnels (20 000 FCFA/an)\n\n👉 ${APP_URL}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'IFL', text, url: APP_URL }) } catch {}
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }
  }

  const faqs = [
    {
      q: 'Comment m\'abonner ?',
      a: '1. Connectez-vous ou créez un compte\n2. Allez dans "Paiement"\n3. Effectuez le paiement Orange Money : *144*2*1*76223962#\n4. Envoyez la capture via WhatsApp au +226 76 22 39 62\n5. Votre abonnement sera activé sous 24h'
    },
    {
      q: 'Comment effectuer le paiement Orange Money ?',
      a: 'Composez *144*2*1*76223962# sur votre téléphone Orange, saisissez le montant (5 000 ou 20 000 FCFA), confirmez avec votre code secret.\nBénéficiaire : +226 76 22 39 62'
    },
    {
      q: 'Combien de temps dure l\'abonnement ?',
      a: 'L\'abonnement est valable 1 an à partir de la date d\'activation. Vous avez accès à tous les QCM de votre formule pendant cette période.'
    },
    {
      q: 'Quelle est la différence entre les deux formules ?',
      a: '📚 Concours Directs (5 000 FCFA/an) : 10 dossiers thématiques (Actualité, Français, Maths, SVT, etc.)\n\n🎓 Concours Professionnels (20 000 FCFA/an) : 12 dossiers spécialisés (CASU, CAPES, Police, Santé, etc.)'
    },
    {
      q: 'Mon abonnement n\'est pas activé après paiement ?',
      a: 'Vérifiez que vous avez bien envoyé la capture de paiement via WhatsApp au +226 76 22 39 62. L\'activation prend jusqu\'à 24h après réception de la preuve.'
    },
    {
      q: 'Comment partager l\'application ?',
      a: `Utilisez le bouton "Partager" disponible dans l'application ou partagez directement le lien : ${APP_URL}`
    }
  ]

  return (
    <>
      <Head>
        <title>Aide – IFL</title>
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
              <p className="text-white font-extrabold text-sm">Aide & Contact</p>
              <p className="text-orange-200 text-xs">IFL Burkina Faso</p>
            </div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-5 pb-24">

          {/* Contact rapide */}
          <h2 className="text-xl font-extrabold mb-4" style={{ color: '#8B2500' }}>📞 Contactez-nous</h2>
          
          <div className="space-y-3 mb-6">
            {/* WhatsApp */}
            <a
              href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20j'ai%20besoin%20d'aide"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: '#E8F5E9' }}>
                💬
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">WhatsApp Assistance</p>
                <p className="text-gray-500 text-sm">+226 76 22 39 62</p>
              </div>
              <svg width="20" height="20" fill="none" stroke="#25D366" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>

            {/* Orange Money */}
            <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9500)' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">📱</span>
                <div>
                  <p className="font-extrabold">Paiement Orange Money</p>
                  <p className="text-orange-100 text-xs">Pour votre abonnement</p>
                </div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-3 mb-2">
                <p className="text-orange-100 text-xs">Code USSD :</p>
                <p className="text-xl font-extrabold tracking-wider">*144*2*1*76223962#</p>
              </div>
              <p className="text-orange-100 text-sm">Bénéficiaire : <strong className="text-white">+226 76 22 39 62</strong></p>
              <div className="flex gap-3 mt-3">
                <div className="flex-1 bg-white bg-opacity-15 rounded-xl p-2 text-center">
                  <p className="text-xs text-orange-100">Directs</p>
                  <p className="font-extrabold">5 000 FCFA</p>
                </div>
                <div className="flex-1 bg-white bg-opacity-15 rounded-xl p-2 text-center">
                  <p className="text-xs text-orange-100">Professionnels</p>
                  <p className="font-extrabold">20 000 FCFA</p>
                </div>
              </div>
            </div>

            {/* Partager */}
            <button
              onClick={handleShare}
              className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 w-full active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: '#FFF0E8' }}>
                📤
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-800">Partager l'application</p>
                <p className="text-gray-500 text-sm">Invitez vos amis à rejoindre IFL</p>
              </div>
              <svg width="20" height="20" fill="none" stroke="#C4521A" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>

          {/* FAQ */}
          <h2 className="text-xl font-extrabold mb-4" style={{ color: '#8B2500' }}>❓ Questions fréquentes</h2>
          <div className="space-y-2 mb-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-4 py-4 text-left flex items-center justify-between"
                >
                  <p className="font-bold text-gray-800 text-sm pr-3">{faq.q}</p>
                  <span className="text-amber-500 text-xl font-bold flex-shrink-0 transition-transform"
                    style={{ transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <div className="h-px bg-amber-100 mb-3"></div>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Liens utiles */}
          <h2 className="text-xl font-extrabold mb-4" style={{ color: '#8B2500' }}>🔗 Liens utiles</h2>
          <div className="grid grid-cols-2 gap-3">
            {user ? (
              <Link href="/dashboard" className="bg-white rounded-2xl p-4 text-center shadow-sm border border-amber-100 active:scale-95">
                <span className="text-2xl block mb-1">🏠</span>
                <p className="font-bold text-gray-700 text-sm">Mon espace</p>
              </Link>
            ) : (
              <Link href="/register" className="bg-white rounded-2xl p-4 text-center shadow-sm border border-amber-100 active:scale-95">
                <span className="text-2xl block mb-1">📝</span>
                <p className="font-bold text-gray-700 text-sm">S'inscrire</p>
              </Link>
            )}
            <Link href="/demo" className="bg-white rounded-2xl p-4 text-center shadow-sm border border-amber-100 active:scale-95">
              <span className="text-2xl block mb-1">🎯</span>
              <p className="font-bold text-gray-700 text-sm">Démo gratuite</p>
            </Link>
            <Link href="/payment" className="bg-white rounded-2xl p-4 text-center shadow-sm border border-amber-100 active:scale-95">
              <span className="text-2xl block mb-1">💳</span>
              <p className="font-bold text-gray-700 text-sm">Paiement</p>
            </Link>
            <a href={APP_URL} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-amber-100 active:scale-95">
              <span className="text-2xl block mb-1">🌐</span>
              <p className="font-bold text-gray-700 text-sm">Site web</p>
            </a>
          </div>
        </div>

        {/* Bouton flottant WhatsApp */}
        <a
          href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20j'ai%20besoin%20d'aide"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-50 text-2xl"
          style={{ background: '#25D366' }}
          title="WhatsApp Assistance"
        >
          💬
        </a>
      </div>
    </>
  )
}
