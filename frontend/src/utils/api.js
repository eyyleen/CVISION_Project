import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

// ─── Candidates ───────────────────────────────────────────────────────────────

export const uploadCV = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
  return res.data
}

export const getCandidates = async (skip = 0, limit = 100) => {
  const res = await api.get('/candidates', { params: { skip, limit } })
  return res.data
}

export const getCandidate = async (id) => {
  const res = await api.get(`/candidates/${id}`)
  return res.data
}

export const updateCandidate = async (id, data) => {
  const res = await api.patch(`/candidates/${id}`, data)
  return res.data
}

export const deleteCandidate = async (id) => {
  const res = await api.delete(`/candidates/${id}`)
  return res.data
}

export const searchCandidates = async (searchData) => {
  const res = await api.post('/candidates/search', searchData)
  return res.data
}

export const quickSearch = async (q) => {
  const res = await api.get('/search', { params: { q } })
  return res.data
}

// ─── Job Matching ─────────────────────────────────────────────────────────────

export const matchJob = async (data) => {
  const res = await api.post('/job-match', data)
  return res.data
}

export const getCandidateMatches = async (candidateId) => {
  const res = await api.get(`/candidates/${candidateId}/matches`)
  return res.data
}

export const getAllJobMatches = async (skip = 0, limit = 50) => {
  const res = await api.get('/job-matches', { params: { skip, limit } })
  return res.data
}

// ─── Skills Analysis ──────────────────────────────────────────────────────────

export const analyzeSkills = async (candidateId) => {
  const res = await api.get(`/candidates/${candidateId}/skills-analysis`)
  return res.data
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const res = await api.get('/dashboard/stats')
  return res.data
}

// ─── Health ───────────────────────────────────────────────────────────────────

export const healthCheck = async () => {
  const res = await api.get('/health')
  return res.data
}

export default api
