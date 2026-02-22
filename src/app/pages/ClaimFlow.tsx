import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Coffee,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Music,
  PawPrint,
  Sparkles,
  Tag,
  User,
} from "lucide-react";

import { ApiError, apiRequest } from "../lib/api";
import { clearAccessToken, getAccessToken, SessionUser, setAccessToken, setSessionUser } from "../lib/session";

type TemplateType = "individual" | "business" | "pet" | "cafe" | "event" | "musician";

interface VerifiedTag {
  id: string;
  tagCode: string;
  claimCode: string;
  status: "active" | "inactive" | "unclaimed";
}

interface ClaimedTagProfile {
  id: string;
  slug: string;
}

interface ClaimedTag {
  id: string;
  tagCode: string;
  profile: ClaimedTagProfile | null;
}

interface AuthResponse {
  user: SessionUser;
  accessToken: string;
}

const templateTypes: Array<{ id: TemplateType; icon: typeof User; label: string; desc: string; color: string }> = [
  { id: "individual", icon: User, label: "Individual", desc: "Personal bio & social links", color: "#4F46E5" },
  { id: "business", icon: Building2, label: "Business", desc: "Company brand & services", color: "#0EA5E9" },
  { id: "pet", icon: PawPrint, label: "Pet", desc: "Pet ID with owner contact", color: "#F59E0B" },
  { id: "cafe", icon: Coffee, label: "Café & Restaurant", desc: "Menu, orders & reservations", color: "#92400E" },
  { id: "event", icon: Calendar, label: "Event", desc: "Tickets, schedule & venue", color: "#8B5CF6" },
  { id: "musician", icon: Music, label: "Musician", desc: "Streaming links & tour dates", color: "#10B981" },
];

const steps = [
  { id: 1, label: "Verify Code" },
  { id: 2, label: "Account" },
  { id: 3, label: "Template" },
  { id: 4, label: "Activated!" },
];

function toAppError(error: unknown, fallback: string): Error {
  if (error instanceof ApiError) {
    return new Error(error.message);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(fallback);
}

function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const chars = value.toUpperCase().split("").slice(0, 6);
  while (chars.length < 6) chars.push("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        className="sr-only"
        value={value}
        maxLength={6}
        onChange={(event) => onChange(event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
        autoFocus
        autoComplete="off"
      />
      <div className="flex justify-center gap-2" onClick={() => inputRef.current?.focus()}>
        {chars.map((char, index) => (
          <div
            key={index}
            className={`h-14 w-12 cursor-text rounded-xl border-2 transition-all ${
              char
                ? isDark
                  ? "border-indigo-500 bg-indigo-950/30"
                  : "border-indigo-400 bg-indigo-50"
                : index === value.length
                ? isDark
                  ? "border-indigo-400 bg-slate-800"
                  : "border-indigo-300 bg-white"
                : isDark
                ? "border-slate-700 bg-slate-800"
                : "border-slate-200 bg-white"
            } flex items-center justify-center`}
            style={{ fontSize: "1.25rem", fontWeight: 700 }}
          >
            {char ? (
              <span className={isDark ? "text-indigo-300" : "text-indigo-700"}>{char}</span>
            ) : index === value.length ? (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="h-6 w-px bg-indigo-500"
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCode({
  code,
  onCodeChange,
  onVerify,
  isDark,
  verifyError,
}: {
  code: string;
  onCodeChange: (value: string) => void;
  onVerify: () => Promise<void>;
  isDark: boolean;
  verifyError: string;
}) {
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleNext = async () => {
    if (code.length < 4) {
      setError("Please enter your claim code.");
      return;
    }

    setError("");
    setChecking(true);
    try {
      await onVerify();
    } catch (error) {
      const parsed = toAppError(error, "Unable to verify this claim code.");
      setError(parsed.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
        style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
      >
        <Tag size={28} className="text-white" />
      </motion.div>

      <h2 className={`mb-2 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontSize: "1.4rem", fontWeight: 800 }}>
        Enter Your Claim Code
      </h2>
      <p className={`mb-8 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ lineHeight: 1.65 }}>
        Find the claim code printed on your NFC tag or packaging.
      </p>

      <div className="mb-4 w-full">
        <CodeInput value={code} onChange={onCodeChange} />
        {(error || verifyError) && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-rose-500">
            <AlertCircle size={12} />
            {error || verifyError}
          </p>
        )}
        <p className={`mt-3 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          Demo code: <span className="text-indigo-400" style={{ fontWeight: 600 }}>BRDG19</span>
        </p>
      </div>

      <button
        onClick={handleNext}
        disabled={checking}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-white transition-all hover:opacity-90 disabled:opacity-70"
        style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 700 }}
      >
        {checking ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            Verify Code <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}

function StepAccount({
  onAuthenticated,
  isDark,
}: {
  onAuthenticated: (data: { mode: "signin" | "signup"; email: string; password: string; name?: string }) => Promise<void>;
  isDark: boolean;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputCls = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
    isDark
      ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500"
      : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white"
  }`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onAuthenticated({ mode, email, password, name });
    } catch (error) {
      const parsed = toAppError(error, "Unable to authenticate.");
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <h2 className={`mb-1 text-center ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontSize: "1.4rem", fontWeight: 800 }}>
        {mode === "signup" ? "Create Your Account" : "Welcome Back"}
      </h2>
      <p className={`mb-6 text-center text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {mode === "signup" ? "Your tag profile will be linked to this account." : "Sign in to continue claiming your tag."}
      </p>

      <div className={`mb-6 flex rounded-xl p-1 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
        {(["signup", "signin"] as const).map((item) => (
          <button
            key={item}
            onClick={() => {
              setMode(item);
              setError("");
            }}
            className={`flex-1 rounded-lg py-2 text-sm transition-all ${
              mode === item ? "text-white shadow-sm" : isDark ? "text-slate-400" : "text-slate-500"
            }`}
            style={{
              background: mode === item ? "linear-gradient(135deg, #4F46E5, #7C3AED)" : "transparent",
              fontWeight: mode === item ? 600 : 400,
            }}
          >
            {item === "signup" ? "Sign Up" : "Sign In"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" && (
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full Name"
            className={inputCls}
            required
          />
        )}

        <div className="relative">
          <Mail size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="Email address"
            className={`${inputCls} pl-10`}
            required
          />
        </div>

        <div className="relative">
          <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type={showPass ? "text" : "password"}
            placeholder="Password"
            className={`${inputCls} pl-10 pr-10`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPass((current) => !current)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-white transition-all hover:opacity-90 disabled:opacity-70"
          style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 700 }}
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              {mode === "signup" ? "Create Account" : "Sign In"} <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      {error && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-rose-500">
          <AlertCircle size={12} />
          {error}
        </p>
      )}

      <div className="relative my-5">
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div className={`w-full border-t ${isDark ? "border-slate-700" : "border-slate-200"}`} />
        </div>
        <div className="relative flex justify-center">
          <span className={`px-3 text-xs ${isDark ? "bg-slate-950 text-slate-500" : "bg-white text-slate-400"}`}>or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {["Google", "Apple"].map((provider) => (
          <button
            key={provider}
            onClick={() => setError("Social sign-in is not enabled yet. Use email/password.")}
            className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm transition-all hover:opacity-80 ${
              isDark ? "border-slate-700 bg-slate-800 text-white" : "border-slate-200 bg-white text-slate-700"
            }`}
            style={{ fontWeight: 500 }}
          >
            {provider}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepTemplate({
  selected,
  onSelect,
  onNext,
  isDark,
  claimError,
}: {
  selected: TemplateType;
  onSelect: (id: TemplateType) => void;
  onNext: () => Promise<void>;
  isDark: boolean;
  claimError: string;
}) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleNext = async () => {
    setError("");
    setSubmitting(true);

    try {
      await onNext();
    } catch (error) {
      const parsed = toAppError(error, "Unable to claim this tag.");
      setError(parsed.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <h2 className={`mb-1 text-center ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontSize: "1.4rem", fontWeight: 800 }}>
        Choose Profile Type
      </h2>
      <p className={`mb-6 text-center text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        What is this tag for? You can change this later.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-2.5">
        {templateTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;

          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all ${
                isSelected ? "shadow-md" : isDark ? "border-slate-800 hover:border-slate-600" : "border-slate-100 hover:border-slate-200"
              }`}
              style={{ borderColor: isSelected ? type.color : undefined, background: isSelected ? `${type.color}10` : isDark ? "#0F172A" : "#fff" }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${type.color}18` }}>
                <Icon size={18} style={{ color: type.color }} />
              </div>
              <div>
                <p className={`text-xs ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>{type.label}</p>
                <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`} style={{ fontSize: 10, lineHeight: 1.4 }}>{type.desc}</p>
              </div>
              {isSelected && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: type.color }}>
                  <Check size={11} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {(error || claimError) && (
        <p className="mb-3 flex items-center justify-center gap-1.5 text-xs text-rose-500">
          <AlertCircle size={12} />
          {error || claimError}
        </p>
      )}

      <button
        onClick={handleNext}
        disabled={!selected || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-white transition-all hover:opacity-90 disabled:opacity-40"
        style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 700 }}
      >
        {submitting ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><span>Continue</span><ArrowRight size={15} /></>}
      </button>
    </div>
  );
}

function StepActivated({ templateId, profilePath, isDark }: { templateId: TemplateType; profilePath: string | null; isDark: boolean }) {
  const navigate = useNavigate();
  const type = templateTypes.find((item) => item.id === templateId) ?? templateTypes[0];
  const Icon = type.icon;
  const editorPath = profilePath ? `/editor?profile=${encodeURIComponent(profilePath.replace("/profile/", ""))}` : "/editor";

  const particles = Array.from({ length: 20 }, (_, index) => ({
    id: index,
    x: Math.random() * 300 - 150,
    y: -(Math.random() * 200 + 100),
    color: ["#4F46E5", "#7C3AED", "#06B6D4", "#F59E0B", "#10B981", "#EC4899"][Math.floor(Math.random() * 6)],
    size: Math.random() * 8 + 4,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="relative mx-auto flex max-w-sm flex-col items-center overflow-hidden text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-sm"
            style={{ width: particle.size, height: particle.size, background: particle.color, left: "50%", top: "40%" }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: particle.x, y: particle.y, opacity: 0, rotate: particle.rotate }}
            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl shadow-2xl"
        style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
      >
        <Check size={44} className="text-white" strokeWidth={3} />
        <motion.div
          className="absolute inset-0 rounded-3xl"
          animate={{ scale: [1, 1.3, 1.5], opacity: [0.4, 0.2, 0] }}
          transition={{ duration: 1.2, delay: 0.3, repeat: 2 }}
          style={{ background: "rgba(16,185,129,0.5)", borderRadius: "1.5rem" }}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div
          className="mb-4 flex items-center justify-center gap-2 rounded-full px-3 py-1.5"
          style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
        >
          <Sparkles size={12} className="text-emerald-400" />
          <span className="text-xs text-emerald-400" style={{ fontWeight: 600 }}>Tag Activated!</span>
        </div>

        <h2 className={`mb-2 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          You&apos;re all set!
        </h2>
        <p className={`mb-6 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ lineHeight: 1.65 }}>
          Your <strong>{type.label}</strong> profile has been created. Now customize it with your details and a theme.
        </p>

        <div className={`mb-8 flex items-center gap-3 rounded-2xl px-4 py-3 ${isDark ? "border border-slate-800 bg-slate-900" : "border border-slate-100 bg-slate-50"}`}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${type.color}18` }}>
            <Icon size={18} style={{ color: type.color }} />
          </div>
          <div className="text-left">
            <p className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>{type.label} Profile</p>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Ready to customize</p>
          </div>
          <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
            <Check size={12} className="text-emerald-600" />
          </div>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={() => navigate(editorPath)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-white"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 700 }}
          >
            <Sparkles size={16} />
            Customize Profile
            <ArrowRight size={15} />
          </button>

          {profilePath && (
            <Link
              to={profilePath}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm transition-colors ${
                isDark
                  ? "border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
              style={{ fontWeight: 500 }}
            >
              View Public Profile
              <ChevronRight size={14} />
            </Link>
          )}

          <Link
            to="/my-tags"
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm transition-colors ${
              isDark
                ? "border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
                : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
            style={{ fontWeight: 500 }}
          >
            View My Tags
            <ChevronRight size={14} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export function ClaimFlow() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { code: urlCode } = useParams();

  const [step, setStep] = useState(1);
  const [code, setCode] = useState((urlCode ?? "").toUpperCase());
  const [templateId, setTemplateId] = useState<TemplateType>("individual");
  const [verifyError, setVerifyError] = useState("");
  const [claimError, setClaimError] = useState("");
  const [verifiedTag, setVerifiedTag] = useState<VerifiedTag | null>(null);
  const [profilePath, setProfilePath] = useState<string | null>(null);

  useEffect(() => {
    setCode((urlCode ?? "").toUpperCase());
  }, [urlCode]);

  const back = () => {
    setClaimError("");
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleVerify = async () => {
    setVerifyError("");

    const response = await apiRequest<{ tag: VerifiedTag }>("/tags/verify-claim", {
      method: "POST",
      body: { claimCode: code },
    });

    setVerifiedTag(response.tag);

    if (getAccessToken()) {
      try {
        await apiRequest<{ user: { id: string } }>("/auth/me", { auth: true });
        setStep(3);
        return;
      } catch {
        clearAccessToken();
      }
    }

    setStep(2);
  };

  const handleAuthenticated = async (data: { mode: "signin" | "signup"; email: string; password: string; name?: string }) => {
    const endpoint = data.mode === "signup" ? "/auth/signup" : "/auth/signin";

    const payload =
      data.mode === "signup"
        ? { name: data.name?.trim() ?? "", email: data.email, password: data.password }
        : { email: data.email, password: data.password };

    const response = await apiRequest<AuthResponse>(endpoint, {
      method: "POST",
      body: payload,
    });

    setAccessToken(response.accessToken);
    setSessionUser(response.user);
    setStep(3);
  };

  const handleClaim = async () => {
    setClaimError("");

    if (!verifiedTag) {
      throw new Error("Please verify your claim code first.");
    }

    const response = await apiRequest<{ tag: ClaimedTag }>("/tags/claim", {
      method: "POST",
      auth: true,
      body: {
        claimCode: verifiedTag.claimCode,
        templateType: templateId,
      },
    });

    setProfilePath(response.tag.profile ? `/profile/${response.tag.profile.slug}` : null);
    setStep(4);
  };

  const progressPct = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className={`flex min-h-screen flex-col pt-16 ${isDark ? "bg-slate-950" : "bg-white"}`}>
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 60%, #06B6D4 100%)" }}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="relative mx-auto max-w-lg px-5 py-8">
          <div className="mb-4 flex items-center justify-between">
            {steps.map((item, index) => (
              <div key={item.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition-all ${
                      step > item.id
                        ? "bg-white text-indigo-600"
                        : step === item.id
                        ? "border-2 border-white bg-white/30 text-white"
                        : "border border-white/20 bg-white/10 text-white/40"
                    }`}
                    style={{ fontWeight: 700 }}
                  >
                    {step > item.id ? <Check size={13} /> : item.id}
                  </div>
                  <span
                    className={`hidden whitespace-nowrap text-xs sm:block ${step >= item.id ? "text-white/90" : "text-white/40"}`}
                    style={{ fontWeight: step === item.id ? 600 : 400 }}
                  >
                    {item.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="mx-1 h-px w-8 sm:mx-2 sm:w-12" style={{ background: step > item.id ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)" }} />
                )}
              </div>
            ))}
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <motion.div className="h-full rounded-full bg-white" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4, ease: "easeInOut" }} />
          </div>
        </div>
      </div>

      <div className="mx-auto flex-1 w-full max-w-lg px-5 py-10">
        {step > 1 && step < 4 && (
          <button onClick={back} className={`mb-6 flex items-center gap-1.5 text-sm transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
            <ArrowLeft size={15} />
            Back
          </button>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <StepCode
                code={code}
                onCodeChange={(value) => {
                  setCode(value);
                  setVerifyError("");
                }}
                onVerify={async () => {
                  try {
                    await handleVerify();
                  } catch (error) {
                    const parsed = toAppError(error, "Unable to verify claim code.");
                    setVerifyError(parsed.message);
                    throw parsed;
                  }
                }}
                isDark={isDark}
                verifyError={verifyError}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <StepAccount
                onAuthenticated={async (data) => {
                  try {
                    await handleAuthenticated(data);
                  } catch (error) {
                    throw toAppError(error, "Unable to authenticate.");
                  }
                }}
                isDark={isDark}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <StepTemplate
                selected={templateId}
                onSelect={setTemplateId}
                onNext={async () => {
                  try {
                    await handleClaim();
                  } catch (error) {
                    if (error instanceof ApiError && error.status === 401) {
                      clearAccessToken();
                      setStep(2);
                    }
                    const parsed = toAppError(error, "Unable to claim tag.");
                    setClaimError(parsed.message);
                    throw parsed;
                  }
                }}
                isDark={isDark}
                claimError={claimError}
              />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <StepActivated templateId={templateId} profilePath={profilePath} isDark={isDark} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
