import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import {
  Users,
  Search,
  Download,
  Eye,
  Edit,
  ChevronUp,
  ChevronDown,
  Plus,
  Menu,
  UserCheck,
  UserX,
  PauseCircle,
  Wifi,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
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

type SortField = "taps" | "name" | "created";
type SortDir = "asc" | "desc";
type ProfileStatus = "active" | "inactive" | "unclaimed";

interface AdminProfileItem {
  id: string;
  slug: string;
  name: string;
  title: string;
  email: string;
  ownerName: string;
  templateType: string;
  theme: string;
  photo: string | null;
  status: ProfileStatus;
  tagCode: string | null;
  taps: number;
  createdAt: string;
  lastTapAt: string | null;
}

interface AdminProfilesResponse {
  items: AdminProfileItem[];
}

interface ProfileRow {
  id: string;
  slug: string;
  profileUrl: string;
  name: string;
  email: string;
  title: string;
  type: string;
  template: string;
  tagId: string;
  taps: number;
  status: ProfileStatus;
  created: string;
  createdAt: string;
  lastActive: string;
  photo: string;
}

const STATUS_COLORS: Record<ProfileStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500",
  unclaimed: "bg-amber-100 text-amber-700",
};

const PAGE_SIZE = 8;

function toTitleCase(value: string): string {
  return value
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeTemplateLabel(templateType: string): string {
  if (templateType.toLowerCase() === "cafe") {
    return "Cafe";
  }
  return toTitleCase(templateType);
}

function fallbackPhotoForTemplate(templateType: string): string {
  const normalized = templateType.toLowerCase();
  if (normalized === "business") {
    return PROFILE_3;
  }
  if (normalized === "pet" || normalized === "cafe") {
    return PROFILE_4;
  }
  if (normalized === "event") {
    return PROFILE_2;
  }
  return PROFILE_1;
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

function formatCreatedDate(input: string): string {
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

export function AdminProfiles() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProfileStatus>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("taps");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const [profiles, setProfiles] = useState<AdminProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const card = `rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`;
  const inputCls = `h-9 px-3 rounded-xl border text-xs outline-none ${
    isDark
      ? "bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
      : "bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400"
  }`;

  const loadProfiles = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await apiRequest<AdminProfilesResponse>("/admin/profiles?page=1&pageSize=100", { auth: true });
      setProfiles(response.items);
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
      setError(err instanceof Error ? err.message : "Unable to load profiles.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadProfiles(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profileRows = useMemo<ProfileRow[]>(
    () =>
      profiles.map((profile) => ({
        id: profile.id,
        slug: profile.slug,
        profileUrl: `/profile/${encodeURIComponent(profile.slug)}`,
        name: profile.name,
        email: profile.email,
        title: profile.title || profile.ownerName,
        type: normalizeTemplateLabel(profile.templateType),
        template: profile.theme ? toTitleCase(profile.theme) : normalizeTemplateLabel(profile.templateType),
        tagId: profile.tagCode ?? "—",
        taps: profile.taps,
        status: profile.status,
        created: formatCreatedDate(profile.createdAt),
        createdAt: profile.createdAt,
        lastActive: formatRelativeTime(profile.lastTapAt),
        photo: profile.photo || fallbackPhotoForTemplate(profile.templateType),
      })),
    [profiles]
  );

  const availableTypes = useMemo(() => {
    const values = new Set(profileRows.map((row) => row.type));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [profileRows]);

  const filtered = useMemo(() => {
    return profileRows
      .filter((profile) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          query.length === 0 ||
          profile.name.toLowerCase().includes(query) ||
          profile.email.toLowerCase().includes(query) ||
          profile.title.toLowerCase().includes(query) ||
          profile.tagId.toLowerCase().includes(query);

        const matchesStatus = statusFilter === "all" || profile.status === statusFilter;
        const matchesType = typeFilter === "all" || profile.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        if (sortField === "taps") {
          return sortDir === "desc" ? b.taps - a.taps : a.taps - b.taps;
        }
        if (sortField === "name") {
          return sortDir === "desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
        }

        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return sortDir === "desc" ? bTime - aTime : aTime - bTime;
      });
  }, [profileRows, search, statusFilter, typeFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const toggleAll = () => {
    setSelected((current) =>
      current.length === paginated.length ? [] : paginated.map((profile) => profile.id)
    );
  };

  const toggle = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  const stats = [
    {
      label: "Total Profiles",
      value: profileRows.length,
      icon: Users,
      grad: "linear-gradient(135deg,#DC2626,#EA580C)",
      bg: "rgba(79,70,229,0.08)",
    },
    {
      label: "Active",
      value: profileRows.filter((profile) => profile.status === "active").length,
      icon: UserCheck,
      grad: "linear-gradient(135deg,#10B981,#059669)",
      bg: "rgba(16,185,129,0.08)",
    },
    {
      label: "Inactive",
      value: profileRows.filter((profile) => profile.status === "inactive").length,
      icon: UserX,
      grad: "linear-gradient(135deg,#64748B,#475569)",
      bg: "rgba(100,116,139,0.08)",
    },
    {
      label: "Unclaimed",
      value: profileRows.filter((profile) => profile.status === "unclaimed").length,
      icon: PauseCircle,
      grad: "linear-gradient(135deg,#F59E0B,#D97706)",
      bg: "rgba(245,158,11,0.08)",
    },
  ];

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} /> : null;

  const exportProfiles = () => {
    const headers = ["ID", "Name", "Email", "Title", "Type", "Theme", "Status", "Tag", "Taps", "Created", "Last Active"];
    const rows = filtered.map((profile) => [
      profile.id,
      profile.name,
      profile.email,
      profile.title,
      profile.type,
      profile.template,
      profile.status,
      profile.tagId,
      String(profile.taps),
      profile.created,
      profile.lastActive,
    ]);

    downloadCsv(`admin-profiles-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
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
              <button
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-200"}`}
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Profiles
                </h1>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{profileRows.length} total profiles</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadProfiles(true)}
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
                onClick={exportProfiles}
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
              <Link
                to="/editor"
                className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#DC2626,#EA580C)", fontWeight: 600 }}
              >
                <Plus size={14} />
                <span className="hidden sm:inline">New Profile</span>
              </Link>
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
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className={`p-4 ${card}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                      <Icon size={17} style={{ background: stat.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }} />
                    </div>
                    <ArrowUpRight size={14} className={isDark ? "text-slate-600" : "text-slate-300"} />
                  </div>
                  <div className={isDark ? "text-white" : "text-slate-900"} style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                    {stat.value}
                  </div>
                  <div className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{stat.label}</div>
                </motion.div>
              );
            })}
          </div>

          <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <div className="flex items-center gap-2 flex-wrap">
                {selected.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${isDark ? "bg-indigo-950/50 border border-indigo-800" : "bg-indigo-50 border border-indigo-200"}`}
                  >
                    <span className={isDark ? "text-indigo-300" : "text-indigo-700"} style={{ fontWeight: 600 }}>
                      {selected.length} selected
                    </span>
                    <button className="text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>
                      Export
                    </button>
                  </motion.div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className={`flex items-center gap-2 h-9 px-3 rounded-xl border flex-1 sm:w-52 sm:flex-none ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <Search size={13} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search profiles..."
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    className={`flex-1 text-xs bg-transparent outline-none ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-700 placeholder:text-slate-400"}`}
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(event) => {
                    setTypeFilter(event.target.value);
                    setPage(1);
                  }}
                  className={`${inputCls} pr-6`}
                  style={{ fontWeight: 500 }}
                >
                  <option value="all">All Types</option>
                  {availableTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as "all" | ProfileStatus);
                    setPage(1);
                  }}
                  className={`${inputCls} pr-6`}
                  style={{ fontWeight: 500 }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="unclaimed">Unclaimed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b text-xs ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.length === paginated.length && paginated.length > 0}
                        onChange={toggleAll}
                        className="rounded accent-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th
                      className={`text-left px-4 py-3 cursor-pointer select-none hover:text-indigo-500 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      style={{ fontWeight: 600 }}
                      onClick={() => toggleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Profile <SortIcon field="name" />
                      </div>
                    </th>
                    <th className={`text-left px-4 py-3 hidden sm:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Type
                    </th>
                    <th className={`text-left px-4 py-3 hidden md:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Theme
                    </th>
                    <th className={`text-left px-4 py-3 hidden lg:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      NFC Tag
                    </th>
                    <th
                      className={`text-left px-4 py-3 cursor-pointer select-none hover:text-indigo-500 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      style={{ fontWeight: 600 }}
                      onClick={() => toggleSort("taps")}
                    >
                      <div className="flex items-center gap-1">
                        Taps <SortIcon field="taps" />
                      </div>
                    </th>
                    <th className={`text-left px-4 py-3 ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Status
                    </th>
                    <th className={`text-left px-4 py-3 hidden xl:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Last Active
                    </th>
                    <th className="w-16 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((profile, index) => {
                    const isSelected = selected.includes(profile.id);
                    return (
                      <motion.tr
                        key={profile.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
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
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggle(profile.id)}
                            className="rounded accent-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-indigo-100 dark:ring-indigo-900/40">
                              <ImageWithFallback src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>
                                {profile.name}
                              </p>
                              <p className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>{profile.email}</p>
                              <Link
                                to={profile.profileUrl}
                                className={`block truncate text-[11px] underline decoration-dotted underline-offset-2 ${
                                  isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                {profile.profileUrl}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-indigo-950/40 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`} style={{ fontWeight: 600 }}>
                            {profile.type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className={`text-xs px-2.5 py-1 rounded-lg ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`} style={{ fontWeight: 500 }}>
                            {profile.template}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Wifi size={11} className="text-indigo-400" />
                            <span className={`text-xs font-mono ${isDark ? "text-slate-300" : "text-slate-600"}`}>{profile.tagId}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3.5 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                          {profile.taps.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[profile.status]}`} style={{ fontWeight: 600 }}>
                            {profile.status}
                          </span>
                        </td>
                        <td className={`px-4 py-3.5 text-xs hidden xl:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {profile.lastActive}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-0.5">
                            <Link
                              to={`/profile/${encodeURIComponent(profile.slug)}`}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              }`}
                            >
                              <Eye size={13} />
                            </Link>
                            <Link
                              to={`/editor?profile=${encodeURIComponent(profile.id)}`}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              }`}
                            >
                              <Edit size={13} />
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>

              {paginated.length === 0 && (
                <div className="py-16 text-center">
                  <Users size={32} className={`mx-auto mb-3 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
                  <p className={isDark ? "text-slate-500" : "text-slate-400"}>No profiles match your filters</p>
                </div>
              )}
            </div>

            <div className={`flex items-center justify-between p-4 border-t text-xs ${isDark ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"}`}>
              <span>
                Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={safePage === 1}
                  onClick={() => setPage((current) => current - 1)}
                  className={`h-7 px-2.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
                  <button
                    key={value}
                    onClick={() => setPage(value)}
                    className={`w-7 h-7 rounded-lg transition-colors ${
                      value === safePage
                        ? "text-white"
                        : isDark
                        ? "text-slate-400 hover:bg-slate-800"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                    style={{
                      background: value === safePage ? "linear-gradient(135deg,#DC2626,#EA580C)" : "transparent",
                      fontWeight: value === safePage ? 600 : 400,
                    }}
                  >
                    {value}
                  </button>
                ))}
                <button
                  disabled={safePage === totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className={`h-7 px-2.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
