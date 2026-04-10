import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../_app'

export default function QuizPage() {
  const { user, loading, getToken } = useAuth()
  const router = useRouter()
  const { id } = router.query

  const [questions, setQuestions] = useState([])
  const [category, setCategory] = useState(null)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loadingQ, setLoadingQ] = useState(true)
  const [error, setError] = useState('')
  const [hasFullAccess, setHasFullAccess] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      // Rediriger vers la page quiz publique pour les visiteurs non connectés
      if (id) router.replace(`/quiz/public/${id}`)
    }
  }, [user, loading, router, id])

  useEffect(() => {
    if (id && user) fetchQuestions()
  }, [id, user])

  const fetchQuestions = async () => {
    setLoadingQ(true)
    try {
      const token = getToken()
      const [catRes, qRes] = await Promise.all([
        fetch('/api/quiz/categories', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/quiz/questions?categorie_id=${id}`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      const catData = await catRes.json()
      const qData = await qRes.json()

      if (qData.error && qRes.status === 403) {
        // Pas d'accès du tout, rediriger vers paiement
        setError(qData.error)
      } else if (qData.error) {
        setError(qData.error)
      } else {
        setQuestions(qData.questions || [])
        setHasFullAccess(qData.hasFullAccess || false)
        const cat = catData.categories?.find(c => c.id === id)
        setCategory(cat || null)
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
    try {
      const token = getToken()
      fetch('/api/quiz/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ categorie_id: id, score: score + (opt === questions[current].bonne_reponse ? 1 : 0) })
      })
    } catch {}
  }

  const handleNext = () => {
    const nextIndex = current + 1
    if (nextIndex >= questions.length) {
      // Vérifier si on a terminé toutes les questions gratuites mais il y en a d'autres
      if (!hasFullAccess) {
        setShowUpgrade(true)
      } else {
        setFinished(true)
      }
    } else {
      setCurrent(nextIndex)
      setSelected(null)
      setAnswered(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
        <div className="text-center"><div className="spinner mx-auto mb-3"></div><p className="text-white font-semibold">Chargement...</p></div>
      </div>
    )
  }

  const q = questions[current]
  const total = questions.length
  const progress = total > 0 ? ((current + (answered ? 1 : 0)) / total) * 100 : 0
  const catType = category?.type || 'direct'
  const catPrice = catType === 'professionnel' ? 20000 : 5000

  return (
    <>
      <Head>
        <title>{category?.nom || 'QCM'} – IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen" style={{ background: '#FFF8F0' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="text-orange-200 hover:text-white p-1">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold truncate leading-tight">{category?.nom || 'QCM'}</p>
              {!loadingQ && !error && (
                <p className="text-orange-200 text-xs">
                  {hasFullAccess
                    ? `${total} question${total > 1 ? 's' : ''}`
                    : `${total} question${total > 1 ? 's' : ''} gratuites`}
                </p>
              )}
            </div>
            {!loadingQ && !error && !showUpgrade && (
              <span className="text-white text-sm font-bold opacity-70 flex-shrink-0">
                {current + 1}/{total}
              </span>
            )}
          </div>
          {!loadingQ && !error && !finished && !showUpgrade && (
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
              <p className="text-gray-500">Chargement des questions...</p>
            </div>
          )}

          {/* Erreur d'accès */}
          {error && !loadingQ && (
            <div className="animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-md p-8 text-center border border-red-100">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-extrabold text-gray-800 mb-2">Accès restreint</h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <Link href="/payment" className="block w-full py-4 text-center text-lg font-bold text-white rounded-xl mb-3 shadow-md active:scale-95" style={{ background: '#C4521A' }}>
                  💳 S&apos;abonner maintenant
                </Link>
                <Link href="/dashboard" className="block text-center text-gray-400 text-sm">
                  ← Retour au tableau de bord
                </Link>
              </div>
            </div>
          )}

          {/* Aucune question */}
          {!loadingQ && !error && total === 0 && (
            <div className="text-center py-16 animate-fadeIn">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Aucune question</h3>
              <p className="text-gray-500 mb-6">Les questions pour cette catégorie ne sont pas encore disponibles.</p>
              <Link href="/dashboard" className="inline-block px-6 py-3 font-bold text-white rounded-xl" style={{ background: '#C4521A' }}>
                ← Retour
              </Link>
            </div>
          )}

          {/* Bannière "questions gratuites" si accès limité */}
          {!loadingQ && !error && total > 0 && !hasFullAccess && !showUpgrade && !finished && (
            <div className="mb-4 rounded-2xl p-3 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#FFF7E6,#FFE4B5)' }}>
              <span className="text-2xl">🆓</span>
              <div className="flex-1">
                <p className="text-amber-800 font-bold text-sm">Questions gratuites ({total} sur ce dossier)</p>
                <p className="text-amber-700 text-xs">Abonnez-vous pour accéder à toutes les questions</p>
              </div>
              <Link href={`/payment?type=${catType}&montant=${catPrice}`} className="px-3 py-1.5 text-xs font-bold text-white rounded-lg flex-shrink-0" style={{ background: '#C4521A' }}>
                Débloquer
              </Link>
            </div>
          )}

          {/* Écran d'upgrade (fin des questions gratuites) */}
          {showUpgrade && !loadingQ && (
            <div className="animate-popIn">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-amber-100 text-center">
                <div className="text-7xl mb-4">🔓</div>
                <h2 className="text-2xl font-extrabold mb-2" style={{ color: '#8B2500' }}>
                  Vous avez terminé les questions gratuites !
                </h2>
                <p className="text-gray-500 mb-3">
                  Dossier : <strong>{category?.nom}</strong>
                </p>
                <div className="rounded-2xl p-4 mb-5" style={{ background: '#FFF7E6' }}>
                  <p className="text-amber-800 font-bold text-lg">Score sur les questions gratuites</p>
                  <p className="text-4xl font-extrabold mt-1" style={{ color: '#C4521A' }}>
                    {score}<span className="text-xl text-gray-400">/{total}</span>
                  </p>
                </div>
                <div className="rounded-2xl p-5 mb-5" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                  <p className="text-orange-200 text-sm mb-1">Abonnez-vous pour accéder à</p>
                  <p className="text-white font-bold text-lg mb-1">TOUTES les questions de ce dossier</p>
                  <p className="text-2xl font-extrabold text-white">{catPrice.toLocaleString()} FCFA <span className="text-base font-normal opacity-80">/an</span></p>
                </div>
                <div className="space-y-3">
                  <Link
                    href={`/payment?type=${catType}&montant=${catPrice}`}
                    className="block w-full py-4 text-center text-lg font-bold text-white rounded-xl shadow-lg active:scale-95"
                    style={{ background: '#C4521A' }}
                  >
                    💳 S&apos;abonner – {catPrice.toLocaleString()} FCFA
                  </Link>
                  <button
                    onClick={() => { setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setShowUpgrade(false) }}
                    className="w-full py-3.5 font-bold rounded-xl border-2 border-amber-300 text-amber-800 active:scale-95"
                  >
                    🔄 Recommencer les questions gratuites
                  </button>
                  <Link href="/dashboard" className="block text-center text-gray-400 text-sm py-2">
                    ← Retour aux dossiers
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Résultats (accès complet) */}
          {finished && !loadingQ && !showUpgrade && (
            <div className="animate-popIn">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-amber-100 text-center">
                <div className="text-7xl mb-4">{score >= total * 0.7 ? '🏆' : score >= total * 0.5 ? '👍' : '📚'}</div>
                <h2 className="text-3xl font-extrabold mb-1" style={{ color: '#8B2500' }}>Terminé !</h2>
                <p className="text-gray-500 mb-5">{category?.nom}</p>
                <div className="rounded-2xl p-5 mb-6" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                  <p className="text-white font-semibold mb-1">Votre score</p>
                  <p className="text-5xl font-extrabold text-white">{score}<span className="text-2xl opacity-70">/{total}</span></p>
                  <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(score/total)*100}%`, background: '#D4A017', transition: 'width 1s ease' }}></div>
                  </div>
                  <p className="text-orange-200 text-sm mt-2">{Math.round((score/total)*100)}% de réussite</p>
                </div>
                <div className="space-y-3">
                  <button onClick={() => { setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setFinished(false) }}
                    className="w-full py-4 text-lg font-bold text-white rounded-xl shadow-md active:scale-95"
                    style={{ background: '#C4521A' }}>
                    🔄 Recommencer
                  </button>
                  <Link href="/dashboard" className="block w-full py-3.5 text-center font-bold rounded-xl border-2 border-gray-200 text-gray-700 active:scale-95">
                    ← Retour aux dossiers
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Question */}
          {!loadingQ && !error && !finished && !showUpgrade && q && (
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
                    <p className="text-gray-700 text-sm leading-relaxed">{q.explication}</p>
                  </div>
                )}
              </div>

              {answered && (
                <button onClick={handleNext} className="w-full py-4 text-lg font-bold text-white rounded-xl shadow-lg active:scale-95 animate-popIn"
                  style={{ background: 'linear-gradient(135deg, #C4521A, #8B2500)' }}>
                  {current + 1 >= total
                    ? (hasFullAccess ? '📊 Voir mes résultats' : '🔓 Voir le résumé')
                    : 'Question suivante →'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
