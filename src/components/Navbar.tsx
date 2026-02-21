import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../utils/cn'
import Button from './ui/Button'
import { getCurrentUser, logoutUser } from '../services/dataLayer'

const baseNavItems = [
  { to: '/', label: 'Home' },
  { to: '/templates', label: 'Templates' },
  { to: '/p/demo-public-id', label: 'Demo' },
]

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const currentUser = getCurrentUser()
  const navItems = currentUser
    ? [...baseNavItems, { to: '/my-tags', label: 'My Tags' }, { to: '/admin', label: 'Admin' }]
    : [...baseNavItems, { to: '/login', label: 'Login' }, { to: '/admin', label: 'Admin' }]

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-[color-mix(in_srgb,var(--theme-accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--theme-card)_88%,white)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold tracking-tight text-[var(--theme-text)]">
          Tap<span className="text-[var(--theme-accent)]">Link</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[color-mix(in_srgb,var(--theme-accent)_15%,white)] text-[var(--theme-accent)]'
                    : 'text-[var(--theme-muted)] hover:bg-[color-mix(in_srgb,var(--theme-accent)_10%,white)] hover:text-[var(--theme-text)]',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <Button variant="outline" className="hidden md:inline-flex" onClick={handleLogout}>
              Logout
            </Button>
          ) : null}
          <Button variant="outline" className="md:hidden" onClick={() => setOpen((value) => !value)}>
            Menu
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[color-mix(in_srgb,var(--theme-accent)_25%,transparent)] px-4 pb-4 pt-2 md:hidden">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block rounded-xl px-3 py-2 text-sm transition-all duration-200',
                    isActive
                      ? 'bg-[color-mix(in_srgb,var(--theme-accent)_15%,white)] text-[var(--theme-accent)]'
                      : 'text-[var(--theme-muted)] hover:bg-[color-mix(in_srgb,var(--theme-accent)_10%,white)]',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  handleLogout()
                }}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--theme-muted)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--theme-accent)_10%,white)]"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </nav>
  )
}

export default Navbar
