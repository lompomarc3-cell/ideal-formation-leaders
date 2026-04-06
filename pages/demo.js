import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from './_app'
import { DEMO_QUESTIONS } from '../lib/data'

export default function Demo() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const question = DEMO_QUESTIONS[currentQ]

  const handleAnswer = (option) => {
    if (showResult) return
    setSelectedAnswer(option)
    setShowResult(true)
    if (option === question.reponse_correcte) {
      setScore(s => s + 1)
    }
  }

  const handleNext = () => {
    if (currentQ + 1 >= DEMO_QUESTIONS.length) {
      setFinished(true)
    } else {
      setCurrentQ(q => q + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }

  const handleRestart = () => {
    setCurrentQ(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setFinished(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-10 h-10"></div>
      </div>
    )
  }

  const optionColors = (opt) => {
    if (!showResult) {
      return selectedAnswer === opt ? 'option-btn selected' : 'option-btn'
    }
    if (opt === question.reponse_correcte) return 'option-btn correct'
    if (opt === selectedAnswer && opt !== question.reponse_correcte) return 'option-btn incorrect'
    return 'option-btn opacity-50'
  }

  const options = [
    { key: 'A', text: question?.option_a },
    { key: 'B', text: question?.option_b },
    { key: 'C', text: question?.option_c },
    { key: 'D', text: question?.option_d },
  ]

  if (finished) {
    const percent = Math.round((score / DEMO_QUESTIONS.length) * 100)
    return (
      <>
        <Head><title>Résultats Démo - IFL</title></Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
            <div className="text-6xl mb-4">
              {percent >= 70 ? '🎉' : percent >= 50 ? '👍' : '💪'}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Démo terminée !</h2>
            <p className="text-gray-600 mb-6">
              Votre score : <span className="font-bold text-blue-700 text-2xl">{score}/{DEMO_QUESTIONS.length}</span>
              <span className="text-gray-500 text-sm"> ({percent}%)</span>
            </p>

            <div className="progress-bar mb-6">
              <div className="progress-fill" style={{ width: `${percent}%` }}></div>
            </div>

            {percent >= 70 ? (
              <p className="text-green-600 font-medium mb-6">Excellent travail ! Vous êtes prêt(e) pour les vrais concours.</p>
            ) : percent >= 50 ? (
              <p className="text-blue-600 font-medium mb-6">Bon résultat ! Continuez à pratiquer pour vous améliorer.</p>
            ) : (
              <p className="text-orange-600 font-medium mb-6">Continuez à pratiquer ! Nos cours complets vous aideront.</p>
            )}

            <div className="space-y-3">
              <Link href="/payment?type=direct" className="w-full btn-orange block text-center">
                🎯 Accéder aux Concours Directs - 5 000 FCFA
              </Link>
              <Link href="/payment?type=professionnel" className="w-full btn-primary block text-center">
                🏆 Accéder aux Concours Pros - 20 000 FCFA
              </Link>
              <button onClick={handleRestart} className="w-full btn-secondary text-sm">
                Recommencer la démo
              </button>
              <Link href="/dashboard" className="w-full block text-center text-gray-500 text-sm hover:text-gray-700 py-2">
                Retour au tableau de bord
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Démo Gratuite - IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-900 text-white px-4 py-4 sticky top-0 z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-blue-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <div className="font-bold text-sm">Démo Gratuite</div>
                <div className="text-blue-200 text-xs">Question {currentQ + 1}/{DEMO_QUESTIONS.length}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold">{score} ✓</div>
              <div className="text-blue-200 text-xs">Score</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="max-w-2xl mx-auto mt-2">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${((currentQ) / DEMO_QUESTIONS.length) * 100}%` }}></div>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="card animate-fade-in">
            {/* Question badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="badge badge-blue">Démo - Culture Générale</span>
            </div>

            {/* Question text */}
            <h2 className="text-gray-900 font-semibold text-lg leading-relaxed mb-6">
              {question.enonce}
            </h2>

            {/* Options */}
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

            {/* Explanation */}
            {showResult && (
              <div className={`mt-4 p-4 rounded-xl animate-fade-in ${
                selectedAnswer === question.reponse_correcte 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className={`font-semibold text-sm mb-1 ${
                  selectedAnswer === question.reponse_correcte ? 'text-green-800' : 'text-red-800'
                }`}>
                  {selectedAnswer === question.reponse_correcte ? '✅ Bonne réponse !' : `❌ Mauvaise réponse. La bonne réponse est ${question.reponse_correcte}.`}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{question.explication}</p>
              </div>
            )}

            {/* Next button */}
            {showResult && (
              <button
                onClick={handleNext}
                className="w-full btn-primary mt-4"
              >
                {currentQ + 1 >= DEMO_QUESTIONS.length ? 'Voir mes résultats' : 'Question suivante →'}
              </button>
            )}
          </div>

          {/* Hint to subscribe */}
          {!showResult && (
            <div className="mt-4 text-center text-gray-500 text-sm">
              Ceci est la démo gratuite. <Link href="/payment?type=direct" className="text-blue-600 hover:underline">Abonnez-vous</Link> pour tout débloquer.
            </div>
          )}
        </main>
      </div>
    </>
  )
}
