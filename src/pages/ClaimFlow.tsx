import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getCurrentUser, validateClaimCode } from '../services/dataLayer'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const ClaimFlow = () => {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/login', { state: { next: `/claim/${code || ''}` } })
      return
    }

    if (code) {
      const valid = validateClaimCode(code)
      setIsValid(valid)
      setIsValidating(false)
    }
  }, [code, navigate])

  if (isValidating) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-10">
        <Card className="w-full text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[color-mix(in_srgb,var(--theme-accent)_22%,transparent)] border-t-[var(--theme-accent)]" />
          <p className="text-sm text-[var(--theme-muted)]">Validating claim code...</p>
        </Card>
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-10">
        <Card className="w-full text-center">
          <h2 className="text-2xl font-semibold text-[var(--theme-text)]">Invalid Claim Code</h2>
          <p className="mt-3 text-sm text-[var(--theme-muted)]">
            The claim code "{code}" is not valid. Please check and try again.
          </p>
          <Link to="/" className="mt-6 inline-block">
            <Button>Back to Home</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-10">
      <Card className="w-full text-center">
        <h2 className="text-2xl font-semibold text-[var(--theme-text)]">Claim Code Valid</h2>
        <p className="mt-3 text-sm text-[var(--theme-muted)]">
          Your code "{code}" is valid. Continue to choose a template and build your profile.
        </p>
        <Link to="/templates" className="mt-6 inline-block">
          <Button>Continue</Button>
        </Link>
      </Card>
    </div>
  )
}

export default ClaimFlow
