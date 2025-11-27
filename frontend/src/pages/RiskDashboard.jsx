// FILE: frontend/src/pages/RiskDashboard.jsx
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Simple API calls without external library
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const apiCall = async (method, endpoint, data = null) => {
  try {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (data) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(`${API_URL}${endpoint}`, options)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || `HTTP ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error.message)
    throw error
  }
}

export default function RiskDashboard() {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('maatruDarkMode')
    return saved ? JSON.parse(saved) : false
  })
  const [mothers, setMothers] = useState([])
  const [analytics, setAnalytics] = useState({
    totalMothers: 0,
    highRiskCount: 0,
    moderateRiskCount: 0,
    lowRiskCount: 0,
    totalAssessments: 0
  })
  const [riskTrend, setRiskTrend] = useState([])
  const [ageDistribution, setAgeDistribution] = useState([])
  const [vitalStats, setVitalStats] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [chartsLoading, setChartsLoading] = useState(false)

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('maatruDarkMode', JSON.stringify(darkMode))
  }, [darkMode])

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    age: '',
    gravida: 'Gravida 1',
    parity: 'Parity 0',
    bmi: '',
    location: '',
    preferred_language: 'en',
    telegram_chat_id: ''
  })

  // Risk assessment form state
  const [assessmentForm, setAssessmentForm] = useState({
    mother_id: '',
    systolic_bp: '',
    diastolic_bp: '',
    heart_rate: '',
    blood_glucose: '',
    hemoglobin: '',
    proteinuria: 0,
    edema: 0,
    headache: 0,
    vision_changes: 0,
    epigastric_pain: 0,
    vaginal_bleeding: 0
  })

  const [riskResult, setRiskResult] = useState(null)
  const [expandedMother, setExpandedMother] = useState(null)

  // Fetch analytics only on mount and manual refresh
  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  // Fetch mothers for dropdowns
  useEffect(() => {
    if (activeTab === 'risk-assessment' || activeTab === 'all-mothers') {
      fetchMothers()
    }
  }, [activeTab])

  const fetchAnalyticsData = async () => {
    try {
      setChartsLoading(true)
      const response = await apiCall('GET', '/analytics/dashboard')
      console.log('Analytics response:', response)
      setAnalytics({
        totalMothers: response.total_mothers || 0,
        highRiskCount: response.high_risk_count || 0,
        moderateRiskCount: response.moderate_risk_count || 0,
        lowRiskCount: response.low_risk_count || 0,
        totalAssessments: response.total_assessments || 0
      })

      // Fetch detailed analytics for charts
      await fetchDetailedAnalytics()
    } catch (error) {
      console.error('Failed to load analytics:', error.message)
      showMessage('Failed to refresh analytics', 'error')
    } finally {
      setChartsLoading(false)
    }
  }

  const fetchDetailedAnalytics = async () => {
    try {
      const mothersRes = await apiCall('GET', '/mothers')
      const mothersData = mothersRes.data || []

      // Fetch all assessments
      let allAssessments = []
      for (const mother of mothersData) {
        try {
          const res = await apiCall('GET', `/risk/mother/${mother.id}`)
          if (res.data) {
            allAssessments = [...allAssessments, ...res.data]
          }
        } catch (err) {
          console.log(`Could not fetch assessments for mother ${mother.id}`)
        }
      }

      // Age Distribution
      const ageGroups = {
        '15-20': 0,
        '20-25': 0,
        '25-30': 0,
        '30-35': 0,
        '35-40': 0,
        '40+': 0
      }

      mothersData.forEach(m => {
        if (m.age >= 15 && m.age < 20) ageGroups['15-20']++
        else if (m.age >= 20 && m.age < 25) ageGroups['20-25']++
        else if (m.age >= 25 && m.age < 30) ageGroups['25-30']++
        else if (m.age >= 30 && m.age < 35) ageGroups['30-35']++
        else if (m.age >= 35 && m.age < 40) ageGroups['35-40']++
        else ageGroups['40+']++
      })

      const ageData = Object.entries(ageGroups).map(([age, count]) => ({
        name: age,
        value: count
      }))
      setAgeDistribution(ageData)

      // Risk Trend (last 7 days)
      const sortedAssessments = allAssessments.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      )

      const dailyRisk = {}
      sortedAssessments.forEach(assessment => {
        const date = new Date(assessment.created_at).toLocaleDateString()
        if (!dailyRisk[date]) {
          dailyRisk[date] = { date, HIGH: 0, MODERATE: 0, LOW: 0 }
        }
        dailyRisk[date][assessment.risk_level]++
      })

      const riskData = Object.values(dailyRisk).slice(-7)
      setRiskTrend(riskData)

      // Vital Stats
      const vitals = {
        avgSystolic: 0,
        avgDiastolic: 0,
        avgHeartRate: 0,
        avgGlucose: 0,
        avgHemoglobin: 0
      }

      let systolicCount = 0, diastolicCount = 0, hrCount = 0, glucoseCount = 0, hbCount = 0

      allAssessments.forEach(assessment => {
        if (assessment.systolic_bp) {
          vitals.avgSystolic += assessment.systolic_bp
          systolicCount++
        }
        if (assessment.diastolic_bp) {
          vitals.avgDiastolic += assessment.diastolic_bp
          diastolicCount++
        }
        if (assessment.heart_rate) {
          vitals.avgHeartRate += assessment.heart_rate
          hrCount++
        }
        if (assessment.blood_glucose) {
          vitals.avgGlucose += assessment.blood_glucose
          glucoseCount++
        }
        if (assessment.hemoglobin) {
          vitals.avgHemoglobin += assessment.hemoglobin
          hbCount++
        }
      })

      const vitalData = [
        {
          name: 'Systolic BP',
          value: systolicCount > 0 ? Math.round(vitals.avgSystolic / systolicCount) : 0,
          normal: 120
        },
        {
          name: 'Diastolic BP',
          value: diastolicCount > 0 ? Math.round(vitals.avgDiastolic / diastolicCount) : 0,
          normal: 80
        },
        {
          name: 'Heart Rate',
          value: hrCount > 0 ? Math.round(vitals.avgHeartRate / hrCount) : 0,
          normal: 75
        },
        {
          name: 'Glucose',
          value: glucoseCount > 0 ? Math.round(vitals.avgGlucose / glucoseCount) : 0,
          normal: 100
        },
        {
          name: 'Hemoglobin',
          value: hbCount > 0 ? (vitals.avgHemoglobin / hbCount).toFixed(1) : 0,
          normal: 12
        }
      ]
      setVitalStats(vitalData)
    } catch (err) {
      console.error('Error fetching detailed analytics:', err)
    }
  }

  const fetchMothers = async () => {
    try {
      setLoading(true)
      const response = await apiCall('GET', '/mothers')
      const mothersData = response.data || []
      
      // Fetch assessments for each mother
      const mothersWithAssessments = await Promise.all(
        mothersData.map(async (mother) => {
          try {
            const assessResponse = await apiCall('GET', `/risk/mother/${mother.id}`)
            const assessments = assessResponse.data || []
            
            const latestAssessment = assessments.length > 0 ? assessments[0] : null
            
            return {
              ...mother,
              assessments: assessments,
              latestRisk: latestAssessment
            }
          } catch (e) {
            return {
              ...mother,
              assessments: [],
              latestRisk: null
            }
          }
        })
      )
      setMothers(mothersWithAssessments)
    } catch (error) {
      showMessage('Failed to load mothers: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)

      const gravida = parseInt(registerForm.gravida.split(' ')[1], 10)
      const parity = parseInt(registerForm.parity.split(' ')[1], 10)

      const payload = {
        name: registerForm.name,
        phone: registerForm.phone,
        age: parseInt(registerForm.age, 10),
        gravida: gravida,
        parity: parity,
        bmi: parseFloat(registerForm.bmi),
        location: registerForm.location,
        preferred_language: registerForm.preferred_language,
        telegram_chat_id: registerForm.telegram_chat_id || null
      }

      console.log('Sending register payload:', payload)
      await apiCall('POST', '/mothers/register', payload)

      showMessage('✅ Mother registered successfully!', 'success')
      
      setRegisterForm({
        name: '',
        phone: '',
        age: '',
        gravida: 'Gravida 1',
        parity: 'Parity 0',
        bmi: '',
        location: '',
        preferred_language: 'en',
        telegram_chat_id: ''
      })

      fetchAnalyticsData()
    } catch (error) {
      showMessage('❌ Error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAssessRisk = async (e) => {
    e.preventDefault()
    if (!assessmentForm.mother_id) {
      showMessage('Please select a mother', 'error')
      return
    }

    try {
      setLoading(true)

      const payload = {
        mother_id: assessmentForm.mother_id,
        systolic_bp: assessmentForm.systolic_bp ? parseInt(assessmentForm.systolic_bp, 10) : null,
        diastolic_bp: assessmentForm.diastolic_bp ? parseInt(assessmentForm.diastolic_bp, 10) : null,
        heart_rate: assessmentForm.heart_rate ? parseInt(assessmentForm.heart_rate, 10) : null,
        blood_glucose: assessmentForm.blood_glucose ? parseFloat(assessmentForm.blood_glucose) : null,
        hemoglobin: assessmentForm.hemoglobin ? parseFloat(assessmentForm.hemoglobin) : null,
        proteinuria: 0,
        edema: 0,
        headache: 0,
        vision_changes: 0,
        epigastric_pain: 0,
        vaginal_bleeding: 0
      }

      console.log('Sending assessment payload:', payload)
      const response = await apiCall('POST', '/risk/assess', payload)
      
      setRiskResult(response)
      showMessage('✅ Risk assessment completed!', 'success')
      
      // Clear form
      setAssessmentForm({
        mother_id: '',
        systolic_bp: '',
        diastolic_bp: '',
        heart_rate: '',
        blood_glucose: '',
        hemoglobin: '',
        proteinuria: 0,
        edema: 0,
        headache: 0,
        vision_changes: 0,
        epigastric_pain: 0,
        vaginal_bleeding: 0
      })
      
      fetchAnalyticsData()
    } catch (error) {
      showMessage('❌ Error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterChange = (e) => {
    const { name, value } = e.target
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAssessmentChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'mother_id') {
      setAssessmentForm({
        mother_id: value,
        systolic_bp: '',
        diastolic_bp: '',
        heart_rate: '',
        blood_glucose: '',
        hemoglobin: '',
        proteinuria: 0,
        edema: 0,
        headache: 0,
        vision_changes: 0,
        epigastric_pain: 0,
        vaginal_bleeding: 0
      })
      setRiskResult(null)
    } else {
      setAssessmentForm(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(''), 4000)
  }

  const COLORS = {
    HIGH: '#ef4444',
    MODERATE: '#f59e0b',
    LOW: '#10b981',
    primary: '#6366f1',
    secondary: '#8b5cf6'
  }

  return (
    <div className={`${darkMode ? 'bg-[#1a1a2e]' : 'bg-[#f0f4f8]'} min-h-screen py-6 transition-colors`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>🏥 MaatruRaksha AI</h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('maternal_system')}</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-lg font-semibold shadow-sm ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            title={darkMode ? t('light_mode') : t('dark_mode')}
          >
            {darkMode ? `☀️ ${t('light')}` : `🌙 ${t('dark')}`}
          </button>
        </div>

        {message && (
          <div className={`fixed top-5 right-5 rounded-lg shadow-lg text-sm max-w-sm px-5 py-4 animate-fade-in ${
            message.type === 'success' ? 'bg-green-100 text-green-900 border border-green-200' :
            message.type === 'error' ? 'bg-red-100 text-red-900 border border-red-200' : 'bg-blue-100 text-blue-900 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className={`mb-6 p-2 rounded-xl shadow ${darkMode ? 'bg-[#262641]' : 'bg-white'}`}>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'dashboard', label: `📊 ${t('dashboard')}` },
              { id: 'register', label: `➕ ${t('register')}` },
              { id: 'risk-assessment', label: `⚠️ ${t('risk_assessment')}` },
              { id: 'all-mothers', label: `👥 ${t('all_mothers')}` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab - With Analytics */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top KPI Cards */}
            <div>
              <div className="flex items-center justify-between mb-5 px-5 py-4 rounded-xl text-white" style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                <h2 className="m-0 text-lg font-bold">📈 {t('health_analytics')}</h2>
                <div className="bg-white/20 px-4 py-2 rounded-lg text-base font-semibold">
                  {t('total_mothers')}: <strong>{analytics.totalMothers}</strong>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #ef4444',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '12px' }}>🔴 {t('high_risk')}</div>
                  <div style={{ fontSize: '40px', fontWeight: '700', color: '#ef4444' }}>{analytics.highRiskCount}</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #f59e0b',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '12px' }}>🟡 {t('moderate_risk')}</div>
                  <div style={{ fontSize: '40px', fontWeight: '700', color: '#f59e0b' }}>{analytics.moderateRiskCount}</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #10b981',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '12px' }}>🟢 {t('low_risk')}</div>
                  <div style={{ fontSize: '40px', fontWeight: '700', color: '#10b981' }}>{analytics.lowRiskCount}</div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3b82f6',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '12px' }}>📋 {t('total_assessments')}</div>
                  <div style={{ fontSize: '40px', fontWeight: '700', color: '#3b82f6' }}>{analytics.totalAssessments}</div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Risk Trend Chart */}
              <div style={{
                background: darkMode ? '#262641' : 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'background 0.3s'
              }}>
                <h3 style={{ color: darkMode ? '#fff' : '#1f2937', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>📊 {t('risk_trend')}</h3>
                {riskTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={riskTrend} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="HIGH" stackId="a" fill={COLORS.HIGH} name={t('high_risk')} />
                      <Bar dataKey="MODERATE" stackId="a" fill={COLORS.MODERATE} name={t('moderate_risk')} />
                      <Bar dataKey="LOW" stackId="a" fill={COLORS.LOW} name={t('low_risk')} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>{t('no_assessment_data')}</p>
                )}
              </div>

              {/* Age Distribution & Risk Distribution */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                <div style={{
                  background: darkMode ? '#262641' : 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'background 0.3s'
                }}>
                  <h3 style={{ color: darkMode ? '#fff' : '#1f2937', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>👶 {t('age_distribution')}</h3>
                  {ageDistribution.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={ageDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {ageDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>{t('no_data')}</p>
                  )}
                </div>

                <div style={{
                  background: darkMode ? '#262641' : 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'background 0.3s'
                }}>
                  <h3 style={{ color: darkMode ? '#fff' : '#1f2937', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>⚠️ {t('overall_risk_distribution')}</h3>
                  {analytics && (analytics.highRiskCount + analytics.moderateRiskCount + analytics.lowRiskCount) > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: t('high_risk'), value: analytics.highRiskCount },
                            { name: t('moderate_risk'), value: analytics.moderateRiskCount },
                            { name: t('low_risk'), value: analytics.lowRiskCount }
                          ]}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          <Cell fill={COLORS.HIGH} />
                          <Cell fill={COLORS.MODERATE} />
                          <Cell fill={COLORS.LOW} />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>{t('no_data')}</p>
                  )}
                </div>
              </div>

              {/* Vital Signs Chart */}
              <div style={{
                background: darkMode ? '#262641' : 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'background 0.3s'
              }}>
                <h3 style={{ color: darkMode ? '#fff' : '#1f2937', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>💓 {t('avg_vitals_vs_normal')}</h3>
                {vitalStats.some(v => v.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={vitalStats} margin={{ top: 20, right: 30, left: 0, bottom: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="value" fill={COLORS.primary} name={t('average_value')} />
                      <Bar dataKey="normal" fill={COLORS.secondary} name={t('normal_range')} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>{t('no_vitals')}</p>
                )}
              </div>

              {/* Refresh Button */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={fetchAnalyticsData}
                  disabled={chartsLoading}
                  style={{
                    padding: '12px 24px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: chartsLoading ? 'not-allowed' : 'pointer',
                    opacity: chartsLoading ? 0.6 : 1,
                    transition: 'all 0.3s'
                  }}
                >
                  {chartsLoading ? `⏳ ${t('refreshing')}` : `🔄 ${t('refresh_analytics')}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Register Tab */}
        {activeTab === 'register' && (
          <div style={{
            background: darkMode ? '#262641' : 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            maxWidth: '600px',
            transition: 'background 0.3s'
          }}>
            <h2 style={{ marginBottom: '8px', color: darkMode ? '#fff' : '#1f2937' }}>📝 {t('register_pregnant_mother')}</h2>
            <p style={{ color: darkMode ? '#9ca3af' : '#6b7280', marginBottom: '20px', fontSize: '14px' }}>{t('register_helptext')}</p>

            <form onSubmit={handleRegisterSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: darkMode ? '#e5e7eb' : '#374151' }}>{t('full_name')} *</label>
                  <input type="text" name="name" placeholder={t('full_name_placeholder')} value={registerForm.name} onChange={handleRegisterChange} required style={{ width: '100%', padding: '10px 12px', border: `1px solid ${darkMode ? '#404854' : '#d1d5db'}`, borderRadius: '6px', fontSize: '14px', background: darkMode ? '#1a1a2e' : '#fff', color: darkMode ? '#fff' : '#000' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>📱 {t('phone_number')} *</label>
                  <input type="tel" name="phone" placeholder="9876543210" value={registerForm.phone} onChange={handleRegisterChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>👤 {t('age_years')} *</label>
                  <input type="number" name="age" placeholder="28" value={registerForm.age} onChange={handleRegisterChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>⚖️ {t('bmi')} *</label>
                  <input type="number" name="bmi" placeholder="22.5" step="0.1" value={registerForm.bmi} onChange={handleRegisterChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>{t('gravida')}</label>
                  <select name="gravida" value={registerForm.gravida} onChange={handleRegisterChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
                    <option>Gravida 1</option>
                    <option>Gravida 2</option>
                    <option>Gravida 3</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>{t('parity')}</label>
                  <select name="parity" value={registerForm.parity} onChange={handleRegisterChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
                    <option>Parity 0</option>
                    <option>Parity 1</option>
                    <option>Parity 2</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>📍 {t('location')} *</label>
                <input type="text" name="location" placeholder="e.g., Dharavi, Mumbai" value={registerForm.location} onChange={handleRegisterChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>🌍 {t('preferred_language')}</label>
                  <select name="preferred_language" value={registerForm.preferred_language} onChange={handleRegisterChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
                    <option value="en">English</option>
                    <option value="mr">Marathi</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>💬 {t('telegram_chat_id')}</label>
                  <input type="text" name="telegram_chat_id" placeholder="Optional: Chat ID" value={registerForm.telegram_chat_id} onChange={handleRegisterChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? t('registering') : t('register_mother')}
              </button>
            </form>
          </div>
        )}

        {/* Risk Assessment Tab */}
        {activeTab === 'risk-assessment' && (
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            maxWidth: '600px'
          }}>
            <h2 style={{ marginBottom: '16px', color: '#1f2937' }}>⚕️ {t('risk_assessment')}</h2>

            <form onSubmit={handleAssessRisk}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>{t('select_mother')} *</label>
                <select name="mother_id" value={assessmentForm.mother_id} onChange={handleAssessmentChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
                  <option value="">{t('choose_mother')}</option>
                  {mothers.map(mother => (
                    <option key={mother.id} value={mother.id}>{mother.name} ({mother.phone})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>{t('systolic_bp')}</label>
                  <input type="number" name="systolic_bp" placeholder="120" value={assessmentForm.systolic_bp} onChange={handleAssessmentChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>{t('diastolic_bp')}</label>
                  <input type="number" name="diastolic_bp" placeholder="80" value={assessmentForm.diastolic_bp} onChange={handleAssessmentChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>{t('heart_rate')}</label>
                  <input type="number" name="heart_rate" placeholder="80" value={assessmentForm.heart_rate} onChange={handleAssessmentChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>{t('blood_glucose')}</label>
                  <input type="number" name="blood_glucose" placeholder="100" value={assessmentForm.blood_glucose} onChange={handleAssessmentChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#1f2937', marginBottom: '12px', fontWeight: '600' }}>{t('clinical_symptoms_optional')}</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  background: '#f9fafb',
                  padding: '12px',
                  borderRadius: '6px'
                }}>
                  {[
                    { key: 'proteinuria', label: t('proteinuria') },
                    { key: 'edema', label: t('edema') },
                    { key: 'headache', label: t('headache') },
                    { key: 'vision_changes', label: t('vision_changes') },
                    { key: 'epigastric_pain', label: t('epigastric_pain') },
                    { key: 'vaginal_bleeding', label: t('vaginal_bleeding') }
                  ].map(symptom => (
                    <label key={symptom.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={assessmentForm[symptom.key] === 1}
                        onChange={(e) => {
                          setAssessmentForm(prev => ({
                            ...prev,
                            [symptom.key]: e.target.checked ? 1 : 0
                          }))
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span>{symptom.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? t('assessing') : t('assess_risk')}
              </button>
            </form>

            {riskResult && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '6px',
                color: '#166534'
              }}>
                <h3 style={{ margin: '0 0 12px 0' }}>✅ {t('risk_assessment_result')}</h3>
                <p><strong>{t('risk_score')}:</strong> {(riskResult.risk_score * 100).toFixed(1)}%</p>
                <p><strong>{t('risk_level')}:</strong> {riskResult.risk_level}</p>
                <p><strong>{t('risk_factors')}:</strong> {riskResult.risk_factors?.join(', ') || t('none')}</p>
              </div>
            )}
          </div>
        )}

        {/* All Mothers Tab */}
        {activeTab === 'all-mothers' && (
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginBottom: '16px', color: '#1f2937' }}>👥 {t('all_registered_mothers')}</h2>
            {mothers.length === 0 ? (
              <p style={{ color: '#6b7280' }}>{t('no_mothers')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {mothers.map(mother => {
                  const isExpanded = expandedMother === mother.id
                  const latestRisk = mother.latestRisk
                  const assessments = mother.assessments || []
                  
                  const getRiskColor = (level) => {
                    if (level === 'HIGH') return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca', emoji: '🔴' }
                    if (level === 'MODERATE') return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d', emoji: '🟡' }
                    return { bg: '#dcfce7', color: '#166534', border: '#bbf7d0', emoji: '🟢' }
                  }
                  
                  const riskStyle = latestRisk ? getRiskColor(latestRisk.risk_level) : null
                  
                  return (
                    <div
                      key={mother.id}
                      style={{
                        border: isExpanded ? '2px solid #667eea' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#f9fafb',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div
                        onClick={() => setExpandedMother(isExpanded ? null : mother.id)}
                        style={{
                          padding: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: isExpanded ? '#f0f4f8' : '#f9fafb',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div>
                          <h3 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                            {mother.name}
                          </h3>
                          <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>
                            📱 {mother.phone} • 👤 Age: {mother.age} • 📍 {mother.location}
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {latestRisk ? (
                            <div style={{
                              padding: '8px 16px',
                              borderRadius: '20px',
                              background: riskStyle.bg,
                              color: riskStyle.color,
                              fontWeight: '600',
                              fontSize: '13px',
                              border: `2px solid ${riskStyle.border}`,
                              textAlign: 'center'
                            }}>
                              {riskStyle.emoji} {latestRisk.risk_level}
                              <div style={{ fontSize: '11px', fontWeight: '500', marginTop: '2px' }}>
                                Score: {(latestRisk.risk_score * 100).toFixed(0)}%
                              </div>
                            </div>
                          ) : (
                            <div style={{
                              padding: '8px 16px',
                              borderRadius: '20px',
                              background: '#e5e7eb',
                              color: '#6b7280',
                              fontWeight: '600',
                              fontSize: '13px'
                            }}>
                              No Assessment
                            </div>
                          )}
                          
                          <div style={{
                            fontSize: '20px',
                            transition: 'transform 0.2s ease',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}>
                            ▼
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{
                          padding: '16px',
                          borderTop: '1px solid #e5e7eb',
                          background: 'white'
                        }}>
                          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                          <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '14px', fontWeight: '600' }}>
                              📋 {t('complete_mother_details')}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
                              <div style={{ background: '#f3f4f6', padding: '10px', borderRadius: '6px' }}>
                                <div style={{ color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>{t('name')}</div>
                                <div style={{ color: '#1f2937' }}>{mother.name}</div>
                              </div>
                              <div style={{ background: '#f3f4f6', padding: '10px', borderRadius: '6px' }}>
                                <div style={{ color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>{t('phone')}</div>
                                <div style={{ color: '#1f2937' }}>{mother.phone}</div>
                              </div>
                              <div style={{ background: '#f3f4f6', padding: '10px', borderRadius: '6px' }}>
                                <div style={{ color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>{t('age')}</div>
                                <div style={{ color: '#1f2937' }}>{mother.age} years</div>
                              </div>
                              <div style={{ background: '#f3f4f6', padding: '10px', borderRadius: '6px' }}>
                                <div style={{ color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>{t('bmi')}</div>
                                <div style={{ color: '#1f2937' }}>{mother.bmi}</div>
                              </div>
                              <div style={{ background: '#f3f4f6', padding: '10px', borderRadius: '6px' }}>
                                <div style={{ color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>{t('gravida')}</div>
                                <div style={{ color: '#1f2937' }}>{mother.gravida}</div>
                              </div>
                              <div style={{ background: '#f3f4f6', padding: '10px', borderRadius: '6px' }}>
                                <div style={{ color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>{t('parity')}</div>
                                <div style={{ color: '#1f2937' }}>{mother.parity}</div>
                              </div>
                              <div style={{ background: '#f3f4f6', padding: '10px', borderRadius: '6px' }}>
                                <div style={{ color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>{t('location')}</div>
                                <div style={{ color: '#1f2937' }}>{mother.location}</div>
                              </div>
                              <div style={{ background: '#f3f4f6', padding: '10px', borderRadius: '6px' }}>
                                <div style={{ color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>{t('language')}</div>
                                <div style={{ color: '#1f2937' }}>{mother.preferred_language === 'en' ? 'English' : mother.preferred_language === 'mr' ? 'Marathi' : 'Hindi'}</div>
                              </div>
                            </div>
                          </div>

                          <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '14px', fontWeight: '600' }}>
                            📊 {t('assessment_history')} ({assessments.length})
                          </h4>
                          
                          {assessments.length === 0 ? (
                            <p style={{ color: '#6b7280', margin: '0', fontSize: '14px' }}>{t('no_assessments_recorded')}</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {assessments.map((assessment, idx) => {
                                const getRiskColorInner = (level) => {
                                  if (level === 'HIGH') return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca', emoji: '🔴' }
                                  if (level === 'MODERATE') return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d', emoji: '🟡' }
                                  return { bg: '#dcfce7', color: '#166534', border: '#bbf7d0', emoji: '🟢' }
                                }
                                const riskColorInner = getRiskColorInner(assessment.risk_level)
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      padding: '12px',
                                      background: riskColorInner.bg,
                                      border: `1px solid ${riskColorInner.border}`,
                                      borderRadius: '6px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start'
                                    }}
                                  >
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: '12px', color: riskColorInner.color, fontWeight: '600', marginBottom: '6px' }}>
                                        📅 {new Date(assessment.created_at).toLocaleDateString()} at {new Date(assessment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                      <div style={{ fontSize: '13px', color: riskColorInner.color, lineHeight: '1.6' }}>
                                        <div><strong>{t('bp')}:</strong> {assessment.systolic_bp}/{assessment.diastolic_bp} mmHg</div>
                                        <div><strong>{t('hr')}:</strong> {assessment.heart_rate} bpm</div>
                                        <div><strong>{t('glucose')}:</strong> {assessment.blood_glucose} mg/dL</div>
                                        <div><strong>{t('hemoglobin')}:</strong> {assessment.hemoglobin} g/dL</div>
                                      </div>
                                    </div>
                                    
                                    <div style={{
                                      padding: '8px 12px',
                                      borderRadius: '16px',
                                      background: 'rgba(255,255,255,0.6)',
                                      color: riskColorInner.color,
                                      fontWeight: '600',
                                      fontSize: '12px',
                                      textAlign: 'center',
                                      marginLeft: '12px',
                                      whiteSpace: 'nowrap',
                                      border: `1px solid ${riskColorInner.border}`
                                    }}>
                                      {riskColorInner.emoji} {assessment.risk_level}
                                      <div style={{ fontSize: '11px', fontWeight: '500' }}>
                                        {(assessment.risk_score * 100).toFixed(0)}%
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
