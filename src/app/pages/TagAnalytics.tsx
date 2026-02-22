import { useState } from "react";
import { Link, useParams } from "react-router";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  ArrowLeft, Zap, TrendingUp, Users, Clock, Download,
  Globe, Linkedin, Instagram, Mail, Phone, QrCode,
  Calendar, MapPin, Smartphone, ChevronDown, ExternalLink,
  BarChart3, RefreshCw, Share2, Edit, User, PawPrint,
  Coffee, Building2, Music
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { StatCardSkeleton, ChartSkeleton } from "../components/shared/LoadingSkeleton";

const PHOTO_1 = "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";

// ─── Mock data ─────────────────────────────────────────────────────────────────
const tapTimelineData = [
  { date: "Feb 8",  taps: 42,  unique: 38 },
  { date: "Feb 9",  taps: 67,  unique: 55 },
  { date: "Feb 10", taps: 51,  unique: 43 },
  { date: "Feb 11", taps: 88,  unique: 72 },
  { date: "Feb 12", taps: 124, unique: 98 },
  { date: "Feb 13", taps: 103, unique: 87 },
  { date: "Feb 14", taps: 141, unique: 115 },
  { date: "Feb 15", taps: 98,  unique: 80 },
  { date: "Feb 16", taps: 156, unique: 128 },
  { date: "Feb 17", taps: 134, unique: 107 },
  { date: "Feb 18", taps: 178, unique: 142 },
  { date: "Feb 19", taps: 165, unique: 130 },
  { date: "Feb 20", taps: 210, unique: 167 },
  { date: "Feb 21", taps: 193, unique: 154 },
];

const hourlyData = [
  { hour: "12am", taps: 4 },  { hour: "2am",  taps: 2 },  { hour: "4am",  taps: 1 },
  { hour: "6am",  taps: 8 },  { hour: "8am",  taps: 34 }, { hour: "10am", taps: 72 },
  { hour: "12pm", taps: 98 }, { hour: "2pm",  taps: 85 }, { hour: "4pm",  taps: 110 },
  { hour: "6pm",  taps: 92 }, { hour: "8pm",  taps: 68 }, { hour: "10pm", taps: 22 },
];

const deviceData = [
  { name: "iOS",     value: 58, color: "#4F46E5" },
  { name: "Android", value: 29, color: "#7C3AED" },
  { name: "Other",   value: 13, color: "#06B6D4" },
];

const locationData = [
  { city: "San Francisco, CA", taps: 624, pct: 34 },
  { city: "New York, NY",      taps: 386, pct: 21 },
  { city: "Los Angeles, CA",   taps: 257, pct: 14 },
  { city: "Chicago, IL",       taps: 184, pct: 10 },
  { city: "Austin, TX",        taps: 148, pct: 8 },
  { city: "Other",             taps: 248, pct: 13 },
];

const linkClickData = [
  { name: "LinkedIn Profile", clicks: 624, icon: Linkedin, color: "#0077B5" },
  { name: "Portfolio Website", clicks: 498, icon: Globe, color: "#4F46E5" },
  { name: "Instagram",        clicks: 312, icon: Instagram, color: "#E1306C" },
  { name: "Email Me",         clicks: 287, icon: Mail, color: "#EA4335" },
  { name: "GitHub",           clicks: 126, icon: Phone, color: "#333" },
];

const recentScans = [
  { id: "1", time: "2 min ago",  device: "iPhone 15 Pro", location: "San Francisco, CA", method: "NFC" },
  { id: "2", time: "8 min ago",  device: "Pixel 8",       location: "San Francisco, CA", method: "NFC" },
  { id: "3", time: "15 min ago", device: "iPhone 14",     location: "Oakland, CA",        method: "QR" },
  { id: "4", time: "34 min ago", device: "Samsung S24",   location: "Palo Alto, CA",      method: "NFC" },
  { id: "5", time: "1 hr ago",   device: "iPhone 13",     location: "San Jose, CA",       method: "NFC" },
  { id: "6", time: "2 hrs ago",  device: "OnePlus 12",    location: "Berkeley, CA",       method: "QR" },
];

const tagData = {
  id: "1",
  name: "Alex Rivera",
  tagCode: "TL-001",
  templateType: "individual",
  theme: "wave",
  gradient: "linear-gradient(135deg, #4F46E5, #7C3AED, #06B6D4)",
  photo: PHOTO_1,
  totalTaps: 1847,
  uniqueVisitors: 1423,
  avgDaily: 132,
  topLink: "LinkedIn",
  tapChange: 12,
  status: "active",
  createdAt: "Jan 15, 2026",
};

const dateRanges = ["7 days", "14 days", "30 days", "90 days", "All time"];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, isDark }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; isDark: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`px-4 py-3 rounded-xl shadow-xl border text-sm ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
      <p className={`mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 500 }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className={isDark ? "text-slate-300" : "text-slate-600"}>{p.name}</span>
          </div>
          <span className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, change, isDark }: {
  label: string; value: string | number; sub: string; icon: typeof Zap; color: string; change?: number; isDark: boolean;
}) {
  return (
    <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
      <div className="flex items-start justify-between mb-4">
        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 500 }}>{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <p className={`mb-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800, fontSize: "1.65rem", letterSpacing: "-0.03em" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <div className="flex items-center gap-2">
        <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{sub}</p>
        {change !== undefined && change !== 0 && (
          <span className={`text-xs ${change > 0 ? "text-emerald-500" : "text-rose-400"}`} style={{ fontWeight: 600 }}>
            {change > 0 ? "↑" : "↓"}{Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function TagAnalytics() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { tagId } = useParams();
  const [dateRange, setDateRange] = useState("14 days");
  const [rangeOpen, setRangeOpen] = useState(false);

  const bgChart    = isDark ? "#1e293b" : "#f8fafc";
  const gridColor  = isDark ? "#1e293b" : "#f1f5f9";
  const textColor  = isDark ? "#64748B" : "#94A3B8";

  return (
    <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <Link to="/my-tags"
                className={`flex items-center gap-1.5 text-sm mt-1 ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"} transition-colors`}>
                <ArrowLeft size={15} />
                <span className="hidden sm:inline">My Tags</span>
              </Link>

              <div className="flex items-start gap-4">
                {/* Profile avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg" style={{ border: "3px solid transparent", background: `${tagData.gradient} border-box` }}>
                    <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ border: "2px solid", borderImage: tagData.gradient }}>
                      <ImageWithFallback src={tagData.photo} alt={tagData.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>{tagData.name}</h1>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-emerald-950/40 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`} style={{ fontWeight: 600 }}>
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-xs flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      <User size={10} className="text-indigo-400" />Individual
                    </span>
                    <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>·</span>
                    <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{tagData.tagCode}</span>
                    <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>·</span>
                    <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Since {tagData.createdAt}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Date range picker */}
              <div className="relative">
                <button onClick={() => setRangeOpen(!rangeOpen)}
                  className={`flex items-center gap-2 h-10 px-4 rounded-xl text-sm border transition-all ${isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  style={{ fontWeight: 500 }}>
                  <Calendar size={14} />
                  {dateRange}
                  <ChevronDown size={13} />
                </button>
                {rangeOpen && (
                  <div className={`absolute right-0 top-12 z-20 w-40 rounded-xl shadow-xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
                    {dateRanges.map((r) => (
                      <button key={r} onClick={() => { setDateRange(r); setRangeOpen(false); }}
                        className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors ${
                          dateRange === r
                            ? isDark ? "text-indigo-400 bg-indigo-950/40" : "text-indigo-600 bg-indigo-50"
                            : isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"
                        }`}
                        style={{ fontWeight: dateRange === r ? 600 : 400 }}>
                        {r}
                        {dateRange === r && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className={`flex items-center gap-2 h-10 px-4 rounded-xl text-sm border transition-all ${isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                style={{ fontWeight: 500 }}>
                <Download size={14} />
                <span className="hidden sm:inline">Export</span>
              </button>

              <Link to="/editor"
                className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 600 }}>
                <Edit size={14} />
                <span className="hidden sm:inline">Edit Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Taps",      value: tagData.totalTaps,    sub: "All time",       icon: Zap,      color: "#4F46E5", change: tagData.tapChange },
            { label: "Unique Visitors", value: tagData.uniqueVisitors, sub: "Distinct scanners", icon: Users,    color: "#7C3AED", change: 9 },
            { label: "Avg Taps / Day",  value: tagData.avgDaily,     sub: `Last ${dateRange}`, icon: TrendingUp, color: "#06B6D4", change: 5 },
            { label: "Top Link",        value: tagData.topLink,      sub: "Most clicked",   icon: BarChart3, color: "#F59E0B" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <StatCard {...card} isDark={isDark} />
            </motion.div>
          ))}
        </div>

        {/* ── Taps Over Time ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>Taps Over Time</h3>
              <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Total and unique visitors — last {dateRange}</p>
            </div>
            <div className="flex items-center gap-4">
              {[{ label: "Total Taps", color: "#4F46E5" }, { label: "Unique", color: "#06B6D4" }].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={tapTimelineData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="tapGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="uniqueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: textColor, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
              <Area type="monotone" dataKey="taps" name="Total Taps" stroke="#4F46E5" strokeWidth={2.5} fill="url(#tapGrad)" dot={false} activeDot={{ r: 5, fill: "#4F46E5" }} />
              <Area type="monotone" dataKey="unique" name="Unique" stroke="#06B6D4" strokeWidth={2} strokeDasharray="4 2" fill="url(#uniqueGrad)" dot={false} activeDot={{ r: 4, fill: "#06B6D4" }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ── Device + Hourly ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>Device Breakdown</h3>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Operating system of scanners</p>
              </div>
              <Smartphone size={18} className={isDark ? "text-slate-600" : "text-slate-300"} />
            </div>
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
                {deviceData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "#1e293b" : "#f1f5f9" }}>
                        <div className="h-full rounded-full" style={{ width: `${d.value}%`, background: d.color }} />
                      </div>
                      <span className={`text-sm w-8 text-right ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>{d.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Taps by Hour */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>Taps by Hour</h3>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>When people scan your tag</p>
              </div>
              <Clock size={18} className={isDark ? "text-slate-600" : "text-slate-300"} />
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={hourlyData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: textColor, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: textColor, fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: isDark ? "rgba(79,70,229,0.08)" : "rgba(79,70,229,0.05)" }}
                  content={<CustomTooltip isDark={isDark} />}
                />
                <Bar dataKey="taps" name="Taps" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* ── Top Links + Locations ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Link Clicks */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
            <h3 className={`mb-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>Top Link Clicks</h3>
            <p className={`text-xs mb-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Which links visitors tap most</p>
            <div className="space-y-4">
              {linkClickData.map((link, i) => {
                const Icon = link.icon;
                const maxClicks = linkClickData[0].clicks;
                const pct = (link.clicks / maxClicks) * 100;
                return (
                  <div key={link.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${link.color}15` }}>
                          <Icon size={12} style={{ color: link.color }} />
                        </div>
                        <span className={`text-sm ${isDark ? "text-slate-200" : "text-slate-700"}`} style={{ fontWeight: 500 }}>{link.name}</span>
                      </div>
                      <span className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>{link.clicks.toLocaleString()}</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: link.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Top Locations */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>Top Locations</h3>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Where your profile is being scanned</p>
              </div>
              <MapPin size={18} className={isDark ? "text-slate-600" : "text-slate-300"} />
            </div>
            <div className="space-y-3">
              {locationData.map((loc, i) => (
                <div key={loc.city} className="flex items-center gap-3">
                  <span className={`text-sm w-5 text-right flex-shrink-0 ${isDark ? "text-slate-600" : "text-slate-300"}`} style={{ fontWeight: 700 }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm truncate ${isDark ? "text-slate-200" : "text-slate-700"}`} style={{ fontWeight: 500 }}>{loc.city}</span>
                      <span className={`text-xs flex-shrink-0 ml-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{loc.taps} taps</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, #4F46E5, #7C3AED)` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${loc.pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <span className={`text-xs w-8 text-right flex-shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{loc.pct}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Recent Scans ───────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
          <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <div>
              <h3 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>Recent Scans</h3>
              <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Live feed of the latest taps on your tag</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs" style={{ fontWeight: 600 }}>Live</span>
            </div>
          </div>

          {/* Table header */}
          <div className={`hidden md:grid grid-cols-4 gap-4 px-6 py-3 border-b text-xs ${isDark ? "border-slate-800 bg-slate-900/50 text-slate-500" : "border-slate-100 bg-slate-50 text-slate-400"}`}
            style={{ fontWeight: 600, letterSpacing: "0.04em" }}>
            <span>TIME</span>
            <span>DEVICE</span>
            <span>LOCATION</span>
            <span>METHOD</span>
          </div>

          {recentScans.map((scan, i) => (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + i * 0.05 }}
              className={`grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4 border-b last:border-0 transition-colors ${isDark ? "border-slate-800 hover:bg-slate-800/40" : "border-slate-100 hover:bg-slate-50"}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontWeight: 500 }}>{scan.time}</span>
              </div>
              <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{scan.device}</span>
              <div className="hidden md:flex items-center gap-1.5">
                <MapPin size={11} className={isDark ? "text-slate-600" : "text-slate-400"} />
                <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{scan.location}</span>
              </div>
              <div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full`}
                  style={{
                    background: scan.method === "NFC" ? "rgba(79,70,229,0.1)" : "rgba(16,185,129,0.1)",
                    color: scan.method === "NFC" ? "#6366F1" : "#10B981",
                    fontWeight: 600,
                  }}
                >
                  {scan.method === "NFC" ? "📡 NFC" : "📷 QR"}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
