import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import {
  getCurrentUser,
  getOwnerNotifications,
  getProfilesByOwner,
  logoutUser,
  markOwnerNotificationRead,
} from '../services/dataLayer'
import { OwnerNotification, Profile } from '../types'

const getProfileName = (profile: Profile): string => {
  const data = profile.data as any

  switch (profile.templateType) {
    case 'personal':
      return data.name || 'Unnamed Person'
    case 'business':
      return data.businessName || 'Unnamed Business'
    case 'pet':
      return data.petName || 'Unnamed Pet'
    case 'restaurant':
      return data.restaurantName || 'Unnamed Restaurant'
    default:
      return 'Untitled Profile'
  }
}

const MyTags = () => {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [notifications, setNotifications] = useState<OwnerNotification[]>([])
  const [ownerName, setOwnerName] = useState('')
  const [ownerId, setOwnerId] = useState('')

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/login', { state: { next: '/my-tags' } })
      return
    }

    setOwnerName(currentUser.name)
    setOwnerId(currentUser.id)
    setProfiles(getProfilesByOwner(currentUser.id))
    setNotifications(getOwnerNotifications(currentUser.id))
  }, [navigate])

  const stats = useMemo(() => {
    const totalTags = profiles.length
    const activeTags = profiles.filter((profile) => profile.status === 'active').length
    const totalTaps = profiles.reduce((sum, profile) => sum + (profile.tapCount || 0), 0)

    return { totalTags, activeTags, totalTaps }
  }, [profiles])

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  const handleMarkRead = (notificationId: string) => {
    if (!ownerId) {
      return
    }

    const updated = markOwnerNotificationRead(notificationId, ownerId)
    if (!updated) {
      return
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === updated.id ? { ...notification, read: true } : notification,
      ),
    )
  }

  const unreadNotifications = notifications.filter((notification) => !notification.read)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--theme-accent)]">My Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--theme-text)]">{ownerName}'s Tags</h1>
          <p className="mt-2 text-sm text-[var(--theme-muted)]">Manage and monitor all profiles linked to your tags.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/templates">
            <Button>Create New Tag</Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          title="No tags yet"
          description="Create your first profile to claim and manage a tag."
          actionLabel="Go to Templates"
          actionTo="/templates"
        />
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <Card compact>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Total Tags</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">{stats.totalTags}</p>
            </Card>
            <Card compact>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Active Tags</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">{stats.activeTags}</p>
            </Card>
            <Card compact>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Total Taps</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">{stats.totalTaps}</p>
            </Card>
          </div>

          {unreadNotifications.length > 0 ? (
            <Card className="mb-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--theme-text)]">Notifications</h2>
                <Badge variant="success">{unreadNotifications.length} new</Badge>
              </div>
              <div className="space-y-2">
                {unreadNotifications.slice(0, 6).map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-accent)_18%,transparent)] bg-[color-mix(in_srgb,var(--theme-card)_90%,transparent)] p-3"
                  >
                    <p className="text-sm font-semibold text-[var(--theme-text)]">{notification.title}</p>
                    <p className="mt-1 text-xs text-[var(--theme-muted)]">{notification.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Link to={`/my-tags/${notification.profilePublicId}/analytics`}>
                        <Button variant="secondary" className="px-3 py-2 text-xs">
                          View Scan Details
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="px-3 py-2 text-xs"
                        onClick={() => handleMarkRead(notification.id)}
                      >
                        Mark as Read
                      </Button>
                      <span className="text-[11px] text-[var(--theme-muted)]">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <div className="space-y-3">
            {profiles.map((profile) => (
              <Card key={profile.publicId} compact className="overflow-hidden">
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-[var(--theme-text)]">{getProfileName(profile)}</p>
                      <Badge>{profile.templateType}</Badge>
                      <Badge variant={profile.status === 'active' ? 'success' : 'danger'}>{profile.status}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md bg-[color-mix(in_srgb,var(--theme-accent)_10%,transparent)] px-2 py-1 font-mono text-[var(--theme-muted)]">
                        tag: {profile.tagId}
                      </span>
                      <span className="rounded-md bg-[color-mix(in_srgb,var(--theme-accent)_10%,transparent)] px-2 py-1 font-mono text-[var(--theme-muted)]">
                        public: {profile.publicId}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--theme-card)_92%,transparent)] px-3 py-2 text-center">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--theme-muted)]">Taps</p>
                    <p className="text-xl font-semibold text-[var(--theme-text)]">{profile.tapCount || 0}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-[color-mix(in_srgb,var(--theme-accent)_16%,transparent)] pt-3">
                  <Link to={`/editor/${profile.templateType}/edit/${profile.publicId}`}>
                    <Button>Edit Profile</Button>
                  </Link>
                  <Link to={`/my-tags/${profile.publicId}/analytics`}>
                    <Button variant="secondary">View Analytics</Button>
                  </Link>
                  <Link to={`/t/${profile.tagId}`}>
                    <Button variant="outline">Simulate Scan</Button>
                  </Link>
                  <Link to={`/p/${profile.publicId}`}>
                    <Button variant="outline">Open Public Page</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default MyTags
