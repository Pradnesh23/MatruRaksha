import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CaseChat from '../components/CaseChat.jsx'
import { supabase } from '../services/auth.js'
import { Stethoscope, AlertTriangle, AlertCircle, CheckCircle, MapPin, Cake, Activity, Heart, TrendingUp, Search, RefreshCw } from 'lucide-react'

export default function DoctorDashboard() {
  const { t } = useTranslation()
  const [mothers, setMothers] = useState([])
  const [selected, setSelected] = useState(null)
  const [riskMap, setRiskMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const loadMothers = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('mothers').select('*')
      const moms = data || []
      setMothers(moms)
      const risks = {}
      await Promise.all(
        moms.map(async m => {
          const { data: ra } = await supabase
            .from('risk_assessments')
            .select('risk_level, created_at')
            .eq('mother_id', m.id)
            .order('created_at', { ascending: false })
            .limit(1)
          risks[m.id] = ra && ra[0] ? ra[0].risk_level : 'LOW'
        })
      )
      setRiskMap(risks)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMothers() }, [])

  const sorted = [...mothers]
    .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.location.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const order = { HIGH: 0, MODERATE: 1, LOW: 2 }
      return (order[riskMap[a.id]] ?? 2) - (order[riskMap[b.id]] ?? 2)
    })

  const highRiskCount = mothers.filter(m => riskMap[m.id] === 'HIGH').length
  const moderateRiskCount = mothers.filter(m => riskMap[m.id] === 'MODERATE').length

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'HIGH': return 'bg-red-50 border-red-200 hover:border-red-300'
      case 'MODERATE': return 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
      default: return 'bg-green-50 border-green-200 hover:border-green-300'
    }
  }

  const getRiskIcon = (risk) => {
    switch(risk) {
      case 'HIGH': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'MODERATE': return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default: return <CheckCircle className="w-5 h-5 text-green-600" />
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-6 py-8 flex items-center gap-4">
          <div className="bg-blue-500 p-3 rounded-lg">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Doctor Portal</h1>
            <p className="text-blue-100 text-sm">Patient Management System</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-4 py-4 bg-gray-50 border-b border-gray-200">
          <div className="bg-white p-3 rounded-lg text-center border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{mothers.length}</div>
            <div className="text-xs text-gray-600 mt-1">Total Patients</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center border border-red-200">
            <div className="text-2xl font-bold text-red-600">{highRiskCount}</div>
            <div className="text-xs text-red-600 mt-1">High Risk</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg text-center border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{moderateRiskCount}</div>
            <div className="text-xs text-yellow-600 mt-1">Moderate</div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Patients List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              <p className="text-gray-600 text-sm">Loading patients...</p>
            </div>
          ) : sorted.length > 0 ? (
            <div className="space-y-3">
              {sorted.map(m => {
                const risk = riskMap[m.id] || 'LOW'
                return (
                  <div 
                    key={m.id} 
                    onClick={() => setSelected(m)} 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${
                      selected?.id === m.id 
                        ? 'border-blue-600 bg-blue-50 shadow-md' 
                        : `border-gray-200 ${getRiskColor(risk)}`
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-sm">{m.name}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                          <MapPin className="w-3 h-3" />
                          {m.location}
                        </div>
                      </div>
                      {getRiskIcon(risk)}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded-full font-semibold ${
                        risk === 'HIGH' ? 'bg-red-100 text-red-700' : 
                        risk === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {risk}
                      </span>
                      <span className="text-gray-500">Age: {m.age}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">No patients found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <div className="flex flex-col h-full">
            {/* Patient Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selected.name}</h2>
                  <p className="text-gray-600 mt-2 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Patient ID: {selected.id?.slice(0, 8)}
                  </p>
                </div>
                <div className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 text-lg ${
                  riskMap[selected.id] === 'HIGH' ? 'bg-red-100 text-red-700' :
                  riskMap[selected.id] === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {getRiskIcon(riskMap[selected.id] || 'LOW')}
                  Risk: {riskMap[selected.id] || 'LOW'}
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-hidden flex gap-6 p-8">
              {/* Patient Details Card */}
              <div className="w-96 bg-white rounded-xl shadow-md border border-gray-200 p-6 overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Clinical Profile
                </h3>
                <div className="space-y-5">
                  <div className="pb-4 border-b border-gray-200">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Full Name</label>
                    <p className="text-gray-900 font-semibold mt-2">{selected.name}</p>
                  </div>
                  <div className="pb-4 border-b border-gray-200">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Age</label>
                    <p className="text-gray-900 font-semibold mt-2 flex items-center gap-2">
                      <Cake className="w-4 h-4 text-blue-600" /> {selected.age} years
                    </p>
                  </div>
                  <div className="pb-4 border-b border-gray-200">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Location</label>
                    <p className="text-gray-900 font-semibold mt-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" /> {selected.location}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">BMI</label>
                      <p className="text-gray-900 font-semibold mt-2">{selected.bmi?.toFixed(1)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Gravida</label>
                      <p className="text-gray-900 font-semibold mt-2">{selected.gravida}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Parity</label>
                      <p className="text-gray-900 font-semibold mt-2">{selected.parity}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Language</label>
                      <p className="text-gray-900 font-semibold mt-2 capitalize">{selected.preferred_language}</p>
                    </div>
                  </div>
                  {selected.due_date && (
                    <div className="pb-4 border-b border-gray-200">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Due Date</label>
                      <p className="text-gray-900 font-semibold mt-2">{new Date(selected.due_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Case Discussion */}
              <div className="flex-1 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Clinical Discussion
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">Real-time case notes and AI insights</p>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CaseChat motherId={selected.id} userRole={'DOCTOR'} userName={'Doctor'} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Stethoscope className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-semibold text-gray-900">Select a Patient</p>
              <p className="text-gray-600 mt-2">Choose a patient from the list to view their details and clinical notes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
