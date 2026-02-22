import { useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Activity, TrendingUp, Users, Target, ArrowUpRight,
  ArrowDownRight, Menu, Globe, Smartphone, Monitor,
} from "lucide-react";
import { AdminSidebar } from "../../components/admin/AdminSidebar";

// ── Mock data ──────────────────────────────────────────────────────────────────
const DAILY_30: { date: string; taps: number; visitors: number }[] = [
  { date:"Jan 24", taps:1520, visitors:940  },
  { date:"Jan 25", taps:1840, visitors:1120 },
  { date:"Jan 26", taps:1680, visitors:1010 },
  { date:"Jan 27", taps:2100, visitors:1300 },
  { date:"Jan 28", taps:1950, visitors:1180 },
  { date:"Jan 29", taps:1400, visitors:870  },
  { date:"Jan 30", taps:1200, visitors:740  },
  { date:"Jan 31", taps:2380, visitors:1440 },
  { date:"Feb 1",  taps:2640, visitors:1600 },
  { date:"Feb 2",  taps:2420, visitors:1480 },
  { date:"Feb 3",  taps:2900, visitors:1770 },
  { date:"Feb 4",  taps:3100, visitors:1880 },
  { date:"Feb 5",  taps:2700, visitors:1640 },
  { date:"Feb 6",  taps:2200, visitors:1340 },
  { date:"Feb 7",  taps:3350, visitors:2040 },
  { date:"Feb 8",  taps:3600, visitors:2180 },
  { date:"Feb 9",  taps:3420, visitors:2080 },
  { date:"Feb 10", taps:3800, visitors:2310 },
  { date:"Feb 11", taps:4100, visitors:2490 },
  { date:"Feb 12", taps:3750, visitors:2280 },
  { date:"Feb 13", taps:3100, visitors:1890 },
  { date:"Feb 14", taps:4400, visitors:2670 },
  { date:"Feb 15", taps:4820, visitors:2930 },
  { date:"Feb 16", taps:4560, visitors:2770 },
  { date:"Feb 17", taps:5100, visitors:3100 },
  { date:"Feb 18", taps:5380, visitors:3270 },
  { date:"Feb 19", taps:4900, visitors:2980 },
  { date:"Feb 20", taps:4200, visitors:2560 },
  { date:"Feb 21", taps:5620, visitors:3420 },
  { date:"Feb 22", taps:4128, visitors:2510 },
];

const DAILY_7  = DAILY_30.slice(-7);
const DAILY_14 = DAILY_30.slice(-14);
const DAILY_90 = DAILY_30; // same data but labelled as 90d for demo

const HOURLY = [
  { h:"0",  v:18 }, { h:"1",  v:11 }, { h:"2",  v:8  }, { h:"3",  v:6  },
  { h:"4",  v:9  }, { h:"5",  v:22 }, { h:"6",  v:48 }, { h:"7",  v:92 },
  { h:"8",  v:210 }, { h:"9",  v:310 }, { h:"10", v:380 }, { h:"11", v:420 },
  { h:"12", v:390 }, { h:"13", v:430 }, { h:"14", v:465 }, { h:"15", v:480 },
  { h:"16", v:510 }, { h:"17", v:540 }, { h:"18", v:590 }, { h:"19", v:620 },
  { h:"20", v:560 }, { h:"21", v:440 }, { h:"22", v:280 }, { h:"23", v:140 },
];

const DEVICES = [
  { name:"iOS",     value:54, color:"#4F46E5" },
  { name:"Android", value:32, color:"#7C3AED" },
  { name:"Other",   value:14, color:"#06B6D4" },
];

const COUNTRIES = [
  { country:"United States", pct:42, taps:24180 },
  { country:"United Kingdom",pct:18, taps:10362 },
  { country:"Canada",        pct:12, taps:6908  },
  { country:"Australia",     pct:8,  taps:4605  },
  { country:"Germany",       pct:6,  taps:3454  },
  { country:"Others",        pct:14, taps:8058  },
];

const TOP_PROFILES = [
  { name:"TechSummit 2026", taps:4108, change:67 },
  { name:"Jordan Lee",      taps:3210, change:24 },
  { name:"Neon Circuit",    taps:2671, change:42 },
  { name:"Elena Torres",    taps:2188, change:0  },
  { name:"Alex Rivera",     taps:1847, change:12 },
];

const TEMPLATES = [
  { name:"Individual", taps:15847, profiles:38, pct:100 },
  { name:"Business",   taps:7234,  profiles:14, pct:46  },
  { name:"Event",      taps:4108,  profiles:5,  pct:26  },
  { name:"Musician",   taps:2671,  profiles:8,  pct:17  },
  { name:"Café",       taps:892,   profiles:3,  pct:6   },
  { name:"Pet",        taps:423,   profiles:7,  pct:3   },
];

const RANGE_OPTIONS = [
  { label:"7d",  data: DAILY_7  },
  { label:"14d", data: DAILY_14 },
  { label:"30d", data: DAILY_30 },
  { label:"90d", data: DAILY_90 },
];

export function AdminAnalytics() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rangeIdx, setRangeIdx]       = useState(2); // default 30d

  const chartData   = RANGE_OPTIONS[rangeIdx].data;
  const chartColor  = isDark ? "#6366F1" : "#4F46E5";
  const chartColor2 = isDark ? "#06B6D4" : "#0EA5E9";
  const gridColor   = isDark ? "#1E293B" : "#F1F5F9";
  const axisColor   = isDark ? "#475569" : "#94A3B8";
  const card        = `p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`;

  const totalTaps  = chartData.reduce((s, d) => s + d.taps, 0);
  const totalVisit = chartData.reduce((s, d) => s + d.visitors, 0);

  const kpis = [
    { label:"Total Taps",      value: totalTaps.toLocaleString(),   change:"+24.3%", up:true,  icon:Activity, grad:"linear-gradient(135deg,#4F46E5,#7C3AED)", bg:"rgba(79,70,229,0.08)"  },
    { label:"Unique Visitors", value: totalVisit.toLocaleString(),  change:"+18.7%", up:true,  icon:Users,    grad:"linear-gradient(135deg,#0EA5E9,#2563EB)", bg:"rgba(14,165,233,0.08)" },
    { label:"Avg Taps/Day",    value: Math.round(totalTaps/chartData.length).toLocaleString(), change:"+9.1%", up:true, icon:TrendingUp, grad:"linear-gradient(135deg,#10B981,#059669)", bg:"rgba(16,185,129,0.08)" },
    { label:"Conversion Rate", value:"23.8%",                       change:"-2.1%",  up:false, icon:Target,   grad:"linear-gradient(135deg,#F59E0B,#D97706)", bg:"rgba(245,158,11,0.08)" },
  ];

  return (
    <div className={`min-h-screen pt-16 flex ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-56 min-w-0">
        {/* Header */}
        <div className={`sticky top-16 z-20 border-b px-4 sm:px-6 lg:px-8 py-4 ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className={`lg:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-200"}`}>
                <Menu size={18} />
              </button>
              <div>
                <h1 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight:800, letterSpacing:"-0.02em" }}>Analytics</h1>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Platform-wide performance metrics</p>
              </div>
            </div>
            {/* Range selector */}
            <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-200"}`}>
              {RANGE_OPTIONS.map((r, i) => (
                <button key={r.label} onClick={() => setRangeIdx(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${i === rangeIdx ? "text-white" : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
                  style={{ background: i === rangeIdx ? "linear-gradient(135deg,#4F46E5,#7C3AED)" : "transparent", fontWeight: i === rangeIdx ? 600 : 400 }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-5">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((k, i) => {
              const Icon = k.icon;
              return (
                <motion.div key={k.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }} className={card}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:k.bg }}>
                      <Icon size={17} style={{ background:k.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }} />
                    </div>
                    <span className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full ${k.up ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`} style={{ fontWeight:600 }}>
                      {k.up ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}{k.change}
                    </span>
                  </div>
                  <div className={isDark ? "text-white" : "text-slate-900"} style={{ fontSize:"1.5rem", fontWeight:800, letterSpacing:"-0.03em" }}>{k.value}</div>
                  <div className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{k.label}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Main area chart */}
          <div className={card}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight:700 }}>Tap & Visitor Activity</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Last {RANGE_OPTIONS[rangeIdx].label}</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{ background:chartColor, display:"inline-block" }} /><span className={isDark ? "text-slate-400" : "text-slate-500"}>Taps</span></span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{ background:chartColor2, display:"inline-block" }} /><span className={isDark ? "text-slate-400" : "text-slate-500"}>Visitors</span></span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top:5, right:5, bottom:0, left:-15 }}>
                <defs>
                  <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColor}  stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={chartColor}  stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColor2} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={chartColor2} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fill:axisColor, fontSize:10 }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length/6)} />
                <YAxis tick={{ fill:axisColor, fontSize:10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: isDark ? "#1e293b" : "#fff", border:`1px solid ${isDark ? "#334155" : "#E2E8F0"}`, borderRadius:"12px", color: isDark ? "#fff" : "#1e293b", fontSize:12 }} />
                <Area type="monotone" dataKey="taps"     stroke={chartColor}  strokeWidth={2} fill="url(#ag1)" />
                <Area type="monotone" dataKey="visitors" stroke={chartColor2} strokeWidth={2} fill="url(#ag2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Row: hourly + device + countries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Hourly */}
            <div className={`lg:col-span-1 ${card}`}>
              <h3 className={`text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight:700 }}>Hourly Distribution</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={HOURLY} barSize={6} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                  <XAxis dataKey="h" tick={{ fill:axisColor, fontSize:9 }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: isDark ? "#1e293b" : "#fff", border:"none", borderRadius:"10px", fontSize:11, color: isDark ? "#fff" : "#1e293b" }} />
                  <Bar dataKey="v" fill={chartColor} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Peak hours: 6 PM – 9 PM</p>
            </div>

            {/* Device split */}
            <div className={card}>
              <h3 className={`text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight:700 }}>Device Breakdown</h3>
              <div className="flex items-center gap-5">
                <PieChart width={100} height={100}>
                  <Pie data={DEVICES} cx={45} cy={45} innerRadius={28} outerRadius={46} dataKey="value" strokeWidth={0}>
                    {DEVICES.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
                <div className="space-y-3 flex-1">
                  {DEVICES.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background:d.color }} />
                        <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>{d.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-1.5 rounded-full`} style={{ width:`${d.value * 0.6}px`, background:d.color, opacity:0.4 }} />
                        <span className={`text-xs ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight:700 }}>{d.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Countries */}
            <div className={card}>
              <div className="flex items-center gap-2 mb-4">
                <Globe size={15} className={isDark ? "text-slate-400" : "text-slate-500"} />
                <h3 className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight:700 }}>Top Countries</h3>
              </div>
              <div className="space-y-2.5">
                {COUNTRIES.map(c => (
                  <div key={c.country}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`} style={{ fontWeight:500 }}>{c.country}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{c.taps.toLocaleString()}</span>
                        <span className={`text-xs ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight:700 }}>{c.pct}%</span>
                      </div>
                    </div>
                    <div className={`h-1 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                      <motion.div className="h-full rounded-full" style={{ background:"linear-gradient(90deg,#4F46E5,#7C3AED)" }}
                        initial={{ width:0 }} animate={{ width:`${c.pct}%` }} transition={{ duration:0.8, delay:0.2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row: top profiles + template performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top profiles */}
            <div className={card}>
              <h3 className={`text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight:700 }}>Top Profiles by Taps</h3>
              <div className="space-y-3">
                {TOP_PROFILES.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className={`text-xs w-4 text-center ${isDark ? "text-slate-500" : "text-slate-400"}`} style={{ fontWeight:700 }}>#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs truncate ${isDark ? "text-slate-200" : "text-slate-800"}`} style={{ fontWeight:600 }}>{p.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-xs ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight:700 }}>{p.taps.toLocaleString()}</span>
                          {p.change > 0 && <span className="text-xs text-emerald-500 flex items-center gap-0.5"><ArrowUpRight size={10}/>{p.change}%</span>}
                        </div>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                        <motion.div className="h-full rounded-full" style={{ background:`linear-gradient(90deg,#4F46E5,#7C3AED)`, opacity: 1 - i * 0.15 }}
                          initial={{ width:0 }} animate={{ width:`${(p.taps/4108)*100}%` }} transition={{ duration:0.9, delay:0.1*i }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Template performance */}
            <div className={card}>
              <h3 className={`text-sm mb-4 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight:700 }}>Template Performance</h3>
              <div className={`rounded-xl overflow-hidden border ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`${isDark ? "bg-slate-800/60 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                      <th className="text-left px-3 py-2" style={{ fontWeight:600 }}>Template</th>
                      <th className="text-right px-3 py-2" style={{ fontWeight:600 }}>Profiles</th>
                      <th className="text-right px-3 py-2" style={{ fontWeight:600 }}>Total Taps</th>
                      <th className="text-right px-3 py-2" style={{ fontWeight:600 }}>Avg Taps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TEMPLATES.map((t, i) => (
                      <tr key={t.name} className={`border-t ${isDark ? "border-slate-800 hover:bg-slate-800/40" : "border-slate-100 hover:bg-slate-50"} transition-colors`}>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-5 rounded-full" style={{ background:`linear-gradient(180deg,#4F46E5,#7C3AED)`, opacity: 1 - i*0.12 }} />
                            <span className={isDark ? "text-slate-200" : "text-slate-800"} style={{ fontWeight:500 }}>{t.name}</span>
                          </div>
                        </td>
                        <td className={`text-right px-3 py-2.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{t.profiles}</td>
                        <td className={`text-right px-3 py-2.5 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight:600 }}>{t.taps.toLocaleString()}</td>
                        <td className={`text-right px-3 py-2.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{Math.round(t.taps/t.profiles).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
