import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Copy,
  Edit,
  ExternalLink,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Share2,
  Send,
  TrendingUp,
  Twitter,
  UtensilsCrossed,
  X,
  Youtube,
  Zap,
} from "lucide-react";

import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { getGradient, getTheme } from "../data/themes";
import { ApiError, apiRequest } from "../lib/api";
import { parseCafeMenuSections } from "../lib/cafeMenu";
import { getAccessToken } from "../lib/session";

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";
const DEFAULT_PROFILE_SLUG = "alex-rivera";

const linkIcons: Record<string, typeof Globe> = {
  website: Globe,
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
  github: Github,
  email: Mail,
  phone: Phone,
  youtube: Youtube,
};

interface ProfileLink {
  id: string;
  type: string;
  label: string;
  url: string;
  position: number;
}

interface ProfileRecord {
  id: string;
  slug: string;
  templateType: string;
  theme: string;
  palette: string;
  showGraphic: boolean;
  photoUrl: string | null;
  fields: Record<string, string>;
  links: ProfileLink[];
  tagId: string | null;
  tagCode: string | null;
}

interface ProfileResponse {
  profile: ProfileRecord;
}

interface MineItem {
  profile: { id: string; slug: string } | null;
}

interface MineResponse {
  items: MineItem[];
}

interface ScanResponse {
  state: "active" | "inactive" | "unclaimed" | "unpublished" | "error";
  claimCode?: string | null;
  profile?: {
    id?: string;
    slug?: string;
    gradient?: string;
    tapCount?: number;
  };
}

interface DisplayProfile {
  name: string;
  subtitle: string;
  location: string;
  bio: string;
  badges: string[];
}

interface ContactFieldMap {
  key: string;
  type: string;
  label: string;
}

interface PetReportForm {
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  location: string;
  message: string;
}

function QRCodeSVG({ size = 120 }: { size?: number }) {
  const cells: JSX.Element[] = [];
  const grid = 21;
  const cellSize = size / grid;

  for (let row = 0; row < grid; row += 1) {
    for (let col = 0; col < grid; col += 1) {
      const inTopLeft = row < 7 && col < 7;
      const inTopRight = row < 7 && col >= grid - 7;
      const inBottomLeft = row >= grid - 7 && col < 7;

      let fillCell = false;

      if (inTopLeft || inTopRight || inBottomLeft) {
        const localRow = inBottomLeft ? row - (grid - 7) : row;
        const localCol = inTopRight ? col - (grid - 7) : col;

        if (localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6) {
          fillCell = true;
        } else if (localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4) {
          fillCell = true;
        }
      } else {
        fillCell = ((row * 17 + col * 31 + row * col * 7) % 11) < 5;
      }

      if (fillCell) {
        cells.push(
          <rect
            key={`${row}-${col}`}
            x={col * cellSize}
            y={row * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#1e293b"
          />
        );
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" />
      {cells}
    </svg>
  );
}

function resolveLinkUrl(raw: string): string | null {
  const value = raw.trim();

  if (!value) {
    return null;
  }
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("mailto:") || value.startsWith("tel:")) {
    return value;
  }
  if (value.includes("@") && !value.includes(" ")) {
    return `mailto:${value}`;
  }
  if (/^\+?[0-9][0-9\s\-()]{6,}$/.test(value)) {
    return `tel:${value.replace(/\s+/g, "")}`;
  }

  return `https://${value}`;
}

function normalizeComparableHref(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized.replace(/\/+$/, "");
  }

  return normalized;
}

function buildContactLinks(fields: Record<string, string>, existingLinks: ProfileLink[]): ProfileLink[] {
  const mappings: ContactFieldMap[] = [
    { key: "email", type: "email", label: "Email" },
    { key: "phone", type: "phone", label: "Phone" },
    { key: "website", type: "website", label: "Website / Portfolio" },
    { key: "ownerEmail", type: "email", label: "Owner Email" },
    { key: "ownerPhone", type: "phone", label: "Owner Phone" },
    { key: "orgEmail", type: "email", label: "Contact Email" },
    { key: "orgPhone", type: "phone", label: "Contact Phone" },
    { key: "bookingEmail", type: "email", label: "Booking Email" },
  ];

  const used = new Set<string>();
  for (const link of existingLinks) {
    const href = normalizeComparableHref(resolveLinkUrl(link.url));
    if (href) {
      used.add(href);
    }
  }

  const generated: ProfileLink[] = [];

  mappings.forEach((mapping, index) => {
    const raw = fields[mapping.key]?.trim();
    if (!raw) {
      return;
    }

    const href = normalizeComparableHref(resolveLinkUrl(raw));
    if (!href || used.has(href)) {
      return;
    }

    used.add(href);
    generated.push({
      id: `contact-${mapping.key}`,
      type: mapping.type,
      label: mapping.label,
      url: raw,
      position: 10_000 + index,
    });
  });

  return generated;
}

function isPetMarkedLost(fields: Record<string, string>): boolean {
  const raw = fields.isLost?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes" || raw === "lost";
}

function deriveProfile(fields: Record<string, string>, slug: string): DisplayProfile {
  const name = fields.name || slug;
  const primary = fields.title || fields.category || fields.species || fields.cuisine || fields.type || fields.creativeType || "";
  const secondary = fields.company || fields.tagline || fields.breed || fields.city || fields.date || fields.status || "";
  const subtitle = [primary, secondary].filter(Boolean).join(" · ");
  const location = fields.location || fields.city || fields.address || fields.venueName || "";
  const bio = fields.bio || fields.tagline || "";

  const badges = Array.from(
    new Set(
      [
        fields.company,
        fields.category,
        fields.species,
        fields.breed,
        fields.cuisine,
        fields.type,
        fields.status,
      ].filter((value): value is string => Boolean(value && value.trim()))
    )
  ).slice(0, 3);

  return {
    name,
    subtitle,
    location,
    bio,
    badges,
  };
}

function createShareUrl(slug: string): string {
  if (typeof window === "undefined") {
    return `https://taplink.local/profile/${slug}`;
  }
  return `${window.location.origin}/profile/${slug}`;
}

function getDeviceName(): string {
  if (typeof navigator === "undefined") {
    return "web";
  }
  return navigator.userAgent.slice(0, 80);
}

async function resolveProfileId(paramId?: string): Promise<string> {
  if (paramId) {
    return paramId;
  }

  if (!getAccessToken()) {
    return DEFAULT_PROFILE_SLUG;
  }

  try {
    const mine = await apiRequest<MineResponse>("/tags/mine", { auth: true });
    const firstProfile = mine.items.find((item) => item.profile)?.profile;
    return firstProfile?.slug || firstProfile?.id || DEFAULT_PROFILE_SLUG;
  } catch {
    return DEFAULT_PROFILE_SLUG;
  }
}

export function ProfileView() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const trackedVisitKeysRef = useRef<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimPathForUnavailable, setClaimPathForUnavailable] = useState<string | null>(null);
  const [showMyTagsForUnavailable, setShowMyTagsForUnavailable] = useState(false);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [scanGradient, setScanGradient] = useState<string | null>(null);
  const [tapCount, setTapCount] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [clickedLink, setClickedLink] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState<PetReportForm>({
    reporterName: "",
    reporterEmail: "",
    reporterPhone: "",
    location: "",
    message: "",
  });
  const [reportErrors, setReportErrors] = useState<Record<string, string>>({});
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    setClaimPathForUnavailable(null);
    setShowMyTagsForUnavailable(false);

    try {
      const resolvedId = await resolveProfileId(id);
      let response: ProfileResponse | null = null;

      try {
        response = await apiRequest<ProfileResponse>(`/profiles/${encodeURIComponent(resolvedId)}`, { auth: true });
      } catch (profileError) {
        if (profileError instanceof ApiError && profileError.status === 404 && id) {
          const scanByTag = await apiRequest<ScanResponse>(`/scan/${encodeURIComponent(id)}`);

          if (scanByTag.state === "unclaimed") {
            const encodedClaimCode = scanByTag.claimCode ? encodeURIComponent(scanByTag.claimCode) : null;
            setClaimPathForUnavailable(encodedClaimCode ? `/claim/${encodedClaimCode}` : "/claim");
            setError("This tag has not been claimed yet. Claim it to activate a profile.");
            setProfile(null);
            setTapCount(null);
            setScanGradient(null);
            return;
          }

          if (scanByTag.state === "unpublished") {
            setError("This profile is not published yet.");
            setShowMyTagsForUnavailable(Boolean(getAccessToken()));
            setProfile(null);
            setTapCount(null);
            setScanGradient(null);
            return;
          }

          if (scanByTag.state === "active" || scanByTag.state === "inactive") {
            const scanProfileId = scanByTag.profile?.slug || scanByTag.profile?.id;
            if (scanProfileId && scanProfileId !== resolvedId) {
              navigate(`/profile/${encodeURIComponent(scanProfileId)}?source=scan`, { replace: true });
              return;
            }
          }
        }

        throw profileError;
      }

      if (!response) {
        throw new Error("Unable to load this profile.");
      }

      setProfile(response.profile);

      if (response.profile.tagCode) {
        try {
          const scan = await apiRequest<ScanResponse>(`/scan/${encodeURIComponent(response.profile.tagCode)}`);
          setTapCount(scan.profile?.tapCount ?? null);
          setScanGradient(scan.profile?.gradient ?? null);
        } catch {
          setTapCount(null);
          setScanGradient(null);
        }
      } else {
        setTapCount(null);
        setScanGradient(null);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load this profile.");
      setProfile(null);
      setTapCount(null);
      setScanGradient(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, [id]);

  useEffect(() => {
    if (!profile?.id || !profile.tagId || import.meta.env.DEV) {
      return;
    }

    const sourceParam = new URLSearchParams(location.search).get("source");
    const source = sourceParam === "scan" || sourceParam === "share" || sourceParam === "qr" ? sourceParam : "direct";
    const trackKey = `${profile.id}:${source}`;
    if (trackedVisitKeysRef.current.has(trackKey)) {
      return;
    }
    trackedVisitKeysRef.current.add(trackKey);

    const referrer = typeof document === "undefined" ? undefined : document.referrer.slice(0, 200);

    void apiRequest<{ ok: boolean }>("/events/profile-visit", {
      method: "POST",
      body: {
        profileId: profile.id,
        source,
        device: getDeviceName(),
        referrer,
      },
    }).catch(() => {
      // Keep public profile interaction smooth even if analytics logging fails.
    });
  }, [profile?.id, profile?.tagId, location.search]);

  const display = useMemo(() => {
    if (!profile) {
      return null;
    }

    return deriveProfile(profile.fields, profile.slug);
  }, [profile]);

  const gradientInfo = useMemo(() => {
    if (!profile) {
      return null;
    }

    return getGradient(profile.theme || "wave", profile.palette || "original");
  }, [profile]);

  const themeDef = profile ? getTheme(profile.theme || "wave") : null;
  const ThemeGraphic = themeDef?.Graphic;
  const cardGradient = scanGradient || gradientInfo?.gradient || themeDef?.gradient || "linear-gradient(135deg, #DC2626, #EA580C)";
  const textColor = gradientInfo?.text || themeDef?.text || "#fff";
  const shareUrl = profile ? createShareUrl(profile.slug) : "";
  const petLost = profile?.templateType === "pet" && isPetMarkedLost(profile.fields);
  const ownerName = profile?.fields.ownerName?.trim() || "";
  const ownerPhone = profile?.fields.ownerPhone?.trim() || "";
  const visibleCafeMenuSections =
    profile?.templateType === "cafe"
      ? parseCafeMenuSections(profile.fields.menuSections, { fallbackToDefault: false })
          .map((section) => ({
            ...section,
            items: section.items.filter((item) => item.name || item.description || item.price),
          }))
          .filter((section) => section.items.length > 0)
      : [];

  const handleCopy = () => {
    if (!shareUrl || typeof navigator === "undefined") {
      return;
    }

    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkClick = (link: ProfileLink) => {
    if (!profile) {
      return;
    }

    setClickedLink(link.id);
    setTimeout(() => setClickedLink(null), 600);

    void apiRequest<{ ok: boolean }>("/events/link-click", {
      method: "POST",
      body: {
        profileId: profile.id,
        linkId: link.id,
        linkLabel: link.label,
      },
    }).catch(() => {
      // Keep public profile interaction smooth even if analytics logging fails.
    });
  };

  const updateReportField = (key: keyof PetReportForm, value: string) => {
    setReportForm((current) => {
      const nextForm = { ...current, [key]: value };
      setReportErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };
        const keyError = nextErrors[key];
        if (keyError && value.trim()) {
          delete nextErrors[key];
        }
        if (
          nextErrors.reporterEmail &&
          (nextForm.reporterEmail.trim().length > 0 || nextForm.reporterPhone.trim().length > 0)
        ) {
          delete nextErrors.reporterEmail;
        }
        return nextErrors;
      });
      return nextForm;
    });
    setReportSuccess(false);
    setReportError("");
  };

  const validateReport = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!reportForm.reporterName.trim()) {
      next.reporterName = "Your name is required";
    }
    if (!reportForm.message.trim()) {
      next.message = "Please add details about where you saw the pet";
    }
    if (!reportForm.reporterEmail.trim() && !reportForm.reporterPhone.trim()) {
      next.reporterEmail = "Add email or phone so the owner can contact you";
    }
    return next;
  };

  const submitPetReport = async () => {
    if (!profile) {
      return;
    }

    const nextErrors = validateReport();
    if (Object.keys(nextErrors).length > 0) {
      setReportErrors(nextErrors);
      return;
    }

    setReportSubmitting(true);
    setReportError("");
    setReportSuccess(false);
    setReportErrors({});

    try {
      await apiRequest<{ ok: boolean }>("/events/pet-report", {
        method: "POST",
        body: {
          profileId: profile.id,
          reporterName: reportForm.reporterName.trim(),
          reporterEmail: reportForm.reporterEmail.trim(),
          reporterPhone: reportForm.reporterPhone.trim(),
          location: reportForm.location.trim(),
          message: reportForm.message.trim(),
        },
      });

      setReportSuccess(true);
      setReportForm({
        reporterName: "",
        reporterEmail: "",
        reporterPhone: "",
        location: "",
        message: "",
      });
    } catch (err) {
      setReportError(err instanceof ApiError ? err.message : "Unable to send your report right now.");
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="mx-auto max-w-md px-4 pb-24">
          <div className={`mt-4 mb-6 h-12 animate-pulse rounded-xl ${isDark ? "bg-slate-900" : "bg-slate-100"}`} />
          <div className={`mb-4 h-[420px] animate-pulse rounded-3xl ${isDark ? "bg-slate-900" : "bg-slate-100"}`} />
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className={`h-16 animate-pulse rounded-2xl ${isDark ? "bg-slate-900" : "bg-slate-100"}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile || !display) {
    return (
      <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        <div className="mx-auto max-w-md px-4 py-12">
          <div className={`rounded-2xl border p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="mb-3 flex items-center gap-2 text-rose-500">
              <AlertCircle size={16} />
              <span style={{ fontWeight: 600 }}>Profile unavailable</span>
            </div>
            <p className={`${isDark ? "text-slate-400" : "text-slate-600"}`}>{error || "Unable to load this profile."}</p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  void loadProfile();
                }}
                className="rounded-xl px-4 py-2.5 text-sm text-white"
                style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 600 }}
              >
                Retry
              </button>
              {claimPathForUnavailable && (
                <Link
                  to={claimPathForUnavailable}
                  className={`rounded-xl px-4 py-2.5 text-sm ${isDark ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  style={{ fontWeight: 600 }}
                >
                  Claim Tag
                </Link>
              )}
              {showMyTagsForUnavailable && (
                <Link
                  to="/my-tags"
                  className={`rounded-xl px-4 py-2.5 text-sm ${isDark ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  style={{ fontWeight: 600 }}
                >
                  Open My Tags
                </Link>
              )}
              <Link to="/" className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const contactLinks = buildContactLinks(profile.fields, profile.links);
  const sortedLinks = [...profile.links, ...contactLinks].sort((a, b) => a.position - b.position);

  return (
    <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="mx-auto max-w-md px-4 pb-24">
        <div
          className="mt-4 mb-6 flex items-center justify-between rounded-xl px-4 py-2.5 text-sm"
          style={{
            background: isDark ? "rgba(79,70,229,0.1)" : "rgba(79,70,229,0.06)",
            border: "1px solid rgba(79,70,229,0.2)",
          }}
        >
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-indigo-500" />
            <span className={isDark ? "text-slate-300" : "text-slate-600"} style={{ fontWeight: 500 }}>
              Public Profile — Taparoo
            </span>
          </div>
          <Link to={`/editor?profile=${encodeURIComponent(profile.id)}`} className="flex items-center gap-1 text-xs text-indigo-500 transition-colors hover:text-indigo-400" style={{ fontWeight: 600 }}>
            <Edit size={11} />
            Edit
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-4 overflow-hidden rounded-3xl shadow-xl"
          style={{ background: cardGradient }}
        >
          {ThemeGraphic && profile.showGraphic && (
            <div className="pointer-events-none absolute inset-0 z-0">
              <ThemeGraphic />
            </div>
          )}

          <div className="relative z-10 px-6 pt-10 pb-8">
            <div
              className="absolute top-0 right-0 h-48 w-48 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.4), transparent)", transform: "translate(30%, -30%)" }}
            />

            <div className="relative z-10 mb-4 flex justify-center">
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}>
                <div className="h-24 w-24 overflow-hidden rounded-full shadow-2xl" style={{ border: "3px solid rgba(255,255,255,0.4)" }}>
                  <ImageWithFallback src={profile.photoUrl || FALLBACK_PHOTO} alt={display.name} className="h-full w-full object-cover" />
                </div>
              </motion.div>
            </div>

            <div className="relative z-10 mb-4 text-center">
              <h1 className="mb-1 text-xl" style={{ color: textColor, fontWeight: 800, letterSpacing: "-0.02em" }}>
                {display.name}
              </h1>
              {display.subtitle && (
                <p className="mb-1 text-sm opacity-90" style={{ color: textColor, fontWeight: 500 }}>
                  {display.subtitle}
                </p>
              )}
              {display.location && (
                <div className="flex items-center justify-center gap-1 text-xs opacity-75" style={{ color: textColor }}>
                  <MapPin size={10} />
                  {display.location}
                </div>
              )}
            </div>

            {display.bio && (
              <p className="relative z-10 mb-5 text-center text-sm leading-relaxed" style={{ color: textColor, opacity: 0.85 }}>
                {display.bio}
              </p>
            )}

            {display.badges.length > 0 && (
              <div className="relative z-10 mb-2 flex flex-wrap justify-center gap-2">
                {display.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full px-3 py-1 text-xs"
                    style={{ background: "rgba(255,255,255,0.2)", color: textColor, backdropFilter: "blur(8px)", fontWeight: 500 }}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 px-6 py-3 text-xs" style={{ background: "rgba(0,0,0,0.15)", color: textColor }}>
            <TrendingUp size={12} style={{ opacity: 0.8 }} />
            <span style={{ fontWeight: 600 }}>
              {tapCount !== null ? `${tapCount.toLocaleString()} profile taps` : "Taparoo profile"}
            </span>
          </div>
        </motion.div>

        {petLost && (
          <div className={`mb-4 rounded-2xl border p-4 ${isDark ? "border-rose-900/40 bg-rose-950/20" : "border-rose-200 bg-rose-50"}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${isDark ? "text-rose-300" : "text-rose-600"}`}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className={`${isDark ? "text-rose-200" : "text-rose-700"} text-sm`} style={{ fontWeight: 700 }}>
                  LOST PET ALERT
                </p>
                <p className={`${isDark ? "text-rose-300" : "text-rose-700"} text-xs mt-1`}>
                  This pet is currently marked as lost. If you have seen them, please submit a report below.
                </p>
                {(ownerName || ownerPhone) && (
                  <p className={`${isDark ? "text-rose-200" : "text-rose-800"} text-xs mt-2`} style={{ fontWeight: 600 }}>
                    {ownerName ? `Owner: ${ownerName}` : "Owner"}{ownerPhone ? ` · ${ownerPhone}` : ""}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {profile.templateType === "cafe" && visibleCafeMenuSections.length > 0 && (
          <div className={`mb-4 rounded-2xl border p-4 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="mb-3 flex items-center gap-2">
              <UtensilsCrossed size={15} className={isDark ? "text-amber-300" : "text-amber-600"} />
              <h3 className={`${isDark ? "text-white" : "text-slate-900"} text-sm`} style={{ fontWeight: 700 }}>
                Menu
              </h3>
            </div>

            <div className="space-y-3">
              {visibleCafeMenuSections.map((section) => (
                <div key={section.id} className={`rounded-xl border p-3 ${isDark ? "border-slate-800 bg-slate-950/50" : "border-slate-100 bg-slate-50/60"}`}>
                  <p className={`${isDark ? "text-slate-100" : "text-slate-900"} text-xs uppercase tracking-wide`} style={{ fontWeight: 700 }}>
                    {section.name}
                  </p>
                  <div className="mt-2 space-y-2">
                    {section.items.map((item) => (
                      <div key={item.id} className={`rounded-lg border px-2.5 py-2 ${isDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className={`${isDark ? "text-white" : "text-slate-900"} text-sm`} style={{ fontWeight: 600 }}>
                            {item.name || "Menu Item"}
                          </p>
                          {item.price && (
                            <span className={`${isDark ? "text-amber-300" : "text-amber-700"} text-xs`} style={{ fontWeight: 700 }}>
                              {item.price}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className={`${isDark ? "text-slate-400" : "text-slate-600"} text-xs mt-1`}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 space-y-3">
          {sortedLinks.length === 0 && (
            <div className={`rounded-2xl border p-4 text-sm ${isDark ? "border-slate-800 bg-slate-900 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>
              No links have been added to this profile yet.
            </div>
          )}

          {sortedLinks.map((link, index) => {
            const Icon = linkIcons[link.type] || Globe;
            const isClicked = clickedLink === link.id;
            const href = resolveLinkUrl(link.url);

            return (
              <motion.a
                key={link.id}
                href={href || undefined}
                target={href?.startsWith("http") ? "_blank" : undefined}
                rel={href?.startsWith("http") ? "noreferrer" : undefined}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.06 }}
                onClick={(event) => {
                  if (!href) {
                    event.preventDefault();
                  }
                  handleLinkClick(link);
                }}
                className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                  isDark ? "border border-slate-800 bg-slate-900 hover:border-indigo-500/40" : "border border-slate-100 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md"
                } ${!href ? "cursor-default opacity-80" : ""}`}
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(99,102,241,0.15)" }}>
                  <Icon size={20} className="text-indigo-500" />
                </div>
                <span className={`flex-1 text-sm ${isDark ? "text-white" : "text-slate-800"}`} style={{ fontWeight: 600 }}>
                  {link.label}
                </span>
                <AnimatePresence mode="wait">
                  {isClicked ? (
                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check size={16} className="text-emerald-500" />
                    </motion.div>
                  ) : (
                    <motion.div key="arrow">
                      <ExternalLink size={14} className={isDark ? "text-slate-500" : "text-slate-300"} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.a>
            );
          })}
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", boxShadow: "0 4px 15px rgba(79,70,229,0.3)", fontWeight: 600 }}
          >
            <Share2 size={15} />
            Share Profile
          </button>
          <button
            onClick={() => setShowQR(true)}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm transition-all hover:opacity-90 active:scale-95 ${
              isDark ? "border border-slate-800 bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"
            }`}
            style={{ fontWeight: 600 }}
          >
            <QrCode size={15} />
            QR Code
          </button>
        </div>

        {petLost && (
          <div className={`mb-6 rounded-2xl border p-4 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="mb-3">
              <h3 className={`${isDark ? "text-white" : "text-slate-900"} text-sm`} style={{ fontWeight: 700 }}>
                Report Sighting to Owner
              </h3>
              <p className={`${isDark ? "text-slate-400" : "text-slate-500"} text-xs mt-1`}>
                Share where/when you saw this pet and the owner will receive your report.
              </p>
            </div>

            {reportSuccess && (
              <div className={`mb-3 rounded-xl border px-3 py-2 text-xs ${isDark ? "border-emerald-900/40 bg-emerald-950/20 text-emerald-300" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                Report sent successfully. Thank you for helping.
              </div>
            )}

            {reportError && (
              <div className={`mb-3 rounded-xl border px-3 py-2 text-xs ${isDark ? "border-rose-900/40 bg-rose-950/20 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                {reportError}
              </div>
            )}

            <div className="space-y-2.5">
              <div>
                <input
                  value={reportForm.reporterName}
                  onChange={(event) => updateReportField("reporterName", event.target.value)}
                  placeholder="Your name"
                  className={`w-full h-10 px-3 rounded-xl text-sm border outline-none ${
                    reportErrors.reporterName
                      ? isDark
                        ? "bg-slate-800 border-rose-500 text-white placeholder:text-slate-500"
                        : "bg-white border-rose-400 text-slate-800 placeholder:text-slate-400"
                      : isDark
                      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                  }`}
                />
                {reportErrors.reporterName && <p className="mt-1 text-xs text-rose-500">{reportErrors.reporterName}</p>}
              </div>
              <input
                value={reportForm.reporterEmail}
                onChange={(event) => updateReportField("reporterEmail", event.target.value)}
                placeholder="Email (optional if phone provided)"
                className={`w-full h-10 px-3 rounded-xl text-sm border outline-none ${
                  reportErrors.reporterEmail
                    ? isDark
                      ? "bg-slate-800 border-rose-500 text-white placeholder:text-slate-500"
                      : "bg-white border-rose-400 text-slate-800 placeholder:text-slate-400"
                    : isDark
                    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                }`}
              />
              <input
                value={reportForm.reporterPhone}
                onChange={(event) => updateReportField("reporterPhone", event.target.value)}
                placeholder="Phone (optional if email provided)"
                className={`w-full h-10 px-3 rounded-xl text-sm border outline-none ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                }`}
              />
              <input
                value={reportForm.location}
                onChange={(event) => updateReportField("location", event.target.value)}
                placeholder="Where did you see the pet? (optional)"
                className={`w-full h-10 px-3 rounded-xl text-sm border outline-none ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                }`}
              />
              <div>
                <textarea
                  rows={4}
                  value={reportForm.message}
                  onChange={(event) => updateReportField("message", event.target.value)}
                  placeholder="Details about sighting (time, direction, condition, etc.)"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none ${
                    reportErrors.message
                      ? isDark
                        ? "bg-slate-800 border-rose-500 text-white placeholder:text-slate-500"
                        : "bg-white border-rose-400 text-slate-800 placeholder:text-slate-400"
                      : isDark
                      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                  }`}
                />
                {reportErrors.message && <p className="mt-1 text-xs text-rose-500">{reportErrors.message}</p>}
                {reportErrors.reporterEmail && <p className="mt-1 text-xs text-rose-500">{reportErrors.reporterEmail}</p>}
              </div>
              <button
                type="button"
                onClick={() => {
                  void submitPetReport();
                }}
                disabled={reportSubmitting}
                className="w-full h-10 rounded-xl text-sm text-white transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)", fontWeight: 700 }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Send size={13} />
                  {reportSubmitting ? "Sending..." : "Send Report to Owner"}
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs" style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}>
            Powered by
            <span
              style={{
                background: "linear-gradient(135deg, #DC2626, #EA580C)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 700,
              }}
            >
              Taparoo
            </span>
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowShare(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl ${isDark ? "bg-slate-900" : "bg-white"}`}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 700 }}>
                  Share Profile
                </h2>
                <button onClick={() => setShowShare(false)} className={isDark ? "text-slate-400" : "text-slate-400"}>
                  <X size={18} />
                </button>
              </div>

              <div className="mb-6 flex justify-center">
                <div className="rounded-2xl bg-white p-3 shadow-md">
                  <QRCodeSVG size={120} />
                </div>
              </div>

              <div className={`mb-4 flex items-center gap-2 rounded-xl p-3 ${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
                <input readOnly value={shareUrl} className={`flex-1 bg-transparent text-xs outline-none ${isDark ? "text-slate-300" : "text-slate-600"}`} />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-white transition-all"
                  style={{ background: copied ? "#10B981" : "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 600 }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Twitter", color: "#1DA1F2", icon: Twitter },
                  { label: "LinkedIn", color: "#0077B5", icon: Linkedin },
                  { label: "Email", color: "#EA4335", icon: Mail },
                  { label: "More", color: "#6B7280", icon: Share2 },
                ].map(({ label, color, icon: Icon }) => (
                  <button
                    key={label}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all hover:scale-105 active:scale-95"
                    style={{ background: `${color}15` }}
                  >
                    <Icon size={20} style={{ color }} />
                    <span className="text-xs" style={{ color, fontWeight: 500 }}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className={`w-full max-w-xs rounded-3xl p-8 text-center shadow-2xl ${isDark ? "bg-slate-900" : "bg-white"}`}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className={isDark ? "text-white" : "text-slate-900"} style={{ fontWeight: 700 }}>
                  Your QR Code
                </h2>
                <button onClick={() => setShowQR(false)} className={isDark ? "text-slate-400" : "text-slate-400"}>
                  <X size={18} />
                </button>
              </div>

              <div className="mb-4 flex justify-center">
                <div className="rounded-2xl bg-white p-4 shadow-md">
                  <QRCodeSVG size={160} />
                </div>
              </div>

              <p className={`mb-6 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Scan this code to instantly open your profile.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 rounded-xl py-3 text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 600 }}
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setShowQR(false)}
                  className={`flex-1 rounded-xl border py-3 text-sm transition-colors ${
                    isDark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
