import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-[color-mix(in_srgb,var(--theme-accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--theme-card)_75%,white)]/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--theme-muted)]">
          <Link to="/" className="transition-all duration-200 hover:text-[var(--theme-accent)]">Home</Link>
          <Link to="/templates" className="transition-all duration-200 hover:text-[var(--theme-accent)]">Templates</Link>
          <Link to="/p/demo-public-id" className="transition-all duration-200 hover:text-[var(--theme-accent)]">Demo</Link>
          <Link to="/admin" className="transition-all duration-200 hover:text-[var(--theme-accent)]">Admin</Link>
        </div>
        <p className="text-sm text-[var(--theme-muted)]">Private by link, fast to share, simple to manage.</p>
      </div>
    </footer>
  )
}

export default Footer
