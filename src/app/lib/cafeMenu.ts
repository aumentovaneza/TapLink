export interface CafeMenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
}

export interface CafeMenuSection {
  id: string;
  name: string;
  items: CafeMenuItem[];
}

interface ParseCafeMenuOptions {
  fallbackToDefault?: boolean;
}

const DEFAULT_CAFE_MENU_SECTIONS: CafeMenuSection[] = [
  {
    id: "appetizers",
    name: "Appetizers",
    items: [
      { id: "appetizers-1", name: "Truffle Fries", description: "Crispy fries, truffle oil, parmesan.", price: "$9" },
      { id: "appetizers-2", name: "Bruschetta", description: "Tomato basil, olive oil, toasted sourdough.", price: "$8" },
    ],
  },
  {
    id: "mains",
    name: "Mains",
    items: [
      { id: "mains-1", name: "Mushroom Pasta", description: "Creamy garlic sauce, roasted mushrooms.", price: "$16" },
      { id: "mains-2", name: "Grilled Salmon Bowl", description: "Citrus salmon, greens, brown rice.", price: "$19" },
    ],
  },
  {
    id: "drinks",
    name: "Drinks",
    items: [
      { id: "drinks-1", name: "House Latte", description: "Single-origin espresso, steamed milk.", price: "$5" },
      { id: "drinks-2", name: "Iced Matcha", description: "Ceremonial matcha, oat milk, light sweetener.", price: "$6" },
    ],
  },
  {
    id: "desserts",
    name: "Desserts",
    items: [
      { id: "desserts-1", name: "Tiramisu", description: "Espresso-soaked ladyfingers, mascarpone cream.", price: "$8" },
      { id: "desserts-2", name: "Basque Cheesecake", description: "Burnt top, creamy center, berry compote.", price: "$9" },
    ],
  },
];

function cloneDefaultSections(): CafeMenuSection[] {
  return DEFAULT_CAFE_MENU_SECTIONS.map((section) => ({
    id: section.id,
    name: section.name,
    items: section.items.map((item) => ({ ...item })),
  }));
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseItem(value: unknown, fallbackId: string): CafeMenuItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, unknown>;
  const name = asString(source.name);
  const description = asString(source.description);
  const price = asString(source.price);

  if (!name && !description && !price) {
    return null;
  }

  return {
    id: asString(source.id) || fallbackId,
    name,
    description,
    price,
  };
}

function parseSection(value: unknown, sectionIndex: number): CafeMenuSection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, unknown>;
  const name = asString(source.name) || asString(source.title) || `Section ${sectionIndex + 1}`;
  const sectionId = asString(source.id) || `section-${sectionIndex + 1}`;
  const itemsSource = Array.isArray(source.items) ? source.items : [];
  const items = itemsSource
    .map((item, itemIndex) => parseItem(item, `${sectionId}-item-${itemIndex + 1}`))
    .filter((item): item is CafeMenuItem => Boolean(item));

  if (!name && items.length === 0) {
    return null;
  }

  return {
    id: sectionId,
    name,
    items,
  };
}

export function parseCafeMenuSections(raw: string | null | undefined, options: ParseCafeMenuOptions = {}): CafeMenuSection[] {
  const { fallbackToDefault = true } = options;

  if (!raw || !raw.trim()) {
    return fallbackToDefault ? cloneDefaultSections() : [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return fallbackToDefault ? cloneDefaultSections() : [];
    }

    const sections = parsed
      .map((section, sectionIndex) => parseSection(section, sectionIndex))
      .filter((section): section is CafeMenuSection => Boolean(section));

    if (sections.length === 0) {
      return fallbackToDefault ? cloneDefaultSections() : [];
    }

    return sections;
  } catch {
    return fallbackToDefault ? cloneDefaultSections() : [];
  }
}

export function serializeCafeMenuSections(sections: CafeMenuSection[]): string {
  const normalized = sections
    .map((section, sectionIndex) => {
      const sectionName = section.name.trim();
      const sectionId = section.id.trim() || `section-${sectionIndex + 1}`;
      const items = section.items
        .map((item, itemIndex) => {
          const name = item.name.trim();
          const description = item.description.trim();
          const price = item.price.trim();

          if (!name && !description && !price) {
            return null;
          }

          return {
            id: item.id.trim() || `${sectionId}-item-${itemIndex + 1}`,
            name,
            description,
            price,
          };
        })
        .filter((item): item is { id: string; name: string; description: string; price: string } => Boolean(item));

      if (!sectionName && items.length === 0) {
        return null;
      }

      return {
        id: sectionId,
        name: sectionName || `Section ${sectionIndex + 1}`,
        items,
      };
    })
    .filter(
      (section): section is { id: string; name: string; items: { id: string; name: string; description: string; price: string }[] } =>
        Boolean(section)
    );

  return JSON.stringify(normalized);
}

export function getDefaultCafeMenuSections(): CafeMenuSection[] {
  return cloneDefaultSections();
}

export function getDefaultCafeMenuSectionsJson(): string {
  return serializeCafeMenuSections(cloneDefaultSections());
}
