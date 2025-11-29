import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../services/auth.js'
import CaseChat from '../components/CaseChat.jsx'
import { Users, Search, Phone, MapPin, AlertCircle, Heart, TrendingUp, Loader, RefreshCw } from 'lucide-react'

export default function ASHAInterface() {
  const { t } = useTranslation()
  const [currentAshaId, setCurrentAshaId] = useState('')
  const [mothers, setMothers] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [riskMap, setRiskMap] = useState({})

  const loadMothers = async () => {
    if (!currentAshaId) {
      setError('Please enter an ASHA Worker ID')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('mothers')
        .select('*')
        .eq('asha_worker_id', Number(currentAshaId))
      if (err) throw err
      setMothers(data || [])
      
      // Load risk assessments
      const risks = {}
      await Promise.all(
        (data || []).map(async m => {
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
      
      if (data?.length === 0) {
        setError('No assigned mothers found for this ASHA Worker ID')
      }
    } catch (err) {
      setError('Error loading mothers: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    if (currentAshaId) loadMothers() 
  }, [currentAshaId])

  const filtered = mothers.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRiskIcon = (risk) => {
    switch(risk) {
      case 'HIGH': return '🔴'
      case 'MODERATE': return '🟡'
      default: return '🟢'
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 to-green-800 text-white px-6 py-8 flex items-center gap-4">
          <div className="bg-green-500 p-3 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">ASHA Portal</h1>
            <p className="text-green-100 text-sm">Community Health Worker</p>
          </div>
        </div>

        {/* ASHA ID Input */}
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Your ASHA ID</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="number"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              placeholder="Enter ASHA Worker ID"
              value={currentAshaId}
              onChange={e => setCurrentAshaId(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && loadMothers()}
            />
          </div>
          <button 
            onClick={loadMothers}
            disabled={loading || !currentAshaId}
            className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Load Mothers
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Search Filter */}
        {mothers.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search mothers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        )}

        {/* Mothers List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Assigned Mothers ({filtered.length})</h2>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <Loader className="w-6 h-6 animate-spin mx-auto text-green-600 mb-2" />
              <p className="text-gray-600 text-sm">Loading mothers...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map(m => {
                const risk = riskMap[m.id] || 'LOW'
                return (
                  <div 
                    key={m.id} 
                    onClick={() => setSelected(m)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${
                      selected?.id === m.id 
                        ? 'border-green-600 bg-green-50 shadow-md' 
                        : 'border-gray-200 hover:border-green-300 bg-white hover:bg-gray-50'
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
                      <span className="text-lg">{getRiskIcon(risk)}</span>
                    </div>
                    {m.phone && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                        <Phone className="w-3 h-3" />
                        {m.phone}
                      </div>
                    )}
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
              <p className="text-gray-600 font-medium">No mothers found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <div className="flex flex-col h-full">
            {/* Mother Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selected.name}</h2>
                  <p className="text-gray-600 mt-2 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Mother ID: {selected.id?.slice(0, 8)}
                  </p>
                </div>
                <div className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 text-lg ${
                  riskMap[selected.id] === 'HIGH' ? 'bg-red-100 text-red-700' :
                  riskMap[selected.id] === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  <span className="text-2xl">{getRiskIcon(riskMap[selected.id] || 'LOW')}</span>
                  Risk: {riskMap[selected.id] || 'LOW'}
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-hidden flex gap-6 p-8">
              {/* Mother Details Card */}
              <div className="w-80 bg-white rounded-xl shadow-md border border-gray-200 p-6 overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-green-600" />
                  Mother Profile
                </h3>
                <div className="space-y-5">
                  <div className="pb-4 border-b border-gray-200">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Full Name</label>
                    <p className="text-gray-900 font-semibold mt-2">{selected.name}</p>
                  </div>
                  <div className="pb-4 border-b border-gray-200">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Age</label>
                    <p className="text-gray-900 font-semibold mt-2">{selected.age} years</p>
                  </div>
                  <div className="pb-4 border-b border-gray-200">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Location</label>
                    <p className="text-gray-900 font-semibold mt-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-600" /> {selected.location}
                    </p>
                  </div>
                  {selected.phone && (
                    <div className="pb-4 border-b border-gray-200">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Phone</label>
                      <p className="text-gray-900 font-semibold mt-2 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-600" /> {selected.phone}
                      </p>
                    </div>
                  )}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Parity</label>
                      <p className="text-gray-900 font-semibold mt-2">{selected.parity}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Language</label>
                      <p className="text-gray-900 font-semibold mt-2 capitalize">{selected.preferred_language}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Case Discussion */}
              <div className="flex-1 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-5">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Support Notes
                  </h3>
                  <p className="text-green-100 text-sm mt-1">Communicate with doctors and track mother's progress</p>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CaseChat motherId={selected.id} userRole={'ASHA'} userName={'ASHA Worker'} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-semibold text-gray-900">Select a Mother</p>
              <p className="text-gray-600 mt-2">Choose a mother from the list to view her profile and support notes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
