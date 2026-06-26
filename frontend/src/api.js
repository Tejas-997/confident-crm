const TOKEN_KEY = 'crm_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

async function request(path, { method = 'GET', body, form, auth = true } = {}) {
  const headers = {}
  const opts = { method, headers }
  if (form) {
    opts.body = form // URLSearchParams -> x-www-form-urlencoded
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  if (auth) {
    const t = getToken()
    if (t) headers['Authorization'] = `Bearer ${t}`
  }

  const res = await fetch(path, opts)
  if (res.status === 401) {
    clearToken()
    window.dispatchEvent(new Event('crm-unauth'))
    throw new Error('Your session expired. Please sign in again.')
  }
  if (!res.ok) {
    let detail
    try { detail = (await res.json())?.detail } catch { /* no body */ }
    throw new Error(typeof detail === 'string' ? detail : `Request failed (${res.status})`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  login(username, password) {
    const form = new URLSearchParams()
    form.set('username', username)
    form.set('password', password)
    return request('/api/auth/login', { method: 'POST', form, auth: false })
  },
  me: () => request('/api/auth/me'),
  dashboard: () => request('/api/dashboard'),
  leads: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    return request(`/api/leads?${new URLSearchParams(clean)}`)
  },
  lead: (id) => request(`/api/leads/${id}`),
  createLead: (data) => request('/api/leads', { method: 'POST', body: data }),
  updateLead: (id, data) => request(`/api/leads/${id}`, { method: 'PATCH', body: data }),
  setStatus: (id, status) => request(`/api/leads/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteLead: (id) => request(`/api/leads/${id}`, { method: 'DELETE' }),
  users: () => request('/api/users'),
  assign: (id, assigned_to) => request(`/api/leads/${id}/assign`, { method: 'PATCH', body: { assigned_to } }),
  notes: (id) => request(`/api/leads/${id}/notes`),
  addNote: (id, body) => request(`/api/leads/${id}/notes`, { method: 'POST', body: { body } }),
}
