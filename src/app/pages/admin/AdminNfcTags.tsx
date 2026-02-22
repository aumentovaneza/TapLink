import { useState } from "react";
import { Link } from "react-router";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import {
  Wifi, Search, Download, Plus, Menu, Copy, ExternalLink,
  Shuffle, PowerOff, Trash2, ChevronUp, ChevronDown,
  CheckCircle2, XCircle, MinusCircle, AlertTriangle,
  Tag, ArrowUpRight,
} from "lucide-react";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";

const P1 = "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";
const P2 = "https://images.unsplash.com/photo-1626784579980-db39c1a13aa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbmVyJTIwd29tYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE2NjI0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080";
const P3 = "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHByb2Zlc3Npb25hbCUyMHN1aXQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE3NTMwOTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const P4 = "https://images.unsplash.com/photo-1758598497635-48cbbb1f6555?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGVudHJlcHJlbmV1ciUyMG1hbiUyMHNtaWxpbmclMjBvZmZpY2V8ZW58MXx8fHwxNzcxNzUzMDkxfDA&ixlib=rb-4.1.0&q=80&w=1080";

type TagStatus = "active" | "unlinked" | "inactive";

interface NFCTag {
  id: string;
  uid: string;
  profile: { name: string; photo: string } | null;
  status: TagStatus;
  assigned: string;
  lastTap: string;
  taps: number;
  firmware: string;
}

const ALL_TAGS: NFCTag[] = [
  { id:"NFC-4821", uid:"04:A3:F2:1B:9E:2C", profile:{ name:"Alex Rivera",    photo:P1 }, status:"active",   assigned:"Jan 10, 2026",  lastTap:"2m ago",  taps:1847, firmware:"v2.1" },
  { id:"NFC-3395", uid:"04:C7:D1:8A:3F:11", profile:{ name:"Sarah Chen",     photo:P2 }, status:"active",   assigned:"Dec 22, 2025",  lastTap:"8m ago",  taps:3210, firmware:"v2.1" },
  { id:"NFC-2210", uid:"04:B5:E9:4C:7D:55", profile:{ name:"Marcus Webb",    photo:P3 }, status:"active",   assigned:"Nov 15, 2025",  lastTap:"1h ago",  taps:926,  firmware:"v2.0" },
  { id:"NFC-9954", uid:"04:F1:A2:0D:5E:88", profile:{ name:"Jordan Lee",     photo:P4 }, status:"active",   assigned:"Oct 3, 2025",   lastTap:"12m ago", taps:5412, firmware:"v2.1" },
  { id:"NFC-5502", uid:"04:82:C3:9B:1A:47", profile:{ name:"Elena Torres",   photo:P1 }, status:"inactive", assigned:"Sep 18, 2025",  lastTap:"2d ago",  taps:2188, firmware:"v2.0" },
  { id:"NFC-8833", uid:"04:D4:E7:3F:6C:29", profile:{ name:"Priya Nair",     photo:P2 }, status:"active",   assigned:"Jan 5, 2026",   lastTap:"20m ago", taps:744,  firmware:"v2.1" },
  { id:"NFC-6644", uid:"04:11:B8:5A:2E:63", profile:{ name:"Kai Nakamura",   photo:P3 }, status:"inactive", assigned:"Aug 22, 2025",  lastTap:"1w ago",  taps:1339, firmware:"v1.9" },
  { id:"NFC-7788", uid:"04:99:C0:7D:4B:15", profile:{ name:"Maya Patel",     photo:P4 }, status:"active",   assigned:"Jan 28, 2026",  lastTap:"3h ago",  taps:423,  firmware:"v2.1" },
  { id:"NFC-1134", uid:"04:55:DA:8C:3E:70", profile:{ name:"The Coffee Lab", photo:P1 }, status:"active",   assigned:"Feb 2, 2026",   lastTap:"30m ago", taps:892,  firmware:"v2.1" },
  { id:"NFC-2287", uid:"04:E6:F3:1B:9A:44", profile:{ name:"Neon Circuit",   photo:P2 }, status:"active",   assigned:"Dec 10, 2025",  lastTap:"1h ago",  taps:2671, firmware:"v2.1" },
  { id:"NFC-3312", uid:"04:7C:89:4D:2F:9B", profile:{ name:"TechSummit 2026",photo:P3 }, status:"active",   assigned:"Jan 20, 2026",  lastTap:"22m ago", taps:4108, firmware:"v2.1" },
  { id:"NFC-4490", uid:"04:A0:B1:5E:8C:36", profile:{ name:"Dev Sharma",     photo:P4 }, status:"inactive", assigned:"Feb 8, 2026",   lastTap:"3d ago",  taps:387,  firmware:"v2.0" },
  { id:"NFC-7703", uid:"04:30:C2:9A:6D:17", profile:null,                                status:"unlinked", assigned:"Jan 18, 2026",  lastTap:"—",       taps:0,    firmware:"v2.1" },
  { id:"NFC-1177", uid:"04:83:D5:0B:3C:52", profile:null,                                status:"unlinked", assigned:"Feb 1, 2026",   lastTap:"—",       taps:0,    firmware:"v2.1" },
  { id:"NFC-3321", uid:"04:F4:E1:7C:9B:28", profile:null,                                status:"unlinked", assigned:"Feb 10, 2026",  lastTap:"—",       taps:0,    firmware:"v2.1" },
  { id:"NFC-4455", uid:"04:62:A3:4D:8E:61", profile:null,                                status:"unlinked", assigned:"Feb 15, 2026",  lastTap:"—",       taps:0,    firmware:"v2.1" },
];

const STATUS_META: Record<TagStatus, { label:string; cls:string; Icon: React.FC<{size:number}> }> = {
  active:   { label:"Active",   cls:"bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
  unlinked: { label:"Unlinked", cls:"bg-amber-100 text-amber-700",     Icon: AlertTriangle },
  inactive: { label:"Inactive", cls:"bg-slate-100 text-slate-500",     Icon: XCircle       },
};

const TABS: Array<{ key: "all" | TagStatus; label: string }> = [
  { key:"all",      label:"All"      },
  { key:"active",   label:"Active"   },
  { key:"unlinked", label:"Unlinked" },
  { key:"inactive", label:"Inactive" },
];

export function AdminNfcTags() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [tab, setTab]                   = useState<"all" | TagStatus>("all");
  const [search, setSearch]             = useState("");
  const [selected, setSelected]         = useState<string[]>([]);
  const [sortField, setSortField]       = useState<"taps"|"id">("taps");
  const [sortDir, setSortDir]           = useState<"asc"|"desc">("desc");
  const [copiedId, setCopiedId]         = useState<string|null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genCount, setGenCount]         = useState("10");
  const [genPrefix, setGenPrefix]       = useState("NFC");

  const card = `rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`;

  const filtered = ALL_TAGS
    .filter(t =>
      (tab === "all" || t.status === tab) &&
      (search === "" || t.id.toLowerCase().includes(search.toLowerCase()) ||
        (t.profile?.name.toLowerCase().includes(search.toLowerCase())))
    )
    .sort((a, b) => {
      if (sortField === "taps") return sortDir === "desc" ? b.taps - a.taps : a.taps - b.taps;
      return sortDir === "desc" ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id);
    });

  const toggleAll = () => setSelected(s => s.length === filtered.length ? [] : filtered.map(t => t.id));
  const toggle    = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`https://taplink.io/tag/${id}`).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const toggleSort = (f: typeof sortField) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("desc"); }
  };

  const counts = {
    all:      ALL_TAGS.length,
    active:   ALL_TAGS.filter(t => t.status === "active").length,
    unlinked: ALL_TAGS.filter(t => t.status === "unlinked").length,
    inactive: ALL_TAGS.filter(t => t.status === "inactive").length,
  };

  const stats = [
    { label:"Total Tags",    value:counts.all,      grad:"linear-gradient(135deg,#4F46E5,#7C3AED)", bg:"rgba(79,70,229,0.08)",    Icon:Tag          },
    { label:"Active",        value:counts.active,   grad:"linear-gradient(135deg,#10B981,#059669)", bg:"rgba(16,185,129,0.08)",   Icon:CheckCircle2 },
    { label:"Unlinked",      value:counts.unlinked, grad:"linear-gradient(135deg,#F59E0B,#D97706)", bg:"rgba(245,158,11,0.08)",   Icon:AlertTriangle },
    { label:"Inactive",      value:counts.inactive, grad:"linear-gradient(135deg,#64748B,#475569)", bg:"rgba(100,116,139,0.08)",  Icon:XCircle       },
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
                <h1 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight:800, letterSpacing:"-0.02em" }}>NFC Tags</h1>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{counts.all} tags issued</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className={`flex items-center gap-2 h-9 px-3 rounded-lg text-sm transition-colors ${isDark ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`} style={{ fontWeight:500 }}>
                <Download size={14} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button onClick={() => setShowGenerate(v => !v)} className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm text-white transition-all hover:opacity-90" style={{ background:"linear-gradient(135deg,#4F46E5,#7C3AED)", fontWeight:600 }}>
                <Plus size={14} />
                <span className="hidden sm:inline">Generate Tags</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s, i) => {
              const Icon = s.Icon;
              return (
                <motion.div key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }} className={`p-4 ${card}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:s.bg }}>
                      <Icon size={17} style={{ background:s.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }} />
                    </div>
                    <ArrowUpRight size={14} className={isDark ? "text-slate-700" : "text-slate-300"} />
                  </div>
                  <div className={isDark ? "text-white" : "text-slate-900"} style={{ fontSize:"1.6rem", fontWeight:800, letterSpacing:"-0.03em" }}>{s.value}</div>
                  <div className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.label}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Generate tags panel */}
          <AnimatePresence>
            {showGenerate && (
              <motion.div initial={{ opacity:0, y:-8, height:0 }} animate={{ opacity:1, y:0, height:"auto" }} exit={{ opacity:0, y:-8, height:0 }} className="overflow-hidden">
                <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-indigo-50 border-indigo-100"}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className={isDark ? "text-white" : "text-indigo-900"} style={{ fontWeight:700 }}>Generate New Tags</h3>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-indigo-600"}`}>New tags will be created as unlinked and ready to assign</p>
                    </div>
                    <button onClick={() => setShowGenerate(false)} className={isDark ? "text-slate-500 hover:text-slate-300" : "text-indigo-400 hover:text-indigo-600"}><XCircle size={16}/></button>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className={`block text-xs mb-1.5 ${isDark ? "text-slate-400" : "text-indigo-700"}`} style={{ fontWeight:600 }}>ID Prefix</label>
                      <input type="text" value={genPrefix} onChange={e => setGenPrefix(e.target.value)} maxLength={6}
                        className={`h-9 w-24 px-3 rounded-xl border text-xs outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-indigo-200 text-slate-800"}`} />
                    </div>
                    <div>
                      <label className={`block text-xs mb-1.5 ${isDark ? "text-slate-400" : "text-indigo-700"}`} style={{ fontWeight:600 }}>Quantity</label>
                      <input type="number" value={genCount} onChange={e => setGenCount(e.target.value)} min="1" max="1000"
                        className={`h-9 w-24 px-3 rounded-xl border text-xs outline-none ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-indigo-200 text-slate-800"}`} />
                    </div>
                    <button onClick={() => setShowGenerate(false)} className="h-9 px-5 rounded-xl text-sm text-white transition-all hover:opacity-90" style={{ background:"linear-gradient(135deg,#4F46E5,#7C3AED)", fontWeight:600 }}>
                      Generate {genCount} Tags
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table card */}
          <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
            {/* Tabs + search toolbar */}
            <div className={`border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              {/* Tabs */}
              <div className="flex items-center gap-0 px-4 pt-3 overflow-x-auto">
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 pb-2.5 text-xs border-b-2 transition-colors whitespace-nowrap ${
                      tab === t.key
                        ? "border-indigo-500 text-indigo-500"
                        : isDark ? "border-transparent text-slate-400 hover:text-slate-200" : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                    style={{ fontWeight: tab === t.key ? 600 : 400 }}>
                    {t.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      tab === t.key ? "bg-indigo-100 text-indigo-600" : isDark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-500"
                    }`} style={{ fontWeight:600 }}>{counts[t.key]}</span>
                  </button>
                ))}
              </div>

              {/* Search + bulk */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {selected.length > 0 && (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${isDark ? "bg-indigo-950/50 border border-indigo-800" : "bg-indigo-50 border border-indigo-200"}`}>
                      <span className={isDark ? "text-indigo-300" : "text-indigo-700"} style={{ fontWeight:600 }}>{selected.length} selected</span>
                      <button className="text-emerald-500" style={{ fontWeight:600 }}>Activate</button>
                      <button className={isDark ? "text-slate-400" : "text-slate-500"} style={{ fontWeight:600 }}>Deactivate</button>
                      <button className="text-rose-500" style={{ fontWeight:600 }}>Delete</button>
                    </motion.div>
                  )}
                </div>
                <div className={`flex items-center gap-2 h-8 px-3 rounded-xl border w-full sm:w-52 ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <Search size={12} className="text-slate-400 shrink-0" />
                  <input type="text" placeholder="Search tag ID or name…" value={search} onChange={e => setSearch(e.target.value)}
                    className={`flex-1 text-xs bg-transparent outline-none ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-700 placeholder:text-slate-400"}`} />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b text-xs ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded accent-indigo-500 cursor-pointer" />
                    </th>
                    <th className={`text-left px-4 py-3 cursor-pointer select-none hover:text-indigo-500 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight:600 }} onClick={() => toggleSort("id")}>
                      <div className="flex items-center gap-1">Tag ID {sortField==="id" && (sortDir==="desc" ? <ChevronDown size={11}/> : <ChevronUp size={11}/>)}</div>
                    </th>
                    <th className={`text-left px-4 py-3 ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight:600 }}>Linked Profile</th>
                    <th className={`text-left px-4 py-3 ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight:600 }}>Status</th>
                    <th className={`text-left px-4 py-3 hidden md:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight:600 }}>Assigned</th>
                    <th className={`text-left px-4 py-3 hidden lg:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight:600 }}>Last Tap</th>
                    <th className={`text-left px-4 py-3 cursor-pointer select-none hover:text-indigo-500 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight:600 }} onClick={() => toggleSort("taps")}>
                      <div className="flex items-center gap-1">Taps {sortField==="taps" && (sortDir==="desc" ? <ChevronDown size={11}/> : <ChevronUp size={11}/>)}</div>
                    </th>
                    <th className={`text-left px-4 py-3 hidden xl:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight:600 }}>Firmware</th>
                    <th className="w-24 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => {
                    const isSelected = selected.includes(t.id);
                    const meta       = STATUS_META[t.status];
                    const StatusIcon = meta.Icon;
                    return (
                      <motion.tr key={t.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.025 }}
                        className={`border-b transition-colors ${isSelected ? (isDark ? "bg-indigo-950/30 border-indigo-900/20" : "bg-indigo-50 border-indigo-100") : (isDark ? "border-slate-800 hover:bg-slate-800/40" : "border-slate-50 hover:bg-slate-50")}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={isSelected} onChange={() => toggle(t.id)} className="rounded accent-indigo-500 cursor-pointer" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                              <Wifi size={13} className={t.status === "active" ? "text-indigo-500" : isDark ? "text-slate-500" : "text-slate-400"} />
                            </div>
                            <span className={`text-xs font-mono ${isDark ? "text-white" : "text-slate-800"}`} style={{ fontWeight:600 }}>{t.id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {t.profile ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                                <ImageWithFallback src={t.profile.photo} alt={t.profile.name} className="w-full h-full object-cover" />
                              </div>
                              <span className={`text-xs ${isDark ? "text-slate-200" : "text-slate-700"}`} style={{ fontWeight:500 }}>{t.profile.name}</span>
                            </div>
                          ) : (
                            <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>— unassigned —</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${meta.cls}`} style={{ fontWeight:600 }}>
                            <StatusIcon size={11} />
                            {meta.label}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-xs hidden md:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t.assigned}</td>
                        <td className={`px-4 py-3 text-xs hidden lg:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t.lastTap}</td>
                        <td className={`px-4 py-3 text-xs ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight:t.taps > 0 ? 600 : 400 }}>
                          {t.taps > 0 ? t.taps.toLocaleString() : <span className={isDark ? "text-slate-600" : "text-slate-300"}>—</span>}
                        </td>
                        <td className={`px-4 py-3 text-xs hidden xl:table-cell font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t.firmware}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => copyLink(t.id)} title="Copy link"
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors relative ${isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}>
                              {copiedId === t.id ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13}/>}
                            </button>
                            {t.profile && (
                              <Link to="/profile" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}>
                                <ExternalLink size={13}/>
                              </Link>
                            )}
                            <button title="Reassign" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}>
                              <Shuffle size={13}/>
                            </button>
                            {t.status === "active" && (
                              <button title="Deactivate" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-amber-900/40 hover:text-amber-400" : "text-slate-400 hover:bg-amber-50 hover:text-amber-600"}`}>
                                <PowerOff size={13}/>
                              </button>
                            )}
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
              <span>Showing {filtered.length} of {ALL_TAGS.length} tags</span>
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
