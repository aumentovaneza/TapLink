import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getProfiles, deleteProfile, updateProfile, getUsers, getScanEvents } from '../services/dataLayer'
import { Profile, ScanEvent } from '../types'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Input from '../components/ui/Input'

const Admin = () => {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [scanEvents, setScanEvents] = useState<ScanEvent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'disabled'>('all')

  useEffect(() => {
    setProfiles(getProfiles())
    setScanEvents(getScanEvents())
  }, [])

  const usersById = useMemo(() => {
    return new Map(getUsers().map((user) => [user.id, user]))
  }, [])

  const filteredProfiles = profiles.filter((profile) => {
    const data = profile.data as any
    const ownerName = profile.ownerId ? usersById.get(profile.ownerId)?.name || '' : ''

    const matchesSearch =
      searchTerm === '' ||
      profile.templateType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.petName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filter === 'all' || profile.status === filter

    return matchesSearch && matchesFilter
  })

  const getDisplayName = (profile: Profile): string => {
    const data = profile.data as any
    switch (profile.templateType) {
      case 'pet':
        return data.petName || 'Unnamed Pet'
      case 'business':
        return data.businessName || 'Unnamed Business'
      case 'personal':
        return data.name || 'Unnamed Person'
      case 'restaurant':
        return data.restaurantName || 'Unnamed Restaurant'
      default:
        return 'Unknown'
    }
  }

  const totalTaps = profiles.reduce((sum, profile) => sum + (profile.tapCount || 0), 0)
  const totalScans = scanEvents.length

  const toggleStatus = (publicId: string) => {
    const profile = profiles.find((p) => p.publicId === publicId)
    if (!profile) {
      return
    }

    const updatedStatus = profile.status === 'active' ? 'disabled' : 'active'
    updateProfile(publicId, { status: updatedStatus })
    setProfiles((prev) =>
      prev.map((currentProfile) =>
        currentProfile.publicId === publicId ? { ...currentProfile, status: updatedStatus } : currentProfile,
      ),
    )
  }

  const handleDelete = (publicId: string) => {
    if (window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      deleteProfile(publicId)
      setProfiles((prev) => prev.filter((profile) => profile.publicId !== publicId))
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--theme-accent)]">Platform Ops</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--theme-text)]">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--theme-muted)]">Monitor profile health, ownership and engagement in one place.</p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card compact>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Profiles</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">{profiles.length}</p>
        </Card>
        <Card compact>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Active</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">
            {profiles.filter((profile) => profile.status === 'active').length}
          </p>
        </Card>
        <Card compact>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Disabled</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">
            {profiles.filter((profile) => profile.status === 'disabled').length}
          </p>
        </Card>
        <Card compact>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Total Taps</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">{totalTaps}</p>
        </Card>
        <Card compact>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Scan Events</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">{totalScans}</p>
        </Card>
      </div>

      <Card className="mb-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            type="text"
            placeholder="Search by owner, profile name, or template"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="lg:max-w-xl"
          />
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'disabled'] as const).map((item) => (
              <Button key={item} variant={filter === item ? 'primary' : 'secondary'} onClick={() => setFilter(item)}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {filteredProfiles.length === 0 ? (
          <EmptyState
            title="No profiles found"
            description={
              searchTerm || filter !== 'all'
                ? 'Try changing your search or filters.'
                : 'No profiles have been created yet.'
            }
            actionLabel={!searchTerm && filter === 'all' ? 'Create First Profile' : undefined}
            actionTo={!searchTerm && filter === 'all' ? '/templates' : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] text-left text-[var(--theme-muted)]">
                  <th className="px-3 py-3">Template</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Owner</th>
                  <th className="px-3 py-3">Taps</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Created</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((profile) => {
                  const ownerName = profile.ownerId ? usersById.get(profile.ownerId)?.name || 'Unknown user' : 'Legacy profile'

                  return (
                    <tr
                      key={profile.publicId}
                      className="border-b border-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--theme-accent)_7%,white)]"
                    >
                      <td className="px-3 py-3"><Badge>{profile.templateType}</Badge></td>
                      <td className="px-3 py-3 font-medium text-[var(--theme-text)]">{getDisplayName(profile)}</td>
                      <td className="px-3 py-3 text-[var(--theme-muted)]">{ownerName}</td>
                      <td className="px-3 py-3 text-[var(--theme-text)] font-semibold">{profile.tapCount || 0}</td>
                      <td className="px-3 py-3">
                        <Badge variant={profile.status === 'active' ? 'success' : 'danger'}>{profile.status}</Badge>
                      </td>
                      <td className="px-3 py-3 text-[var(--theme-muted)]">{new Date(profile.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/p/${profile.publicId}`}>
                            <Button variant="outline" className="px-3 py-2 text-xs">View</Button>
                          </Link>
                          <Button
                            variant="secondary"
                            className="px-3 py-2 text-xs"
                            onClick={() => toggleStatus(profile.publicId)}
                          >
                            {profile.status === 'active' ? 'Disable' : 'Enable'}
                          </Button>
                          <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => handleDelete(profile.publicId)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mb-5">
        <h2 className="mb-3 text-lg font-semibold text-[var(--theme-text)]">Recent Scanner Activity</h2>
        {scanEvents.length === 0 ? (
          <p className="text-sm text-[var(--theme-muted)]">No scanner activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] text-left text-[var(--theme-muted)]">
                  <th className="px-3 py-3">Profile</th>
                  <th className="px-3 py-3">Scanner</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Notes</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-3 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {scanEvents.slice(0, 30).map((event) => (
                  <tr key={event.id} className="border-b border-[color-mix(in_srgb,var(--theme-accent)_15%,transparent)]">
                    <td className="px-3 py-3 font-mono text-xs text-[var(--theme-text)]">{event.profilePublicId}</td>
                    <td className="px-3 py-3 text-[var(--theme-text)]">{event.scannerName || 'Anonymous'}</td>
                    <td className="px-3 py-3 text-[var(--theme-muted)]">
                      {event.scannerEmail || event.scannerPhone ? (
                        <>
                          {event.scannerEmail || ''} {event.scannerPhone ? `• ${event.scannerPhone}` : ''}
                        </>
                      ) : (
                        'Not shared'
                      )}
                    </td>
                    <td className="px-3 py-3 text-[var(--theme-muted)]">{event.scannerNotes || 'No notes'}</td>
                    <td className="px-3 py-3 text-[var(--theme-muted)]">
                      {event.locationLabel || event.scannerLocationDetails ? (
                        <div className="space-y-0.5">
                          {event.locationLabel ? <p>GPS: {event.locationLabel}</p> : null}
                          {event.scannerLocationDetails ? <p>Reported: {event.scannerLocationDetails}</p> : null}
                        </div>
                      ) : (
                        'Not shared'
                      )}
                    </td>
                    <td className="px-3 py-3 text-[var(--theme-muted)]">{new Date(event.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Link to="/" className="text-sm font-medium text-[var(--theme-accent)] transition-all duration-200 hover:opacity-80">
        Back to Home
      </Link>
    </div>
  )
}

export default Admin
