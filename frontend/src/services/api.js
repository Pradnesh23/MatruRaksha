// FILE: frontend/src/services/api.js
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Error handling interceptor
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message)
    console.error('Status:', error.response?.status)
    return Promise.reject(error)
  }
)

// ==================== MOTHER API ====================
export const motherAPI = {
  // Register a new mother
  register: async (data) => {
    try {
      // Ensure proper data types
      const payload = {
        name: String(data.name).trim(),
        phone: String(data.phone).trim(),
        age: parseInt(data.age, 10),
        gravida: parseInt(data.gravida, 10),
        parity: parseInt(data.parity, 10),
        bmi: parseFloat(data.bmi),
        location: String(data.location).trim(),
        preferred_language: String(data.preferred_language).trim() || 'en',
        telegram_chat_id: data.telegram_chat_id ? String(data.telegram_chat_id).trim() : null
      }
      
      console.log('Registering mother with payload:', payload)
      const response = await api.post('/mothers/register', payload)
      return response
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message)
      throw error
    }
  },

  // Get all mothers
  getAll: async () => {
    try {
      const response = await api.get('/mothers')
      return response
    } catch (error) {
      console.error('Get mothers error:', error.response?.data || error.message)
      throw error
    }
  },

  // Get mother by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/mothers/${id}`)
      return response
    } catch (error) {
      console.error('Get mother error:', error.response?.data || error.message)
      throw error
    }
  }
}

export const authAPI = {
  createRegisterRequest: async (payload) => {
    const res = await api.post('/auth/register-request', payload)
    return res
  },
  uploadCertification: async (email, file) => {
    const form = new FormData()
    form.append('email', email)
    form.append('file', file)
    const res = await api.post('/auth/upload-cert', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res
  },
  listRegisterRequests: async () => {
    const res = await api.get('/auth/register-requests')
    return res
  },
  decideRegisterRequest: async (id, approved, note) => {
    const res = await api.post(`/auth/register-requests/${id}/decision`, { approved, note })
    return res
  }
}

export { api }

// ==================== RISK ASSESSMENT API ====================
export const riskAPI = {
  // Assess risk for a mother
  assess: async (data) => {
    try {
      // Ensure proper data types
      const payload = {
        mother_id: String(data.mother_id).trim(),
        systolic_bp: data.systolic_bp ? parseInt(data.systolic_bp, 10) : null,
        diastolic_bp: data.diastolic_bp ? parseInt(data.diastolic_bp, 10) : null,
        heart_rate: data.heart_rate ? parseInt(data.heart_rate, 10) : null,
        blood_glucose: data.blood_glucose ? parseFloat(data.blood_glucose) : null,
        hemoglobin: data.hemoglobin ? parseFloat(data.hemoglobin) : null,
        proteinuria: parseInt(data.proteinuria, 10) || 0,
        edema: parseInt(data.edema, 10) || 0,
        headache: parseInt(data.headache, 10) || 0,
        vision_changes: parseInt(data.vision_changes, 10) || 0,
        epigastric_pain: parseInt(data.epigastric_pain, 10) || 0,
        vaginal_bleeding: parseInt(data.vaginal_bleeding, 10) || 0,
        notes: data.notes ? String(data.notes).trim() : null
      }

      console.log('Assessing risk with payload:', payload)
      const response = await api.post('/risk/assess', payload)
      return response
    } catch (error) {
      console.error('Risk assessment error:', error.response?.data || error.message)
      throw error
    }
  },

  // Get all risk assessments
  getAll: async () => {
    try {
      const response = await api.get('/risk/all')
      return response
    } catch (error) {
      console.error('Get assessments error:', error.response?.data || error.message)
      throw error
    }
  },

  // Get risk for specific mother
  getByMotherId: async (motherId) => {
    try {
      const response = await api.get(`/risk/mother/${motherId}`)
      return response
    } catch (error) {
      console.error('Get risk error:', error.response?.data || error.message)
      throw error
    }
  }
}

// ==================== ANALYTICS API ====================
export const analyticsAPI = {
  // Get dashboard analytics
  getDashboard: async () => {
    try {
      const response = await api.get('/analytics/dashboard')
      return response
    } catch (error) {
      console.error('Analytics error:', error.response?.data || error.message)
      throw error
    }
  },

  // Get risk distribution
  getRiskDistribution: async () => {
    try {
      const response = await api.get('/analytics/risk-distribution')
      return response
    } catch (error) {
      console.error('Risk distribution error:', error.response?.data || error.message)
      throw error
    }
  }
}

// ==================== APPOINTMENT API ====================
export const appointmentAPI = {
  // Create appointment
  create: async (data) => {
    try {
      const payload = {
        mother_id: String(data.mother_id).trim(),
        facility: String(data.facility).trim(),
        appointment_date: String(data.appointment_date).trim(),
        appointment_time: String(data.appointment_time).trim(),
        purpose: data.purpose ? String(data.purpose).trim() : null,
        notes: data.notes ? String(data.notes).trim() : null
      }

      const response = await api.post('/appointments/create', payload)
      return response
    } catch (error) {
      console.error('Create appointment error:', error.response?.data || error.message)
      throw error
    }
  }
}

// ==================== VISIT API ====================
export const visitAPI = {
  // Record visit
  record: async (data) => {
    try {
      const payload = {
        mother_id: String(data.mother_id).trim(),
        visit_date: data.visit_date || new Date().toISOString(),
        systolic_bp: data.systolic_bp ? parseInt(data.systolic_bp, 10) : null,
        diastolic_bp: data.diastolic_bp ? parseInt(data.diastolic_bp, 10) : null,
        heart_rate: data.heart_rate ? parseInt(data.heart_rate, 10) : null,
        blood_glucose: data.blood_glucose ? parseFloat(data.blood_glucose) : null,
        hemoglobin: data.hemoglobin ? parseFloat(data.hemoglobin) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        notes: data.notes ? String(data.notes).trim() : null
      }

      const response = await api.post('/visits/record', payload)
      return response
    } catch (error) {
      console.error('Record visit error:', error.response?.data || error.message)
      throw error
    }
  }
}

export async function queryAgent({ motherId, query, useContext = true, language = 'en' }) {
  try {
    const payload = {
      mother_id: motherId,
      query,
      use_context: useContext,
      language,
    };
    const { data } = await api.post('/api/v1/agent/query', payload);
    return data;
  } catch (error) {
    console.error('Error querying agent:', error);
    throw error;
  }
}
export default api
