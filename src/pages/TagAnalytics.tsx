import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { getCurrentUser, getProfileForOwner, getScanEventsByProfile } from '../services/dataLayer'
import { Profile, ScanEvent } from '../types'

const TagAnalytics = () => {
  const { publicId } = useParams<{ publicId: string }>()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<ScanEvent[]>([])

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/login', { state: { next: `/my-tags/${publicId}/analytics` } })
      return
    }

    if (!publicId) {
      navigate('/my-tags')
      return
    }

    const ownedProfile = getProfileForOwner(publicId, currentUser.id)
    if (!ownedProfile) {
      navigate('/my-tags')
      return
    }

    setProfile(ownedProfile)
    setEvents(getScanEventsByProfile(ownedProfile.publicId))
  }, [navigate, publicId])

  const metrics = useMemo(() => {
    const totalScans = events.length
    const contactShared = events.filter((event) => event.consentContact).length
    const locationShared = events.filter((event) => event.consentLocation && event.locationLabel).length

    return {
      totalScans,
      contactShared,
      locationShared,
      contactRate: totalScans ? Math.round((contactShared / totalScans) * 100) : 0,
      locationRate: totalScans ? Math.round((locationShared / totalScans) * 100) : 0,
    }
  }, [events])

  if (!profile) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4 py-10">
        <Card className="w-full text-center">
          <p className="text-sm text-[var(--theme-muted)]">Loading tag analytics...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link to="/my-tags">
          <Button variant="outline">Back to My Tags</Button>
        </Link>
        <Link to={`/t/${profile.tagId}`}>
          <Button variant="secondary">Simulate Scan</Button>
        </Link>
        <Link to={`/p/${profile.publicId}`}>
          <Button variant="outline">Open Public Page</Button>
        </Link>
      </div>

      <Card className="mb-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--theme-accent)]">Tag Analytics</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--theme-text)]">{profile.publicId}</h1>
            <p className="mt-1 text-sm text-[var(--theme-muted)]">Tag ID: {profile.tagId}</p>
          </div>
          <Badge>{profile.templateType}</Badge>
        </div>
      </Card>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card compact>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Taps</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">{profile.tapCount || 0}</p>
        </Card>
        <Card compact>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Recorded Scans</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">{metrics.totalScans}</p>
        </Card>
        <Card compact>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Contact Shared</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">{metrics.contactRate}%</p>
        </Card>
        <Card compact>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Location Shared</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">{metrics.locationRate}%</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-[var(--theme-text)]">Recent Scans</h2>
        {events.length === 0 ? (
          <p className="text-sm text-[var(--theme-muted)]">No scans recorded for this tag yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] text-left text-[var(--theme-muted)]">
                  <th className="px-3 py-3">Visitor</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Notes</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-3 py-3">Consent</th>
                  <th className="px-3 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 50).map((event) => (
                  <tr key={event.id} className="border-b border-[color-mix(in_srgb,var(--theme-accent)_14%,transparent)]">
                    <td className="px-3 py-3 text-[var(--theme-text)]">{event.scannerName || 'Anonymous Visitor'}</td>
                    <td className="px-3 py-3 text-[var(--theme-muted)]">
                      {event.scannerEmail || event.scannerPhone
                        ? `${event.scannerEmail || ''}${event.scannerPhone ? ` • ${event.scannerPhone}` : ''}`
                        : 'Not shared'}
                    </td>
                    <td className="px-3 py-3 text-[var(--theme-muted)]">{event.scannerNotes || 'No notes'}</td>
                    <td className="px-3 py-3 text-[var(--theme-muted)]">{event.locationLabel || 'Not shared'}</td>
                    <td className="px-3 py-3 text-[var(--theme-muted)]">
                      {event.consentContact ? 'Contact' : 'No contact'}
                      {' / '}
                      {event.consentLocation ? 'Location' : 'No location'}
                    </td>
                    <td className="px-3 py-3 text-[var(--theme-muted)]">{new Date(event.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default TagAnalytics
