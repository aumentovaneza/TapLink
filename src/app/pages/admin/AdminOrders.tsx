import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link, useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import {
  Menu,
  RefreshCw,
  Search,
  Package,
  Download,
  AlertCircle,
  Truck,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { API_BASE_URL, ApiError, apiRequest } from "../../lib/api";
import { clearSession, getAccessToken } from "../../lib/session";

type OrderStatus = "pending" | "processing" | "ready" | "shipped" | "completed" | "cancelled";
type ProductType = "tag" | "card";

interface AdminOrderItem {
  id: string;
  productType: ProductType;
  quantity: number;
  useDefaultDesign: boolean;
  design: {
    baseColor: string;
    textColor: string;
    iconColor: string;
    primaryText: string;
    secondaryText: string;
    iconId: string;
  };
  status: OrderStatus;
  statusNote: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  profile: {
    id: string;
    slug: string;
    name: string;
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  processedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface AdminOrdersResponse {
  items: AdminOrderItem[];
}

interface UpdateOrderResponse {
  order: AdminOrderItem;
}

const STATUS_OPTIONS: OrderStatus[] = ["pending", "processing", "ready", "shipped", "completed", "cancelled"];

const STATUS_META: Record<
  OrderStatus,
  { label: string; cls: string; Icon: ComponentType<{ size?: number; className?: string }> }
> = {
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700", Icon: Clock3 },
  processing: { label: "Processing", cls: "bg-sky-100 text-sky-700", Icon: RefreshCw },
  ready: { label: "Ready", cls: "bg-indigo-100 text-indigo-700", Icon: Package },
  shipped: { label: "Shipped", cls: "bg-orange-100 text-orange-700", Icon: Truck },
  completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
  cancelled: { label: "Cancelled", cls: "bg-slate-100 text-slate-600", Icon: XCircle },
};

function formatDateTime(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatLabel(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractFilename(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) {
    return fallback;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).trim();
    } catch {
      return utf8Match[1].trim();
    }
  }

  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  if (match?.[1]) {
    return match[1].trim();
  }

  return fallback;
}

function filterOrders(
  items: AdminOrderItem[],
  search: string,
  status: "all" | OrderStatus,
  productType: "all" | ProductType
): AdminOrderItem[] {
  const query = search.trim().toLowerCase();
  return items.filter((item) => {
    const matchesSearch =
      query.length === 0 ||
      item.id.toLowerCase().includes(query) ||
      item.user?.name.toLowerCase().includes(query) ||
      item.user?.email.toLowerCase().includes(query) ||
      item.profile?.name.toLowerCase().includes(query) ||
      item.profile?.slug.toLowerCase().includes(query);

    const matchesStatus = status === "all" || item.status === status;
    const matchesType = productType === "all" || item.productType === productType;

    return matchesSearch && matchesStatus && matchesType;
  });
}

export function AdminOrders() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [productFilter, setProductFilter] = useState<"all" | ProductType>("all");
  const [draftStatus, setDraftStatus] = useState<Record<string, OrderStatus>>({});
  const [draftNote, setDraftNote] = useState<Record<string, string>>({});
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});
  const [exportingById, setExportingById] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const card = `rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`;

  const loadOrders = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");
    setNotice("");

    try {
      const response = await apiRequest<AdminOrdersResponse>("/admin/orders?page=1&pageSize=100", { auth: true });
      setOrders(response.items);
      setDraftStatus({});
      setDraftNote({});
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
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOrders(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => filterOrders(orders, search, statusFilter, productFilter),
    [orders, search, statusFilter, productFilter]
  );

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((item) => item.status === "pending").length,
      processing: orders.filter((item) => item.status === "processing").length,
      ready: orders.filter((item) => item.status === "ready").length,
      shipped: orders.filter((item) => item.status === "shipped").length,
      completed: orders.filter((item) => item.status === "completed").length,
      cancelled: orders.filter((item) => item.status === "cancelled").length,
    };
  }, [orders]);

  const updateOrderStatus = async (order: AdminOrderItem) => {
    const nextStatus = draftStatus[order.id] ?? order.status;
    const nextNote = (draftNote[order.id] ?? order.statusNote ?? "").trim();

    if (nextStatus === order.status && nextNote === (order.statusNote ?? "")) {
      return;
    }

    setSavingById((current) => ({ ...current, [order.id]: true }));
    setError("");
    setNotice("");

    try {
      const response = await apiRequest<UpdateOrderResponse>(`/admin/orders/${encodeURIComponent(order.id)}/status`, {
        method: "PATCH",
        auth: true,
        body: {
          status: nextStatus,
          statusNote: nextNote || undefined,
        },
      });

      setOrders((current) => current.map((item) => (item.id === response.order.id ? response.order : item)));
      setDraftStatus((current) => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });
      setDraftNote((current) => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });
      setNotice(`Order ${order.id.slice(-6)} updated.`);
      window.setTimeout(() => setNotice(""), 1800);
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
      setError(err instanceof Error ? err.message : "Unable to update order.");
    } finally {
      setSavingById((current) => ({ ...current, [order.id]: false }));
    }
  };

  const downloadBambuSvg = async (order: AdminOrderItem) => {
    const token = getAccessToken();
    if (!token) {
      clearSession();
      navigate("/login", { replace: true });
      return;
    }

    setExportingById((current) => ({ ...current, [order.id]: true }));
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${encodeURIComponent(order.id)}/bambu-svg`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      if (response.status === 403) {
        navigate("/my-tags", { replace: true });
        return;
      }

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const payload = (await response.json()) as { error?: unknown };
          const message = typeof payload.error === "string" ? payload.error : "Unable to export print file.";
          throw new Error(message);
        }

        const text = await response.text();
        throw new Error(text.trim() || "Unable to export print file.");
      }

      const blob = await response.blob();
      const fallbackName = `taplink-${order.productType}-${order.id.slice(-8)}-bambu-v1.svg`;
      const fileName = extractFilename(response.headers.get("content-disposition"), fallbackName);
      const objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);

      setNotice(`Bambu SVG exported for order ${order.id.slice(-6)}.`);
      window.setTimeout(() => setNotice(""), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to export print file.");
    } finally {
      setExportingById((current) => ({ ...current, [order.id]: false }));
    }
  };

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
                  Order Management
                </h1>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Process user hardware orders and update their status.
                </p>
              </div>
            </div>
            <button
              onClick={() => void loadOrders(true)}
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

        <div className="p-4 sm:p-6 lg:p-8 space-y-5">
          {(error || notice) && (
            <div className="space-y-2">
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

          <div className={`grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7 ${card} p-4`}>
            <div>
              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>Total</p>
              <p className="text-lg" style={{ fontWeight: 700 }}>{counts.all}</p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>Pending</p>
              <p className="text-lg" style={{ fontWeight: 700 }}>{counts.pending}</p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>Processing</p>
              <p className="text-lg" style={{ fontWeight: 700 }}>{counts.processing}</p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>Ready</p>
              <p className="text-lg" style={{ fontWeight: 700 }}>{counts.ready}</p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>Shipped</p>
              <p className="text-lg" style={{ fontWeight: 700 }}>{counts.shipped}</p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>Completed</p>
              <p className="text-lg" style={{ fontWeight: 700 }}>{counts.completed}</p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>Cancelled</p>
              <p className="text-lg" style={{ fontWeight: 700 }}>{counts.cancelled}</p>
            </div>
          </div>

          <div className={`${card} p-4 space-y-3`}>
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className={`relative flex-1 rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                <input
                  type="text"
                  placeholder="Search order id, customer, or profile..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className={`h-10 w-full bg-transparent pl-10 pr-4 text-sm outline-none ${isDark ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"}`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | OrderStatus)}
                className={`h-10 min-w-[10rem] rounded-xl border px-3 text-sm outline-none ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-slate-200"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {capitalize(status)}
                  </option>
                ))}
              </select>

              <select
                value={productFilter}
                onChange={(event) => setProductFilter(event.target.value as "all" | ProductType)}
                className={`h-10 min-w-[9rem] rounded-xl border px-3 text-sm outline-none ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-slate-200"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <option value="all">All Products</option>
                <option value="tag">Tag</option>
                <option value="card">Card</option>
              </select>
            </div>

            {loading ? (
              <div className={`rounded-xl border p-6 text-sm ${isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                Loading orders...
              </div>
            ) : filtered.length === 0 ? (
              <div className={`rounded-xl border p-6 text-sm ${isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                No orders match your filters.
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {filtered.map((order) => {
                    const meta = STATUS_META[order.status];
                    const StatusIcon = meta.Icon;
                    const nextStatus = draftStatus[order.id] ?? order.status;
                    const nextNote = draftNote[order.id] ?? order.statusNote ?? "";
                    const isDirty = nextStatus !== order.status || nextNote.trim() !== (order.statusNote ?? "");
                    const saving = Boolean(savingById[order.id]);
                    const exporting = Boolean(exportingById[order.id]);

                    return (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-800/40" : "border-slate-200 bg-slate-50"}`}
                      >
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.1fr_0.9fr_1fr]">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`text-sm ${isDark ? "text-slate-100" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                                #{order.id.slice(-8)}
                              </p>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${meta.cls}`}>
                                <StatusIcon size={12} />
                                {meta.label}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] ${isDark ? "bg-slate-700 text-slate-300" : "bg-white text-slate-600"}`}>
                                {order.productType.toUpperCase()} x{order.quantity}
                              </span>
                              {order.useDefaultDesign && (
                                <span className={`rounded-full px-2 py-0.5 text-[11px] ${isDark ? "bg-slate-700 text-slate-300" : "bg-white text-slate-600"}`}>
                                  Default design
                                </span>
                              )}
                            </div>

                            <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              {order.user ? `${order.user.name} · ${order.user.email}` : "Unknown user"}
                            </p>
                            <p className={`mt-0.5 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                              Created: {formatDateTime(order.createdAt)}
                              {order.processedAt ? ` · Processed: ${formatDateTime(order.processedAt)}` : ""}
                            </p>
                            {order.profile && (
                              <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                Linked profile:{" "}
                                <Link
                                  to={`/profile/${encodeURIComponent(order.profile.slug)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={isDark ? "text-slate-300 hover:text-white underline" : "text-slate-700 hover:text-slate-900 underline"}
                                >
                                  {order.profile.name}
                                </Link>
                              </p>
                            )}
                          </div>

                          <div className={`rounded-lg border px-3 py-2 ${isDark ? "border-slate-700 bg-slate-900/40" : "border-slate-200 bg-white"}`}>
                            <p className={`text-[11px] uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-500"}`} style={{ fontWeight: 700 }}>
                              Design Snapshot
                            </p>
                            <div className="mt-2 space-y-2">
                              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                                {[
                                  { label: `${capitalize(order.productType)} Body`, value: order.design.baseColor },
                                  { label: "Text", value: order.design.textColor },
                                  { label: "Icon", value: order.design.iconColor },
                                ].map((item) => (
                                  <div
                                    key={item.label}
                                    className={`flex items-center gap-1.5 rounded-md border px-1.5 py-1 ${
                                      isDark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-white"
                                    }`}
                                  >
                                    <span className="h-4 w-4 flex-shrink-0 rounded border border-slate-300" style={{ background: item.value }} />
                                    <div className="min-w-0">
                                      <p className={`text-[10px] uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 700 }}>
                                        {item.label}
                                      </p>
                                      <p className={`truncate text-[11px] ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontWeight: 600 }}>
                                        {item.value}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="min-w-0">
                                <p className={`truncate text-xs ${isDark ? "text-slate-200" : "text-slate-700"}`} style={{ fontWeight: 600 }}>
                                  {order.design.primaryText}
                                </p>
                                {order.design.secondaryText && (
                                  <p className={`truncate text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    {order.design.secondaryText}
                                  </p>
                                )}
                                <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                  <p>
                                    <span className={isDark ? "text-slate-500" : "text-slate-600"} style={{ fontWeight: 700 }}>
                                      Type:
                                    </span>{" "}
                                    {capitalize(order.productType)}
                                  </p>
                                  <p>
                                    <span className={isDark ? "text-slate-500" : "text-slate-600"} style={{ fontWeight: 700 }}>
                                      Icon:
                                    </span>{" "}
                                    {order.design.iconId ? formatLabel(order.design.iconId) : "None"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className={`rounded-lg border px-3 py-2 ${isDark ? "border-slate-700 bg-slate-900/40" : "border-slate-200 bg-white"}`}>
                            <p className={`text-[11px] uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-500"}`} style={{ fontWeight: 700 }}>
                              Admin Processing
                            </p>
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                              <select
                                value={nextStatus}
                                onChange={(event) =>
                                  setDraftStatus((current) => ({
                                    ...current,
                                    [order.id]: event.target.value as OrderStatus,
                                  }))
                                }
                                className={`h-9 min-w-[9rem] rounded-lg border px-2 text-sm outline-none ${
                                  isDark
                                    ? "border-slate-700 bg-slate-800 text-slate-200"
                                    : "border-slate-300 bg-white text-slate-700"
                                }`}
                              >
                                {STATUS_OPTIONS.map((status) => (
                                  <option key={status} value={status}>
                                    {capitalize(status)}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="text"
                                maxLength={240}
                                value={nextNote}
                                onChange={(event) =>
                                  setDraftNote((current) => ({
                                    ...current,
                                    [order.id]: event.target.value,
                                  }))
                                }
                                placeholder="Optional status note"
                                className={`h-9 min-w-0 flex-1 rounded-lg border px-2 text-sm outline-none ${
                                  isDark
                                    ? "border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-500"
                                    : "border-slate-300 bg-white text-slate-700 placeholder:text-slate-400"
                                }`}
                              />
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                                {order.processedBy ? `Last update by ${order.processedBy.name}` : "Not processed yet"}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => void downloadBambuSvg(order)}
                                  disabled={exporting}
                                  className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-all disabled:opacity-50 ${
                                    isDark ? "border-slate-600 bg-slate-800 text-slate-200" : "border-slate-300 bg-white text-slate-700"
                                  }`}
                                  style={{ fontWeight: 600 }}
                                >
                                  <Download size={12} />
                                  {exporting ? "Exporting..." : "Bambu SVG"}
                                </button>
                                <button
                                  onClick={() => void updateOrderStatus(order)}
                                  disabled={!isDirty || saving}
                                  className="rounded-lg px-3 py-1.5 text-xs text-white transition-all disabled:opacity-50"
                                  style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 600 }}
                                >
                                  {saving ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
