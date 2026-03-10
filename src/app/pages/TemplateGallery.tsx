import { useState } from "react";
import { Link } from "react-router";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2, PawPrint, Package, CalendarDays,
  ArrowRight, Check, Zap, Star,
  Globe, Phone, Mail, MapPin, Ticket, Instagram,
  Heart, Search, ChevronRight, Layers, Paintbrush,
  Sparkles, ShoppingBag, ShieldCheck
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { themes as allThemes } from "../data/themes";

const PHOTO_ITEMS = "https://images.unsplash.com/photo-1593536488177-1eb3c2d4e3d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwY2FmZSUyMGNvZmZlZSUyMHNob3AlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzE3NTU3MTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_DOG = "https://images.unsplash.com/photo-1721656363841-93e97a879979?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nJTIwZ29sZGVuJTIwcmV0cmlldmVyJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNzU1NzEwfDA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_BIZ = "https://images.unsplash.com/photo-1766561991819-290a7bc7bb7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidXNpbmVzcyUyMHN0b3JlZnJvbnQlMjBicmFuZGluZ3xlbnwxfHx8fDE3NzE3NTU3MTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_CREATOR = "https://images.unsplash.com/photo-1617190071136-3ed95a229659?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGFydGlzdCUyMHN0dWRpbyUyMHBvcnRyYWl0JTIwY29sb3JmdWx8ZW58MXx8fHwxNzcxNzY1MDg3fDA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_EVENT = "https://images.unsplash.com/photo-1761223976145-a85ffe11fc57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVudCUyMGNvbmZlcmVuY2UlMjBzdGFnZSUyMHNldHVwfGVufDF8fHx8MTc3MTc1NTcxNHww&ixlib=rb-4.1.0&q=80&w=1080";

// ─── Template type definitions ────────────────────────────────────────────────

interface TemplateLink { icon: typeof Globe; label: string; accent?: string }
interface TemplateType {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  icon: typeof Package;
  accentColor: string;
  bgGradient: string;
  cardBg: string;
  photo: string;
  photoShape: "circle" | "rounded" | "banner";
  profileName: string;
  profileSub: string;
  profileBadge?: string;
  links: TemplateLink[];
  sections: string[];
  popular?: boolean;
  new?: boolean;
  usedBy: string;
  hardware: string;
}

const templateTypes: TemplateType[] = [
  {
    id: "items",
    name: "Items",
    tagline: "Track and protect what matters",
    description: "Attach an NFC teardrop tag to your personal belongings — laptops, bags, keys, gear. If it's ever lost, anyone who taps the tag sees your contact info and can report the find instantly.",
    category: "Personal",
    icon: Package,
    accentColor: "#DC2626",
    bgGradient: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)",
    cardBg: "linear-gradient(135deg, #DC2626 0%, #EA580C 100%)",
    photo: PHOTO_ITEMS,
    photoShape: "rounded",
    profileName: "MacBook Pro 16\"",
    profileSub: "Serial: FVFC...4Q · Owner Verified",
    links: [
      { icon: Phone, label: "Contact Owner", accent: "#EF4444" },
      { icon: ShieldCheck, label: "Warranty Info", accent: "#10B981" },
      { icon: Globe, label: "Product Manual", accent: "#0EA5E9" },
      { icon: MapPin, label: "Report Found", accent: "#8B5CF6" },
    ],
    sections: ["Item Name & Photo", "Serial & Purchase Info", "Owner Contact", "Lost & Found"],
    popular: true,
    usedBy: "Travelers, students, professionals, anyone with valuables",
    hardware: "Teardrop tag",
  },
  {
    id: "pets",
    name: "Pets",
    tagline: "Keep your pet safe with one tap",
    description: "Give your pet their own NFC teardrop tag. If they wander off, anyone who taps the tag is instantly connected to you. The owner gets a notification with the finder's location — no app needed.",
    category: "Personal",
    icon: PawPrint,
    accentColor: "#F59E0B",
    bgGradient: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
    cardBg: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
    photo: PHOTO_DOG,
    photoShape: "circle",
    profileName: "Buddy",
    profileSub: "Golden Retriever · 3 years old",
    links: [
      { icon: Phone, label: "I'm Lost! Call Owner", accent: "#EF4444" },
      { icon: Heart, label: "Vet Contact", accent: "#EC4899" },
      { icon: Instagram, label: "Buddy's Instagram", accent: "#E1306C" },
      { icon: MapPin, label: "Owner's Address", accent: "#8B5CF6" },
    ],
    sections: ["Pet Name & Photo", "Breed & Age", "Owner Contact", "Emergency & Vet Details"],
    popular: true,
    usedBy: "Pet owners, dog walkers, breeders, pet sitters",
    hardware: "Teardrop tag",
  },
  {
    id: "business",
    name: "Business",
    tagline: "Your brand on an NFC card",
    description: "A digital business card for cafes, shops, salons, gyms, and professional services. Customers tap to see your menu, hours, services, and location. Upload your own SVG logo for a fully branded card.",
    category: "Business",
    icon: Building2,
    accentColor: "#0EA5E9",
    bgGradient: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
    cardBg: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)",
    photo: PHOTO_BIZ,
    photoShape: "rounded",
    profileName: "The Bean House",
    profileSub: "Cafe & Brunch · Open until 6 PM",
    profileBadge: "4.9 Rating",
    links: [
      { icon: Globe, label: "View Menu", accent: "#0EA5E9" },
      { icon: ShoppingBag, label: "Order Online", accent: "#D97706" },
      { icon: Phone, label: "Call Us", accent: "#10B981" },
      { icon: MapPin, label: "Get Directions", accent: "#F59E0B" },
    ],
    sections: ["Business Name & Logo", "Category & Hours", "Menu & Services", "Location & Contact"],
    usedBy: "Cafes, shops, salons, gyms, agencies, studios",
    hardware: "NFC Card",
  },
  {
    id: "creator",
    name: "Creator",
    tagline: "One card for everything you create",
    description: "Built for musicians, artists, podcasters, photographers, designers, and every creative professional. Showcase your portfolio, link all your platforms, and make it easy for people to hire or book you — all from a single NFC card tap.",
    category: "Creative",
    icon: Sparkles,
    accentColor: "#EC4899",
    bgGradient: "linear-gradient(135deg, #FDF2F8 0%, #EDE9FE 100%)",
    cardBg: "linear-gradient(135deg, #9333EA 0%, #EC4899 55%, #F97316 100%)",
    photo: PHOTO_CREATOR,
    photoShape: "circle",
    profileName: "Maya Lee",
    profileSub: "Illustrator · Podcaster · 45K Fans",
    profileBadge: "Open for Commissions",
    links: [
      { icon: Globe, label: "Portfolio", accent: "#EC4899" },
      { icon: Globe, label: "Podcast", accent: "#9333EA" },
      { icon: ShoppingBag, label: "Shop & Merch", accent: "#F97316" },
      { icon: Mail, label: "Hire / Book Me", accent: "#8B5CF6" },
    ],
    sections: ["Creator Bio & Photo", "Portfolio & Platforms", "Social Links", "Bookings & Merch"],
    new: true,
    usedBy: "Musicians, painters, podcasters, photographers, designers, DJs",
    hardware: "NFC Card",
  },
  {
    id: "event",
    name: "Event",
    tagline: "Every attendee, one tap away",
    description: "Perfect for conferences, meetups, pop-ups, and parties. Give each attendee an NFC badge they can tap to see the schedule, RSVP, buy tickets, find the venue, and connect with speakers — all without downloading an app.",
    category: "Events",
    icon: CalendarDays,
    accentColor: "#8B5CF6",
    bgGradient: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
    cardBg: "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)",
    photo: PHOTO_EVENT,
    photoShape: "banner",
    profileName: "TechConf 2026",
    profileSub: "March 15 · San Francisco, CA",
    profileBadge: "200 spots left",
    links: [
      { icon: Ticket, label: "Get Tickets", accent: "#8B5CF6" },
      { icon: Globe, label: "View Schedule", accent: "#6D28D9" },
      { icon: MapPin, label: "Venue & Directions", accent: "#EF4444" },
      { icon: CalendarDays, label: "Add to Calendar", accent: "#10B981" },
    ],
    sections: ["Event Name & Banner", "Date, Time & Location", "Tickets & RSVP", "Schedule & Speakers"],
    usedBy: "Conferences, meetups, parties, pop-ups, trade shows",
    hardware: "NFC Badge",
  },
];

// themes imported from ../data/themes via allThemes

const categories = ["All", "Personal", "Business", "Creative", "Events"];

// ─── Phone Preview Component ──────────────────────────────────────────────────

function PhonePreview({ template }: { template: TemplateType }) {
  return (
    <div className="relative mx-auto" style={{ width: 140, height: 280 }}>
      {/* Shell */}
      <div className="absolute inset-0 rounded-[1.75rem] bg-slate-800 shadow-xl" />
      {/* Screen */}
      <div
        className="absolute inset-[2px] rounded-[1.65rem] overflow-hidden flex flex-col"
        style={{ background: template.cardBg }}
      >
        {/* Notch */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-3 bg-slate-800 rounded-full z-10" />

        <div className="flex-1 overflow-hidden pt-5 px-3 pb-3 flex flex-col items-center">
          {/* Photo / Banner */}
          {template.photoShape === "banner" ? (
            <div className="w-full h-16 rounded-lg overflow-hidden mb-2 flex-shrink-0">
              <ImageWithFallback src={template.photo} alt={template.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`overflow-hidden border-2 border-white/30 mb-2 flex-shrink-0 shadow-lg ${template.photoShape === "circle" ? "w-14 h-14 rounded-full" : "w-14 h-14 rounded-xl"}`}>
              <ImageWithFallback src={template.photo} alt={template.name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Name */}
          <p className="text-white text-center leading-tight mb-0.5" style={{ fontSize: 9, fontWeight: 700 }}>
            {template.profileName}
          </p>
          <p className="text-white/70 text-center leading-tight mb-2" style={{ fontSize: 7.5 }}>
            {template.profileSub}
          </p>

          {/* Badge */}
          {template.profileBadge && (
            <div className="bg-white/20 rounded-full px-2 py-0.5 mb-2">
              <p className="text-white text-center" style={{ fontSize: 6.5, fontWeight: 600 }}>{template.profileBadge}</p>
            </div>
          )}

          {/* Links */}
          <div className="w-full space-y-1 mt-auto">
            {template.links.slice(0, 3).map((link) => (
              <div
                key={link.label}
                className="flex items-center gap-1.5 rounded-md py-1 px-2"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <link.icon size={6} className="text-white flex-shrink-0" />
                <span className="text-white truncate" style={{ fontSize: 7, fontWeight: 500 }}>{link.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template Card Component ──────────────────────────────────────────────────

function TemplateCard({ template, isDark }: { template: TemplateType; isDark: boolean }) {
  const [hovered, setHovered] = useState(false);
  const Icon = template.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      layout
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 ${
        hovered ? "shadow-2xl -translate-y-1" : "shadow-sm"
      } ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}
    >
      {/* Badges */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 items-end">
        {template.popular && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700" style={{ fontWeight: 600 }}>
            <Star size={9} className="fill-amber-500 text-amber-500" /> Popular
          </span>
        )}
        {template.new && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700" style={{ fontWeight: 600 }}>
            New
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col sm:flex-row gap-5">
        {/* Phone preview */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-xl p-4"
          style={{ background: template.bgGradient, minWidth: 160 }}
        >
          <PhonePreview template={template} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
          <div>
            {/* Header */}
            <div className="flex items-start gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${template.accentColor}18` }}
              >
                <Icon size={18} style={{ color: template.accentColor }} />
              </div>
              <div>
                <h3 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>{template.name}</h3>
                <p className="text-xs" style={{ color: template.accentColor, fontWeight: 600 }}>{template.tagline}</p>
              </div>
            </div>

            <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ lineHeight: 1.65 }}>
              {template.description}
            </p>

            {/* Sections included */}
            <div className="mb-3">
              <p className={`text-xs mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`} style={{ fontWeight: 600, letterSpacing: "0.04em" }}>
                INCLUDED SECTIONS
              </p>
              <div className="flex flex-wrap gap-1.5">
                {template.sections.map((s) => (
                  <span
                    key={s}
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg ${
                      isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Check size={9} style={{ color: template.accentColor }} />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Hardware format */}
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <span style={{ fontWeight: 600 }}>Hardware:</span> {template.hardware}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: isDark ? "#1E293B" : "#F1F5F9" }}>
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <span style={{ fontWeight: 600 }}>Best for:</span> {template.usedBy}
            </p>
            <Link
              to="/hardware-setup"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm flex-shrink-0 transition-all hover:opacity-90 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${template.accentColor}, ${template.accentColor}CC)`, fontWeight: 600 }}
            >
              Get Started
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TemplateGallery() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeView, setActiveView] = useState<"templates" | "themes">("templates");

  const filtered = templateTypes.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.usedBy.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || t.category === activeCategory;
    return matchSearch && matchCat;
  });

  const typeIconMap: Record<string, typeof Package> = {
    items: Package,
    pets: PawPrint,
    business: Building2,
    creator: Sparkles,
    event: CalendarDays,
  };

  return (
    <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950" : "bg-white"}`}>
      {/* Hero */}
      <div className="relative pt-16 pb-12 overflow-hidden" style={{
        background: isDark
          ? "linear-gradient(135deg, #0f0c29 0%, #1e1b4b 100%)"
          : "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)"
      }}>
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(79,70,229,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.6) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className={`mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Choose Your Profile Type
            </h1>
            <p className={`text-lg max-w-2xl mx-auto mb-8 ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ lineHeight: 1.7 }}>
              Each profile type is <span style={{ fontWeight: 700, color: "#DC2626" }}>locked to a specific NFC hardware format</span> — teardrop tags for Items and Pets, cards for Business and Creator, badges for Events.
              Pick a type, then choose a <span style={{ fontWeight: 700, color: "#EA580C" }}>visual theme</span> to make it yours.
            </p>

            {/* Templates vs Themes toggle */}
            <div className={`inline-flex items-stretch gap-0 rounded-2xl p-1 mb-8 ${isDark ? "bg-slate-800/60 border border-slate-700" : "bg-white/80 border border-slate-200 shadow-sm"}`}
              style={{ backdropFilter: "blur(12px)" }}>
              <button
                onClick={() => setActiveView("templates")}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm transition-all ${
                  activeView === "templates" ? "text-white shadow-md" : isDark ? "text-slate-300 hover:text-white" : "text-slate-500 hover:text-slate-800"
                }`}
                style={{
                  background: activeView === "templates" ? "linear-gradient(135deg, #DC2626, #EA580C)" : "transparent",
                  fontWeight: activeView === "templates" ? 700 : 400,
                }}
              >
                <Layers size={15} />
                Profile Types
                <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1 ${activeView === "templates" ? "bg-white/20 text-white" : isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                  {templateTypes.length}
                </span>
              </button>
              <button
                onClick={() => setActiveView("themes")}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm transition-all ${
                  activeView === "themes" ? "text-white shadow-md" : isDark ? "text-slate-300 hover:text-white" : "text-slate-500 hover:text-slate-800"
                }`}
                style={{
                  background: activeView === "themes" ? "linear-gradient(135deg, #EC4899, #8B5CF6)" : "transparent",
                  fontWeight: activeView === "themes" ? 700 : 400,
                }}
              >
                <Paintbrush size={15} />
                Themes
                <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1 ${activeView === "themes" ? "bg-white/20 text-white" : isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                  {allThemes.length}
                </span>
              </button>
            </div>

            {/* Key distinction callout */}
            <div className={`inline-grid grid-cols-2 gap-4 text-left px-6 py-4 rounded-2xl text-sm ${
              isDark ? "bg-slate-800/40 border border-slate-700/40" : "bg-white/60 border border-slate-200 shadow-sm"
            }`} style={{ backdropFilter: "blur(8px)" }}>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Layers size={12} className="text-indigo-600" />
                </div>
                <div>
                  <p className={`${isDark ? "text-white" : "text-slate-800"}`} style={{ fontWeight: 700 }}>Profile Type</p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Purpose, fields, hardware format & features</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Paintbrush size={12} className="text-pink-600" />
                </div>
                <div>
                  <p className={`${isDark ? "text-white" : "text-slate-800"}`} style={{ fontWeight: 700 }}>Theme</p>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Colors, palettes, graphics & visual style</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          {/* ── TEMPLATES VIEW ── */}
          {activeView === "templates" && (
            <motion.div key="templates" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              {/* Search & Category Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className={`relative flex-1 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-400"}`} />
                  <input
                    type="text"
                    placeholder="Search profile types..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full h-11 pl-10 pr-4 bg-transparent outline-none text-sm ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"}`}
                  />
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                      activeCategory === cat
                        ? "text-white"
                        : isDark ? "bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500/30" : "bg-slate-50 border border-slate-200 text-slate-600 hover:border-indigo-200"
                    }`}
                    style={{
                      fontWeight: activeCategory === cat ? 600 : 400,
                      background: activeCategory === cat ? "linear-gradient(135deg, #DC2626, #EA580C)" : undefined,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                <div className="space-y-4">
                  {filtered.map((t, i) => (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <TemplateCard template={t} isDark={isDark} />
                    </motion.div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="py-20 text-center">
                      <p className={`text-lg mb-2 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>No profile types found</p>
                      <button onClick={() => { setSearch(""); setActiveCategory("All"); }} className="text-sm text-indigo-500 hover:text-indigo-400" style={{ fontWeight: 600 }}>
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </AnimatePresence>

              {/* Switch to Themes CTA */}
              <div
                className="mt-12 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
                style={{ background: isDark ? "linear-gradient(135deg, rgba(236,72,153,0.1), rgba(139,92,246,0.1))" : "linear-gradient(135deg, #FDF2F8, #F5F3FF)", border: isDark ? "1px solid rgba(236,72,153,0.2)" : "1px solid #F3E8FF" }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                    <Paintbrush size={18} className="text-white" />
                  </div>
                  <div>
                    <p className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>Ready to style your profile?</p>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Browse visual themes — apply any theme to any profile type in the editor.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveView("themes")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)", fontWeight: 600 }}
                >
                  Browse Themes
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── THEMES VIEW ── */}
          {activeView === "themes" && (
            <motion.div key="themes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              {/* Explanation banner */}
              <div className={`p-5 rounded-2xl mb-6 flex items-start gap-4 ${isDark ? "bg-slate-900 border border-slate-800" : "bg-slate-50 border border-slate-100"}`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Paintbrush size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`mb-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                    {allThemes.length} themes — all with graphic overlays
                  </p>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ lineHeight: 1.65 }}>
                    Some themes are designed for specific profile types (Pets, Business, Creator, etc.), but you can mix and match freely. Unlock custom color palettes in the editor too.
                  </p>
                </div>
              </div>

              {/* ── Type-specific themes section ── */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={15} className="text-amber-400" />
                  <p className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                    Designed for specific profile types
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-amber-950/40 text-amber-400" : "bg-amber-50 text-amber-600"}`} style={{ fontWeight: 600 }}>
                    {allThemes.filter(t => t.suggestedFor && t.suggestedFor.length > 0).length} themes
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {allThemes.filter(t => t.suggestedFor && t.suggestedFor.length > 0).map((t, i) => {
                    const G = t.Graphic;
                    return (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="group cursor-pointer"
                      >
                        <div className="relative rounded-2xl overflow-hidden mb-2.5 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl shadow-md"
                          style={{ aspectRatio: "3/4", background: t.gradient }}>
                          {/* Graphic overlay */}
                          {G && <G />}
                          {/* Profile wireframe */}
                          <div className="absolute inset-0 flex flex-col items-center justify-end p-3 pb-4 gap-1.5 z-10">
                            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30" />
                            <div className="w-16 h-2 rounded-full bg-white/45" />
                            <div className="w-12 h-1.5 rounded-full bg-white/25" />
                            <div className="space-y-1 w-full mt-1">
                              {[1,2,3].map((n) => <div key={n} className="h-5 rounded-lg bg-white/12 w-full" />)}
                            </div>
                          </div>
                          {/* Badge */}
                          {t.badge && (
                            <div className="absolute top-2 left-2 z-20">
                              <span className="text-amber-300 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md" style={{ fontSize: 8, fontWeight: 700 }}>
                                {t.badge}
                              </span>
                            </div>
                          )}
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 flex items-center justify-center z-20">
                            <Link to="/editor"
                              className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 text-slate-900 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg"
                              style={{ fontWeight: 600 }}>
                              <Zap size={11} className="text-indigo-500" />
                              Try in Editor
                            </Link>
                          </div>
                        </div>
                        <p className={`text-sm text-center ${isDark ? "text-white" : "text-slate-800"}`} style={{ fontWeight: 700 }}>{t.name}</p>
                        {/* Suggested-for icons */}
                        <div className="flex items-center justify-center gap-1 mt-1">
                          {t.suggestedFor?.map((typeId) => {
                            const Icon = typeIconMap[typeId] || Star;
                            return (
                              <div key={typeId} title={typeId} className={`w-4 h-4 rounded-full flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                                <Icon size={8} className={isDark ? "text-slate-400" : "text-slate-500"} />
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* ── Universal themes section ── */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Paintbrush size={15} className={isDark ? "text-slate-400" : "text-slate-500"} />
                  <p className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                    Works with all profile types
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`} style={{ fontWeight: 600 }}>
                    {allThemes.filter(t => !t.suggestedFor || t.suggestedFor.length === 0).length} themes
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {allThemes.filter(t => !t.suggestedFor || t.suggestedFor.length === 0).map((t, i) => {
                    const G = t.Graphic;
                    return (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="group cursor-pointer"
                      >
                        <div className="relative rounded-2xl overflow-hidden mb-2.5 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl shadow-sm"
                          style={{ aspectRatio: "3/4", background: t.gradient }}>
                          {G && <G />}
                          <div className="absolute inset-0 flex flex-col items-center justify-end p-3 pb-4 gap-1.5 z-10">
                            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/25" />
                            <div className="w-16 h-2 rounded-full bg-white/40" />
                            <div className="w-12 h-1.5 rounded-full bg-white/22" />
                            <div className="space-y-1 w-full mt-1">
                              {[1,2,3].map((n) => <div key={n} className="h-5 rounded-lg bg-white/12 w-full" />)}
                            </div>
                          </div>
                          {t.badge === "Popular" && (
                            <div className="absolute top-2 left-2 z-20">
                              <span className="text-white bg-indigo-500/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md flex items-center gap-0.5" style={{ fontSize: 8, fontWeight: 700 }}>
                                <Star size={7} className="fill-current" /> Popular
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center z-20">
                            <Link to="/editor"
                              className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 text-slate-900 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow"
                              style={{ fontWeight: 600 }}>
                              <Zap size={11} className="text-indigo-500" />
                              Try in Editor
                            </Link>
                          </div>
                        </div>
                        <p className={`text-sm text-center ${isDark ? "text-white" : "text-slate-800"}`} style={{ fontWeight: 700 }}>{t.name}</p>
                        <p className={`text-xs text-center mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>All profile types</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Palette callout */}
              <div className={`mb-8 p-5 rounded-2xl flex items-start gap-4 ${isDark ? "bg-slate-900 border border-slate-800" : "bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100"}`}>
                <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)" }} />
                <div className="flex-1 min-w-0">
                  <p className={`mb-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                    Customize any theme with 13 color palettes
                  </p>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    In the editor, pick any theme then override its colors with a custom palette — Midnight, Deep Ocean, Cosmic, Rose Gold, Cotton Candy, and more. You can also toggle the graphic overlay on or off if you just want a clean color gradient.
                  </p>
                </div>
                <Link to="/editor"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm flex-shrink-0 transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)", fontWeight: 600 }}>
                  Open Editor
                  <ChevronRight size={13} />
                </Link>
              </div>

              {/* Switch back CTA */}
              <div className="p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-4 justify-between"
                style={{
                  background: isDark ? "linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.1))" : "linear-gradient(135deg, #EEF2FF, #F5F3FF)",
                  border: isDark ? "1px solid rgba(79,70,229,0.2)" : "1px solid #E0E7FF",
                }}>
                <div>
                  <p className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>Haven't picked a profile type yet?</p>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Choose a profile type first, then apply your theme in the editor.</p>
                </div>
                <button onClick={() => setActiveView("templates")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 600 }}>
                  <Layers size={14} />
                  Browse Profile Types
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
