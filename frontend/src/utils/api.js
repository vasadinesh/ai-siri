import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 35000 })
api.interceptors.response.use(r => r, err => Promise.reject(new Error(err.response?.data?.error || err.message || 'Network error')))

// Health-check — verifies backend is up and GROQ_API_KEY is set server-side
export const pingBackend    = ()      => api.get('/health')
export const getRoles       = ()      => api.get('/roles')
export const createSession  = (d)     => api.post('/sessions', d)
export const generateQ      = (d)     => api.post('/question', d)
export const gradeAnswer    = (d)     => api.post('/grade', d)
export const transcribeAudio = (blob, mimeType) => {
  const fd = new FormData()
  fd.append('audio', blob, `rec.${mimeType.includes('webm') ? 'webm' : 'wav'}`)
  // No api_key sent — backend reads it from .env
  return api.post('/transcribe', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 45000 })
}
export const completeSession = (token, duration_seconds) =>
  api.patch(`/sessions/${token}/complete`, { duration_seconds })
export const getHistory      = (token) => api.get(`/sessions/${token}/history`)
export const getLeaderboard  = (params) => api.get('/leaderboard', { params })
export const getStats        = ()      => api.get('/leaderboard/stats')
export default api

export const getEncouragement  = (d) => api.post('/encourage', d)
export const getClosingSummary = (d) => api.post('/closing-summary', d)
