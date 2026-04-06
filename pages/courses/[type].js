import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../_app'
import { supabase } from '../../lib/supabase'

export default function CourseList({ type }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [progress, setProgress] = useState({})
  const [loadingCats, setLoadingCats] = useState(true)

  const courseType = router.query.type || type

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!loading && user && profile) {
      if (courseType === 'direct' && profile.subscription_status !== 'active') {
        router.push('/payment?type=direct')
        return
      }
      if (courseType === 'professionnel' && (profile.subscription_status !== 'active' || profile.subscription_type !== 'professionnel')) {
        router.push('/payment?type=professionnel')
        return
      }
      fetchData()
    }
  }, [user, loading, profile, courseType])

  const fetchData = async () => {
    setLoadingCats(true)
    
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('type', courseType)
      .order('created_at', { ascending: true })
    
    if (cats) setCategories(cats)

    const { data: prog } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
    
    if (prog) {
      const p = {}
      prog.forEach(item => { p[item.categorie_id] = item })
      setProgress(p)
    }
    
    setLoadingCats(false)
  }

  const getProgressPercent = (catId, qCount) => {
    const p = progress[catId]
    if (!p || !qCount) return 0
    return Math.min(100, Math.round((p.questions_vues / qCount) * 100))
  }

  if (loading || loadingCats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner w-10 h-10"></div>
      </div>
    )
  }

  const title = courseType === 'direct' ? 'Concours Directs' : 'Concours Professionnels'
  const emoji = courseType === 'direct' ? '🎯' : '🏆'

  return (
    <>
      <Head>
        <title>{title} - IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-900 text-white px-4 py-4 sticky top-0 z-50">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Link href="/dashboard" className="text-blue-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <div className="font-bold">{emoji} {title}</div>
              <div className="text-blue-200 text-xs">{categories.length} dossiers disponibles</div>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          {categories.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-5xl mb-4">📚</div>
              <p className="text-gray-500">Les questions de cette partie seront disponibles très bientôt.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((cat, idx) => {
                const prog = progress[cat.id]
                const percent = prog ? Math.min(100, Math.round((prog.questions_vues / (cat.question_count || 1)) * 100)) : 0
                return (
                  <Link
                    key={cat.id}
                    href={`/quiz/${cat.id}`}
                    className="card hover:shadow-md transition-all active:scale-[0.99] cursor-pointer no-underline block"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="font-bold text-blue-700 text-lg">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm leading-tight">{cat.nom}</div>
                        <div className="text-gray-500 text-xs mt-1">
                          {cat.question_count || 0} question{(cat.question_count || 0) > 1 ? 's' : ''}
                          {prog ? ` • ${prog.score} point${prog.score > 1 ? 's' : ''} ` : ''}
                        </div>
                        {prog && prog.questions_vues > 0 && (
                          <div className="progress-bar mt-2">
                            <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {prog && prog.questions_vues > 0 ? (
                          <span className="badge badge-blue">En cours</span>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </>
  )
}
