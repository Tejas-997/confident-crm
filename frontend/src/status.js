// Real-estate pipeline. Status color language defined once, reused everywhere
// (badges, filters, dashboard bars, Kanban columns). Full class strings so
// Tailwind's purge keeps them.

export const STATUSES = ['new', 'contacted', 'site_visit', 'negotiation', 'booked', 'lost']

export const STATUS_META = {
  new:         { label: 'New',         dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-700 ring-slate-200',      bar: 'bg-slate-400',   colTop: 'border-t-slate-400' },
  contacted:   { label: 'Contacted',   dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 ring-blue-200',          bar: 'bg-blue-500',    colTop: 'border-t-blue-400' },
  site_visit:  { label: 'Site visit',  dot: 'bg-violet-400',  badge: 'bg-violet-50 text-violet-700 ring-violet-200',    bar: 'bg-violet-500',  colTop: 'border-t-violet-400' },
  negotiation: { label: 'Negotiation', dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-800 ring-amber-200',       bar: 'bg-amber-500',   colTop: 'border-t-amber-400' },
  booked:      { label: 'Booked',      dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-500', colTop: 'border-t-emerald-400' },
  lost:        { label: 'Lost',        dot: 'bg-rose-400',    badge: 'bg-rose-50 text-rose-700 ring-rose-200',          bar: 'bg-rose-500',    colTop: 'border-t-rose-400' },
}

// Columns shown on the Kanban board (advancing pipeline + lost at the end).
export const BOARD = ['new', 'contacted', 'site_visit', 'negotiation', 'booked', 'lost']

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'plot', label: 'Plot' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'other', label: 'Other' },
]

export const metaFor = (s) => STATUS_META[s] || STATUS_META.new
export const propertyLabel = (v) => PROPERTY_TYPES.find((p) => p.value === v)?.label || '—'

// Budgets are stored in INR lakhs.
function one(v) {
  if (v >= 100) {
    const cr = v / 100
    return `₹${Number.isInteger(cr) ? cr : cr.toFixed(2).replace(/\.?0+$/, '')} Cr`
  }
  return `₹${v} L`
}
export function budgetLabel(min, max) {
  if (min == null && max == null) return '—'
  if (min != null && max != null) return `${one(min)} – ${one(max)}`
  return one(min ?? max)
}
