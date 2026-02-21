import { Profile, TagMapping, TemplateType, User } from '../types'

const STORAGE_KEYS = {
  PROFILES: 'taplink_profiles',
  TAG_MAPPINGS: 'taplink_tag_mappings',
  CLAIM_CODES: 'taplink_claim_codes',
  USERS: 'taplink_users',
  SESSION_USER_ID: 'taplink_session_user_id',
  LOGGED_IN: 'taplink_logged_in',
}

const MOCK_CLAIM_CODES = ['DEMO-1234', 'PET-0001', 'BIZ-0001']
const DEMO_OWNER_ID = 'demo-owner'
const DEMO_OWNER_EMAIL = 'demo@taplink.local'

const DEMO_PROFILES: Profile[] = [
  {
    id: 'demo-profile-personal',
    publicId: 'demo-public-id',
    tagId: 'demo-tag-id',
    ownerId: DEMO_OWNER_ID,
    tapCount: 128,
    templateType: 'personal',
    data: {
      name: 'Jane Doe',
      bio: 'Creating beautiful digital experiences. Always learning, always building.',
      phone: '555-0123',
      email: 'jane@example.com',
      portfolioLink: 'https://example.com',
      headline: 'Product Designer',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      theme: 'minimal',
    } as any,
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z',
    status: 'active',
  },
  {
    id: 'demo-profile-business',
    publicId: 'demo-business-public-id',
    tagId: 'demo-business-tag-id',
    ownerId: DEMO_OWNER_ID,
    tapCount: 243,
    templateType: 'business',
    data: {
      businessName: 'Northstar Studio',
      description: 'Brand design and digital strategy for modern teams.',
      contactNumber: '555-0110',
      address: '120 Market Street, San Francisco, CA',
      socialLinks: [
        { label: 'Website', url: 'https://example.com/studio' },
        { label: 'Instagram', url: 'https://instagram.com' },
      ],
      photo: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=500&q=80',
      theme: 'glass',
    } as any,
    createdAt: '2025-01-16T10:00:00.000Z',
    updatedAt: '2025-01-16T10:00:00.000Z',
    status: 'active',
  },
  {
    id: 'demo-profile-pet',
    publicId: 'demo-pet-public-id',
    tagId: 'demo-pet-tag-id',
    ownerId: DEMO_OWNER_ID,
    tapCount: 67,
    templateType: 'pet',
    data: {
      petName: 'Buddy',
      ownerName: 'John Doe',
      emergencyContact: '555-0139',
      medicalNotes: 'Allergic to chicken. Needs daily medication at 7PM.',
      photo: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=500&q=80',
      theme: 'warm',
    } as any,
    createdAt: '2025-01-17T10:00:00.000Z',
    updatedAt: '2025-01-17T10:00:00.000Z',
    status: 'active',
  },
  {
    id: 'demo-profile-restaurant',
    publicId: 'demo-restaurant-public-id',
    tagId: 'demo-restaurant-tag-id',
    ownerId: DEMO_OWNER_ID,
    tapCount: 392,
    templateType: 'restaurant',
    data: {
      restaurantName: 'Cafe Solstice',
      location: '88 Ocean Ave, Santa Monica, CA',
      hours: 'Mon-Sun 7:00 AM - 8:00 PM',
      menuSections: [
        {
          id: 'main',
          name: 'Main',
          items: [
            {
              name: 'Avocado Toast',
              price: '$11.00',
              description: 'Sourdough, smashed avocado, chili flakes, and lemon zest.',
              photo: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=500&q=80',
            },
            {
              name: 'Blueberry Pancakes',
              price: '$13.00',
              description: 'Fluffy stack with maple syrup and whipped mascarpone.',
              photo: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=500&q=80',
            },
          ],
        },
        {
          id: 'appetizers',
          name: 'Appetizers',
          items: [
            {
              name: 'Tomato Basil Soup',
              price: '$7.00',
              description: 'Roasted tomato soup with basil oil and toasted sourdough.',
              photo: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=500&q=80',
            },
          ],
        },
        {
          id: 'drinks',
          name: 'Drinks',
          items: [
            {
              name: 'Honey Oat Latte',
              price: '$6.50',
              description: 'Espresso, steamed oat milk, and local wildflower honey.',
              photo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80',
            },
            {
              name: 'Citrus Sparkler',
              price: '$5.00',
              description: 'Fresh orange, lime, mint, and sparkling water.',
              photo: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=500&q=80',
            },
          ],
        },
        {
          id: 'desserts',
          name: 'Desserts',
          items: [
            {
              name: 'Lemon Tart',
              price: '$8.00',
              description: 'Buttery crust, lemon curd, and whipped cream.',
              photo: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=500&q=80',
            },
          ],
        },
        {
          id: 'seasonal-specials',
          name: 'Seasonal Specials',
          items: [
            {
              name: 'Pumpkin Spice Cold Brew',
              price: '$6.25',
              description: 'House cold brew with pumpkin cream and nutmeg dust.',
              photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=500&q=80',
            },
          ],
        },
      ],
      description: 'Seasonal brunch and specialty coffee.',
      contactNumber: '555-0142',
      photo: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=500&q=80',
      theme: 'pastel',
    } as any,
    createdAt: '2025-01-18T10:00:00.000Z',
    updatedAt: '2025-01-18T10:00:00.000Z',
    status: 'active',
  },
]

const generateId = (): string => Math.random().toString(36).substr(2, 9)

const getStoredArray = <T>(key: string): T[] => {
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : []
}

const initializeStorage = (): void => {
  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.TAG_MAPPINGS)) {
    localStorage.setItem(STORAGE_KEYS.TAG_MAPPINGS, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLAIM_CODES)) {
    localStorage.setItem(STORAGE_KEYS.CLAIM_CODES, JSON.stringify(MOCK_CLAIM_CODES))
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]))
  }

  const users = getStoredArray<User>(STORAGE_KEYS.USERS)
  if (!users.some((user) => user.id === DEMO_OWNER_ID)) {
    users.push({
      id: DEMO_OWNER_ID,
      email: DEMO_OWNER_EMAIL,
      password: 'demo1234',
      name: 'TapLink Demo',
      createdAt: '2025-01-14T10:00:00.000Z',
    })
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  }

  const profiles = getStoredArray<Profile>(STORAGE_KEYS.PROFILES)
  let didAddProfiles = false
  DEMO_PROFILES.forEach((demoProfile) => {
    if (!profiles.some((profile) => profile.publicId === demoProfile.publicId)) {
      profiles.push(demoProfile)
      didAddProfiles = true
    }
  })
  if (didAddProfiles) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles))
  }

  // Keep seeded demo media/data fresh in existing local data.
  const migratedProfiles = profiles.map((profile) => {
    if (profile.publicId !== 'demo-restaurant-public-id') {
      return profile
    }

    const data = profile.data as any
    const seededRestaurant = DEMO_PROFILES.find((demoProfile) => demoProfile.publicId === 'demo-restaurant-public-id')
    if (!seededRestaurant) return profile

    return {
      ...profile,
      data: {
        ...data,
        menuSections: (seededRestaurant.data as any).menuSections,
      },
    }
  })

  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(migratedProfiles))

  const mappings = getStoredArray<TagMapping>(STORAGE_KEYS.TAG_MAPPINGS)
  let didAddMappings = false
  DEMO_PROFILES.forEach((demoProfile) => {
    if (!mappings.some((mapping) => mapping.tagId === demoProfile.tagId)) {
      mappings.push({ tagId: demoProfile.tagId, publicId: demoProfile.publicId })
      didAddMappings = true
    }
  })
  if (didAddMappings) {
    localStorage.setItem(STORAGE_KEYS.TAG_MAPPINGS, JSON.stringify(mappings))
  }
}

initializeStorage()

export const getUsers = (): User[] => getStoredArray<User>(STORAGE_KEYS.USERS)

export const getCurrentUser = (): User | null => {
  const userId = localStorage.getItem(STORAGE_KEYS.SESSION_USER_ID)
  if (!userId) {
    return null
  }

  return getUsers().find((user) => user.id === userId) || null
}

export const registerUser = (name: string, email: string, password: string): { user: User | null; error?: string } => {
  const users = getUsers()
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !password.trim() || !name.trim()) {
    return { user: null, error: 'Name, email and password are required.' }
  }

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return { user: null, error: 'Email is already in use.' }
  }

  const user: User = {
    id: generateId(),
    name: name.trim(),
    email: normalizedEmail,
    password,
    createdAt: new Date().toISOString(),
  }

  users.push(user)
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  localStorage.setItem(STORAGE_KEYS.SESSION_USER_ID, user.id)
  localStorage.setItem(STORAGE_KEYS.LOGGED_IN, 'true')

  return { user }
}

export const loginUser = (email: string, password: string): { user: User | null; error?: string } => {
  const normalizedEmail = email.trim().toLowerCase()
  const user = getUsers().find((item) => item.email.toLowerCase() === normalizedEmail && item.password === password)

  if (!user) {
    return { user: null, error: 'Invalid email or password.' }
  }

  localStorage.setItem(STORAGE_KEYS.SESSION_USER_ID, user.id)
  localStorage.setItem(STORAGE_KEYS.LOGGED_IN, 'true')

  return { user }
}

export const logoutUser = (): void => {
  localStorage.removeItem(STORAGE_KEYS.SESSION_USER_ID)
  localStorage.setItem(STORAGE_KEYS.LOGGED_IN, 'false')
}

export const getProfiles = (): Profile[] => {
  const profiles = localStorage.getItem(STORAGE_KEYS.PROFILES)
  return profiles ? JSON.parse(profiles) : []
}

export const getProfilesByOwner = (ownerId: string): Profile[] => {
  return getProfiles().filter((profile) => profile.ownerId === ownerId)
}

export const getProfile = (publicId: string): Profile | null => {
  const profiles = getProfiles()
  return profiles.find((p) => p.publicId === publicId) || null
}

export const getProfileForOwner = (publicId: string, ownerId: string): Profile | null => {
  const profile = getProfile(publicId)
  if (!profile || profile.ownerId !== ownerId) {
    return null
  }

  return profile
}

export const createProfile = (templateType: TemplateType, data: any): { profile: Profile; tagId: string } => {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    throw new Error('Authentication required to create profiles.')
  }

  const profiles = getProfiles()
  const publicId = generateId()
  const tagId = generateId()

  const newProfile: Profile = {
    id: generateId(),
    publicId,
    tagId,
    ownerId: currentUser.id,
    tapCount: 0,
    templateType,
    data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
  }

  profiles.push(newProfile)
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles))

  const tagMappings = getTagMappings()
  tagMappings.push({ tagId, publicId })
  localStorage.setItem(STORAGE_KEYS.TAG_MAPPINGS, JSON.stringify(tagMappings))

  return { profile: newProfile, tagId }
}

export const updateProfile = (publicId: string, updates: Partial<any>): Profile | null => {
  const profiles = getProfiles()
  const index = profiles.findIndex((p) => p.publicId === publicId)

  if (index === -1) return null

  profiles[index] = {
    ...profiles[index],
    ...updates,
    data: updates.data ? { ...profiles[index].data, ...updates.data } : profiles[index].data,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles))
  return profiles[index]
}

export const updateOwnedProfile = (ownerId: string, publicId: string, updates: Partial<any>): Profile | null => {
  const profile = getProfileForOwner(publicId, ownerId)
  if (!profile) {
    return null
  }

  return updateProfile(publicId, updates)
}

export const incrementProfileTapCount = (publicId: string): Profile | null => {
  const profile = getProfile(publicId)
  if (!profile) {
    return null
  }

  const nextTapCount = (profile.tapCount || 0) + 1
  return updateProfile(publicId, { tapCount: nextTapCount })
}

export const deleteProfile = (publicId: string): boolean => {
  const profiles = getProfiles()
  const filteredProfiles = profiles.filter((p) => p.publicId !== publicId)

  if (filteredProfiles.length === profiles.length) return false

  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(filteredProfiles))

  const profile = profiles.find((p) => p.publicId === publicId)
  if (profile) {
    const tagMappings = getTagMappings()
    const filteredMappings = tagMappings.filter((m) => m.publicId !== publicId)
    localStorage.setItem(STORAGE_KEYS.TAG_MAPPINGS, JSON.stringify(filteredMappings))
  }

  return true
}

export const getTagMappings = (): TagMapping[] => {
  const mappings = localStorage.getItem(STORAGE_KEYS.TAG_MAPPINGS)
  return mappings ? JSON.parse(mappings) : []
}

export const getTagMapping = (tagId: string): TagMapping | null => {
  const mappings = getTagMappings()
  return mappings.find((m) => m.tagId === tagId) || null
}

export const mapTagToProfile = (tagId: string, publicId: string): void => {
  const mappings = getTagMappings()
  const existingIndex = mappings.findIndex((m) => m.tagId === tagId)

  if (existingIndex >= 0) {
    mappings[existingIndex] = { tagId, publicId }
  } else {
    mappings.push({ tagId, publicId })
  }

  localStorage.setItem(STORAGE_KEYS.TAG_MAPPINGS, JSON.stringify(mappings))
}

export const validateClaimCode = (code: string): boolean => {
  const codes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLAIM_CODES) || '[]')
  return codes.includes(code.toUpperCase())
}

// Backward-compatible wrappers used by older parts of the app.
export const setLoggedIn = (loggedIn: boolean): void => {
  localStorage.setItem(STORAGE_KEYS.LOGGED_IN, JSON.stringify(loggedIn))
}

export const isLoggedIn = (): boolean => {
  return Boolean(getCurrentUser())
}
