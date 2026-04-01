import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 mins for training
})

// Attach token from localStorage on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('fde_token')
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`
  return cfg
})

// Global error handler
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fde_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: data => api.post('/auth/register', data),
  login:    data => api.post('/auth/login', data),
}

// ─── Datasets ─────────────────────────────────────────────────────────────────
export const datasetsApi = {
  upload:  file => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/datasets/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  list:    ()         => api.get('/datasets/'),
  preview: datasetId  => api.get(`/datasets/${datasetId}/preview`),
}

// ─── Models ───────────────────────────────────────────────────────────────────
export const modelsApi = {
  train:   data       => api.post('/models/train', data),
  list:    ()         => api.get('/models/'),
  active:  ()         => api.get('/models/active'),
  metrics: modelId    => api.get(`/models/${modelId}/metrics`),
}

// ─── Predictions ──────────────────────────────────────────────────────────────
export const predictionsApi = {
  predict:    data  => api.post('/predictions/predict', data),
  history:    ()    => api.get('/predictions/history'),
  analytics:  ()    => api.get('/predictions/analytics'),
}

export default api
