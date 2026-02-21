export type TemplateType = 'pet' | 'business' | 'personal' | 'restaurant'

export interface RestaurantMenuItem {
  name: string
  price: string
  description: string
  photo?: string
}

export interface RestaurantMenuSection {
  id: string
  name: string
  items: RestaurantMenuItem[]
}

export interface PetProfile {
  petName: string
  ownerName: string
  emergencyContact: string
  medicalNotes: string
  photo?: string
}

export interface BusinessProfile {
  businessName: string
  description: string
  contactNumber: string
  address: string
  socialLinks: Array<{ label: string; url: string }>
}

export interface PersonalProfile {
  name: string
  bio: string
  phone: string
  email: string
  portfolioLink: string
}

export interface RestaurantProfile {
  restaurantName: string
  menuItems?: RestaurantMenuItem[]
  menuSections?: RestaurantMenuSection[]
  location: string
  hours: string
}

export type ProfileData = PetProfile | BusinessProfile | PersonalProfile | RestaurantProfile

export interface Profile {
  id: string
  publicId: string
  tagId: string
  ownerId?: string
  tapCount?: number
  templateType: TemplateType
  data: ProfileData
  createdAt: string
  updatedAt: string
  status: 'active' | 'disabled'
}

export interface TagMapping {
  tagId: string
  publicId: string
}

export interface User {
  id: string
  email: string
  password: string
  name: string
  createdAt: string
}

export interface ScanEvent {
  id: string
  profilePublicId: string
  tagId: string
  scannerUserId?: string
  scannerName?: string
  scannerEmail?: string
  scannerPhone?: string
  scannerNotes?: string
  consentContact: boolean
  consentLocation: boolean
  latitude?: number
  longitude?: number
  locationLabel?: string
  userAgent?: string
  createdAt: string
}
