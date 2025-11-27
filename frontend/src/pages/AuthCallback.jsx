import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import authService from '../services/auth'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { loading, user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) {
      (async () => {
        const current = await authService.getCurrentUser()
        if (!current) return
        const role = current?.role
        if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true })
        else if (role === 'DOCTOR') navigate('/doctor/dashboard', { replace: true })
        else if (role === 'ASHA_WORKER') navigate('/asha/dashboard', { replace: true })
        else navigate('/', { replace: true })
      })()
      return
    }

    const role = user?.role
    if (role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true })
    } else if (role === 'DOCTOR') {
      navigate('/doctor/dashboard', { replace: true })
    } else if (role === 'ASHA_WORKER') {
      navigate('/asha/dashboard', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }, [loading, isAuthenticated, user, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="mt-4 text-gray-600">Signing you in...</p>
      </div>
    </div>
  )
}
