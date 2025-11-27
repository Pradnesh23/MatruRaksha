import React from 'react'
import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, isAuthenticated, signOut } = useAuth()

  const roleColor = user?.role === 'ADMIN'
    ? 'bg-red-600'
    : user?.role === 'DOCTOR'
    ? 'bg-green-600'
    : 'bg-purple-600'

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 fill-current" />
            <div>
              <h1 className="text-2xl font-bold">MatruRaksha</h1>
              <p className="text-blue-100 text-xs">Maternal Health Guardian System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-white/90 hover:text-white">Home</Link>
            <Link to="/doctor" className="text-white/90 hover:text-white">Doctor</Link>
            <Link to="/asha" className="text-white/90 hover:text-white">ASHA</Link>
            {user?.role === 'ADMIN' && (
              <Link to="/admin/dashboard" className="text-white/90 hover:text-white">Admin</Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs ${roleColor}`}>{user?.role}</span>
                <span className="text-white/90 text-sm">{user?.full_name || user?.email}</span>
                {user?.role === 'ADMIN' && (
                  <Link to="/admin/approvals" className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm">Approvals</Link>
                )}
                <button
                  onClick={signOut}
                  className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/auth/login" className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm">Login</Link>
                <Link to="/auth/signup" className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm">Signup</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
