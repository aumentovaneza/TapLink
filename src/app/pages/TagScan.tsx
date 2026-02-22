import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Wifi, Check, User, Building2, PawPrint, Coffee, Zap,
  ArrowRight, AlertCircle, RefreshCw, Share2, ExternalLink,
  ChevronRight, Smartphone
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

// Simulated tag states
type TagState = "scanning" | "detected" | "unclaimed" | "active" | "error";

interface TagData {
  id: string;
  state: "unclaimed" | "active";
  claimCode?: string;
  profile?: {
    name: string;
    title: string;
    photo: string;
    gradient: string;
    tapCount: number;
    templateType: "individual" | "business" | "pet" | "cafe";
  };
}

const DEMO_PHOTO = "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";

// Simulated tag database
const mockTags: Record<string, TagData> = {
  "tag-001": {
    id: "tag-001",
    state: "active",
    profile: {
      name: "Alex Rivera",
      title: "Product Designer · Designly Studio",
      photo: DEMO_PHOTO,
      gradient: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)",
      tapCount: 1847,
      templateType: "individual",
    },
  },
  "tag-002": {
    id: "tag-002",
    state: "unclaimed",
    claimCode: "TAPX42",
  },
};

const templateTypeIcons = {
  individual: User,
  business:   Building2,
  pet:        PawPrint,
  cafe:       Coffee,
};

// ─── NFC Pulse Ring Animation ─────────────────────────────────────────────────
function NFCPulse({ color = "#4F46E5" }: { color?: string }) {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ border: `2px solid ${color}`, opacity: 0 }}
          animate={{ scale: [1, 2.2], opacity: [0.6, 0], width: 64, height: 64 }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
        />
      ))}
      <motion.div
        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Wifi size={28} className="text-white" />
      </motion.div>
    </div>
  );
}

// ─── Active Profile Preview ───────────────────────────────────────────────────
function ProfilePreview({ profile }: { profile: NonNullable<TagData["profile"]> }) {
  const Icon = templateTypeIcons[profile.templateType] || User;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full max-w-xs mx-auto"
    >
      <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ background: profile.gradient }}>
        {/* Glassmorphism inner card */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-xl mb-4">
            <ImageWithFallback src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-white text-center mb-1" style={{ fontWeight: 700 }}>{profile.name}</h2>
          <p className="text-white/75 text-sm text-center mb-4">{profile.title}</p>

          {/* Tap counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ background: "rgba(255,255,255,0.15)" }}>
            <Zap size={12} className="text-white" />
            <span className="text-white text-xs" style={{ fontWeight: 600 }}>{profile.tapCount.toLocaleString()} taps</span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Icon size={12} className="text-white" />
            </div>
            <span className="text-white/70 text-xs capitalize">{profile.templateType} Profile</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function TagScan() {
  const { tagId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<TagState>("scanning");
  const [tagData, setTagData] = useState<TagData | null>(null);
  const [demoMode, setDemoMode] = useState<"active" | "unclaimed">("active");

  // Simulate NFC detection sequence
  useEffect(() => {
    if (tagId) {
      // Simulate scan → detect → show
      const t1 = setTimeout(() => setState("detected"), 1000);
      const t2 = setTimeout(() => {
        const found = mockTags[tagId];
        if (found) {
          setTagData(found);
          setState(found.state);
        } else {
          setState("error");
        }
      }, 2000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [tagId]);

  // Demo controls (no tagId param)
  const runDemo = (mode: "active" | "unclaimed") => {
    setDemoMode(mode);
    setState("scanning");
    const t1 = setTimeout(() => setState("detected"), 1000);
    const t2 = setTimeout(() => {
      if (mode === "active") {
        setTagData(mockTags["tag-001"]);
        setState("active");
      } else {
        setTagData(mockTags["tag-002"]);
        setState("unclaimed");
      }
    }, 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  };

  const reset = () => { setState("scanning"); setTagData(null); };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #0f0c29 0%, #1e1b4b 40%, #0c1445 100%)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 pt-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            <Zap size={15} className="text-white" />
          </div>
          <span className="text-white" style={{ fontWeight: 700, fontSize: 17 }}>TapLink</span>
        </Link>
        {state !== "scanning" && state !== "detected" && (
          <button onClick={reset} className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors">
            <RefreshCw size={14} />
            Scan Again
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <AnimatePresence mode="wait">

          {/* ── SCANNING state ── */}
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
                  <motion.div
                    key="detected"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-40 h-40 flex items-center justify-center"
                  >
                    <motion.div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.4 }}
                    >
                      <Check size={32} className="text-white" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <h1 className="text-white mt-6 mb-3" style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
                {state === "scanning" ? "Scanning…" : "Tag Detected!"}
              </h1>
              <p className="text-white/60 text-sm max-w-xs" style={{ lineHeight: 1.65 }}>
                {state === "scanning"
                  ? "Hold your phone near the NFC tag to scan it automatically."
                  : "Just a moment while we load the profile…"}
              </p>

              {/* Demo controls (no tagId) */}
              {!tagId && state === "scanning" && (
                <div className="mt-10 space-y-3 w-full max-w-xs">
                  <p className="text-white/40 text-xs text-center mb-4" style={{ fontWeight: 500, letterSpacing: "0.06em" }}>— DEMO MODE —</p>
                  <button
                    onClick={() => runDemo("active")}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-white transition-all hover:opacity-90"
                    style={{ background: "rgba(79,70,229,0.3)", border: "1px solid rgba(79,70,229,0.4)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/30 flex items-center justify-center">
                        <User size={16} className="text-indigo-300" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm" style={{ fontWeight: 600 }}>Active Profile Tag</p>
                        <p className="text-white/50 text-xs">Individual · Alex Rivera</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-white/40" />
                  </button>
                  <button
                    onClick={() => runDemo("unclaimed")}
                    className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-white transition-all hover:opacity-90"
                    style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.3)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Wifi size={16} className="text-amber-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm" style={{ fontWeight: 600 }}>Unclaimed Tag</p>
                        <p className="text-white/50 text-xs">Not yet activated</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-white/40" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── ACTIVE state ── */}
          {state === "active" && tagData?.profile && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm flex flex-col items-center"
            >
              <motion.div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs" style={{ fontWeight: 600 }}>Active Profile</span>
              </motion.div>

              <ProfilePreview profile={tagData.profile} />

              <div className="w-full mt-6 space-y-3">
                <Link
                  to="/profile"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white transition-all hover:opacity-90"
                  style={{ background: tagData.profile.gradient, fontWeight: 700 }}
                >
                  <ExternalLink size={16} />
                  View Full Profile
                </Link>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl text-white/70 text-sm transition-all hover:text-white"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <Share2 size={15} />
                    Share
                  </button>
                  <Link
                    to="/my-tags"
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl text-white/70 text-sm transition-all hover:text-white"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <Smartphone size={15} />
                    My Tags
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── UNCLAIMED state ── */}
          {state === "unclaimed" && (
            <motion.div
              key="unclaimed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm flex flex-col items-center text-center"
            >
              <motion.div
                className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Wifi size={40} className="text-white" />
              </motion.div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-amber-400 text-xs" style={{ fontWeight: 600 }}>Unclaimed Tag</span>
              </div>

              <h1 className="text-white mb-3" style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
                This Tag is Empty
              </h1>
              <p className="text-white/60 text-sm max-w-xs mb-8" style={{ lineHeight: 1.65 }}>
                This NFC tag hasn't been activated yet. Claim it to create your digital profile and start sharing with a tap.
              </p>

              {tagData?.claimCode && (
                <div className="w-full px-5 py-4 rounded-2xl mb-6 text-center"
                  style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <p className="text-white/50 text-xs mb-1" style={{ fontWeight: 600, letterSpacing: "0.08em" }}>CLAIM CODE</p>
                  <p className="text-amber-400" style={{ fontWeight: 800, fontSize: "1.75rem", letterSpacing: "0.12em" }}>
                    {tagData.claimCode}
                  </p>
                </div>
              )}

              <div className="w-full space-y-3">
                <Link
                  to={`/claim/${tagData?.claimCode || ""}`}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", fontWeight: 700 }}
                >
                  <Zap size={16} />
                  Claim This Tag
                  <ArrowRight size={15} />
                </Link>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white/70 text-sm transition-all hover:text-white"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Sign in to claim
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── ERROR state ── */}
          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center max-w-xs"
            >
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <AlertCircle size={36} className="text-rose-400" />
              </div>
              <h1 className="text-white mb-3" style={{ fontWeight: 700, fontSize: "1.4rem" }}>Tag Not Found</h1>
              <p className="text-white/60 text-sm mb-8" style={{ lineHeight: 1.65 }}>
                We couldn't find a profile for this tag. It may have been deactivated or the link is invalid.
              </p>
              <div className="w-full space-y-3">
                <button onClick={reset}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white text-sm"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <RefreshCw size={14} />Try Again
                </button>
                <Link to="/"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white/60 text-sm hover:text-white transition-colors">
                  Go to TapLink Homepage
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom powered-by */}
      <div className="flex items-center justify-center gap-2 py-5 pb-8">
        <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
          <Zap size={9} className="text-white" />
        </div>
        <p className="text-white/30 text-xs">Powered by TapLink</p>
      </div>
    </div>
  );
}
