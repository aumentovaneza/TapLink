import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTagMapping, getProfile } from '../services/dataLayer'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const TagScan = () => {
  const { tagId } = useParams<{ tagId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const simulateScan = async () => {
      if (tagId === 'demo-tag-id') {
        setTimeout(() => {
          navigate('/p/demo-public-id')
        }, 800)
        return
      }

      const mapping = getTagMapping(tagId || '')

      if (mapping) {
        const profile = getProfile(mapping.publicId)
        if (profile && profile.status === 'active') {
          setTimeout(() => {
            navigate(`/p/${mapping.publicId}`)
          }, 800)
        } else {
          setError(true)
          setLoading(false)
        }
      } else {
        setError(true)
        setLoading(false)
      }
    }

    if (tagId) {
      simulateScan()
    }
  }, [tagId, navigate])

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-10">
        <Card className="w-full text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full bg-[var(--theme-accent)]/25" />
          <h2 className="text-2xl font-semibold text-[var(--theme-text)]">Opening TapLink...</h2>
          <p className="mt-2 text-sm text-[var(--theme-muted)]">Please wait while we load your profile.</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-10">
        <Card className="w-full text-center">
          <h2 className="text-2xl font-semibold text-[var(--theme-text)]">Unassigned Tag</h2>
          <p className="mt-2 text-sm text-[var(--theme-muted)]">
            This NFC tag has not been assigned to an active TapLink profile yet.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate('/')}>Create Your Profile</Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return null
}

export default TagScan
