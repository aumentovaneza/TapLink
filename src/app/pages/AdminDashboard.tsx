import { useState } from "react";
import { Link } from "react-router";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import {
  Users, TrendingUp, Zap, Globe, Search, Filter, MoreHorizontal,
  Download, Eye, Edit, Trash2, CheckSquare, ChevronUp, ChevronDown,
  ArrowUpRight, RefreshCw, Bell, Plus,
  Wifi, Activity, Target, Calendar, Menu
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { AdminSidebar } from "../components/admin/AdminSidebar";

const PROFILE_1 = "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PROFILE_2 = "https://images.unsplash.com/photo-1626784579980-db39c1a13aa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbmVyJTIwd29tYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE2NjI0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PROFILE_3 = "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHByb2Zlc3Npb25hbCUyMHN1aXQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE3NTMwOTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const PROFILE_4 = "https://images.unsplash.com/photo-1758598497635-48cbbb1f6555?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGVudHJlcHJlbmV1ciUyMG1hbiUyMHNtaWxpbmclMjBvZmZpY2V8ZW58MXx8fHwxNzcxNzUzMDkxfDA&ixlib=rb-4.1.0&q=80&w=1080";

const tapData = [
  { date: "Jan 16", taps: 820 },
  { date: "Jan 17", taps: 1240 },
  { date: "Jan 18", taps: 980 },
  { date: "Jan 19", taps: 1600 },
  { date: "Jan 20", taps: 2100 },
  { date: "Jan 21", taps: 1800 },
  { date: "Jan 22", taps: 2400 },
  { date: "Jan 23", taps: 2200 },
  { date: "Jan 24", taps: 3100 },
  { date: "Jan 25", taps: 2750 },
  { date: "Jan 26", taps: 3300 },
  { date: "Jan 27", taps: 2900 },
  { date: "Jan 28", taps: 3600 },
  { date: "Jan 29", taps: 4100 },
  { date: "Jan 30", taps: 3800 },
];

const deviceData = [
  { name: "iOS", value: 54, color: "#4F46E5" },
  { name: "Android", value: 32, color: "#7C3AED" },
  { name: "Other", value: 14, color: "#06B6D4" },
];

const weeklyData = [
  { day: "Mon", taps: 2100 },
  { day: "Tue", taps: 2800 },
  { day: "Wed", taps: 1900 },
  { day: "Thu", taps: 3400 },
  { day: "Fri", taps: 3100 },
  { day: "Sat", taps: 1600 },
  { day: "Sun", taps: 1200 },
];

const profiles = [
  { id: "1", name: "Alex Rivera", title: "Product Designer", template: "Wave", taps: 1847, status: "active", lastActive: "2m ago", photo: PROFILE_1, change: 12 },
  { id: "2", name: "Sarah Chen", title: "UX Researcher", template: "Minimal", taps: 3210, status: "active", lastActive: "5m ago", photo: PROFILE_2, change: 8 },
  { id: "3", name: "Marcus Webb", title: "Tech Lead", template: "Dark Pro", taps: 926, status: "active", lastActive: "1h ago", photo: PROFILE_3, change: -3 },
  { id: "4", name: "Jordan Lee", title: "Founder & CEO", template: "Sunset", taps: 5412, status: "active", lastActive: "3m ago", photo: PROFILE_4, change: 24 },
  { id: "5", name: "Elena Torres", title: "Sales Director", template: "Ocean", taps: 2188, status: "inactive", lastActive: "2d ago", photo: PROFILE_1, change: 0 },
  { id: "6", name: "Priya Nair", title: "Consultant", template: "Forest", taps: 744, status: "active", lastActive: "15m ago", photo: PROFILE_2, change: 5 },
  { id: "7", name: "Kai Nakamura", title: "Creative Director", template: "Noir", taps: 1339, status: "paused", lastActive: "1w ago", photo: PROFILE_3, change: -1 },
];

const stats = [
  {
    title: "Total Profiles",
    value: "50,241",
    change: "+12.4%",
    positive: true,
    icon: Users,
    gradient: "linear-gradient(135deg, #4F46E5, #7C3AED)",
    bg: "rgba(79,70,229,0.08)",
  },
  {
    title: "Active Tags",
    value: "38,109",
    change: "+8.1%",
    positive: true,
    icon: Wifi,
    gradient: "linear-gradient(135deg, #0ea5e9, #2563eb)",
    bg: "rgba(14,165,233,0.08)",
  },
  {
    title: "Taps Today",
    value: "4,128",
    change: "+31.2%",
    positive: true,
    icon: Activity,
    gradient: "linear-gradient(135deg, #10B981, #059669)",
    bg: "rgba(16,185,129,0.08)",
  },
  {
    title: "Conversion Rate",
    value: "23.8%",
    change: "-2.1%",
    positive: false,
    icon: Target,
    gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
    bg: "rgba(245,158,11,0.08)",
  },
];

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500",
  paused: "bg-amber-100 text-amber-700",
};

export function AdminDashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortField, setSortField] = useState<"taps" | "name">("taps");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSort = (field: "taps" | "name") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows((rows) =>
      rows.includes(id) ? rows.filter((r) => r !== id) : [...rows, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows(selectedRows.length === filteredProfiles.length ? [] : filteredProfiles.map((p) => p.id));
  };

  const filteredProfiles = profiles
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortField === "taps") return sortDir === "desc" ? b.taps - a.taps : a.taps - b.taps;
      return sortDir === "desc"
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name);
    });

  const chartColor = isDark ? "#6366F1" : "#4F46E5";
  const gridColor = isDark ? "#1E293B" : "#F1F5F9";
  const axisColor = isDark ? "#475569" : "#94A3B8";

  return (
    <div className={`min-h-screen pt-16 flex ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 lg:ml-56 min-w-0">
        {/* Dashboard Header */}
        <div className={`sticky top-16 z-20 border-b px-4 sm:px-6 lg:px-8 py-4 ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
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
                  Jan 16 – Feb 22, 2026
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
                className={`flex items-center gap-2 h-9 px-3 rounded-lg text-sm transition-colors ${
                  isDark ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-white text-slate-600 border border-slate-200"
                }`}
                style={{ fontWeight: 500 }}
              >
                <RefreshCw size={14} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                className="flex items-center gap-2 h-9 px-3 rounded-lg text-sm text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 600 }}
              >
                <Download size={14} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`p-4 sm:p-5 rounded-2xl border ${
                    isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: stat.bg }}
                    >
                      <Icon size={17} style={{ background: stat.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }} />
                    </div>
                    <span
                      className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full ${
                        stat.positive ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      {stat.positive ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
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

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Area Chart */}
            <div className={`lg:col-span-2 p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>Tap Activity</h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Last 15 days</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-emerald-500">
                  <ArrowUpRight size={14} />
                  <span style={{ fontWeight: 600 }}>+24.3%</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={tapData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="tapGrad" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="taps" stroke={chartColor} strokeWidth={2} fill="url(#tapGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pie + Bar */}
            <div className="space-y-4">
              {/* Device Breakdown */}
              <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                <h3 className={`text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>Device Breakdown</h3>
                <div className="flex items-center gap-4">
                  <PieChart width={80} height={80}>
                    <Pie data={deviceData} cx={35} cy={35} innerRadius={22} outerRadius={38} dataKey="value" strokeWidth={0}>
                      {deviceData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="space-y-1.5">
                    {deviceData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>{d.name}</span>
                        <span className={`text-xs ml-auto ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weekly Taps */}
              <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                <h3 className={`text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>This Week</h3>
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

          {/* Profiles Table */}
          <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
            {/* Table Header */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <div>
                <h3 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>Recent Profiles</h3>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{filteredProfiles.length} profiles</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Bulk actions */}
                {selectedRows.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>{selectedRows.length} selected</span>
                    <button className="text-xs text-rose-500 hover:text-rose-400 transition-colors" style={{ fontWeight: 600 }}>Delete</button>
                    <button className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight: 600 }}>Export</button>
                  </div>
                )}

                {/* Search */}
                <div className={`flex items-center gap-2 h-9 px-3 rounded-xl border flex-1 sm:flex-none sm:w-48 ${
                  isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                }`}>
                  <Search size={13} className={isDark ? "text-slate-400" : "text-slate-400"} />
                  <input
                    type="text"
                    placeholder="Search profiles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`flex-1 text-xs bg-transparent outline-none ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-700 placeholder:text-slate-400"}`}
                  />
                </div>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`h-9 px-3 rounded-xl border text-xs outline-none ${
                    isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>

            {/* Table */}
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
                    <th className={`text-left px-4 py-3 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>Template</th>
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
                    <th className={`text-left px-4 py-3 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>Status</th>
                    <th className={`text-left px-4 py-3 text-xs hidden md:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>Last Active</th>
                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((p, i) => {
                    const isSelected = selectedRows.includes(p.id);
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className={`border-b transition-colors cursor-pointer ${
                          isSelected
                            ? isDark ? "bg-indigo-950/30 border-indigo-900/30" : "bg-indigo-50 border-indigo-100"
                            : isDark ? "border-slate-800 hover:bg-slate-800/50" : "border-slate-100 hover:bg-slate-50"
                        }`}
                        onClick={() => toggleRow(p.id)}
                      >
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(p.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded cursor-pointer accent-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-indigo-100">
                              <ImageWithFallback src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>{p.name}</p>
                              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{p.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-lg ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`} style={{ fontWeight: 500 }}>
                            {p.template}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>{p.taps.toLocaleString()}</span>
                            {p.change !== 0 && (
                              <span className={`text-xs flex items-center gap-0.5 ${p.change > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                {p.change > 0 ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                {Math.abs(p.change)}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${statusColors[p.status]}`} style={{ fontWeight: 600 }}>
                            {p.status}
                          </span>
                        </td>
                        <td className={`px-4 py-3.5 hidden md:table-cell text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{p.lastActive}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <Link
                              to="/profile"
                              onClick={(e) => e.stopPropagation()}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              }`}
                            >
                              <Eye size={13} />
                            </Link>
                            <Link
                              to="/editor"
                              onClick={(e) => e.stopPropagation()}
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

            {/* Table Footer */}
            <div className={`flex items-center justify-between p-4 border-t text-xs ${isDark ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"}`}>
              <span>Showing {filteredProfiles.length} of {profiles.length} profiles</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    className={`w-7 h-7 rounded-lg transition-colors ${
                      page === 1
                        ? "text-white"
                        : isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"
                    }`}
                    style={{
                      background: page === 1 ? "linear-gradient(135deg, #4F46E5, #7C3AED)" : "transparent",
                      fontWeight: page === 1 ? 600 : 400,
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}