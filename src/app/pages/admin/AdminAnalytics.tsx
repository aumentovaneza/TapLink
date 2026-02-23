import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  TrendingUp,
  Users,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  Monitor,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { ApiError, apiRequest } from "../../lib/api";
import { clearSession } from "../../lib/session";

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

interface OverviewTemplateItem {
  name: string;
  taps: number;
  profiles: number;
  pct: number;
}

interface OverviewTopProfileItem {
  rank: number;
  name: string;
  taps: number;
}

interface AdminOverviewResponse {
  range: string;
  summary: OverviewSummary;
  timeline: OverviewTimelineItem[];
  devices: OverviewDeviceItem[];
  templates: OverviewTemplateItem[];
  topProfiles: OverviewTopProfileItem[];
}

const RANGE_OPTIONS = ["7d", "14d", "30d", "90d"] as const;

const DEVICE_COLORS: Record<string, string> = {
  iOS: "#DC2626",
  Android: "#EA580C",
  Other: "#FBBF24",
};

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

    const dayIndex = date.getUTCDay();
    const day = dayOrder[(dayIndex + 6) % 7];
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

export function AdminAnalytics() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>("30d");

  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const chartColor = isDark ? "#EA580C" : "#DC2626";
  const chartColor2 = isDark ? "#FBBF24" : "#0EA5E9";
  const gridColor = isDark ? "#1E293B" : "#F1F5F9";
  const axisColor = isDark ? "#475569" : "#94A3B8";
  const card = `p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`;

  const loadOverview = async (nextRange: (typeof RANGE_OPTIONS)[number], silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await apiRequest<AdminOverviewResponse>(`/analytics/admin/overview?range=${nextRange}`, { auth: true });
      setOverview(response);
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
      setError(err instanceof Error ? err.message : "Unable to load analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOverview(range, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const timeline = overview?.timeline ?? [];
  const areaData = useMemo(
    () => timeline.map((item) => ({ date: formatShortDate(item.date), taps: item.taps, visitors: item.visitors })),
    [timeline]
  );
  const weeklyData = useMemo(() => buildWeeklyData(timeline), [timeline]);
  const deviceData = useMemo(
    () =>
      (overview?.devices ?? []).map((device) => ({
        ...device,
        color: DEVICE_COLORS[device.name] ?? "#94A3B8",
      })),
    [overview]
  );

  const topProfiles = overview?.topProfiles ?? [];
  const templates = overview?.templates ?? [];
  const dateRangeLabel = resolveDateRangeLabel(timeline);

  const summary = overview?.summary ?? {
    totalTaps: 0,
    uniqueVisitors: 0,
    avgTapsPerDay: 0,
    totalProfiles: 0,
    activeTags: 0,
  };

  const lastDay = timeline[timeline.length - 1];
  const previousDay = timeline[timeline.length - 2];
  const tapChange = calcPercentDelta(lastDay?.taps ?? 0, previousDay?.taps ?? 0);
  const visitorChange = calcPercentDelta(lastDay?.visitors ?? 0, previousDay?.visitors ?? 0);

  const kpis = [
    {
      label: "Total Taps",
      value: summary.totalTaps.toLocaleString(),
      change: tapChange.value,
      trend: tapChange.trend,
      icon: Activity,
      grad: "linear-gradient(135deg,#DC2626,#EA580C)",
      bg: "rgba(79,70,229,0.08)",
    },
    {
      label: "Unique Visitors",
      value: summary.uniqueVisitors.toLocaleString(),
      change: visitorChange.value,
      trend: visitorChange.trend,
      icon: Users,
      grad: "linear-gradient(135deg,#0EA5E9,#2563EB)",
      bg: "rgba(14,165,233,0.08)",
    },
    {
      label: "Avg Taps / Day",
      value: summary.avgTapsPerDay.toLocaleString(),
      change: "Current",
      trend: "neutral" as Trend,
      icon: TrendingUp,
      grad: "linear-gradient(135deg,#10B981,#059669)",
      bg: "rgba(16,185,129,0.08)",
    },
    {
      label: "Active Tags",
      value: summary.activeTags.toLocaleString(),
      change: `${summary.totalProfiles.toLocaleString()} profiles`,
      trend: "neutral" as Trend,
      icon: Tag,
      grad: "linear-gradient(135deg,#F59E0B,#D97706)",
      bg: "rgba(245,158,11,0.08)",
    },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen pt-16 flex ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 lg:ml-56 p-8">
          <div className={`h-10 w-56 rounded-xl animate-pulse ${isDark ? "bg-slate-900" : "bg-slate-200"}`} />
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
                  Analytics
                </h1>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{dateRangeLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-200"}`}>
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setRange(option)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                      option === range
                        ? "text-white"
                        : isDark
                        ? "text-slate-400 hover:text-white"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                    style={{
                      background: option === range ? "linear-gradient(135deg,#DC2626,#EA580C)" : "transparent",
                      fontWeight: option === range ? 600 : 400,
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button
                onClick={() => void loadOverview(range, true)}
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
            {kpis.map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }} className={card}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: kpi.bg }}>
                      <Icon size={17} style={{ background: kpi.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }} />
                    </div>
                    <span className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full ${trendBadgeClasses(kpi.trend)}`} style={{ fontWeight: 600 }}>
                      {kpi.trend === "up" && <ArrowUpRight size={10} />}
                      {kpi.trend === "down" && <ArrowDownRight size={10} />}
                      {kpi.change}
                    </span>
                  </div>
                  <div className={isDark ? "text-white" : "text-slate-900"} style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                    {kpi.value}
                  </div>
                  <div className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{kpi.label}</div>
                </motion.div>
              );
            })}
          </div>

          <div className={card}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 700 }}>
                  Tap & Visitor Activity
                </h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Last {range}</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded" style={{ background: chartColor, display: "inline-block" }} />
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Taps</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded" style={{ background: chartColor2, display: "inline-block" }} />
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Visitors</span>
                </span>
              </div>
            </div>

            {areaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={areaData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                  <defs>
                    <linearGradient id="adminAnalyticsA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="adminAnalyticsB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor2} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={chartColor2} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(areaData.length / 6)} />
                  <YAxis tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: isDark ? "#1e293b" : "#fff", border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`, borderRadius: "12px", color: isDark ? "#fff" : "#1e293b", fontSize: 12 }} />
                  <Area type="monotone" dataKey="taps" stroke={chartColor} strokeWidth={2} fill="url(#adminAnalyticsA)" />
                  <Area type="monotone" dataKey="visitors" stroke={chartColor2} strokeWidth={2} fill="url(#adminAnalyticsB)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className={`text-sm py-12 text-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>No tap activity for this range.</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={card}>
              <h3 className={`text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                Weekly Distribution
              </h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weeklyData} barSize={10} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="day" tick={{ fill: axisColor, fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: isDark ? "#1e293b" : "#fff", border: "none", borderRadius: "10px", fontSize: 11, color: isDark ? "#fff" : "#1e293b" }} />
                  <Bar dataKey="taps" fill={chartColor} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Derived from {range} timeline data</p>
            </div>

            <div className={card}>
              <div className="flex items-center gap-2 mb-4">
                <Monitor size={15} className={isDark ? "text-slate-400" : "text-slate-500"} />
                <h3 className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                  Device Breakdown
                </h3>
              </div>

              {deviceData.length > 0 ? (
                <div className="flex items-center gap-5">
                  <PieChart width={100} height={100}>
                    <Pie data={deviceData} cx={45} cy={45} innerRadius={28} outerRadius={46} dataKey="value" strokeWidth={0}>
                      {deviceData.map((device, index) => (
                        <Cell key={`${device.name}-${index}`} fill={device.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="space-y-3 flex-1">
                    {deviceData.map((device) => (
                      <div key={device.name} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: device.color }} />
                          <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>{device.name}</span>
                        </div>
                        <span className={`text-xs ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                          {device.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className={`text-sm py-8 ${isDark ? "text-slate-500" : "text-slate-400"}`}>No device analytics yet.</p>
              )}
            </div>

            <div className={card}>
              <h3 className={`text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                Top Profiles by Taps
              </h3>
              {topProfiles.length > 0 ? (
                <div className="space-y-3">
                  {topProfiles.slice(0, 6).map((profile, index) => {
                    const maxTaps = topProfiles[0]?.taps || 1;
                    const width = Math.max(10, Math.round((profile.taps / maxTaps) * 100));
                    return (
                      <div key={`${profile.name}-${profile.rank}`} className="flex items-center gap-3">
                        <span className={`text-xs w-4 text-center ${isDark ? "text-slate-500" : "text-slate-400"}`} style={{ fontWeight: 700 }}>
                          #{profile.rank}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs truncate ${isDark ? "text-slate-200" : "text-slate-800"}`} style={{ fontWeight: 600 }}>
                              {profile.name}
                            </span>
                            <span className={`text-xs ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                              {profile.taps.toLocaleString()}
                            </span>
                          </div>
                          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: "linear-gradient(90deg,#DC2626,#EA580C)", opacity: 1 - index * 0.1 }}
                              initial={{ width: 0 }}
                              animate={{ width: `${width}%` }}
                              transition={{ duration: 0.7, delay: 0.08 * index }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={`text-sm py-8 ${isDark ? "text-slate-500" : "text-slate-400"}`}>No top profile data yet.</p>
              )}
            </div>
          </div>

          <div className={card}>
            <h3 className={`text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
              Template Performance
            </h3>
            <div className={`rounded-xl overflow-hidden border ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <table className="w-full text-xs">
                <thead>
                  <tr className={`${isDark ? "bg-slate-800/60 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                    <th className="text-left px-3 py-2" style={{ fontWeight: 600 }}>
                      Template
                    </th>
                    <th className="text-right px-3 py-2" style={{ fontWeight: 600 }}>
                      Profiles
                    </th>
                    <th className="text-right px-3 py-2" style={{ fontWeight: 600 }}>
                      Total Taps
                    </th>
                    <th className="text-right px-3 py-2" style={{ fontWeight: 600 }}>
                      Avg Taps
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {templates.length === 0 && (
                    <tr>
                      <td colSpan={4} className={`px-3 py-5 text-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        No template metrics available.
                      </td>
                    </tr>
                  )}
                  {templates.map((template, index) => (
                    <tr
                      key={`${template.name}-${index}`}
                      className={`border-t ${isDark ? "border-slate-800 hover:bg-slate-800/40" : "border-slate-100 hover:bg-slate-50"} transition-colors`}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-5 rounded-full" style={{ background: "linear-gradient(180deg,#DC2626,#EA580C)", opacity: 1 - index * 0.12 }} />
                          <span className={isDark ? "text-slate-200" : "text-slate-800"} style={{ fontWeight: 500 }}>
                            {template.name}
                          </span>
                        </div>
                      </td>
                      <td className={`text-right px-3 py-2.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{template.profiles}</td>
                      <td className={`text-right px-3 py-2.5 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>
                        {template.taps.toLocaleString()}
                      </td>
                      <td className={`text-right px-3 py-2.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {(template.profiles > 0 ? Math.round(template.taps / template.profiles) : 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
