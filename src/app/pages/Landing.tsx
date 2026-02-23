import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap, ArrowRight, Check, Shield, Globe, Smartphone,
  BarChart3, Share2, Star, ChevronRight, Wifi,
  Users, TrendingUp, Clock, Award, PawPrint, Coffee,
  Building2, User, Calendar, Layers, Paintbrush, Sparkles,
  Phone, Mail, MapPin, ShoppingBag, Instagram, Ticket
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const PHOTO_PERSON  = "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_PERSON2 = "https://images.unsplash.com/photo-1626784579980-db39c1a13aa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbmVyJTIwd29tYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE2NjI0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_BIZ     = "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHByb2Zlc3Npb25hbCUyMHN1aXQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE3NTMwOTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_DOG     = "https://images.unsplash.com/photo-1721656363841-93e97a879979?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nJTIwZ29sZGVuJTIwcmV0cmlldmVyJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNzU1NzEwfDA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_CAFE    = "https://images.unsplash.com/photo-1593536488177-1eb3c2d4e3d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwY2FmZSUyMGNvZmZlZSUyMHNob3AlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzE3NTU3MTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_MUSIC   = "https://images.unsplash.com/photo-1771191057577-e216395637a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGFydGlzdCUyMHBlcmZvcm1lciUyMHN0YWdlfGVufDF8fHx8MTc3MTc1NTcxNHww&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_CREATOR = "https://images.unsplash.com/photo-1617190071136-3ed95a229659?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGFydGlzdCUyMHN0dWRpbyUyMHBvcnRyYWl0JTIwY29sb3JmdWx8ZW58MXx8fHwxNzcxNzY1MDg3fDA&ixlib=rb-4.1.0&q=80&w=1080";

// ─── Profile Types (not themes — these define PURPOSE) ────────────────────────
interface ProfileType {
  id: string;
  icon: typeof User;
  label: string;
  color: string;
  cardGradient: string;
  textColor: string;
  photo: string;
  photoShape: "circle" | "rounded" | "banner";
  name: string;
  sub: string;
  badge?: string;
  links: { label: string }[];
}

const profileTypes: ProfileType[] = [
  {
    id: "individual",
    icon: User,
    label: "Individual",
    color: "#DC2626",
    cardGradient: "linear-gradient(135deg, #DC2626 0%, #EA580C 50%, #FBBF24 100%)",
    textColor: "#fff",
    photo: PHOTO_PERSON,
    photoShape: "circle",
    name: "Alex Rivera",
    sub: "Product Designer · Designly",
    links: [{ label: "LinkedIn" }, { label: "Portfolio" }, { label: "Email Me" }],
  },
  {
    id: "business",
    icon: Building2,
    label: "Business",
    color: "#0369A1",
    cardGradient: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)",
    textColor: "#fff",
    photo: PHOTO_BIZ,
    photoShape: "rounded",
    name: "Designly Studio",
    sub: "Brand & UX Agency · ⭐ 4.9",
    links: [{ label: "Our Website" }, { label: "Services" }, { label: "Get Directions" }],
  },
  {
    id: "pet",
    icon: PawPrint,
    label: "Pet",
    color: "#F59E0B",
    cardGradient: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
    textColor: "#fff",
    photo: PHOTO_DOG,
    photoShape: "circle",
    name: "🐾 Buddy",
    sub: "Golden Retriever · 3 years old",
    badge: "Scan if lost",
    links: [{ label: "🚨 Call Owner" }, { label: "My Vet" }, { label: "Instagram" }],
  },
  {
    id: "cafe",
    icon: Coffee,
    label: "Café & Restaurant",
    color: "#92400E",
    cardGradient: "linear-gradient(135deg, #92400E 0%, #D97706 100%)",
    textColor: "#fff",
    photo: PHOTO_CAFE,
    photoShape: "banner",
    name: "The Bean House",
    sub: "Coffee & Brunch · Open until 6PM",
    links: [{ label: "📋 View Menu" }, { label: "📦 Order Online" }, { label: "📅 Reserve Table" }],
  },
  {
    id: "creator",
    icon: Sparkles,
    label: "Creator",
    color: "#EA580C",
    cardGradient: "linear-gradient(135deg, #C2410C 0%, #EA580C 55%, #FBBF24 100%)",
    textColor: "#fff",
    photo: PHOTO_CREATOR,
    photoShape: "circle",
    name: "Maya Lee",
    sub: "Illustrator · Podcaster · 45K Fans",
    links: [{ label: "🎨 Portfolio" }, { label: "🎙️ Listen Now" }, { label: "💬 Hire Me" }],
  },
  {
    id: "event",
    icon: Calendar,
    label: "Event",
    color: "#B45309",
    cardGradient: "linear-gradient(135deg, #7C2D12 0%, #C2410C 55%, #F59E0B 100%)",
    textColor: "#fff",
    photo: PHOTO_MUSIC, // stage/event photo
    photoShape: "banner",
    name: "TechSummit 2026",
    sub: "Feb 28 · San Francisco",
    links: [{ label: "🎟 Get Tickets" }, { label: "📋 Schedule" }, { label: "📍 Venue Map" }],
  },
];

// ─── Template showcase details ─────────────────────────────────────────────────
const templateDetails: Record<string, { description: string; features: string[]; forWho: string; cta: string }> = {
  individual: {
    description: "The perfect digital business card. Showcase your work, social presence, and contact details — all on one elegant, shareable profile.",
    features: ["Name, photo & headline bio", "Social media & portfolio links", "One-tap contact save (vCard)", "Real-time tap analytics", "Works on any phone, no app needed"],
    forWho: "Professionals, freelancers, students, creatives",
    cta: "Create Individual Profile",
  },
  business: {
    description: "Turn your brand into a shareable digital hub. Perfect for shops, agencies, and any business that values a great first impression.",
    features: ["Brand logo & full-width cover banner", "Services, pricing & opening hours", "Location & directions map", "Team member spotlight", "Customer review & rating links"],
    forWho: "Shops, agencies, studios, clinics",
    cta: "Create Business Profile",
  },
  pet: {
    description: "Keep your pet safe with a scannable NFC tag. If they ever get lost, anyone who scans can reach you instantly.",
    features: ["Pet name, breed & age details", "Emergency contact button", "Vet info & medical notes", "Owner location & address", "Lost & found alert mode"],
    forWho: "Pet owners, breeders, animal shelters",
    cta: "Create Pet Profile",
  },
  cafe: {
    description: "Replace printed menus and table cards. Customers tap to browse your menu, order online, and make reservations in seconds.",
    features: ["Digital menu & daily specials", "Online ordering integration", "Table reservation link", "Opening hours & map", "Social media & Google reviews"],
    forWho: "Cafés, restaurants, food trucks, bakeries",
    cta: "Create Café Profile",
  },
  creator: {
    description: "Built for every kind of creative — musicians, painters, podcasters, DJs, photographers, illustrators, and more. One profile that shows the world what you do and how to work with you.",
    features: ["Name, photo & creative bio", "Portfolio, streaming & platform links", "Booking / commission contact", "Merch, shop & fan support links", "Upcoming shows, events & tour dates"],
    forWho: "Musicians, painters, podcasters, DJs, photographers, illustrators, designers & all creative professionals",
    cta: "Create Creator Profile",
  },
  event: {
    description: "The modern event badge. Share your agenda, speakers, and logistics with every attendee — via a single tap on their badge or table card.",
    features: ["Event name, date & venue details", "Full schedule & speaker lineup", "Ticket & registration links", "Live updates & announcements", "Post-event recordings & slides"],
    forWho: "Conferences, parties, meetups, concerts",
    cta: "Create Event Profile",
  },
};

// ─── Themes preview (visual styling only) ─────────────────────────────────────
const themeSwatches = [
  { name: "Wave", gradient: "linear-gradient(135deg, #DC2626, #EA580C, #FBBF24)" },
  { name: "Sunset", gradient: "linear-gradient(135deg, #DC2626, #EA580C, #FBBF24)" },
  { name: "Dark Pro", gradient: "linear-gradient(135deg, #1C0500, #3F1A0A)" },
  { name: "Ocean", gradient: "linear-gradient(135deg, #0ea5e9, #2563eb)" },
  { name: "Rose", gradient: "linear-gradient(135deg, #fda4af, #e11d48)" },
  { name: "Forest", gradient: "linear-gradient(135deg, #065f46, #059669)" },
  { name: "Noir", gradient: "linear-gradient(135deg, #111827, #1f2937)" },
  { name: "Minimal", gradient: "linear-gradient(135deg, #f8fafc, #e2e8f0)" },
];

const steps = [
  { step: "01", icon: Layers, title: "Pick a Template", desc: "Choose the profile type that fits your purpose — Individual, Business, Pet, Café, and more." },
  { step: "02", icon: Paintbrush, title: "Apply a Theme", desc: "Dress it up with a visual theme. Gradients, dark mode, minimal — mix and match freely." },
  { step: "03", icon: Share2, title: "Tap & Share", desc: "Activate your NFC tag and share everything with a single tap — no app needed." },
];

const stats = [
  { value: "50K+", label: "Active Profiles" },
  { value: "2.4M", label: "Total Taps" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "4.9★", label: "App Rating" },
];

const features = [
  { icon: Smartphone, title: "NFC + QR Code", desc: "Share via NFC tap or QR scan — your profile works everywhere." },
  { icon: BarChart3, title: "Tap Analytics", desc: "Track profile views, tap locations, and engagement in real-time." },
  { icon: Globe, title: "Works Everywhere", desc: "No app download needed. Profiles open in any browser instantly." },
  { icon: Shield, title: "Privacy First", desc: "You control what's shared. Full data ownership and GDPR compliant." },
  { icon: Paintbrush, title: "Themes for Every Mood", desc: "Apply any visual theme to any template type — fully interchangeable." },
  { icon: TrendingUp, title: "Business Ready", desc: "Team profiles, CRM integration, and bulk management tools." },
];

const testimonials = [
  {
    name: "Sarah Mitchell",
    title: "Marketing Director",
    photo: PHOTO_PERSON2,
    text: "Taparoo replaced my entire stack of business cards. The analytics alone are worth it — I can see exactly who's viewing my profile.",
    stars: 5,
    type: "Individual",
  },
  {
    name: "The Bean House",
    title: "Café Owner · Portland",
    photo: PHOTO_CAFE,
    text: "We put NFC tags on every table. Customers tap to see our menu, order online, and follow us. Engagement went up 40% in a month.",
    stars: 5,
    type: "Café",
  },
  {
    name: "Buddy's Human",
    title: "Dog owner · Austin",
    photo: PHOTO_DOG,
    text: "Buddy got out once and a neighbor scanned his tag. They had my number instantly. Taparoo for pets is genuinely brilliant.",
    stars: 5,
    type: "Pet",
  },
];

// ─── Large Phone Mockup (template showcase) ───────────────────────────────────
function BigPhoneCard({ type }: { type: ProfileType }) {
  return (
    <div className="relative drop-shadow-2xl" style={{ width: 210, height: 440 }}>
      <div className="absolute inset-0 rounded-[2.8rem]"
        style={{ background: "#0a0a0f", boxShadow: "0 40px 80px rgba(0,0,0,0.55), inset 0 0 0 1.5px rgba(255,255,255,0.1)" }} />
      <div className="absolute inset-[4px] rounded-[2.5rem] overflow-hidden flex flex-col"
        style={{ background: type.cardGradient }}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0">
          <span className="text-white/50" style={{ fontSize: 8, fontWeight: 600 }}>9:41</span>
          <div className="w-14 h-3.5 bg-black/50 rounded-full" />
          <span className="text-white/50" style={{ fontSize: 8 }}>●●●</span>
        </div>
        <div className="flex-1 px-4 pb-4 flex flex-col items-center overflow-hidden">
          {type.photoShape === "banner" ? (
            <div className="w-full h-[88px] rounded-xl overflow-hidden mb-3 shrink-0">
              <ImageWithFallback src={type.photo} alt={type.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`overflow-hidden border-2 border-white/30 mb-3 shadow-xl shrink-0 mt-1 ${type.photoShape === "circle" ? "w-[72px] h-[72px] rounded-full" : "w-[72px] h-[72px] rounded-2xl"}`}>
              <ImageWithFallback src={type.photo} alt={type.name} className="w-full h-full object-cover" />
            </div>
          )}
          <p className="text-center mb-0.5" style={{ color: type.textColor, fontWeight: 800, fontSize: "0.78rem" }}>{type.name}</p>
          <p className="text-center opacity-65 mb-2" style={{ color: type.textColor, fontSize: "0.6rem" }}>{type.sub}</p>
          {type.badge && (
            <div className="mb-2.5 px-2.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
              <p style={{ color: type.textColor, fontWeight: 600, fontSize: "0.58rem" }}>{type.badge}</p>
            </div>
          )}
          <div className="w-full mt-auto space-y-2">
            {type.links.map((link) => (
              <div key={link.label} className="py-2 px-3 rounded-xl text-center"
                style={{ background: "rgba(255,255,255,0.18)", color: type.textColor, backdropFilter: "blur(10px)", fontWeight: 500, fontSize: "0.67rem" }}>
                {link.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────
function PhoneCard({ type }: { type: ProfileType }) {
  return (
    <div className="relative" style={{ width: 200, height: 400 }}>
      <div className="absolute inset-0 rounded-[2.5rem] bg-slate-900 shadow-2xl" />
      <div
        className="absolute inset-[3px] rounded-[2.3rem] overflow-hidden flex flex-col"
        style={{ background: type.cardGradient }}
      >
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-full z-10" />

        <div className="flex-1 pt-10 px-4 pb-4 flex flex-col items-center">
          {/* Photo */}
          {type.photoShape === "banner" ? (
            <div className="w-full h-24 rounded-xl overflow-hidden mb-3 flex-shrink-0">
              <ImageWithFallback src={type.photo} alt={type.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`overflow-hidden border-2 border-white/30 mb-3 shadow-lg flex-shrink-0 ${type.photoShape === "circle" ? "w-20 h-20 rounded-full" : "w-20 h-20 rounded-2xl"}`}>
              <ImageWithFallback src={type.photo} alt={type.name} className="w-full h-full object-cover" />
            </div>
          )}

          <p className="text-sm text-center mb-0.5" style={{ color: type.textColor, fontWeight: 700 }}>{type.name}</p>
          <p className="text-xs text-center opacity-75 mb-1" style={{ color: type.textColor }}>{type.sub}</p>

          {type.badge && (
            <div className="mb-2 px-2.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
              <p className="text-xs" style={{ color: type.textColor, fontWeight: 600 }}>{type.badge}</p>
            </div>
          )}

          <div className="w-full mt-auto space-y-2">
            {type.links.map((link) => (
              <div
                key={link.label}
                className="py-2 px-3 rounded-xl text-xs text-center"
                style={{ background: "rgba(255,255,255,0.18)", color: type.textColor, backdropFilter: "blur(8px)", fontWeight: 500 }}
              >
                {link.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Landing() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [activeType, setActiveType] = useState(0);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [tapCount, setTapCount] = useState(2401337);

  useEffect(() => {
    const interval = setInterval(() => {
      setTapCount((c) => c + Math.floor(Math.random() * 3));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate profile types in hero
  useEffect(() => {
    const t = setInterval(() => setActiveType((i) => (i + 1) % profileTypes.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900"}>
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 20%, #DC2626 0%, transparent 70%)" }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(#DC2626 1px, transparent 1px), linear-gradient(90deg, #DC2626 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-sm"
                style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.1), rgba(234,88,12,0.12))", border: "1px solid rgba(220,38,38,0.2)", color: "#EA580C" }}>
                <Zap size={13} />
                <span style={{ fontWeight: 600 }}>The Future of Networking is Here</span>
              </div>

              <h1 className={`mb-6 ${isDark ? "text-white" : "text-slate-900"}`}
                style={{ fontSize: "clamp(2.25rem, 5vw, 3.75rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                One Tap.
                <br />
                <span style={{ background: "linear-gradient(135deg, #DC2626, #EA580C, #FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Endless
                </span>{" "}
                Connections.
              </h1>

              <p className={`text-lg mb-8 max-w-lg ${isDark ? "text-slate-300" : "text-slate-500"}`} style={{ lineHeight: 1.7 }}>
                Create a digital profile for <strong>yourself, your business, your pet, or your café</strong>. Embed it in an NFC tag and share everything with a single tap.
              </p>

              {/* Profile type pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {profileTypes.map((type, i) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setActiveType(i)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                        activeType === i ? "text-white shadow-md scale-105" : isDark ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                      style={{
                        background: activeType === i ? type.cardGradient : undefined,
                        fontWeight: activeType === i ? 600 : 400,
                      }}
                    >
                      <Icon size={12} />
                      {type.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  to="/editor"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 600, boxShadow: "0 8px 30px rgba(220,38,38,0.35)" }}
                >
                  <Zap size={16} />
                  Activate Your Tag
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 px-6 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 ${
                    isDark ? "bg-slate-800 text-white border border-slate-700" : "bg-white text-slate-700 border border-slate-200"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  View Demo Profile
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {["No credit card", "Free template", "Works on any phone"].map((trust) => (
                  <div key={trust} className="flex items-center gap-1.5 text-sm">
                    <Check size={14} className="text-emerald-500" />
                    <span className={isDark ? "text-slate-400" : "text-slate-500"}>{trust}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — Animated phone showing active profile type */}
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="relative flex items-center justify-center">
              <div className="absolute w-80 h-80 rounded-full blur-[80px] opacity-30 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${profileTypes[activeType].color}, transparent)` }} />

              <div className="relative z-10">
                <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeType}
                      initial={{ opacity: 0, y: 15, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -15, scale: 0.97 }}
                      transition={{ duration: 0.35 }}
                    >
                      <PhoneCard type={profileTypes[activeType]} />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Type label badge */}
              <motion.div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs shadow-lg"
                style={{
                  background: isDark ? "rgba(30,30,50,0.9)" : "rgba(255,255,255,0.9)",
                  border: `1px solid ${profileTypes[activeType].color}33`,
                  backdropFilter: "blur(12px)",
                }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Wifi size={12} style={{ color: profileTypes[activeType].color }} />
                <span className={isDark ? "text-slate-300" : "text-slate-600"} style={{ fontWeight: 500 }}>
                  {tapCount.toLocaleString()} taps today
                </span>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill={isDark ? "#0f172a" : "#f8fafc"} />
          </svg>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section className={isDark ? "bg-slate-900" : "bg-slate-50"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="text-4xl mb-1" style={{ fontWeight: 800, background: "linear-gradient(135deg, #DC2626, #EA580C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>
                  {stat.value}
                </div>
                <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className={`py-24 ${isDark ? "bg-slate-950" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-sm"
              style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.15)", color: "#EA580C" }}>
              <Clock size={13} />
              <span style={{ fontWeight: 600 }}>Up and running in minutes</span>
            </div>
            <h2 className={`mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
              How Taparoo Works
            </h2>
            <p className={`text-lg max-w-xl mx-auto ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Three simple steps — pick a template type, apply a theme, and tap to share
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                  className={`relative p-8 rounded-2xl group transition-all duration-300 hover:-translate-y-1 ${isDark ? "bg-slate-900 border border-slate-800 hover:border-orange-500/40" : "bg-white border border-slate-100 hover:border-orange-200 shadow-sm hover:shadow-lg"}`}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)" }}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <span className="text-5xl opacity-10" style={{ fontWeight: 900, color: "#DC2626" }}>{s.step}</span>
                  </div>
                  <h3 className={`mb-2 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>{s.title}</h3>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ lineHeight: 1.7 }}>{s.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 z-10">
                      <ChevronRight size={20} className="text-orange-300" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Template Types Showcase ──────────────────────────────────────────── */}
      <section className={`py-24 relative overflow-hidden ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            key={activeTemplate}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[140px]"
            style={{ background: profileTypes[activeTemplate].color, opacity: 0.07 }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-sm"
              style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.15)", color: "#EA580C" }}>
              <Layers size={13} />
              <span style={{ fontWeight: 600 }}>6 profile types, zero limits</span>
            </div>
            <h2 className={`mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
              A Template Built for{" "}
              <AnimatePresence mode="wait">
                <motion.span key={activeTemplate}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="inline-block"
                  style={{ background: profileTypes[activeTemplate].cardGradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {profileTypes[activeTemplate].label}
                </motion.span>
              </AnimatePresence>
            </h2>
            <p className={`text-lg max-w-xl mx-auto ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Each template comes with purpose-built fields, sections, and link types. Pick the one that fits your story.
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {profileTypes.map((type, i) => {
              const Icon = type.icon;
              const isActive = activeTemplate === i;
              return (
                <motion.button key={type.id} onClick={() => setActiveTemplate(i)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm transition-all duration-200 ${
                    isActive ? "text-white shadow-lg" : isDark
                      ? "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500"
                      : "bg-white text-slate-500 border border-slate-200 hover:text-slate-800 hover:border-slate-300 shadow-sm"
                  }`}
                  style={{ background: isActive ? type.cardGradient : undefined, fontWeight: isActive ? 600 : 400 }}>
                  <Icon size={15} />
                  {type.label}
                </motion.button>
              );
            })}
          </div>

          {/* Main showcase panel */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTemplate}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-3xl overflow-hidden ${isDark ? "border border-slate-800 bg-slate-950" : "border border-slate-200/80 bg-white shadow-2xl"}`}>
              <div className="grid grid-cols-1 lg:grid-cols-2">

                {/* Left — gradient visual */}
                <div className="relative flex items-center justify-center p-10 sm:p-14 overflow-hidden min-h-[400px]"
                  style={{ background: profileTypes[activeTemplate].cardGradient }}>
                  {/* Decorative layers */}
                  <div className="absolute inset-0 opacity-[0.05]" style={{
                    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                  }} />
                  <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "white" }} />
                  <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-2xl opacity-10" style={{ background: "black" }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px] opacity-20" style={{ background: "rgba(255,255,255,0.5)" }} />

                  {/* Floating phone */}
                  <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="relative z-10">
                    <BigPhoneCard type={profileTypes[activeTemplate]} />
                  </motion.div>

                  {/* Template badge */}
                  <div className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(0,0,0,0.28)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.18)" }}>
                    {(() => { const Icon = profileTypes[activeTemplate].icon; return <Icon size={12} className="text-white" />; })()}
                    <span className="text-white text-xs" style={{ fontWeight: 600 }}>{profileTypes[activeTemplate].label}</span>
                  </div>

                  {/* NFC badge */}
                  <div className="absolute bottom-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(0,0,0,0.28)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <Wifi size={11} className="text-white/70" />
                    <span className="text-white/80 text-xs" style={{ fontWeight: 500 }}>NFC + QR ready</span>
                  </div>

                  {/* Tap count floating chip */}
                  <motion.div
                    animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity }}
                    className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                    <TrendingUp size={11} className="text-white" />
                    <span className="text-white text-xs" style={{ fontWeight: 600 }}>+{(Math.floor(Math.random() * 40) + 12)}% this week</span>
                  </motion.div>
                </div>

                {/* Right — detail panel */}
                <div className="p-8 sm:p-12 flex flex-col justify-center">
                  {/* Type pill */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-5 self-start text-xs"
                    style={{ background: `${profileTypes[activeTemplate].color}15`, color: profileTypes[activeTemplate].color, border: `1px solid ${profileTypes[activeTemplate].color}30` }}>
                    {(() => { const Icon = profileTypes[activeTemplate].icon; return <Icon size={13} />; })()}
                    <span style={{ fontWeight: 600 }}>{profileTypes[activeTemplate].label} Template</span>
                  </div>

                  <h3 className={`mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
                    style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                    {templateDetails[profileTypes[activeTemplate].id]?.cta.replace("Create ", "").replace(" Profile", "")} Profile
                  </h3>
                  <p className={`text-sm mb-7 ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ lineHeight: 1.75 }}>
                    {templateDetails[profileTypes[activeTemplate].id]?.description}
                  </p>

                  {/* Feature list */}
                  <div className="space-y-2.5 mb-7">
                    {templateDetails[profileTypes[activeTemplate].id]?.features.map((f, fi) => (
                      <motion.div key={f} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: fi * 0.07, duration: 0.28 }}
                        className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: `${profileTypes[activeTemplate].color}20` }}>
                          <Check size={10} style={{ color: profileTypes[activeTemplate].color }} />
                        </div>
                        <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`} style={{ fontWeight: 500 }}>{f}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* For who */}
                  <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl mb-7 ${isDark ? "bg-slate-800/80 border border-slate-700" : "bg-slate-50 border border-slate-200"}`}>
                    <Users size={14} className={`mt-0.5 shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <span style={{ fontWeight: 600 }}>Perfect for: </span>
                      {templateDetails[profileTypes[activeTemplate].id]?.forWho}
                    </p>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-wrap gap-3">
                    <Link to="/editor"
                      className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm text-white transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 shadow-lg"
                      style={{ background: profileTypes[activeTemplate].cardGradient, fontWeight: 600 }}>
                      <Zap size={14} />
                      {templateDetails[profileTypes[activeTemplate].id]?.cta}
                    </Link>
                    <Link to="/profile"
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm transition-all hover:-translate-y-0.5 ${
                        isDark ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                      style={{ fontWeight: 500 }}>
                      View Example
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>

          {/* Mini icon strip */}
          <div className="grid grid-cols-6 gap-2 sm:gap-3 mt-5">
            {profileTypes.map((type, i) => {
              const Icon = type.icon;
              const isActive = activeTemplate === i;
              return (
                <button key={type.id} onClick={() => setActiveTemplate(i)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? isDark ? "bg-slate-800" : "bg-white shadow-md"
                      : isDark ? "hover:bg-slate-800/50" : "hover:bg-white/60"
                  }`}
                  style={{ outline: isActive ? `2px solid ${type.color}50` : "none" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: isActive ? type.cardGradient : `${type.color}2A`,
                      border: isActive ? "1px solid transparent" : `1px solid ${type.color}4D`,
                      boxShadow: isActive ? "0 8px 18px rgba(28,5,0,0.22)" : "none",
                    }}>
                    <Icon size={15} style={{ color: isActive ? "#fff" : type.color, opacity: isActive ? 1 : 0.98 }} />
                  </div>
                  <span className={`text-xs leading-tight text-center hidden sm:block truncate w-full px-1 ${
                    isActive ? (isDark ? "text-white" : "text-slate-900") : isDark ? "text-slate-500" : "text-slate-400"
                  }`} style={{ fontWeight: isActive ? 600 : 400 }}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <Link to="/templates"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-white"
              style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 600, boxShadow: "0 8px 30px rgba(220,38,38,0.28)" }}>
              Explore All Templates
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Templates vs Themes Explainer ───────────────────────────────────── */}
      <section className={`py-24 ${isDark ? "bg-slate-950" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — visual */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              {/* Theme swatches applied to a Pet profile */}
              <div className={`p-6 rounded-3xl ${isDark ? "bg-slate-900 border border-slate-800" : "bg-slate-50 border border-slate-100"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <PawPrint size={18} className="text-amber-500" />
                  <div>
                    <p className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>Same template, different themes</p>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Buddy the dog — styled 8 ways</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {themeSwatches.map((sw) => (
                    <div key={sw.name} className="group relative cursor-pointer">
                      <div
                        className="rounded-xl overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg"
                        style={{ aspectRatio: "9/16", background: sw.gradient }}
                      >
                        <div className="flex flex-col items-center pt-3 px-2 gap-1">
                          <div className="w-7 h-7 rounded-full border border-white/30 overflow-hidden">
                            <ImageWithFallback src={PHOTO_DOG} alt="Buddy" className="w-full h-full object-cover" />
                          </div>
                          <p className="text-white text-center" style={{ fontSize: 5, fontWeight: 700, lineHeight: 1.2 }}>🐾 Buddy</p>
                          {[1, 2].map((n) => (
                            <div key={n} className="w-full h-2.5 rounded" style={{ background: "rgba(255,255,255,0.2)" }} />
                          ))}
                        </div>
                      </div>
                      <p className={`text-xs text-center mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontSize: 10 }}>{sw.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right — copy */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-sm"
                style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#DC2626" }}>
                <Paintbrush size={13} />
                <span style={{ fontWeight: 600 }}>Themes are purely visual</span>
              </div>

              <h2 className={`mb-5 ${isDark ? "text-white" : "text-slate-900"}`}
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Templates define structure.
                <br />
                <span style={{ background: "linear-gradient(135deg, #DC2626, #EA580C, #FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Themes define style.
                </span>
              </h2>

              <div className="space-y-5 mb-8">
                {[
                  {
                    icon: Layers, title: "Template = What your profile is for",
                    desc: "Defines the fields, sections, and link types appropriate for your purpose — Individual, Pet, Business, etc.",
                    color: "#DC2626",
                  },
                  {
                    icon: Paintbrush, title: "Theme = How your profile looks",
                    desc: "Colors, gradients, and visual style applied on top of any template. Swap themes anytime without losing your data.",
                    color: "#EA580C",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className={`flex gap-4 p-4 rounded-2xl ${isDark ? "bg-slate-900 border border-slate-800" : "bg-slate-50 border border-slate-100"}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18` }}>
                        <Icon size={18} style={{ color: item.color }} />
                      </div>
                      <div>
                        <p className={`text-sm mb-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>{item.title}</p>
                        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ lineHeight: 1.65 }}>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link to="/templates"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 600 }}>
                Browse Templates & Themes
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className={`py-24 ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Everything You Need to Network Smarter
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className={`p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 ${isDark ? "bg-slate-950 border border-slate-800 hover:border-orange-500/30" : "bg-white border border-slate-100 hover:border-orange-200 hover:shadow-md"}`}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: isDark
                        ? "linear-gradient(135deg, rgba(220,38,38,0.25), rgba(234,88,12,0.22))"
                        : "linear-gradient(135deg, rgba(220,38,38,0.16), rgba(234,88,12,0.13))",
                      border: isDark ? "1px solid rgba(251,191,36,0.28)" : "1px solid rgba(220,38,38,0.2)",
                    }}
                  >
                    <Icon size={20} className={isDark ? "text-amber-300" : "text-orange-600"} />
                  </div>
                  <h3 className={`mb-2 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>{f.title}</h3>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ lineHeight: 1.7 }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <section className={`py-24 ${isDark ? "bg-slate-950" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-sm"
              style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.15)", color: "#EA580C" }}>
              <Award size={13} />
              <span style={{ fontWeight: 600 }}>Loved by professionals worldwide</span>
            </div>
            <h2 className={`mb-4 ${isDark ? "text-white" : "text-slate-900"}`}
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Every Type, Every Story
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl ${isDark ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-100 shadow-sm"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <Star key={si} size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" style={{ fontWeight: 600 }}>
                    {t.type}
                  </span>
                </div>
                <p className={`text-sm mb-5 ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ lineHeight: 1.7 }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-100">
                    <ImageWithFallback src={t.photo} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>{t.name}</p>
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust strip ─────────────────────────────────────────────────────── */}
      <section className={`py-12 ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {[
              { icon: Shield, label: "SOC 2 Certified" },
              { icon: Globe, label: "GDPR Compliant" },
              { icon: Users, label: "50K+ Users" },
              { icon: Award, label: "99.9% Uptime" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2">
                  <Icon size={18} className={isDark ? "text-orange-300" : "text-orange-500"} />
                  <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 500 }}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #DC2626 0%, #EA580C 50%, #FBBF24 100%)" }} />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-white mb-4" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Ready to Make Your
              <br />First Impression Count?
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto" style={{ lineHeight: 1.7 }}>
              Join 50,000+ professionals, businesses, pet owners, and creators who've already upgraded their networking with Taparoo.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/editor"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-orange-700 transition-all duration-200 hover:bg-slate-50 hover:-translate-y-0.5 shadow-lg"
                style={{ fontWeight: 700 }}>
                <Zap size={16} />
                Start for Free
              </Link>
              <Link to="/templates"
                className="flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/40 text-white transition-all duration-200 hover:bg-white/10 hover:-translate-y-0.5"
                style={{ fontWeight: 600 }}>
                Browse Templates
                <ArrowRight size={14} />
              </Link>
            </div>
            <p className="text-white/60 text-sm mt-6">No credit card required · Free forever plan available</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
