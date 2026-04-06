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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)
  const [loadingQ, setLoadingQ] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (id && user) {
      fetchQuestions()
    }
  }, [id, user])

  const fetchQuestions = async () => {
    setLoadingQ(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/quiz/questions?category_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (res.status === 403) {
        setError(`Abonnement requis (${data.required_type === 'direct' ? '5 000' : '20 000'} FCFA)`)
        setLoadingQ(false)
        return
      }
      
      if (!res.ok) {
        setError(data.error || 'Erreur chargement')
        setLoadingQ(false)
        return
      }
      
      setQuestions(data.questions || [])
      setCategory(data.category)
      
      // Restaurer la progression
      const savedProgress = await fetchProgress()
      if (savedProgress?.derniere_question_id && data.questions?.length > 0) {
        const idx = data.questions.findIndex(q => q.id === savedProgress.derniere_question_id)
        if (idx > 0) setCurrentIndex(idx)
      }
    } catch (e) {
      setError('Erreur de connexion')
    }
    setLoadingQ(false)
  }

  const fetchProgress = async () => {
    try {
      const token = getToken()
      const res = await fetch(`/api/quiz/progress?categorie_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      return data.progress || null
    } catch (e) {
      return null
    }
  }

  const saveProgress = async (questionId, newScore, total) => {
    try {
      const token = getToken()
      await fetch('/api/quiz/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          categorie_id: id,
          derniere_question_id: questionId,
          score: newScore,
          total_reponses: total
        })
      })
    } catch (e) {}
  }

  const handleSelect = (opt) => {
    if (showResult) return
    setSelected(opt)
    setShowResult(true)
    const isCorrect = opt === questions[currentIndex].reponse_correcte
    const newScore = isCorrect ? score + 1 : score
    if (isCorrect) setScore(newScore)
    setAnswers(prev => [...prev, { correct: isCorrect }])
    saveProgress(questions[currentIndex].id, newScore, answers.length + 1)
  }

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true)
    } else {
      setCurrentIndex(i => i + 1)
      setSelected(null)
      setShowResult(false)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setSelected(null)
    setShowResult(false)
    setScore(0)
    setFinished(false)
    setAnswers([])
  }

  if (loading || !user || loadingQ) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFF8F0' }}>
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des questions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FFF8F0' }}>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Accès requis</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link href="/payment" className="block py-3 text-center font-bold text-white rounded-xl mb-3 active:scale-95" style={{ background: '#C4521A' }}>
            S'abonner maintenant
          </Link>
          <Link href="/dashboard" className="block text-center text-gray-500">← Retour</Link>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FFF8F0' }}>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Aucune question disponible</h2>
          <p className="text-gray-500 mb-6">Les questions pour ce dossier seront bientôt ajoutées par l'administrateur.</p>
          <Link href="/dashboard" className="block py-3 text-center font-bold text-white rounded-xl active:scale-95" style={{ background: '#1A4731' }}>
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  const question = questions[currentIndex]
  const total = questions.length
  const optionLabels = ['A', 'B', 'C', 'D']
  const optionKeys = ['option_a', 'option_b', 'option_c', 'option_d']

  if (finished) {
    const pct = Math.round((score / answers.length) * 100)
    return (
      <>
        <Head><title>Résultats – {category?.nom}</title></Head>
        <div className="min-h-screen" style={{ background: '#FFF8F0' }}>
          <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #1A2F20 100%)' }} className="sticky top-0 z-40 shadow-lg">
            <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
              <Link href="/dashboard" className="text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </Link>
              <h1 className="text-white font-bold text-base">{category?.nom}</h1>
            </div>
          </header>
          <div className="max-w-lg mx-auto px-4 py-10 text-center">
            <div className="text-7xl mb-4">{pct >= 70 ? '🏆' : pct >= 50 ? '👍' : '📚'}</div>
            <h2 className="text-2xl font-extrabold mb-5" style={{ color: '#1A4731' }}>Quiz terminé !</h2>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <p className="text-5xl font-extrabold mb-2" style={{ color: '#C4521A' }}>{score}/{answers.length}</p>
              <p className="text-gray-500 text-lg">Score : {pct}%</p>
              <div className="flex gap-1 justify-center mt-4 flex-wrap">
                {answers.map((a, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${a.correct ? 'bg-green-500' : 'bg-red-500'}`}>
                    {a.correct ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleRestart} className="w-full py-4 font-bold text-white rounded-2xl active:scale-95" style={{ background: '#1A4731' }}>
                🔄 Recommencer
              </button>
              <Link href="/dashboard" className="block w-full py-4 text-center font-bold text-gray-600 bg-gray-100 rounded-2xl active:scale-95">
                ← Retour au tableau de bord
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>{category?.nom} – IFL</title></Head>
      <div className="min-h-screen" style={{ background: '#FFF8F0' }}>
        <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #1A2F20 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </Link>
              <div>
                <h1 className="text-white font-bold text-sm leading-tight">{category?.nom}</h1>
                <p className="text-green-200 text-xs">Q{currentIndex + 1}/{total}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">{score} <span className="text-green-300 text-sm">pts</span></p>
            </div>
          </div>
          <div className="h-1.5 bg-green-900">
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${((currentIndex) / total) * 100}%` }}></div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-5">
          <div className="bg-white rounded-2xl shadow-md p-5 mb-4">
            <p className="text-gray-800 text-lg font-semibold leading-relaxed">{question.enonce}</p>
            {question.matiere && (
              <p className="text-xs text-gray-400 mt-2">📌 {question.matiere}</p>
            )}
          </div>

          <div className="space-y-3 mb-4">
            {optionLabels.map((label, i) => {
              const key = optionKeys[i]
              const isSelected = selected === label
              const isCorrect = label === question.reponse_correcte

              let style = 'bg-white border-2 border-gray-200'
              let textStyle = 'text-gray-800'
              if (showResult) {
                if (isCorrect) { style = 'border-2 border-green-500 bg-green-50'; textStyle = 'text-green-800' }
                else if (isSelected) { style = 'border-2 border-red-500 bg-red-50'; textStyle = 'text-red-800' }
                else { style = 'bg-gray-50 border-2 border-gray-100'; textStyle = 'text-gray-400' }
              } else if (isSelected) {
                style = 'border-2 border-amber-400 bg-amber-50'
              }

              return (
                <button key={label} onClick={() => handleSelect(label)} disabled={showResult}
                  className={`w-full p-4 rounded-xl text-left transition-all ${style}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm border-2 ${
                      showResult && isCorrect ? 'bg-green-500 border-green-500 text-white' :
                      showResult && isSelected && !isCorrect ? 'bg-red-500 border-red-500 text-white' :
                      isSelected ? 'border-amber-400 bg-amber-400 text-white' :
                      'border-gray-300 text-gray-500'
                    }`}>{showResult && isCorrect ? '✓' : showResult && isSelected && !isCorrect ? '✗' : label}</span>
                    <span className={`text-base font-medium pt-1 leading-relaxed ${textStyle}`}>{question[key]}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {showResult && (
            <div className={`rounded-2xl p-4 mb-4 border-2 ${selected === question.bonne_reponse ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'}`}>
              <p className={`font-bold text-sm mb-1 ${selected === question.bonne_reponse ? 'text-green-700' : 'text-orange-700'}`}>
                {selected === question.bonne_reponse ? '✅ Correct !' : `❌ Incorrect – Réponse : ${question.bonne_reponse}`}
              </p>
              <p className={`text-sm leading-relaxed ${selected === question.bonne_reponse ? 'text-green-600' : 'text-orange-600'}`}>
                {question.explication}
              </p>
            </div>
          )}

          {showResult && (
            <button onClick={handleNext} className="w-full py-4 text-lg font-bold text-white rounded-2xl shadow-md active:scale-95" style={{ background: '#1A4731' }}>
              {currentIndex + 1 >= total ? '🏆 Voir résultats' : 'Question suivante →'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
