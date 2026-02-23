import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  Shield,
  Key,
  AlertTriangle,
  Save,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Menu,
  Trash2,
  Database,
  Download,
  RotateCcw,
  ChevronRight,
  Globe,
  AlertCircle,
} from "lucide-react";

import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { ApiError, apiRequest } from "../../lib/api";
import { clearSession } from "../../lib/session";

type TabKey = "general" | "notifications" | "security" | "api" | "danger";

interface AdminSettingsRecord {
  id: number;
  platformName: string;
  supportEmail: string;
  platformUrl: string;
  maxProfilesPerUser: number;
  maintenanceMode: boolean;
  config: unknown;
  updatedAt: string;
}

interface SettingsResponse {
  settings: AdminSettingsRecord;
}

interface ApiKeyItem {
  id: string;
  name: string;
  keyHash: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface ApiKeysResponse {
  items: ApiKeyItem[];
}

interface RotateApiKeyResponse {
  apiKey: string;
  id: string;
  createdAt: string;
}

interface NotificationState {
  newUser: boolean;
  tagClaimed: boolean;
  tapMilestone: boolean;
  dailySummary: boolean;
  tapAnomaly: boolean;
  lowStock: boolean;
}

interface SecurityState {
  require2fa: boolean;
  sessionTimeout: string;
  maxAttempts: string;
  forceReauth: boolean;
  ipAllowlist: string;
}

interface ParsedConfig {
  language: string;
  visibility: string;
  notifications: NotificationState;
  security: SecurityState;
  webhookUrl: string;
}

const DEFAULT_NOTIFICATIONS: NotificationState = {
  newUser: true,
  tagClaimed: true,
  tapMilestone: false,
  dailySummary: true,
  tapAnomaly: true,
  lowStock: false,
};

const DEFAULT_SECURITY: SecurityState = {
  require2fa: true,
  sessionTimeout: "30",
  maxAttempts: "5",
  forceReauth: true,
  ipAllowlist: "",
};

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

const TABS: Array<{ key: TabKey; label: string; Icon: IconComponent }> = [
  { key: "general", label: "General", Icon: Globe },
  { key: "notifications", label: "Notifications", Icon: Bell },
  { key: "security", label: "Security", Icon: Shield },
  { key: "api", label: "API Keys", Icon: Key },
  { key: "danger", label: "Danger Zone", Icon: AlertTriangle },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        checked ? "" : "bg-slate-200 dark:bg-slate-700"
      }`}
      style={{ background: checked ? "linear-gradient(135deg,#DC2626,#EA580C)" : undefined }}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function SaveButton({ saved, saving, onSave }: { saved: boolean; saving: boolean; onSave: () => void }) {
  return (
    <button
      onClick={onSave}
      disabled={saving}
      className={`flex items-center gap-2 h-9 px-5 rounded-xl text-sm text-white transition-all disabled:opacity-60 ${saved ? "bg-emerald-500" : "hover:opacity-90"}`}
      style={{ background: saved ? undefined : "linear-gradient(135deg,#DC2626,#EA580C)", fontWeight: 600 }}
    >
      {saving ? <><RefreshCw size={14} className="animate-spin" />Saving...</> : saved ? <><CheckCircle2 size={14} />Saved</> : <><Save size={14} />Save Changes</>}
    </button>
  );
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function maskPlainKey(key: string): string {
  if (key.length <= 12) {
    return key;
  }
  return `${key.slice(0, 8)}${"•".repeat(Math.max(4, key.length - 12))}${key.slice(-4)}`;
}

function formatDate(input: string | null): string {
  if (!input) {
    return "Never";
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "Never";
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseConfig(value: unknown): ParsedConfig {
  const config = toRecord(value);

  const notificationsRaw = toRecord(config.notifications);
  const securityRaw = toRecord(config.security);

  return {
    language: readString(config.language, "en"),
    visibility: readString(config.visibility, "public"),
    notifications: {
      newUser: readBoolean(notificationsRaw.newUser, DEFAULT_NOTIFICATIONS.newUser),
      tagClaimed: readBoolean(notificationsRaw.tagClaimed, DEFAULT_NOTIFICATIONS.tagClaimed),
      tapMilestone: readBoolean(notificationsRaw.tapMilestone, DEFAULT_NOTIFICATIONS.tapMilestone),
      dailySummary: readBoolean(notificationsRaw.dailySummary, DEFAULT_NOTIFICATIONS.dailySummary),
      tapAnomaly: readBoolean(notificationsRaw.tapAnomaly, DEFAULT_NOTIFICATIONS.tapAnomaly),
      lowStock: readBoolean(notificationsRaw.lowStock, DEFAULT_NOTIFICATIONS.lowStock),
    },
    security: {
      require2fa: readBoolean(securityRaw.require2fa, DEFAULT_SECURITY.require2fa),
      sessionTimeout: String(securityRaw.sessionTimeout ?? DEFAULT_SECURITY.sessionTimeout),
      maxAttempts: String(securityRaw.maxAttempts ?? DEFAULT_SECURITY.maxAttempts),
      forceReauth: readBoolean(securityRaw.forceReauth, DEFAULT_SECURITY.forceReauth),
      ipAllowlist: readString(securityRaw.ipAllowlist, DEFAULT_SECURITY.ipAllowlist),
    },
    webhookUrl: readString(config.webhookUrl, ""),
  };
}

export function AdminSettings() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  const [platformName, setPlatformName] = useState("Taparoo");
  const [supportEmail, setSupportEmail] = useState("support@taparoo.io");
  const [platformUrl, setPlatformUrl] = useState("https://taparoo.io");
  const [language, setLanguage] = useState("en");
  const [visibility, setVisibility] = useState("public");
  const [maxProfiles, setMaxProfiles] = useState("10");
  const [maintenance, setMaintenance] = useState(false);

  const [notifState, setNotifState] = useState<NotificationState>(DEFAULT_NOTIFICATIONS);

  const [require2fa, setRequire2fa] = useState(DEFAULT_SECURITY.require2fa);
  const [sessionTimeout, setSessionTimeout] = useState(DEFAULT_SECURITY.sessionTimeout);
  const [maxAttempts, setMaxAttempts] = useState(DEFAULT_SECURITY.maxAttempts);
  const [forceReauth, setForceReauth] = useState(DEFAULT_SECURITY.forceReauth);
  const [ipAllowlist, setIpAllowlist] = useState(DEFAULT_SECURITY.ipAllowlist);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiCopied, setApiCopied] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState<TabKey | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [generalSaved, setGeneralSaved] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [securitySaved, setSecuritySaved] = useState(false);
  const [apiSaved, setApiSaved] = useState(false);

  const [confirmInput, setConfirmInput] = useState("");
  const [activeConfirm, setActiveConfirm] = useState<string | null>(null);

  const card = `rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`;
  const inputCls = `h-10 w-full px-3 rounded-xl border text-sm outline-none transition-colors ${
    isDark
      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
      : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-400"
  }`;
  const labelCls = `block text-xs mb-1.5 ${isDark ? "text-slate-400" : "text-slate-600"}`;

  const setSavedFlag = (setter: (value: boolean) => void) => {
    setter(true);
    window.setTimeout(() => setter(false), 2200);
  };

  const handleAuthError = (err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      clearSession();
      navigate("/login", { replace: true });
      return true;
    }
    if (err instanceof ApiError && err.status === 403) {
      navigate("/my-tags", { replace: true });
      return true;
    }
    return false;
  };

  const hydrateFromSettings = (settings: AdminSettingsRecord) => {
    const parsed = parseConfig(settings.config);

    setPlatformName(settings.platformName);
    setSupportEmail(settings.supportEmail);
    setPlatformUrl(settings.platformUrl);
    setMaxProfiles(String(settings.maxProfilesPerUser));
    setMaintenance(settings.maintenanceMode);

    setLanguage(parsed.language);
    setVisibility(parsed.visibility);

    setNotifState(parsed.notifications);

    setRequire2fa(parsed.security.require2fa);
    setSessionTimeout(parsed.security.sessionTimeout);
    setMaxAttempts(parsed.security.maxAttempts);
    setForceReauth(parsed.security.forceReauth);
    setIpAllowlist(parsed.security.ipAllowlist);

    setWebhookUrl(parsed.webhookUrl);
  };

  const loadData = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");
    setNotice("");

    try {
      const [settingsResponse, apiKeysResponse] = await Promise.all([
        apiRequest<SettingsResponse>("/admin/settings", { auth: true }),
        apiRequest<ApiKeysResponse>("/admin/api-keys", { auth: true }),
      ]);

      hydrateFromSettings(settingsResponse.settings);
      setApiKeys(apiKeysResponse.items);
      setNewApiKey(null);
      setApiKeyVisible(false);
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to load settings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latestApiKey = apiKeys[0] ?? null;
  const shownApiKey = useMemo(() => {
    if (newApiKey) {
      return apiKeyVisible ? newApiKey : maskPlainKey(newApiKey);
    }
    return latestApiKey?.keyHash ?? "No API keys generated yet";
  }, [newApiKey, apiKeyVisible, latestApiKey]);

  const saveGeneral = async () => {
    setSaving("general");
    setError("");
    setNotice("");

    try {
      const maxProfilesValue = Number.parseInt(maxProfiles, 10);
      const payload = {
        platformName,
        supportEmail,
        platformUrl,
        maxProfilesPerUser: Number.isNaN(maxProfilesValue) ? 10 : Math.max(1, Math.min(maxProfilesValue, 1000)),
        maintenanceMode: maintenance,
        config: {
          language,
          visibility,
        },
      };

      const response = await apiRequest<SettingsResponse>("/admin/settings", {
        method: "PATCH",
        auth: true,
        body: payload,
      });

      hydrateFromSettings(response.settings);
      setSavedFlag(setGeneralSaved);
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to save general settings.");
    } finally {
      setSaving(null);
    }
  };

  const saveNotifications = async () => {
    setSaving("notifications");
    setError("");
    setNotice("");

    try {
      await apiRequest<SettingsResponse>("/admin/settings", {
        method: "PATCH",
        auth: true,
        body: {
          config: {
            notifications: notifState,
          },
        },
      });

      setSavedFlag(setNotifSaved);
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to save notification settings.");
    } finally {
      setSaving(null);
    }
  };

  const saveSecurity = async () => {
    setSaving("security");
    setError("");
    setNotice("");

    try {
      const sessionValue = Number.parseInt(sessionTimeout, 10);
      const attemptsValue = Number.parseInt(maxAttempts, 10);

      await apiRequest<SettingsResponse>("/admin/settings", {
        method: "PATCH",
        auth: true,
        body: {
          config: {
            security: {
              require2fa,
              sessionTimeout: Number.isNaN(sessionValue) ? 30 : sessionValue,
              maxAttempts: Number.isNaN(attemptsValue) ? 5 : attemptsValue,
              forceReauth,
              ipAllowlist,
            },
          },
        },
      });

      setSavedFlag(setSecuritySaved);
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to save security settings.");
    } finally {
      setSaving(null);
    }
  };

  const saveApiConfig = async () => {
    setSaving("api");
    setError("");
    setNotice("");

    try {
      await apiRequest<SettingsResponse>("/admin/settings", {
        method: "PATCH",
        auth: true,
        body: {
          config: {
            webhookUrl,
          },
        },
      });

      setSavedFlag(setApiSaved);
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to save API settings.");
    } finally {
      setSaving(null);
    }
  };

  const rotateApiKey = async () => {
    setSaving("api");
    setError("");
    setNotice("");

    try {
      const response = await apiRequest<RotateApiKeyResponse>("/admin/api-keys/rotate", {
        method: "POST",
        auth: true,
        body: {
          name: `Admin Key ${new Date().toISOString().slice(0, 10)}`,
        },
      });

      const refreshedKeys = await apiRequest<ApiKeysResponse>("/admin/api-keys", { auth: true });
      setApiKeys(refreshedKeys.items);
      setNewApiKey(response.apiKey);
      setApiKeyVisible(false);
      setNotice("A new API key was generated. Copy it now; it will not be shown again.");
    } catch (err) {
      if (handleAuthError(err)) {
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to rotate API key.");
    } finally {
      setSaving(null);
    }
  };

  const copyApiKey = () => {
    if (!newApiKey) {
      setError("Rotate the API key to copy its plaintext value.");
      return;
    }

    navigator.clipboard.writeText(newApiKey).catch(() => {});
    setApiCopied(true);
    window.setTimeout(() => setApiCopied(false), 1800);
  };

  const toggleNotif = (key: keyof NotificationState) => {
    setNotifState((current) => ({ ...current, [key]: !current[key] }));
  };

  const Section = ({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) => (
    <div className={`${card} p-5 sm:p-6 space-y-5`}>
      <div className={`pb-4 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
        <h3 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 700 }}>
          {title}
        </h3>
        <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{desc}</p>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className={labelCls} style={{ fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  );

  const ToggleRow = ({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className={`text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`} style={{ fontWeight: 500 }}>
          {label}
        </p>
        <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}>{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen pt-16 flex ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 lg:ml-56 p-8">
          <div className={`h-10 w-48 rounded-xl animate-pulse ${isDark ? "bg-slate-900" : "bg-slate-200"}`} />
          <div className={`mt-6 h-64 rounded-2xl animate-pulse ${isDark ? "bg-slate-900" : "bg-white border border-slate-100"}`} />
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
              <button onClick={() => setSidebarOpen(true)} className={`lg:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-200"}`}>
                <Menu size={18} />
              </button>
              <div>
                <h1 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Settings
                </h1>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Manage platform configuration</p>
              </div>
            </div>
            <button
              onClick={() => void loadData(true)}
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

        <div className="p-4 sm:p-6 lg:p-8">
          {(error || notice) && (
            <div className="space-y-2 mb-4">
              {error && (
                <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${isDark ? "border-rose-900/40 bg-rose-950/20 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}
              {notice && (
                <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${isDark ? "border-emerald-900/40 bg-emerald-950/20 text-emerald-300" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                  <CheckCircle2 size={15} />
                  {notice}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-52 shrink-0">
              <nav className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                {TABS.map((tab) => {
                  const Icon = tab.Icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-sm transition-all border-b last:border-b-0 ${isDark ? "border-slate-800" : "border-slate-50"} ${
                        isActive
                          ? isDark
                            ? "bg-indigo-950/40 text-white"
                            : "bg-indigo-50 text-indigo-700"
                          : isDark
                          ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                      style={{ fontWeight: isActive ? 600 : 400 }}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} className={isActive ? (isDark ? "text-indigo-400" : "text-indigo-600") : ""} />
                        {tab.label}
                      </div>
                      {isActive && <ChevronRight size={14} className={isDark ? "text-indigo-400" : "text-indigo-500"} />}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex-1 min-w-0 space-y-5">
              <AnimatePresence mode="wait">
                {activeTab === "general" && (
                  <motion.div key="general" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                    <Section title="General Settings" desc="Basic platform configuration and defaults">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Platform Name">
                          <input type="text" value={platformName} onChange={(event) => setPlatformName(event.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Support Email">
                          <input type="email" value={supportEmail} onChange={(event) => setSupportEmail(event.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Platform URL">
                          <input type="url" value={platformUrl} onChange={(event) => setPlatformUrl(event.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Default Language">
                          <select value={language} onChange={(event) => setLanguage(event.target.value)} className={inputCls}>
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="ja">Japanese</option>
                          </select>
                        </Field>
                        <Field label="Profile Visibility Default">
                          <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className={inputCls}>
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="link">Link only</option>
                          </select>
                        </Field>
                        <Field label="Max Profiles per User">
                          <input type="number" min="1" max="1000" value={maxProfiles} onChange={(event) => setMaxProfiles(event.target.value)} className={inputCls} />
                        </Field>
                      </div>
                      <div className={`pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                        <ToggleRow label="Maintenance Mode" desc="Disable public access and show a maintenance page to all visitors" checked={maintenance} onChange={() => setMaintenance((value) => !value)} />
                      </div>
                      <div className="flex justify-end pt-2">
                        <SaveButton saved={generalSaved} saving={saving === "general"} onSave={() => void saveGeneral()} />
                      </div>
                    </Section>
                  </motion.div>
                )}

                {activeTab === "notifications" && (
                  <motion.div key="notifications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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
                        <SaveButton saved={notifSaved} saving={saving === "notifications"} onSave={() => void saveNotifications()} />
                      </div>
                    </Section>
                  </motion.div>
                )}

                {activeTab === "security" && (
                  <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Section title="Security Settings" desc="Control access policies and authentication requirements">
                      <div className="space-y-5">
                        <ToggleRow label="Require 2FA for Admin" desc="Enforce two-factor authentication for all admin accounts" checked={require2fa} onChange={() => setRequire2fa((value) => !value)} />
                        <div className={`border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />
                        <ToggleRow label="Force Re-auth on Settings" desc="Require password confirmation before saving security changes" checked={forceReauth} onChange={() => setForceReauth((value) => !value)} />
                        <div className={`border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          <Field label="Session Timeout">
                            <select value={sessionTimeout} onChange={(event) => setSessionTimeout(event.target.value)} className={inputCls}>
                              <option value="15">15 minutes</option>
                              <option value="30">30 minutes</option>
                              <option value="60">1 hour</option>
                              <option value="240">4 hours</option>
                              <option value="0">Never</option>
                            </select>
                          </Field>
                          <Field label="Max Login Attempts">
                            <input type="number" min="3" max="20" value={maxAttempts} onChange={(event) => setMaxAttempts(event.target.value)} className={inputCls} />
                          </Field>
                        </div>
                        <Field label="IP Allowlist (one per line)">
                          <textarea
                            rows={4}
                            value={ipAllowlist}
                            onChange={(event) => setIpAllowlist(event.target.value)}
                            placeholder={"e.g. 192.168.1.0/24\n10.0.0.1"}
                            className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors resize-none font-mono ${
                              isDark
                                ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500"
                                : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-400"
                            }`}
                          />
                        </Field>
                      </div>
                      <div className="flex justify-end pt-2">
                        <SaveButton saved={securitySaved} saving={saving === "security"} onSave={() => void saveSecurity()} />
                      </div>
                    </Section>
                  </motion.div>
                )}

                {activeTab === "api" && (
                  <motion.div key="api" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                    <Section title="API Keys" desc="Manage your platform API credentials and webhook configuration">
                      <div className="space-y-4">
                        <Field label="Current API Key">
                          <div className={`flex items-center gap-2 h-10 px-3 rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                            <code className={`flex-1 text-xs font-mono overflow-hidden ${isDark ? "text-slate-300" : "text-slate-700"}`}>{shownApiKey}</code>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => setApiKeyVisible((value) => !value)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-700" : "text-slate-400 hover:bg-slate-200"}`}>
                                {apiKeyVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                              <button onClick={copyApiKey} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? "text-slate-400 hover:bg-slate-700" : "text-slate-400 hover:bg-slate-200"}`}>
                                {apiCopied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                              </button>
                            </div>
                          </div>
                        </Field>

                        <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-amber-50 border-amber-200"}`}>
                          <div>
                            <p className={`text-sm ${isDark ? "text-slate-300" : "text-amber-900"}`} style={{ fontWeight: 600 }}>
                              Rotate API Key
                            </p>
                            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-amber-700"}`}>This invalidates your current key immediately.</p>
                          </div>
                          <button
                            onClick={() => void rotateApiKey()}
                            disabled={saving === "api"}
                            className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs transition-colors disabled:opacity-60 ${isDark ? "bg-slate-700 text-amber-400 hover:bg-slate-600" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                            style={{ fontWeight: 600 }}
                          >
                            <RefreshCw size={12} className={saving === "api" ? "animate-spin" : ""} />Rotate
                          </button>
                        </div>

                        <div className={`pt-2 border-t space-y-4 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                          <Field label="Webhook URL">
                            <input type="url" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder="https://your-server.com/webhook" className={inputCls} />
                          </Field>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <SaveButton saved={apiSaved} saving={saving === "api"} onSave={() => void saveApiConfig()} />
                      </div>
                    </Section>

                    <div className={`${card} p-5 sm:p-6`}>
                      <h3 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 700 }}>Issued API Keys</h3>
                      <div className={`mt-4 rounded-xl overflow-hidden border ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className={`${isDark ? "bg-slate-800/60 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                              <th className="text-left px-3 py-2" style={{ fontWeight: 600 }}>Name</th>
                              <th className="text-left px-3 py-2" style={{ fontWeight: 600 }}>Key</th>
                              <th className="text-left px-3 py-2" style={{ fontWeight: 600 }}>Created</th>
                              <th className="text-left px-3 py-2" style={{ fontWeight: 600 }}>Last Used</th>
                            </tr>
                          </thead>
                          <tbody>
                            {apiKeys.length === 0 && (
                              <tr>
                                <td colSpan={4} className={`px-3 py-4 text-center ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                  No API keys yet.
                                </td>
                              </tr>
                            )}
                            {apiKeys.map((key) => (
                              <tr key={key.id} className={`border-t ${isDark ? "border-slate-800 hover:bg-slate-800/40" : "border-slate-100 hover:bg-slate-50"}`}>
                                <td className={`px-3 py-2.5 ${isDark ? "text-slate-200" : "text-slate-800"}`} style={{ fontWeight: 600 }}>{key.name}</td>
                                <td className={`px-3 py-2.5 font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>{key.keyHash}</td>
                                <td className={`${isDark ? "text-slate-400" : "text-slate-500"} px-3 py-2.5`}>{formatDate(key.createdAt)}</td>
                                <td className={`${isDark ? "text-slate-400" : "text-slate-500"} px-3 py-2.5`}>{formatDate(key.lastUsedAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "danger" && (
                  <motion.div key="danger" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className={`rounded-2xl border ${isDark ? "bg-slate-900 border-rose-900/40" : "bg-white border-rose-200 shadow-sm"} overflow-hidden`}>
                      <div className={`flex items-center gap-3 p-5 border-b ${isDark ? "bg-rose-950/20 border-rose-900/40" : "bg-rose-50 border-rose-100"}`}>
                        <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                          <AlertTriangle size={17} className="text-rose-500" />
                        </div>
                        <div>
                          <h3 className={isDark ? "text-white" : "text-rose-900"} style={{ fontWeight: 700 }}>Danger Zone</h3>
                          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-rose-700"}`}>These actions are placeholders until dedicated backend endpoints are added.</p>
                        </div>
                      </div>

                      <div className="divide-y" style={{ borderColor: isDark ? "rgba(239,68,68,0.15)" : "#FEE2E2" }}>
                        {[
                          { id: "export", Icon: Download, label: "Export All Data", desc: "Download a complete archive of all profiles, tags, and analytics.", btnLabel: "Export", btnCls: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" },
                          { id: "clear", Icon: Database, label: "Clear Analytics Data", desc: "Permanently delete all tap events and analytics history.", btnLabel: "Clear Data", btnCls: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
                          { id: "reset", Icon: RotateCcw, label: "Reset NFC Assignments", desc: "Unlink all NFC tags from their profiles.", btnLabel: "Reset Tags", btnCls: "bg-orange-100 text-orange-700 hover:bg-orange-200" },
                          { id: "delete", Icon: Trash2, label: "Delete All Test Profiles", desc: "Remove all profiles marked as test data.", btnLabel: "Delete Tests", btnCls: "bg-rose-100 text-rose-700 hover:bg-rose-200" },
                        ].map((action) => {
                          const ActionIcon = action.Icon;
                          const isConfirming = activeConfirm === action.id;
                          return (
                            <div key={action.id} className={`p-5 transition-colors ${isDark ? "hover:bg-rose-950/10" : "hover:bg-rose-50/50"}`}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 min-w-0">
                                  <ActionIcon size={16} className={`mt-0.5 shrink-0 ${isDark ? "text-rose-400" : "text-rose-500"}`} />
                                  <div className="min-w-0">
                                    <p className={`text-sm ${isDark ? "text-slate-200" : "text-slate-900"}`} style={{ fontWeight: 600 }}>{action.label}</p>
                                    <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}>{action.desc}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setActiveConfirm(isConfirming ? null : action.id)}
                                  className={`shrink-0 h-8 px-3 rounded-lg text-xs transition-colors ${action.btnCls}`}
                                  style={{ fontWeight: 600 }}
                                >
                                  {isConfirming ? "Cancel" : action.btnLabel}
                                </button>
                              </div>

                              <AnimatePresence>
                                {isConfirming && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                    <div className={`mt-4 p-4 rounded-xl border ${isDark ? "bg-slate-800 border-rose-900/40" : "bg-rose-50 border-rose-200"}`}>
                                      <p className={`text-xs mb-3 ${isDark ? "text-slate-300" : "text-rose-800"}`}>
                                        Type <span style={{ fontWeight: 700 }}>CONFIRM</span> to acknowledge this action is not yet implemented.
                                      </p>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          placeholder="CONFIRM"
                                          value={confirmInput}
                                          onChange={(event) => setConfirmInput(event.target.value)}
                                          className={`flex-1 h-9 px-3 rounded-xl border text-sm outline-none font-mono ${isDark ? "bg-slate-700 border-rose-800 text-white placeholder:text-slate-500" : "bg-white border-rose-300 text-slate-800 placeholder:text-slate-400"}`}
                                        />
                                        <button
                                          disabled={confirmInput !== "CONFIRM"}
                                          onClick={() => {
                                            setActiveConfirm(null);
                                            setConfirmInput("");
                                            setNotice("This action requires a dedicated backend endpoint and is not available yet.");
                                          }}
                                          className="h-9 px-4 rounded-xl text-xs text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                          style={{ fontWeight: 600 }}
                                        >
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
