import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import {
  Save, Upload, Plus, Trash2, GripVertical, Globe, Linkedin,
  Twitter, Instagram, Github, Mail, Phone, Youtube, ArrowLeft,
  Check, AlertCircle, Eye, Paintbrush, User, Link2, ChevronDown,
  Zap, Camera, Building2, PawPrint, Coffee, Calendar,
  ShoppingBag, Layers, ChevronRight, X, MapPin, Clock,
  Heart, Ticket, Mic2, Star, Info, ChevronUp, Sparkles
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { themes, getTheme, suggestedThemes, palettes, getGradient } from "../data/themes";
import { ApiError, apiRequest } from "../lib/api";
import {
  type CafeMenuSection,
  getDefaultCafeMenuSections,
  getDefaultCafeMenuSectionsJson,
  parseCafeMenuSections,
  serializeCafeMenuSections,
} from "../lib/cafeMenu";
import {
  PHOTO_MAX_SOURCE_BYTES,
  PHOTO_TARGET_UPLOAD_BYTES,
  PHOTO_UPLOAD_ACCEPT,
  optimizePhotoForUpload,
} from "../lib/photoUpload";
import { clearAccessToken, getAccessToken } from "../lib/session";

// ── Photos ────────────────────────────────────────────────────────────────────
const DEFAULT_PHOTO  = "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";
const DEFAULT_DOG    = "https://images.unsplash.com/photo-1721656363841-93e97a879979?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nJTIwZ29sZGVuJTIwcmV0cmlldmVyJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNzU1NzEwfDA&ixlib=rb-4.1.0&q=80&w=1080";
const DEFAULT_CAFE   = "https://images.unsplash.com/photo-1593536488177-1eb3c2d4e3d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwY2FmZSUyMGNvZmZlZSUyMHNob3AlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzE3NTU3MTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const DEFAULT_BIZ    = "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHByb2Zlc3Npb25hbCUyMHN1aXQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE3NTMwOTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const DEFAULT_MUSIC  = "https://images.unsplash.com/photo-1771191057577-e216395637a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGFydGlzdCUyMHBlcmZvcm1lciUyMHN0YWdlfGVufDF8fHx8MTc3MTc1NTcxNHww&ixlib=rb-4.1.0&q=80&w=1080";
const DEFAULT_EVENT  = "https://images.unsplash.com/photo-1761223976145-a85ffe11fc57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVudCUyMGNvbmZlcmVuY2UlMjBzdGFnZSUyMHNldHVwfGVufDF8fHx8MTc3MTc1NTcxNHww&ixlib=rb-4.1.0&q=80&w=1080";

// ── Field definitions per template ────────────────────────────────────────────
type FieldType = "text" | "email" | "tel" | "url" | "textarea" | "select" | "toggle";

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
  hint?: string;
  maxLength?: number;
  icon?: typeof Globe;
}

interface SectionDef {
  id: string;
  title: string;
  icon: typeof User;
  color?: string;
  fields: FieldDef[];
  collapsible?: boolean;
}

// ── Per-template field schemas ─────────────────────────────────────────────────
const templateSections: Record<string, SectionDef[]> = {
  individual: [
    {
      id: "identity", title: "Identity", icon: User, color: "#DC2626",
      fields: [
        { key: "name",      label: "Full Name",          placeholder: "Alex Rivera",              required: true },
        { key: "title",     label: "Job Title",           placeholder: "Product Designer",          required: true },
        { key: "company",   label: "Company / Studio",    placeholder: "Designly Studio" },
        { key: "location",  label: "Location",            placeholder: "San Francisco, CA",         icon: MapPin },
      ],
    },
    {
      id: "bio", title: "About", icon: Info, color: "#EA580C",
      fields: [
        { key: "bio", label: "Bio", type: "textarea", placeholder: "A short intro about yourself — what you do, what you love, what you're working on.", maxLength: 200 },
        { key: "pronouns", label: "Pronouns (optional)", placeholder: "he/him · she/her · they/them" },
      ],
    },
    {
      id: "contact", title: "Contact", icon: Phone, color: "#FBBF24", collapsible: true,
      fields: [
        { key: "email",   label: "Email Address", type: "email", placeholder: "alex@example.com",  icon: Mail },
        { key: "phone",   label: "Phone Number",  type: "tel",   placeholder: "+1 (555) 000-0000",  icon: Phone },
        { key: "website", label: "Website / Portfolio", type: "url", placeholder: "https://alexrivera.design", icon: Globe },
      ],
    },
  ],

  business: [
    {
      id: "brand", title: "Business Info", icon: Building2, color: "#0EA5E9",
      fields: [
        { key: "name",       label: "Business Name",       placeholder: "Designly Studio",          required: true },
        { key: "category",   label: "Category / Industry", placeholder: "Brand & UX Agency",        required: true },
        { key: "tagline",    label: "Tagline",              placeholder: "We craft brands that people love." },
        { key: "bio",        label: "About / Description",  type: "textarea", placeholder: "Tell visitors what makes your business special.", maxLength: 250 },
      ],
    },
    {
      id: "location", title: "Location & Hours", icon: MapPin, color: "#10B981",
      fields: [
        { key: "address",    label: "Street Address",       placeholder: "123 Market St, Suite 400", icon: MapPin },
        { key: "city",       label: "City & State",         placeholder: "San Francisco, CA" },
        { key: "hours",      label: "Opening Hours",        placeholder: "Mon–Fri: 9am – 6pm",       icon: Clock },
        { key: "closedOn",   label: "Closed On",            placeholder: "Weekends & Public Holidays" },
      ],
    },
    {
      id: "contact", title: "Contact", icon: Phone, color: "#0EA5E9", collapsible: true,
      fields: [
        { key: "phone",   label: "Phone Number",   type: "tel",   placeholder: "+1 (415) 000-0000", icon: Phone },
        { key: "email",   label: "Business Email", type: "email", placeholder: "hello@designly.studio", icon: Mail },
        { key: "website", label: "Website",        type: "url",   placeholder: "https://designly.studio", icon: Globe },
      ],
    },
  ],

  pet: [
    {
      id: "petinfo", title: "Pet Details", icon: PawPrint, color: "#F59E0B",
      fields: [
        { key: "name",    label: "Pet's Name",  placeholder: "Buddy",          required: true },
        { key: "species", label: "Species",     type: "select", options: ["Dog", "Cat", "Bird", "Rabbit", "Hamster", "Fish", "Reptile", "Other"], placeholder: "Select species" },
        { key: "breed",   label: "Breed",       placeholder: "Golden Retriever" },
        { key: "age",     label: "Age",         placeholder: "3 years old" },
        { key: "gender",  label: "Gender",      type: "select", options: ["Male", "Female", "Unknown"], placeholder: "Select" },
        { key: "color",   label: "Coat / Color",placeholder: "Golden, fluffy" },
        { key: "bio",     label: "Fun Facts & Personality", type: "textarea", placeholder: "Loves belly rubs, scared of thunder, favourite toy is a squeaky duck…", maxLength: 200 },
        { key: "isLost",  label: "Pet is currently lost", type: "toggle", hint: "When enabled, the public profile will show a LOST alert and a report form for guests." },
      ],
    },
    {
      id: "health", title: "Health & ID", icon: Heart, color: "#EC4899", collapsible: true,
      fields: [
        { key: "microchip",    label: "Microchip Number",    placeholder: "985141002235813" },
        { key: "vaccStatus",   label: "Vaccination Status",  type: "select", options: ["Up to date", "Due soon", "Not vaccinated", "Unknown"] },
        { key: "vetName",      label: "Veterinarian Name",   placeholder: "Dr. Sarah Mills" },
        { key: "vetPhone",     label: "Vet Phone Number",    type: "tel", placeholder: "+1 (415) 555-0198", icon: Phone },
        { key: "medical",      label: "Medical Notes",       type: "textarea", placeholder: "Allergies, medications, or health conditions visitors should know about.", maxLength: 200 },
      ],
    },
    {
      id: "owner", title: "Owner & Emergency Contact", icon: Phone, color: "#EF4444",
      fields: [
        { key: "ownerName",    label: "Owner Name",           placeholder: "Jamie Rivera",     required: true },
        { key: "ownerPhone",   label: "Owner Phone",          type: "tel", placeholder: "+1 (415) 555-0100", required: true, icon: Phone },
        { key: "ownerEmail",   label: "Owner Email",          type: "email", placeholder: "jamie@example.com", icon: Mail },
        { key: "backupName",   label: "Backup Contact Name",  placeholder: "Morgan Rivera" },
        { key: "backupPhone",  label: "Backup Contact Phone", type: "tel", placeholder: "+1 (415) 555-0101", icon: Phone },
        { key: "homeAddress",  label: "Home Address",         placeholder: "789 Oak Ave, San Francisco, CA", icon: MapPin },
        { key: "reward",       label: "Reward Offered",       placeholder: "Yes — $50 reward for safe return" },
      ],
    },
  ],

  cafe: [
    {
      id: "place", title: "Place Info", icon: Coffee, color: "#92400E",
      fields: [
        { key: "name",     label: "Restaurant / Café Name", placeholder: "The Bean House",             required: true },
        { key: "cuisine",  label: "Cuisine / Type",         placeholder: "Coffee & Brunch",             required: true },
        { key: "tagline",  label: "Tagline",                placeholder: "Your neighbourhood third place." },
        { key: "bio",      label: "About",                  type: "textarea", placeholder: "Tell guests what makes this place special — the vibe, the story, the signature dish.", maxLength: 250 },
        { key: "rating",   label: "Rating (optional)",      placeholder: "4.8 ⭐ on Google" },
      ],
    },
    {
      id: "hours", title: "Hours & Location", icon: Clock, color: "#D97706",
      fields: [
        { key: "hoursWeekday", label: "Weekday Hours",         placeholder: "Mon – Fri: 7am – 7pm", icon: Clock },
        { key: "hoursWeekend", label: "Weekend Hours",         placeholder: "Sat – Sun: 8am – 5pm" },
        { key: "closedOn",     label: "Closed On",             placeholder: "Public holidays" },
        { key: "address",      label: "Address",               placeholder: "456 Union Street, San Francisco, CA", icon: MapPin },
        { key: "parking",      label: "Parking / Access",      placeholder: "Street parking available. 5 min from Bart." },
      ],
    },
    {
      id: "ordering", title: "Online Ordering & Booking", icon: Globe, color: "#10B981", collapsible: true,
      fields: [
        { key: "menuUrl",       label: "Menu URL",             type: "url", placeholder: "https://beanhouse.com/menu", icon: Globe },
        { key: "orderUrl",      label: "Online Order URL",     type: "url", placeholder: "https://order.beanhouse.com" },
        { key: "reserveUrl",    label: "Reservation URL",      type: "url", placeholder: "https://beanhouse.com/reserve" },
        { key: "deliveryApps",  label: "Delivery Apps",        placeholder: "Uber Eats, DoorDash, Grubhub" },
      ],
    },
    {
      id: "contact", title: "Contact", icon: Phone, color: "#92400E", collapsible: true,
      fields: [
        { key: "phone",    label: "Phone Number",  type: "tel",   placeholder: "+1 (415) 555-0200", icon: Phone },
        { key: "email",    label: "Email",         type: "email", placeholder: "hello@beanhouse.com", icon: Mail },
        { key: "website",  label: "Website",       type: "url",   placeholder: "https://beanhouse.com", icon: Globe },
      ],
    },
  ],

  event: [
    {
      id: "eventinfo", title: "Event Details", icon: Calendar, color: "#8B5CF6",
      fields: [
        { key: "name",       label: "Event Name",           placeholder: "TechConf 2026",             required: true },
        { key: "type",       label: "Event Type",           type: "select", options: ["Conference", "Meetup", "Party", "Wedding", "Concert", "Workshop", "Exhibition", "Sports", "Other"] },
        { key: "date",       label: "Date & Time",          placeholder: "March 15, 2026 · 9:00 AM",  required: true, icon: Calendar },
        { key: "endDate",    label: "End Date / Time",       placeholder: "March 15, 2026 · 6:00 PM" },
        { key: "bio",        label: "About This Event",     type: "textarea", placeholder: "What is this event about? Who is it for?", maxLength: 250 },
        { key: "dresscode",  label: "Dress Code",           placeholder: "Smart casual" },
      ],
    },
    {
      id: "venue", title: "Venue & Location", icon: MapPin, color: "#EC4899",
      fields: [
        { key: "venueName",  label: "Venue Name",           placeholder: "Moscone Center", icon: MapPin },
        { key: "address",    label: "Address",              placeholder: "747 Howard St, San Francisco, CA" },
        { key: "floor",      label: "Room / Floor",          placeholder: "Hall B · Level 2" },
        { key: "access",     label: "Getting There",         placeholder: "5 min walk from Powell St BART station." },
      ],
    },
    {
      id: "organizer", title: "Organiser", icon: User, color: "#8B5CF6", collapsible: true,
      fields: [
        { key: "organizer",  label: "Organiser Name",       placeholder: "TechEvents Inc." },
        { key: "orgEmail",   label: "Contact Email",        type: "email", placeholder: "hi@techconf.io", icon: Mail },
        { key: "orgPhone",   label: "Contact Phone",        type: "tel",   placeholder: "+1 (415) 000-0000", icon: Phone },
        { key: "website",    label: "Event Website",        type: "url",   placeholder: "https://techconf.io", icon: Globe },
      ],
    },
  ],

  creator: [
    {
      id: "creatorInfo", title: "Creator Info", icon: Sparkles, color: "#EC4899",
      fields: [
        { key: "name",         label: "Name / Project / Brand",   placeholder: "Maya Lee · The Painted Sky · Maya Talks", required: true },
        { key: "creativeType", label: "Creative Type",            type: "select", options: ["Musician / Band", "DJ / Producer", "Singer / Songwriter", "Painter / Visual Artist", "Illustrator / Designer", "Photographer", "Podcaster", "Filmmaker / Videographer", "Content Creator", "Dancer / Performer", "Writer / Poet", "Other Creative"], required: true },
        { key: "genre",        label: "Style / Genre / Niche",    placeholder: "Electronic, Abstract Art, True Crime, Travel Photography…" },
        { key: "location",     label: "Based In",                 placeholder: "Los Angeles, CA", icon: MapPin },
        { key: "bio",          label: "About / Bio",              type: "textarea", placeholder: "Your story — what you create, what drives you, and what makes your work unique.", maxLength: 280 },
        { key: "status",       label: "Availability",             type: "select", options: ["Open for bookings", "Open for commissions", "Available for collabs", "Currently on tour", "Fully booked", "Taking a break"] },
      ],
    },
    {
      id: "portfolio", title: "Portfolio & Platforms", icon: Globe, color: "#A855F7",
      fields: [
        { key: "website",    label: "Website / Portfolio URL",    type: "url", placeholder: "https://yourportfolio.com", icon: Globe },
        { key: "spotify",    label: "Spotify / Apple Music",      type: "url", placeholder: "https://open.spotify.com/artist/…" },
        { key: "youtube",    label: "YouTube / Vimeo",            type: "url", placeholder: "https://youtube.com/@yourchannel", icon: Youtube },
        { key: "podcast",    label: "Podcast Link",               type: "url", placeholder: "https://podcasts.apple.com/… or Spotify episode URL" },
        { key: "soundcloud", label: "SoundCloud / Bandcamp",      type: "url", placeholder: "https://soundcloud.com/…" },
        { key: "behance",    label: "Behance / Dribbble / VSCO",  type: "url", placeholder: "https://behance.net/…" },
      ],
    },
    {
      id: "socials", title: "Social Media", icon: Instagram, color: "#F97316", collapsible: true,
      fields: [
        { key: "instagram",  label: "Instagram",  type: "url", placeholder: "https://instagram.com/…", icon: Instagram },
        { key: "tiktok",     label: "TikTok",     type: "url", placeholder: "https://tiktok.com/@…" },
        { key: "twitter",    label: "Twitter / X",type: "url", placeholder: "https://x.com/…", icon: Twitter },
        { key: "facebook",   label: "Facebook Page", type: "url", placeholder: "https://facebook.com/…" },
      ],
    },
    {
      id: "booking", title: "Bookings, Services & Shop", icon: Star, color: "#F59E0B", collapsible: true,
      fields: [
        { key: "bookingEmail", label: "Booking / Commission Email", type: "email", placeholder: "hello@mayacreates.com", icon: Mail },
        { key: "rates",        label: "Rates / Services URL",       type: "url",   placeholder: "https://yoursite.com/rates-and-services" },
        { key: "management",   label: "Management / Agent Contact", placeholder: "Creative Agency · +1 (310) 555-0100" },
        { key: "shop",         label: "Shop / Merch Store URL",     type: "url",   placeholder: "https://shop.yoursite.com" },
        { key: "events",       label: "Events / Tour Dates URL",    type: "url",   placeholder: "https://yoursite.com/events" },
        { key: "support",      label: "Patreon / Ko-fi / Support",  type: "url",   placeholder: "https://patreon.com/…" },
      ],
    },
  ],
};

// ── Suggested links per template ───────────────────────────────────────────────
const suggestedLinks: Record<string, { type: string; label: string; icon: typeof Globe }[]> = {
  individual: [
    { type: "linkedin",  label: "LinkedIn",        icon: Linkedin },
    { type: "website",   label: "Portfolio",       icon: Globe },
    { type: "email",     label: "Email Me",        icon: Mail },
    { type: "twitter",   label: "Twitter / X",     icon: Twitter },
    { type: "instagram", label: "Instagram",       icon: Instagram },
    { type: "github",    label: "GitHub",          icon: Github },
    { type: "phone",     label: "Call Me",         icon: Phone },
    { type: "youtube",   label: "YouTube",         icon: Youtube },
  ],
  business: [
    { type: "website",   label: "Our Website",     icon: Globe },
    { type: "phone",     label: "Call Us",         icon: Phone },
    { type: "email",     label: "Email Us",        icon: Mail },
    { type: "website",   label: "Get Directions",  icon: MapPin },
    { type: "website",   label: "Book a Meeting",  icon: Calendar },
    { type: "instagram", label: "Instagram",       icon: Instagram },
    { type: "linkedin",  label: "LinkedIn Page",   icon: Linkedin },
  ],
  pet: [
    { type: "phone",     label: "🚨 Call Owner",   icon: Phone },
    { type: "phone",     label: "My Vet",          icon: Heart },
    { type: "instagram", label: "My Instagram",    icon: Instagram },
    { type: "phone",     label: "Backup Contact",  icon: Phone },
    { type: "website",   label: "My Location",     icon: MapPin },
  ],
  cafe: [
    { type: "website",   label: "📋 View Menu",    icon: Globe },
    { type: "website",   label: "📦 Order Online", icon: ShoppingBag },
    { type: "website",   label: "📅 Reserve Table",icon: Calendar },
    { type: "website",   label: "📍 Get Directions",icon: MapPin },
    { type: "phone",     label: "Call Us",         icon: Phone },
    { type: "instagram", label: "Instagram",       icon: Instagram },
    { type: "website",   label: "Gift Cards",      icon: Star },
  ],
  event: [
    { type: "website",   label: "🎟️ Get Tickets", icon: Ticket },
    { type: "website",   label: "📋 View Schedule",icon: Calendar },
    { type: "website",   label: "📍 Venue Map",    icon: MapPin },
    { type: "website",   label: "📅 RSVP",         icon: Check },
    { type: "email",     label: "Contact Organiser",icon: Mail },
    { type: "website",   label: "🎤 Speakers",     icon: Mic2 },
  ],
  creator: [
    { type: "website",   label: "🖼️ Portfolio",       icon: Globe },
    { type: "website",   label: "🎵 Spotify",          icon: Globe },
    { type: "youtube",   label: "🎬 YouTube",          icon: Youtube },
    { type: "instagram", label: "Instagram",           icon: Instagram },
    { type: "website",   label: "🎙️ Podcast",         icon: Globe },
    { type: "email",     label: "💬 Hire / Book Me",   icon: Mail },
    { type: "website",   label: "👕 Shop / Merch",     icon: ShoppingBag },
    { type: "website",   label: "🗓️ Events & Shows",  icon: Calendar },
    { type: "website",   label: "☕ Support My Work",  icon: Globe },
  ],
};

// ── Template type definitions ──────────────────────────────────────────────────
interface TemplateTypeDef {
  id: string;
  label: string;
  icon: typeof User;
  color: string;
  defaultPhoto: string;
  photoShape: "circle" | "rounded" | "banner";
  description: string;
  defaultFields: Record<string, string>;
  defaultLinks: LinkItem[];
}

const templateTypes: TemplateTypeDef[] = [
  {
    id: "individual", label: "Individual", icon: User, color: "#DC2626",
    defaultPhoto: DEFAULT_PHOTO, photoShape: "circle",
    description: "Personal profile with bio and social links",
    defaultFields: { name: "Alex Rivera", title: "Product Designer", company: "Designly Studio", location: "San Francisco, CA", bio: "Creating digital experiences that people love." },
    defaultLinks: [
      { id: "1", type: "linkedin",  label: "LinkedIn",  url: "" },
      { id: "2", type: "website",   label: "Portfolio", url: "" },
      { id: "3", type: "email",     label: "Email Me",  url: "" },
    ],
  },
  {
    id: "business", label: "Business", icon: Building2, color: "#0EA5E9",
    defaultPhoto: DEFAULT_BIZ, photoShape: "rounded",
    description: "Company brand, services, and contact",
    defaultFields: { name: "Designly Studio", category: "Brand & UX Agency", tagline: "We craft brands that people love.", hours: "Mon–Fri: 9am – 6pm", city: "San Francisco, CA" },
    defaultLinks: [
      { id: "1", type: "website", label: "Our Website",    url: "" },
      { id: "2", type: "phone",   label: "Call Us",        url: "" },
      { id: "3", type: "website", label: "Get Directions", url: "" },
    ],
  },
  {
    id: "pet", label: "Pet", icon: PawPrint, color: "#F59E0B",
    defaultPhoto: DEFAULT_DOG, photoShape: "circle",
    description: "Pet ID tag with emergency owner contact",
    defaultFields: { name: "Buddy", species: "Dog", breed: "Golden Retriever", age: "3 years old", gender: "Male", isLost: "false", ownerName: "Jamie Rivera", ownerPhone: "" },
    defaultLinks: [
      { id: "1", type: "phone",    label: "🚨 Call Owner", url: "" },
      { id: "2", type: "phone",    label: "My Vet",        url: "" },
      { id: "3", type: "instagram",label: "My Instagram",  url: "" },
    ],
  },
  {
    id: "cafe", label: "Café & Restaurant", icon: Coffee, color: "#92400E",
    defaultPhoto: DEFAULT_CAFE, photoShape: "banner",
    description: "Menu, orders, reservations, and hours",
    defaultFields: {
      name: "The Bean House",
      cuisine: "Coffee & Brunch",
      tagline: "Your neighbourhood third place.",
      hoursWeekday: "Mon–Fri: 7am – 7pm",
      hoursWeekend: "Sat–Sun: 8am – 5pm",
      menuSections: getDefaultCafeMenuSectionsJson(),
    },
    defaultLinks: [
      { id: "1", type: "website", label: "📋 View Menu",    url: "" },
      { id: "2", type: "website", label: "📦 Order Online", url: "" },
      { id: "3", type: "website", label: "📅 Reserve Table",url: "" },
    ],
  },
  {
    id: "event", label: "Event", icon: Calendar, color: "#8B5CF6",
    defaultPhoto: DEFAULT_EVENT, photoShape: "banner",
    description: "Tickets, schedule, venue details",
    defaultFields: { name: "TechConf 2026", type: "Conference", date: "March 15, 2026 · 9:00 AM", venueName: "Moscone Center", address: "747 Howard St, San Francisco, CA" },
    defaultLinks: [
      { id: "1", type: "website", label: "🎟️ Get Tickets",  url: "" },
      { id: "2", type: "website", label: "📋 View Schedule", url: "" },
      { id: "3", type: "website", label: "📍 Venue Map",     url: "" },
    ],
  },
  {
    id: "creator", label: "Creator", icon: Sparkles, color: "#EC4899",
    defaultPhoto: DEFAULT_MUSIC, photoShape: "circle",
    description: "Portfolio, platforms, bookings & more — for all creative types",
    defaultFields: { name: "Maya Lee", creativeType: "Illustrator / Designer", genre: "Visual Art · Podcasting", location: "Los Angeles, CA", status: "Open for commissions" },
    defaultLinks: [
      { id: "1", type: "website", label: "🖼️ Portfolio",    url: "" },
      { id: "2", type: "youtube", label: "🎬 YouTube",       url: "" },
      { id: "3", type: "email",   label: "💬 Hire Me",       url: "" },
    ],
  },
];

// themes imported from ../data/themes

const linkIcons: Record<string, typeof Globe> = {
  website: Globe, linkedin: Linkedin, twitter: Twitter, instagram: Instagram,
  github: Github, email: Mail, phone: Phone, youtube: Youtube,
};
const linkTypes = [
  { value: "website",   label: "Website / URL" },
  { value: "linkedin",  label: "LinkedIn" },
  { value: "twitter",   label: "Twitter / X" },
  { value: "instagram", label: "Instagram" },
  { value: "github",    label: "GitHub" },
  { value: "email",     label: "Email" },
  { value: "phone",     label: "Phone" },
  { value: "youtube",   label: "YouTube" },
];

interface LinkItem { id: string; type: string; label: string; url: string }
interface ProfileData {
  templateType: string;
  photo: string;
  theme: string;
  palette: string;
  showGraphic: boolean;
  links: LinkItem[];
  fields: Record<string, string>;
}

interface ApiProfileLink {
  id: string;
  type: string;
  label: string;
  url: string;
  position: number;
}

interface ApiProfile {
  id: string;
  slug: string;
  templateType: string;
  theme: string;
  palette: string;
  showGraphic: boolean;
  isPublished: boolean;
  photoUrl: string | null;
  fields: Record<string, string>;
  links: ApiProfileLink[];
}

interface ProfileResponse {
  profile: ApiProfile;
}

interface ProfileMineResponse {
  items: ApiProfile[];
}

interface PhotoUploadResponse {
  photoUrl: string;
}

interface ProfileLinkPayload {
  type: string;
  label: string;
  url: string;
}

function linkUrlErrorKey(linkId: string): string {
  return `link-url-${linkId}`;
}

function localLinkId(seed = ""): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${seed}`;
}

function localMenuSectionId(): string {
  return `menu-section-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function localMenuItemId(sectionId: string): string {
  return `${sectionId}-item-${Math.random().toString(36).slice(2, 7)}`;
}

function getDefaultProfile(typeId: string): ProfileData {
  const def = templateTypes.find((template) => template.id === typeId) || templateTypes[0];
  return {
    templateType: typeId,
    photo: def.defaultPhoto,
    theme: "wave",
    palette: "original",
    showGraphic: true,
    links: def.defaultLinks.map((link, index) => ({ ...link, id: localLinkId(`${index}`) })),
    fields: { ...def.defaultFields },
  };
}

function mapApiProfileToEditor(profile: ApiProfile): ProfileData {
  const typeDef = templateTypes.find((template) => template.id === profile.templateType) || templateTypes[0];
  const fields = { ...(profile.fields || {}) };

  if (profile.templateType === "cafe" && !fields.menuSections?.trim()) {
    fields.menuSections = getDefaultCafeMenuSectionsJson();
  }

  return {
    templateType: profile.templateType,
    photo: profile.photoUrl || typeDef.defaultPhoto,
    theme: profile.theme || "wave",
    palette: profile.palette || "original",
    showGraphic: profile.showGraphic ?? true,
    links: profile.links.map((link, index) => ({
      id: link.id || localLinkId(`${index}`),
      type: link.type,
      label: link.label,
      url: link.url,
    })),
    fields,
  };
}

function mapEditorLinksToPayload(links: LinkItem[]): ProfileLinkPayload[] {
  return links.slice(0, 10).map((link) => {
    const type = link.type.trim() || "website";
    const label = link.label.trim() || type.charAt(0).toUpperCase() + type.slice(1);
    return {
      type,
      label,
      url: link.url.trim(),
    };
  });
}

function asErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

const linksTabLabels: Record<string, string> = {
  individual: "Socials",
  business: "Contact",
  pet: "Emergency",
  cafe: "Menu",
  event: "Tickets",
  creator: "Platforms",
};

function getLinksTabLabel(templateType: string): string {
  const normalized = templateType.trim().toLowerCase();
  return linksTabLabels[normalized] || "Links";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function FieldInput({
  def, value, onChange, isDark, error,
}: { def: FieldDef; value: string; onChange: (v: string) => void; isDark: boolean; error?: string }) {
  const base = `w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all border ${
    error
      ? "border-rose-400 bg-rose-50/40"
      : isDark
      ? "bg-slate-800/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white"
  }`;
  const Icon = def.icon;
  const toggleOn = value.trim().toLowerCase() === "true";

  return (
    <div>
      <label className={`flex items-center gap-1 text-xs mb-1.5 ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontWeight: 600 }}>
        {def.label}
        {def.required && <span className="text-rose-400">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />}
        {def.type === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={def.placeholder}
            rows={3}
            maxLength={def.maxLength}
            className={`${base} resize-none ${Icon ? "pl-10" : ""}`}
          />
        ) : def.type === "toggle" ? (
          <button
            type="button"
            role="switch"
            aria-checked={toggleOn}
            onClick={() => onChange(toggleOn ? "false" : "true")}
            className={`w-full h-11 px-3 rounded-xl border flex items-center justify-between transition-colors ${
              toggleOn
                ? "border-rose-400 bg-rose-50/70 dark:bg-rose-950/30"
                : isDark
                ? "bg-slate-800/70 border-slate-700"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <span className={`text-sm ${isDark ? "text-slate-200" : "text-slate-700"}`} style={{ fontWeight: 600 }}>
              {toggleOn ? "Enabled" : "Disabled"}
            </span>
            <span
              className={`relative w-11 h-6 rounded-full transition-colors ${
                toggleOn ? "bg-rose-500" : isDark ? "bg-slate-700" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  toggleOn ? "translate-x-5 left-0.5" : "translate-x-0 left-0.5"
                }`}
              />
            </span>
          </button>
        ) : def.type === "select" ? (
          <div className="relative">
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`${base} appearance-none ${Icon ? "pl-10" : ""} pr-8`}
            >
              <option value="">Select…</option>
              {def.options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={13} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? "text-slate-500" : "text-slate-400"}`} />
          </div>
        ) : (
          <input
            type={def.type || "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={def.placeholder}
            className={`${base} ${Icon ? "pl-10" : ""}`}
          />
        )}
      </div>
      {def.hint && !error && <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{def.hint}</p>}
      {def.type === "textarea" && def.maxLength && (
        <p className={`text-xs text-right mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>{value.length}/{def.maxLength}</p>
      )}
      {error && <p className="flex items-center gap-1 text-xs text-rose-500 mt-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
}

// ── Section component with optional collapse ──────────────────────────────────
function EditorSection({ section, fields, onChange, isDark, errors }: {
  section: SectionDef;
  fields: Record<string, string>;
  onChange: (key: string, value: string) => void;
  isDark: boolean;
  errors: Record<string, string>;
}) {
  const [open, setOpen] = useState(true);
  const Icon = section.icon;

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
      <button
        type="button"
        onClick={() => section.collapsible && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left ${section.collapsible ? "cursor-pointer" : "cursor-default"} ${isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50/50"} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${section.color || "#DC2626"}15` }}>
            <Icon size={15} style={{ color: section.color || "#DC2626" }} />
          </div>
          <span className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>{section.title}</span>
          {section.collapsible && (
            <span className={`text-xs px-1.5 py-0.5 rounded-md ${isDark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"}`}>Optional</span>
          )}
        </div>
        {section.collapsible && (
          open
            ? <ChevronUp size={15} className={isDark ? "text-slate-500" : "text-slate-400"} />
            : <ChevronDown size={15} className={isDark ? "text-slate-500" : "text-slate-400"} />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={`px-5 pb-5 pt-1 grid gap-4 ${section.fields.length > 3 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
              {section.fields.map((fd) => (
                <div key={fd.key} className={fd.type === "textarea" ? "sm:col-span-2" : ""}>
                  <FieldInput
                    def={fd}
                    value={fields[fd.key] || ""}
                    onChange={(v) => onChange(fd.key, v)}
                    isDark={isDark}
                    error={errors[fd.key]}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CafeMenuEditor({
  sections,
  onChange,
  isDark,
}: {
  sections: CafeMenuSection[];
  onChange: (sections: CafeMenuSection[]) => void;
  isDark: boolean;
}) {
  const addSection = () => {
    const sectionId = localMenuSectionId();
    onChange([
      ...sections,
      {
        id: sectionId,
        name: "New Section",
        items: [
          { id: localMenuItemId(sectionId), name: "", description: "", price: "" },
        ],
      },
    ]);
  };

  const removeSection = (sectionId: string) => {
    onChange(sections.filter((section) => section.id !== sectionId));
  };

  const updateSectionName = (sectionId: string, value: string) => {
    onChange(
      sections.map((section) => (section.id === sectionId ? { ...section, name: value } : section))
    );
  };

  const addItem = (sectionId: string) => {
    onChange(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [...section.items, { id: localMenuItemId(sectionId), name: "", description: "", price: "" }],
            }
          : section
      )
    );
  };

  const updateItem = (sectionId: string, itemId: string, key: "name" | "description" | "price", value: string) => {
    onChange(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) => (item.id === itemId ? { ...item, [key]: value } : item)),
            }
          : section
      )
    );
  };

  const removeItem = (sectionId: string, itemId: string) => {
    onChange(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
          : section
      )
    );
  };

  const resetDefaults = () => {
    onChange(getDefaultCafeMenuSections());
  };

  return (
    <div className={`rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
      <div className={`px-5 py-4 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={`text-sm flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
              <Layers size={15} className="text-amber-500" />
              Menu Builder
            </p>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Add menu sections like Appetizers, Drinks, and custom categories.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetDefaults}
              className={`h-8 px-3 rounded-lg text-xs border transition-colors ${
                isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              style={{ fontWeight: 600 }}
            >
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={addSection}
              className="h-8 px-3 rounded-lg text-xs text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#DC2626,#EA580C)", fontWeight: 700 }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Plus size={12} />
                Add Section
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {sections.length === 0 && (
          <div className={`rounded-xl border px-3 py-2.5 text-xs ${isDark ? "border-slate-700 bg-slate-800 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
            No menu sections yet. Click "Add Section" to start.
          </div>
        )}

        {sections.map((section) => (
          <div key={section.id} className={`rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-slate-50/70"}`}>
            <div className="flex items-center gap-2">
              <input
                value={section.name}
                onChange={(event) => updateSectionName(section.id, event.target.value)}
                placeholder="Section name (e.g. Appetizers)"
                className={`flex-1 h-9 px-3 rounded-lg text-sm border outline-none ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
                }`}
              />
              <button
                type="button"
                onClick={() => removeSection(section.id)}
                className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors ${
                  isDark
                    ? "border-slate-700 text-slate-400 hover:text-rose-300 hover:border-rose-500/50"
                    : "border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-300"
                }`}
                aria-label={`Remove ${section.name || "menu section"}`}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {section.items.map((item) => (
                <div key={item.id} className={`rounded-lg border p-2.5 ${isDark ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-white"}`}>
                  <div className="grid gap-2 sm:grid-cols-[1fr_120px_40px]">
                    <input
                      value={item.name}
                      onChange={(event) => updateItem(section.id, item.id, "name", event.target.value)}
                      placeholder="Menu item name"
                      className={`h-9 px-3 rounded-lg text-sm border outline-none ${
                        isDark
                          ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                          : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
                      }`}
                    />
                    <input
                      value={item.price}
                      onChange={(event) => updateItem(section.id, item.id, "price", event.target.value)}
                      placeholder="$12"
                      className={`h-9 px-3 rounded-lg text-sm border outline-none ${
                        isDark
                          ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                          : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(section.id, item.id)}
                      className={`h-9 rounded-lg border flex items-center justify-center transition-colors ${
                        isDark
                          ? "border-slate-700 text-slate-400 hover:text-rose-300 hover:border-rose-500/50"
                          : "border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-300"
                      }`}
                      aria-label={`Remove ${item.name || "menu item"}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <input
                    value={item.description}
                    onChange={(event) => updateItem(section.id, item.id, "description", event.target.value)}
                    placeholder="Description (optional)"
                    className={`mt-2 h-9 w-full px-3 rounded-lg text-sm border outline-none ${
                      isDark
                        ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                        : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
                    }`}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addItem(section.id)}
              className={`mt-2 h-8 px-3 rounded-lg text-xs border transition-colors ${
                isDark ? "border-slate-700 text-slate-300 hover:bg-slate-700/60" : "border-slate-200 text-slate-600 hover:bg-white"
              }`}
              style={{ fontWeight: 600 }}
            >
              <span className="inline-flex items-center gap-1">
                <Plus size={11} />
                Add Item
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Live preview — template-aware ──────────────────────────────────────────────
function MobilePreview({ data, typeDef }: { data: ProfileData; typeDef: TemplateTypeDef }) {
  const t = getTheme(data.theme);
  const Graphic = t.Graphic;
  const { gradient: resolvedGradient, text: resolvedText } = getGradient(data.theme, data.palette);
  const f = data.fields;
  const petIsLost = data.templateType === "pet" && f.isLost?.trim().toLowerCase() === "true";
  const linksTabLabel = getLinksTabLabel(data.templateType);
  const cafeMenuHighlights =
    data.templateType === "cafe"
      ? parseCafeMenuSections(f.menuSections, { fallbackToDefault: true })
          .map((section) => ({
            ...section,
            items: section.items.filter((item) => item.name || item.description || item.price),
          }))
          .filter((section) => section.items.length > 0)
          .slice(0, 2)
      : [];

  const nameDisplay = f.name || typeDef.defaultFields.name || "Name";
  const subtitleDisplay = (() => {
    switch (data.templateType) {
      case "individual": return [f.title, f.company].filter(Boolean).join(" · ") || "Job Title · Company";
      case "business":   return [f.category, f.city].filter(Boolean).join(" · ") || "Category · City";
      case "pet":        return [f.breed, f.age].filter(Boolean).join(" · ") || "Breed · Age";
      case "cafe":       return [f.cuisine, f.hoursWeekday ? `Open ${f.hoursWeekday.split(":")[1]?.trim().split("–")[0]?.trim() || ""}` : ""].filter(Boolean).join(" · ") || "Cuisine · Hours";
      case "event":      return f.date || "Date & Venue";
      case "creator":    return [f.creativeType, f.genre].filter(Boolean).join(" · ") || "Creative Type · Niche";
      default:           return "";
    }
  })();

  const badgeDisplay = (() => {
    switch (data.templateType) {
      case "pet":     return petIsLost ? "🚨 LOST PET" : (f.ownerName ? `👤 Owner: ${f.ownerName}` : null);
      case "cafe":    return f.rating || null;
      case "event":   return f.venueName || null;
      case "creator": return f.status || null;
      default:        return null;
    }
  })();

  const bioDisplay = f.bio?.slice(0, 70) || null;

  return (
    <div className="relative mx-auto" style={{ width: 280, height: 570 }}>
      <div className="absolute inset-0 rounded-[2.5rem] bg-slate-800 shadow-2xl" />
      <div className="absolute inset-[3px] rounded-[2.3rem] overflow-hidden flex flex-col" style={{ background: resolvedGradient }}>
        {/* Theme graphic overlay */}
        {Graphic && data.showGraphic && <Graphic />}
        {/* Status bar */}
        <div className="h-9 flex items-center px-5 pt-2 flex-shrink-0 relative z-10" style={{ color: resolvedText, opacity: 0.6 }}>
          <span className="text-xs" style={{ fontWeight: 600 }}>9:41</span>
        </div>
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-800 rounded-full z-20" />

        <div className="flex-1 overflow-y-auto px-5 pt-1 pb-6 flex flex-col relative z-10">
          {/* Photo / Banner */}
          <div className="flex justify-center mb-3">
            {typeDef.photoShape === "banner" ? (
              <div className="w-full h-24 rounded-xl overflow-hidden border border-white/20">
                <ImageWithFallback src={data.photo} alt={nameDisplay} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className={`overflow-hidden border-2 shadow-lg ${typeDef.photoShape === "circle" ? "w-20 h-20 rounded-full" : "w-20 h-20 rounded-2xl"}`}
                style={{ borderColor: "rgba(255,255,255,0.3)" }}
              >
                <ImageWithFallback src={data.photo} alt={nameDisplay} className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Name */}
          <h2 className="text-center text-base mb-0.5" style={{ color: resolvedText, fontWeight: 700, lineHeight: 1.3 }}>
            {nameDisplay}
          </h2>
          {subtitleDisplay && (
            <p className="text-center text-xs mb-1.5 opacity-75" style={{ color: resolvedText, lineHeight: 1.4 }}>{subtitleDisplay}</p>
          )}
          {badgeDisplay && (
            <div className="flex justify-center mb-2">
              <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(255,255,255,0.2)", color: resolvedText, fontWeight: 600 }}>
                {badgeDisplay}
              </span>
            </div>
          )}
          {bioDisplay && (
            <p className="text-center text-xs mb-3 opacity-60 leading-relaxed" style={{ color: resolvedText }}>
              {bioDisplay}{(f.bio?.length || 0) > 70 ? "…" : ""}
            </p>
          )}

          {/* Template-specific extra info */}
          {data.templateType === "cafe" && (f.hoursWeekday || f.address) && (
            <div className="mb-3 rounded-xl px-3 py-2 space-y-1" style={{ background: "rgba(255,255,255,0.12)" }}>
              {f.hoursWeekday && (
                <div className="flex items-center gap-1.5">
                  <Clock size={10} style={{ color: resolvedText, opacity: 0.6 }} />
                  <span className="text-xs opacity-75" style={{ color: resolvedText }}>{f.hoursWeekday}</span>
                </div>
              )}
              {f.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={10} style={{ color: resolvedText, opacity: 0.6 }} />
                  <span className="text-xs opacity-75 truncate" style={{ color: resolvedText }}>{f.address}</span>
                </div>
              )}
            </div>
          )}
          {data.templateType === "cafe" && cafeMenuHighlights.length > 0 && (
            <div className="mb-3 rounded-xl px-3 py-2 space-y-1.5" style={{ background: "rgba(255,255,255,0.14)" }}>
              <p className="text-[11px] uppercase tracking-wide opacity-80" style={{ color: resolvedText, fontWeight: 700 }}>
                Menu Highlights
              </p>
              {cafeMenuHighlights.map((section) => (
                <div key={section.id}>
                  <p className="text-[10px] opacity-85" style={{ color: resolvedText, fontWeight: 700 }}>
                    {section.name}
                  </p>
                  {section.items.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <span className="text-[10px] opacity-80 truncate" style={{ color: resolvedText }}>
                        {item.name}
                      </span>
                      {item.price && (
                        <span className="text-[10px] opacity-80" style={{ color: resolvedText, fontWeight: 600 }}>
                          {item.price}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {data.templateType === "event" && f.date && (
            <div className="mb-3 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.12)" }}>
              <div className="flex items-center gap-1.5">
                <Calendar size={10} style={{ color: resolvedText, opacity: 0.6 }} />
                <span className="text-xs opacity-75" style={{ color: resolvedText }}>{f.date}</span>
              </div>
              {f.venueName && (
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin size={10} style={{ color: resolvedText, opacity: 0.6 }} />
                  <span className="text-xs opacity-75" style={{ color: resolvedText }}>{f.venueName}</span>
                </div>
              )}
            </div>
          )}
          {data.templateType === "pet" && (f.ownerName || f.ownerPhone) && (
            <div className="mb-3 rounded-xl px-3 py-2" style={{ background: petIsLost ? "rgba(239,68,68,0.3)" : "rgba(251,191,36,0.3)" }}>
              <p className="text-xs text-center" style={{ color: resolvedText, fontWeight: 700 }}>
                {petIsLost ? "🚨 LOST PET ALERT" : "🐾 Pet Contact Card"}
              </p>
              {f.ownerName && <p className="text-xs text-center opacity-90 mt-0.5" style={{ color: resolvedText }}>{f.ownerName}</p>}
              {petIsLost && (
                <p className="text-[10px] text-center opacity-80 mt-1" style={{ color: resolvedText }}>
                  Guests can submit a sighting report on profile view
                </p>
              )}
            </div>
          )}

          {/* Links */}
          <div className="mt-auto space-y-2">
            {data.links.length === 0 ? (
              <div className="py-3 px-4 rounded-xl text-xs text-center opacity-30" style={{ background: "rgba(255,255,255,0.15)", color: resolvedText }}>
                Add items in the {linksTabLabel} tab
              </div>
            ) : (
              data.links.map((link) => {
                const Icon = linkIcons[link.type] || Globe;
                return (
                  <div key={link.id} className="flex items-center gap-2 py-2.5 px-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                    <Icon size={13} style={{ color: resolvedText, opacity: 0.8 }} />
                    <span className="text-xs" style={{ color: resolvedText, fontWeight: 500 }}>{link.label || link.type}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ProfileEditor() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedProfileId = searchParams.get("profile")?.trim() || "";

  const [activeTab,      setActiveTab]      = useState("profile");
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError,      setLoadError]      = useState("");
  const [saveError,      setSaveError]      = useState("");
  const [showPreview,    setShowPreview]    = useState(false);
  const [showTypeModal,  setShowTypeModal]  = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileId,      setProfileId]      = useState<string | null>(null);
  const [profileSlug,    setProfileSlug]    = useState<string | null>(null);
  const [photoUrlForSave, setPhotoUrlForSave] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<ProfileData>(() => getDefaultProfile("individual"));

  const typeDef = templateTypes.find((t) => t.id === profile.templateType) || templateTypes[0];
  const sections = templateSections[profile.templateType] || templateSections.individual;
  const suggestions = suggestedLinks[profile.templateType] || suggestedLinks.individual;
  const cafeMenuSections = useMemo(
    () =>
      profile.templateType === "cafe"
        ? parseCafeMenuSections(profile.fields.menuSections, { fallbackToDefault: true })
        : [],
    [profile.templateType, profile.fields.menuSections]
  );
  const TypeIcon = typeDef.icon;
  const linksTabLabel = getLinksTabLabel(profile.templateType);
  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "links", label: linksTabLabel, icon: Link2 },
    { id: "theme", label: "Theme", icon: Paintbrush },
  ];
  const previewProfilePath = profileSlug ? `/profile/${encodeURIComponent(profileSlug)}` : "/profile";

  const loadEditorProfile = async () => {
    setLoadingProfile(true);
    setLoadError("");
    setSaveError("");
    setSaved(false);

    try {
      if (requestedProfileId) {
        const byId = await apiRequest<ProfileResponse>(`/profiles/${encodeURIComponent(requestedProfileId)}`, { auth: true });
        setProfile(mapApiProfileToEditor(byId.profile));
        setProfileId(byId.profile.id);
        setProfileSlug(byId.profile.slug);
        setPhotoUrlForSave(byId.profile.photoUrl);
        return;
      }

      if (!getAccessToken()) {
        setProfile(getDefaultProfile("individual"));
        setProfileId(null);
        setProfileSlug(null);
        setPhotoUrlForSave(null);
        return;
      }

      const mine = await apiRequest<ProfileMineResponse>("/profiles/mine", { auth: true });
      const first = mine.items[0];

      if (!first) {
        setProfile(getDefaultProfile("individual"));
        setProfileId(null);
        setProfileSlug(null);
        setPhotoUrlForSave(null);
        return;
      }

      setProfile(mapApiProfileToEditor(first));
      setProfileId(first.id);
      setProfileSlug(first.slug);
      setPhotoUrlForSave(first.photoUrl);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAccessToken();
        setLoadError("Your session expired. Sign in again to edit your profile.");
      } else {
        setLoadError(asErrorMessage(error, "Unable to load editor data."));
      }
      setProfile(getDefaultProfile("individual"));
      setProfileId(null);
      setProfileSlug(null);
      setPhotoUrlForSave(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    void loadEditorProfile();
  }, [requestedProfileId]);

  const updateField = (key: string, val: string) => {
    setProfile((p) => ({ ...p, fields: { ...p.fields, [key]: val } }));
    setSaved(false);
    setSaveError("");
  };
  const updateCafeMenuSections = (nextSections: CafeMenuSection[]) => {
    updateField("menuSections", serializeCafeMenuSections(nextSections));
  };
  const updateTop = <K extends keyof ProfileData>(key: K, val: ProfileData[K]) => {
    setProfile((p) => ({ ...p, [key]: val }));
    setSaved(false);
    setSaveError("");
  };

  const triggerPhotoPicker = () => {
    if (!getAccessToken()) {
      setSaveError("Sign in to upload a photo.");
      navigate("/login");
      return;
    }
    if (!profileId) {
      setSaveError("Save your profile first so we can attach the photo to your profile record.");
      return;
    }
    photoInputRef.current?.click();
  };

  const handlePhotoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (!getAccessToken()) {
      setSaveError("Sign in to upload a photo.");
      event.target.value = "";
      navigate("/login");
      return;
    }

    if (!profileId) {
      setSaveError("Save your profile first so we can attach the photo to your profile record.");
      event.target.value = "";
      return;
    }

    setSaveError("");
    setSaved(false);
    setUploadingPhoto(true);

    try {
      const optimizedFile = await optimizePhotoForUpload(selectedFile);
      const formData = new FormData();
      formData.append("photo", optimizedFile, optimizedFile.name);

      const uploaded = await apiRequest<PhotoUploadResponse>(`/profiles/photo?profileId=${encodeURIComponent(profileId)}`, {
        method: "POST",
        auth: true,
        body: formData,
      });

      updateTop("photo", uploaded.photoUrl);
      setPhotoUrlForSave(uploaded.photoUrl);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAccessToken();
        setSaveError("Your session expired. Please sign in again.");
        navigate("/login");
      } else {
        setSaveError(asErrorMessage(error, "Unable to upload this photo."));
      }
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const switchTemplate = (id: string) => {
    setProfile((current) => {
      const next = getDefaultProfile(id);
      return {
        ...next,
        theme: current.theme,
        palette: current.palette,
        showGraphic: current.showGraphic,
      };
    });
    setShowTypeModal(false);
    setSaved(false);
    setSaveError("");
    setErrors({});
  };

  const addLink = (suggestion?: { type: string; label: string }) => {
    if (profile.links.length >= 10) return;
    const newLink: LinkItem = {
      id: localLinkId(),
      type: suggestion?.type || "website",
      label: suggestion?.label || "",
      url: "",
    };
    updateTop("links", [...profile.links, newLink]);
  };
  const removeLink  = (id: string) => updateTop("links", profile.links.filter((l) => l.id !== id));
  const updateLink  = (id: string, k: keyof LinkItem, v: string) => {
    updateTop("links", profile.links.map((l) => (l.id === id ? { ...l, [k]: v } : l)));
    if (k === "url") {
      const errorKey = linkUrlErrorKey(id);
      setErrors((current) => {
        if (!current[errorKey]) {
          return current;
        }
        if (!v.trim()) {
          return current;
        }
        const next = { ...current };
        delete next[errorKey];
        return next;
      });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    // Check required fields across all sections
    sections.forEach((sec) => {
      sec.fields.forEach((fd) => {
        if (fd.required && !profile.fields[fd.key]?.trim()) {
          errs[fd.key] = `${fd.label.replace(" *", "")} is required`;
        }
      });
    });
    profile.links.forEach((link) => {
      if (!link.url.trim()) {
        errs[linkUrlErrorKey(link.id)] = "URL is required";
      }
    });
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const hasLinkErrors = Object.keys(errs).some((key) => key.startsWith("link-url-"));
      setActiveTab(hasLinkErrors ? "links" : "profile");
      return;
    }
    if (!getAccessToken()) {
      setSaveError("Sign in to save and publish your profile.");
      navigate("/login");
      return;
    }

    setErrors({});
    setSaveError("");
    setSaving(true);

    try {
      const links = mapEditorLinksToPayload(profile.links);
      const basePayload = {
        templateType: profile.templateType,
        theme: profile.theme,
        palette: profile.palette,
        showGraphic: profile.showGraphic,
        isPublished: true,
        photoUrl: photoUrlForSave,
        fields: profile.fields,
      };

      let savedProfile: ApiProfile;

      if (profileId) {
        await apiRequest<ProfileResponse>(`/profiles/${encodeURIComponent(profileId)}`, {
          method: "PATCH",
          auth: true,
          body: basePayload,
        });

        const linksResponse = await apiRequest<ProfileResponse>(`/profiles/${encodeURIComponent(profileId)}/links`, {
          method: "PUT",
          auth: true,
          body: { links },
        });
        savedProfile = linksResponse.profile;
      } else {
        const created = await apiRequest<ProfileResponse>("/profiles", {
          method: "POST",
          auth: true,
          body: {
            ...basePayload,
            links,
          },
        });
        savedProfile = created.profile;
      }

      setProfile(mapApiProfileToEditor(savedProfile));
      setProfileId(savedProfile.id);
      setProfileSlug(savedProfile.slug);
      setPhotoUrlForSave(savedProfile.photoUrl);
      setSaved(true);
      setTimeout(() => navigate(`/profile/${encodeURIComponent(savedProfile.slug)}`), 900);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAccessToken();
        setSaveError("Your session expired. Please sign in again.");
        navigate("/login");
        return;
      }
      setSaveError(asErrorMessage(error, "Unable to save this profile."));
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className={`mb-6 h-14 animate-pulse rounded-xl ${isDark ? "bg-slate-900" : "bg-slate-100"}`} />
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className={`h-[620px] animate-pulse rounded-2xl ${isDark ? "bg-slate-900" : "bg-white shadow-sm"}`} />
            <div className={`h-[620px] animate-pulse rounded-2xl ${isDark ? "bg-slate-900" : "bg-white shadow-sm"}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* ── Sticky top bar ── */}
      <div className={`sticky top-16 z-40 border-b backdrop-blur-md ${isDark ? "bg-slate-950/95 border-slate-800" : "bg-white/95 border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/templates"
                className={`flex items-center gap-1.5 text-sm flex-shrink-0 transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
                <ArrowLeft size={15} />
                <span className="hidden sm:inline">Templates</span>
              </Link>
              <span className={isDark ? "text-slate-700" : "text-slate-300"}>/</span>

              <button
                onClick={() => setShowTypeModal(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all group ${isDark ? "bg-slate-800 border border-slate-700 hover:border-indigo-500/50" : "bg-slate-100 border border-slate-200 hover:border-indigo-300"}`}
              >
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: `${typeDef.color}20` }}>
                  <TypeIcon size={12} style={{ color: typeDef.color }} />
                </div>
                <span className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>{typeDef.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-md hidden sm:inline-block ${isDark ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-500"}`}>Template</span>
                <ChevronRight size={12} className={`transition-transform group-hover:translate-x-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setShowPreview(!showPreview)}
                className={`lg:hidden flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm transition-colors ${isDark ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-100 text-slate-600"}`}>
                <Eye size={14} />Preview
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm text-white transition-all hover:opacity-90 disabled:opacity-70"
                style={{ background: saved ? "linear-gradient(135deg,#10B981,#059669)" : "linear-gradient(135deg,#DC2626,#EA580C)", fontWeight: 600 }}>
                {saving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : saved ? <Check size={14} /> : <Save size={14} />}
                {saving ? "Saving…" : saved ? "Saved!" : "Save & Publish"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {(loadError || saveError) && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <div className={`rounded-xl border px-4 py-2.5 text-sm ${isDark ? "border-rose-900/50 bg-rose-950/30 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            {saveError || loadError}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* ── Left: Editor ── */}
          <div className={`flex-1 min-w-0 ${showPreview ? "hidden lg:block" : ""}`}>
            {/* Tabs */}
            <div className={`flex gap-1 p-1 rounded-xl mb-6 w-fit ${isDark ? "bg-slate-900 border border-slate-800" : "bg-slate-100"}`}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${isActive ? "text-white shadow-sm" : isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"}`}
                    style={{ background: isActive ? "linear-gradient(135deg,#DC2626,#EA580C)" : "transparent", fontWeight: isActive ? 600 : 400 }}>
                    <Icon size={14} />
                    {tab.label}
                    {tab.id === "theme" && <span className="text-xs px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-600" style={{ fontWeight: 600, lineHeight: 1 }}>Visual</span>}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {/* ── PROFILE TAB ── */}
              {activeTab === "profile" && (
                <motion.div key={`profile-${profile.templateType}`}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="space-y-4">

                  {/* Photo upload */}
                  <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                    <p className={`text-xs mb-3 ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontWeight: 700 }}>
                      {typeDef.photoShape === "banner" ? "Cover / Banner Photo" : "Profile Photo"}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <div className={`overflow-hidden border-2 border-indigo-200 ${
                          typeDef.photoShape === "banner" ? "w-32 h-18 rounded-xl" :
                          typeDef.photoShape === "circle" ? "w-18 h-18 rounded-full" : "w-18 h-18 rounded-2xl"
                        }`} style={{ width: typeDef.photoShape === "banner" ? 120 : 72, height: typeDef.photoShape === "banner" ? 68 : 72 }}>
                          <ImageWithFallback src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={triggerPhotoPicker}
                          disabled={uploadingPhoto || !profileId}
                          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shadow-md disabled:opacity-70"
                        >
                          <Camera size={12} className="text-white" />
                        </button>
                      </div>
                      <div>
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept={PHOTO_UPLOAD_ACCEPT}
                          onChange={handlePhotoFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={triggerPhotoPicker}
                          disabled={uploadingPhoto || !profileId}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-colors disabled:opacity-70 ${isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                          style={{ fontWeight: 500 }}
                        >
                          <Upload size={14} />
                          {!profileId ? "Save Profile First" : uploadingPhoto ? "Optimizing & Uploading..." : "Upload Photo"}
                        </button>
                        <p className={`text-xs mt-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          JPG, PNG, or WebP · source max {(PHOTO_MAX_SOURCE_BYTES / 1_000_000).toFixed(0)}MB · optimized to about {(PHOTO_TARGET_UPLOAD_BYTES / 1_000_000).toFixed(0)}MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Template-specific sections */}
                  {sections.map((section) => (
                    <EditorSection
                      key={section.id}
                      section={section}
                      fields={profile.fields}
                      onChange={updateField}
                      isDark={isDark}
                      errors={errors}
                    />
                  ))}

                  {profile.templateType === "cafe" && (
                    <CafeMenuEditor
                      sections={cafeMenuSections}
                      onChange={updateCafeMenuSections}
                      isDark={isDark}
                    />
                  )}
                </motion.div>
              )}

              {/* ── LINKS TAB ── */}
              {activeTab === "links" && (
                <motion.div key="links" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="space-y-4">

                  {/* Suggested links for this template */}
                  <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                    <p className={`text-xs mb-3 ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontWeight: 700 }}>
                      Quick Add — Suggested for {typeDef.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s) => {
                        const Icon = s.icon;
                        const alreadyAdded = profile.links.some((l) => l.label === s.label);
                        return (
                          <button
                            key={s.label}
                            onClick={() => !alreadyAdded && addLink(s)}
                            disabled={alreadyAdded}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                              alreadyAdded
                                ? isDark ? "bg-indigo-950/30 border-indigo-800 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-500"
                                : isDark ? "border-slate-700 text-slate-300 hover:border-indigo-500/40 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50"
                            }`}
                            style={{ fontWeight: 500 }}
                          >
                            <Icon size={11} />
                            {s.label}
                            {alreadyAdded ? <Check size={10} className="text-indigo-400" /> : <Plus size={10} className="opacity-50" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Link editor */}
                  <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>All Links & Buttons</p>
                        <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{profile.links.length} / 10 links added</p>
                      </div>
                      <button onClick={() => addLink()} disabled={profile.links.length >= 10}
                        className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm text-white hover:opacity-90 disabled:opacity-40 transition-all"
                        style={{ background: "linear-gradient(135deg,#DC2626,#EA580C)", fontWeight: 600 }}>
                        <Plus size={14} />Add Custom
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      <AnimatePresence>
                        {profile.links.map((link) => {
                          const urlError = errors[linkUrlErrorKey(link.id)];
                          return (
                            <motion.div key={link.id}
                              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                              className={`p-3.5 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
                              <div className="flex items-start gap-2">
                                <GripVertical size={15} className={`mt-2 flex-shrink-0 cursor-move ${isDark ? "text-slate-600" : "text-slate-300"}`} />
                                <div className="flex-1">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="relative">
                                      <select value={link.type} onChange={(e) => updateLink(link.id, "type", e.target.value)}
                                        className={`w-full h-9 pl-3 pr-7 rounded-lg text-xs outline-none appearance-none border ${isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
                                        style={{ fontWeight: 500 }}>
                                        {linkTypes.map((lt) => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                                      </select>
                                      <ChevronDown size={11} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? "text-slate-400" : "text-slate-400"}`} />
                                    </div>
                                    <input value={link.label} onChange={(e) => updateLink(link.id, "label", e.target.value)}
                                      placeholder="Button label"
                                      className={`h-9 px-3 rounded-lg text-xs outline-none border ${isDark ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" : "bg-white border-slate-200 text-slate-700 placeholder:text-slate-400"}`} />
                                    <input value={link.url} onChange={(e) => updateLink(link.id, "url", e.target.value)}
                                      placeholder="URL, email or phone"
                                      className={`h-9 px-3 rounded-lg text-xs outline-none border ${
                                        urlError
                                          ? isDark
                                            ? "bg-slate-700 border-rose-500 text-white placeholder:text-slate-500"
                                            : "bg-white border-rose-400 text-slate-700 placeholder:text-slate-400"
                                          : isDark
                                          ? "bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                                          : "bg-white border-slate-200 text-slate-700 placeholder:text-slate-400"
                                      }`} />
                                  </div>
                                  {urlError && <p className="mt-1.5 text-xs text-rose-500">{urlError}</p>}
                                </div>
                                <button onClick={() => removeLink(link.id)}
                                  className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      {profile.links.length === 0 && (
                        <div className={`py-10 text-center rounded-xl border-2 border-dashed ${isDark ? "border-slate-700" : "border-slate-200"}`}>
                          <Link2 size={22} className={`mx-auto mb-2 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
                          <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No links yet</p>
                          <p className={`text-xs mt-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>Use "Quick Add" above or click "Add Custom"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── THEME TAB ── */}
              {activeTab === "theme" && (
                <motion.div key="theme" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">

                  {/* Info banner */}
                  <div className={`flex items-start gap-3 p-4 rounded-2xl ${isDark ? "bg-violet-950/25 border border-violet-900/30" : "bg-violet-50 border border-violet-100"}`}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Paintbrush size={14} className="text-white" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? "text-white" : "text-slate-800"}`} style={{ fontWeight: 700 }}>Visual Theme</p>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Themes are purely visual — swap freely without losing your <strong>{typeDef.label}</strong> content. Graphics adapt to the screen size automatically.
                      </p>
                    </div>
                  </div>

                  {/* ── Suggested for this template type ── */}
                  {suggestedThemes(profile.templateType).length > 0 && (
                    <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={14} className="text-amber-400" />
                        <p className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                          Suggested for {typeDef.label}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-amber-950/40 text-amber-400" : "bg-amber-50 text-amber-600"}`} style={{ fontWeight: 600 }}>
                          Graphic themes
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {suggestedThemes(profile.templateType).map((th) => {
                          const isSelected = profile.theme === th.id;
                          const G = th.Graphic;
                          return (
                            <button
                              key={th.id}
                              onClick={() => updateTop("theme", th.id)}
                              className={`relative rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                                isSelected ? "ring-2 ring-offset-2 ring-indigo-500 shadow-xl scale-[1.02]" : "hover:scale-[1.01]"
                              }`}
                              style={{ aspectRatio: "3/4" }}
                            >
                              {/* Gradient base */}
                              <div className="absolute inset-0" style={{ background: th.gradient }} />
                              {/* Graphic */}
                              {G && <G />}
                              {/* Profile wireframe */}
                              <div className="absolute inset-0 flex flex-col items-center justify-end pb-3 px-2">
                                <div className="w-8 h-8 rounded-full border-2 border-white/40 bg-white/15 mb-1.5" />
                                <div className="w-12 h-1.5 rounded-full bg-white/45 mb-1" />
                                <div className="w-9 h-1 rounded-full bg-white/25 mb-2" />
                                {[1,2].map((i) => <div key={i} className="w-full h-2.5 rounded-lg bg-white/15 mb-1" />)}
                              </div>
                              {/* Selected check */}
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                                  <Check size={13} className="text-indigo-600" />
                                </div>
                              )}
                              {/* Name + badge */}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/35 backdrop-blur-sm pt-1.5 pb-1.5 px-1.5">
                                <p className="text-white text-center truncate" style={{ fontSize: 9, fontWeight: 700 }}>{th.name}</p>
                                {th.badge && (
                                  <p className="text-amber-300 text-center" style={{ fontSize: 8, fontWeight: 600 }}>{th.badge}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── All themes ── */}
                  <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                    <p className={`text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>All Themes</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                      {themes.map((th) => {
                        const isSelected = profile.theme === th.id;
                        const G = th.Graphic;
                        return (
                          <button
                            key={th.id}
                            onClick={() => updateTop("theme", th.id)}
                            className={`relative rounded-xl overflow-hidden transition-all duration-200 group ${
                              isSelected
                                ? "ring-2 ring-offset-1 ring-indigo-500 shadow-lg scale-[1.04]"
                                : "hover:-translate-y-0.5 hover:shadow-md"
                            }`}
                            style={{ aspectRatio: "2/3" }}
                          >
                            <div className="absolute inset-0" style={{ background: th.gradient }} />
                            {G && <G />}
                            {/* Tiny profile wireframe */}
                            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2 px-1.5">
                              <div className="w-6 h-6 rounded-full border border-white/35 bg-white/12 mb-1" />
                              <div className="w-8 h-1 rounded-full bg-white/40 mb-0.5" />
                              <div className="w-6 h-0.5 rounded-full bg-white/25 mb-1.5" />
                              {[1,2].map((i) => <div key={i} className="w-full h-2 rounded bg-white/12 mb-0.5" />)}
                            </div>
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center">
                                <Check size={10} className="text-indigo-600" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/30 py-1 px-1">
                              <p className="text-white text-center truncate" style={{ fontSize: 8, fontWeight: 700 }}>{th.name}</p>
                            </div>
                            {/* Hover tooltip */}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? "hidden" : ""}`}>
                              <p className="text-white text-center px-1" style={{ fontSize: 9, fontWeight: 700 }}>{th.name}</p>
                              {th.badge && <p className="text-amber-300" style={{ fontSize: 8 }}>{th.badge}</p>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Graphic Overlay Toggle ── */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <rect x="1" y="1" width="12" height="12" rx="2.5" stroke={isDark ? "#a78bfa" : "#DC2626"} strokeWidth="1.4" />
                          <path d="M3.5 10 Q7 4 10.5 10" stroke={isDark ? "#a78bfa" : "#DC2626"} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                          <circle cx="7" cy="5.5" r="1.2" fill={isDark ? "#a78bfa" : "#DC2626"} />
                        </svg>
                        <p className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                          Graphic Overlay
                        </p>
                      </div>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {getTheme(profile.theme).Graphic
                          ? "Show or hide the decorative pattern on this theme."
                          : "This theme has no graphic — switch to a graphic theme to enable."}
                      </p>
                    </div>
                    {/* iOS-style toggle */}
                    <button
                      onClick={() => getTheme(profile.theme).Graphic && updateTop("showGraphic", !profile.showGraphic)}
                      aria-pressed={profile.showGraphic}
                      aria-label="Toggle graphic overlay"
                      className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        !getTheme(profile.theme).Graphic
                          ? isDark ? "bg-slate-800 cursor-not-allowed" : "bg-slate-200 cursor-not-allowed"
                          : profile.showGraphic
                          ? "bg-indigo-500"
                          : isDark ? "bg-slate-700" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                          profile.showGraphic && getTheme(profile.theme).Graphic ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* ── Color Palette Customizer ── */}
                  <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-md flex-shrink-0" style={{ background: "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)" }} />
                      <p className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                        Customize Color Palette
                      </p>
                    </div>
                    <p className={`text-xs mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Override the theme's gradient while keeping its graphic. "Original" restores the theme's own colors.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {palettes.map((pal) => {
                        const isSelPal = profile.palette === pal.id;
                        const swatchBg = pal.id === "original"
                          ? getGradient(profile.theme, "original").gradient
                          : `linear-gradient(135deg, ${pal.previewColors[0]}, ${pal.previewColors[1]})`;
                        return (
                          <div key={pal.id} className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => updateTop("palette", pal.id)}
                              title={pal.name}
                              className={`relative flex-shrink-0 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                                isSelPal
                                  ? "ring-2 ring-offset-2 ring-indigo-500 scale-110 shadow-lg"
                                  : "opacity-85 hover:opacity-100 hover:shadow-md"
                              }`}
                              style={{ width: 46, height: 30, background: swatchBg }}
                            >
                              {isSelPal && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                                  <div className="w-4 h-4 rounded-full bg-white/90 flex items-center justify-center shadow">
                                    <Check size={9} className="text-indigo-600" />
                                  </div>
                                </div>
                              )}
                              {pal.id === "original" && !isSelPal && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-white drop-shadow" style={{ fontSize: 7, fontWeight: 800, textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>OG</span>
                                </div>
                              )}
                            </button>
                            <span className={`text-center leading-tight ${isDark ? "text-slate-500" : "text-slate-400"}`} style={{ fontSize: 7, maxWidth: 46 }}>
                              {pal.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {profile.palette !== "original" && (
                      <div className={`flex items-center justify-between mt-3 pt-3 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Palette:{" "}
                          <span style={{ fontWeight: 600, color: isDark ? "#a78bfa" : "#DC2626" }}>
                            {palettes.find((p) => p.id === profile.palette)?.name}
                          </span>
                        </p>
                        <button
                          onClick={() => updateTop("palette", "original")}
                          className={`text-xs transition-colors ${isDark ? "text-rose-400 hover:text-rose-300" : "text-rose-500 hover:text-rose-600"}`}
                          style={{ fontWeight: 600 }}
                        >
                          Reset to Original
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right: Live Preview ── */}
          <div className={`lg:w-80 xl:w-96 flex-shrink-0 ${!showPreview ? "hidden lg:block" : ""}`}>
            <div className="lg:sticky lg:top-36">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Eye size={15} className={isDark ? "text-slate-400" : "text-slate-500"} />
                  <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontWeight: 600 }}>Live Preview</span>
                </div>
                <button onClick={() => setShowPreview(false)} className={`lg:hidden text-sm ${isDark ? "text-slate-400" : "text-slate-500"} hover:text-indigo-500`}>
                  ← Back to Edit
                </button>
              </div>
              <MobilePreview data={profile} typeDef={typeDef} />
              <p className={`text-xs text-center mt-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Updates live as you type</p>
              <Link to={previewProfilePath}
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm transition-all hover:opacity-90"
                style={{ background: isDark ? "rgba(79,70,229,0.15)" : "rgba(79,70,229,0.08)", color: "#EA580C", border: "1px solid rgba(79,70,229,0.2)", fontWeight: 600 }}>
                <Zap size={14} />View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Template Switcher Modal ── */}
      <AnimatePresence>
        {showTypeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(5px)" }}
            onClick={() => setShowTypeModal(false)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl ${isDark ? "bg-slate-900" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-1">
                <h2 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800 }}>Switch Template Type</h2>
                <button onClick={() => setShowTypeModal(false)} className={isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"}>
                  <X size={18} />
                </button>
              </div>
              <p className={`text-xs mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Switching resets fields to defaults for the new type. Your theme is kept.</p>
              <div className={`flex items-center gap-2 my-4 p-3 rounded-xl text-xs ${isDark ? "bg-slate-800" : "bg-amber-50"}`}>
                <AlertCircle size={13} className="text-amber-500 flex-shrink-0" />
                <p className={isDark ? "text-slate-300" : "text-amber-800"}>Your current fields will be replaced with the new template's defaults.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {templateTypes.map((type) => {
                  const Icon = type.icon;
                  const isActive = profile.templateType === type.id;
                  return (
                    <button key={type.id} onClick={() => switchTemplate(type.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl text-center transition-all border-2 ${
                        isActive ? "shadow-md" : isDark ? "border-slate-800 hover:border-slate-600" : "border-slate-100 hover:border-slate-200"
                      }`}
                      style={{ borderColor: isActive ? type.color : undefined, background: isActive ? `${type.color}0D` : isDark ? "#0F172A" : "#fff" }}>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${type.color}15` }}>
                        <Icon size={20} style={{ color: type.color }} />
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>{type.label}</p>
                        <p className={`mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`} style={{ fontSize: 10, lineHeight: 1.4 }}>{type.description}</p>
                      </div>
                      {isActive && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: type.color }}><Check size={11} className="text-white" /></div>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
