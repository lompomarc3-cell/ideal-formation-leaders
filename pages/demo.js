import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const DEMO_QUESTIONS = [
  {
    id: 'd1',
    enonce: "Quelle est la capitale du Burkina Faso ?",
    option_a: "Bobo-Dioulasso",
    option_b: "Koudougou",
    option_c: "Ouagadougou",
    option_d: "Banfora",
    reponse_correcte: "C",
    explication: "Ouagadougou est la capitale politique, administrative et économique du Burkina Faso. Elle est aussi la ville la plus peuplée du pays avec environ 3 millions d'habitants."
  },
  {
    id: 'd2',
    enonce: "En quelle année le Burkina Faso a-t-il obtenu son indépendance ?",
    option_a: "1958",
    option_b: "1962",
    option_c: "1964",
    option_d: "1960",
    reponse_correcte: "D",
    explication: "Le Burkina Faso (alors appelé Haute-Volta) a obtenu son indépendance de la France le 5 août 1960. Le pays a pris le nom de Burkina Faso en 1984 sous Thomas Sankara."
  },
  {
    id: 'd3',
    enonce: "Quel est le fleuve principal du Burkina Faso ?",
    option_a: "La Comoé",
    option_b: "Le Nakambé (Volta Blanche)",
    option_c: "Le Mouhoun (Volta Noire)",
    option_d: "Le Pendjari",
    reponse_correcte: "C",
    explication: "Le Mouhoun, anciennement appelé Volta Noire, est le fleuve principal et le plus long du Burkina Faso. Il prend sa source dans la région des Hauts-Bassins et coule vers le Ghana."
  },
  {
    id: 'd4',
    enonce: "Quelle est la monnaie officielle du Burkina Faso ?",
    option_a: "Le Franc burkinabè",
    option_b: "Le Franc CFA (FCFA)",
    option_c: "Le Dalasi",
    option_d: "Le Cedi",
    reponse_correcte: "B",
    explication: "La monnaie officielle du Burkina Faso est le Franc CFA (FCFA), émis par la Banque Centrale des États de l'Afrique de l'Ouest (BCEAO). Cette monnaie est partagée par 8 pays de l'UEMOA."
  },
  {
    id: 'd5',
    enonce: "Combien de régions administratives compte le Burkina Faso ?",
    option_a: "11 régions",
    option_b: "13 régions",
    option_c: "15 régions",
    option_d: "17 régions",
    reponse_correcte: "B",
    explication: "Le Burkina Faso est divisé en 13 régions administratives, elles-mêmes subdivisées en 45 provinces et 351 communes. Les 13 régions sont dirigées par des gouverneurs nommés par le gouvernement."
  },
  {
    id: 'd6',
    enonce: "De quoi est composé le drapeau national du Burkina Faso ?",
    option_a: "Deux bandes horizontales rouge et verte avec une étoile jaune",
    option_b: "Trois bandes verticales vert, blanc, rouge",
    option_c: "Une bande bleue et une rouge avec une étoile blanche",
    option_d: "Deux bandes horizontales noire et blanche avec une étoile rouge",
    reponse_correcte: "A",
    explication: "Le drapeau du Burkina Faso est composé de deux bandes horizontales égales : rouge en haut et verte en bas, avec une étoile jaune à cinq branches au centre. Il a été adopté le 4 août 1984."
  },
  {
    id: 'd7',
    enonce: "Quel arrêté porte création des clubs écologiques dans les établissements d'enseignement du Burkina Faso ?",
    option_a: "Arrêté N°2019-021/MENAPLN",
    option_b: "Arrêté N°2018-034/MEDD",
    option_c: "Arrêté N°2020-015/MENAPLN",
    option_d: "Arrêté N°2017-008/MEDD",
    reponse_correcte: "A",
    explication: "L'arrêté N°2019-021/MENAPLN porte création et organisation des clubs écologiques dans les établissements d'enseignement du Burkina Faso, dans le cadre de la sensibilisation à la protection de l'environnement."
  },
  {
    id: 'd8',
    enonce: "Selon le Code des marchés publics du Burkina Faso, quel est le seuil de passation des marchés par appel d'offres ouvert pour les travaux ?",
    option_a: "25 000 000 FCFA",
    option_b: "50 000 000 FCFA",
    option_c: "75 000 000 FCFA",
    option_d: "100 000 000 FCFA",
    reponse_correcte: "B",
    explication: "Selon le Code des marchés publics du Burkina Faso, le seuil pour les appels d'offres ouverts pour les travaux est fixé à 50 000 000 FCFA. En dessous de ce seuil, d'autres procédures simplifiées peuvent être utilisées."
  },
  {
    id: 'd9',
    enonce: "Quels sont les principes fondamentaux de la commande publique au Burkina Faso ?",
    option_a: "Transparence, efficacité, économie",
    option_b: "Liberté d'accès, égalité de traitement, transparence",
    option_c: "Concurrence, intégrité, célérité",
    option_d: "Neutralité, impartialité, confidentialité",
    reponse_correcte: "B",
    explication: "Les trois principes fondamentaux de la commande publique au Burkina Faso sont : la liberté d'accès à la commande publique, l'égalité de traitement des candidats, et la transparence des procédures."
  },
  {
    id: 'd10',
    enonce: "Selon la loi N°13-2007/AN du Burkina Faso, quel organisme est chargé du contrôle des marchés publics ?",
    option_a: "La Direction Générale des Marchés Publics (DGMP)",
    option_b: "L'Autorité de Régulation de la Commande Publique (ARCOP)",
    option_c: "Le Contrôle Général d'État (CGE)",
    option_d: "La Cour des Comptes",
    reponse_correcte: "B",
    explication: "L'ARCOP (Autorité de Régulation de la Commande Publique) est l'organe de régulation indépendant chargé de contrôler, réguler et évaluer le système de passation des marchés publics au Burkina Faso."
  }
]

export default function Demo() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [answers, setAnswers] = useState([])

  const question = DEMO_QUESTIONS[currentIndex]
  const total = DEMO_QUESTIONS.length

  const handleSelect = (opt) => {
    if (showResult) return
    setSelected(opt)
    setShowResult(true)
    if (opt === question.reponse_correcte) {
      setScore(s => s + 1)
    }
    setAnswers(prev => [...prev, { correct: opt === question.reponse_correcte }])
  }

  const handleNext = () => {
    if (currentIndex + 1 >= total) {
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

  const optionLabels = ['A', 'B', 'C', 'D']
  const optionKeys = ['option_a', 'option_b', 'option_c', 'option_d']

  if (finished) {
    const pct = Math.round((score / total) * 100)
    return (
      <>
        <Head><title>Démo IFL – Résultats</title></Head>
        <div className="min-h-screen african-pattern" style={{ background: '#FFF8F0' }}>
          {/* Header */}
          <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #1A2F20 100%)' }} className="sticky top-0 z-40 shadow-lg">
            <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <img src="/logo.png" alt="IFL" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '12px' }} />
                <div>
                  <h1 className="text-white font-bold text-base leading-tight">IFL</h1>
                  <p className="text-green-200 text-xs">Démo gratuite</p>
                </div>
              </Link>
            </div>
          </header>

          <div className="max-w-lg mx-auto px-4 py-10 text-center">
            <div className="text-7xl mb-6">{pct >= 70 ? '🏆' : pct >= 50 ? '👍' : '📚'}</div>
            <h2 className="text-3xl font-extrabold mb-2" style={{ color: '#1A4731' }}>Démo terminée !</h2>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <p className="text-5xl font-extrabold mb-2" style={{ color: '#C4521A' }}>{score}/{total}</p>
              <p className="text-gray-500 text-lg">Score : {pct}%</p>
              <div className="flex gap-1 justify-center mt-4">
                {answers.map((a, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${a.correct ? 'bg-green-500' : 'bg-red-500'}`}>
                    {a.correct ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 mb-6 text-left">
              <p className="text-amber-800 font-bold text-lg mb-2">🚀 Accédez à plus de 1000 QCM !</p>
              <p className="text-amber-700 text-sm mb-3">Inscrivez-vous pour accéder à tous les dossiers de préparation.</p>
              <ul className="text-amber-700 text-sm space-y-1">
                <li>✅ 10 dossiers Concours Directs – <strong>5 000 FCFA</strong></li>
                <li>✅ 12 dossiers Concours Professionnels – <strong>20 000 FCFA</strong></li>
                <li>✅ Progression sauvegardée automatiquement</li>
                <li>✅ Corrections détaillées pour chaque question</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/register" className="block w-full py-4 text-center text-lg font-bold text-white rounded-2xl shadow-lg active:scale-95 transition-all" style={{ background: '#C4521A' }}>
                🚀 S'inscrire maintenant
              </Link>
              <button onClick={handleRestart} className="w-full py-3 font-semibold text-gray-600 rounded-2xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all">
                🔄 Recommencer la démo
              </button>
              <Link href="/" className="block text-center text-gray-500 py-2">← Retour à l'accueil</Link>
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
        <header style={{ background: 'linear-gradient(135deg, #1A4731 0%, #1A2F20 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="IFL" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '12px' }} />
              <div>
                <h1 className="text-white font-bold text-base leading-tight">IFL</h1>
                <p className="text-green-200 text-xs">🆓 Démo gratuite</p>
              </div>
            </Link>
            <div className="text-right">
              <p className="text-white font-bold text-lg">{currentIndex + 1}<span className="text-green-300 font-normal text-sm">/{total}</span></p>
              <p className="text-green-200 text-xs">Score: {score}</p>
            </div>
          </div>
          {/* Barre de progression */}
          <div className="h-1.5 bg-green-900">
            <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${((currentIndex) / total) * 100}%` }}></div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Question */}
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 animate-fadeIn">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 text-xs font-bold text-white rounded-full" style={{ background: '#1A4731' }}>Q{currentIndex + 1}</span>
              <span className="text-xs text-gray-400">Culture Générale</span>
            </div>
            <p className="text-gray-800 text-lg font-semibold leading-relaxed">{question.enonce}</p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-5">
            {optionLabels.map((label, i) => {
              const key = optionKeys[i]
              const isSelected = selected === label
              const isCorrect = label === question.reponse_correcte
              
              let bgColor = 'bg-white border-2 border-gray-200'
              let textColor = 'text-gray-800'
              
              if (showResult) {
                if (isCorrect) {
                  bgColor = 'border-2 border-green-500 bg-green-50'
                  textColor = 'text-green-800'
                } else if (isSelected && !isCorrect) {
                  bgColor = 'border-2 border-red-500 bg-red-50'
                  textColor = 'text-red-800'
                } else {
                  bgColor = 'bg-gray-50 border-2 border-gray-100'
                  textColor = 'text-gray-500'
                }
              } else if (isSelected) {
                bgColor = 'border-2 bg-amber-50'
                textColor = 'text-amber-900'
              }

              return (
                <button
                  key={label}
                  onClick={() => handleSelect(label)}
                  disabled={showResult}
                  className={`w-full p-4 rounded-xl text-left transition-all active:scale-98 ${bgColor} shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm border-2 ${
                      showResult && isCorrect ? 'bg-green-500 border-green-500 text-white' :
                      showResult && isSelected && !isCorrect ? 'bg-red-500 border-red-500 text-white' :
                      isSelected ? 'border-amber-400 bg-amber-400 text-white' :
                      'border-gray-300 text-gray-500'
                    }`}>
                      {showResult && isCorrect ? '✓' : showResult && isSelected && !isCorrect ? '✗' : label}
                    </span>
                    <span className={`text-base font-medium leading-relaxed pt-1 ${textColor}`}>{question[key]}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Explication */}
          {showResult && (
            <div className={`rounded-2xl p-4 mb-5 animate-fadeIn border-2 ${selected === question.reponse_correcte ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'}`}>
              <p className={`font-bold text-sm mb-2 ${selected === question.reponse_correcte ? 'text-green-700' : 'text-orange-700'}`}>
                {selected === question.reponse_correcte ? '✅ Bonne réponse !' : `❌ Réponse incorrecte. La bonne réponse est ${question.reponse_correcte}`}
              </p>
              <p className={`text-sm leading-relaxed ${selected === question.reponse_correcte ? 'text-green-600' : 'text-orange-600'}`}>
                {question.explication}
              </p>
            </div>
          )}

          {/* Bouton suivant */}
          {showResult && (
            <button
              onClick={handleNext}
              className="w-full py-4 text-center text-lg font-bold text-white rounded-2xl shadow-lg active:scale-95 transition-all animate-fadeIn"
              style={{ background: '#1A4731' }}
            >
              {currentIndex + 1 >= total ? '🏆 Voir les résultats' : 'Question suivante →'}
            </button>
          )}

          {!showResult && (
            <p className="text-center text-gray-400 text-sm">Sélectionnez une réponse pour continuer</p>
          )}
        </div>

        {/* Footer inscription */}
        <div className="max-w-lg mx-auto px-4 pb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-amber-800 text-sm font-semibold">🌟 Accédez à plus de 1000 QCM premium</p>
            <Link href="/register" className="inline-block mt-2 px-6 py-2 text-sm font-bold text-white rounded-xl active:scale-95" style={{ background: '#C4521A' }}>
              S'inscrire maintenant
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
