import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(username, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-navy-900 p-12 lg:flex">
        <div className="font-display text-xl font-bold tracking-tight text-white">
          Confident<span className="text-emerald-400"> CRM</span>
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight text-white">
            Close more<br />property deals.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            Assign leads to agents, track site visits, and move every enquiry to booked.
          </p>
          <div className="mt-8 flex gap-1.5">
            {['bg-slate-400', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500'].map((c, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${c}`} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] uppercase tracking-wide text-slate-500">
            <span>New</span><span>Contacted</span><span>Site visit</span><span>Negotiation</span><span>Booked</span>
          </div>
        </div>
        <div className="text-xs text-slate-500">Role-based access · Django · FastAPI · PostgreSQL</div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="font-display text-xl font-bold text-ink">Confident<span className="text-emerald-500"> CRM</span></div>
          </div>
          <h2 className="font-display text-2xl font-semibold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Welcome back. Enter your credentials to continue.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-navy-900 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-500">
            <div className="mb-1.5 font-medium text-slate-600">Demo accounts</div>
            <div className="grid grid-cols-1 gap-1">
              <div><span className="font-medium text-slate-600">rohit.manager</span> / manager123 — Sales Manager (sees all)</div>
              <div><span className="font-medium text-slate-600">aisha.agent</span> / agent123 — Sales Agent (own leads)</div>
              <div><span className="font-medium text-slate-600">admin</span> / admin12345 — Admin</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
