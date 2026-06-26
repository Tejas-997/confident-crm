import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import { STATUSES, metaFor, propertyLabel, budgetLabel } from '../status.js'
import StatusBadge from '../components/StatusBadge.jsx'
import LeadMap from '../components/LeadMap.jsx'

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm text-ink">{children || '—'}</div>
    </div>
  )
}

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isManager = ['manager', 'admin'].includes(user?.role)

  const [lead, setLead] = useState(null)
  const [notes, setNotes] = useState([])
  const [users, setUsers] = useState([])
  const [noteBody, setNoteBody] = useState('')
  const [error, setError] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const [addingNote, setAddingNote] = useState(false)

  const load = useCallback(async () => {
    try {
      const [l, n] = await Promise.all([api.lead(id), api.notes(id)])
      setLead(l); setNotes(n)
    } catch (e) { setError(e.message) }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (isManager) api.users().then(setUsers).catch(() => {}) }, [isManager])

  const changeStatus = async (status) => {
    if (status === lead.status) return
    setSavingStatus(true)
    try { setLead(await api.setStatus(id, status)) }
    catch (e) { setError(e.message) } finally { setSavingStatus(false) }
  }

  const changeAssignee = async (e) => {
    const val = e.target.value
    try { setLead(await api.assign(id, val ? Number(val) : null)) }
    catch (err) { setError(err.message) }
  }

  const addNote = async (e) => {
    e.preventDefault()
    if (!noteBody.trim()) return
    setAddingNote(true)
    try {
      const note = await api.addNote(id, noteBody.trim())
      setNotes([note, ...notes]); setNoteBody('')
    } catch (e) { setError(e.message) } finally { setAddingNote(false) }
  }

  const remove = async () => {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    try { await api.deleteLead(id); navigate('/leads', { replace: true }) }
    catch (e) { setError(e.message) }
  }

  if (error && !lead) return <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
  if (!lead) return <div className="text-sm text-slate-400">Loading…</div>
  const fmt = (s) => new Date(s).toLocaleString()

  return (
    <div>
      <Link to="/leads" className="text-sm text-slate-500 hover:text-navy-700">← Back to leads</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{lead.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{propertyLabel(lead.property_type)}{lead.configuration ? ` · ${lead.configuration}` : ''}</span>
            <span>·</span>
            <StatusBadge status={lead.status} />
          </div>
        </div>
        {isManager && (
          <button onClick={remove} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">Delete</button>
        )}
      </div>

      {error && <div className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {/* Status changer */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Move stage</div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {STATUSES.map((s) => {
              const m = metaFor(s)
              const active = s === lead.status
              return (
                <button key={s} disabled={savingStatus} onClick={() => changeStatus(s)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset transition ${
                    active ? m.badge : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50'} disabled:opacity-50`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />{m.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Assignment */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Assigned agent</div>
          {isManager ? (
            <select value={lead.assigned_to_id || ''} onChange={changeAssignee}
              className="mt-2.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy-700">
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
            </select>
          ) : (
            <div className="mt-2.5 text-sm text-ink">{lead.assigned_to_name || 'Unassigned'}</div>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {/* Requirement */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-display text-base font-semibold text-ink">Requirement</h2>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <Field label="Property type">{propertyLabel(lead.property_type)}</Field>
            <Field label="Configuration">{lead.configuration}</Field>
            <Field label="Budget">{budgetLabel(lead.budget_min, lead.budget_max)}</Field>
            <Field label="Location">{lead.preferred_location}</Field>
            <Field label="Phone">{lead.phone}</Field>
            <Field label="Email">{lead.email}</Field>
            <Field label="Source">{lead.source}</Field>
            <Field label="Created">{fmt(lead.created_at)}</Field>
          </div>
        </div>

        {/* Map */}
        <div>
          <h2 className="mb-3 font-display text-base font-semibold text-ink">Preferred location</h2>
          <LeadMap geo={lead.location_geo} />
        </div>
      </div>

      {/* Notes */}
      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-display text-base font-semibold text-ink">Notes</h2>
        <form onSubmit={addNote} className="mt-3 flex gap-2">
          <input value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Add a note…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy-700 focus:ring-2 focus:ring-navy-700/10" />
          <button disabled={addingNote || !noteBody.trim()} className="rounded-lg bg-navy-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50">Add</button>
        </form>
        <ul className="mt-4 space-y-3">
          {notes.length === 0 && <li className="text-sm text-slate-400">No notes yet.</li>}
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-slate-50 px-3 py-2.5">
              <div className="text-sm text-ink">{n.body}</div>
              <div className="mt-1 text-xs text-slate-400">{n.author_name || 'Someone'} · {fmt(n.created_at)}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
