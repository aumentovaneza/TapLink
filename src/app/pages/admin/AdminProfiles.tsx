import { useState } from "react";
import { Link } from "react-router";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Search, Download, Eye, Edit, Trash2,
  ChevronUp, ChevronDown, Plus, Menu, X,
  UserCheck, UserX, PauseCircle, Wifi, Filter,
  ArrowUpRight, MoreHorizontal,
} from "lucide-react";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";

const P1 = "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";
const P2 = "https://images.unsplash.com/photo-1626784579980-db39c1a13aa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbmVyJTIwd29tYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE2NjI0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080";
const P3 = "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHByb2Zlc3Npb25hbCUyMHN1aXQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE3NTMwOTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const P4 = "https://images.unsplash.com/photo-1758598497635-48cbbb1f6555?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGVudHJlcHJlbmV1ciUyMG1hbiUyMHNtaWxpbmclMjBvZmZpY2V8ZW58MXx8fHwxNzcxNzUzMDkxfDA&ixlib=rb-4.1.0&q=80&w=1080";

const TYPE_COLORS: Record<string, string> = {
  Individual: "bg-indigo-100 text-indigo-700",
  Business:   "bg-blue-100 text-blue-700",
  Pet:        "bg-amber-100 text-amber-700",
  Café:       "bg-orange-100 text-orange-700",
  Event:      "bg-violet-100 text-violet-700",
  Musician:   "bg-pink-100 text-pink-700",
};

const STATUS_COLORS: Record<string, string> = {
  active:   "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500",
  paused:   "bg-amber-100 text-amber-700",
};

const ALL_PROFILES = [
  { id:"1",  name:"Alex Rivera",    email:"alex.rivera@email.com",   title:"Product Designer",   type:"Individual", template:"Wave",    theme:"Sunset",  tagId:"NFC-4821", taps:1847, status:"active",   created:"Jan 10, 2026", lastActive:"2m ago",  photo:P1, change:12  },
  { id:"2",  name:"Sarah Chen",     email:"s.chen@designlab.io",     title:"UX Researcher",      type:"Individual", template:"Minimal", theme:"Ocean",   tagId:"NFC-3395", taps:3210, status:"active",   created:"Dec 22, 2025", lastActive:"5m ago",  photo:P2, change:8   },
  { id:"3",  name:"Marcus Webb",    email:"marcus@techcorp.dev",     title:"Tech Lead",          type:"Individual", template:"Dark Pro",theme:"Noir",    tagId:"NFC-2210", taps:926,  status:"active",   created:"Nov 15, 2025", lastActive:"1h ago",  photo:P3, change:-3  },
  { id:"4",  name:"Jordan Lee",     email:"jordan@ventures.co",      title:"Founder & CEO",      type:"Business",   template:"Sunset",  theme:"Cosmic",  tagId:"NFC-9954", taps:5412, status:"active",   created:"Oct 3, 2025",  lastActive:"3m ago",  photo:P4, change:24  },
  { id:"5",  name:"Elena Torres",   email:"elena.torres@corp.net",   title:"Sales Director",     type:"Individual", template:"Ocean",   theme:"Wave",    tagId:"NFC-5502", taps:2188, status:"inactive", created:"Sep 18, 2025", lastActive:"2d ago",  photo:P1, change:0   },
  { id:"6",  name:"Priya Nair",     email:"priya@consult.in",        title:"Consultant",         type:"Individual", template:"Forest",  theme:"Forest",  tagId:"NFC-8833", taps:744,  status:"active",   created:"Jan 5, 2026",  lastActive:"15m ago", photo:P2, change:5   },
  { id:"7",  name:"Kai Nakamura",   email:"kai@creativestudio.jp",   title:"Creative Director",  type:"Business",   template:"Noir",    theme:"Plated",  tagId:"NFC-6644", taps:1339, status:"paused",   created:"Aug 22, 2025", lastActive:"1w ago",  photo:P3, change:-1  },
  { id:"8",  name:"Maya Patel",     email:"maya@barkside.pet",       title:"Pet Profile",        type:"Pet",        template:"Paws",    theme:"Paws",    tagId:"NFC-7788", taps:423,  status:"active",   created:"Jan 28, 2026", lastActive:"3h ago",  photo:P4, change:31  },
  { id:"9",  name:"The Coffee Lab", email:"hello@coffeelab.com",     title:"Specialty Café",     type:"Café",       template:"Brew",    theme:"Mocha",   tagId:"NFC-1134", taps:892,  status:"active",   created:"Feb 2, 2026",  lastActive:"30m ago", photo:P1, change:18  },
  { id:"10", name:"Neon Circuit",   email:"book@neoncircuit.band",   title:"Electronic Band",    type:"Musician",   template:"Stage",   theme:"Neon",    tagId:"NFC-2287", taps:2671, status:"active",   created:"Dec 10, 2025", lastActive:"1h ago",  photo:P2, change:42  },
  { id:"11", name:"TechSummit 2026",email:"info@techsummit.events",  title:"Annual Conference",  type:"Event",      template:"Event",   theme:"Cosmic",  tagId:"NFC-3312", taps:4108, status:"active",   created:"Jan 20, 2026", lastActive:"22m ago", photo:P3, change:67  },
  { id:"12", name:"Dev Sharma",     email:"dev@sharma.me",           title:"Full Stack Engineer",type:"Individual", template:"Wave",    theme:"Sunset",  tagId:"NFC-4490", taps:387,  status:"inactive", created:"Feb 8, 2026",  lastActive:"3d ago",  photo:P4, change:-8  },
];

const PAGE_SIZE = 8;

export function AdminProfiles() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [typeFilter, setTypeFilter]       = useState("all");
  const [sortField, setSortField]         = useState<"taps"|"name"|"created">("taps");
  const [sortDir, setSortDir]             = useState<"asc"|"desc">("desc");
  const [selected, setSelected]           = useState<string[]>([]);
  const [page, setPage]                   = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null);

  const card = `rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`;
  const inputCls = `h-9 px-3 rounded-xl border text-xs outline-none ${isDark ? "bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400"}`;

  const toggleSort = (f: typeof sortField) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("desc"); }
  };

  const filtered = ALL_PROFILES
    .filter(p => {
      const q = search.toLowerCase();
      return (
        (p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.title.toLowerCase().includes(q)) &&
        (statusFilter === "all" || p.status === statusFilter) &&
        (typeFilter === "all" || p.type === typeFilter)
      );
    })
    .sort((a, b) => {
      if (sortField === "taps") return sortDir === "desc" ? b.taps - a.taps : a.taps - b.taps;
      if (sortField === "name") return sortDir === "desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleAll = () =>
    setSelected(selected.length === paginated.length ? [] : paginated.map(p => p.id));
  const toggle = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const stats = [
    { label:"Total Profiles", value: ALL_PROFILES.length,                              icon: Users,       grad:"linear-gradient(135deg,#4F46E5,#7C3AED)", bg:"rgba(79,70,229,0.08)"    },
    { label:"Active",         value: ALL_PROFILES.filter(p=>p.status==="active").length,   icon: UserCheck,   grad:"linear-gradient(135deg,#10B981,#059669)", bg:"rgba(16,185,129,0.08)"   },
    { label:"Inactive",       value: ALL_PROFILES.filter(p=>p.status==="inactive").length, icon: UserX,       grad:"linear-gradient(135deg,#64748B,#475569)", bg:"rgba(100,116,139,0.08)"  },
    { label:"Paused",         value: ALL_PROFILES.filter(p=>p.status==="paused").length,   icon: PauseCircle, grad:"linear-gradient(135deg,#F59E0B,#D97706)", bg:"rgba(245,158,11,0.08)"   },
  ];

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? (sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />)
      : null;

  return (
    <div className={`min-h-screen pt-16 flex ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-56 min-w-0">
        {/* Page header */}
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
                <h1 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>Profiles</h1>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{ALL_PROFILES.length} total profiles</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className={`flex items-center gap-2 h-9 px-3 rounded-lg text-sm transition-colors ${isDark ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`} style={{ fontWeight: 500 }}>
                <Download size={14} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <Link to="/editor" className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm text-white transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", fontWeight: 600 }}>
                <Plus size={14} />
                <span className="hidden sm:inline">New Profile</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }} className={`p-4 ${card}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                      <Icon size={17} style={{ background: s.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }} />
                    </div>
                    <ArrowUpRight size={14} className={isDark ? "text-slate-600" : "text-slate-300"} />
                  </div>
                  <div className={isDark ? "text-white" : "text-slate-900"} style={{ fontSize:"1.6rem", fontWeight:800, letterSpacing:"-0.03em" }}>{s.value}</div>
                  <div className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{s.label}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Table card */}
          <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
            {/* Toolbar */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <div className="flex items-center gap-2 flex-wrap">
                {selected.length > 0 && (
                  <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${isDark ? "bg-indigo-950/50 border border-indigo-800" : "bg-indigo-50 border border-indigo-200"}`}>
                    <span className={isDark ? "text-indigo-300" : "text-indigo-700"} style={{ fontWeight:600 }}>{selected.length} selected</span>
                    <button className="text-rose-500 hover:text-rose-400 transition-colors" style={{ fontWeight:600 }}>Delete</button>
                    <button className={isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"} style={{ fontWeight:600 }}>Suspend</button>
                    <button className="text-indigo-500 hover:text-indigo-400 transition-colors" style={{ fontWeight:600 }}>Export</button>
                  </motion.div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className={`flex items-center gap-2 h-9 px-3 rounded-xl border flex-1 sm:w-52 sm:flex-none ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <Search size={13} className="text-slate-400 shrink-0" />
                  <input type="text" placeholder="Search profiles…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className={`flex-1 text-xs bg-transparent outline-none ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-700 placeholder:text-slate-400"}`} />
                </div>
                <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className={`${inputCls} pr-6`} style={{ fontWeight:500 }}>
                  <option value="all">All Types</option>
                  {["Individual","Business","Pet","Café","Event","Musician"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className={`${inputCls} pr-6`} style={{ fontWeight:500 }}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b text-xs ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" checked={selected.length === paginated.length && paginated.length > 0} onChange={toggleAll} className="rounded accent-indigo-500 cursor-pointer" />
                    </th>
                    <th className={`text-left px-4 py-3 cursor-pointer select-none hover:text-indigo-500 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight:600 }} onClick={() => toggleSort("name")}>
                      <div className="flex items-center gap-1">Profile <SortIcon field="name" /></div>
                    </th>
                    <th className={`text-left px-4 py-3 hidden sm:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight:600 }}>Type</th>
                    <th className={`text-left px-4 py-3 hidden md:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight:600 }}>Template</th>
                    <th className={`text-left px-4 py-3 hidden lg:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight:600 }}>NFC Tag</th>
                    <th className={`text-left px-4 py-3 cursor-pointer select-none hover:text-indigo-500 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight:600 }} onClick={() => toggleSort("taps")}>
                      <div className="flex items-center gap-1">Taps <SortIcon field="taps" /></div>
                    </th>
                    <th className={`text-left px-4 py-3 ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight:600 }}>Status</th>
                    <th className={`text-left px-4 py-3 hidden xl:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight:600 }}>Last Active</th>
                    <th className="w-16 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p, i) => {
                    const isSelected = selected.includes(p.id);
                    return (
                      <motion.tr key={p.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.03 }}
                        className={`border-b transition-colors ${isSelected ? (isDark ? "bg-indigo-950/30 border-indigo-900/20" : "bg-indigo-50 border-indigo-100") : (isDark ? "border-slate-800 hover:bg-slate-800/40" : "border-slate-50 hover:bg-slate-50")}`}>
                        <td className="px-4 py-3.5">
                          <input type="checkbox" checked={isSelected} onChange={() => toggle(p.id)} className="rounded accent-indigo-500 cursor-pointer" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-indigo-100 dark:ring-indigo-900/40">
                              <ImageWithFallback src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight:600 }}>{p.name}</p>
                              <p className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>{p.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[p.type] ?? "bg-slate-100 text-slate-600"}`} style={{ fontWeight:600 }}>{p.type}</span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className={`text-xs px-2.5 py-1 rounded-lg ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`} style={{ fontWeight:500 }}>{p.template}</span>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Wifi size={11} className="text-indigo-400" />
                            <span className={`text-xs font-mono ${isDark ? "text-slate-300" : "text-slate-600"}`}>{p.tagId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <span className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight:700 }}>{p.taps.toLocaleString()}</span>
                            {p.change !== 0 && (
                              <span className={`text-xs flex items-center gap-0.5 ${p.change > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                {p.change > 0 ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}{Math.abs(p.change)}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[p.status]}`} style={{ fontWeight:600 }}>{p.status}</span>
                        </td>
                        <td className={`px-4 py-3.5 text-xs hidden xl:table-cell ${isDark ? "text-slate-400" : "text-slate-500"}`}>{p.lastActive}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-0.5">
                            <Link to="/profile" className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}><Eye size={13}/></Link>
                            <Link to="/editor"  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}><Edit size={13}/></Link>
                            <button onClick={() => setDeleteConfirm(p.id)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-rose-900/40 hover:text-rose-400" : "text-slate-400 hover:bg-rose-50 hover:text-rose-500"}`}><Trash2 size={13}/></button>
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

            {/* Pagination */}
            <div className={`flex items-center justify-between p-4 border-t text-xs ${isDark ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"}`}>
              <span>Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}</span>
              <div className="flex items-center gap-1">
                <button disabled={page===1} onClick={() => setPage(p=>p-1)}
                  className={`h-7 px-2.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i+1).map(pg => (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-7 h-7 rounded-lg transition-colors ${pg===page ? "text-white" : isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"}`}
                    style={{ background: pg===page ? "linear-gradient(135deg,#4F46E5,#7C3AED)" : "transparent", fontWeight: pg===page ? 600 : 400 }}>{pg}</button>
                ))}
                <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)}
                  className={`h-7 px-2.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>›</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale:0.95, y:10 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95, y:10 }}
              className={`w-full max-w-sm p-6 rounded-2xl ${isDark ? "bg-slate-900 border border-slate-800" : "bg-white shadow-xl"}`}>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-rose-500" />
              </div>
              <h3 className={`text-center mb-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight:700 }}>Delete Profile?</h3>
              <p className={`text-sm text-center mb-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>This action cannot be undone. The profile and all associated data will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className={`flex-1 h-10 rounded-xl text-sm transition-colors ${isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} style={{ fontWeight:600 }}>Cancel</button>
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-10 rounded-xl text-sm text-white bg-rose-500 hover:bg-rose-600 transition-colors" style={{ fontWeight:600 }}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
