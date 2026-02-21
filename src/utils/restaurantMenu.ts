import { RestaurantMenuItem, RestaurantMenuSection } from '../types'

export const DEFAULT_RESTAURANT_SECTIONS = [
  { id: 'main', name: 'Main' },
  { id: 'appetizers', name: 'Appetizers' },
  { id: 'drinks', name: 'Drinks' },
  { id: 'desserts', name: 'Desserts' },
] as const

export const createDefaultRestaurantSections = (): RestaurantMenuSection[] =>
  DEFAULT_RESTAURANT_SECTIONS.map((section) => ({
    id: section.id,
    name: section.name,
    items: [],
  }))

const normalizeMenuItem = (item: any): RestaurantMenuItem => ({
  name: item?.name || '',
  price: item?.price || '',
  description: item?.description || '',
  photo: item?.photo || '',
})

export const normalizeRestaurantSections = (data: any): RestaurantMenuSection[] => {
  if (Array.isArray(data?.menuSections) && data.menuSections.length > 0) {
    return data.menuSections.map((section: any, index: number) => ({
      id: section?.id || `custom-${index}`,
      name: section?.name || `Section ${index + 1}`,
      items: Array.isArray(section?.items) ? section.items.map(normalizeMenuItem) : [],
    }))
  }

  if (Array.isArray(data?.menuItems) && data.menuItems.length > 0) {
    const sections = createDefaultRestaurantSections()
    sections[0].items = data.menuItems.map(normalizeMenuItem)
    return sections
  }

  return createDefaultRestaurantSections()
}
