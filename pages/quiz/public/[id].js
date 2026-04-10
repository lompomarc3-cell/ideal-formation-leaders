// Page Quiz Publique – Accès aux 5 premières questions gratuites sans connexion
import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function PublicQuizPage() {
  const router = useRouter()
  const { id } = router.query

  const [questions, setQuestions] = useState([])
  const [categoryName, setCategoryName] = useState('')
  const [categoryType, setCategoryType] = useState('direct')
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loadingQ, setLoadingQ] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) fetchPublicQuestions()
  }, [id])

  const fetchPublicQuestions = async () => {
    setLoadingQ(true)
    try {
      const res = await fetch(`/api/quiz/public-questions?categorie_id=${id}`)
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setQuestions(data.questions || [])
        setCategoryName(data.categoryName || 'QCM')
        setCategoryType(data.categoryType || 'direct')
      }
    } catch {
      setError('Erreur de chargement des questions')
    }
    setLoadingQ(false)
  }

  const handleSelect = (opt) => {
    if (answered) return
    setSelected(opt)
    setAnswered(true)
    if (opt === questions[current].bonne_reponse) setScore(s => s + 1)
  }

  const handleNext = () => {
    const nextIndex = current + 1
    if (nextIndex >= questions.length) {
      setFinished(true)
    } else {
      setCurrent(nextIndex)
      setSelected(null)
      setAnswered(false)
    }
  }

  const q = questions[current]
  const total = questions.length
  const progress = total > 0 ? ((current + (answered ? 1 : 0)) / total) * 100 : 0
  const catPrice = categoryType === 'professionnel' ? 20000 : 5000

  return (
    <>
      <Head>
        <title>{categoryName || 'QCM Gratuit'} – IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen" style={{ background: '#FFF8F0' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-orange-200 hover:text-white p-1">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold truncate leading-tight">{categoryName || 'QCM'}</p>
              {!loadingQ && !error && (
                <p className="text-orange-200 text-xs">🆓 {total} question{total > 1 ? 's' : ''} gratuite{total > 1 ? 's' : ''}</p>
              )}
            </div>
            {!loadingQ && !error && !finished && (
              <span className="text-white text-sm font-bold opacity-70 flex-shrink-0">
                {current + 1}/{total}
              </span>
            )}
          </div>
          {!loadingQ && !error && !finished && (
            <div className="h-1.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="h-full progress-bar" style={{ width: `${progress}%`, background: '#D4A017' }}></div>
            </div>
          )}
        </header>

        <div className="max-w-lg mx-auto px-4 py-5">
          {/* Loading */}
          {loadingQ && (
            <div className="py-16 text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement des questions gratuites...</p>
            </div>
          )}

          {/* Erreur */}
          {error && !loadingQ && (
            <div className="animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-md p-8 text-center border border-amber-100">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-extrabold text-gray-800 mb-2">Questions non disponibles</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <p className="text-gray-400 text-sm mb-6">Ce dossier n'a pas encore de questions gratuites configurées. Inscrivez-vous pour accéder à tout le contenu.</p>
                <div className="space-y-3">
                  <Link href="/register" className="block w-full py-4 text-center text-lg font-bold text-white rounded-xl shadow-md active:scale-95" style={{ background: '#C4521A' }}>
                    🚀 S'inscrire gratuitement
                  </Link>
                  <Link href="/" className="block text-center text-gray-400 text-sm">
                    ← Retour à l'accueil
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Aucune question */}
          {!loadingQ && !error && total === 0 && (
            <div className="text-center py-16 animate-fadeIn">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Aucune question gratuite</h3>
              <p className="text-gray-500 mb-6">Inscrivez-vous pour accéder à toutes les questions de ce dossier.</p>
              <Link href="/register" className="inline-block px-6 py-3 font-bold text-white rounded-xl" style={{ background: '#C4521A' }}>
                🚀 S'inscrire →
              </Link>
            </div>
          )}

          {/* Bannière "questions gratuites" */}
          {!loadingQ && !error && total > 0 && !finished && (
            <div className="mb-4 rounded-2xl p-3 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)' }}>
              <span className="text-2xl">🆓</span>
              <div className="flex-1">
                <p className="text-amber-800 font-bold text-sm">Questions gratuites ({total} sur ce dossier)</p>
                <p className="text-amber-700 text-xs">Inscrivez-vous pour accéder à toutes les questions</p>
              </div>
              <Link href="/register" className="px-3 py-1.5 text-xs font-bold text-white rounded-lg flex-shrink-0" style={{ background: '#C4521A' }}>
                S'inscrire
              </Link>
            </div>
          )}

          {/* Résultats finaux */}
          {finished && !loadingQ && (
            <div className="animate-popIn">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-amber-100 text-center">
                <div className="text-7xl mb-4">{score >= total * 0.7 ? '🏆' : score >= total * 0.5 ? '👍' : '📚'}</div>
                <h2 className="text-2xl font-extrabold mb-2" style={{ color: '#8B2500' }}>
                  Bravo ! Quiz terminé !
                </h2>
                <p className="text-gray-500 mb-3">{categoryName}</p>
                <div className="rounded-2xl p-4 mb-5" style={{ background: '#FFF7E6' }}>
                  <p className="text-amber-800 font-bold">Votre score</p>
                  <p className="text-4xl font-extrabold mt-1" style={{ color: '#C4521A' }}>
                    {score}<span className="text-xl text-gray-400">/{total}</span>
                  </p>
                  <p className="text-amber-700 text-sm mt-1">{Math.round((score/total)*100)}% de réussite</p>
                </div>

                {/* Cadenas / appel à l'action pour voir plus */}
                <div className="rounded-2xl p-5 mb-5" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                  <div className="text-4xl mb-2">🔒</div>
                  <p className="text-orange-200 text-sm mb-1">Vous avez terminé les 5 questions gratuites</p>
                  <p className="text-white font-bold text-base mb-1">Inscrivez-vous pour accéder à</p>
                  <p className="text-white font-bold text-lg">TOUTES les questions de ce dossier</p>
                  <p className="text-2xl font-extrabold text-white mt-2">{catPrice.toLocaleString()} FCFA <span className="text-base font-normal opacity-80">/an</span></p>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/register"
                    className="block w-full py-4 text-center text-lg font-bold text-white rounded-xl shadow-lg active:scale-95"
                    style={{ background: '#C4521A' }}
                  >
                    🚀 S'inscrire gratuitement
                  </Link>
                  <Link href="/login" className="block w-full py-3.5 text-center font-bold rounded-xl border-2 border-amber-300 text-amber-800 active:scale-95">
                    🔓 Se connecter
                  </Link>
                  <button
                    onClick={() => { setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setFinished(false) }}
                    className="w-full py-3 font-bold rounded-xl bg-gray-100 text-gray-600 active:scale-95"
                  >
                    🔄 Recommencer
                  </button>
                  <Link href="/" className="block text-center text-gray-400 text-sm py-2">
                    ← Retour à l'accueil
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Question */}
          {!loadingQ && !error && !finished && q && (
            <div className="animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6 mb-5">
                <div className="flex items-start gap-3 mb-6">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: '#D4A017' }}>{current + 1}</span>
                  <p className="text-gray-800 font-semibold text-lg leading-relaxed">{q.question_text}</p>
                </div>

                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const optText = q[`option_${opt.toLowerCase()}`]
                    let cls = 'question-option'
                    if (answered) {
                      if (opt === q.bonne_reponse) cls += ' correct'
                      else if (opt === selected) cls += ' wrong'
                      else cls += ' disabled opacity-50'
                    }
                    return (
                      <button key={opt} className={cls} onClick={() => handleSelect(opt)}>
                        <span className="inline-flex w-7 h-7 rounded-full items-center justify-center text-sm font-bold mr-3 flex-shrink-0"
                          style={{
                            background: answered && opt === q.bonne_reponse ? '#D4A017' : answered && opt === selected ? '#dc2626' : '#f3f4f6',
                            color: answered && (opt === q.bonne_reponse || opt === selected) ? 'white' : '#374151'
                          }}>
                          {opt}
                        </span>
                        {optText}
                      </button>
                    )
                  })}
                </div>

                {answered && (
                  <div className="mt-5 animate-fadeIn rounded-2xl p-4"
                    style={{ background: selected === q.bonne_reponse ? '#FFF7E6' : '#FFF7F0', borderLeft: `4px solid ${selected === q.bonne_reponse ? '#D4A017' : '#C4521A'}` }}>
                    <p className="font-bold mb-1.5 text-sm" style={{ color: selected === q.bonne_reponse ? '#D4A017' : '#C4521A' }}>
                      {selected === q.bonne_reponse ? '✅ Bonne réponse !' : `❌ Mauvaise – Bonne réponse : ${q.bonne_reponse}`}
                    </p>
                    {q.explication && <p className="text-gray-700 text-sm leading-relaxed">{q.explication}</p>}
                  </div>
                )}
              </div>

              {answered && (
                <button onClick={handleNext} className="w-full py-4 text-lg font-bold text-white rounded-xl shadow-lg active:scale-95 animate-popIn"
                  style={{ background: 'linear-gradient(135deg, #C4521A, #8B2500)' }}>
                  {current + 1 >= total ? '🔓 Voir le résumé' : 'Question suivante →'}
                </button>
              )}

              {/* Appel à l'inscription discret */}
              {current === 2 && !answered && (
                <div className="mt-4 text-center p-3 rounded-xl" style={{ background: '#FFF7E6' }}>
                  <p className="text-amber-700 text-xs font-semibold">💡 Vous appréciez ? <Link href="/register" style={{ color: '#C4521A' }} className="font-bold underline">Inscrivez-vous</Link> pour accéder à des centaines de questions !</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bouton flottant WhatsApp */}
        <a
          href="https://wa.me/22676223962?text=Bonjour%20IFL%2C%20je%20voudrais%20m%27abonner"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-50 text-2xl"
          style={{ background: '#25D366' }}
          title="WhatsApp"
        >
          💬
        </a>
      </div>
    </>
  )
}
