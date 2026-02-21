import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProfile, incrementProfileTapCount } from '../services/dataLayer'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useTheme } from '../theme/useTheme'
import { themes, ThemeName } from '../theme/themes'
import { normalizeRestaurantSections } from '../utils/restaurantMenu'

const isThemeName = (value: unknown): value is ThemeName =>
  typeof value === 'string' && value in themes

interface ProfileCta {
  label: string
  href: string
}

interface ProfileDetail {
  label: string
  value: string
}

interface PresentationMenuItem {
  name: string
  price: string
  description: string
  photo?: string
}

interface PresentationMenuSection {
  id: string
  name: string
  items: PresentationMenuItem[]
}

const buildProfilePresentation = (profile: any): {
  name: string
  subtitle: string
  bio: string
  avatarUrl: string
  ctas: ProfileCta[]
  details: ProfileDetail[]
  menuSections: PresentationMenuSection[]
} => {
  const data = profile?.data ?? {}
  const ctas: ProfileCta[] = []
  const details: ProfileDetail[] = []

  const addDetail = (label: string, value?: string) => {
    if (value && value.trim()) {
      details.push({ label, value: value.trim() })
    }
  }

  if (profile.templateType === 'personal') {
    const hasEmailCta = Boolean(data.email)
    const hasPhoneCta = Boolean(data.phone)
    const hasPortfolioCta = Boolean(data.portfolioLink)

    if (data.email) ctas.push({ label: 'Email Me', href: `mailto:${data.email}` })
    if (data.phone) ctas.push({ label: 'Call Me', href: `tel:${data.phone}` })
    if (data.portfolioLink) ctas.push({ label: 'View Portfolio', href: data.portfolioLink })

    if (!hasEmailCta) addDetail('Email', data.email)
    if (!hasPhoneCta) addDetail('Phone', data.phone)
    if (!hasPortfolioCta) addDetail('Portfolio', data.portfolioLink)

    return {
      name: data.name || 'TapLink User',
      subtitle: data.headline || 'Personal Profile',
      bio: data.bio || 'Connect with me directly through the links below.',
      avatarUrl: data.photo || data.avatar || '',
      ctas,
      details,
      menuSections: [],
    }
  }

  if (profile.templateType === 'business') {
    const hasContactCta = Boolean(data.contactNumber)
    const primarySocial = data.socialLinks?.[0]
    const hasPrimarySocialCta = Boolean(primarySocial?.url)

    if (data.contactNumber) ctas.push({ label: 'Call Business', href: `tel:${data.contactNumber}` })
    if (primarySocial?.url) ctas.push({ label: primarySocial.label || 'Visit Link', href: primarySocial.url })

    if (!hasContactCta) addDetail('Contact', data.contactNumber)
    addDetail('Address', data.address)
    if (Array.isArray(data.socialLinks)) {
      const socialLinksForDetails = hasPrimarySocialCta ? data.socialLinks.slice(1) : data.socialLinks
      socialLinksForDetails.forEach((link: { label?: string; url?: string }, index: number) => {
        if (link?.url) {
          addDetail(link.label || `Social ${index + 1}`, link.url)
        }
      })
    }

    return {
      name: data.businessName || 'Business Profile',
      subtitle: 'Business',
      bio: data.description || 'Welcome to our TapLink profile.',
      avatarUrl: data.photo || data.logo || '',
      ctas,
      details,
      menuSections: [],
    }
  }

  if (profile.templateType === 'restaurant') {
    const hasContactCta = Boolean(data.contactNumber)
    const menuSections = normalizeRestaurantSections(data)
    const hasMenuItems = menuSections.some((section) => section.items.length > 0)

    if (hasContactCta) ctas.push({ label: 'Call Restaurant', href: `tel:${data.contactNumber}` })
    if (hasMenuItems) ctas.push({ label: 'Menu Highlights', href: '#menu-highlights' })

    if (!hasContactCta) addDetail('Contact', data.contactNumber)
    addDetail('Location', data.location)
    addDetail('Hours', data.hours)

    return {
      name: data.restaurantName || 'Restaurant Profile',
      subtitle: 'Restaurant',
      bio: data.description || 'Discover our menu and opening hours.',
      avatarUrl: data.photo || '',
      ctas,
      details,
      menuSections,
    }
  }

  if (profile.templateType === 'pet') {
    const hasEmergencyCta = Boolean(data.emergencyContact)

    if (hasEmergencyCta) ctas.push({ label: 'Call Emergency Contact', href: `tel:${data.emergencyContact}` })
    addDetail('Owner', data.ownerName)
    if (!hasEmergencyCta) addDetail('Emergency', data.emergencyContact)
    addDetail('Medical Notes', data.medicalNotes)

    return {
      name: data.petName || 'Pet Profile',
      subtitle: 'Pet Tag',
      bio: 'If found, please contact the owner using the button below.',
      avatarUrl: data.photo || '',
      ctas,
      details,
      menuSections: [],
    }
  }

  return {
    name: 'TapLink Profile',
    subtitle: 'Public Profile',
    bio: 'Shared via TapLink',
    avatarUrl: '',
    ctas,
    details,
    menuSections: [],
  }
}

const ProfileView = () => {
  const { publicId } = useParams<{ publicId: string }>()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeMenuTab, setActiveMenuTab] = useState('')
  const { setTheme, setThemeForScope } = useTheme()
  const hasTrackedTap = useRef(false)

  useEffect(() => {
    hasTrackedTap.current = false
  }, [publicId])

  useEffect(() => {
    const loadProfile = async () => {
      if (publicId) {
        const foundProfile = getProfile(publicId)
        setProfile(foundProfile)
      }
      setLoading(false)
    }

    loadProfile()
  }, [publicId])

  useEffect(() => {
    if (!profile || profile.status !== 'active' || hasTrackedTap.current) {
      return
    }

    hasTrackedTap.current = true
    const updated = incrementProfileTapCount(profile.publicId)
    if (updated) {
      setProfile(updated)
    }
  }, [profile])

  useEffect(() => {
    if (!profile) {
      return
    }

    const profileTheme = profile?.data?.theme
    if (!isThemeName(profileTheme)) {
      return
    }

    setTheme(profileTheme)

    if (profile.publicId) {
      setThemeForScope(`public:${profile.publicId}`, profileTheme)
    }

    if (profile.tagId) {
      setThemeForScope(`tag:${profile.tagId}`, profileTheme)
    }
  }, [profile, setTheme, setThemeForScope])

  const presentation = useMemo(() => (profile ? buildProfilePresentation(profile) : null), [profile])

  useEffect(() => {
    if (!profile || !presentation || profile.templateType !== 'restaurant') {
      return
    }

    const hasValidActiveTab = presentation.menuSections.some((section) => section.id === activeMenuTab)
    if (hasValidActiveTab) {
      return
    }

    const firstAvailableSection =
      presentation.menuSections.find((section) => section.items.length > 0) || presentation.menuSections[0]
    setActiveMenuTab(firstAvailableSection?.id || '')
  }, [profile?.publicId, profile?.templateType, presentation, activeMenuTab])

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4 py-10">
        <Card className="w-full text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[color-mix(in_srgb,var(--theme-accent)_22%,transparent)] border-t-[var(--theme-accent)]" />
          <p className="text-sm text-[var(--theme-muted)]">Loading profile...</p>
        </Card>
      </div>
    )
  }

  if (!profile || !presentation) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-10">
        <Card className="w-full text-center">
          <h2 className="text-2xl font-semibold text-[var(--theme-text)]">Profile Not Found</h2>
          <p className="mt-3 text-sm text-[var(--theme-muted)]">The profile does not exist or has been disabled.</p>
          <Link to="/" className="mt-6 inline-block">
            <Button>Back to Home</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (profile.status === 'disabled') {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-10">
        <Card className="w-full text-center">
          <h2 className="text-2xl font-semibold text-[var(--theme-text)]">Profile Disabled</h2>
          <p className="mt-3 text-sm text-[var(--theme-muted)]">This profile has been disabled by the owner.</p>
          <Link to="/" className="mt-6 inline-block">
            <Button>Back to Home</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const menuSections = profile.templateType === 'restaurant' ? presentation.menuSections : []
  const activeSection =
    menuSections.find((section) => section.id === activeMenuTab) ||
    menuSections.find((section) => section.items.length > 0) ||
    menuSections[0]

  const initials = presentation.name
    .split(' ')
    .map((item) => item[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="text-center">
        <div className="mx-auto mb-5 h-28 w-28 overflow-hidden rounded-full border-4 border-white/70 shadow-lg">
          {presentation.avatarUrl ? (
            <img src={presentation.avatarUrl} alt={presentation.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[color-mix(in_srgb,var(--theme-accent)_20%,white)] text-2xl font-semibold text-[var(--theme-text)]">
              {initials}
            </div>
          )}
        </div>

        <h1 className="text-5xl font-semibold tracking-tight text-[var(--theme-text)]">{presentation.name}</h1>
        <p className="mt-2 text-2xl text-[var(--theme-muted)]">{presentation.subtitle}</p>
        <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-[var(--theme-muted)]">{presentation.bio}</p>
      </section>

      <section className="mx-auto mt-12 max-w-xl space-y-4">
        {presentation.ctas.map((cta) => (
          <a
            key={`${cta.label}-${cta.href}`}
            href={cta.href}
            target={cta.href.startsWith('http') ? '_blank' : undefined}
            rel={cta.href.startsWith('http') ? 'noreferrer' : undefined}
            className="block w-full rounded-full bg-white px-6 py-3.5 text-center text-xl font-semibold text-slate-800 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.38)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_25px_50px_-24px_rgba(15,23,42,0.42)]"
          >
            {cta.label}
          </a>
        ))}
      </section>

      {presentation.details.length > 0 ? (
        <section className="mx-auto mt-8 max-w-xl">
          <Card>
            <h3 className="text-base font-semibold text-[var(--theme-text)]">More Information</h3>
            <div className="mt-3 space-y-2">
              {presentation.details.map((detail) => (
                <div key={`${detail.label}-${detail.value}`} className="rounded-xl bg-white/55 px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--theme-muted)]">{detail.label}</p>
                  <p className="text-sm font-medium text-[var(--theme-text)] break-words">{detail.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      ) : null}

      {profile.templateType === 'restaurant' && menuSections.length > 0 ? (
        <section id="menu-highlights" className="mx-auto mt-8 max-w-xl">
          <Card className="border-2 border-dashed border-[color-mix(in_srgb,var(--theme-accent)_35%,transparent)]">
            <div className="mb-4 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--theme-muted)]">Chef's Selection</p>
              <h3 className="text-2xl font-semibold text-[var(--theme-text)]">Menu Highlights</h3>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {menuSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveMenuTab(section.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    activeSection?.id === section.id
                      ? 'bg-[var(--theme-accent)] text-white'
                      : 'bg-white/70 text-[var(--theme-text)]'
                  }`}
                >
                  {section.name}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {(activeSection?.items || []).map((item, index) => (
                <div
                  key={`${item.name || 'item'}-${index}`}
                  className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-accent)_22%,transparent)] bg-white/55 p-3"
                >
                  <div className="flex gap-3">
                    {item.photo ? (
                      <img src={item.photo} alt={item.name || `Menu item ${index + 1}`} className="h-20 w-20 rounded-xl object-cover" />
                    ) : (
                      <div className="h-20 w-20 rounded-xl bg-[color-mix(in_srgb,var(--theme-accent)_18%,white)]" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-base font-semibold text-[var(--theme-text)]">{item.name || `Menu Item ${index + 1}`}</h4>
                        <p className="text-sm font-semibold text-[var(--theme-accent)]">{item.price || ''}</p>
                      </div>
                      <p className="mt-1 text-sm text-[var(--theme-muted)]">{item.description || 'Deliciously crafted by our kitchen.'}</p>
                    </div>
                  </div>
                </div>
              ))}
              {activeSection?.items?.length === 0 ? (
                <div className="rounded-2xl bg-white/55 p-4 text-sm text-[var(--theme-muted)]">No items added in this section yet.</div>
              ) : null}
            </div>
          </Card>
        </section>
      ) : null}
    </div>
  )
}

export default ProfileView
