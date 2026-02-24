import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTheme } from "next-themes";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";

import { API_BASE_URL, ApiError, apiRequest } from "../lib/api";
import { clearAccessToken, getAccessToken } from "../lib/session";

type ProductType = "tag" | "card";
type OrderStatus = "pending" | "processing" | "ready" | "shipped" | "completed" | "cancelled";
type PaymentStatus = "awaiting_confirmation" | "confirmed" | "expired" | "cancelled";

interface PaymentOrder {
  id: string;
  productType: ProductType;
  quantity: number;
  status: OrderStatus;
  statusNote: string | null;
  createdAt: string;
  payment: {
    status: PaymentStatus;
    transactionId: string;
    amountPhp: number;
    currency: "PHP";
    unitPricePhp: number;
    expiresAt: string;
    confirmedAt: string | null;
    reference: string | null;
    receipt: {
      fileName: string;
      storagePath: string;
      mimeType: string;
      sizeBytes: number;
      uploadedAt: string;
    } | null;
  };
  timeline: {
    expectedProcessingAt: string;
    expectedDoneAt: string;
    expectedSentAt: string;
  } | null;
}

interface PaymentPageResponse {
  order: PaymentOrder;
  paymentWindowMinutes: number;
  countdownMs: number;
  paymentMethods: Array<{
    id: string;
    label: string;
    qrImagePath: string | null;
    uploadedAt: string | null;
  }>;
}

function shouldRedirectFromPaymentPage(order: PaymentOrder): boolean {
  return (
    order.payment.status === "expired" ||
    order.payment.status === "cancelled" ||
    order.status === "cancelled" ||
    order.status === "shipped" ||
    order.status === "completed"
  );
}

function formatDateTime(input: string | null): string {
  if (!input) {
    return "—";
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function paymentStatusLabel(status: PaymentStatus): string {
  if (status === "awaiting_confirmation") {
    return "Awaiting Confirmation";
  }
  if (status === "confirmed") {
    return "Confirmed";
  }
  if (status === "expired") {
    return "Expired";
  }
  return "Cancelled";
}

export function OrderPayment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [countdownMs, setCountdownMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentPageResponse["paymentMethods"]>([]);
  const [fullViewQr, setFullViewQr] = useState<{ src: string; label: string } | null>(null);

  const isAwaiting = order?.payment.status === "awaiting_confirmation" && order.status === "pending";

  const loadPaymentPage = async () => {
    if (!orderId) {
      setError("Missing order ID.");
      setLoading(false);
      return;
    }

    if (!getAccessToken()) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<PaymentPageResponse>(`/orders/${encodeURIComponent(orderId)}/payment`, { auth: true });

      if (shouldRedirectFromPaymentPage(response.order)) {
        navigate("/my-tags", { replace: true });
        return;
      }

      setOrder(response.order);
      setCountdownMs(response.countdownMs);
      setReference(response.order.payment.reference ?? "");
      setPaymentMethods(response.paymentMethods ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAccessToken();
        navigate("/login", { replace: true });
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        navigate("/my-tags", { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to load payment page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPaymentPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (!isAwaiting) {
      return;
    }
    const timer = window.setInterval(() => {
      setCountdownMs((current) => {
        if (current <= 1000) {
          window.clearInterval(timer);
          void loadPaymentPage();
          return 0;
        }
        return current - 1000;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAwaiting, order?.id]);

  const isReceiptTooLarge = useMemo(() => (receipt ? receipt.size > 5 * 1024 * 1024 : false), [receipt]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!fullViewQr) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullViewQr(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullViewQr]);

  const handleReceiptChange = (file: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setReceipt(file);
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const copyTransactionId = async () => {
    if (!order?.payment.transactionId) {
      return;
    }
    try {
      await navigator.clipboard.writeText(order.payment.transactionId);
      setNotice("Transaction ID copied.");
      window.setTimeout(() => setNotice(""), 1400);
    } catch {
      // Ignore clipboard errors.
    }
  };

  const submitPayment = async () => {
    if (!orderId || !isAwaiting) {
      return;
    }
    if (!receipt) {
      setError("Please upload your receipt before submitting payment.");
      return;
    }
    if (isReceiptTooLarge) {
      setError("Receipt image is too large. Max 5MB.");
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const formData = new FormData();
      formData.append("receipt", receipt);
      if (reference.trim()) {
        formData.append("reference", reference.trim());
      }

      const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/payment/confirm`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${getAccessToken() ?? ""}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        clearAccessToken();
        navigate("/login", { replace: true });
        return;
      }

      const payload = (await response.json()) as { order?: PaymentOrder; error?: string };
      if (!response.ok || !payload.order) {
        throw new Error(payload.error || "Unable to confirm payment.");
      }

      setOrder(payload.order);
      setNotice("Payment confirmed. Confirmation email sent. Order now queued for production.");
      setCountdownMs(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to confirm payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelOrder = async () => {
    if (!orderId || !isAwaiting) {
      return;
    }
    setCancelling(true);
    setError("");
    setNotice("");
    try {
      const response = await apiRequest<{ order: PaymentOrder }>(`/orders/${encodeURIComponent(orderId)}/payment/cancel`, {
        method: "POST",
        auth: true,
      });
      setOrder(response.order);
      setCountdownMs(0);
      setNotice("Order cancelled and email notice sent.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAccessToken();
        navigate("/login", { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className={`min-h-screen pt-20 pb-12 ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin" />
          </div>
        ) : !order ? (
          <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-rose-900/40 bg-rose-950/20 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            {error || "Order not found."}
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Payment Required
                </h1>
                <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Transaction ID: {order.payment.transactionId}
                </p>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 ${isDark ? "bg-slate-900 border border-slate-700" : "bg-blue-50 border border-blue-200 text-blue-700"}`}>
                <Clock3 size={16} />
                {isAwaiting ? (
                  <span style={{ fontWeight: 700 }}>{formatCountdown(countdownMs)} to complete payment</span>
                ) : (
                  <span style={{ fontWeight: 700 }}>{paymentStatusLabel(order.payment.status)}</span>
                )}
              </div>
            </div>

            {(error || notice) && (
              <div className="mb-4 space-y-2">
                {error && (
                  <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-rose-900/40 bg-rose-950/20 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                    <div className="flex items-center gap-2">
                      <AlertCircle size={15} />
                      {error}
                    </div>
                  </div>
                )}
                {notice && (
                  <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-emerald-900/40 bg-emerald-950/20 text-emerald-300" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} />
                      {notice}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <section className={`rounded-2xl border p-5 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
                <p className={`text-xl ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800 }}>
                  1. Scan to Pay
                </p>
                <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Pay PHP {order.payment.amountPhp.toLocaleString("en-PH")} for order #{order.id.slice(-8)}.
                </p>

                {paymentMethods.length === 0 && (
                  <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${isDark ? "border-amber-900/40 bg-amber-950/20 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                    No payment methods are configured yet. Please contact support before submitting payment.
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3">
                  {paymentMethods.map((method) => {
                    const qrImageUrl = method.qrImagePath ? `${API_BASE_URL}${method.qrImagePath}` : null;

                    return (
                      <div key={method.id} className={`rounded-xl border p-4 text-center ${isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                      <div
                        className={`mx-auto mb-3 flex h-[360px] w-full max-w-[360px] items-center justify-center overflow-hidden rounded-lg border p-3 ${
                          isDark ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-300 bg-white text-slate-500"
                        }`}
                      >
                        {qrImageUrl ? (
                          <button
                            type="button"
                            onClick={() => setFullViewQr({ src: qrImageUrl, label: method.label })}
                            className="h-full w-full cursor-zoom-in"
                          >
                            <img src={qrImageUrl} alt={`${method.label} screenshot`} className="h-full w-full object-contain" />
                          </button>
                        ) : (
                          <span className="px-2 text-xs">QR not uploaded</span>
                        )}
                      </div>
                      <p className={isDark ? "text-slate-200" : "text-slate-700"} style={{ fontWeight: 700 }}>
                        {method.label}
                      </p>
                      {qrImageUrl && (
                        <p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>Click QR for full view</p>
                      )}
                    </div>
                    );
                  })}
                </div>

                <div className={`mt-4 rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                  <p className={isDark ? "text-slate-300" : "text-slate-700"} style={{ fontWeight: 700 }}>
                    Payment Information
                  </p>
                  <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Transaction ID: {order.payment.transactionId}
                  </p>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Amount: PHP {order.payment.amountPhp.toLocaleString("en-PH")}
                  </p>
                  <button
                    onClick={() => void copyTransactionId()}
                    className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      isDark ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    <Copy size={12} />
                    Copy Transaction ID
                  </button>
                </div>

                <div className={`mt-4 rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                  <p className={isDark ? "text-slate-300" : "text-slate-700"} style={{ fontWeight: 700 }}>
                    Expected Timeline (after payment confirmation)
                  </p>
                  <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Processing: within 10 days
                  </p>
                  {order.timeline && (
                    <>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Processing target: {formatDateTime(order.timeline.expectedProcessingAt)}
                      </p>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Done target: {formatDateTime(order.timeline.expectedDoneAt)}
                      </p>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Sent target: {formatDateTime(order.timeline.expectedSentAt)}
                      </p>
                    </>
                  )}
                </div>
              </section>

              <section className={`rounded-2xl border p-5 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
                <p className={`text-xl ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800 }}>
                  2. Upload Receipt
                </p>
                <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Upload your proof of payment to confirm your order.
                </p>

                <label
                  className={`mt-4 block rounded-xl border-2 border-dashed p-4 text-center ${
                    isDark ? "border-slate-700 bg-slate-950" : "border-slate-300 bg-slate-50"
                  } ${isAwaiting ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={!isAwaiting}
                    className="hidden"
                    onChange={(event) => handleReceiptChange(event.target.files?.[0] ?? null)}
                  />
                  {previewUrl ? (
                    <img src={previewUrl} alt="Receipt preview" className="mx-auto max-h-72 rounded-lg object-contain" />
                  ) : (
                    <div className="py-16">
                      <Upload className={`mx-auto mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <p className={isDark ? "text-slate-300" : "text-slate-700"} style={{ fontWeight: 600 }}>
                        Click to upload image
                      </p>
                      <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-500"}`}>PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </label>

                <div className="mt-4">
                  <label className={`mb-1 block text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ fontWeight: 600 }}>
                    Reference (optional)
                  </label>
                  <input
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    disabled={!isAwaiting}
                    maxLength={80}
                    placeholder="Reference number / notes"
                    className={`h-10 w-full rounded-lg border px-3 text-sm outline-none ${
                      isDark
                        ? "border-slate-700 bg-slate-950 text-slate-200 placeholder:text-slate-500"
                        : "border-slate-300 bg-white text-slate-700 placeholder:text-slate-400"
                    } ${isAwaiting ? "" : "opacity-60"}`}
                  />
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => void submitPayment()}
                    disabled={!isAwaiting || submitting || !receipt || isReceiptTooLarge}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm text-white transition-all disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)", fontWeight: 700 }}
                  >
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    {submitting ? "Submitting..." : "Submit Payment"}
                  </button>
                  <button
                    onClick={() => void cancelOrder()}
                    disabled={!isAwaiting || cancelling}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm text-white transition-all disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #DC2626, #B91C1C)", fontWeight: 700 }}
                  >
                    {cancelling ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                    {cancelling ? "Cancelling..." : "Cancel Order"}
                  </button>
                </div>

                {order.payment.status === "confirmed" && (
                  <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${isDark ? "border-emerald-900/40 bg-emerald-950/20 text-emerald-300" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                    Payment confirmed at {formatDateTime(order.payment.confirmedAt)}. Your order is now processing.
                  </div>
                )}
                {order.payment.status === "expired" && (
                  <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${isDark ? "border-rose-900/40 bg-rose-950/20 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                    Payment window expired. The order was cancelled and an email notification was sent.
                  </div>
                )}
              </section>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to="/my-tags"
                className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
                  isDark ? "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                style={{ fontWeight: 600 }}
              >
                Back to My Tags
              </Link>
              <button
                onClick={() => void loadPaymentPage()}
                className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
                  isDark ? "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                style={{ fontWeight: 600 }}
              >
                Refresh
              </button>
            </div>
          </>
        )}
      </div>

      {fullViewQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setFullViewQr(null)}>
          <div
            className={`w-full max-w-5xl rounded-2xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className={`text-sm ${isDark ? "text-slate-200" : "text-slate-700"}`} style={{ fontWeight: 700 }}>
                {fullViewQr.label}
              </p>
              <button
                type="button"
                onClick={() => setFullViewQr(null)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs ${
                  isDark ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
                style={{ fontWeight: 600 }}
              >
                <XCircle size={13} />
                Close
              </button>
            </div>
            <div className={`rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
              <img src={fullViewQr.src} alt={`${fullViewQr.label} full view`} className="mx-auto max-h-[82vh] w-auto max-w-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
