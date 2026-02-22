import { useState } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings, Globe, Bell, Shield, Key, AlertTriangle,
  Save, Copy, RefreshCw, Eye, EyeOff, CheckCircle2,
  Menu, Trash2, Database, Download, RotateCcw,
  ChevronRight,
} from "lucide-react";
import { AdminSidebar } from "../../components/admin/AdminSidebar";

type TabKey = "general" | "notifications" | "security" | "api" | "danger";

const TABS: Array<{ key: TabKey; label: string; Icon: React.FC<{size:number}> }> = [
  { key:"general",       label:"General",       Icon: Globe    },
  { key:"notifications", label:"Notifications", Icon: Bell     },
  { key:"security",      label:"Security",      Icon: Shield   },
  { key:"api",           label:"API Keys",      Icon: Key      },
  { key:"danger",        label:"Danger Zone",   Icon: AlertTriangle },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${checked ? "" : "bg-slate-200 dark:bg-slate-700"}`}
      style={{ background: checked ? "linear-gradient(135deg,#4F46E5,#7C3AED)" : undefined }}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function SaveButton({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return (
    <button onClick={onSave}
      className={`flex items-center gap-2 h-9 px-5 rounded-xl text-sm text-white transition-all ${saved ? "bg-emerald-500" : "hover:opacity-90"}`}
      style={{ background: saved ? undefined : "linear-gradient(135deg,#4F46E5,#7C3AED)", fontWeight:600 }}>
      {saved ? <><CheckCircle2 size={14}/>Saved</> : <><Save size={14}/>Save Changes</>}
    </button>
  );
}

export function AdminSettings() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab]     = useState<TabKey>("general");

  // General
  const [platformName, setPlatformName]       = useState("TapLink");
  const [supportEmail, setSupportEmail]       = useState("support@taplink.io");
  const [platformUrl, setPlatformUrl]         = useState("https://taplink.io");
  const [language, setLanguage]               = useState("en");
  const [visibility, setVisibility]           = useState("public");
  const [maxProfiles, setMaxProfiles]         = useState("10");
  const [maintenance, setMaintenance]         = useState(false);
  const [generalSaved, setGeneralSaved]       = useState(false);

  // Notifications
  const [notifState, setNotifState] = useState({
    newUser: true, tagClaimed: true, tapMilestone: false,
    dailySummary: true, tapAnomaly: true, lowStock: false,
  });
  const [notifSaved, setNotifSaved] = useState(false);

  // Security
  const [require2fa, setRequire2fa]         = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [maxAttempts, setMaxAttempts]       = useState("5");
  const [forceReauth, setForceReauth]       = useState(true);
  const [ipAllowlist, setIpAllowlist]       = useState("");
  const [securitySaved, setSecuritySaved]   = useState(false);

  // API Keys
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [webhookUrl, setWebhookUrl]       = useState("");
  const [apiCopied, setApiCopied]         = useState(false);
  const [apiSaved, setApiSaved]           = useState(false);
  const MOCK_API_KEY                      = "tlk_live_4f8e2b91a7c3d6f0e52b19847a3c50f2";
  const maskedKey                         = "tlk_live_" + "•".repeat(24);

  // Danger
  const [confirmInput, setConfirmInput] = useState("");
  const [activeConfirm, setActiveConfirm] = useState<string|null>(null);

  const card = `rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`;
  const inputCls = `h-10 w-full px-3 rounded-xl border text-sm outline-none transition-colors ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-400"}`;
  const labelCls = `block text-xs mb-1.5 ${isDark ? "text-slate-400" : "text-slate-600"}`;

  const save = (setter: (v:boolean)=>void) => { setter(true); setTimeout(() => setter(false), 2200); };

  const copyApiKey = () => {
    navigator.clipboard.writeText(MOCK_API_KEY).catch(()=>{});
    setApiCopied(true);
    setTimeout(() => setApiCopied(false), 1800);
  };

  const toggleNotif = (k: keyof typeof notifState) => setNotifState(s => ({ ...s, [k]: !s[k] }));

  const Section = ({ title, desc, children }: { title:string; desc:string; children:React.ReactNode }) => (
    <div className={`${card} p-5 sm:p-6 space-y-5`}>
      <div className={`pb-4 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
        <h3 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight:700 }}>{title}</h3>
        <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{desc}</p>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, children }: { label:string; children:React.ReactNode }) => (
    <div>
      <label className={labelCls} style={{ fontWeight:600 }}>{label}</label>
      {children}
    </div>
  );

  const ToggleRow = ({ label, desc, checked, onChange }: { label:string; desc:string; checked:boolean; onChange:()=>void }) => (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className={`text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`} style={{ fontWeight:500 }}>{label}</p>
        <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}>{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );

  return (
    <div className={`min-h-screen pt-16 flex ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-56 min-w-0">
        {/* Header */}
        <div className={`sticky top-16 z-20 border-b px-4 sm:px-6 lg:px-8 py-4 ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className={`lg:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-200"}`}>
              <Menu size={18} />
            </button>
            <div>
              <h1 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight:800, letterSpacing:"-0.02em" }}>Settings</h1>
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Manage platform configuration</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar tabs */}
            <div className="lg:w-52 shrink-0">
              <nav className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                {TABS.map(t => {
                  const Icon = t.Icon;
                  const isActive = activeTab === t.key;
                  return (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-sm transition-all border-b last:border-b-0 ${
                        isDark ? "border-slate-800" : "border-slate-50"
                      } ${isActive ? (isDark ? "bg-indigo-950/40 text-white" : "bg-indigo-50 text-indigo-700") : (isDark ? "text-slate-400 hover:text-white hover:bg-slate-800/50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50")}`}
                      style={{ fontWeight: isActive ? 600 : 400 }}>
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} className={isActive ? (isDark ? "text-indigo-400" : "text-indigo-600") : ""} />
                        {t.label}
                      </div>
                      {isActive && <ChevronRight size={14} className={isDark ? "text-indigo-400" : "text-indigo-500"} />}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-5">
              <AnimatePresence mode="wait">
                {/* ── General ── */}
                {activeTab === "general" && (
                  <motion.div key="general" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-5">
                    <Section title="General Settings" desc="Basic platform configuration and defaults">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Platform Name">
                          <input type="text" value={platformName} onChange={e=>setPlatformName(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Support Email">
                          <input type="email" value={supportEmail} onChange={e=>setSupportEmail(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Platform URL">
                          <input type="url" value={platformUrl} onChange={e=>setPlatformUrl(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Default Language">
                          <select value={language} onChange={e=>setLanguage(e.target.value)} className={inputCls}>
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="ja">Japanese</option>
                          </select>
                        </Field>
                        <Field label="Profile Visibility Default">
                          <select value={visibility} onChange={e=>setVisibility(e.target.value)} className={inputCls}>
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="link">Link only</option>
                          </select>
                        </Field>
                        <Field label="Max Profiles per User">
                          <input type="number" min="1" max="100" value={maxProfiles} onChange={e=>setMaxProfiles(e.target.value)} className={inputCls} />
                        </Field>
                      </div>
                      <div className={`pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                        <ToggleRow label="Maintenance Mode" desc="Disable public access and show a maintenance page to all visitors" checked={maintenance} onChange={() => setMaintenance(v=>!v)} />
                      </div>
                      <div className="flex justify-end pt-2">
                        <SaveButton saved={generalSaved} onSave={() => save(setGeneralSaved)} />
                      </div>
                    </Section>
                  </motion.div>
                )}

                {/* ── Notifications ── */}
                {activeTab === "notifications" && (
                  <motion.div key="notifications" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                    <Section title="Notification Preferences" desc="Choose which events trigger admin email alerts">
                      <div className="space-y-5">
                        <ToggleRow label="New User Registration" desc="Receive an alert when a new user creates an account" checked={notifState.newUser} onChange={() => toggleNotif("newUser")} />
                        <div className={`border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />
                        <ToggleRow label="Tag Claimed" desc="Alert when a new NFC tag is claimed and linked to a profile" checked={notifState.tagClaimed} onChange={() => toggleNotif("tagClaimed")} />
                        <div className={`border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />
                        <ToggleRow label="Tap Milestone Alerts" desc="Notify when a profile reaches 100, 500, or 1,000 taps" checked={notifState.tapMilestone} onChange={() => toggleNotif("tapMilestone")} />
                        <div className={`border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />
                        <ToggleRow label="Daily Summary Email" desc="Receive a daily digest of platform activity at 8 AM" checked={notifState.dailySummary} onChange={() => toggleNotif("dailySummary")} />
                        <div className={`border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />
                        <ToggleRow label="Tap Anomaly Alerts" desc="Alert when unusual tap patterns are detected on a tag" checked={notifState.tapAnomaly} onChange={() => toggleNotif("tapAnomaly")} />
                        <div className={`border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />
                        <ToggleRow label="Low Tag Stock Alert" desc="Alert when unlinked tag inventory falls below 10" checked={notifState.lowStock} onChange={() => toggleNotif("lowStock")} />
                      </div>
                      <div className="flex justify-end pt-2">
                        <SaveButton saved={notifSaved} onSave={() => save(setNotifSaved)} />
                      </div>
                    </Section>
                  </motion.div>
                )}

                {/* ── Security ── */}
                {activeTab === "security" && (
                  <motion.div key="security" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                    <Section title="Security Settings" desc="Control access policies and authentication requirements">
                      <div className="space-y-5">
                        <ToggleRow label="Require 2FA for Admin" desc="Enforce two-factor authentication for all admin accounts" checked={require2fa} onChange={() => setRequire2fa(v=>!v)} />
                        <div className={`border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />
                        <ToggleRow label="Force Re-auth on Settings" desc="Require password confirmation before saving security changes" checked={forceReauth} onChange={() => setForceReauth(v=>!v)} />
                        <div className={`border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          <Field label="Session Timeout">
                            <select value={sessionTimeout} onChange={e=>setSessionTimeout(e.target.value)} className={inputCls}>
                              <option value="15">15 minutes</option>
                              <option value="30">30 minutes</option>
                              <option value="60">1 hour</option>
                              <option value="240">4 hours</option>
                              <option value="0">Never</option>
                            </select>
                          </Field>
                          <Field label="Max Login Attempts">
                            <input type="number" min="3" max="20" value={maxAttempts} onChange={e=>setMaxAttempts(e.target.value)} className={inputCls} />
                          </Field>
                        </div>
                        <Field label="IP Allowlist (one per line)">
                          <textarea rows={4} value={ipAllowlist} onChange={e=>setIpAllowlist(e.target.value)} placeholder={"e.g. 192.168.1.0/24\n10.0.0.1"}
                            className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors resize-none font-mono ${isDark ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-400"}`} />
                        </Field>
                      </div>
                      <div className="flex justify-end pt-2">
                        <SaveButton saved={securitySaved} onSave={() => save(setSecuritySaved)} />
                      </div>
                    </Section>
                  </motion.div>
                )}

                {/* ── API Keys ── */}
                {activeTab === "api" && (
                  <motion.div key="api" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-5">
                    <Section title="API Keys" desc="Manage your platform API credentials and webhook configuration">
                      <div className="space-y-4">
                        <Field label="Live API Key">
                          <div className={`flex items-center gap-2 h-10 px-3 rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                            <code className={`flex-1 text-xs font-mono overflow-hidden ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                              {apiKeyVisible ? MOCK_API_KEY : maskedKey}
                            </code>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => setApiKeyVisible(v=>!v)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-700" : "text-slate-400 hover:bg-slate-200"}`}>
                                {apiKeyVisible ? <EyeOff size={13}/> : <Eye size={13}/>}
                              </button>
                              <button onClick={copyApiKey} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-700" : "text-slate-400 hover:bg-slate-200"}`}>
                                {apiCopied ? <CheckCircle2 size={13} className="text-emerald-500"/> : <Copy size={13}/>}
                              </button>
                            </div>
                          </div>
                        </Field>

                        <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-amber-50 border-amber-200"}`}>
                          <div>
                            <p className={`text-sm ${isDark ? "text-slate-300" : "text-amber-900"}`} style={{ fontWeight:600 }}>Regenerate API Key</p>
                            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-amber-700"}`}>This will invalidate your current key immediately</p>
                          </div>
                          <button className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs transition-colors ${isDark ? "bg-slate-700 text-amber-400 hover:bg-slate-600" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`} style={{ fontWeight:600 }}>
                            <RefreshCw size={12}/>Regenerate
                          </button>
                        </div>

                        <div className={`pt-2 border-t space-y-4 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`} style={{ fontWeight:600 }}>Rate Limit</p>
                              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>Current plan: <span style={{ fontWeight:600 }}>1,000 req / min</span></p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700" style={{ fontWeight:600 }}>Pro Plan</span>
                          </div>
                          <Field label="Webhook URL">
                            <input type="url" value={webhookUrl} onChange={e=>setWebhookUrl(e.target.value)} placeholder="https://your-server.com/webhook" className={inputCls} />
                          </Field>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <SaveButton saved={apiSaved} onSave={() => save(setApiSaved)} />
                      </div>
                    </Section>
                  </motion.div>
                )}

                {/* ── Danger Zone ── */}
                {activeTab === "danger" && (
                  <motion.div key="danger" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                    <div className={`rounded-2xl border ${isDark ? "bg-slate-900 border-rose-900/40" : "bg-white border-rose-200 shadow-sm"} overflow-hidden`}>
                      <div className={`flex items-center gap-3 p-5 border-b ${isDark ? "bg-rose-950/20 border-rose-900/40" : "bg-rose-50 border-rose-100"}`}>
                        <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                          <AlertTriangle size={17} className="text-rose-500" />
                        </div>
                        <div>
                          <h3 className={isDark ? "text-white" : "text-rose-900"} style={{ fontWeight:700 }}>Danger Zone</h3>
                          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-rose-700"}`}>These actions are irreversible. Proceed with caution.</p>
                        </div>
                      </div>

                      <div className="divide-y" style={{ borderColor: isDark ? "rgba(239,68,68,0.15)" : "#FEE2E2" }}>
                        {[
                          { id:"export",  Icon:Download,   label:"Export All Data",          desc:"Download a complete archive of all profiles, tags, and analytics.",    btnLabel:"Export",       btnCls:"bg-indigo-100 text-indigo-700 hover:bg-indigo-200"     },
                          { id:"clear",   Icon:Database,   label:"Clear Analytics Data",     desc:"Permanently delete all tap events and analytics history. Profiles remain intact.", btnLabel:"Clear Data",   btnCls:"bg-amber-100 text-amber-700 hover:bg-amber-200"       },
                          { id:"reset",   Icon:RotateCcw,  label:"Reset NFC Assignments",    desc:"Unlink all NFC tags from their profiles. Tags remain in inventory.",   btnLabel:"Reset Tags",   btnCls:"bg-orange-100 text-orange-700 hover:bg-orange-200"     },
                          { id:"delete",  Icon:Trash2,     label:"Delete All Test Profiles", desc:"Remove all profiles marked as test data. This cannot be undone.",      btnLabel:"Delete Tests", btnCls:"bg-rose-100 text-rose-700 hover:bg-rose-200"           },
                        ].map(action => {
                          const ActionIcon = action.Icon;
                          const isConfirming = activeConfirm === action.id;
                          return (
                            <div key={action.id} className={`p-5 transition-colors ${isDark ? "hover:bg-rose-950/10" : "hover:bg-rose-50/50"}`}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 min-w-0">
                                  <ActionIcon size={16} className={`mt-0.5 shrink-0 ${isDark ? "text-rose-400" : "text-rose-500"}`} />
                                  <div className="min-w-0">
                                    <p className={`text-sm ${isDark ? "text-slate-200" : "text-slate-900"}`} style={{ fontWeight:600 }}>{action.label}</p>
                                    <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}>{action.desc}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setActiveConfirm(isConfirming ? null : action.id)}
                                  className={`shrink-0 h-8 px-3 rounded-lg text-xs transition-colors ${action.btnCls}`}
                                  style={{ fontWeight:600 }}>
                                  {isConfirming ? "Cancel" : action.btnLabel}
                                </button>
                              </div>

                              <AnimatePresence>
                                {isConfirming && (
                                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
                                    <div className={`mt-4 p-4 rounded-xl border ${isDark ? "bg-slate-800 border-rose-900/40" : "bg-rose-50 border-rose-200"}`}>
                                      <p className={`text-xs mb-3 ${isDark ? "text-slate-300" : "text-rose-800"}`}>
                                        Type <span style={{ fontWeight:700 }}>CONFIRM</span> to proceed with this action
                                      </p>
                                      <div className="flex gap-2">
                                        <input type="text" placeholder="CONFIRM" value={confirmInput} onChange={e => setConfirmInput(e.target.value)}
                                          className={`flex-1 h-9 px-3 rounded-xl border text-sm outline-none font-mono ${isDark ? "bg-slate-700 border-rose-800 text-white placeholder:text-slate-500" : "bg-white border-rose-300 text-slate-800 placeholder:text-slate-400"}`} />
                                        <button
                                          disabled={confirmInput !== "CONFIRM"}
                                          onClick={() => { setActiveConfirm(null); setConfirmInput(""); }}
                                          className="h-9 px-4 rounded-xl text-xs text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                          style={{ fontWeight:600 }}>
                                          Confirm
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
