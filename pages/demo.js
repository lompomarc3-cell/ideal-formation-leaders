import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { DEMO_QUESTIONS } from '../lib/data'

export default function Demo() {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const q = DEMO_QUESTIONS[current]
  const total = DEMO_QUESTIONS.length

  const handleSelect = (opt) => {
    if (answered) return
    setSelected(opt)
    setAnswered(true)
    if (opt === q.bonne_reponse) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (current + 1 >= total) {
      setFinished(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  const restart = () => {
    setCurrent(0)
    setSelected(null)
    setAnswered(false)
    setScore(0)
    setFinished(false)
  }

  const progress = ((current + (answered ? 1 : 0)) / total) * 100

  return (
    <>
      <Head>
        <title>Démo Gratuite – IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen" style={{ background: '#FFF8F0' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #2D6A4F 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="logo-header" style={{ width: 40, height: 40 }}>
                <img src="/logo.png" alt="IFL" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 12 }} />
              </div>
              <span className="text-white font-bold">IFL – Démo</span>
            </Link>
            <Link href="/register" className="px-4 py-2 text-sm font-bold text-white rounded-xl active:scale-95" style={{ background: '#C4521A' }}>
              S'inscrire
            </Link>
          </div>
          {/* Barre de progression */}
          <div className="h-1.5 bg-green-900">
            <div className="h-full progress-bar" style={{ width: `${progress}%`, background: '#D4A017' }}></div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-6">
          {finished ? (
            /* Résultats */
            <div className="text-center animate-popIn">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-amber-100">
                <div className="text-7xl mb-4">{score >= 7 ? '🏆' : score >= 5 ? '👍' : '📚'}</div>
                <h2 className="text-3xl font-extrabold mb-2" style={{ color: '#1A4731' }}>Démo terminée !</h2>
                <p className="text-gray-500 mb-6">Vous avez répondu à toutes les questions gratuites</p>
                <div className="rounded-2xl p-6 mb-6" style={{ background: 'linear-gradient(135deg, #1A4731, #2D6A4F)' }}>
                  <p className="text-white text-lg font-semibold mb-1">Votre score</p>
                  <p className="text-5xl font-extrabold text-white">{score}<span className="text-2xl opacity-70">/{total}</span></p>
                  <div className="mt-3 h-2 bg-green-900 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(score/total)*100}%`, background: '#D4A017', transition: 'width 1s ease' }}></div>
                  </div>
                  <p className="text-green-200 text-sm mt-2">{Math.round((score/total)*100)}% de réussite</p>
                </div>

                <div className="space-y-3">
                  <Link href="/register" className="block w-full py-4 text-lg font-bold text-white rounded-xl shadow-lg active:scale-95" style={{ background: 'linear-gradient(135deg,#C4521A,#8B2500)' }}>
                    🚀 Accéder à tous les QCM
                  </Link>
                  <button onClick={restart} className="w-full py-3 text-base font-semibold rounded-xl border-2 border-amber-300 text-amber-700 hover:bg-amber-50 active:scale-95">
                    🔄 Recommencer la démo
                  </button>
                  <Link href="/" className="block text-center text-gray-400 text-sm mt-2 hover:text-gray-600">
                    ← Retour à l'accueil
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Question */
            <div className="animate-fadeIn">
              {/* Info question */}
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1.5 rounded-lg text-sm font-bold" style={{ background: '#E8F5EE', color: '#1A4731' }}>
                  🆓 Démo gratuite
                </span>
                <span className="text-gray-500 text-sm font-medium">
                  {current + 1} / {total}
                </span>
              </div>

              {/* Question card */}
              <div className="bg-white rounded-3xl shadow-md border border-amber-100 p-6 mb-5">
                <div className="flex items-start gap-3 mb-6">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: '#D4A017' }}>
                    {current + 1}
                  </span>
                  <p className="text-gray-800 font-semibold text-lg leading-relaxed">{q.question_text}</p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const optText = q[`option_${opt.toLowerCase()}`]
                    let cls = 'question-option'
                    if (answered) {
                      if (opt === q.bonne_reponse) cls += ' correct'
                      else if (opt === selected) cls += ' wrong'
                      else cls += ' disabled opacity-60'
                    }
                    return (
                      <button key={opt} className={cls} onClick={() => handleSelect(opt)}>
                        <span className="inline-flex w-7 h-7 rounded-full items-center justify-center text-sm font-bold mr-3 flex-shrink-0"
                          style={{ background: answered && opt === q.bonne_reponse ? '#16a34a' : answered && opt === selected ? '#dc2626' : '#f3f4f6', color: answered && (opt === q.bonne_reponse || opt === selected) ? 'white' : '#374151' }}>
                          {opt}
                        </span>
                        {optText}
                      </button>
                    )
                  })}
                </div>

                {/* Explication */}
                {answered && (
                  <div className="mt-5 animate-fadeIn rounded-2xl p-4" style={{ background: selected === q.bonne_reponse ? '#F0FDF4' : '#FFF7F0', borderLeft: `4px solid ${selected === q.bonne_reponse ? '#16a34a' : '#C4521A'}` }}>
                    <p className="font-bold mb-1.5 text-sm" style={{ color: selected === q.bonne_reponse ? '#16a34a' : '#C4521A' }}>
                      {selected === q.bonne_reponse ? '✅ Bonne réponse !' : `❌ Mauvaise réponse – La bonne réponse est ${q.bonne_reponse}`}
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed">{q.explication}</p>
                  </div>
                )}
              </div>

              {/* Bouton suivant */}
              {answered && (
                <button
                  onClick={handleNext}
                  className="w-full py-4 text-lg font-bold text-white rounded-xl shadow-lg active:scale-95 animate-popIn"
                  style={{ background: 'linear-gradient(135deg, #1A4731, #2D6A4F)' }}
                >
                  {current + 1 >= total ? '📊 Voir mes résultats' : 'Question suivante →'}
                </button>
              )}

              {/* CTA inscription */}
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-amber-800 font-semibold text-sm mb-2">💡 Accédez à des milliers de QCM</p>
                <div className="flex gap-2 justify-center">
                  <Link href="/register" className="px-4 py-2 font-bold text-white rounded-xl text-sm active:scale-95" style={{ background: '#C4521A' }}>
                    S'inscrire
                  </Link>
                  <Link href="/login" className="px-4 py-2 font-bold rounded-xl text-sm border-2 border-amber-300 text-amber-700">
                    Se connecter
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
