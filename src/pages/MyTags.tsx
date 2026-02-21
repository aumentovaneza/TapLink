import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import { getCurrentUser, getProfilesByOwner, logoutUser } from '../services/dataLayer'
import { Profile } from '../types'

const MyTags = () => {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [ownerName, setOwnerName] = useState('')

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/login', { state: { next: '/my-tags' } })
      return
    }

    setOwnerName(currentUser.name)
    setProfiles(getProfilesByOwner(currentUser.id))
  }, [navigate])

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--theme-accent)]">My Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--theme-text)]">{ownerName}'s Tags</h1>
          <p className="mt-2 text-sm text-[var(--theme-muted)]">Access and edit every profile linked to your tags.</p>
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
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Card compact>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Total Tags</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">{profiles.length}</p>
          </Card>
          <Card compact>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Active Tags</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">
              {profiles.filter((profile) => profile.status === 'active').length}
            </p>
          </Card>
          <Card compact>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--theme-muted)]">Total Taps</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--theme-text)]">
              {profiles.reduce((sum, profile) => sum + (profile.tapCount || 0), 0)}
            </p>
          </Card>
        </div>
      )}

      {profiles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile) => (
            <Card key={profile.publicId} hoverable>
              <div className="mb-3 flex items-center justify-between">
                <Badge>{profile.templateType}</Badge>
                <Badge variant={profile.status === 'active' ? 'success' : 'danger'}>{profile.status}</Badge>
              </div>
              <p className="mb-3 text-sm font-semibold text-[var(--theme-accent)]">Taps: {profile.tapCount || 0}</p>
              <p className="text-sm text-[var(--theme-muted)]">Tag ID</p>
              <p className="mb-2 font-mono text-sm font-semibold text-[var(--theme-text)]">{profile.tagId}</p>
              <p className="text-sm text-[var(--theme-muted)]">Public ID</p>
              <p className="mb-4 font-mono text-sm font-semibold text-[var(--theme-text)]">{profile.publicId}</p>

              <div className="flex flex-wrap gap-2">
                <Link to={`/editor/${profile.templateType}/edit/${profile.publicId}`}>
                  <Button>Edit Profile</Button>
                </Link>
                <Link to={`/p/${profile.publicId}`}>
                  <Button variant="outline">Open Public Page</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default MyTags
