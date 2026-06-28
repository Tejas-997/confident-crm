import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { log } from '../logger.js'
import { toast } from '../toast.js'

const ROLE_BADGE = {
  admin: 'bg-violet-50 text-violet-700 ring-violet-200',
  manager: 'bg-blue-50 text-blue-700 ring-blue-200',
  agent: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

export default function Team() {
  const [users, setUsers] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.users()
      .then((u) => { setUsers(u); log.success('Team loaded', u.length) })
      .catch((e) => { setError(e.message); log.error('Team load failed', e); toast(e.message, 'error') })
  }, [])

  return (
    <div>
      <div className="animate-rise flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Team</h1>
          <p className="mt-1 text-sm text-slate-500">Agents and managers who can be assigned leads.</p>
        </div>
        <a href="/django/admin/auth/user/add/" target="_blank" rel="noreferrer"
          className="rounded-lg bg-navy-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-800 hover:shadow">+ Add user</a>
      </div>

      {error && <div className="animate-fade mt-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      <div className="animate-rise mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white" style={{ animationDelay: '60ms' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!users && <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400">Loading…</td></tr>}
            {users?.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-ink">{u.username}</td>
                <td className="px-5 py-3 text-slate-600">{u.email || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_BADGE[u.role] || ROLE_BADGE.agent}`}>{u.role}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">New users default to Sales Agent. Change a user's role under Profiles in the admin.</p>
    </div>
  )
}