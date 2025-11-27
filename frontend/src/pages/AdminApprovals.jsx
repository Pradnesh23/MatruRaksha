import React, { useEffect, useState } from 'react'
import { ShieldCheck, XCircle, FileText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'

export default function AdminApprovals() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadRequests = async () => {
    try {
      setLoading(true)
      const res = await authAPI.listRegisterRequests()
      setRequests(res.data?.requests || [])
    } catch (e) {
      setError(e.message || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const decide = async (id, approved) => {
    try {
      await authAPI.decideRegisterRequest(id, approved)
      await loadRequests()
    } catch (e) {
      setError(e.message || 'Failed to submit decision')
    }
  }

  useEffect(() => { loadRequests() }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-red-600" />
            <div>
              <h2 className="text-xl font-bold">Pending Registration Requests</h2>
              <p className="text-sm text-gray-500">Approve or reject new Doctor/ASHA registrations</p>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center text-gray-600">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center text-gray-600">No pending requests</div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="bg-white rounded-xl shadow-sm p-5 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{req.full_name} <span className="ml-2 text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700">{req.role_requested}</span></div>
                  <div className="text-sm text-gray-600">{req.email} · {req.assigned_area || 'Area N/A'}</div>
                  {req.role_requested === 'DOCTOR' && req.degree_cert_url && (
                    <a href={req.degree_cert_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm">
                      <FileText className="w-4 h-4" /> View Certification
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => decide(req.id, true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                  <button onClick={() => decide(req.id, false)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
