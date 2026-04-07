import '../styles/globals.css'
import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('ifl_token')
    if (token) {
      fetchUser(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async (token) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.id) {
        setUser(data)
      } else {
        localStorage.removeItem('ifl_token')
        setUser(null)
      }
    } catch {
      localStorage.removeItem('ifl_token')
      setUser(null)
    }
    setLoading(false)
  }

  const login = (token, userData) => {
    localStorage.setItem('ifl_token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('ifl_token')
    setUser(null)
    router.push('/')
  }

  const getToken = () => {
    return localStorage.getItem('ifl_token')
  }

  const refreshUser = async () => {
    const token = localStorage.getItem('ifl_token')
    if (token) await fetchUser(token)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getToken, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}
