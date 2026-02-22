import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import {
  Wifi,
  Search,
  Download,
  Plus,
  Menu,
  Copy,
  ExternalLink,
  Shuffle,
  PowerOff,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Tag,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  XCircle,
} from "lucide-react";

import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { ApiError, apiRequest } from "../../lib/api";
import { clearSession } from "../../lib/session";

const PROFILE_1 =
  "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PROFILE_2 =
  "https://images.unsplash.com/photo-1626784579980-db39c1a13aa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbmVyJTIwd29tYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE2NjI0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PROFILE_3 =
  "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHByb2Zlc3Npb25hbCUyMHN1aXQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE3NTMwOTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PROFILE_4 =
  "https://images.unsplash.com/photo-1758598497635-48cbbb1f6555?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGVudHJlcHJlbmV1ciUyMG1hbiUyMHNtaWxpbmclMjBvZmZpY2V8ZW58MXx8fHwxNzcxNzUzMDkxfDA&ixlib=rb-4.1.0&q=80&w=1080";

type ApiTagStatus = "active" | "inactive" | "unclaimed";
type TabStatus = "all" | "active" | "unlinked" | "inactive";

interface AdminTagItem {
  id: string;
  code: string;
  uid: string | null;
  claimCode: string | null;
  status: ApiTagStatus;
  taps: number;
  lastTapAt: string | null;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
  profile: {
    id: string;
    slug: string;
    templateType: string;
    name?: string;
    photo?: string | null;
  } | null;
}

interface AdminTagsResponse {
  items: AdminTagItem[];
}

interface GenerateTagsResponse {
  created: number;
}

interface TagRow {
  id: string;
  code: string;
  uid: string;
  profileId: string | null;
  profile: { name: string; photo: string } | null;
  status: "active" | "inactive" | "unlinked";
  assigned: string;
  lastTap: string;
  taps: number;
  firmware: string;
}

const STATUS_META = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
  unlinked: { label: "Unlinked", cls: "bg-amber-100 text-amber-700", Icon: AlertTriangle },
  inactive: { label: "Inactive", cls: "bg-slate-100 text-slate-500", Icon: XCircle },
} as const;

const TABS: Array<{ key: TabStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "unlinked", label: "Unlinked" },
  { key: "inactive", label: "Inactive" },
];

function fallbackPhoto(tagCode: string): string {
  const hash = tagCode.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
  if (hash === 0) {
    return PROFILE_1;
  }
  if (hash === 1) {
    return PROFILE_2;
  }
  if (hash === 2) {
    return PROFILE_3;
  }
  return PROFILE_4;
}

function mapStatus(status: ApiTagStatus): "active" | "inactive" | "unlinked" {
  if (status === "unclaimed") {
    return "unlinked";
  }
  return status;
}

function formatRelativeTime(input: string | null): string {
  if (!input) {
    return "Never";
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "Never";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatDate(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escape(cell)).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdminNfcTags() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<TabStatus>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [sortField, setSortField] = useState<"taps" | "id">("taps");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genCount, setGenCount] = useState("10");
  const [genPrefix, setGenPrefix] = useState("NFC");

  const [tags, setTags] = useState<AdminTagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const card = `rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`;

  const loadTags = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await apiRequest<AdminTagsResponse>("/admin/tags?page=1&pageSize=100", { auth: true });
      setTags(response.items);
      setSelected([]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        navigate("/my-tags", { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to load tags.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadTags(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo<TagRow[]>(
    () =>
      tags.map((tag) => {
        const profileName = tag.profile?.name || tag.profile?.slug || tag.owner?.name || null;
        return {
          id: tag.id,
          code: tag.code,
          uid: tag.uid ?? "—",
          profileId: tag.profile?.id ?? null,
          profile: profileName
            ? {
                name: profileName,
                photo: tag.profile?.photo || fallbackPhoto(tag.code),
              }
            : null,
          status: mapStatus(tag.status),
          assigned: formatDate(tag.createdAt),
          lastTap: formatRelativeTime(tag.lastTapAt),
          taps: tag.taps,
          firmware: "v2.1",
        };
      }),
    [tags]
  );

  const filtered = useMemo(() => {
    return rows
      .filter((tag) => {
        const query = search.trim().toLowerCase();
        const matchesStatus = tab === "all" || tag.status === tab;
        const matchesSearch =
          query.length === 0 ||
          tag.code.toLowerCase().includes(query) ||
          tag.uid.toLowerCase().includes(query) ||
          tag.profile?.name.toLowerCase().includes(query);
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortField === "taps") {
          return sortDir === "desc" ? b.taps - a.taps : a.taps - b.taps;
        }
        return sortDir === "desc" ? b.code.localeCompare(a.code) : a.code.localeCompare(b.code);
      });
  }, [rows, tab, search, sortField, sortDir]);

  const counts = {
    all: rows.length,
    active: rows.filter((tag) => tag.status === "active").length,
    unlinked: rows.filter((tag) => tag.status === "unlinked").length,
    inactive: rows.filter((tag) => tag.status === "inactive").length,
  };

  const stats = [
    { label: "Total Tags", value: counts.all, grad: "linear-gradient(135deg,#4F46E5,#7C3AED)", bg: "rgba(79,70,229,0.08)", Icon: Tag },
    { label: "Active", value: counts.active, grad: "linear-gradient(135deg,#10B981,#059669)", bg: "rgba(16,185,129,0.08)", Icon: CheckCircle2 },
    { label: "Unlinked", value: counts.unlinked, grad: "linear-gradient(135deg,#F59E0B,#D97706)", bg: "rgba(245,158,11,0.08)", Icon: AlertTriangle },
    { label: "Inactive", value: counts.inactive, grad: "linear-gradient(135deg,#64748B,#475569)", bg: "rgba(100,116,139,0.08)", Icon: XCircle },
  ];

  const toggleAll = () => {
    setSelected((current) => (current.length === filtered.length ? [] : filtered.map((tag) => tag.id)));
  };

  const toggle = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  const copyLink = (code: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
    navigator.clipboard.writeText(`${base}/scan/${encodeURIComponent(code)}`).catch(() => {});
    setCopiedId(code);
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  const toggleSort = (field: "taps" | "id") => {
    if (sortField === field) {
      setSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const exportTags = () => {
    const headers = ["Tag ID", "UID", "Profile", "Status", "Assigned", "Last Tap", "Taps"];
    const csvRows = filtered.map((tag) => [
      tag.code,
      tag.uid,
      tag.profile?.name ?? "",
      tag.status,
      tag.assigned,
      tag.lastTap,
      String(tag.taps),
    ]);
    downloadCsv(`admin-tags-${new Date().toISOString().slice(0, 10)}.csv`, headers, csvRows);
  };

  const updateTagStatus = async (tagId: string, nextStatus: "active" | "inactive") => {
    setSubmitting(true);
    setError("");

    try {
      await apiRequest(`/tags/${encodeURIComponent(tagId)}/status`, {
        method: "PATCH",
        auth: true,
        body: { status: nextStatus },
      });
      await loadTags(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update tag status.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTag = async (tagId: string) => {
    setSubmitting(true);
    setError("");

    try {
      await apiRequest(`/tags/${encodeURIComponent(tagId)}`, {
        method: "DELETE",
        auth: true,
      });
      await loadTags(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to unassign tag.");
    } finally {
      setSubmitting(false);
    }
  };

  const applyBulkStatus = async (nextStatus: "active" | "inactive") => {
    if (selected.length === 0) {
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      await Promise.all(
        selected.map((id) =>
          apiRequest(`/tags/${encodeURIComponent(id)}/status`, {
            method: "PATCH",
            auth: true,
            body: { status: nextStatus },
          })
        )
      );
      await loadTags(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update selected tags.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSelected = async () => {
    if (selected.length === 0) {
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      await Promise.all(
        selected.map((id) =>
          apiRequest(`/tags/${encodeURIComponent(id)}`, {
            method: "DELETE",
            auth: true,
          })
        )
      );
      await loadTags(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete selected tags.");
    } finally {
      setSubmitting(false);
    }
  };

  const generateTags = async () => {
    const count = Number.parseInt(genCount, 10);
    if (Number.isNaN(count) || count < 1 || count > 500) {
      setError("Quantity must be between 1 and 500.");
      return;
    }

    const prefix = genPrefix.trim().toUpperCase();
    if (!prefix || prefix.length < 2 || prefix.length > 10) {
      setError("Prefix must be 2-10 characters.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await apiRequest<GenerateTagsResponse>("/admin/tags/generate", {
        method: "POST",
        auth: true,
        body: {
          count,
          prefix,
        },
      });
      setShowGenerate(false);
      await loadTags(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate tags.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen pt-16 flex ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 lg:ml-56 p-8">
          <div className={`h-10 w-48 rounded-xl animate-pulse ${isDark ? "bg-slate-900" : "bg-slate-200"}`} />
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className={`h-28 rounded-2xl animate-pulse ${isDark ? "bg-slate-900" : "bg-white border border-slate-100"}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-16 flex ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-56 min-w-0">
        <div className={`sticky top-16 z-20 border-b px-4 sm:px-6 lg:px-8 py-4 ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className={`lg:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-200"}`}>
                <Menu size={18} />
              </button>
              <div>
                <h1 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                  NFC Tags
                </h1>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{counts.all} tags issued</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadTags(true)}
                disabled={refreshing}
                className={`flex items-center gap-2 h-9 px-3 rounded-lg text-sm transition-colors ${
                  isDark
                    ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-60"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
                }`}
                style={{ fontWeight: 500 }}
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
              <button
                onClick={exportTags}
                className={`flex items-center gap-2 h-9 px-3 rounded-lg text-sm transition-colors ${
                  isDark
                    ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
                style={{ fontWeight: 500 }}
              >
                <Download size={14} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button onClick={() => setShowGenerate((value) => !value)} className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm text-white transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", fontWeight: 600 }}>
                <Plus size={14} />
                <span className="hidden sm:inline">Generate Tags</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-5">
          {error && (
            <div
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                isDark ? "border-rose-900/40 bg-rose-950/20 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat, index) => {
              const Icon = stat.Icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }} className={`p-4 ${card}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                      <Icon size={17} style={{ background: stat.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }} />
                    </div>
                    <ArrowUpRight size={14} className={isDark ? "text-slate-700" : "text-slate-300"} />
                  </div>
                  <div className={isDark ? "text-white" : "text-slate-900"} style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                    {stat.value}
                  </div>
                  <div className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{stat.label}</div>
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence>
            {showGenerate && (
              <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -8, height: 0 }} className="overflow-hidden">
                <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-indigo-50 border-indigo-100"}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className={isDark ? "text-white" : "text-indigo-900"} style={{ fontWeight: 700 }}>
                        Generate New Tags
                      </h3>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-indigo-600"}`}>
                        New tags are created as unlinked and ready to claim.
                      </p>
                    </div>
                    <button onClick={() => setShowGenerate(false)} className={isDark ? "text-slate-500 hover:text-slate-300" : "text-indigo-400 hover:text-indigo-600"}>
                      <XCircle size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className={`block text-xs mb-1.5 ${isDark ? "text-slate-400" : "text-indigo-700"}`} style={{ fontWeight: 600 }}>
                        ID Prefix
                      </label>
                      <input type="text" value={genPrefix} onChange={(event) => setGenPrefix(event.target.value)} maxLength={10} className={`h-9 w-24 px-3 rounded-xl border text-xs outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-indigo-200 text-slate-800"}`} />
                    </div>
                    <div>
                      <label className={`block text-xs mb-1.5 ${isDark ? "text-slate-400" : "text-indigo-700"}`} style={{ fontWeight: 600 }}>
                        Quantity
                      </label>
                      <input type="number" value={genCount} onChange={(event) => setGenCount(event.target.value)} min="1" max="500" className={`h-9 w-24 px-3 rounded-xl border text-xs outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-indigo-200 text-slate-800"}`} />
                    </div>
                    <button onClick={() => void generateTags()} disabled={submitting} className="h-9 px-5 rounded-xl text-sm text-white transition-all hover:opacity-90 disabled:opacity-60" style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", fontWeight: 600 }}>
                      {submitting ? "Generating..." : `Generate ${genCount} Tags`}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
            <div className={`border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <div className="flex items-center gap-0 px-4 pt-3 overflow-x-auto">
                {TABS.map((entry) => (
                  <button
                    key={entry.key}
                    onClick={() => setTab(entry.key)}
                    className={`flex items-center gap-1.5 px-3 pb-2.5 text-xs border-b-2 transition-colors whitespace-nowrap ${
                      tab === entry.key
                        ? "border-indigo-500 text-indigo-500"
                        : isDark
                        ? "border-transparent text-slate-400 hover:text-slate-200"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                    style={{ fontWeight: tab === entry.key ? 600 : 400 }}
                  >
                    {entry.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === entry.key ? "bg-indigo-100 text-indigo-600" : isDark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-500"}`} style={{ fontWeight: 600 }}>
                      {counts[entry.key]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {selected.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${isDark ? "bg-indigo-950/50 border border-indigo-800" : "bg-indigo-50 border border-indigo-200"}`}>
                      <span className={isDark ? "text-indigo-300" : "text-indigo-700"} style={{ fontWeight: 600 }}>
                        {selected.length} selected
                      </span>
                      <button disabled={submitting} onClick={() => void applyBulkStatus("active")} className="text-emerald-500 disabled:opacity-40" style={{ fontWeight: 600 }}>
                        Activate
                      </button>
                      <button disabled={submitting} onClick={() => void applyBulkStatus("inactive")} className={isDark ? "text-slate-400 disabled:opacity-40" : "text-slate-500 disabled:opacity-40"} style={{ fontWeight: 600 }}>
                        Deactivate
                      </button>
                      <button disabled={submitting} onClick={() => void deleteSelected()} className="text-rose-500 disabled:opacity-40" style={{ fontWeight: 600 }}>
                        Delete
                      </button>
                    </motion.div>
                  )}
                </div>
                <div className={`flex items-center gap-2 h-8 px-3 rounded-xl border w-full sm:w-52 ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <Search size={12} className="text-slate-400 shrink-0" />
                  <input type="text" placeholder="Search tag ID or name..." value={search} onChange={(event) => setSearch(event.target.value)} className={`flex-1 text-xs bg-transparent outline-none ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-700 placeholder:text-slate-400"}`} />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b text-xs ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded accent-indigo-500 cursor-pointer" />
                    </th>
                    <th className={`text-left px-4 py-3 cursor-pointer select-none hover:text-indigo-500 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }} onClick={() => toggleSort("id")}> 
                      <div className="flex items-center gap-1">Tag ID {sortField === "id" && (sortDir === "desc" ? <ChevronDown size={11} /> : <ChevronUp size={11} />)}</div>
                    </th>
                    <th className={`text-left px-4 py-3 ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Linked Profile
                    </th>
                    <th className={`text-left px-4 py-3 ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Status
                    </th>
                    <th className={`text-left px-4 py-3 hidden md:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Assigned
                    </th>
                    <th className={`text-left px-4 py-3 hidden lg:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Last Tap
                    </th>
                    <th className={`text-left px-4 py-3 cursor-pointer select-none hover:text-indigo-500 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }} onClick={() => toggleSort("taps")}> 
                      <div className="flex items-center gap-1">Taps {sortField === "taps" && (sortDir === "desc" ? <ChevronDown size={11} /> : <ChevronUp size={11} />)}</div>
                    </th>
                    <th className={`text-left px-4 py-3 hidden xl:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Firmware
                    </th>
                    <th className="w-24 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tag, index) => {
                    const isSelected = selected.includes(tag.id);
                    const meta = STATUS_META[tag.status];
                    const StatusIcon = meta.Icon;
                    return (
                      <motion.tr
                        key={tag.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.025 }}
                        className={`border-b transition-colors ${
                          isSelected
                            ? isDark
                              ? "bg-indigo-950/30 border-indigo-900/20"
                              : "bg-indigo-50 border-indigo-100"
                            : isDark
                            ? "border-slate-800 hover:bg-slate-800/40"
                            : "border-slate-50 hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={isSelected} onChange={() => toggle(tag.id)} className="rounded accent-indigo-500 cursor-pointer" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                              <Wifi size={13} className={tag.status === "active" ? "text-indigo-500" : isDark ? "text-slate-500" : "text-slate-400"} />
                            </div>
                            <span className={`text-xs font-mono ${isDark ? "text-white" : "text-slate-800"}`} style={{ fontWeight: 600 }}>
                              {tag.code}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {tag.profile ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                                <ImageWithFallback src={tag.profile.photo} alt={tag.profile.name} className="w-full h-full object-cover" />
                              </div>
                              <span className={`text-xs ${isDark ? "text-slate-200" : "text-slate-700"}`} style={{ fontWeight: 500 }}>
                                {tag.profile.name}
                              </span>
                            </div>
                          ) : (
                            <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>— unassigned —</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${meta.cls}`} style={{ fontWeight: 600 }}>
                            <StatusIcon size={11} />
                            {meta.label}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-xs hidden md:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`}>{tag.assigned}</td>
                        <td className={`px-4 py-3 text-xs hidden lg:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`}>{tag.lastTap}</td>
                        <td className={`px-4 py-3 text-xs ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: tag.taps > 0 ? 600 : 400 }}>
                          {tag.taps > 0 ? tag.taps.toLocaleString() : <span className={isDark ? "text-slate-600" : "text-slate-300"}>—</span>}
                        </td>
                        <td className={`px-4 py-3 text-xs hidden xl:table-cell font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>{tag.firmware}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => copyLink(tag.code)} title="Copy scan link" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors relative ${isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}>
                              {copiedId === tag.code ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                            </button>
                            <Link to={`/scan/${encodeURIComponent(tag.code)}`} title="Open scan page" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}>
                              <ExternalLink size={13} />
                            </Link>
                            <button
                              title="Edit linked profile"
                              onClick={() =>
                                navigate(
                                  tag.profileId
                                    ? `/editor?profile=${encodeURIComponent(tag.profileId)}`
                                    : "/editor"
                                )
                              }
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
                            >
                              <Shuffle size={13} />
                            </button>
                            {tag.status === "active" ? (
                              <button disabled={submitting} onClick={() => void updateTagStatus(tag.id, "inactive")} title="Deactivate" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 ${isDark ? "text-slate-400 hover:bg-amber-900/40 hover:text-amber-400" : "text-slate-400 hover:bg-amber-50 hover:text-amber-600"}`}>
                                <PowerOff size={13} />
                              </button>
                            ) : (
                              <button disabled={submitting} onClick={() => void updateTagStatus(tag.id, "active")} title="Activate" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 ${isDark ? "text-slate-400 hover:bg-emerald-900/40 hover:text-emerald-400" : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"}`}>
                                <CheckCircle2 size={13} />
                              </button>
                            )}
                            <button disabled={submitting} onClick={() => void deleteTag(tag.id)} title="Unassign / delete" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 ${isDark ? "text-slate-400 hover:bg-rose-900/40 hover:text-rose-400" : "text-slate-400 hover:bg-rose-50 hover:text-rose-500"}`}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="py-16 text-center">
                  <Wifi size={32} className={`mx-auto mb-3 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
                  <p className={isDark ? "text-slate-500" : "text-slate-400"}>No tags match your search</p>
                </div>
              )}
            </div>

            <div className={`flex items-center justify-between p-4 border-t text-xs ${isDark ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"}`}>
              <span>
                Showing {filtered.length} of {rows.length} tags
              </span>
              <span className={isDark ? "text-slate-500" : "text-slate-400"}>
                {counts.active} active · {counts.unlinked} unlinked · {counts.inactive} inactive
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
