// FILE: frontend/src/App.jsx
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AuthCallback from './pages/AuthCallback'
import RiskDashboard from './pages/RiskDashboard'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import ASHAInterface from './pages/ASHAInterface.jsx'
import AdminDashboard from './pages/AdminDashboard'
import AdminApprovals from './pages/AdminApprovals'
import Home from './pages/Home.jsx'

export default function App() {
  const [isReady, setIsReady] = useState(false)
  const { t, i18n } = useTranslation()

  useEffect(() => {
    // Simple check - just set ready after a short delay
    setTimeout(() => {
      setIsReady(true)
    }, 500)
  }, [])

  if (!isReady) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-lg">
        {t('loading')}
      </div>
    )
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Public Homepage */}
          <Route path="/" element={<Home />} />
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <RiskDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doctor" 
            element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/asha" 
            element={
              <ProtectedRoute allowedRoles={['ASHA_WORKER', 'DOCTOR', 'ADMIN']}>
                <ASHAInterface />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <RiskDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/approvals" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminApprovals />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doctor/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/asha/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['ASHA_WORKER', 'DOCTOR', 'ADMIN']}>
                <ASHAInterface />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
