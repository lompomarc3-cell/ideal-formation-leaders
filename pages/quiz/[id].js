export const runtime = 'experimental-edge'
import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../_app'
import { usePublicPrices } from '../../components/PromoPrice'

const PROGRESS_KEY = (userId, catId) => `ifl_progress_${userId || 'guest'}_${catId}`
const FREE_QUESTIONS_COUNT = 5

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
  const [showPaywallOverlay, setShowPaywallOverlay] = useState(false)
  // Map { questionIndex: { selected, answered } } pour mémoriser les réponses
  const [answersMap, setAnswersMap] = useState({})
  
  // Utiliser des refs pour les handlers afin d'éviter les closures stales dans les event listeners
  // Note: touchStartX retiré — le swipe tactile est désactivé pour éviter les changements involontaires de question lors du scroll
  const stateRef = useRef({ current, questions, hasFullAccess, answersMap, finished, showUpgrade })
  const fetchedRef = useRef(null) // identifiant du dernier fetch pour éviter les re-fetch intempestifs
  const progressRestoredRef = useRef(false)

  // Mettre à jour la ref à chaque changement d'état
  useEffect(() => {
    stateRef.current = { current, questions, hasFullAccess, answersMap, finished, showUpgrade }
  }, [current, questions, hasFullAccess, answersMap, finished, showUpgrade])

  useEffect(() => {
    if (!loading && !user) {
      if (id) router.replace(`/quiz/public/${id}`)
    }
  }, [user, loading, router, id])

  // Ne lancer fetchQuestions qu'UNE SEULE fois par (id, userId) pour éviter les re-fetch
  // qui réinitialisent la progression à la question 1.
  useEffect(() => {
    if (!id || !user) return
    const key = `${id}::${user.id}`
    if (fetchedRef.current === key) return
    fetchedRef.current = key
    progressRestoredRef.current = false
    fetchQuestions()
  }, [id, user?.id])

  // Sauvegarder la progression dans localStorage
  const saveProgress = useCallback((questionIndex) => {
    if (!id) return
    const key = PROGRESS_KEY(user?.id, id)
    try {
      localStorage.setItem(key, JSON.stringify({
        questionIndex,
        savedAt: new Date().toISOString(),
        categorie_id: id
      }))
    } catch {}
  }, [id, user?.id])

  // Sauvegarder aussi côté serveur
  const saveProgressServer = useCallback(async (questionIndex, currentScore) => {
    if (!user || !id) return
    try {
      const token = getToken()
      await fetch('/api/quiz/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          categorie_id: id,
          derniere_question_index: questionIndex,
          score: currentScore
        })
      })
    } catch {}
  }, [id, user, getToken])

  // Restaurer la progression (localStorage d'abord, puis serveur si disponible)
  const restoreProgress = (questionsCount) => {
    if (!id || progressRestoredRef.current) return 0
    progressRestoredRef.current = true
    const key = PROGRESS_KEY(user?.id, id)
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null')
      if (saved && saved.categorie_id === id && saved.questionIndex > 0 && saved.questionIndex < questionsCount) {
        return saved.questionIndex
      }
    } catch {}
    return 0
  }

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
        setError(qData.error)
      } else if (qData.error) {
        setError(qData.error)
      } else {
        const qs = qData.questions || []
        setQuestions(qs)
        setHasFullAccess(qData.hasFullAccess || false)
        const cat = catData.categories?.find(c => c.id === id)
        setCategory(cat || null)

        // Restaurer progression
        const savedIndex = restoreProgress(qs.length)
        if (savedIndex > 0) {
          setCurrent(savedIndex)
        }
      }
    } catch {
      setError('Erreur de chargement des questions')
    }
    setLoadingQ(false)
  }

  // Détermine si une question est gratuite (ordre 1-5)
  const isQuestionFree = useCallback((index) => index < FREE_QUESTIONS_COUNT, [])

  // Navigation vers une question spécifique — mémorisé pour stabilité
  const goToQuestion = useCallback((index, questionsArr, hasAccess, answersMapData, saveProgressFn) => {
    if (index < 0 || index >= questionsArr.length) return
    
    if (!hasAccess && index >= FREE_QUESTIONS_COUNT) {
      setShowPaywallOverlay(true)
      setCurrent(index)
      setSelected(null)
      setAnswered(false)
      saveProgressFn(index)
      return
    }
    
    setCurrent(index)
    const savedAnswer = answersMapData[index]
    if (savedAnswer) {
      setSelected(savedAnswer.selected)
      setAnswered(savedAnswer.answered)
    } else {
      setSelected(null)
      setAnswered(false)
    }
    setShowPaywallOverlay(false)
    saveProgressFn(index)
  }, [])

  // Helpers pour dissertations et réponses multiples
  const isDissertation = (question) => {
    if (!question || !question.matiere) return false
    const m = String(question.matiere).toLowerCase()
    return m === 'dissertation' || m === 'etude_cas' || m === 'etude de cas'
  }
  const isMultipleAnswer = (question) => question && question.bonne_reponse && question.bonne_reponse.includes(',')
  const getCorrectAnswers = (question) => {
    if (!question || !question.bonne_reponse) return []
    return question.bonne_reponse.split(',').map(s => s.trim()).filter(Boolean)
  }

  const handleSelect = (opt) => {
    if (answered) return
    // Bloquer si payant sans accès
    if (!hasFullAccess && !isQuestionFree(current)) {
      setShowPaywallOverlay(true)
      return
    }
    const q = questions[current]
    
    // Gestion des réponses multiples
    if (isMultipleAnswer(q)) {
      // Toggle la sélection de l'option (multi-choix)
      const currentSelection = Array.isArray(selected) ? selected : []
      let newSelection
      if (currentSelection.includes(opt)) {
        newSelection = currentSelection.filter(o => o !== opt)
      } else {
        newSelection = [...currentSelection, opt].sort()
      }
      setSelected(newSelection)
      // Ne pas marquer comme répondu immédiatement - besoin d'un bouton "Valider"
      setAnswersMap(prev => ({ ...prev, [current]: { selected: newSelection, answered: false } }))
      return
    }
    
    // QCM classique : sélection unique et validation directe
    setSelected(opt)
    setAnswered(true)
    const isCorrect = opt === q.bonne_reponse
    const newScore = score + (isCorrect ? 1 : 0)
    if (isCorrect) setScore(s => s + 1)

    // Mémoriser la réponse
    setAnswersMap(prev => ({ ...prev, [current]: { selected: opt, answered: true } }))

    // Sauvegarder la progression
    saveProgress(current)
    saveProgressServer(current, newScore)
  }

  // Valider une réponse multiple
  const handleValidateMultiple = () => {
    const q = questions[current]
    if (!q || !isMultipleAnswer(q)) return
    const currentSelection = Array.isArray(selected) ? selected : []
    if (currentSelection.length === 0) return
    
    const correctAnswers = getCorrectAnswers(q)
    const isCorrect = currentSelection.length === correctAnswers.length &&
                      currentSelection.every(s => correctAnswers.includes(s))
    const newScore = score + (isCorrect ? 1 : 0)
    if (isCorrect) setScore(s => s + 1)
    
    setAnswered(true)
    setAnswersMap(prev => ({ ...prev, [current]: { selected: currentSelection, answered: true } }))
    saveProgress(current)
    saveProgressServer(current, newScore)
  }

  const handleNext = useCallback(() => {
    // Lire l'état depuis la ref pour éviter les closures stales
    const { current: cur, questions: qs, hasFullAccess: hasAccess, answersMap: aMap } = stateRef.current
    const nextIndex = cur + 1
    
    if (nextIndex >= qs.length) {
      if (!hasAccess) {
        setShowUpgrade(true)
      } else {
        setFinished(true)
        saveProgress(0)
      }
    } else {
      // Si question payante sans accès, afficher l'overlay
      if (!hasAccess && nextIndex >= FREE_QUESTIONS_COUNT) {
        setShowPaywallOverlay(true)
        setCurrent(nextIndex)
        setSelected(null)
        setAnswered(false)
        saveProgress(nextIndex)
        return
      }
      setCurrent(nextIndex)
      // Restaurer la réponse mémorisée si elle existe
      const savedAnswer = aMap[nextIndex]
      if (savedAnswer) {
        setSelected(savedAnswer.selected)
        setAnswered(savedAnswer.answered)
      } else {
        setSelected(null)
        setAnswered(false)
      }
      setShowPaywallOverlay(false)
      saveProgress(nextIndex)
    }
  }, [saveProgress])

  const handlePrev = useCallback(() => {
    // Lire l'état depuis la ref pour éviter les closures stales
    const { current: cur, questions: qs, answersMap: aMap } = stateRef.current
    
    if (cur > 0) {
      const prevIndex = cur - 1
      setCurrent(prevIndex)
      // Restaurer la réponse mémorisée
      const savedAnswer = aMap[prevIndex]
      if (savedAnswer) {
        setSelected(savedAnswer.selected)
        setAnswered(savedAnswer.answered)
      } else {
        setSelected(null)
        setAnswered(false)
      }
      setShowPaywallOverlay(false)
      saveProgress(prevIndex)
    }
  }, [saveProgress])

  // Naviguer directement vers une question via les points
  const handleGoToQuestion = useCallback((index) => {
    const { questions: qs, hasFullAccess: hasAccess, answersMap: aMap } = stateRef.current
    goToQuestion(index, qs, hasAccess, aMap, saveProgress)
  }, [goToQuestion, saveProgress])

  // ✅ CORRECTION FINALE v2 — Anti-bug scroll
  // RÈGLE ABSOLUE : SEULES les flèches boutons ← → à l'écran et touches clavier ←/→ changent de question.
  // Le scroll vertical (molette, trackpad, doigt mobile) ne change JAMAIS de question.
  // Swipe horizontal : bloqué via preventDefault pour éviter tout changement involontaire.
  // Amélioration : détection correcte vertical/horizontal avant de décider de bloquer.
  useEffect(() => {
    // 1. Clavier : UNIQUEMENT flèches gauche/droite — haut/bas = scroll natif
    const handleKeyDown = (e) => {
      const tag = (e.target && e.target.tagName) || ''
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      if (e.ctrlKey || e.altKey || e.metaKey) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      }
      // ArrowUp / ArrowDown / PageUp / PageDown / Space → scroll natif, aucune action
    }

    // 2. Molette/trackpad : bloquer UNIQUEMENT quand le scroll horizontal est DOMINANT
    // Ne pas bloquer le scroll vertical pour permettre de défiler la question
    const handleWheel = (e) => {
      const absDx = Math.abs(e.deltaX)
      const absDy = Math.abs(e.deltaY)
      if (absDx > absDy && absDx > 5) {
        e.preventDefault()
      }
      // Scroll vertical dominant → laisser passer (scroll natif de la page)
    }

    // 3. Tactile : détection précise vertical vs horizontal avant de bloquer
    let touchStartX = 0
    let touchStartY = 0
    let touchDirectionLocked = 'none' // 'none'|'vertical'|'horizontal'
    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
      touchDirectionLocked = 'none'
    }
    const handleTouchMove = (e) => {
      if (e.touches.length !== 1) return
      const dx = Math.abs(e.touches[0].clientX - touchStartX)
      const dy = Math.abs(e.touches[0].clientY - touchStartY)
      if (dx < 5 && dy < 5) return // Mouvement insuffisant, ne pas décider encore
      if (touchDirectionLocked === 'none') {
        touchDirectionLocked = dy > dx ? 'vertical' : 'horizontal'
      }
      if (touchDirectionLocked === 'vertical') return // Scroll vertical → laisser passer
      // Swipe horizontal identifié → bloquer pour éviter changement de question ou navigation navigateur
      e.preventDefault()
    }
    const handleTouchEnd = () => {
      touchStartX = 0
      touchStartY = 0
      touchDirectionLocked = 'none'
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('wheel', handleWheel)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleNext, handlePrev])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
        <div className="text-center"><div className="spinner mx-auto mb-3"></div><p className="text-white font-semibold">Chargement...</p></div>
      </div>
    )
  }

  const q = questions[current]
  const total = questions.length
  const freeCount = Math.min(FREE_QUESTIONS_COUNT, total)
  const progress = total > 0 ? ((current + (answered ? 1 : 0)) / total) * 100 : 0
  const catType = category?.type || 'direct'
  const { getPrice: getPublicPrice } = usePublicPrices()
  // 🚨 PHASE 2 — Utiliser le prix promo si une promotion est active, sinon prix normal
  const catPrice = getPublicPrice(catType) || (catType === 'professionnel' ? 20000 : 5000)
  const isCurrentFree = isQuestionFree(current)
  const isLocked = !hasFullAccess && !isCurrentFree

  return (
    <>
      <Head>
        <title>{category?.nom || 'QCM'} – IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen" style={{ background: '#FFF8F0', touchAction: 'pan-y', overscrollBehaviorX: 'none' }}>
        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #8B2500 0%, #C4521A 100%)' }} className="sticky top-0 z-40 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => router.push(`/dashboard?tab=concours&catType=${catType}`)} className="text-orange-200 hover:text-white p-1">
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
                    : `🆓 ${freeCount} gratuites — 🔒 ${Math.max(0, total - freeCount)} payantes`}
                </p>
              )}
            </div>
            {!loadingQ && !error && !showUpgrade && !finished && (
              <span className="text-white text-sm font-bold opacity-80 flex-shrink-0 bg-white bg-opacity-20 px-3 py-1 rounded-xl">
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
                <p className="text-amber-800 font-bold text-sm">{freeCount} questions gratuites sur ce dossier</p>
                <p className="text-amber-700 text-xs">Les questions {freeCount+1}+ nécessitent un abonnement 🔒</p>
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
                    {score}<span className="text-xl text-gray-400">/{freeCount}</span>
                  </p>
                </div>
                <div className="rounded-2xl p-5 mb-5" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                  <p className="text-orange-200 text-sm mb-1">Abonnez-vous pour accéder à</p>
                  <p className="text-white font-bold text-lg mb-1">TOUTES les questions de ce dossier</p>
                  <p className="text-2xl font-extrabold text-white">{catPrice.toLocaleString()} FCFA</p>
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
                    onClick={() => { 
                      setCurrent(0)
                      setSelected(null)
                      setAnswered(false)
                      setScore(0)
                      setShowUpgrade(false)
                      setAnswersMap({})
                      setShowPaywallOverlay(false)
                      saveProgress(0)
                    }}
                    className="w-full py-3.5 font-bold rounded-xl border-2 border-amber-300 text-amber-800 active:scale-95"
                  >
                    🔄 Recommencer les questions gratuites
                  </button>
                  <button onClick={() => router.push(`/dashboard?tab=concours&catType=${catType}`)} className="block w-full text-center text-gray-400 text-sm py-2">
                    ← Retour aux dossiers
                  </button>
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
                  <button onClick={() => { 
                    setCurrent(0)
                    setSelected(null)
                    setAnswered(false)
                    setScore(0)
                    setFinished(false)
                    setAnswersMap({})
                    setShowPaywallOverlay(false)
                    saveProgress(0)
                  }}
                    className="w-full py-4 text-lg font-bold text-white rounded-xl shadow-md active:scale-95"
                    style={{ background: '#C4521A' }}>
                    🔄 Recommencer
                  </button>
                  <button onClick={() => router.push(`/dashboard?tab=concours&catType=${catType}`)} className="block w-full py-3.5 text-center font-bold rounded-xl border-2 border-gray-200 text-gray-700 active:scale-95">
                    ← Retour aux dossiers
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Question */}
          {!loadingQ && !error && !finished && !showUpgrade && q && (
            <div className="animate-fadeIn">

              {/* Flèches de navigation (les points ont été retirés pour une meilleure lisibilité) */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrev}
                  disabled={current === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-30"
                  style={{ background: current === 0 ? '#f3f4f6' : '#FFF0E8', color: current === 0 ? '#9ca3af' : '#C4521A' }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                  Précédente
                </button>

                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: isLocked ? '#6B7280' : '#8B2500' }}>
                    {isLocked ? (
                      <span className="flex items-center gap-1 justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        Q{current + 1} – Payante
                      </span>
                    ) : (
                      `Question ${current + 1} / ${total}`
                    )}
                  </p>
                  {!hasFullAccess && (
                    <p className="text-xs mt-0.5" style={{ color: isLocked ? '#EF4444' : '#22C55E' }}>
                      {isLocked ? '🔒 Abonnement requis' : '🆓 Gratuite'}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  disabled={current >= questions.length - 1}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-30"
                  style={{
                    background: current >= questions.length - 1 ? '#f3f4f6' : '#FFF0E8',
                    color: current >= questions.length - 1 ? '#9ca3af' : '#C4521A'
                  }}
                >
                  Suivante
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>

              {/* OVERLAY PAYANT */}
              {isLocked && showPaywallOverlay && (
                <div className="animate-popIn rounded-3xl overflow-hidden shadow-xl border-2 mb-5" style={{ borderColor: '#C4521A' }}>
                  <div className="p-6 text-center" style={{ background: 'linear-gradient(135deg,#8B2500,#C4521A)' }}>
                    <div className="text-5xl mb-3">🔒</div>
                    <h3 className="text-white font-extrabold text-xl mb-1">Question {current + 1} – Payante</h3>
                    <p className="text-orange-200 text-sm">Les questions {FREE_QUESTIONS_COUNT+1}+ nécessitent un abonnement</p>
                  </div>
                  <div className="bg-white p-6">
                    <div className="rounded-2xl p-4 mb-4" style={{ background: '#FFF7E6' }}>
                      <p className="text-amber-800 font-bold text-center">Votre score actuel</p>
                      <p className="text-3xl font-extrabold text-center mt-1" style={{ color: '#C4521A' }}>
                        {score}<span className="text-lg text-gray-400">/{freeCount}</span>
                      </p>
                      <p className="text-amber-700 text-xs text-center mt-1">sur les {freeCount} questions gratuites</p>
                    </div>
                    <Link
                      href={`/payment?type=${catType}&montant=${catPrice}`}
                      className="block w-full py-4 text-center text-base font-bold text-white rounded-xl shadow-lg active:scale-95 mb-3"
                      style={{ background: 'linear-gradient(135deg,#C4521A,#8B2500)' }}
                    >
                      💳 Débloquer tout – {catPrice.toLocaleString()} FCFA
                    </Link>
                    <button
                      onClick={() => {
                        setShowPaywallOverlay(false)
                        // Retour à la dernière question gratuite (index FREE_QUESTIONS_COUNT - 1)
                        const lastFreeIndex = Math.min(FREE_QUESTIONS_COUNT - 1, questions.length - 1)
                        setCurrent(lastFreeIndex)
                        const savedAnswer = answersMap[lastFreeIndex]
                        if (savedAnswer) {
                          setSelected(savedAnswer.selected)
                          setAnswered(savedAnswer.answered)
                        } else {
                          setSelected(null)
                          setAnswered(false)
                        }
                        saveProgress(lastFreeIndex)
                      }}
                      className="w-full py-3 font-bold rounded-xl border-2 border-amber-300 text-amber-800 text-sm active:scale-95"
                    >
                      ← Revoir les questions gratuites
                    </button>
                  </div>
                </div>
              )}

              {/* Carte Question (masquée si payante et overlay visible) */}
              {!(isLocked && showPaywallOverlay) && (
                <>
                  {/* Badge gratuit/payant sur la question */}
                  {!hasFullAccess && (
                    <div className="flex justify-end mb-2">
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{
                          background: isCurrentFree ? '#ECFDF5' : '#FEF2F2',
                          color: isCurrentFree ? '#15803D' : '#DC2626',
                          border: `1px solid ${isCurrentFree ? '#BBF7D0' : '#FECACA'}`
                        }}
                      >
                        {isCurrentFree ? '🆓 Gratuite' : '🔒 Payante'}
                      </span>
                    </div>
                  )}

                  <div
                    className="bg-white rounded-3xl shadow-md border p-6 mb-5"
                    style={{ borderColor: isLocked ? '#FECACA' : '#FDE68A', opacity: isLocked ? 0.7 : 1 }}
                  >
                    <div className="flex items-start gap-3 mb-6">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: isLocked ? '#9CA3AF' : (isDissertation(q) ? '#8B2500' : '#D4A017') }}>
                        {isDissertation(q) ? '📝' : (current + 1)}
                      </span>
                      <div className="flex-1">
                        {isDissertation(q) && !isLocked && (
                          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded mb-2" style={{ background: '#FFF7E6', color: '#8B2500', border: '1px solid #FDE68A' }}>
                            DISSERTATION / ÉTUDE DE CAS
                          </span>
                        )}
                        {isMultipleAnswer(q) && !isDissertation(q) && !isLocked && (
                          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded mb-2" style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
                            🔢 RÉPONSES MULTIPLES (plusieurs bonnes réponses)
                          </span>
                        )}
                        <p className="text-gray-800 font-semibold text-lg leading-relaxed whitespace-pre-wrap">
                          {isLocked ? '🔒 Cette question est réservée aux abonnés.' : q.question_text}
                        </p>
                      </div>
                    </div>

                    {/* Mode DISSERTATION: Afficher directement le corrigé complet */}
                    {!isLocked && isDissertation(q) && (
                      <div className="mt-4">
                        <div className="rounded-2xl p-5" style={{ background: '#FAF5EB', border: '2px solid #D4A017' }}>
                          <p className="font-bold mb-3 text-base" style={{ color: '#8B2500' }}>
                            📖 Corrigé détaillé :
                          </p>
                          <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap" style={{ lineHeight: '1.7' }}>
                            {q.explication}
                          </div>
                        </div>
                        {!answered && (
                          <button
                            onClick={() => {
                              setAnswered(true)
                              setScore(s => s + 1)
                              setAnswersMap(prev => ({ ...prev, [current]: { selected: 'A', answered: true } }))
                              saveProgress(current)
                              saveProgressServer(current, score + 1)
                            }}
                            className="w-full mt-4 py-3 font-bold rounded-xl text-white active:scale-95"
                            style={{ background: 'linear-gradient(135deg,#D4A017,#8B2500)' }}
                          >
                            ✓ J'ai terminé la lecture
                          </button>
                        )}
                      </div>
                    )}

                    {/* Mode QCM classique */}
                    {!isLocked && !isDissertation(q) && (
                      <div className="space-y-3">
                        {['A', 'B', 'C', 'D'].map(opt => {
                          const optText = q[`option_${opt.toLowerCase()}`]
                          // Ne pas afficher les options N/A
                          if (optText === 'N/A') return null
                          
                          const multi = isMultipleAnswer(q)
                          const correctAnswers = getCorrectAnswers(q)
                          const currentSel = Array.isArray(selected) ? selected : (selected ? [selected] : [])
                          const isOptSelected = currentSel.includes(opt)
                          
                          let cls = 'question-option'
                          if (answered) {
                            if (correctAnswers.includes(opt)) cls += ' correct'
                            else if (isOptSelected) cls += ' wrong'
                            else cls += ' disabled opacity-50'
                          } else if (multi && isOptSelected) {
                            cls += ' selected'
                          }
                          
                          return (
                            <button key={opt} className={cls} onClick={() => handleSelect(opt)}>
                              <span className="option-badge inline-flex w-7 h-7 rounded-full items-center justify-center text-sm font-bold"
                                style={{
                                  background: answered && correctAnswers.includes(opt) ? '#D4A017' : answered && isOptSelected ? '#dc2626' : (multi && isOptSelected ? '#FDE68A' : '#f3f4f6'),
                                  color: (answered && (correctAnswers.includes(opt) || isOptSelected)) ? 'white' : '#374151'
                                }}>
                                {opt}
                              </span>
                              <span className="option-text">{optText}</span>
                              {multi && !answered && (
                                <span className="ml-auto text-xs" style={{ color: isOptSelected ? '#8B2500' : '#9CA3AF' }}>
                                  {isOptSelected ? '✓ sélectionné' : 'Cliquer pour sélectionner'}
                                </span>
                              )}
                            </button>
                          )
                        })}
                        
                        {/* Bouton Valider pour réponses multiples */}
                        {isMultipleAnswer(q) && !answered && (
                          <button
                            onClick={handleValidateMultiple}
                            disabled={!Array.isArray(selected) || selected.length === 0}
                            className="w-full mt-3 py-3 font-bold rounded-xl text-white active:scale-95 disabled:opacity-40"
                            style={{ background: (Array.isArray(selected) && selected.length > 0) ? 'linear-gradient(135deg,#3B82F6,#1E40AF)' : '#9CA3AF' }}
                          >
                            ✓ Valider ma réponse ({Array.isArray(selected) ? selected.length : 0} option{(Array.isArray(selected) && selected.length > 1) ? 's' : ''} sélectionnée{(Array.isArray(selected) && selected.length > 1) ? 's' : ''})
                          </button>
                        )}
                      </div>
                    )}

                    {isLocked && (
                      <Link
                        href={`/payment?type=${catType}&montant=${catPrice}`}
                        className="block w-full py-3.5 text-center font-bold text-white rounded-xl active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#C4521A,#8B2500)' }}
                      >
                        💳 Débloquer – {catPrice.toLocaleString()} FCFA
                      </Link>
                    )}

                    {answered && !isLocked && !isDissertation(q) && (() => {
                      const correctAnswers = getCorrectAnswers(q)
                      const currentSel = Array.isArray(selected) ? selected : (selected ? [selected] : [])
                      const isCorrect = currentSel.length === correctAnswers.length && currentSel.every(s => correctAnswers.includes(s))
                      return (
                        <div className="mt-5 animate-fadeIn rounded-2xl p-4"
                          style={{ background: isCorrect ? '#FFF7E6' : '#FFF7F0', borderLeft: `4px solid ${isCorrect ? '#D4A017' : '#C4521A'}` }}>
                          <p className="font-bold mb-1.5 text-sm" style={{ color: isCorrect ? '#D4A017' : '#C4521A' }}>
                            {isCorrect ? '✅ Bonne réponse !' : `❌ Mauvaise – Bonne${correctAnswers.length > 1 ? 's' : ''} réponse${correctAnswers.length > 1 ? 's' : ''} : ${correctAnswers.join(', ')}`}
                          </p>
                          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{q.explication}</p>
                        </div>
                      )
                    })()}
                  </div>

                  {answered && !isLocked && (
                    <button onClick={handleNext} className="w-full py-4 text-lg font-bold text-white rounded-xl shadow-lg active:scale-95 animate-popIn"
                      style={{ background: 'linear-gradient(135deg, #C4521A, #8B2500)' }}>
                      {current + 1 >= total
                        ? (hasFullAccess ? '📊 Voir mes résultats' : '🔓 Voir le résumé')
                        : 'Question suivante →'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}


// Routes dynamiques Edge Runtime : fallback blocking pour SSR-like behavior
export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' }
}
