import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  ChevronDown,
  Clock,
  Edit,
  MapPin,
  RefreshCw,
  Smartphone,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ChartSkeleton, StatCardSkeleton } from "../components/shared/LoadingSkeleton";
import { ApiError, apiRequest } from "../lib/api";
import { clearAccessToken, getAccessToken } from "../lib/session";

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";

const rangeOptions = [
  { label: "7 days", value: "7d" },
  { label: "14 days", value: "14d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "All time", value: "all" },
] as const;

type AnalyticsRange = (typeof rangeOptions)[number]["value"];

interface AnalyticsTag {
  id: string;
  tagCode: string;
  profileId: string | null;
  templateType: string | null;
  name: string;
  status: string;
  theme: string | null;
  photo: string | null;
  createdAt: string;
}

interface AnalyticsTotals {
  totalTaps: number;
  uniqueVisitors: number;
  avgDaily: number;
  topLink: string | null;
}

interface AnalyticsTimelineItem {
  date: string;
  taps: number;
  unique: number;
}

interface AnalyticsHourlyItem {
  hour: string;
  taps: number;
}

interface AnalyticsDeviceItem {
  name: string;
  value: number;
}

interface AnalyticsLocationItem {
  city: string;
  taps: number;
  pct: number;
}

interface AnalyticsLinkClickItem {
  name: string;
  clicks: number;
}

interface AnalyticsRecentScanItem {
  id: string;
  time: string;
  device: string;
  location: string;
  method: string;
}

interface TagAnalyticsResponse {
  range: string;
  tag: AnalyticsTag;
  totals: AnalyticsTotals;
  timeline: AnalyticsTimelineItem[];
  hourly: AnalyticsHourlyItem[];
  devices: AnalyticsDeviceItem[];
  locations: AnalyticsLocationItem[];
  linkClicks: AnalyticsLinkClickItem[];
  recentScans: AnalyticsRecentScanItem[];
}

function mapTemplateLabel(templateType: string | null): string {
  if (!templateType) {
    return "Profile";
  }

  const normalized = templateType.toLowerCase();
  if (normalized === "cafe") {
    return "Cafe";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function statusMeta(status: string): { label: string; className: string } {
  const normalized = status.toLowerCase();
  if (normalized === "active") {
    return { label: "Active", className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" };
  }
  if (normalized === "inactive") {
    return { label: "Inactive", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" };
  }
  return { label: "Unclaimed", className: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" };
}

function formatHourLabel(raw: string): string {
  const hour = Number(raw);
  if (Number.isNaN(hour)) {
    return raw;
  }

  const suffix = hour >= 12 ? "pm" : "am";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized}${suffix}`;
}

function formatDateShort(dateValue: string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function resolveRangeLabel(range: string): string {
  const match = rangeOptions.find((option) => option.value === range);
  return match?.label || "14 days";
}

function deviceColor(name: string): string {
  if (name === "iOS") {
    return "#DC2626";
  }
  if (name === "Android") {
    return "#EA580C";
  }
  return "#FBBF24";
}

function CustomTooltip({
  active,
  payload,
  label,
  isDark,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  isDark: boolean;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm shadow-xl ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
      <p className={`mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 500 }}>
        {label}
      </p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            <span className={isDark ? "text-slate-300" : "text-slate-600"}>{item.name}</span>
          </div>
          <span className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 700 }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  isDark,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: typeof Zap;
  color: string;
  isDark: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white shadow-sm"}`}>
      <div className="mb-4 flex items-start justify-between">
        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 500 }}>
          {label}
        </p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <p className={`mb-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{sub}</p>
    </div>
  );
}

export function TagAnalytics() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { tagId } = useParams();
  const navigate = useNavigate();

  const [range, setRange] = useState<AnalyticsRange>("14d");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<TagAnalyticsResponse | null>(null);

  const gridColor = isDark ? "#1e293b" : "#f1f5f9";
  const textColor = isDark ? "#64748B" : "#94A3B8";

  const loadAnalytics = async () => {
    if (!tagId) {
      setError("Tag ID is missing.");
      setLoading(false);
      return;
    }

    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<TagAnalyticsResponse>(`/analytics/tag/${encodeURIComponent(tagId)}?range=${range}`, {
        auth: true,
      });
      setData(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAccessToken();
        navigate("/login");
        return;
      }
      setError(error instanceof Error ? error.message : "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, [tagId, range]);

  const timelineData = useMemo(
    () => (data?.timeline || []).map((item) => ({ date: formatDateShort(item.date), taps: item.taps, unique: item.unique })),
    [data?.timeline]
  );

  const hourlyData = useMemo(
    () => (data?.hourly || []).map((item) => ({ hour: formatHourLabel(item.hour), taps: item.taps })),
    [data?.hourly]
  );

  const deviceData = useMemo(
    () => (data?.devices || []).map((item) => ({ ...item, color: deviceColor(item.name) })),
    [data?.devices]
  );

  const rangeLabel = data ? resolveRangeLabel(data.range) : resolveRangeLabel(range);

  if (loading) {
    return (
      <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <StatCardSkeleton key={item} />
            ))}
          </div>
          <ChartSkeleton height={240} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton height={200} />
            <ChartSkeleton height={200} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="max-w-3xl mx-auto px-4 py-14">
          <div className={`rounded-2xl border p-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <h1 className={`mb-2 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
              Analytics unavailable
            </h1>
            <p className={`${isDark ? "text-slate-400" : "text-slate-600"}`}>{error || "Unable to load analytics right now."}</p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  void loadAnalytics();
                }}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white"
                style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 600 }}
              >
                <RefreshCw size={14} />
                Retry
              </button>
              <Link to="/my-tags" className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Back to My Tags
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const status = statusMeta(data.tag.status);
  const templateLabel = mapTemplateLabel(data.tag.templateType);
  const createdAt = new Date(data.tag.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className={`border-b ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Link
                to="/my-tags"
                className={`mt-1 flex items-center gap-1.5 text-sm transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
              >
                <ArrowLeft size={15} />
                <span className="hidden sm:inline">My Tags</span>
              </Link>

              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div className="h-14 w-14 overflow-hidden rounded-2xl shadow-lg">
                    <ImageWithFallback src={data.tag.photo || FALLBACK_PHOTO} alt={data.tag.name} className="h-full w-full object-cover" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white dark:border-slate-950 ${data.tag.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                      {data.tag.name}
                    </h1>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${status.className}`} style={{ fontWeight: 600 }}>
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      <BarChart3 size={10} className="text-indigo-400" />
                      {templateLabel}
                    </span>
                    <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>·</span>
                    <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{data.tag.tagCode}</span>
                    <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>·</span>
                    <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Since {createdAt}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setRangeOpen((current) => !current)}
                  className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-sm transition-all ${isDark ? "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  style={{ fontWeight: 500 }}
                >
                  <Calendar size={14} />
                  {rangeLabel}
                  <ChevronDown size={13} />
                </button>
                {rangeOpen && (
                  <div className={`absolute right-0 top-12 z-20 w-40 overflow-hidden rounded-xl border shadow-xl ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
                    {rangeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setRange(option.value);
                          setRangeOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                          range === option.value
                            ? isDark
                              ? "bg-indigo-950/40 text-indigo-400"
                              : "bg-indigo-50 text-indigo-600"
                            : isDark
                            ? "text-slate-300 hover:bg-slate-800"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                        style={{ fontWeight: range === option.value ? 600 : 400 }}
                      >
                        {option.label}
                        {range === option.value && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  void loadAnalytics();
                }}
                className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-sm transition-all ${isDark ? "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                style={{ fontWeight: 500 }}
              >
                <RefreshCw size={14} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <Link
                to={data?.tag.profileId ? `/editor?profile=${encodeURIComponent(data.tag.profileId)}` : "/editor"}
                className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 600 }}
              >
                <Edit size={14} />
                <span className="hidden sm:inline">Edit Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
            <StatCard label="Total Taps" value={data.totals.totalTaps} sub="All time" icon={Zap} color="#DC2626" isDark={isDark} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <StatCard label="Unique Visitors" value={data.totals.uniqueVisitors} sub="Distinct scanners" icon={Users} color="#EA580C" isDark={isDark} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <StatCard label="Avg Taps / Day" value={data.totals.avgDaily} sub={`Last ${rangeLabel}`} icon={TrendingUp} color="#FBBF24" isDark={isDark} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <StatCard label="Top Link" value={data.totals.topLink || "No data"} sub="Most clicked" icon={BarChart3} color="#F59E0B" isDark={isDark} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl border p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white shadow-sm"}`}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 700 }}>
                Taps Over Time
              </h3>
              <p className={`mt-0.5 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Total and unique visitors</p>
            </div>
            <div className="flex items-center gap-4">
              {[
                { label: "Total", color: "#DC2626" },
                { label: "Unique", color: "#FBBF24" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                  <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {timelineData.length === 0 ? (
            <p className={`py-10 text-center text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No tap data in this range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={timelineData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="tapGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="uniqueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: textColor, fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Area type="monotone" dataKey="taps" name="Total Taps" stroke="#DC2626" strokeWidth={2.5} fill="url(#tapGrad)" dot={false} activeDot={{ r: 5, fill: "#DC2626" }} />
                <Area type="monotone" dataKey="unique" name="Unique" stroke="#FBBF24" strokeWidth={2} strokeDasharray="4 2" fill="url(#uniqueGrad)" dot={false} activeDot={{ r: 4, fill: "#FBBF24" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className={`rounded-2xl border p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white shadow-sm"}`}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 700 }}>
                  Device Breakdown
                </h3>
                <p className={`mt-0.5 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Operating system of scanners</p>
              </div>
              <Smartphone size={18} className={isDark ? "text-slate-600" : "text-slate-300"} />
            </div>

            {deviceData.length === 0 ? (
              <p className={`py-6 text-center text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No device data yet.</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {deviceData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex-1 space-y-3">
                  {deviceData.map((device) => (
                    <div key={device.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: device.color }} />
                        <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>{device.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ background: isDark ? "#1e293b" : "#f1f5f9" }}>
                          <div className="h-full rounded-full" style={{ width: `${device.value}%`, background: device.color }} />
                        </div>
                        <span className={`w-8 text-right text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>
                          {device.value}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl border p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white shadow-sm"}`}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 700 }}>
                  Taps by Hour
                </h3>
                <p className={`mt-0.5 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>When people scan your tag</p>
              </div>
              <Clock size={18} className={isDark ? "text-slate-600" : "text-slate-300"} />
            </div>

            {hourlyData.length === 0 ? (
              <p className={`py-6 text-center text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No hourly data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={hourlyData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: textColor, fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: textColor, fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: isDark ? "rgba(79,70,229,0.08)" : "rgba(79,70,229,0.05)" }} content={<CustomTooltip isDark={isDark} />} />
                  <Bar dataKey="taps" name="Taps" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={`rounded-2xl border p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white shadow-sm"}`}
          >
            <h3 className={`mb-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
              Top Link Clicks
            </h3>
            <p className={`mb-5 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Which links visitors tap most</p>

            {data.linkClicks.length === 0 ? (
              <p className={`py-6 text-center text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No link click data yet.</p>
            ) : (
              <div className="space-y-4">
                {data.linkClicks.map((item, index) => {
                  const maxClicks = data.linkClicks[0]?.clicks || 1;
                  const pct = Math.max(5, Math.round((item.clicks / maxClicks) * 100));

                  return (
                    <div key={`${item.name}-${index}`}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className={`text-sm ${isDark ? "text-slate-200" : "text-slate-700"}`} style={{ fontWeight: 500 }}>
                          {item.name}
                        </span>
                        <span className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                          {item.clicks.toLocaleString()}
                        </span>
                      </div>
                      <div className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "linear-gradient(90deg, #DC2626, #EA580C)" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: index * 0.08 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`rounded-2xl border p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white shadow-sm"}`}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 700 }}>
                  Top Locations
                </h3>
                <p className={`mt-0.5 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Where your profile is being scanned</p>
              </div>
              <MapPin size={18} className={isDark ? "text-slate-600" : "text-slate-300"} />
            </div>

            {data.locations.length === 0 ? (
              <p className={`py-6 text-center text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No location data yet.</p>
            ) : (
              <div className="space-y-3">
                {data.locations.slice(0, 8).map((location, index) => (
                  <div key={`${location.city}-${index}`} className="flex items-center gap-3">
                    <span className={`w-5 flex-shrink-0 text-right text-sm ${isDark ? "text-slate-600" : "text-slate-300"}`} style={{ fontWeight: 700 }}>
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className={`truncate text-sm ${isDark ? "text-slate-200" : "text-slate-700"}`} style={{ fontWeight: 500 }}>
                          {location.city}
                        </span>
                        <span className={`ml-2 flex-shrink-0 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{location.taps} taps</span>
                      </div>
                      <div className={`h-1.5 overflow-hidden rounded-full ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "linear-gradient(90deg, #DC2626, #EA580C)" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(3, location.pct)}%` }}
                          transition={{ duration: 0.6, delay: index * 0.08 }}
                        />
                      </div>
                    </div>
                    <span className={`w-8 flex-shrink-0 text-right text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{location.pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className={`overflow-hidden rounded-2xl border ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white shadow-sm"}`}
        >
          <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <div>
              <h3 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 700 }}>
                Recent Scans
              </h3>
              <p className={`mt-0.5 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Latest activity on this tag</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400" style={{ fontWeight: 600 }}>
                Live
              </span>
            </div>
          </div>

          <div
            className={`hidden grid-cols-4 gap-4 border-b px-6 py-3 text-xs md:grid ${isDark ? "border-slate-800 bg-slate-900/50 text-slate-500" : "border-slate-100 bg-slate-50 text-slate-400"}`}
            style={{ fontWeight: 600, letterSpacing: "0.04em" }}
          >
            <span>TIME</span>
            <span>DEVICE</span>
            <span>LOCATION</span>
            <span>METHOD</span>
          </div>

          {data.recentScans.length === 0 ? (
            <p className={`px-6 py-8 text-center text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No scans in this range.</p>
          ) : (
            data.recentScans.map((scan, index) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.04 }}
                className={`grid grid-cols-2 gap-4 border-b px-6 py-4 transition-colors last:border-0 md:grid-cols-4 ${isDark ? "border-slate-800 hover:bg-slate-800/40" : "border-slate-100 hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                  <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontWeight: 500 }}>
                    {formatTimeAgo(scan.time)}
                  </span>
                </div>
                <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{scan.device}</span>
                <span className={`hidden text-sm md:inline ${isDark ? "text-slate-400" : "text-slate-500"}`}>{scan.location}</span>
                <div>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs"
                    style={{
                      background: scan.method === "NFC" ? "rgba(79,70,229,0.1)" : "rgba(16,185,129,0.1)",
                      color: scan.method === "NFC" ? "#EA580C" : "#10B981",
                      fontWeight: 600,
                    }}
                  >
                    {scan.method}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
