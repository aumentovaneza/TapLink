import { Profile } from '../types'
import Badge from './ui/Badge'
import Card from './ui/Card'
import { normalizeRestaurantSections } from '../utils/restaurantMenu'

interface PreviewCardProps {
  profile: Profile
  compact?: boolean
}

const PreviewCard = ({ profile, compact = false }: PreviewCardProps) => {
  const renderProfileData = () => {
    switch (profile.templateType) {
      case 'pet': {
        const petData = profile.data as any
        return (
          <div>
            <h4 className="mb-1.5 text-lg font-semibold text-[var(--theme-text)]">{petData.petName || 'Pet Name'}</h4>
            <p className="text-sm text-[var(--theme-muted)]">Owner: {petData.ownerName || 'Not provided'}</p>
            <p className="text-sm text-[var(--theme-muted)]">Emergency: {petData.emergencyContact || 'Not provided'}</p>
            {petData.medicalNotes ? <p className="mt-2 text-sm text-[var(--theme-muted)]">{petData.medicalNotes}</p> : null}
          </div>
        )
      }
      case 'business': {
        const businessData = profile.data as any
        return (
          <div>
            <h4 className="mb-1.5 text-lg font-semibold text-[var(--theme-text)]">{businessData.businessName || 'Business Name'}</h4>
            <p className="text-sm text-[var(--theme-muted)]">{businessData.description || 'Business description'}</p>
            <p className="mt-2 text-sm text-[var(--theme-muted)]">{businessData.contactNumber || 'No contact yet'}</p>
            <p className="text-sm text-[var(--theme-muted)]">{businessData.address || 'No address yet'}</p>
          </div>
        )
      }
      case 'personal': {
        const personalData = profile.data as any
        return (
          <div>
            <h4 className="mb-1.5 text-lg font-semibold text-[var(--theme-text)]">{personalData.name || 'Your Name'}</h4>
            <p className="text-sm text-[var(--theme-muted)]">{personalData.bio || 'Personal bio appears here'}</p>
            <p className="mt-2 text-sm text-[var(--theme-muted)]">{personalData.phone || 'Phone not set'}</p>
            <p className="text-sm text-[var(--theme-muted)]">{personalData.email || 'Email not set'}</p>
          </div>
        )
      }
      case 'restaurant': {
        const restaurantData = profile.data as any
        const sections = normalizeRestaurantSections(restaurantData)
        const firstNonEmptySection = sections.find((section) => section.items.length > 0) || sections[0]
        const previewItems = (firstNonEmptySection?.items || []).slice(0, compact ? 2 : 3)
        return (
          <div>
            <h4 className="mb-1.5 text-lg font-semibold text-[var(--theme-text)]">{restaurantData.restaurantName || 'Restaurant Name'}</h4>
            <p className="text-sm text-[var(--theme-muted)]">{restaurantData.location || 'Location pending'}</p>
            <p className="text-sm text-[var(--theme-muted)]">{restaurantData.hours || 'Hours pending'}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--theme-muted)]">
              {firstNonEmptySection?.name || 'Menu'}
            </p>
            <div className="mt-3 space-y-2">
              {previewItems.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-2 rounded-xl bg-white/60 p-2">
                  {item.photo ? (
                    <img src={item.photo} alt={item.name || `Menu item ${index + 1}`} className="h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-[color-mix(in_srgb,var(--theme-accent)_15%,white)]" />
                  )}
                  <p className="text-sm text-[var(--theme-muted)]">
                    {item.name || 'Menu item'} {item.price ? `• ${item.price}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      }
      default:
        return <p className="text-sm text-[var(--theme-muted)]">Unknown profile type</p>
    }
  }

  return (
    <Card compact={compact} className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <Badge>{profile.templateType}</Badge>
        <span className="text-xs text-[var(--theme-muted)]">{new Date(profile.createdAt).toLocaleDateString()}</span>
      </div>
      {renderProfileData()}
      {profile.status === 'disabled' ? <p className="mt-2 text-xs font-semibold text-rose-500">Profile Disabled</p> : null}
    </Card>
  )
}

export default PreviewCard
