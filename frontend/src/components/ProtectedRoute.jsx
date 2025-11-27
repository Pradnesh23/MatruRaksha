// MatruRaksha AI - Protected Route Component
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  // Check role-based access
  if (allowedRoles.length > 0 && user) {
    const hasPermission = allowedRoles.includes(user.role)
    if (!hasPermission) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
          <div className="max-w-lg w-full bg-white/95 backdrop-blur p-8 rounded-2xl shadow-xl text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <span className="text-red-600 text-2xl">⛔</span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don’t have permission to access this page.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500">Required</div>
                <div className="font-semibold text-gray-900">{allowedRoles.join(', ')}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500">Your Role</div>
                <div className="font-semibold text-gray-900">{user.role || 'none'}</div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Go Back
              </button>
              <a
                href="/auth/login"
                className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Switch Account
              </a>
            </div>
          </div>
        </div>
      )
    }
  }

  // Render the protected content
  return children
}

export default ProtectedRoute
