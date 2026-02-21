import { FormEvent, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import {
  createScanEvent,
  getCurrentUser,
  getProfile,
  getTagMapping,
} from '../services/dataLayer'

const TagScan = () => {
  const { tagId } = useParams<{ tagId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [targetPublicId, setTargetPublicId] = useState('')
  const [profileName, setProfileName] = useState('')

  const [scannerName, setScannerName] = useState('')
  const [scannerEmail, setScannerEmail] = useState('')
  const [scannerPhone, setScannerPhone] = useState('')
  const [scannerNotes, setScannerNotes] = useState('')
  const [consentLocation, setConsentLocation] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState<'choice' | 'share'>('choice')

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setScannerName(currentUser.name)
      setScannerEmail(currentUser.email)
    }

    const mapping = getTagMapping(tagId || '')
    if (!mapping) {
      setError(true)
      setLoading(false)
      return
    }

    const profile = getProfile(mapping.publicId)
    if (!profile || profile.status !== 'active') {
      setError(true)
      setLoading(false)
      return
    }

    const data = profile.data as any
    const readableName =
      data.name || data.businessName || data.petName || data.restaurantName || 'TapLink profile'

    setTargetPublicId(mapping.publicId)
    setProfileName(readableName)
    setLoading(false)
  }, [tagId])

  const getLocation = async (): Promise<{ latitude?: number; longitude?: number; locationLabel?: string }> => {
    if (!consentLocation || !navigator.geolocation) {
      return {}
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = Number(position.coords.latitude.toFixed(6))
          const longitude = Number(position.coords.longitude.toFixed(6))
          resolve({
            latitude,
            longitude,
            locationLabel: `${latitude}, ${longitude}`,
          })
        },
        () => resolve({}),
        { timeout: 6000 },
      )
    })
  }

  const handleProceedWithoutSharing = () => {
    if (!tagId || !targetPublicId) {
      return
    }

    const currentUser = getCurrentUser()
    createScanEvent({
      profilePublicId: targetPublicId,
      tagId,
      scannerUserId: currentUser?.id,
      consentContact: false,
      consentLocation: false,
      userAgent: navigator.userAgent,
    })

    navigate(`/p/${targetPublicId}`)
  }

  const handleShareAndContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!tagId || !targetPublicId || submitting) {
      return
    }

    const currentUser = getCurrentUser()
    setSubmitting(true)
    const locationData = await getLocation()

    createScanEvent({
      profilePublicId: targetPublicId,
      tagId,
      scannerUserId: currentUser?.id,
      scannerName: scannerName || undefined,
      scannerEmail: scannerEmail || undefined,
      scannerPhone: scannerPhone || undefined,
      scannerNotes: scannerNotes || undefined,
      consentContact: true,
      consentLocation,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      locationLabel: locationData.locationLabel,
      userAgent: navigator.userAgent,
    })

    navigate(`/p/${targetPublicId}`)
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-10">
        <Card className="w-full text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full bg-[var(--theme-accent)]/25" />
          <h2 className="text-2xl font-semibold text-[var(--theme-text)]">Preparing Tag Activation...</h2>
          <p className="mt-2 text-sm text-[var(--theme-muted)]">Please wait while we validate this tag.</p>
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

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-10">
      <Card className="w-full">
        <h2 className="text-2xl font-semibold text-[var(--theme-text)]">Tag Ready</h2>
        <p className="mt-2 text-sm text-[var(--theme-muted)]">
          You are about to open <span className="font-semibold text-[var(--theme-text)]">{profileName}</span>.
        </p>

        {mode === 'choice' ? (
          <div className="mt-6 space-y-3">
            <Button className="w-full" onClick={() => setMode('share')}>
              Share Contact Details
            </Button>
            <Button variant="outline" className="w-full" onClick={handleProceedWithoutSharing}>
              Proceed to Profile
            </Button>
            <p className="text-xs text-[var(--theme-muted)]">
              Sharing contact details helps the tag owner follow up with you.
            </p>
          </div>
        ) : (
          <form className="mt-5 space-y-3" onSubmit={handleShareAndContinue}>
            <Input
              type="text"
              value={scannerName}
              onChange={(event) => setScannerName(event.target.value)}
              placeholder="Your name"
            />
            <Input
              type="email"
              value={scannerEmail}
              onChange={(event) => setScannerEmail(event.target.value)}
              placeholder="Your email"
            />
            <Input
              type="tel"
              value={scannerPhone}
              onChange={(event) => setScannerPhone(event.target.value)}
              placeholder="Your phone"
            />
            <Textarea
              value={scannerNotes}
              onChange={(event) => setScannerNotes(event.target.value)}
              rows={3}
              placeholder="Notes for the tag owner"
            />

            <label className="flex items-center gap-2 text-sm text-[var(--theme-muted)]">
              <input
                type="checkbox"
                checked={consentLocation}
                onChange={(event) => setConsentLocation(event.target.checked)}
              />
              I consent to share my approximate location
            </label>

            <div className="pt-2 flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Continuing...' : 'Submit & Continue'}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setMode('choice')}>
                Back
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

export default TagScan
