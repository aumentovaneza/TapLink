import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTheme } from "next-themes";
import { ArrowLeft, Bell, Clock, Mail, MapPin, MessageSquare, Phone, RefreshCw, Tag } from "lucide-react";

import { ApiError, apiRequest } from "../lib/api";
import { clearAccessToken } from "../lib/session";

interface ApiTagProfile {
  id: string;
  slug: string;
  name: string;
  title: string;
  templateType: string;
  theme: string;
  photo: string | null;
  isPublished: boolean;
}

interface ApiTagSummary {
  id: string;
  tagCode: string;
  claimCode: string | null;
  uid: string | null;
  status: "active" | "inactive" | "unclaimed";
  taps: number;
  lastTap: string;
  createdAt: string;
  profileId: string | null;
  responseCount: number;
  unreadResponses: number;
  profile: ApiTagProfile | null;
}

interface ApiTagResponseItem {
  id: string;
  submittedAt: string;
  petName: string | null;
  reporterName: string;
  reporterEmail: string | null;
  reporterPhone: string | null;
  location: string | null;
  message: string;
  isUnread: boolean;
}

interface TagResponsesPayload {
  tag: ApiTagSummary;
  responses: ApiTagResponseItem[];
  unreadCount: number;
  lastViewedAt: string | null;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TagResponses() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { tagId } = useParams<{ tagId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [error, setError] = useState("");
  const [tag, setTag] = useState<ApiTagSummary | null>(null);
  const [responses, setResponses] = useState<ApiTagResponseItem[]>([]);
  const [lastViewedAt, setLastViewedAt] = useState<string | null>(null);

  const unreadCount = useMemo(() => responses.reduce((total, item) => total + (item.isUnread ? 1 : 0), 0), [responses]);

  const markResponsesAsRead = async (resolvedTagId: string) => {
    setMarkingRead(true);
    try {
      const result = await apiRequest<{ ok: boolean; viewedAt: string | null }>(
        `/tags/${encodeURIComponent(resolvedTagId)}/responses/read`,
        { method: "POST", auth: true }
      );
      setResponses((previous) => previous.map((item) => ({ ...item, isUnread: false })));
      setTag((previous) => (previous ? { ...previous, unreadResponses: 0 } : previous));
      setLastViewedAt(result.viewedAt);
    } catch {
      // Keep page usable even if read receipt fails.
    } finally {
      setMarkingRead(false);
    }
  };

  const loadResponses = async () => {
    if (!tagId) {
      setError("Tag not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = await apiRequest<TagResponsesPayload>(`/tags/${encodeURIComponent(tagId)}/responses`, { auth: true });
      setTag(payload.tag);
      setResponses(payload.responses);
      setLastViewedAt(payload.lastViewedAt);

      if (payload.unreadCount > 0) {
        void markResponsesAsRead(payload.tag.id);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAccessToken();
        navigate("/login", { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to load responses.");
      setTag(null);
      setResponses([]);
      setLastViewedAt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResponses();
  }, [tagId]);

  return (
    <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/my-tags"
              className={`mb-2 inline-flex items-center gap-1.5 text-sm ${isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}
            >
              <ArrowLeft size={14} />
              Back to My Tags
            </Link>
            <h1 className={`text-2xl ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
              Responses
            </h1>
            <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Lost-pet sightings reported for this tag.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadResponses();
            }}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
              isDark ? "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
            style={{ fontWeight: 600 }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${isDark ? "border-rose-900/50 bg-rose-950/30 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            {error}
          </div>
        )}

        {tag && (
          <div className={`mb-4 rounded-2xl border p-4 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white shadow-sm"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontWeight: 700 }}>
                  {tag.profile?.name || `Tag ${tag.tagCode}`}
                </p>
                <p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Tag code: {tag.tagCode}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`} style={{ fontWeight: 600 }}>
                  <Tag size={11} />
                  {tag.responseCount} total
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${unreadCount > 0 ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`} style={{ fontWeight: 700 }}>
                  <Bell size={11} />
                  {unreadCount} new
                </span>
              </div>
            </div>
            {lastViewedAt && (
              <p className={`mt-3 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Last viewed: {formatDateTime(lastViewedAt)}{markingRead ? " (updating...)" : ""}
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className={`h-32 animate-pulse rounded-2xl ${isDark ? "bg-slate-900" : "bg-white"}`} />
            ))}
          </div>
        ) : responses.length === 0 ? (
          <div className={`rounded-2xl border px-5 py-8 text-center ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white shadow-sm"}`}>
            <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
              <MessageSquare size={16} />
            </div>
            <p className={`${isDark ? "text-slate-200" : "text-slate-800"} text-sm`} style={{ fontWeight: 700 }}>
              No responses yet
            </p>
            <p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              When someone reports a sighting, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {responses.map((response) => (
              <div
                key={response.id}
                className={`rounded-2xl border p-4 ${
                  response.isUnread
                    ? isDark
                      ? "border-rose-800/70 bg-rose-950/20"
                      : "border-rose-200 bg-rose-50/50"
                    : isDark
                    ? "border-slate-800 bg-slate-900"
                    : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
                      {response.reporterName}
                    </p>
                    <p className={`mt-0.5 inline-flex items-center gap-1 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                      <Clock size={11} />
                      {formatDateTime(response.submittedAt)}
                    </p>
                  </div>
                  {response.isUnread && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white" style={{ fontWeight: 700 }}>
                      New
                    </span>
                  )}
                </div>

                <p className={`rounded-xl px-3 py-2 text-sm ${isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"}`}>
                  {response.message || "No message provided."}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  {response.location && (
                    <span className={`inline-flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      <MapPin size={11} />
                      {response.location}
                    </span>
                  )}
                  {response.reporterEmail && (
                    <a
                      href={`mailto:${response.reporterEmail}`}
                      className={`inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 ${isDark ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                    >
                      <Mail size={11} />
                      {response.reporterEmail}
                    </a>
                  )}
                  {response.reporterPhone && (
                    <a
                      href={`tel:${response.reporterPhone}`}
                      className={`inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 ${isDark ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                    >
                      <Phone size={11} />
                      {response.reporterPhone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
