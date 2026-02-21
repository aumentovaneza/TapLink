import { useState, useEffect, ChangeEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { createProfile, getCurrentUser, getProfileForOwner, updateOwnedProfile } from '../services/dataLayer'
import { TemplateType } from '../types'
import FormField from '../components/FormField'
import PreviewCard from '../components/PreviewCard'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Divider from '../components/ui/Divider'
import Input from '../components/ui/Input'
import PagePreview from '../components/PagePreview'
import Textarea from '../components/ui/Textarea'
import ThemePicker from '../components/ThemePicker'
import { useTheme } from '../theme/useTheme'
import { setThemeForTagAndPublic } from '../theme/themes'
import { DEFAULT_RESTAURANT_SECTIONS, createDefaultRestaurantSections, normalizeRestaurantSections } from '../utils/restaurantMenu'

const ProfileEditor = () => {
  const { templateType, publicId } = useParams<{ templateType: TemplateType; publicId?: string }>()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const nextPath = publicId ? `/editor/${templateType}/edit/${publicId}` : `/editor/${templateType}`

  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [profileData, setProfileData] = useState<any>({})
  const [createdProfile, setCreatedProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/login', { state: { next: nextPath } })
      return
    }

    if (!templateType) {
      return
    }

    if (publicId) {
      const existingProfile = getProfileForOwner(publicId, currentUser.id)
      if (!existingProfile) {
        navigate('/my-tags')
        return
      }

      setIsEditing(true)
      if (templateType === 'restaurant') {
        const existingData = existingProfile.data as any
        setProfileData({
          ...existingData,
          menuSections: normalizeRestaurantSections(existingData),
        })
      } else {
        setProfileData(existingProfile.data || getInitialData(templateType))
      }
    } else {
      setIsEditing(false)
      setProfileData(getInitialData(templateType))
    }
  }, [templateType, publicId, navigate, nextPath])

  const getInitialData = (type: TemplateType) => {
    switch (type) {
      case 'pet':
        return {
          petName: '',
          ownerName: '',
          emergencyContact: '',
          medicalNotes: '',
          photo: '',
        }
      case 'business':
        return {
          businessName: '',
          description: '',
          contactNumber: '',
          address: '',
          socialLinks: [],
          photo: '',
        }
      case 'personal':
        return {
          name: '',
          bio: '',
          phone: '',
          email: '',
          portfolioLink: '',
          photo: '',
        }
      case 'restaurant':
        return {
          restaurantName: '',
          menuSections: createDefaultRestaurantSections(),
          location: '',
          hours: '',
          photo: '',
        }
      default:
        return {}
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    setProfileData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSocialLinkChange = (index: number, field: 'label' | 'url', value: string) => {
    const updatedLinks = [...(profileData.socialLinks || [])]
    if (!updatedLinks[index]) {
      updatedLinks[index] = { label: '', url: '' }
    }
    updatedLinks[index][field] = value
    setProfileData((prev: any) => ({ ...prev, socialLinks: updatedLinks }))
  }

  const addSocialLink = () => {
    const updatedLinks = [...(profileData.socialLinks || []), { label: '', url: '' }]
    setProfileData((prev: any) => ({ ...prev, socialLinks: updatedLinks }))
  }

  const removeSocialLink = (index: number) => {
    const updatedLinks = (profileData.socialLinks || []).filter((_: any, i: number) => i !== index)
    setProfileData((prev: any) => ({ ...prev, socialLinks: updatedLinks }))
  }

  const handleMenuItemChange = (
    sectionIndex: number,
    itemIndex: number,
    field: 'name' | 'price' | 'description' | 'photo',
    value: string,
  ) => {
    const updatedSections = [...(profileData.menuSections || createDefaultRestaurantSections())]
    if (!updatedSections[sectionIndex]) {
      return
    }

    const updatedItems = [...(updatedSections[sectionIndex].items || [])]
    if (!updatedItems[itemIndex]) {
      updatedItems[itemIndex] = { name: '', price: '', description: '', photo: '' }
    }

    updatedItems[itemIndex][field] = value
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      items: updatedItems,
    }

    setProfileData((prev: any) => ({ ...prev, menuSections: updatedSections }))
  }

  const addMenuItem = (sectionIndex: number) => {
    const updatedSections = [...(profileData.menuSections || createDefaultRestaurantSections())]
    if (!updatedSections[sectionIndex]) {
      return
    }

    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      items: [...(updatedSections[sectionIndex].items || []), { name: '', price: '', description: '', photo: '' }],
    }
    setProfileData((prev: any) => ({ ...prev, menuSections: updatedSections }))
  }

  const removeMenuItem = (sectionIndex: number, itemIndex: number) => {
    const updatedSections = [...(profileData.menuSections || createDefaultRestaurantSections())]
    if (!updatedSections[sectionIndex]) {
      return
    }

    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      items: (updatedSections[sectionIndex].items || []).filter((_: any, index: number) => index !== itemIndex),
    }
    setProfileData((prev: any) => ({ ...prev, menuSections: updatedSections }))
  }

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setProfileData((prev: any) => ({ ...prev, photo: result }))
    }
    reader.readAsDataURL(file)
  }

  const handleMenuItemPhotoUpload = (sectionIndex: number, itemIndex: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      handleMenuItemChange(sectionIndex, itemIndex, 'photo', result)
    }
    reader.readAsDataURL(file)
  }

  const addCustomSection = () => {
    const nextSections = [...(profileData.menuSections || createDefaultRestaurantSections())]
    const nextId = `custom-${Date.now()}`
    nextSections.push({
      id: nextId,
      name: 'Custom Section',
      items: [],
    })
    setProfileData((prev: any) => ({ ...prev, menuSections: nextSections }))
  }

  const updateSectionName = (sectionIndex: number, name: string) => {
    const nextSections = [...(profileData.menuSections || createDefaultRestaurantSections())]
    if (!nextSections[sectionIndex]) return
    nextSections[sectionIndex] = {
      ...nextSections[sectionIndex],
      name,
    }
    setProfileData((prev: any) => ({ ...prev, menuSections: nextSections }))
  }

  const removeCustomSection = (sectionIndex: number) => {
    const nextSections = [...(profileData.menuSections || createDefaultRestaurantSections())]
    const section = nextSections[sectionIndex]
    if (!section) return
    const isDefault = DEFAULT_RESTAURANT_SECTIONS.some((defaultSection) => defaultSection.id === section.id)
    if (isDefault) return

    nextSections.splice(sectionIndex, 1)
    setProfileData((prev: any) => ({ ...prev, menuSections: nextSections }))
  }

  const handleSave = async () => {
    if (!templateType) {
      return
    }

    setIsSaving(true)
    try {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        navigate('/login', { state: { next: nextPath } })
        return
      }

      if (publicId) {
        const updatedProfile = updateOwnedProfile(currentUser.id, publicId, {
          data: { ...profileData, theme },
        })

        if (!updatedProfile) {
          navigate('/my-tags')
          return
        }

        setThemeForTagAndPublic(theme, updatedProfile.tagId, updatedProfile.publicId)
        setCreatedProfile(updatedProfile)
      } else {
        const result = createProfile(templateType, { ...profileData, theme })
        setThemeForTagAndPublic(theme, result.profile.tagId, result.profile.publicId)
        setCreatedProfile(result.profile)
      }

      setSaveSuccess(true)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const renderProfileSections = () => {
    switch (templateType) {
      case 'pet':
        return (
          <>
            <FormField
              label="Pet Name"
              name="petName"
              value={profileData.petName || ''}
              onChange={(value) => handleFieldChange('petName', value)}
              required
            />
            <FormField
              label="Owner Name"
              name="ownerName"
              value={profileData.ownerName || ''}
              onChange={(value) => handleFieldChange('ownerName', value)}
              required
            />
            <FormField
              label="Emergency Contact"
              name="emergencyContact"
              value={profileData.emergencyContact || ''}
              onChange={(value) => handleFieldChange('emergencyContact', value)}
              required
            />
            <Divider />
            <FormField
              label="Medical Notes"
              name="medicalNotes"
              type="textarea"
              value={profileData.medicalNotes || ''}
              onChange={(value) => handleFieldChange('medicalNotes', value)}
              rows={4}
            />
          </>
        )
      case 'business':
        return (
          <>
            <FormField
              label="Business Name"
              name="businessName"
              value={profileData.businessName || ''}
              onChange={(value) => handleFieldChange('businessName', value)}
              required
            />
            <FormField
              label="Description"
              name="description"
              type="textarea"
              value={profileData.description || ''}
              onChange={(value) => handleFieldChange('description', value)}
              rows={3}
            />
            <FormField
              label="Contact Number"
              name="contactNumber"
              value={profileData.contactNumber || ''}
              onChange={(value) => handleFieldChange('contactNumber', value)}
              required
            />
            <FormField
              label="Address"
              name="address"
              value={profileData.address || ''}
              onChange={(value) => handleFieldChange('address', value)}
              required
            />

            <Divider />
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[var(--theme-text)]">Social Links</p>
              {(profileData.socialLinks || []).map((link: any, index: number) => (
                <div key={index} className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-accent)_18%,transparent)] p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <Input
                      type="text"
                      placeholder="Label"
                      value={link.label || ''}
                      onChange={(e) => handleSocialLinkChange(index, 'label', e.target.value)}
                    />
                    <Input
                      type="url"
                      placeholder="URL"
                      value={link.url || ''}
                      onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                    />
                    <Button variant="outline" onClick={() => removeSocialLink(index)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="secondary" onClick={addSocialLink}>
                Add Social Link
              </Button>
            </div>
          </>
        )
      case 'personal':
        return (
          <>
            <FormField
              label="Name"
              name="name"
              value={profileData.name || ''}
              onChange={(value) => handleFieldChange('name', value)}
              required
            />
            <FormField
              label="Bio"
              name="bio"
              type="textarea"
              value={profileData.bio || ''}
              onChange={(value) => handleFieldChange('bio', value)}
              rows={3}
            />
            <FormField
              label="Phone"
              name="phone"
              type="tel"
              value={profileData.phone || ''}
              onChange={(value) => handleFieldChange('phone', value)}
              required
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={profileData.email || ''}
              onChange={(value) => handleFieldChange('email', value)}
              required
            />
            <FormField
              label="Portfolio Link"
              name="portfolioLink"
              type="url"
              value={profileData.portfolioLink || ''}
              onChange={(value) => handleFieldChange('portfolioLink', value)}
            />
          </>
        )
      case 'restaurant':
        return (
          <>
            <FormField
              label="Restaurant Name"
              name="restaurantName"
              value={profileData.restaurantName || ''}
              onChange={(value) => handleFieldChange('restaurantName', value)}
              required
            />
            <FormField
              label="Location"
              name="location"
              value={profileData.location || ''}
              onChange={(value) => handleFieldChange('location', value)}
              required
            />
            <FormField
              label="Hours"
              name="hours"
              value={profileData.hours || ''}
              onChange={(value) => handleFieldChange('hours', value)}
              placeholder="Mon-Fri 9AM-9PM"
              required
            />

            <Divider />
            <div className="space-y-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--theme-text)]">Menu Sections</p>
                <Button type="button" variant="secondary" onClick={addCustomSection}>
                  Add Custom Section
                </Button>
              </div>
              {(profileData.menuSections || createDefaultRestaurantSections()).map((section: any, sectionIndex: number) => {
                const isDefault = DEFAULT_RESTAURANT_SECTIONS.some((defaultSection) => defaultSection.id === section.id)

                return (
                  <div key={section.id || sectionIndex} className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-accent)_18%,transparent)] p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Input
                        type="text"
                        value={section.name || ''}
                        onChange={(e) => updateSectionName(sectionIndex, e.target.value)}
                        className="flex-1"
                        disabled={isDefault}
                      />
                      {!isDefault ? (
                        <Button type="button" variant="outline" onClick={() => removeCustomSection(sectionIndex)}>
                          Remove Section
                        </Button>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      {(section.items || []).map((item: any, itemIndex: number) => (
                        <div
                          key={`${section.id || sectionIndex}-item-${itemIndex}`}
                          className="rounded-2xl border border-[color-mix(in_srgb,var(--theme-accent)_12%,transparent)] p-3"
                        >
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Input
                              type="text"
                              placeholder="Item name"
                              value={item.name || ''}
                              onChange={(e) => handleMenuItemChange(sectionIndex, itemIndex, 'name', e.target.value)}
                            />
                            <Input
                              type="text"
                              placeholder="Price"
                              value={item.price || ''}
                              onChange={(e) => handleMenuItemChange(sectionIndex, itemIndex, 'price', e.target.value)}
                            />
                          </div>
                          <Textarea
                            className="mt-2"
                            placeholder="Description"
                            value={item.description || ''}
                            onChange={(e) => handleMenuItemChange(sectionIndex, itemIndex, 'description', e.target.value)}
                            rows={2}
                          />
                          <div className="mt-2">
                            <label
                              className="mb-1 block text-xs font-medium text-[var(--theme-muted)]"
                              htmlFor={`menu-photo-${sectionIndex}-${itemIndex}`}
                            >
                              Menu Item Photo
                            </label>
                            <input
                              id={`menu-photo-${sectionIndex}-${itemIndex}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleMenuItemPhotoUpload(sectionIndex, itemIndex, e)}
                              className="w-full rounded-xl border border-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--theme-card)_90%,white)] px-3 py-2 text-sm text-[var(--theme-text)]"
                            />
                            {item.photo ? (
                              <div className="mt-2 flex items-center gap-3">
                                <img
                                  src={item.photo}
                                  alt={item.name || `Menu item ${itemIndex + 1}`}
                                  className="h-14 w-14 rounded-lg object-cover"
                                />
                                <Button
                                  type="button"
                                  className="px-3 py-2 text-xs"
                                  variant="outline"
                                  onClick={() => handleMenuItemChange(sectionIndex, itemIndex, 'photo', '')}
                                >
                                  Remove Photo
                                </Button>
                              </div>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            className="mt-2"
                            variant="outline"
                            onClick={() => removeMenuItem(sectionIndex, itemIndex)}
                          >
                            Remove Item
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button type="button" className="mt-3" variant="secondary" onClick={() => addMenuItem(sectionIndex)}>
                      Add Item to {section.name || 'Section'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </>
        )
      default:
        return <p className="text-sm text-[var(--theme-muted)]">Unknown template type.</p>
    }
  }

  if (saveSuccess && createdProfile) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-10">
        <Card className="w-full text-center">
          <h2 className="text-2xl font-semibold text-[var(--theme-text)]">{isEditing ? 'Profile Updated' : 'Profile Created'}</h2>
          <p className="mt-2 text-sm text-[var(--theme-muted)]">
            {isEditing ? 'Your changes are now live.' : 'Your TapLink profile is ready to share.'}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => navigate(`/t/${createdProfile.tagId}`)}>Simulate Tag Tap</Button>
            <Button variant="outline" onClick={() => navigate(`/p/${createdProfile.publicId}`)}>
              View Public Profile
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link to="/my-tags" className="inline-block">
          <Button variant="outline">Back to My Tags</Button>
        </Link>
      </div>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--theme-accent)]">Profile Editor</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--theme-text)]">
          {isEditing ? 'Edit' : 'Create'} {templateType?.charAt(0).toUpperCase()}
          {templateType?.slice(1)} profile
        </h1>
        <p className="mt-2 text-sm text-[var(--theme-muted)]">Fill the form and preview the final mobile profile in real time.</p>
      </div>

      <Card className="mb-5">
        <ThemePicker compact />
      </Card>

      <div className="mb-4 flex items-center justify-between lg:hidden">
        <Button variant="secondary" onClick={() => setShowPreview(false)}>
          Edit
        </Button>
        <Button variant="secondary" onClick={() => setShowPreview(true)}>
          Preview
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className={`${showPreview ? 'hidden lg:block' : 'block'}`}>
          <form onSubmit={(event) => {
            event.preventDefault()
            handleSave()
          }}>
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-[var(--theme-text)]" htmlFor="photoUpload">
                Profile Photo
              </label>
              <input
                id="photoUpload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="w-full rounded-xl border border-[color-mix(in_srgb,var(--theme-accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--theme-card)_90%,white)] px-3 py-2 text-sm text-[var(--theme-text)]"
              />
              {profileData.photo ? (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={profileData.photo}
                    alt="Profile preview"
                    className="h-12 w-12 rounded-full border border-white/70 object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="px-3 py-2 text-xs"
                    onClick={() => handleFieldChange('photo', '')}
                  >
                    Remove Photo
                  </Button>
                </div>
              ) : null}
            </div>
            {renderProfileSections()}
            <div className="sticky bottom-3 z-20 mt-6 rounded-2xl bg-[color-mix(in_srgb,var(--theme-card)_88%,white)]/95 p-2 backdrop-blur">
              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? 'Saving...' : isEditing ? 'Update Profile' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className={`${showPreview ? 'block' : 'hidden lg:block'}`}>
          <h3 className="mb-4 text-lg font-semibold text-[var(--theme-text)]">Live Preview</h3>
          <PagePreview>
            {templateType && profileData ? (
              <PreviewCard
                profile={{
                  id: 'preview',
                  publicId: 'preview',
                  tagId: 'preview',
                  templateType: templateType as TemplateType,
                  data: profileData,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  status: 'active',
                }}
              />
            ) : null}
          </PagePreview>
        </Card>
      </div>
    </div>
  )
}

export default ProfileEditor
