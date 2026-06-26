import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import { STATUSES, PROPERTY_TYPES, metaFor, propertyLabel, budgetLabel } from '../status.js'
import StatusBadge from '../components/StatusBadge.jsx'

const PAGE_SIZE = 10
const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10'

function NewLeadModal({ onClose, onCreated, isManager, users }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', property_type: 'apartment', configuration: '',
    budget_min: '', budget_max: '', preferred_location: '', source: '', status: 'new', assigned_to: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const payload = { ...form }
      if (!payload.email) delete payload.email
      payload.budget_min = payload.budget_min ? Number(payload.budget_min) : null
      payload.budget_max = payload.budget_max ? Number(payload.budget_max) : null
      payload.assigned_to = isManager && payload.assigned_to ? Number(payload.assigned_to) : null
      if (!isManager) delete payload.assigned_to
      const lead = await api.createLead(payload)
      onCreated(lead)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-semibold text-ink">New lead</h2>
        <p className="mt-0.5 text-sm text-slate-500">We'll map the preferred location automatically.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input required autoFocus value={form.name} onChange={set('name')} className={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-slate-700">Phone</label><input value={form.phone} onChange={set('phone')} className={field} /></div>
            <div><label className="text-sm font-medium text-slate-700">Email</label><input type="email" value={form.email} onChange={set('email')} className={field} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Property type</label>
              <select value={form.property_type} onChange={set('property_type')} className={field}>
                {PROPERTY_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div><label className="text-sm font-medium text-slate-700">Configuration</label><input value={form.configuration} onChange={set('configuration')} placeholder="2 BHK, Plot…" className={field} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-slate-700">Budget min (₹ lakhs)</label><input type="number" min="0" value={form.budget_min} onChange={set('budget_min')} className={field} /></div>
            <div><label className="text-sm font-medium text-slate-700">Budget max (₹ lakhs)</label><input type="number" min="0" value={form.budget_max} onChange={set('budget_max')} className={field} /></div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Preferred location</label>
            <input value={form.preferred_location} onChange={set('preferred_location')} placeholder="Whitefield, Bangalore" className={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-slate-700">Source</label><input value={form.source} onChange={set('source')} placeholder="walk-in, portal…" className={field} /></div>
            <div>
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select value={form.status} onChange={set('status')} className={field}>
                {STATUSES.map((s) => <option key={s} value={s}>{metaFor(s).label}</option>)}
              </select>
            </div>
          </div>
          {isManager && (
            <div>
              <label className="text-sm font-medium text-slate-700">Assign to agent</label>
              <select value={form.assigned_to} onChange={set('assigned_to')} className={field}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
              </select>
            </div>
          )}
          {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-lg bg-navy-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60">
              {busy ? 'Saving…' : 'Create lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Leads() {
  const { user } = useAuth()
  const isManager = ['manager', 'admin'].includes(user?.role)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [users, setUsers] = useState([])

  useEffect(() => { if (isManager) api.users().then(setUsers).catch(() => {}) }, [isManager])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.leads({ q, status, property_type: propertyType, page, page_size: PAGE_SIZE }))
    } finally { setLoading(false) }
  }, [q, status, propertyType, page])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Leads</h1>
          <p className="mt-1 text-sm text-slate-500">{data ? `${data.count} total` : 'Loading…'}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="rounded-lg bg-navy-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-navy-800">+ New lead</button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input value={q} onChange={(e) => { setPage(1); setQ(e.target.value) }} placeholder="Search name, phone, email, location…"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10" />
        <select value={propertyType} onChange={(e) => { setPage(1); setPropertyType(e.target.value) }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy-700">
          <option value="">All types</option>
          {PROPERTY_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy-700">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{metaFor(s).label}</option>)}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Property</th>
              <th className="hidden px-5 py-3 font-medium md:table-cell">Budget</th>
              <th className="hidden px-5 py-3 font-medium lg:table-cell">Location</th>
              {isManager && <th className="hidden px-5 py-3 font-medium lg:table-cell">Agent</th>}
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (!data || data.results.length === 0) && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">Loading…</td></tr>
            )}
            {data && !loading && data.results.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No leads match. Try a different filter or add a new lead.</td></tr>
            )}
            {data?.results.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50">
                <td className="px-5 py-3"><Link to={`/leads/${lead.id}`} className="font-medium text-ink hover:text-navy-700">{lead.name}</Link></td>
                <td className="hidden px-5 py-3 text-slate-600 sm:table-cell">
                  {propertyLabel(lead.property_type)}{lead.configuration ? ` · ${lead.configuration}` : ''}
                </td>
                <td className="hidden px-5 py-3 tabular-nums text-slate-600 md:table-cell">{budgetLabel(lead.budget_min, lead.budget_max)}</td>
                <td className="hidden px-5 py-3 text-slate-600 lg:table-cell">{lead.preferred_location || '—'}</td>
                {isManager && <td className="hidden px-5 py-3 text-slate-600 lg:table-cell">{lead.assigned_to_name || <span className="text-slate-400">Unassigned</span>}</td>}
                <td className="px-5 py-3"><StatusBadge status={lead.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.count > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {showModal && (
        <NewLeadModal isManager={isManager} users={users}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); setPage(1); setQ(''); setStatus(''); setPropertyType(''); load() }} />
      )}
    </div>
  )
}
