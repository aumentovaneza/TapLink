import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap, ArrowRight, Check, Shield, ChevronRight, Wifi,
  Users, PawPrint, Package,
  Building2, CalendarDays, Layers, Sparkles,
  Tag, Lock, Activity
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { TaparooIconColor } from "../components/shared/TaparooLogo";
import { type ProfileType } from "../lib/profile-types";

const PHOTO_ITEMS   = "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWNrcGFjayUyMGtleXMlMjBiZWxvbmdpbmdzJTIwdHJhdmVsfGVufDF8fHx8MTc3MTc1MzA4OHww&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_DOG     = "https://images.unsplash.com/photo-1721656363841-93e97a879979?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nJTIwZ29sZGVuJTIwcmV0cmlldmVyJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNzU1NzEwfDA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_BIZ     = "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHByb2Zlc3Npb25hbCUyMHN1aXQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE3NTMwOTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_CREATOR = "https://images.unsplash.com/photo-1617190071136-3ed95a229659?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGFydGlzdCUyMHN0dWRpbyUyMHBvcnRyYWl0JTIwY29sb3JmdWx8ZW58MXx8fHwxNzcxNzY1MDg3fDA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_EVENT   = "https://images.unsplash.com/photo-1771191057577-e216395637a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGFydGlzdCUyMHBlcmZvcm1lciUyMHN0YWdlfGVufDF8fHx8MTc3MTc1NTcxNHww&ixlib=rb-4.1.0&q=80&w=1080";

interface LandingProfileType {
  id: ProfileType;
  icon: typeof Package;
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
  features: string[];
  description: string;
  forWho: string;
}

const profileTypes: LandingProfileType[] = [
  {
    id: "items", icon: Package, label: "Items",
    color: "#DC2626",
    cardGradient: "linear-gradient(135deg, #DC2626 0%, #EA580C 50%, #FBBF24 100%)",
    textColor: "#fff", photo: PHOTO_ITEMS, photoShape: "rounded",
    name: "My Backpack", sub: "Lost & Found · NFC Protected",
    badge: "Scan if found",
    links: [{ label: "Contact Owner" }, { label: "Return Instructions" }, { label: "Reward Info" }],
    features: ["Attach to any personal belonging", "Instant owner notification on scan", "Lost & found alert mode", "Return instructions & reward info", "Works on any phone, no app needed"],
    description: "Track and protect your belongings with NFC-powered lost & found. Attach a tag to anything you own and get notified the moment someone scans it.",
    forWho: "Travellers, students, commuters, anyone with valuables",
  },
  {
    id: "pets", icon: PawPrint, label: "Pets",
    color: "#F59E0B",
    cardGradient: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
    textColor: "#fff", photo: PHOTO_DOG, photoShape: "circle",
    name: "Buddy", sub: "Golden Retriever · 3 years old",
    badge: "Scan if lost",
    links: [{ label: "Call Owner" }, { label: "My Vet" }, { label: "Medical Notes" }],
    features: ["Pet name, breed & age details", "Instant owner notification on scan", "Vet info & medical notes", "Emergency contact button", "Lost & found alert mode"],
    description: "Keep your pet safe with a scannable NFC tag. If they ever get lost, anyone who scans can reach you instantly with owner notifications.",
    forWho: "Pet owners, breeders, animal shelters",
  },
  {
    id: "business", icon: Building2, label: "Business",
    color: "#0EA5E9",
    cardGradient: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)",
    textColor: "#fff", photo: PHOTO_BIZ, photoShape: "rounded",
    name: "The Bean House", sub: "Cafe & Brunch · Open until 6PM",
    links: [{ label: "View Menu" }, { label: "Order Online" }, { label: "Get Directions" }],
    features: ["Brand logo & full-width cover banner", "Services, pricing & opening hours", "Location, menu & booking links", "Customer review & rating links", "Digital menu & daily specials"],
    description: "Turn your cafe, shop, or salon into a shareable digital hub. Customers tap to browse your menu, book services, and find directions in seconds.",
    forWho: "Cafes, shops, salons, restaurants, food trucks",
  },
  {
    id: "creator", icon: Sparkles, label: "Creator",
    color: "#EC4899",
    cardGradient: "linear-gradient(135deg, #9333EA 0%, #EC4899 55%, #F97316 100%)",
    textColor: "#fff", photo: PHOTO_CREATOR, photoShape: "circle",
    name: "Maya Lee", sub: "Illustrator · Podcaster · 45K Fans",
    links: [{ label: "Portfolio" }, { label: "Listen Now" }, { label: "Hire Me" }],
    features: ["Name, photo & creative bio", "Portfolio, streaming & platform links", "Booking / commission contact", "Merch, shop & fan support links", "Upcoming shows, events & tour dates"],
    description: "Built for every kind of creative. One profile to showcase your portfolio, links, and booking details, and show the world what you do.",
    forWho: "Musicians, painters, podcasters, DJs, photographers, illustrators",
  },
  {
    id: "event", icon: CalendarDays, label: "Event",
    color: "#8B5CF6",
    cardGradient: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 60%, #8B5CF6 100%)",
    textColor: "#fff", photo: PHOTO_EVENT, photoShape: "banner",
    name: "TechSummit 2026", sub: "Feb 28 · San Francisco",
    links: [{ label: "Get Tickets" }, { label: "Schedule" }, { label: "Venue Map" }],
    features: ["Event name, date & venue details", "Full schedule & speaker lineup", "Ticket & registration links", "Live updates & announcements", "Post-event recordings & slides"],
    description: "Share event details, schedules, and tickets with a single tap. The modern event badge for conferences, parties, meetups, and concerts.",
    forWho: "Conferences, parties, meetups, concerts",
  },
];

const stats = [
  { value: "32K+", label: "NFC Tags Shipped" },
  { value: "50K+", label: "Active Profiles" },
  { value: "2.4M", label: "Total Taps" },
  { value: "98%", label: "Satisfaction Rate" },
];

const steps = [
  {
    step: "01", icon: Tag, title: "Choose Your Tag Type",
    desc: "Select a profile type — Items, Pets, Business, Creator, or Event — then pick an NFC tag or card. Each tag is locked to its type at creation.",
  },
  {
    step: "02", icon: Layers, title: "Claim & Set Up",
    desc: "Scan or enter your claim code. Your tag's profile type is already assigned — just fill in your details, choose a theme, and go live.",
  },
  {
    step: "03", icon: Activity, title: "Tap, Track & Protect",
    desc: "Share with a tap. Track engagement with real-time analytics. For Items and Pets, lost & found alerts notify you instantly when someone scans a lost tag.",
  },
];

// ─── Phone Mockup ─────────────────────────────────────────────────────────────
function PhoneCard({ type, size = "md" }: { type: LandingProfileType; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? { w: 220, h: 460, r: "2.8rem", inner: "2.5rem", pad: 4, pt: 10, px: 4 }
    : size === "sm" ? { w: 160, h: 320, r: "2.2rem", inner: "2rem", pad: 3, pt: 8, px: 3 }
    : { w: 200, h: 410, r: "2.5rem", inner: "2.3rem", pad: 3, pt: 9, px: 4 };

  return (
    <div className="relative drop-shadow-2xl flex-shrink-0" style={{ width: dim.w, height: dim.h }}>
      <div className="absolute inset-0" style={{
        borderRadius: dim.r, background: "#111",
        boxShadow: "0 40px 80px rgba(0,0,0,0.45), inset 0 0 0 1.5px rgba(255,255,255,0.12)"
      }} />
      <div className="absolute flex flex-col overflow-hidden" style={{
        inset: dim.pad, borderRadius: dim.inner, background: type.cardGradient,
      }}>
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/60 rounded-full z-10" />
        {/* Shine overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)"
        }} />
        <div className="flex-1 overflow-hidden" style={{ paddingTop: `${dim.pt * 4}px`, paddingLeft: `${dim.px * 4}px`, paddingRight: `${dim.px * 4}px`, paddingBottom: `${dim.px * 4}px` }}>
          <div className="flex flex-col items-center h-full">
            {type.photoShape === "banner" ? (
              <div className="w-full rounded-xl overflow-hidden mb-3 flex-shrink-0" style={{ height: size === "lg" ? 88 : 72 }}>
                <ImageWithFallback src={type.photo} alt={type.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={`overflow-hidden border-2 border-white/30 mb-2.5 shadow-xl flex-shrink-0 ${type.photoShape === "circle" ? "rounded-full" : "rounded-2xl"}`}
                style={{ width: size === "lg" ? 72 : 60, height: size === "lg" ? 72 : 60 }}>
                <ImageWithFallback src={type.photo} alt={type.name} className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-center mb-0.5" style={{ color: type.textColor, fontWeight: 800, fontSize: size === "lg" ? "0.75rem" : "0.65rem", lineHeight: 1.2 }}>{type.name}</p>
            <p className="text-center opacity-65 mb-2" style={{ color: type.textColor, fontSize: size === "lg" ? "0.6rem" : "0.52rem" }}>{type.sub}</p>
            {type.badge && (
              <div className="mb-2 px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.22)" }}>
                <p style={{ color: type.textColor, fontWeight: 600, fontSize: "0.5rem" }}>{type.badge}</p>
              </div>
            )}
            <div className="w-full mt-auto space-y-1.5">
              {type.links.map((link) => (
                <div key={link.label} className="py-1.5 px-3 rounded-xl text-center"
                  style={{ background: "rgba(255,255,255,0.18)", color: type.textColor, backdropFilter: "blur(10px)", fontWeight: 500, fontSize: size === "lg" ? "0.6rem" : "0.52rem" }}>
                  {link.label}
                </div>
              ))}
            </div>
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
  const [tapCount, setTapCount] = useState(2401337);

  useEffect(() => {
    const interval = setInterval(() => setTapCount((c) => c + Math.floor(Math.random() * 3)), 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveType((i) => (i + 1) % profileTypes.length), 3800);
    return () => clearInterval(t);
  }, []);

  const bg = isDark ? "bg-slate-950 text-white" : "bg-[#FAFAFA] text-[#1C0500]";
  const card = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100";
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const heading = isDark ? "text-white" : "text-[#1C0500]";

  return (
    <div className={bg}>

      {/* ══════════════════════════════════════════════════════ HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Background texture */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={{ background: isDark ? "radial-gradient(ellipse 90% 60% at 65% 40%, rgba(220,38,38,0.12) 0%, transparent 70%)" : "radial-gradient(ellipse 90% 70% at 65% 40%, rgba(251,191,36,0.18) 0%, transparent 70%)" }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: "linear-gradient(#1C0500 1px, transparent 1px), linear-gradient(90deg, #1C0500 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* ── Left copy ── */}
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              {/* Brand badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-sm"
                style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.1), rgba(234,88,12,0.1))", border: "1px solid rgba(220,38,38,0.25)", color: "#DC2626" }}>
                <TaparooIconColor size={13} />
                <span style={{ fontWeight: 600 }}>Programmable Digital Identity</span>
              </div>

              <h1 className={`mb-5 ${heading}`}
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2.4rem, 5.5vw, 4rem)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em" }}>
                Control who<br />represents you.{" "}
                <span style={{ background: "linear-gradient(135deg, #DC2626, #EA580C, #FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  One tap<br />at a time.
                </span>
              </h1>

              <p className={`mb-6 max-w-lg ${muted}`} style={{ fontSize: "1.0625rem", lineHeight: 1.7 }}>
                Taparoo is a programmable digital identity platform, create a digital profile, embed it into an NFC tag, and share everything with a single tap.
              </p>

              {/* Feature checklist */}
              <div className={`mb-7 p-4 rounded-2xl border ${card}`}>
                <p className={`text-xs mb-3 ${muted}`} style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Protect belongings, pets &amp; build your digital identity</p>
                {["One tap shares your full profile, no app needed", "Lost & found alerts for Items and Pets", "Customisable and updatable at any time", "5 profile types: Items, Pets, Business, Creator, Event"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 mb-2 last:mb-0">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(220,38,38,0.12)" }}>
                      <Check size={9} style={{ color: "#DC2626" }} />
                    </div>
                    <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Profile type pills */}
              <div className="flex flex-wrap gap-2 mb-7">
                {profileTypes.map((type, i) => {
                  const Icon = type.icon;
                  const isActive = activeType === i;
                  return (
                    <button key={type.id} onClick={() => setActiveType(i)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${isActive ? "text-white shadow-md scale-105" : isDark ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-white text-slate-500 border border-slate-200 shadow-sm"}`}
                      style={{ background: isActive ? type.cardGradient : undefined, fontWeight: isActive ? 600 : 400 }}>
                      <Icon size={12} />{type.label}
                    </button>
                  );
                })}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Link to="/templates"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 700, boxShadow: "0 8px 28px rgba(220,38,38,0.38)" }}>
                  Browse Templates
                  <ChevronRight size={15} />
                </Link>
                <Link to="/hardware-setup"
                  className={`flex items-center gap-2 px-6 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 border ${isDark ? "bg-slate-800 text-white border-slate-700" : "bg-white text-[#1C0500] border-slate-200 shadow-sm"}`}
                  style={{ fontWeight: 600 }}>
                  Order Your NFC Tag
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                {["No credit card", "Free template", "Works on any phone"].map((trust) => (
                  <div key={trust} className="flex items-center gap-1.5 text-sm">
                    <Check size={13} className="text-emerald-500" />
                    <span className={muted}>{trust}</span>
                  </div>
                ))}
              </div>

              <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: "#DC2626", fontWeight: 500 }}>
                See Latest Profile Demo <ArrowRight size={13} />
              </Link>
            </motion.div>

            {/* ── Right phone ── */}
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.18 }}
              className="relative flex items-center justify-center">
              {/* Glow */}
              <div className="absolute w-80 h-80 rounded-full blur-[100px] opacity-30 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${profileTypes[activeType].color}, transparent)` }} />

              <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} className="relative z-10">
                <AnimatePresence mode="wait">
                  <motion.div key={activeType}
                    initial={{ opacity: 0, y: 18, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -18, scale: 0.96 }}
                    transition={{ duration: 0.32 }}>
                    <PhoneCard type={profileTypes[activeType]} size="lg" />
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* Live taps badge */}
              <motion.div
                className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs shadow-xl"
                style={{ background: isDark ? "rgba(20,20,30,0.92)" : "rgba(255,255,255,0.95)", border: "1px solid rgba(220,38,38,0.2)", backdropFilter: "blur(14px)" }}
                animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <Zap size={12} style={{ color: "#DC2626" }} />
                <span className={isDark ? "text-slate-200" : "text-slate-700"} style={{ fontWeight: 600 }}>
                  {tapCount.toLocaleString()} taps today
                </span>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ STATS */}
      <section className={`border-y ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="text-center lg:px-8">
                <div className="mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #DC2626, #EA580C, #FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {stat.value}
                </div>
                <div className={`text-sm ${muted}`}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ WHY TAPAROO EXISTS */}
      <section className={`py-24 ${isDark ? "bg-slate-950" : "bg-[#FAFAFA]"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className={`mb-3 ${heading}`}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.025em" }}>
              Why Taparoo Exists
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Problem */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className={`p-8 rounded-3xl border ${card}`}>
              <p className={`text-sm mb-5 ${muted}`} style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Without a connected identity layer, everyday things stay disconnected.</p>
              <div className="space-y-3">
                {[
                  "Lost items and pets with no way to contact the owner",
                  "Paper cards pile up and get thrown away",
                  "No instant sharing for businesses, creators, or events",
                  "No tracking of who viewed your info or scanned your tag",
                  "Disconnected profiles with no unified identity",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(239,68,68,0.12)" }}>
                      <span style={{ color: "#EF4444", fontSize: 10, fontWeight: 800, lineHeight: 1 }}>✕</span>
                    </div>
                    <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ lineHeight: 1.6 }}>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Solution */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="p-8 rounded-3xl relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #DC2626 0%, #EA580C 60%, #FBBF24 100%)" }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
              <p className="text-white/80 text-sm mb-5 relative z-10" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Taparoo solves with:</p>
              <div className="space-y-3 relative z-10">
                {[
                  "Lost & found alerts — instant owner notifications for items and pets",
                  "One tap shares your profile, menu, portfolio, or event details",
                  "5 purpose-built profile types: Items, Pets, Business, Creator, Event",
                  "Per-type pricing and optional subscription tiers",
                  "Built-in tap analytics and engagement tracking",
                  "Profiles you own and control, with type-specific themes",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={10} className="text-white" />
                    </div>
                    <span className="text-white text-sm" style={{ lineHeight: 1.6 }}>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ HOW IT WORKS */}
      <section className={`py-24 ${isDark ? "bg-slate-900" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-sm"
              style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.15)", color: "#DC2626" }}>
              <Zap size={12} />
              <span style={{ fontWeight: 600 }}>Thoughtfully designed for real life</span>
            </div>
            <h2 className={`mb-3 ${heading}`}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.025em" }}>
              How Taparoo Works
            </h2>
            <p className={`max-w-xl mx-auto ${muted}`} style={{ lineHeight: 1.7 }}>
              Discover how to build a modern NFC experience that works for you. Three steps to get started.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.step} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.13 }}
                  className={`relative p-7 rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg group ${isDark ? "bg-slate-950 border-slate-800 hover:border-orange-500/40" : "bg-white border-slate-100 hover:border-orange-200 shadow-sm"}`}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)" }}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <span className={`opacity-[0.08] ${isDark ? "text-white" : "text-[#1C0500]"}`} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "3.5rem", fontWeight: 900, lineHeight: 1 }}>{s.step}</span>
                  </div>
                  <h3 className={`mb-2 ${heading}`} style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{s.title}</h3>
                  <p className={`text-sm ${muted}`} style={{ lineHeight: 1.7 }}>{s.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 z-10">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(220,38,38,0.1)" }}>
                        <ChevronRight size={14} style={{ color: "#DC2626" }} />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ TEMPLATE SHOWCASE */}
      <section className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #DC2626 0%, #EA580C 50%, #FBBF24 100%)" }}>
        {/* Dot texture overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ background: "rgba(255,255,255,0.5)" }} />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-[80px] opacity-15 pointer-events-none" style={{ background: "#1C0500" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-sm bg-white/20 backdrop-blur-sm text-white border border-white/25">
              <Layers size={12} />
              <span style={{ fontWeight: 600 }}>5 profile types, zero limits</span>
            </div>
            <h2 className="text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.025em" }}>
              A Tag or Card Setup Built for{" "}
              <AnimatePresence mode="wait">
                <motion.span key={activeType}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }} className="inline-block underline decoration-white/40">
                  {profileTypes[activeType].label}
                </motion.span>
              </AnimatePresence>
            </h2>
          </div>

          {/* Type tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {profileTypes.map((type, i) => {
              const Icon = type.icon;
              const isActive = activeType === i;
              return (
                <motion.button key={type.id} onClick={() => setActiveType(i)}
                  whileTap={{ scale: 0.96 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-200 ${isActive ? "bg-white text-[#1C0500] shadow-lg" : "bg-white/15 text-white border border-white/20 hover:bg-white/25 backdrop-blur-sm"}`}
                  style={{ fontWeight: isActive ? 700 : 500 }}>
                  <Icon size={13} />{type.label}
                </motion.button>
              );
            })}
          </div>

          {/* Main panel */}
          <AnimatePresence mode="wait">
            <motion.div key={activeType}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 shadow-2xl"
              style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(20px)" }}>

              {/* Left — phone */}
              <div className="flex items-center justify-center p-10 sm:p-14 relative min-h-[380px]">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
                <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="relative z-10">
                  <PhoneCard type={profileTypes[activeType]} size="lg" />
                </motion.div>
                {/* NFC badge */}
                <div className="absolute bottom-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm border border-white/15">
                  <Wifi size={11} className="text-white/70" />
                  <span className="text-white/80 text-xs" style={{ fontWeight: 500 }}>NFC + QR ready</span>
                </div>
                {/* Type badge */}
                <div className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm border border-white/15">
                  {(() => { const Icon = profileTypes[activeType].icon; return <Icon size={11} className="text-white" />; })()}
                  <span className="text-white text-xs" style={{ fontWeight: 600 }}>{profileTypes[activeType].label}</span>
                </div>
              </div>

              {/* Right — details */}
              <div className="p-8 sm:p-10 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-5 self-start text-xs bg-white/20 text-white border border-white/20">
                  {(() => { const Icon = profileTypes[activeType].icon; return <Icon size={12} />; })()}
                  <span style={{ fontWeight: 600 }}>{profileTypes[activeType].label} Setup</span>
                </div>
                <h3 className="text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
                  {profileTypes[activeType].label} Profile
                </h3>
                <p className="text-white/75 text-sm mb-6" style={{ lineHeight: 1.75 }}>
                  {profileTypes[activeType].description}
                </p>
                <div className="space-y-2.5 mb-7">
                  {profileTypes[activeType].features.map((f, fi) => (
                    <motion.div key={f} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: fi * 0.06, duration: 0.25 }}
                      className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
                        <Check size={9} className="text-white" />
                      </div>
                      <span className="text-white/85 text-sm" style={{ fontWeight: 500 }}>{f}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-7 bg-black/20 border border-white/10">
                  <Users size={13} className="text-white/50 mt-0.5 flex-shrink-0" />
                  <p className="text-white/70 text-sm">
                    <span style={{ fontWeight: 600 }}>Perfect for: </span>{profileTypes[activeType].forWho}
                  </p>
                </div>
                <Link to="/hardware-setup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-sm transition-all hover:bg-slate-100 hover:-translate-y-0.5 shadow-lg self-start"
                  style={{ color: "#DC2626", fontWeight: 700 }}>
                  <Zap size={14} />
                  Order Your NFC Tag
                  <ArrowRight size={13} />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ CONTROLLED IDENTITY */}
      <section className={`py-24 ${isDark ? "bg-slate-950" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-sm"
              style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.15)", color: "#DC2626" }}>
              <Lock size={12} />
              <span style={{ fontWeight: 600 }}>Your identity, your rules — across every profile type</span>
            </div>
            <h2 className={`mb-3 ${heading}`}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.025em" }}>
              Controlled Identity,{" "}
              <span style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Not Just Sharing
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Left — checklist */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="space-y-4">
                {[
                  { title: "Profile updates reflect instantly", desc: "Change your info and every scan shows the latest version — whether it's a pet ID, business menu, creator portfolio, or event schedule." },
                  { title: "Type-locked tags, purpose-built profiles", desc: "Each tag is assigned a profile type at creation. Items and Pets get lost & found. Business gets menus. Creators get portfolios. Events get schedules." },
                  { title: "Built-in privacy controls", desc: "Choose what to show publicly across any profile type. Keep personal data private. Toggle sections on or off anytime." },
                  { title: "Own your data, pick your tier", desc: "Free tier for Items and Pets. Optional Basic and Premium subscriptions for Business, Creator, and Event profiles with advanced features." },
                ].map((item, i) => (
                  <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className={`flex gap-4 p-5 rounded-2xl border ${card}`}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(220,38,38,0.1)" }}>
                      <Check size={15} style={{ color: "#DC2626" }} />
                    </div>
                    <div>
                      <p className={`text-sm mb-1 ${heading}`} style={{ fontWeight: 700 }}>{item.title}</p>
                      <p className={`text-sm ${muted}`} style={{ lineHeight: 1.65 }}>{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right — callout */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="rounded-3xl overflow-hidden h-full"
                style={{ background: "linear-gradient(135deg, #DC2626 0%, #EA580C 60%, #FBBF24 100%)" }}>
                <div className="p-8 sm:p-10 relative">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-white/20 text-white border border-white/20 mb-6">
                      <Shield size={11} />
                      <span style={{ fontWeight: 600 }}>Built on trust</span>
                    </div>
                    <blockquote className="text-white mb-6" style={{ fontSize: "1.2rem", fontWeight: 700, lineHeight: 1.55, letterSpacing: "-0.01em" }}>
                      "One platform for every NFC identity — protect what matters, share what counts, control everything."
                    </blockquote>
                    <p className="text-white/75 text-sm mb-8" style={{ lineHeight: 1.7 }}>
                      Whether you're tracking a lost pet, running a café, sharing your creative portfolio, or managing event badges — your profile type, your data, your rules. Always.
                    </p>
                    <Link to="/hardware-setup"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-sm hover:bg-slate-50 transition-all hover:-translate-y-0.5 shadow-lg"
                      style={{ color: "#DC2626", fontWeight: 700 }}>
                      Order Now NFC Tag
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ BUILT FOR REAL-WORLD USE */}
      <section className={`py-24 ${isDark ? "bg-slate-900" : "bg-[#FAFAFA]"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className={`mb-3 ${heading}`}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.025em" }}>
              Built for Real-World Use
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Lost & Found (Items + Pets) */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
              className={`p-7 rounded-2xl border ${card}`}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(220,38,38,0.1)" }}>
                  <Package size={21} style={{ color: "#DC2626" }} />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)" }}>
                  <PawPrint size={21} style={{ color: "#F59E0B" }} />
                </div>
              </div>
              <h3 className={`mb-3 ${heading}`} style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>Lost & Found for Items + Pets</h3>
              <div className="space-y-2.5">
                {["Instant owner notification on scan", "Lost & found alert mode", "Return instructions & reward info", "Vet info & medical notes for pets", "Works on any phone, no app needed"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <Check size={13} style={{ color: "#DC2626", flexShrink: 0 }} />
                    <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* For Businesses */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className={`p-7 rounded-2xl border ${card}`}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(14,165,233,0.1)" }}>
                <Building2 size={21} style={{ color: "#0EA5E9" }} />
              </div>
              <h3 className={`mb-3 ${heading}`} style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>For Businesses</h3>
              <div className="space-y-2.5">
                {["Brand profile with full cover", "Location, menu & booking links", "Services, pricing & opening hours", "Customer review & rating links", "Custom branded NFC cards"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <Check size={13} style={{ color: "#0EA5E9", flexShrink: 0 }} />
                    <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* For Creators & Events */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className={`p-7 rounded-2xl border ${card}`}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(236,72,153,0.1)" }}>
                  <Sparkles size={21} style={{ color: "#EC4899" }} />
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)" }}>
                  <CalendarDays size={21} style={{ color: "#8B5CF6" }} />
                </div>
              </div>
              <h3 className={`mb-3 ${heading}`} style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>For Creators & Events</h3>
              <div className="space-y-2.5">
                {["Portfolio, links & booking details", "Event badge & schedule sharing", "Ticket & registration links", "Audience engagement tracking", "Upcoming shows & tour dates"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <Check size={13} style={{ color: "#8B5CF6", flexShrink: 0 }} />
                    <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ FINAL CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #DC2626 0%, #EA580C 50%, #FBBF24 100%)" }} />
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-20" style={{ background: "rgba(255,255,255,0.6)" }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-white mb-5"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              Own your Identity.<br />
              Control your access.<br />
              Track your Impact.
            </h2>
            <p className="text-white/80 mb-10 max-w-xl mx-auto" style={{ fontSize: "1.0625rem", lineHeight: 1.7 }}>
              Start with one of our pre-built NFC-ready profiles to quickly build a seamless identity experience. Join 50,000+ professionals already using Taparoo.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/hardware-setup"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white transition-all duration-200 hover:bg-slate-50 hover:-translate-y-0.5 shadow-xl"
                style={{ color: "#DC2626", fontWeight: 700 }}>
                <Tag size={16} />
                Choose a Tag
                <ArrowRight size={14} />
              </Link>
              <Link to="/login?mode=signup"
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white/15 text-white border border-white/25 transition-all duration-200 hover:bg-white/25 hover:-translate-y-0.5 backdrop-blur-sm"
                style={{ fontWeight: 600 }}>
                <Zap size={16} />
                Apply Instantly
                <ArrowRight size={14} />
              </Link>
              <Link to="/faq"
                className="flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white transition-all duration-200 hover:bg-white/10 hover:-translate-y-0.5"
                style={{ fontWeight: 600 }}>
                Get Help
              </Link>
            </div>
            <p className="text-white/55 text-sm mt-8">No credit card required · Free forever plan available</p>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
