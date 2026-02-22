import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  Coffee,
  ExternalLink,
  PawPrint,
  RefreshCw,
  Share2,
  Smartphone,
  User,
  Wifi,
  Zap,
} from "lucide-react";

import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { apiRequest } from "../lib/api";

type TagState = "scanning" | "detected" | "unclaimed" | "active" | "inactive" | "error";

interface ScanProfile {
  id: string;
  slug: string;
  name: string;
  title: string;
  photo: string | null;
  gradient: string;
  tapCount: number;
  templateType: string;
}

interface ScanTagResponse {
  id: string;
  state: "unclaimed" | "active" | "inactive" | "error";
  claimCode?: string | null;
  profile?: ScanProfile;
}

const DEMO_PHOTO =
  "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";

const DEMO_ACTIVE_TAG_ID = "tag-001";
const DEMO_UNCLAIMED_TAG_ID = "TL-003";

const templateTypeIcons: Record<string, typeof User> = {
  individual: User,
  business: Building2,
  pet: PawPrint,
  cafe: Coffee,
};

function getDeviceName(): string {
  if (typeof navigator === "undefined") {
    return "web";
  }

  return navigator.userAgent.slice(0, 80);
}

function NFCPulse({ color = "#4F46E5" }: { color?: string }) {
  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      {[1, 2, 3].map((index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{ border: `2px solid ${color}`, opacity: 0 }}
          animate={{ scale: [1, 2.2], opacity: [0.6, 0], width: 64, height: 64 }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.6, ease: "easeOut" }}
        />
      ))}
      <motion.div
        className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Wifi size={28} className="text-white" />
      </motion.div>
    </div>
  );
}

function ProfilePreview({ profile }: { profile: ScanProfile }) {
  const Icon = templateTypeIcons[profile.templateType] ?? User;

  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="mx-auto w-full max-w-xs">
      <div className="relative overflow-hidden rounded-3xl shadow-2xl" style={{ background: profile.gradient }}>
        <div className="flex flex-col items-center p-6">
          <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-white/30 shadow-xl">
            <ImageWithFallback src={profile.photo || DEMO_PHOTO} alt={profile.name} className="h-full w-full object-cover" />
          </div>
          <h2 className="mb-1 text-center text-white" style={{ fontWeight: 700 }}>{profile.name}</h2>
          <p className="mb-4 text-center text-sm text-white/75">{profile.title}</p>

          <div className="mb-5 flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "rgba(255,255,255,0.15)" }}>
            <Zap size={12} className="text-white" />
            <span className="text-xs text-white" style={{ fontWeight: 600 }}>{profile.tapCount.toLocaleString()} taps</span>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Icon size={12} className="text-white" />
            </div>
            <span className="text-xs capitalize text-white/70">{profile.templateType} Profile</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TagScan() {
  const { tagId } = useParams();
  const [state, setState] = useState<TagState>("scanning");
  const [tagData, setTagData] = useState<ScanTagResponse | null>(null);
  const [scanTarget, setScanTarget] = useState<string | null>(tagId ?? null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setScanTarget(tagId ?? null);
  }, [tagId]);

  useEffect(() => {
    let isCancelled = false;

    if (!scanTarget) {
      setState("scanning");
      setTagData(null);
      setErrorMessage("");
      return;
    }

    setState("scanning");
    setTagData(null);
    setErrorMessage("");

    const detectTimeout = setTimeout(() => {
      if (!isCancelled) {
        setState("detected");
      }
    }, 900);

    const fetchTimeout = setTimeout(async () => {
      try {
        const response = await apiRequest<ScanTagResponse>(`/scan/${encodeURIComponent(scanTarget)}`);

        if (isCancelled) {
          return;
        }

        setTagData(response);

        if (response.state === "error") {
          setState("error");
          setErrorMessage("Tag not found.");
          return;
        }

        setState(response.state);

        if (response.state === "active" || response.state === "inactive") {
          void apiRequest<{ ok: boolean }>("/events/tap", {
            method: "POST",
            body: {
              tagId: response.id,
              scanMethod: "NFC",
              device: getDeviceName(),
            },
          }).catch(() => {
            // Keep scan UX fast even if analytics logging fails.
          });
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setState("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load this tag.");
      }
    }, 1700);

    return () => {
      isCancelled = true;
      clearTimeout(detectTimeout);
      clearTimeout(fetchTimeout);
    };
  }, [scanTarget]);

  const reset = () => {
    setErrorMessage("");
    setTagData(null);

    if (tagId) {
      setScanTarget(null);
      setTimeout(() => setScanTarget(tagId), 0);
      return;
    }

    setScanTarget(null);
    setState("scanning");
  };

  const runDemo = (mode: "active" | "unclaimed") => {
    const target = mode === "active" ? DEMO_ACTIVE_TAG_ID : DEMO_UNCLAIMED_TAG_ID;
    setScanTarget(target);
  };

  const copyCurrentUrl = async () => {
    if (typeof window === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // ignore copy failures
    }
  };

  const isProfileState = state === "active" || state === "inactive";
  const profilePath = tagData?.profile ? `/profile/${tagData.profile.slug || tagData.profile.id}` : "/profile";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #0f0c29 0%, #1e1b4b 40%, #0c1445 100%)" }}>
      <div className="flex items-center justify-between px-5 py-4 pt-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            <Zap size={15} className="text-white" />
          </div>
          <span className="text-white" style={{ fontSize: 17, fontWeight: 700 }}>TapLink</span>
        </Link>

        {state !== "scanning" && state !== "detected" && (
          <button onClick={reset} className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white">
            <RefreshCw size={14} />
            Scan Again
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <AnimatePresence mode="wait">
          {(state === "scanning" || state === "detected") && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center"
            >
              <AnimatePresence mode="wait">
                {state === "scanning" ? (
                  <motion.div key="pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <NFCPulse color="#4F46E5" />
                  </motion.div>
                ) : (
                  <motion.div key="detected" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex h-40 w-40 items-center justify-center">
                    <motion.div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.4 }}
                    >
                      <Check size={32} className="text-white" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <h1 className="mb-3 mt-6 text-white" style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                {state === "scanning" ? "Scanning…" : "Tag Detected!"}
              </h1>
              <p className="max-w-xs text-sm text-white/60" style={{ lineHeight: 1.65 }}>
                {state === "scanning"
                  ? "Hold your phone near the NFC tag to scan it automatically."
                  : "Just a moment while we load the profile…"}
              </p>

              {!tagId && state === "scanning" && (
                <div className="mt-10 w-full max-w-xs space-y-3">
                  <p className="mb-4 text-center text-xs text-white/40" style={{ fontWeight: 500, letterSpacing: "0.06em" }}>
                    — DEMO MODE —
                  </p>
                  <button
                    onClick={() => runDemo("active")}
                    className="flex w-full items-center justify-between rounded-2xl px-5 py-3.5 text-white transition-all hover:opacity-90"
                    style={{ background: "rgba(79,70,229,0.3)", border: "1px solid rgba(79,70,229,0.4)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/30">
                        <User size={16} className="text-indigo-300" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm" style={{ fontWeight: 600 }}>Active Profile Tag</p>
                        <p className="text-xs text-white/50">Live public profile</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-white/40" />
                  </button>

                  <button
                    onClick={() => runDemo("unclaimed")}
                    className="flex w-full items-center justify-between rounded-2xl px-5 py-3.5 text-white transition-all hover:opacity-90"
                    style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.3)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20">
                        <Wifi size={16} className="text-amber-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm" style={{ fontWeight: 600 }}>Unclaimed Tag</p>
                        <p className="text-xs text-white/50">Needs activation</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-white/40" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {isProfileState && tagData?.profile && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm flex flex-col items-center"
            >
              <motion.div
                className="mb-6 flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{
                  background: state === "inactive" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                  border: state === "inactive" ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(16,185,129,0.3)",
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className={`h-2 w-2 rounded-full ${state === "inactive" ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
                <span className={`text-xs ${state === "inactive" ? "text-amber-400" : "text-emerald-400"}`} style={{ fontWeight: 600 }}>
                  {state === "inactive" ? "Inactive Profile" : "Active Profile"}
                </span>
              </motion.div>

              <ProfilePreview profile={tagData.profile} />

              <div className="mt-6 w-full space-y-3">
                <Link
                  to={profilePath}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-white transition-all hover:opacity-90"
                  style={{ background: tagData.profile.gradient, fontWeight: 700 }}
                >
                  <ExternalLink size={16} />
                  View Full Profile
                </Link>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={copyCurrentUrl}
                    className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm text-white/70 transition-all hover:text-white"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <Share2 size={15} />
                    Share
                  </button>
                  <Link
                    to="/my-tags"
                    className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm text-white/70 transition-all hover:text-white"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <Smartphone size={15} />
                    My Tags
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {state === "unclaimed" && (
            <motion.div
              key="unclaimed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm flex flex-col items-center text-center"
            >
              <motion.div
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl shadow-2xl"
                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Wifi size={40} className="text-white" />
              </motion.div>

              <div className="mb-4 flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-xs text-amber-400" style={{ fontWeight: 600 }}>Unclaimed Tag</span>
              </div>

              <h1 className="mb-3 text-white" style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>This Tag Is Empty</h1>
              <p className="mb-8 max-w-xs text-sm text-white/60" style={{ lineHeight: 1.65 }}>
                This NFC tag has not been activated yet. Claim it to create your digital profile and start sharing with a tap.
              </p>

              {tagData?.claimCode && (
                <div className="mb-6 w-full rounded-2xl px-5 py-4 text-center" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <p className="mb-1 text-xs text-white/50" style={{ fontWeight: 600, letterSpacing: "0.08em" }}>CLAIM CODE</p>
                  <p className="text-amber-400" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "0.12em" }}>{tagData.claimCode}</p>
                </div>
              )}

              <div className="w-full space-y-3">
                <Link
                  to={tagData?.claimCode ? `/claim/${tagData.claimCode}` : "/claim"}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", fontWeight: 700 }}
                >
                  <Zap size={16} />
                  Claim This Tag
                  <ArrowRight size={15} />
                </Link>
                <Link
                  to="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm text-white/70 transition-all hover:text-white"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Sign in to claim
                </Link>
              </div>
            </motion.div>
          )}

          {state === "error" && (
            <motion.div key="error" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex max-w-xs flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <AlertCircle size={36} className="text-rose-400" />
              </div>
              <h1 className="mb-3 text-white" style={{ fontSize: "1.4rem", fontWeight: 700 }}>Tag Not Found</h1>
              <p className="mb-2 text-sm text-white/70" style={{ lineHeight: 1.65 }}>
                We could not find a profile for this tag.
              </p>
              {errorMessage && <p className="mb-6 text-xs text-rose-300">{errorMessage}</p>}
              <div className="w-full space-y-3">
                <button
                  onClick={reset}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <RefreshCw size={14} />
                  Try Again
                </button>
                <Link to="/" className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm text-white/60 transition-colors hover:text-white">
                  Go to TapLink Homepage
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-2 pb-8 pt-5">
        <div className="flex h-4 w-4 items-center justify-center rounded" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
          <Zap size={9} className="text-white" />
        </div>
        <p className="text-xs text-white/30">Powered by TapLink</p>
      </div>
    </div>
  );
}
