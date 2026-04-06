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
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loadingQ, setLoadingQ] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (id && user) {
      fetchQuestions()
    }
  }, [id, user])

  const fetchQuestions = async () => {
    setLoadingQ(true)
    setError('')
    try {
      const token = getToken()
      const res = await fetch(`/api/quiz/questions?categorie_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.requirePayment) {
          setError('Abonnement requis pour accéder à ce contenu.')
        } else {
          setError(data.error || 'Erreur')
        }
        setLoadingQ(false)
        return
      }

      setQuestions(data.questions || [])

      // Récupérer la catégorie
      const catRes = await fetch(`/api/quiz/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const catData = await catRes.json()
      if (catData.categories) {
        const cat = catData.categories.find(c => c.id === id)
        setCategory(cat)
      }

      // Récupérer progression
      const progRes = await fetch(`/api/quiz/progress?categorie_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const progData = await progRes.json()
      if (progData.progress && progData.progress.length > 0) {
        const prog = progData.progress[0]
        // Reprendre à la dernière question
        if (prog.total_repondu > 0 && prog.total_repondu < (data.questions || []).length) {
          setCurrentQ(prog.total_repondu)
          setScore(prog.score || 0)
        }
      }
    } catch (e) {
      setError('Erreur lors du chargement.')
    }
    setLoadingQ(false)
  }

  const saveProgress = async (newScore, newTotal, questionId) => {
    try {
      const token = getToken()
      await fetch('/api/quiz/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          categorie_id: id,
          derniere_question_id: questionId,
          score: newScore,
          total_repondu: newTotal
        })
      })
    } catch (e) {}
  }

  const handleSelect = async (key) => {
    if (answered) return
    setSelected(key)
    setAnswered(true)
    const q = questions[currentQ]
    const isCorrect = key === q.bonne_reponse
    const newScore = isCorrect ? score + 1 : score
    const newTotal = currentQ + 1
    setScore(newScore)
    await saveProgress(newScore, newTotal, q.id)
  }

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true)
    } else {
      setCurrentQ(c => c + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  if (loading || loadingQ) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFF8F0' }}>
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des questions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FFF8F0' }}>
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm shadow-lg">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-gray-800 font-bold text-lg mb-2">{error}</p>
          <div className="space-y-3 mt-5">
            <Link href="/dashboard" className="block py-3 font-bold text-white rounded-xl" style={{ background: '#1A4731' }}>
              ← Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FFF8F0' }}>
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm shadow-lg">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-800 font-bold text-lg mb-2">Aucune question disponible</p>
          <p className="text-gray-500 text-sm mb-5">Les questions seront ajoutées prochainement par l'équipe IFL.</p>
          <Link href="/dashboard" className="block py-3 font-bold text-white rounded-xl" style={{ background: '#1A4731' }}>
            ← Retour
          </Link>
        </div>
      </div>
    )
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    const mention = pct >= 80 ? { label: 'Excellent !', color: '#1A4731', emoji: '🏆' }
      : pct >= 60 ? { label: 'Bien !', color: '#D4A017', emoji: '👍' }
      : { label: 'À améliorer', color: '#C4521A', emoji: '💪' }

    return (
      <>
        <Head><title>Résultats – IFL</title></Head>
        <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(160deg, #1A4731 0%, #2D6A4F 50%, #C4521A 100%)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="text-7xl mb-3">{mention.emoji}</div>
            <h2 className="text-2xl font-extrabold mb-1" style={{ color: mention.color }}>{mention.label}</h2>
            {category && <p className="text-gray-500 text-sm mb-3">{category.nom}</p>}
            <div className="text-6xl font-extrabold my-4" style={{ color: mention.color }}>{pct}%</div>
            <p className="text-gray-600 text-lg mb-6">Score : <strong>{score}/{questions.length}</strong></p>
            <div className="space-y-3">
              <button
                onClick={() => { setCurrentQ(0); setScore(0); setFinished(false); setSelected(null); setAnswered(false) }}
                className="block w-full py-4 font-bold text-white rounded-2xl active:scale-95"
                style={{ background: '#1A4731' }}
              >
                🔄 Recommencer
              </button>
              <Link href="/dashboard" className="block w-full py-3 font-semibold rounded-2xl border-2 border-gray-300 text-gray-700">
                ← Tableau de bord
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  const q = questions[currentQ]
  const options = [
    { key: 'A', text: q.option_a },
    { key: 'B', text: q.option_b },
    { key: 'C', text: q.option_c },
    { key: 'D', text: q.option_d },
  ]
  const progress = ((currentQ + (answered ? 1 : 0)) / questions.length) * 100

  return (
    <>
      <Head><title>{category?.nom || 'Quiz'} – IFL</title></Head>
      <div className="min-h-screen african-pattern" style={{ background: '#FFF8F0' }}>
        {/* Header */}
        <header style={{ background: category?.type_concours === 'direct' ? 'linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)' : 'linear-gradient(135deg, #C4521A 0%, #8B2500 100%)' }} className="sticky top-0 z-40">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/dashboard" className="text-white hover:opacity-80">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <h2 className="text-white font-bold text-sm text-center flex-1 mx-3 truncate">
              {category?.nom || 'Quiz'}
            </h2>
            <span className="text-white font-bold text-sm whitespace-nowrap">{currentQ + 1}/{questions.length}</span>
          </div>
          <div className="h-1.5" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="h-1.5 progress-bar" style={{ width: `${progress}%`, background: '#D4A017' }}></div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Score */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-gray-500 text-sm">Question {currentQ + 1} sur {questions.length}</span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
              ✅ {score} correctes
            </span>
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-5 border border-amber-100 animate-fadeIn">
            <p className="text-gray-800 font-semibold text-lg leading-relaxed">{q.question_text}</p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-5">
            {options.map(opt => {
              let cls = 'question-option'
              if (answered) {
                if (opt.key === q.bonne_reponse) cls += ' correct'
                else if (opt.key === selected) cls += ' wrong'
                else cls += ' disabled opacity-60'
              }
              return (
                <button
                  key={opt.key}
                  onClick={() => handleSelect(opt.key)}
                  className={cls}
                  disabled={answered}
                >
                  <span className="font-bold mr-3 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm flex-shrink-0" style={{
                    background: answered && opt.key === q.bonne_reponse ? '#16a34a' : answered && opt.key === selected ? '#dc2626' : '#e5e7eb',
                    color: answered && (opt.key === q.bonne_reponse || opt.key === selected) ? 'white' : '#374151'
                  }}>
                    {opt.key}
                  </span>
                  <span>{opt.text}</span>
                </button>
              )
            })}
          </div>

          {/* Correction */}
          {answered && (
            <div className={`rounded-2xl p-5 mb-5 animate-fadeIn ${selected === q.bonne_reponse ? 'bg-green-50 border-2 border-green-400' : 'bg-red-50 border-2 border-red-400'}`}>
              <div className="flex items-start gap-3 mb-2">
                <span className="text-2xl flex-shrink-0">{selected === q.bonne_reponse ? '✅' : '❌'}</span>
                <div>
                  <p className="font-bold text-base">{selected === q.bonne_reponse ? 'Bonne réponse !' : `Réponse incorrecte. Réponse : ${q.bonne_reponse}`}</p>
                  <p className="text-gray-700 text-sm leading-relaxed mt-1">{q.explication}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          {answered && (
            <button
              onClick={handleNext}
              className="w-full py-4 text-lg font-bold text-white rounded-2xl shadow-lg active:scale-95 animate-fadeIn"
              style={{ background: category?.type_concours === 'direct' ? '#1A4731' : '#C4521A' }}
            >
              {currentQ + 1 >= questions.length ? '📊 Voir les résultats' : 'Question suivante →'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
