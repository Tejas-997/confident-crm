import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

const ROLE_LABEL = { admin: 'Admin', manager: 'Sales Manager', agent: 'Sales Agent' }

function NavItem({ to, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isManager = ['manager', 'admin'].includes(user?.role)

  const onLogout = () => { logout(); navigate('/login', { replace: true }) }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col bg-navy-900 px-4 py-6 sm:flex">
        <div className="px-2">
          <div className="font-display text-lg font-bold tracking-tight text-white">Confident<span className="text-emerald-400"> CRM</span></div>
          <div className="mt-0.5 text-xs text-slate-400">Real-estate sales</div>
        </div>
        <nav className="mt-8 space-y-1">
          <NavItem to="/" label="Dashboard" end />
          <NavItem to="/leads" label="Leads" />
          <NavItem to="/pipeline" label="Pipeline board" />
          {isManager && <NavItem to="/team" label="Team" />}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="px-2 text-sm font-medium text-white">{user?.username}</div>
          <div className="mt-1 px-2">
            <span className="inline-flex rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
              {ROLE_LABEL[user?.role] || 'User'}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="mt-3 w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between bg-navy-900 px-4 py-3 sm:hidden">
          <div className="font-display font-bold text-white">Confident<span className="text-emerald-400"> CRM</span></div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'text-white' : ''}>Home</NavLink>
            <NavLink to="/leads" className={({ isActive }) => isActive ? 'text-white' : ''}>Leads</NavLink>
            <NavLink to="/pipeline" className={({ isActive }) => isActive ? 'text-white' : ''}>Board</NavLink>
            <button onClick={onLogout} className="text-slate-400">Out</button>
          </div>
        </header>
        <main className="flex-1 px-5 py-7 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
