import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import '../styles/globals.css'
import Head from 'next/head'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('ifl_token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const { user: userData } = await res.json()
        setUser(userData)
      } else {
        localStorage.removeItem('ifl_token')
      }
    } catch (e) {
      console.error('Auth error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (phone, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    localStorage.setItem('ifl_token', data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    localStorage.setItem('ifl_token', data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('ifl_token')
    setUser(null)
  }

  const getToken = () => localStorage.getItem('ifl_token')

  const refreshUser = () => fetchUser()

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, getToken, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#C4521A" />
        <link rel="icon" href="/logo.png" />
        <title>IFL - Idéale Formation of Leader</title>
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  )
}
