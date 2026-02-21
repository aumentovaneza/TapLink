import { FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { getCurrentUser, loginUser, registerUser } from '../services/dataLayer'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const nextPath = (location.state as { next?: string } | undefined)?.next || '/my-tags'

  useEffect(() => {
    if (getCurrentUser()) {
      navigate(nextPath)
    }
  }, [navigate, nextPath])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const result =
      mode === 'login'
        ? loginUser(email, password)
        : registerUser(name, email, password)

    if (result.error || !result.user) {
      setError(result.error || 'Unable to authenticate')
      return
    }

    navigate(nextPath)
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4 py-10">
      <Card className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--theme-text)]">{mode === 'login' ? 'Login' : 'Create account'}</h1>
        <p className="mt-1 text-sm text-[var(--theme-muted)]">
          {mode === 'login'
            ? 'Sign in to manage your tags and profiles.'
            : 'Create an account to own and edit your TapLink tags.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {mode === 'register' ? (
            <Input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          ) : null}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error ? <p className="text-sm text-rose-500">{error}</p> : null}

          <Button type="submit" className="w-full">
            {mode === 'login' ? 'Login' : 'Create Account'}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((value) => (value === 'login' ? 'register' : 'login'))
            setError('')
          }}
          className="mt-4 text-sm font-medium text-[var(--theme-accent)]"
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>

        <div className="mt-4 text-sm text-[var(--theme-muted)]">
          <Link to="/" className="hover:text-[var(--theme-text)]">Back to home</Link>
        </div>
      </Card>
    </div>
  )
}

export default Login
