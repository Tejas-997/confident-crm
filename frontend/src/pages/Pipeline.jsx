import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { log } from '../logger.js'
import { toast } from '../toast.js'
import { BOARD, metaFor, propertyLabel, budgetLabel } from '../status.js'

export default function Pipeline() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.leads({ page: 1, page_size: 100 })
      setLeads(data.results); log.success('Pipeline loaded', data.results.length)
    } catch (e) {
      log.error('Pipeline load failed', e); toast(e.message, 'error')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const onDrop = async (status) => {
    setOverCol(null)
    const id = dragId
    setDragId(null)
    if (!id) return
    const lead = leads.find((l) => l.id === id)
    if (!lead || lead.status === status) return
    const prev = lead.status
    // optimistic move
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)))
    try {
      await api.setStatus(id, status)
      log.success('Lead moved', { id, status })
      toast(`Moved to ${metaFor(status).label}`)
    } catch (e) {
      log.error('Move failed', e); toast(e.message, 'error')
      setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: prev } : l)))
    }
  }

  return (
    <div>
      <div className="animate-rise flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Pipeline board</h1>
          <p className="mt-1 text-sm text-slate-500">Drag a lead between stages to update its status.</p>
        </div>
      </div>

      {loading && <div className="mt-6 text-sm text-slate-400">Loading board…</div>}

      <div className="mt-5 flex gap-4 overflow-x-auto pb-4">
        {BOARD.map((status, i) => {
          const m = metaFor(status)
          const items = leads.filter((l) => l.status === status)
          const isOver = overCol === status
          return (
            <div
              key={status}
              onDragOver={(e) => { e.preventDefault(); setOverCol(status) }}
              onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
              onDrop={() => onDrop(status)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`animate-rise flex w-72 shrink-0 flex-col rounded-xl border-t-4 ${m.colTop} bg-slate-50/70 transition-colors ${
                isOver ? 'bg-navy-900/5 ring-2 ring-navy-700/20' : ''
              }`}
            >
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${m.dot}`} />
                  <span className="text-sm font-semibold text-ink">{m.label}</span>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-slate-500 ring-1 ring-inset ring-slate-200">{items.length}</span>
              </div>
              <div className="flex-1 space-y-2 px-2 pb-3">
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">Drop leads here</div>
                )}
                {items.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDragId(lead.id)}
                    onDragEnd={() => { setDragId(null); setOverCol(null) }}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className={`cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing ${
                      dragId === lead.id ? 'scale-[.98] opacity-50' : 'hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-ink">{lead.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {propertyLabel(lead.property_type)}{lead.configuration ? ` · ${lead.configuration}` : ''}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-medium tabular-nums text-slate-600">{budgetLabel(lead.budget_min, lead.budget_max)}</span>
                      {lead.assigned_to_name && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">{lead.assigned_to_name.split('.')[0]}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}