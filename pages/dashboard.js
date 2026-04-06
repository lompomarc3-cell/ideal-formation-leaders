import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from './_app'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState([])
  const [progress, setProgress] = useState({})

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchAnnouncements()
      fetchAllProgress()
    }
  }, [user])

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3)
    if (data) setAnnouncements(data)
  }

  const fetchAllProgress = async () => {
    // Use localStorage for progress tracking since user_progress has different schema
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(`ifl_progress_${user.id}_`))
      const p = {}
      keys.forEach(key => {
        const catId = key.replace(`ifl_progress_${user.id}_`, '')
        try {
          p[catId] = JSON.parse(localStorage.getItem(key))
        } catch(e) {}
      })
      setProgress(p)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isSubscribed = (type) => {
    if (!profile) return false
    if (profile.subscription_status === 'active') {
      if (type === 'direct') return true
      if (type === 'professionnel' && profile.subscription_type === 'professionnel') return true
    }
    return false
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner w-10 h-10"></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Tableau de bord - IFL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Top Nav */}
        <header className="bg-blue-900 text-white px-4 py-4 sticky top-0 z-50 shadow-lg">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="IFL" className="h-9 w-9 object-contain" />
              <div>
                <div className="font-bold text-sm">IFL</div>
                <div className="text-blue-200 text-xs">Bonjour, {profile.full_name?.split(' ')[0] || 'Étudiant'}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-blue-200 hover:text-white text-sm font-medium transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          
          {/* Subscription Status */}
          <div className={`rounded-2xl p-5 ${
            profile.subscription_status === 'active' 
              ? 'bg-gradient-to-r from-green-600 to-green-500' 
              : 'bg-gradient-to-r from-blue-800 to-blue-700'
          } text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-80 mb-1">Statut de votre abonnement</div>
                {profile.subscription_status === 'active' ? (
                  <>
                    <div className="font-bold text-lg">
                      ✅ {profile.subscription_type === 'professionnel' ? 'Concours Professionnels' : 'Concours Directs'} activé
                    </div>
                    {profile.subscription_expires_at && (
                      <div className="text-sm opacity-75 mt-1">
                        Valide jusqu'au {new Date(profile.subscription_expires_at).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="font-bold text-lg">🔓 Version gratuite</div>
                    <div className="text-sm opacity-75 mt-1">Débloquez l'accès complet</div>
                  </>
                )}
              </div>
              <div className="text-4xl">
                {profile.subscription_status === 'active' ? '🎓' : '📚'}
              </div>
            </div>
          </div>

          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="space-y-2">
              {announcements.map(ann => (
                <div key={ann.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="font-semibold text-yellow-800 text-sm">{ann.titre}</div>
                  <div className="text-yellow-700 text-xs mt-1">{ann.contenu}</div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            {/* Demo */}
            <Link href="/demo" className="card hover:shadow-md transition-all active:scale-95 cursor-pointer no-underline">
              <div className="text-3xl mb-2">🆓</div>
              <div className="font-bold text-gray-900 text-sm">Démo Gratuite</div>
              <div className="text-gray-500 text-xs mt-1">10 questions</div>
            </Link>

            {/* Progress */}
            <div className="card">
              <div className="text-3xl mb-2">📊</div>
              <div className="font-bold text-gray-900 text-sm">Progression</div>
              <div className="text-gray-500 text-xs mt-1">
                {Object.keys(progress).length} dossier(s) en cours
              </div>
            </div>
          </div>

          {/* Course Sections */}
          <div className="space-y-4">
            {/* Concours Directs */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900">🎯 Concours Directs</h2>
                  <p className="text-gray-500 text-xs mt-0.5">10 matières • 5 000 FCFA</p>
                </div>
                {isSubscribed('direct') ? (
                  <span className="badge badge-green">Activé</span>
                ) : (
                  <span className="badge badge-blue">5 000 F</span>
                )}
              </div>

              {isSubscribed('direct') ? (
                <Link href="/courses/direct" className="w-full btn-primary block text-center text-sm py-2.5">
                  Accéder aux cours
                </Link>
              ) : (
                <Link href="/payment?type=direct" className="w-full btn-orange block text-center text-sm py-2.5">
                  S'abonner - 5 000 FCFA
                </Link>
              )}
            </div>

            {/* Concours Professionnels */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900">🏆 Concours Professionnels</h2>
                  <p className="text-gray-500 text-xs mt-0.5">12 spécialités • 20 000 FCFA</p>
                </div>
                {isSubscribed('professionnel') ? (
                  <span className="badge badge-green">Activé</span>
                ) : (
                  <span className="badge badge-orange">20 000 F</span>
                )}
              </div>

              {isSubscribed('professionnel') ? (
                <Link href="/courses/professionnel" className="w-full btn-primary block text-center text-sm py-2.5">
                  Accéder aux cours
                </Link>
              ) : (
                <Link href="/payment?type=professionnel" className="w-full btn-orange block text-center text-sm py-2.5">
                  S'abonner - 20 000 FCFA
                </Link>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-400 text-xs pb-4">
            © 2025 IFL - Idéale Formation of Leader<br />
            Déterminer • Travailler • Réussir
          </div>
        </main>
      </div>
    </>
  )
}
