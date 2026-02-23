import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Zap,
  Search,
  Download,
  Eye,
  Edit,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  RefreshCw,
  Bell,
  Wifi,
  Activity,
  Calendar,
  Menu,
  Minus,
  AlertCircle,
} from "lucide-react";

import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { AdminSidebar } from "../components/admin/AdminSidebar";
import { ApiError, apiRequest } from "../lib/api";
import { clearSession } from "../lib/session";

const PROFILE_1 =
  "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PROFILE_2 =
  "https://images.unsplash.com/photo-1626784579980-db39c1a13aa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbmVyJTIwd29tYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE2NjI0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PROFILE_3 =
  "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHByb2Zlc3Npb25hbCUyMHN1aXQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE3NTMwOTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PROFILE_4 =
  "https://images.unsplash.com/photo-1758598497635-48cbbb1f6555?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGVudHJlcHJlbmV1ciUyMG1hbiUyMHNtaWxpbmclMjBvZmZpY2V8ZW58MXx8fHwxNzcxNzUzMDkxfDA&ixlib=rb-4.1.0&q=80&w=1080";

type SortField = "taps" | "name";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "active" | "inactive" | "unclaimed";
type Trend = "up" | "down" | "neutral";

interface OverviewSummary {
  totalTaps: number;
  uniqueVisitors: number;
  avgTapsPerDay: number;
  totalProfiles: number;
  activeTags: number;
}

interface OverviewTimelineItem {
  date: string;
  taps: number;
  visitors: number;
}

interface OverviewDeviceItem {
  name: string;
  value: number;
}

interface AdminOverviewResponse {
  range: string;
  summary: OverviewSummary;
  timeline: OverviewTimelineItem[];
  devices: OverviewDeviceItem[];
}

interface AdminProfileItem {
  id: string;
  slug: string;
  name: string;
  title: string;
  ownerName: string;
  templateType: string;
  theme: string;
  photo: string | null;
  status: "active" | "inactive" | "unclaimed";
  taps: number;
  lastTapAt: string | null;
}

interface AdminProfilesResponse {
  items: AdminProfileItem[];
}

interface DashboardProfileRow {
  id: string;
  slug: string;
  name: string;
  title: string;
  template: string;
  taps: number;
  status: "active" | "inactive" | "unclaimed";
  lastActive: string;
  photo: string;
}

interface DashboardStat {
  title: string;
  value: string;
  change: string;
  trend: Trend;
  icon: typeof Users;
  gradient: string;
  bg: string;
}

const statusColors: Record<DashboardProfileRow["status"], string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500",
  unclaimed: "bg-amber-100 text-amber-700",
};

const deviceColorMap: Record<string, string> = {
  iOS: "#DC2626",
  Android: "#EA580C",
  Other: "#FBBF24",
};

function toTitleCase(value: string): string {
  return value
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeTemplateLabel(templateType: string): string {
  const normalized = templateType.toLowerCase();
  if (normalized === "cafe") {
    return "Cafe";
  }
  return toTitleCase(normalized);
}

function formatShortDate(input: string): string {
  const date = new Date(`${input}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return input;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatLongDate(input: string): string {
  const date = new Date(`${input}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return input;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

function calcPercentDelta(current: number, previous: number): { value: string; trend: Trend } {
  if (previous <= 0) {
    return { value: "Current", trend: "neutral" };
  }
  const delta = ((current - previous) / previous) * 100;
  if (Math.abs(delta) < 0.1) {
    return { value: "0.0%", trend: "neutral" };
  }
  return {
    value: `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`,
    trend: delta > 0 ? "up" : "down",
  };
}

function buildWeeklyData(timeline: OverviewTimelineItem[]): Array<{ day: string; taps: number }> {
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayTotals = new Map<string, number>(dayOrder.map((day) => [day, 0]));

  for (const item of timeline) {
    const date = new Date(`${item.date}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const dayIdx = date.getUTCDay();
    const day = dayOrder[(dayIdx + 6) % 7];
    dayTotals.set(day, (dayTotals.get(day) ?? 0) + item.taps);
  }

  return dayOrder.map((day) => ({ day, taps: dayTotals.get(day) ?? 0 }));
}

function resolveDateRangeLabel(timeline: OverviewTimelineItem[]): string {
  if (!timeline.length) {
    return "No activity data";
  }
  const first = timeline[0]?.date;
  const last = timeline[timeline.length - 1]?.date;
  return `${formatLongDate(first)} - ${formatLongDate(last)}`;
}

function trendBadgeClasses(trend: Trend): string {
  if (trend === "up") {
    return "bg-emerald-100 text-emerald-600";
  }
  if (trend === "down") {
    return "bg-rose-100 text-rose-600";
  }
  return "bg-slate-100 text-slate-500";
}

export function AdminDashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("taps");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [profiles, setProfiles] = useState<AdminProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const [overviewResponse, profileResponse] = await Promise.all([
        apiRequest<AdminOverviewResponse>("/analytics/admin/overview?range=30d", { auth: true }),
        apiRequest<AdminProfilesResponse>("/admin/profiles?page=1&pageSize=100", { auth: true }),
      ]);

      setOverview(overviewResponse);
      setProfiles(profileResponse.items);
      setSelectedRows([]);
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

      setError(err instanceof Error ? err.message : "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboard(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const tableProfiles = useMemo<DashboardProfileRow[]>(
    () =>
      profiles.map((profile) => ({
        id: profile.id,
        slug: profile.slug,
        name: profile.name,
        title: profile.title || profile.ownerName,
        template: profile.theme ? toTitleCase(profile.theme) : normalizeTemplateLabel(profile.templateType),
        taps: profile.taps,
        status: profile.status,
        lastActive: formatRelativeTime(profile.lastTapAt),
        photo: profile.photo || fallbackPhotoForTemplate(profile.templateType),
      })),
    [profiles]
  );

  const filteredProfiles = useMemo(() => {
    return tableProfiles
      .filter((profile) => {
        const query = search.toLowerCase();
        const matchesSearch =
          profile.name.toLowerCase().includes(query) || profile.title.toLowerCase().includes(query);
        const matchesStatus = statusFilter === "all" || profile.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortField === "taps") {
          return sortDir === "desc" ? b.taps - a.taps : a.taps - b.taps;
        }
        return sortDir === "desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      });
  }, [tableProfiles, search, statusFilter, sortField, sortDir]);

  const toggleRow = (id: string) => {
    setSelectedRows((rows) => (rows.includes(id) ? rows.filter((rowId) => rowId !== id) : [...rows, id]));
  };

  const toggleAll = () => {
    setSelectedRows((rows) =>
      rows.length === filteredProfiles.length ? [] : filteredProfiles.map((profile) => profile.id)
    );
  };

  const chartColor = isDark ? "#EA580C" : "#DC2626";
  const gridColor = isDark ? "#1E293B" : "#F1F5F9";
  const axisColor = isDark ? "#475569" : "#94A3B8";

  const timeline = overview?.timeline ?? [];
  const dateRangeLabel = resolveDateRangeLabel(timeline);
  const areaChartData = timeline.map((item) => ({
    date: formatShortDate(item.date),
    taps: item.taps,
  }));
  const weeklyData = buildWeeklyData(timeline);
  const deviceData = (overview?.devices ?? []).map((device) => ({
    ...device,
    color: deviceColorMap[device.name] ?? "#94A3B8",
  }));

  const lastDay = timeline[timeline.length - 1];
  const previousDay = timeline[timeline.length - 2];
  const tapChange = calcPercentDelta(lastDay?.taps ?? 0, previousDay?.taps ?? 0);
  const visitorChange = calcPercentDelta(lastDay?.visitors ?? 0, previousDay?.visitors ?? 0);

  const summary = overview?.summary ?? {
    totalProfiles: 0,
    activeTags: 0,
    totalTaps: 0,
    uniqueVisitors: 0,
    avgTapsPerDay: 0,
  };

  const stats: DashboardStat[] = [
    {
      title: "Total Profiles",
      value: summary.totalProfiles.toLocaleString(),
      change: "Current",
      trend: "neutral",
      icon: Users,
      gradient: "linear-gradient(135deg, #DC2626, #EA580C)",
      bg: "rgba(79,70,229,0.08)",
    },
    {
      title: "Active Tags",
      value: summary.activeTags.toLocaleString(),
      change: "Current",
      trend: "neutral",
      icon: Wifi,
      gradient: "linear-gradient(135deg, #0ea5e9, #2563eb)",
      bg: "rgba(14,165,233,0.08)",
    },
    {
      title: "Total Taps (30d)",
      value: summary.totalTaps.toLocaleString(),
      change: tapChange.value,
      trend: tapChange.trend,
      icon: Activity,
      gradient: "linear-gradient(135deg, #10B981, #059669)",
      bg: "rgba(16,185,129,0.08)",
    },
    {
      title: "Unique Visitors",
      value: summary.uniqueVisitors.toLocaleString(),
      change: visitorChange.value,
      trend: visitorChange.trend,
      icon: Zap,
      gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
      bg: "rgba(245,158,11,0.08)",
    },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen pt-16 flex ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 lg:ml-56 p-8">
          <div className={`h-10 w-64 animate-pulse rounded-xl ${isDark ? "bg-slate-900" : "bg-slate-200"}`} />
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className={`h-28 animate-pulse rounded-2xl ${isDark ? "bg-slate-900" : "bg-white border border-slate-100"}`}
              />
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
        <div
          className={`sticky top-16 z-20 border-b px-4 sm:px-6 lg:px-8 py-4 ${
            isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-200"
                }`}
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Dashboard
                </h1>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  <Calendar size={12} className="inline mr-1" />
                  {dateRangeLabel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-200"
                }`}
              >
                <Bell size={16} />
              </button>
              <button
                onClick={() => void loadDashboard(true)}
                disabled={refreshing}
                className={`flex items-center gap-2 h-9 px-3 rounded-lg text-sm transition-colors ${
                  isDark ? "bg-slate-800 text-slate-300 border border-slate-700 disabled:opacity-60" : "bg-white text-slate-600 border border-slate-200 disabled:opacity-60"
                }`}
                style={{ fontWeight: 500 }}
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
              <button
                className="flex items-center gap-2 h-9 px-3 rounded-lg text-sm text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 600 }}
              >
                <Download size={14} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`p-4 sm:p-5 rounded-2xl border ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                      <Icon size={17} style={{ background: stat.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }} />
                    </div>
                    <span className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full ${trendBadgeClasses(stat.trend)}`} style={{ fontWeight: 600 }}>
                      {stat.trend === "up" && <ChevronUp size={10} />}
                      {stat.trend === "down" && <ChevronDown size={10} />}
                      {stat.trend === "neutral" && <Minus size={10} />}
                      {stat.change}
                    </span>
                  </div>
                  <div
                    className={isDark ? "text-white" : "text-slate-900"}
                    style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}
                  >
                    {stat.value}
                  </div>
                  <div className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{stat.title}</div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`lg:col-span-2 p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                    Tap Activity
                  </h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Last 30 days</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-emerald-500">
                  <ArrowUpRight size={14} />
                  <span style={{ fontWeight: 600 }}>{tapChange.value}</span>
                </div>
              </div>
              {areaChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={areaChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="tapGradLive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? "#1e293b" : "#fff",
                        border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
                        borderRadius: "12px",
                        color: isDark ? "#fff" : "#1e293b",
                        fontSize: 12,
                      }}
                    />
                    <Area type="monotone" dataKey="taps" stroke={chartColor} strokeWidth={2} fill="url(#tapGradLive)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className={`text-sm py-12 text-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>No tap activity yet.</p>
              )}
            </div>

            <div className="space-y-4">
              <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                <h3 className={`text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                  Device Breakdown
                </h3>
                {deviceData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <PieChart width={80} height={80}>
                      <Pie data={deviceData} cx={35} cy={35} innerRadius={22} outerRadius={38} dataKey="value" strokeWidth={0}>
                        {deviceData.map((entry, idx) => (
                          <Cell key={`device-${entry.name}-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                    <div className="space-y-1.5 flex-1">
                      {deviceData.map((device) => (
                        <div key={device.name} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: device.color }} />
                          <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>{device.name}</span>
                          <span className={`text-xs ml-auto ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>
                            {device.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm py-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>No device data yet.</p>
                )}
              </div>

              <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                <h3 className={`text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                  This Week
                </h3>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={weeklyData} barSize={10}>
                    <XAxis dataKey="day" tick={{ fill: axisColor, fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? "#1e293b" : "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: 11,
                        color: isDark ? "#fff" : "#1e293b",
                      }}
                    />
                    <Bar dataKey="taps" fill={chartColor} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <div>
                <h3 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                  Recent Profiles
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{filteredProfiles.length} profiles</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {selectedRows.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>{selectedRows.length} selected</span>
                    <button className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>
                      Export
                    </button>
                  </div>
                )}

                <div
                  className={`flex items-center gap-2 h-9 px-3 rounded-xl border flex-1 sm:flex-none sm:w-48 ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <Search size={13} className={isDark ? "text-slate-400" : "text-slate-400"} />
                  <input
                    type="text"
                    placeholder="Search profiles..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className={`flex-1 text-xs bg-transparent outline-none ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-700 placeholder:text-slate-400"}`}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  className={`h-9 px-3 rounded-xl border text-xs outline-none ${
                    isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
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
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === filteredProfiles.length && filteredProfiles.length > 0}
                        onChange={toggleAll}
                        className="rounded cursor-pointer accent-indigo-500"
                      />
                    </th>
                    <th
                      className={`text-left px-4 py-3 text-xs cursor-pointer select-none hover:text-indigo-500 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      style={{ fontWeight: 600 }}
                      onClick={() => toggleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Profile
                        {sortField === "name" && (sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                      </div>
                    </th>
                    <th className={`text-left px-4 py-3 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Template
                    </th>
                    <th
                      className={`text-left px-4 py-3 text-xs cursor-pointer select-none hover:text-indigo-500 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      style={{ fontWeight: 600 }}
                      onClick={() => toggleSort("taps")}
                    >
                      <div className="flex items-center gap-1">
                        Taps
                        {sortField === "taps" && (sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                      </div>
                    </th>
                    <th className={`text-left px-4 py-3 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Status
                    </th>
                    <th className={`text-left px-4 py-3 text-xs hidden md:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                      Last Active
                    </th>
                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile, idx) => {
                    const isSelected = selectedRows.includes(profile.id);
                    return (
                      <motion.tr
                        key={profile.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`border-b transition-colors cursor-pointer ${
                          isSelected
                            ? isDark
                              ? "bg-indigo-950/30 border-indigo-900/30"
                              : "bg-indigo-50 border-indigo-100"
                            : isDark
                            ? "border-slate-800 hover:bg-slate-800/50"
                            : "border-slate-100 hover:bg-slate-50"
                        }`}
                        onClick={() => toggleRow(profile.id)}
                      >
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(profile.id)}
                            onClick={(event) => event.stopPropagation()}
                            className="rounded cursor-pointer accent-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-indigo-100">
                              <ImageWithFallback src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>
                                {profile.name}
                              </p>
                              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{profile.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}
                            style={{ fontWeight: 500 }}
                          >
                            {profile.template}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>
                            {profile.taps.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${statusColors[profile.status]}`} style={{ fontWeight: 600 }}>
                            {profile.status}
                          </span>
                        </td>
                        <td className={`px-4 py-3.5 hidden md:table-cell text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {profile.lastActive}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <Link
                              to={`/profile/${encodeURIComponent(profile.slug || profile.id)}`}
                              onClick={(event) => event.stopPropagation()}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              }`}
                            >
                              <Eye size={13} />
                            </Link>
                            <Link
                              to={`/editor?profile=${encodeURIComponent(profile.id)}`}
                              onClick={(event) => event.stopPropagation()}
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

              {filteredProfiles.length === 0 && (
                <div className="py-16 text-center">
                  <p className={`${isDark ? "text-slate-500" : "text-slate-400"}`}>No profiles match your search</p>
                </div>
              )}
            </div>

            <div
              className={`flex items-center justify-between p-4 border-t text-xs ${isDark ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"}`}
            >
              <span>
                Showing {filteredProfiles.length} of {tableProfiles.length} profiles
              </span>
              <span>{overview?.range ?? "30d"} window</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
