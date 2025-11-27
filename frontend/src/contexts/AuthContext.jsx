// MatruRaksha AI - Authentication Context
// React context for managing authentication state

import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/auth'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current session on mount
    const initAuth = async () => {
      try {
        const currentSession = await authService.getSession()
        setSession(currentSession)

        if (currentSession?.user) {
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen to auth state changes
    const subscription = authService.onAuthStateChange((event, session, user) => {
      console.log('Auth state changed:', event)
      setSession(session)
      setUser(user)
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signUp = async (userData) => {
    try {
      setLoading(true)
      const result = await authService.signUp(userData)
      return result
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      const result = await authService.signIn(email, password)
      setUser(result.user)
      setSession(result.session)
      return result
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const result = await authService.signInWithGoogle()
      return result
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await authService.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    try {
      const result = await authService.updateProfile(updates)
      // Refresh user data
      const updatedUser = await authService.getCurrentUser()
      setUser(updatedUser)
      return result
    } catch (error) {
      throw error
    }
  }

  const resetPassword = async (email) => {
    return await authService.resetPassword(email)
  }

  const updatePassword = async (newPassword) => {
    return await authService.updatePassword(newPassword)
  }

  const hasRole = (allowedRoles) => {
    return authService.hasRole(user, allowedRoles)
  }

  const isAdmin = () => hasRole(['ADMIN'])
  const isDoctor = () => hasRole(['DOCTOR', 'ADMIN'])
  const isAshaWorker = () => hasRole(['ASHA_WORKER', 'DOCTOR', 'ADMIN'])

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    hasRole,
    isAdmin,
    isDoctor,
    isAshaWorker,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
