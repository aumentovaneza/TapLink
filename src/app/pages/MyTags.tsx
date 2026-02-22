import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Search, Filter, MoreHorizontal, Edit, BarChart3,
  Share2, Trash2, Tag, User, Building2, PawPrint, Coffee,
  Calendar, Music, Zap, Wifi, Check, QrCode, Globe,
  Eye, EyeOff, ArrowUpRight, Clock, ChevronDown, X,
  ShoppingBag, LayoutGrid, List, RefreshCw
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { EmptyState } from "../components/shared/EmptyState";
import { TagCardSkeleton, StatCardSkeleton } from "../components/shared/LoadingSkeleton";

const PHOTO_1 = "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_2 = "https://images.unsplash.com/photo-1762522921456-cdfe882d36c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGhlYWRzaG90JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE2NjIzMDJ8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_DOG = "https://images.unsplash.com/photo-1721656363841-93e97a879979?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nJTIwZ29sZGVuJTIwcmV0cmlldmVyJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNzU1NzEwfDA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_CAFE = "https://images.unsplash.com/photo-1593536488177-1eb3c2d4e3d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwY2FmZSUyMGNvZmZlZSUyMHNob3AlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzE3NTU3MTF8MA&ixlib=rb-4.1.0&q=80&w=1080";

const templateMeta: Record<string, { icon: typeof User; color: string; label: string }> = {
  individual: { icon: User,      color: "#4F46E5", label: "Individual" },
  business:   { icon: Building2, color: "#0EA5E9", label: "Business" },
  pet:        { icon: PawPrint,  color: "#F59E0B", label: "Pet" },
  cafe:       { icon: Coffee,    color: "#92400E", label: "Café & Restaurant" },
  event:      { icon: Calendar,  color: "#8B5CF6", label: "Event" },
  musician:   { icon: Music,     color: "#10B981", label: "Musician" },
  retail:     { icon: ShoppingBag, color: "#EF4444", label: "Retail" },
};

const themeGradients: Record<string, string> = {
  wave:     "linear-gradient(135deg, #4F46E5, #7C3AED, #06B6D4)",
  sunset:   "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)",
  ocean:    "linear-gradient(135deg, #0ea5e9, #2563eb)",
  forest:   "linear-gradient(135deg, #065f46, #059669)",
  "dark-pro": "linear-gradient(135deg, #0f0c29, #302b63)",
  rose:     "linear-gradient(135deg, #fda4af, #e11d48)",
  minimal:  "linear-gradient(135deg, #f8fafc, #e2e8f0)",
};

type TagStatus = "active" | "inactive" | "unclaimed";

interface UserTag {
  id: string;
  name: string;
  tagCode: string;
  templateType: string;
  theme: string;
  status: TagStatus;
  taps: number;
  tapChange: number; // % change vs last week
  lastTap: string;
  photo: string;
  profileUrl: string;
  createdAt: string;
}

const mockTags: UserTag[] = [
  {
    id: "1", name: "Alex Rivera", tagCode: "TL-001", templateType: "individual", theme: "wave",
    status: "active", taps: 1847, tapChange: 12, lastTap: "2 min ago",
    photo: PHOTO_1, profileUrl: "/profile", createdAt: "Jan 15, 2026",
  },
  {
    id: "2", name: "Sarah Chen — Work", tagCode: "TL-002", templateType: "individual", theme: "sunset",
    status: "active", taps: 3210, tapChange: 8, lastTap: "5 min ago",
    photo: PHOTO_2, profileUrl: "/profile", createdAt: "Jan 20, 2026",
  },
  {
    id: "3", name: "Buddy 🐾", tagCode: "TL-003", templateType: "pet", theme: "forest",
    status: "active", taps: 23, tapChange: 50, lastTap: "2 days ago",
    photo: PHOTO_DOG, profileUrl: "/profile", createdAt: "Feb 1, 2026",
  },
  {
    id: "4", name: "The Bean House", tagCode: "TL-004", templateType: "cafe", theme: "dark-pro",
    status: "inactive", taps: 847, tapChange: -5, lastTap: "1 week ago",
    photo: PHOTO_CAFE, profileUrl: "/profile", createdAt: "Dec 10, 2025",
  },
  {
    id: "5", name: "Conference Badge", tagCode: "TL-005", templateType: "event", theme: "rose",
    status: "unclaimed", taps: 0, tapChange: 0, lastTap: "Never",
    photo: PHOTO_1, profileUrl: "/profile", createdAt: "Feb 15, 2026",
  },
];

const statusConfig: Record<TagStatus, { label: string; dot: string; bg: string; text: string }> = {
  active:    { label: "Active",    dot: "#10B981", bg: "rgba(16,185,129,0.1)",  text: "#10B981" },
  inactive:  { label: "Inactive",  dot: "#6B7280", bg: "rgba(107,114,128,0.1)", text: "#6B7280" },
  unclaimed: { label: "Unclaimed", dot: "#F59E0B", bg: "rgba(245,158,11,0.1)",  text: "#F59E0B" },
};

type ViewMode = "grid" | "list";
type FilterStatus = "all" | TagStatus;

// ─── Tag Card ─────────────────────────────────────────────────────────────────
function TagCard({ tag, view, isDark, onDelete }: { tag: UserTag; view: ViewMode; isDark: boolean; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const meta = templateMeta[tag.templateType] || templateMeta.individual;
  const Icon = meta.icon;
  const st = statusConfig[tag.status];
  const gradient = themeGradients[tag.theme] || themeGradients.wave;

  const handleToggle = async () => {
    setToggling(true);
    await new Promise((r) => setTimeout(r, 600));
    setToggling(false);
  };

  if (view === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-4 px-5 py-4 border-b last:border-0 ${isDark ? "border-slate-800 hover:bg-slate-900/50" : "border-slate-100 hover:bg-slate-50"} transition-colors`}
      >
        {/* Photo/gradient mini thumbnail */}
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 relative">
          <div className="absolute inset-0" style={{ background: gradient }} />
          <div className="absolute inset-0.5 rounded-lg overflow-hidden">
            <ImageWithFallback src={tag.photo} alt={tag.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>{tag.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1`} style={{ background: st.bg, color: st.text }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
              {st.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className={`text-xs flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <Icon size={10} style={{ color: meta.color }} />
              {meta.label}
            </span>
            <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>{tag.tagCode}</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5">
          <Zap size={12} className="text-indigo-400" />
          <span className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>{tag.taps.toLocaleString()}</span>
          {tag.tapChange !== 0 && (
            <span className={`text-xs ${tag.tapChange > 0 ? "text-emerald-500" : "text-rose-400"}`} style={{ fontWeight: 500 }}>
              {tag.tapChange > 0 ? "↑" : "↓"}{Math.abs(tag.tapChange)}%
            </span>
          )}
        </div>

        <div className="hidden md:flex items-center gap-1 text-xs" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
          <Clock size={11} />
          {tag.lastTap}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Link to={`/analytics/${tag.id}`}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}>
            <BarChart3 size={14} />
          </Link>
          <Link to="/editor"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}>
            <Edit size={14} />
          </Link>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}>
              <MoreHorizontal size={14} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`absolute right-0 top-10 z-30 w-44 rounded-xl shadow-xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
                  {[
                    { icon: Globe, label: "View Profile", action: () => {} },
                    { icon: QrCode, label: "Show QR Code", action: () => {} },
                    { icon: Share2, label: "Share Link", action: () => {} },
                    { icon: tag.status === "active" ? EyeOff : Eye, label: tag.status === "active" ? "Deactivate" : "Activate", action: handleToggle },
                  ].map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <button key={item.label} onClick={() => { item.action(); setMenuOpen(false); }}
                        className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"}`}
                        style={{ fontWeight: 400 }}>
                        <ItemIcon size={14} className="opacity-60" />{item.label}
                      </button>
                    );
                  })}
                  <div className={`border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />
                  <button onClick={() => { onDelete(tag.id); setMenuOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">
                    <Trash2 size={14} />Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg group ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
    >
      {/* Gradient banner */}
      <div className="relative h-20 overflow-hidden">
        <div className="absolute inset-0" style={{ background: gradient }} />
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.15)" }} />
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-black/30 text-white backdrop-blur-sm" style={{ fontWeight: 600 }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
            {st.label}
          </span>
        </div>
        {/* Menu */}
        <div className="absolute top-2 right-2">
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-lg bg-black/25 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-colors">
              <MoreHorizontal size={13} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`absolute right-0 top-9 z-30 w-44 rounded-xl shadow-xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
                  {[
                    { icon: Globe, label: "View Profile" },
                    { icon: QrCode, label: "Show QR Code" },
                    { icon: Share2, label: "Share Link" },
                  ].map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <button key={item.label} onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"}`}
                        style={{ fontWeight: 400 }}>
                        <ItemIcon size={14} className="opacity-60" />{item.label}
                      </button>
                    );
                  })}
                  <div className={`border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />
                  <button onClick={() => { onDelete(tag.id); setMenuOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">
                    <Trash2 size={14} />Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* Photo */}
        <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
          <ImageWithFallback src={tag.photo} alt={tag.name} className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="pt-8 px-4 pb-4">
        <div className="flex items-start justify-between mb-1">
          <div className="min-w-0">
            <p className={`truncate text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>{tag.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Icon size={10} style={{ color: meta.color }} />
              <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{meta.label}</span>
              <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-300"}`}>·</span>
              <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>{tag.tagCode}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={`flex items-center gap-3 py-3 mt-3 rounded-xl px-3 ${isDark ? "bg-slate-800/60" : "bg-slate-50"}`}>
          <div className="flex-1 text-center">
            <p className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>{tag.taps.toLocaleString()}</p>
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Taps</p>
          </div>
          <div className={`w-px h-8 ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
          <div className="flex-1 text-center">
            {tag.tapChange !== 0 ? (
              <>
                <p className={`text-sm ${tag.tapChange > 0 ? "text-emerald-500" : "text-rose-400"}`} style={{ fontWeight: 700 }}>
                  {tag.tapChange > 0 ? "↑" : "↓"}{Math.abs(tag.tapChange)}%
                </p>
                <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>This week</p>
              </>
            ) : (
              <>
                <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`} style={{ fontWeight: 600 }}>—</p>
                <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>No data</p>
              </>
            )}
          </div>
          <div className={`w-px h-8 ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
          <div className="flex-1 text-center">
            <p className={`text-xs truncate ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontWeight: 500 }}>{tag.lastTap}</p>
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Last tap</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Link to="/editor"
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-colors ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            style={{ fontWeight: 500 }}>
            <Edit size={12} />Edit
          </Link>
          <Link to={`/analytics/${tag.id}`}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-colors ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            style={{ fontWeight: 500 }}>
            <BarChart3 size={12} />Stats
          </Link>
          <button
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-colors ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            style={{ fontWeight: 500 }}>
            <Share2 size={12} />Share
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function MyTags() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [tags, setTags] = useState(mockTags);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [loading] = useState(false);

  const deleteTag = (id: string) => setTags((prev) => prev.filter((t) => t.id !== id));

  const filtered = tags.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.tagCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalTaps = tags.reduce((sum, t) => sum + t.taps, 0);
  const activeTags = tags.filter((t) => t.status === "active").length;

  const statCards = [
    { label: "Total Tags", value: tags.length, icon: Tag, color: "#4F46E5", sub: `${activeTags} active` },
    { label: "Total Taps", value: totalTaps.toLocaleString(), icon: Zap, color: "#7C3AED", sub: "All time" },
    { label: "Active Tags", value: activeTags, icon: Wifi, color: "#10B981", sub: "Currently live" },
    { label: "Avg Taps/Tag", value: tags.length ? Math.round(totalTaps / tags.length) : 0, icon: BarChart3, color: "#F59E0B", sub: "Per tag" },
  ];

  return (
    <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Page header */}
      <div className={`border-b ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                  <Tag size={14} className="text-white" />
                </div>
                <h1 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>My Tags</h1>
              </div>
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Manage your NFC tags, profiles, and analytics.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/scan"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors ${isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                style={{ fontWeight: 500 }}>
                <Wifi size={14} />Scan Tag
              </Link>
              <Link to="/claim"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-all"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 600 }}>
                <Plus size={14} />Claim New Tag
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading
            ? [1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)
            : statCards.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 500 }}>{stat.label}</p>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                        <Icon size={15} style={{ color: stat.color }} />
                      </div>
                    </div>
                    <p className={`mb-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
                      {stat.value}
                    </p>
                    <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{stat.sub}</p>
                  </motion.div>
                );
              })}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className={`relative flex-1 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
            <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
            <input
              type="text"
              placeholder="Search tags by name or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full h-11 pl-10 pr-4 bg-transparent outline-none text-sm ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"}`}
            />
            {search && (
              <button onClick={() => setSearch("")} className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Status filter */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: isDark ? "#0F172A" : "#F1F5F9" }}>
              {(["all", "active", "inactive", "unclaimed"] as FilterStatus[]).map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
                    filterStatus === s ? "text-white shadow-sm" : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                  }`}
                  style={{ background: filterStatus === s ? "linear-gradient(135deg, #4F46E5, #7C3AED)" : "transparent", fontWeight: filterStatus === s ? 600 : 400 }}>
                  {s === "all" ? `All (${tags.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${tags.filter((t) => t.status === s).length})`}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: isDark ? "#0F172A" : "#F1F5F9" }}>
              {([["grid", LayoutGrid], ["list", List]] as const).map(([v, Icon]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    view === v ? "text-white shadow-sm" : isDark ? "text-slate-400 hover:text-white" : "text-slate-500"
                  }`}
                  style={{ background: view === v ? "linear-gradient(135deg, #4F46E5, #7C3AED)" : "transparent" }}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tag list/grid */}
        {loading ? (
          <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {[1, 2, 3].map((i) => <TagCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          search || filterStatus !== "all" ? (
            <div className={`rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
              <EmptyState
                icon={<Search size={28} />}
                title="No tags found"
                description={`No tags match "${search || filterStatus}". Try adjusting your search or filter.`}
                actions={[{ label: "Clear filters", onClick: () => { setSearch(""); setFilterStatus("all"); }, variant: "secondary" }]}
              />
            </div>
          ) : (
            <div className={`rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
              <EmptyState
                icon={<Tag size={28} />}
                title="No tags yet"
                description="Claim your first NFC tag to get started. You'll be able to share your profile with a single tap."
                actions={[
                  { label: "Claim a Tag", href: "/claim", variant: "primary" },
                  { label: "Scan a Tag", href: "/scan", variant: "secondary" },
                ]}
                size="lg"
              />
            </div>
          )
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((tag) => (
                <TagCard key={tag.id} tag={tag} view="grid" isDark={isDark} onDelete={deleteTag} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
            <AnimatePresence>
              {filtered.map((tag) => (
                <TagCard key={tag.id} tag={tag} view="list" isDark={isDark} onDelete={deleteTag} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
