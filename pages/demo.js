import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { DEMO_QUESTIONS } from '../lib/data'

export default function Demo() {
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const q = DEMO_QUESTIONS[currentQ]
  const options = [
    { key: 'A', text: q.option_a },
    { key: 'B', text: q.option_b },
    { key: 'C', text: q.option_c },
    { key: 'D', text: q.option_d },
  ]

  const handleSelect = (key) => {
    if (answered) return
    setSelected(key)
    setAnswered(true)
    if (key === q.bonne_reponse) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (currentQ + 1 >= DEMO_QUESTIONS.length) {
      setFinished(true)
    } else {
      setCurrentQ(c => c + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  const handleRestart = () => {
    setCurrentQ(0)
    setSelected(null)
    setAnswered(false)
    setScore(0)
    setFinished(false)
  }

  const progress = ((currentQ + (answered ? 1 : 0)) / DEMO_QUESTIONS.length) * 100

  if (finished) {
    const pct = Math.round((score / DEMO_QUESTIONS.length) * 100)
    const mention = pct >= 80 ? { label: 'Excellent !', color: '#1A4731', emoji: '🏆' }
      : pct >= 60 ? { label: 'Bien !', color: '#D4A017', emoji: '👍' }
      : { label: 'À améliorer', color: '#C4521A', emoji: '💪' }

    return (
      <>
        <Head><title>Résultat Démo – IFL</title></Head>
        <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(160deg, #1A4731 0%, #2D6A4F 50%, #C4521A 100%)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="text-7xl mb-4">{mention.emoji}</div>
            <h2 className="text-3xl font-extrabold mb-2" style={{ color: mention.color }}>{mention.label}</h2>
            <div className="text-6xl font-extrabold my-4" style={{ color: mention.color }}>{pct}%</div>
            <p className="text-gray-600 text-lg mb-2">Score : <strong>{score}/{DEMO_QUESTIONS.length}</strong></p>
            <p className="text-gray-500 text-sm mb-8">Démo gratuite – 10 questions</p>

            <div className="space-y-3">
              <Link href="/register" className="block w-full py-4 text-lg font-bold text-white rounded-2xl shadow-lg active:scale-95" style={{ background: 'linear-gradient(135deg, #C4521A 0%, #8B2500 100%)' }}>
                🚀 S'inscrire pour plus de QCM
              </Link>
              <button onClick={handleRestart} className="block w-full py-3 text-base font-semibold rounded-2xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-95">
                🔄 Recommencer la démo
              </button>
              <Link href="/" className="block text-gray-400 hover:text-gray-600 text-sm">
                ← Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>Démo Gratuite – IFL</title></Head>
      <div className="min-h-screen african-pattern" style={{ background: '#FFF8F0' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)' }} className="sticky top-0 z-40">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="IFL" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '12px' }} />
              <span className="text-white font-bold">IFL Démo</span>
            </Link>
            <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
              GRATUIT
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-white/20">
            <div className="h-1 bg-amber-400 progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Counter */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-600 font-medium">Question {currentQ + 1}/{DEMO_QUESTIONS.length}</span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
              ✅ Score: {score}
            </span>
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-5 border border-amber-100 animate-fadeIn">
            <p className="text-gray-800 font-semibold text-lg leading-relaxed">{q.question_text}</p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
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
                  <span className="font-bold mr-3 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm" style={{ 
                    background: answered && opt.key === q.bonne_reponse ? '#16a34a' : answered && opt.key === selected ? '#dc2626' : '#e5e7eb',
                    color: answered && (opt.key === q.bonne_reponse || opt.key === selected) ? 'white' : '#374151'
                  }}>
                    {opt.key}
                  </span>
                  {opt.text}
                </button>
              )
            })}
          </div>

          {/* Correction */}
          {answered && (
            <div className={`rounded-2xl p-5 mb-5 animate-fadeIn ${selected === q.bonne_reponse ? 'bg-green-50 border-2 border-green-400' : 'bg-red-50 border-2 border-red-400'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{selected === q.bonne_reponse ? '✅' : '❌'}</span>
                <span className="font-bold text-lg">{selected === q.bonne_reponse ? 'Bonne réponse !' : `Mauvaise réponse. Bonne réponse : ${q.bonne_reponse}`}</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{q.explication}</p>
            </div>
          )}

          {/* Navigation */}
          {answered && (
            <button
              onClick={handleNext}
              className="w-full py-4 text-lg font-bold text-white rounded-2xl shadow-lg active:scale-95 animate-fadeIn"
              style={{ background: 'linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)' }}
            >
              {currentQ + 1 >= DEMO_QUESTIONS.length ? '📊 Voir les résultats' : 'Question suivante →'}
            </button>
          )}

          {/* CTA S'inscrire */}
          <div className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl text-center">
            <p className="text-amber-800 font-semibold mb-3">Vous aimez ? Accédez à tout le contenu !</p>
            <div className="flex gap-3 justify-center">
              <Link href="/register" className="px-5 py-2 text-sm font-bold text-white rounded-xl active:scale-95" style={{ background: '#C4521A' }}>
                S'inscrire
              </Link>
              <Link href="/login" className="px-5 py-2 text-sm font-bold rounded-xl border-2 active:scale-95" style={{ color: '#1A4731', borderColor: '#1A4731' }}>
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
