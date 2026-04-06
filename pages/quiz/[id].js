import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../_app'
import { supabase } from '../../lib/supabase'

export default function QuizPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const { id: categoryId } = router.query

  const [category, setCategory] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loadingQ, setLoadingQ] = useState(true)
  const [savedProgress, setSavedProgress] = useState(null)
  const [resuming, setResuming] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (categoryId && user) {
      fetchCategoryAndQuestions()
    }
  }, [categoryId, user])

  const fetchCategoryAndQuestions = async () => {
    setLoadingQ(true)
    
    // Fetch category
    const { data: cat } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single()
    
    if (cat) setCategory(cat)

    // Fetch questions (using existing schema with category_id and enonce)
    const { data: qs } = await supabase
      .from('questions')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    
    if (qs) setQuestions(qs)

    // Check saved progress from localStorage
    const progressKey = `ifl_progress_${user.id}_${categoryId}`
    const savedProg = localStorage.getItem(progressKey)
    if (savedProg) {
      const prog = JSON.parse(savedProg)
      if (prog.questions_vues > 0) {
        setSavedProgress(prog)
        setResuming(true)
      }
    }
    
    setLoadingQ(false)
  }

  const handleResume = () => {
    if (savedProgress && questions.length > 0) {
      const startIdx = Math.min(savedProgress.questions_vues, questions.length - 1)
      setCurrentQ(startIdx)
      setScore(savedProgress.score || 0)
    }
    setResuming(false)
  }

  const handleStartOver = () => {
    setCurrentQ(0)
    setScore(0)
    setResuming(false)
  }

  const saveProgressToDb = async (qIndex, currentScore, questionId, selectedOpt, correct) => {
    try {
      // Save to localStorage for category-level progress
      const progressKey = `ifl_progress_${user.id}_${categoryId}`
      localStorage.setItem(progressKey, JSON.stringify({
        questions_vues: qIndex,
        score: currentScore,
        updated_at: new Date().toISOString()
      }))
      
      // Also save individual answer to DB if we have a question_id
      if (questionId && selectedOpt) {
        await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            question_id: questionId,
            reponse_donnee: selectedOpt,
            is_correct: correct,
            time_spent_seconds: 30
          })
          .single()
      }
    } catch (e) {
      // Silently fail - progress still saved in localStorage
    }
  }

  const handleAnswer = (option) => {
    if (showResult) return
    setSelectedAnswer(option)
    setShowResult(true)
    
    const q = questions[currentQ]
    const correct = option === q.reponse_correcte
    const newScore = correct ? score + 1 : score
    if (correct) setScore(s => s + 1)
    
    // Auto-save progress
    saveProgressToDb(currentQ + 1, newScore, q.id, option, correct)
  }

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true)
      saveProgressToDb(questions.length, score, null, null, null)
    } else {
      setCurrentQ(q => q + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }

  if (loading || loadingQ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner w-10 h-10"></div>
      </div>
    )
  }

  if (resuming && savedProgress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full card text-center">
          <div className="text-4xl mb-4">💾</div>
          <h2 className="font-bold text-gray-900 text-lg mb-2">Progression sauvegardée</h2>
          <p className="text-gray-600 text-sm mb-6">
            Vous étiez à la question {savedProgress.questions_vues} sur {questions.length}.<br/>
            Score: {savedProgress.score} point(s)
          </p>
          <div className="space-y-3">
            <button onClick={handleResume} className="w-full btn-primary">
              Reprendre où j'étais
            </button>
            <button onClick={handleStartOver} className="w-full btn-secondary">
              Recommencer depuis le début
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card text-center max-w-sm">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="font-bold text-gray-900 mb-2">{category?.nom}</h2>
          <p className="text-gray-500 text-sm mb-6">Les questions de ce dossier seront ajoutées prochainement par l'administrateur.</p>
          <Link href={`/courses/${category?.type}`} className="btn-primary block text-center">
            Retour aux dossiers
          </Link>
        </div>
      </div>
    )
  }

  if (finished) {
    const percent = Math.round((score / questions.length) * 100)
    return (
      <>
        <Head><title>Résultats - {category?.nom} - IFL</title></Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
            <div className="text-6xl mb-4">
              {percent >= 70 ? '🎉' : percent >= 50 ? '👍' : '💪'}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{category?.nom}</h2>
            <p className="text-gray-500 text-sm mb-4">Exercice terminé !</p>
            
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="text-3xl font-bold text-blue-700">{score}/{questions.length}</div>
              <div className="text-gray-600 text-sm mt-1">{percent}% de réussite</div>
            </div>
            
            <div className="progress-bar mb-6">
              <div className="progress-fill" style={{ width: `${percent}%` }}></div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { setCurrentQ(0); setScore(0); setFinished(false); setSelectedAnswer(null); setShowResult(false); }}
                className="w-full btn-primary"
              >
                Recommencer ce dossier
              </button>
              <Link href={`/courses/${category?.type}`} className="w-full btn-secondary block text-center">
                Retour aux dossiers
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  const question = questions[currentQ]
  
  const optionColors = (opt) => {
    if (!showResult) {
      return selectedAnswer === opt ? 'option-btn selected' : 'option-btn'
    }
    if (opt === question.reponse_correcte) return 'option-btn correct'
    if (opt === selectedAnswer && opt !== question.reponse_correcte) return 'option-btn incorrect'
    return 'option-btn opacity-50'
  }

  const options = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
  ]

  return (
    <>
      <Head>
        <title>{category?.nom} - IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-900 text-white px-4 py-4 sticky top-0 z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/courses/${category?.type}`} className="text-blue-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <div className="font-bold text-sm truncate max-w-[180px]">{category?.nom}</div>
                <div className="text-blue-200 text-xs">{currentQ + 1}/{questions.length}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold">{score} ✓</div>
              <div className="text-blue-200 text-xs">Score</div>
            </div>
          </div>
          <div className="max-w-2xl mx-auto mt-2">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(currentQ / questions.length) * 100}%` }}></div>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="card animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge badge-blue">{category?.nom}</span>
              {question.difficulte && (
                <span className={`badge ${
                  question.difficulte === 'facile' ? 'badge-green' :
                  question.difficulte === 'difficile' ? 'badge-red' : 'badge-orange'
                }`}>{question.difficulte}</span>
              )}
            </div>

            <h2 className="text-gray-900 font-semibold text-base leading-relaxed mb-6">
              {question.enonce}
            </h2>

            <div className="space-y-3">
              {options.map(({ key, text }) => (
                <button
                  key={key}
                  onClick={() => handleAnswer(key)}
                  className={optionColors(key)}
                  disabled={showResult}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                      showResult && key === question.reponse_correcte ? 'bg-green-500 border-green-500 text-white' :
                      showResult && key === selectedAnswer && key !== question.reponse_correcte ? 'bg-red-500 border-red-500 text-white' :
                      'border-current'
                    }`}>
                      {key}
                    </span>
                    <span className="text-sm leading-relaxed pt-0.5">{text}</span>
                  </div>
                </button>
              ))}
            </div>

            {showResult && (
              <div className={`mt-4 p-4 rounded-xl animate-fade-in ${
                selectedAnswer === question.reponse_correcte
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className={`font-semibold text-sm mb-1 ${
                  selectedAnswer === question.reponse_correcte ? 'text-green-800' : 'text-red-800'
                }`}>
                  {selectedAnswer === question.reponse_correcte
                    ? '✅ Bonne réponse !'
                    : `❌ La bonne réponse est ${question.reponse_correcte}`}
                </div>
                {question.explication && (
                  <p className="text-sm text-gray-700 leading-relaxed">{question.explication}</p>
                )}
              </div>
            )}

            {showResult && (
              <button onClick={handleNext} className="w-full btn-primary mt-4">
                {currentQ + 1 >= questions.length ? 'Voir mes résultats' : 'Question suivante →'}
              </button>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
