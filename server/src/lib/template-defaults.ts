export interface TemplateDefaultLink {
  type: string;
  label: string;
  url: string;
}

export interface TemplateDefaults {
  fields: Record<string, string>;
  links: TemplateDefaultLink[];
}

const defaultCafeMenuSectionsJson = JSON.stringify([
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
]);

const templateDefaults: Record<string, TemplateDefaults> = {
  individual: {
    fields: {
      name: "Alex Rivera",
      title: "Product Designer",
      company: "Designly Studio",
      location: "San Francisco, CA",
      bio: "Creating digital experiences that people love.",
    },
    links: [
      { type: "linkedin", label: "LinkedIn", url: "" },
      { type: "website", label: "Portfolio", url: "" },
      { type: "email", label: "Email Me", url: "" },
    ],
  },
  business: {
    fields: {
      name: "Designly Studio",
      category: "Brand & UX Agency",
      tagline: "We craft brands that people love.",
      city: "San Francisco, CA",
      bio: "Tell visitors what your business does and why it stands out.",
    },
    links: [
      { type: "website", label: "Our Website", url: "" },
      { type: "phone", label: "Call Us", url: "" },
      { type: "website", label: "Get Directions", url: "" },
    ],
  },
  pet: {
    fields: {
      name: "Buddy",
      species: "Dog",
      breed: "Golden Retriever",
      age: "3 years old",
      isLost: "false",
      ownerName: "Jamie Rivera",
      ownerPhone: "",
    },
    links: [
      { type: "phone", label: "Call Owner", url: "" },
      { type: "phone", label: "My Vet", url: "" },
      { type: "instagram", label: "My Instagram", url: "" },
    ],
  },
  cafe: {
    fields: {
      name: "The Bean House",
      cuisine: "Coffee & Brunch",
      tagline: "Your neighbourhood third place.",
      hoursWeekday: "Mon-Fri: 7am - 7pm",
      hoursWeekend: "Sat-Sun: 8am - 5pm",
      address: "456 Union Street, San Francisco, CA",
      menuSections: defaultCafeMenuSectionsJson,
    },
    links: [
      { type: "website", label: "View Menu", url: "" },
      { type: "website", label: "Order Online", url: "" },
      { type: "website", label: "Reserve Table", url: "" },
    ],
  },
  event: {
    fields: {
      name: "TechConf 2026",
      type: "Conference",
      date: "March 15, 2026 - 9:00 AM",
      venueName: "Moscone Center",
      address: "747 Howard St, San Francisco, CA",
    },
    links: [
      { type: "website", label: "Get Tickets", url: "" },
      { type: "website", label: "View Schedule", url: "" },
      { type: "website", label: "Venue Map", url: "" },
    ],
  },
  creator: {
    fields: {
      name: "Maya Lee",
      creativeType: "Illustrator / Designer",
      location: "Los Angeles, CA",
      status: "Open for commissions",
      bio: "Creative professional sharing work, links, and booking details.",
    },
    links: [
      { type: "website", label: "Portfolio", url: "" },
      { type: "youtube", label: "YouTube", url: "" },
      { type: "email", label: "Hire Me", url: "" },
    ],
  },
};

export function normalizeTemplateType(templateType: string): string {
  return (templateType || "individual").trim().toLowerCase();
}

export function getTemplateDefaults(templateType: string): TemplateDefaults {
  const normalized = normalizeTemplateType(templateType);
  return templateDefaults[normalized] ?? templateDefaults.individual;
}
