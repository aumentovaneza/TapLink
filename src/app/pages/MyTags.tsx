import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import {
  BarChart3,
  Building2,
  Calendar,
  Copy,
  Clock,
  Coffee,
  Edit,
  Eye,
  EyeOff,
  Globe,
  LayoutGrid,
  List,
  MoreHorizontal,
  Music,
  PawPrint,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Share2,
  ShoppingBag,
  Smartphone,
  Tag,
  Trash2,
  User,
  Wifi,
  X,
  Zap,
} from "lucide-react";

import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { EmptyState } from "../components/shared/EmptyState";
import { StatCardSkeleton, TagCardSkeleton } from "../components/shared/LoadingSkeleton";
import { ApiError, apiRequest } from "../lib/api";
import { clearAccessToken, getAccessToken } from "../lib/session";

const PHOTO_1 =
  "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_2 =
  "https://images.unsplash.com/photo-1762522921456-cdfe882d36c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGhlYWRzaG90JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE2NjIzMDJ8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_DOG =
  "https://images.unsplash.com/photo-1721656363841-93e97a879979?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nJTIwZ29sZGVuJTIwcmV0cmlldmVyJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNzU1NzEwfDA&ixlib=rb-4.1.0&q=80&w=1080";
const PHOTO_CAFE =
  "https://images.unsplash.com/photo-1593536488177-1eb3c2d4e3d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwY2FmZSUyMGNvZmZlZSUyMHNob3AlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzE3NTU3MTF8MA&ixlib=rb-4.1.0&q=80&w=1080";

const templateMeta: Record<string, { icon: typeof User; color: string; label: string }> = {
  individual: { icon: User, color: "#DC2626", label: "Individual" },
  business: { icon: Building2, color: "#0EA5E9", label: "Business" },
  pet: { icon: PawPrint, color: "#F59E0B", label: "Pet" },
  cafe: { icon: Coffee, color: "#92400E", label: "Cafe & Restaurant" },
  event: { icon: Calendar, color: "#8B5CF6", label: "Event" },
  musician: { icon: Music, color: "#10B981", label: "Musician" },
  retail: { icon: ShoppingBag, color: "#EF4444", label: "Retail" },
};

const themeGradients: Record<string, string> = {
  wave: "linear-gradient(135deg, #DC2626, #EA580C, #FBBF24)",
  sunset: "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)",
  ocean: "linear-gradient(135deg, #0ea5e9, #2563eb)",
  forest: "linear-gradient(135deg, #065f46, #059669)",
  "dark-pro": "linear-gradient(135deg, #0f0c29, #302b63)",
  rose: "linear-gradient(135deg, #fda4af, #e11d48)",
  minimal: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
};

type TagStatus = "active" | "inactive" | "unclaimed";
type ViewMode = "grid" | "list";
type FilterStatus = "all" | TagStatus;

interface ApiTagProfile {
  id: string;
  slug: string;
  name: string;
  title: string;
  templateType: string;
  theme: string;
  photo: string | null;
}

interface ApiTag {
  id: string;
  tagCode: string;
  claimCode: string | null;
  status: TagStatus;
  taps: number;
  lastTap: string;
  createdAt: string;
  profile: ApiTagProfile | null;
}

interface UserTag {
  id: string;
  name: string;
  tagCode: string;
  templateType: string;
  theme: string;
  status: TagStatus;
  taps: number;
  tapChange: number;
  lastTap: string;
  photo: string;
  editorUrl: string;
  profileUrl: string;
  createdAt: string;
}

const statusConfig: Record<TagStatus, { label: string; dot: string; bg: string; text: string }> = {
  active: { label: "Active", dot: "#10B981", bg: "rgba(16,185,129,0.1)", text: "#10B981" },
  inactive: { label: "Inactive", dot: "#6B7280", bg: "rgba(107,114,128,0.1)", text: "#6B7280" },
  unclaimed: { label: "Unclaimed", dot: "#F59E0B", bg: "rgba(245,158,11,0.1)", text: "#F59E0B" },
};

function fallbackPhoto(templateType: string): string {
  if (templateType === "pet") {
    return PHOTO_DOG;
  }
  if (templateType === "cafe") {
    return PHOTO_CAFE;
  }
  if (templateType === "business") {
    return PHOTO_2;
  }
  return PHOTO_1;
}

function mapTagFromApi(tag: ApiTag): UserTag {
  return {
    id: tag.id,
    name: tag.profile?.name || `Tag ${tag.tagCode}`,
    tagCode: tag.tagCode,
    templateType: tag.profile?.templateType || "individual",
    theme: tag.profile?.theme || "wave",
    status: tag.status,
    taps: tag.taps,
    tapChange: 0,
    lastTap: tag.lastTap || "Never",
    photo: tag.profile?.photo || fallbackPhoto(tag.profile?.templateType || "individual"),
    editorUrl: tag.profile ? `/editor?profile=${encodeURIComponent(tag.profile.id)}` : "/editor",
    profileUrl: tag.profile ? `/profile/${tag.profile.slug || tag.profile.id}` : tag.claimCode ? `/claim/${tag.claimCode}` : "/claim",
    createdAt: new Date(tag.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  };
}

function toTagStatus(current: TagStatus): TagStatus {
  return current === "active" ? "inactive" : "active";
}

function TagCard({
  tag,
  view,
  isDark,
  onDelete,
  onToggleStatus,
}: {
  tag: UserTag;
  view: ViewMode;
  isDark: boolean;
  onDelete: (id: string) => Promise<void>;
  onToggleStatus: (tag: UserTag) => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);

  const meta = templateMeta[tag.templateType] || templateMeta.individual;
  const Icon = meta.icon;
  const status = statusConfig[tag.status];
  const gradient = themeGradients[tag.theme] || themeGradients.wave;
  const shareUrl =
    typeof window !== "undefined" ? new URL(tag.profileUrl, window.location.origin).toString() : tag.profileUrl;

  const handleCopyLink = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    setMenuOpen(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(tag.id);
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggleStatus(tag);
    } finally {
      setToggling(false);
      setMenuOpen(false);
    }
  };

  const toggleLabel = tag.status === "active" ? "Deactivate" : "Activate";
  const ToggleIcon = tag.status === "active" ? EyeOff : Eye;

  if (view === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-4 px-5 py-4 border-b last:border-0 ${isDark ? "border-slate-800 hover:bg-slate-900/50" : "border-slate-100 hover:bg-slate-50"} transition-colors`}
      >
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl">
          <div className="absolute inset-0" style={{ background: gradient }} />
          <div className="absolute inset-0.5 overflow-hidden rounded-lg">
            <ImageWithFallback src={tag.photo} alt={tag.name} className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`truncate text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>
              {tag.name}
            </span>
            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs" style={{ background: status.bg, color: status.text }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.dot }} />
              {status.label}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-3">
            <span className={`flex items-center gap-1 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <Icon size={10} style={{ color: meta.color }} />
              {meta.label}
            </span>
            <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>{tag.tagCode}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Globe size={11} className={isDark ? "text-slate-500" : "text-slate-400"} />
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className={`min-w-0 truncate text-xs underline decoration-dotted underline-offset-2 ${
                isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {shareUrl}
            </a>
          </div>
        </div>

        <div className="hidden items-center gap-1.5 sm:flex">
          <Zap size={12} className="text-indigo-400" />
          <span className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>
            {tag.taps.toLocaleString()}
          </span>
        </div>

        <div className="hidden items-center gap-1 text-xs md:flex" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
          <Clock size={11} />
          {tag.lastTap}
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          <Link
            to={`/analytics/${tag.id}`}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isDark ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
          >
            <BarChart3 size={14} />
          </Link>

          <Link
            to={tag.editorUrl}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isDark ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
          >
            <Edit size={14} />
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((current) => !current)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isDark ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
            >
              <MoreHorizontal size={14} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-xl border shadow-xl ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
                >
                  <Link
                    to={tag.profileUrl}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <Globe size={14} className="opacity-60" />
                    View Profile
                  </Link>

                  <button
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <QrCode size={14} className="opacity-60" />
                    Show QR Code
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <Copy size={14} className="opacity-60" />
                    {copied ? "Copied Link" : "Copy Link"}
                  </button>

                  {tag.status !== "unclaimed" && (
                    <button
                      onClick={handleToggle}
                      disabled={toggling}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors disabled:opacity-60 ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"}`}
                    >
                      <ToggleIcon size={14} className="opacity-60" />
                      {toggling ? "Updating..." : toggleLabel}
                    </button>
                  )}

                  <div className={`border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-950/20"
                  >
                    <Trash2 size={14} />
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-lg ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white shadow-sm"}`}
    >
      <div className="relative h-20 overflow-hidden">
        <div className="absolute inset-0" style={{ background: gradient }} />
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.15)" }} />

        <div className="absolute left-3 top-3">
          <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-xs text-white backdrop-blur-sm" style={{ fontWeight: 600 }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.dot }} />
            {status.label}
          </span>
        </div>

        <div className="absolute right-2 top-2">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((current) => !current)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
            >
              <MoreHorizontal size={13} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border shadow-xl ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
                >
                  <Link
                    to={tag.profileUrl}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <Globe size={14} className="opacity-60" />
                    View Profile
                  </Link>

                  {tag.status !== "unclaimed" && (
                    <button
                      onClick={handleToggle}
                      disabled={toggling}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors disabled:opacity-60 ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"}`}
                    >
                      <ToggleIcon size={14} className="opacity-60" />
                      {toggling ? "Updating..." : toggleLabel}
                    </button>
                  )}

                  <div className={`border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-500 transition-colors hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-950/20"
                  >
                    <Trash2 size={14} />
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute -bottom-5 left-4 h-12 w-12 overflow-hidden rounded-xl border-2 border-white/30 shadow-lg">
          <ImageWithFallback src={tag.photo} alt={tag.name} className="h-full w-full object-cover" />
        </div>
      </div>

      <div className="px-4 pb-4 pt-8">
        <div className="mb-1 flex items-start justify-between">
          <div className="min-w-0">
            <p className={`truncate text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>{tag.name}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Icon size={10} style={{ color: meta.color }} />
              <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{meta.label}</span>
              <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-300"}`}>·</span>
              <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>{tag.tagCode}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Globe size={11} className={isDark ? "text-slate-500" : "text-slate-400"} />
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className={`truncate text-xs underline decoration-dotted underline-offset-2 ${
                  isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {shareUrl}
              </a>
            </div>
          </div>
        </div>

        <div className={`mt-3 flex items-center gap-3 rounded-xl px-3 py-3 ${isDark ? "bg-slate-800/60" : "bg-slate-50"}`}>
          <div className="flex-1 text-center">
            <p className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>{tag.taps.toLocaleString()}</p>
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Taps</p>
          </div>
          <div className={`h-8 w-px ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
          <div className="flex-1 text-center">
            <p className={`truncate text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontWeight: 500 }}>{tag.lastTap}</p>
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Last tap</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Link
            to={tag.editorUrl}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs transition-colors ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            style={{ fontWeight: 500 }}
          >
            <Edit size={12} />
            Edit
          </Link>

          <Link
            to={`/analytics/${tag.id}`}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs transition-colors ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            style={{ fontWeight: 500 }}
          >
            <BarChart3 size={12} />
            Stats
          </Link>

          <Link
            to={tag.profileUrl}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs transition-colors ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            style={{ fontWeight: 500 }}
          >
            <Share2 size={12} />
            Share
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function MyTags() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [tags, setTags] = useState<UserTag[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTags = async () => {
    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<{ items: ApiTag[] }>("/tags/mine", { auth: true });
      setTags(response.items.map((item) => mapTagFromApi(item)));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAccessToken();
        navigate("/login");
        return;
      }
      setError(error instanceof Error ? error.message : "Unable to load your tags.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTags();
  }, []);

  const deleteTag = async (id: string) => {
    try {
      await apiRequest<void>(`/tags/${id}`, {
        method: "DELETE",
        auth: true,
      });
      setTags((previous) => previous.filter((item) => item.id !== id));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAccessToken();
        navigate("/login");
        return;
      }
      setError(error instanceof Error ? error.message : "Unable to delete this tag.");
    }
  };

  const toggleTagStatus = async (tag: UserTag) => {
    const nextStatus = toTagStatus(tag.status);

    try {
      const response = await apiRequest<{ tag: ApiTag }>(`/tags/${tag.id}/status`, {
        method: "PATCH",
        auth: true,
        body: { status: nextStatus },
      });

      const updated = mapTagFromApi(response.tag);
      setTags((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAccessToken();
        navigate("/login");
        return;
      }
      setError(error instanceof Error ? error.message : "Unable to update tag status.");
    }
  };

  const filtered = tags.filter((tag) => {
    const term = search.toLowerCase();
    const matchSearch = tag.name.toLowerCase().includes(term) || tag.tagCode.toLowerCase().includes(term);
    const matchStatus = filterStatus === "all" || tag.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalTaps = tags.reduce((sum, tag) => sum + tag.taps, 0);
  const activeTags = tags.filter((tag) => tag.status === "active").length;

  const statCards = [
    { label: "Total Tags", value: tags.length, icon: Tag, color: "#DC2626", sub: `${activeTags} active` },
    { label: "Total Taps", value: totalTaps.toLocaleString(), icon: Zap, color: "#EA580C", sub: "All time" },
    { label: "Active Tags", value: activeTags, icon: Wifi, color: "#10B981", sub: "Currently live" },
    { label: "Avg Taps/Tag", value: tags.length ? Math.round(totalTaps / tags.length) : 0, icon: BarChart3, color: "#F59E0B", sub: "Per tag" },
  ];

  return (
    <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className={`border-b ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)" }}>
                  <Tag size={14} className="text-white" />
                </div>
                <h1 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>My Tags</h1>
              </div>
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Manage your NFC tags, profiles, and analytics.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  void loadTags();
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm border transition-colors ${isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                style={{ fontWeight: 500 }}
              >
                <RefreshCw size={14} />
                Refresh
              </button>

              <Link
                to="/scan"
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm border transition-colors ${isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                style={{ fontWeight: 500 }}
              >
                <Wifi size={14} />
                Scan Tag
              </Link>

              <Link
                to="/claim"
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 600 }}
              >
                <Plus size={14} />
                Claim New Tag
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-rose-300/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
            {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading
            ? [1, 2, 3, 4].map((index) => <StatCardSkeleton key={index} />)
            : statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.07 }}
                    className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 500 }}>{stat.label}</p>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${stat.color}15` }}>
                        <Icon size={15} style={{ color: stat.color }} />
                      </div>
                    </div>
                    <p className={`mb-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                      {stat.value}
                    </p>
                    <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{stat.sub}</p>
                  </motion.div>
                );
              })}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className={`relative flex-1 rounded-xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
            <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
            <input
              type="text"
              placeholder="Search tags by name or code..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`h-11 w-full bg-transparent pl-10 pr-4 text-sm outline-none ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"}`}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex gap-1 rounded-xl p-1" style={{ background: isDark ? "#0F172A" : "#F1F5F9" }}>
              {(["all", "active", "inactive", "unclaimed"] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-lg px-3 py-1.5 text-xs capitalize transition-all ${
                    filterStatus === status ? "text-white shadow-sm" : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                  }`}
                  style={{
                    background: filterStatus === status ? "linear-gradient(135deg, #DC2626, #EA580C)" : "transparent",
                    fontWeight: filterStatus === status ? 600 : 400,
                  }}
                >
                  {status === "all" ? `All (${tags.length})` : `${status.charAt(0).toUpperCase() + status.slice(1)} (${tags.filter((tag) => tag.status === status).length})`}
                </button>
              ))}
            </div>

            <div className="flex gap-1 rounded-xl p-1" style={{ background: isDark ? "#0F172A" : "#F1F5F9" }}>
              {([
                ["grid", LayoutGrid],
                ["list", List],
              ] as const).map(([mode, Icon]) => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                    view === mode ? "text-white shadow-sm" : isDark ? "text-slate-400 hover:text-white" : "text-slate-500"
                  }`}
                  style={{ background: view === mode ? "linear-gradient(135deg, #DC2626, #EA580C)" : "transparent" }}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className={view === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
            {[1, 2, 3].map((index) => (
              <TagCardSkeleton key={index} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          search || filterStatus !== "all" ? (
            <div className={`rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
              <EmptyState
                icon={<Search size={28} />}
                title="No tags found"
                description={`No tags match "${search || filterStatus}". Try adjusting your search or filter.`}
                actions={[
                  {
                    label: "Clear filters",
                    onClick: () => {
                      setSearch("");
                      setFilterStatus("all");
                    },
                    variant: "secondary",
                  },
                ]}
              />
            </div>
          ) : (
            <div className={`rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
              <EmptyState
                icon={<Tag size={28} />}
                title="No tags yet"
                description="Claim your first NFC tag to get started. You will be able to share your profile with a single tap."
                actions={[
                  { label: "Claim a Tag", href: "/claim", variant: "primary" },
                  { label: "Scan a Tag", href: "/scan", variant: "secondary" },
                ]}
                size="lg"
              />
            </div>
          )
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((tag) => (
                <TagCard key={tag.id} tag={tag} view="grid" isDark={isDark} onDelete={deleteTag} onToggleStatus={toggleTagStatus} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className={`overflow-hidden rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
            <AnimatePresence>
              {filtered.map((tag) => (
                <TagCard key={tag.id} tag={tag} view="list" isDark={isDark} onDelete={deleteTag} onToggleStatus={toggleTagStatus} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
