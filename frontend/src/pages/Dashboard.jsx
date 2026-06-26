import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { STATUSES, metaFor, propertyLabel } from '../status.js'
import StatusBadge from '../components/StatusBadge.jsx'

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold tabular-nums text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-400">{hint}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { api.dashboard().then(setData).catch((e) => setError(e.message)) }, [])

  if (error) return <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
  if (!data) return <div className="text-sm text-slate-400">Loading dashboard…</div>

  const { total_leads, by_status, booked_rate, created_last_7_days, scope } = data
  const open = total_leads - (by_status.booked || 0) - (by_status.lost || 0)
  const maxCount = Math.max(1, ...STATUSES.map((s) => by_status[s] || 0))

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            {scope === 'mine' ? 'Your assigned leads.' : 'All leads across the team.'}
          </p>
        </div>
        <Link to="/pipeline" className="rounded-lg bg-navy-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-navy-800">
          Open pipeline board
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total leads" value={total_leads} />
        <Stat label="Active" value={open} hint="in pipeline" />
        <Stat label="Booked rate" value={`${booked_rate}%`} hint={`${by_status.booked || 0} booked`} />
        <Stat label="New this week" value={created_last_7_days} hint="last 7 days" />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-display text-base font-semibold text-ink">Pipeline distribution</h2>
        <p className="mt-0.5 text-sm text-slate-500">Leads in each stage.</p>
        <div className="mt-4 space-y-3">
          {STATUSES.map((s) => {
            const count = by_status[s] || 0
            const m = metaFor(s)
            return (
              <div key={s} className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-sm text-slate-600">{m.label}</div>
                <div className="h-6 flex-1 overflow-hidden rounded-md bg-slate-100">
                  <div className={`h-full rounded-md ${m.bar} transition-all`}
                    style={{ width: `${Math.max(count ? 6 : 0, (count / maxCount) * 100)}%` }} />
                </div>
                <div className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-ink">{count}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 className="font-display text-base font-semibold text-ink">Recent leads</h2>
          <Link to="/leads" className="text-sm font-medium text-navy-700 hover:underline">See all</Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {data.recent.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-slate-400">No leads yet.</li>
          )}
          {data.recent.map((lead) => (
            <li key={lead.id}>
              <Link to={`/leads/${lead.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{lead.name}</div>
                  <div className="truncate text-xs text-slate-500">
                    {propertyLabel(lead.property_type)}{lead.configuration ? ` · ${lead.configuration}` : ''}{lead.preferred_location ? ` · ${lead.preferred_location}` : ''}
                  </div>
                </div>
                <StatusBadge status={lead.status} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
