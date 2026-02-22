import { useState, useRef, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "next-themes";
import {
  Zap, Check, ArrowRight, ArrowLeft, User, Building2,
  PawPrint, Coffee, Calendar, Music, Eye, EyeOff,
  Wifi, Sparkles, Tag, AlertCircle, ChevronRight, Mail, Lock
} from "lucide-react";

const templateTypes = [
  { id: "individual", icon: User,      label: "Individual",          desc: "Personal bio & social links",    color: "#4F46E5" },
  { id: "business",   icon: Building2, label: "Business",            desc: "Company brand & services",       color: "#0EA5E9" },
  { id: "pet",        icon: PawPrint,  label: "Pet",                 desc: "Pet ID with owner contact",      color: "#F59E0B" },
  { id: "cafe",       icon: Coffee,    label: "Café & Restaurant",   desc: "Menu, orders & reservations",    color: "#92400E" },
  { id: "event",      icon: Calendar,  label: "Event",               desc: "Tickets, schedule & venue",      color: "#8B5CF6" },
  { id: "musician",   icon: Music,     label: "Musician",            desc: "Streaming links & tour dates",   color: "#10B981" },
];

const steps = [
  { id: 1, label: "Verify Code" },
  { id: 2, label: "Account" },
  { id: 3, label: "Template" },
  { id: 4, label: "Activated!" },
];

// ─── Code Input ───────────────────────────────────────────────────────────────
function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const chars = value.toUpperCase().split("").slice(0, 6);
  while (chars.length < 6) chars.push("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      {/* Invisible real input */}
      <input
        ref={inputRef}
        className="sr-only"
        value={value}
        maxLength={6}
        onChange={(e) => onChange(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
        autoFocus
        autoComplete="off"
      />
      {/* Visual cells */}
      <div className="flex gap-2 justify-center" onClick={() => inputRef.current?.focus()}>
        {chars.map((char, i) => (
          <div
            key={i}
            className={`w-12 h-14 rounded-xl flex items-center justify-center cursor-text transition-all border-2 ${
              char
                ? isDark ? "border-indigo-500 bg-indigo-950/30" : "border-indigo-400 bg-indigo-50"
                : i === value.length
                ? isDark ? "border-indigo-400 bg-slate-800" : "border-indigo-300 bg-white"
                : isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"
            }`}
            style={{ fontWeight: 700, fontSize: "1.25rem" }}
          >
            {char ? (
              <span className={isDark ? "text-indigo-300" : "text-indigo-700"}>{char}</span>
            ) : i === value.length ? (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-px h-6 bg-indigo-500"
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 1 – Verify Claim Code ───────────────────────────────────────────────
function StepCode({ code, onCodeChange, onNext, isDark }: {
  code: string; onCodeChange: (v: string) => void; onNext: () => void; isDark: boolean;
}) {
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleNext = async () => {
    if (code.length < 6) { setError("Please enter the full 6-character code."); return; }
    setError("");
    setChecking(true);
    await new Promise((r) => setTimeout(r, 900));
    setChecking(false);
    // Accept TAPX42 or any 6-char code for demo
    onNext();
  };

  return (
    <div className="flex flex-col items-center text-center max-w-sm mx-auto">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
        style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
        <Tag size={28} className="text-white" />
      </motion.div>

      <h2 className={`mb-2 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800, fontSize: "1.4rem" }}>
        Enter Your Claim Code
      </h2>
      <p className={`text-sm mb-8 ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ lineHeight: 1.65 }}>
        Find the 6-character claim code printed on your NFC tag or in your packaging.
      </p>

      <div className="w-full mb-4">
        <CodeInput value={code} onChange={onCodeChange} />
        {error && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-rose-500 mt-3">
            <AlertCircle size={12} />
            {error}
          </p>
        )}
        <p className={`text-xs mt-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          Demo code: <span className="text-indigo-400" style={{ fontWeight: 600 }}>TAPX42</span>
        </p>
      </div>

      <button
        onClick={handleNext}
        disabled={checking}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white transition-all hover:opacity-90 disabled:opacity-70 mt-2"
        style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 700 }}
      >
        {checking ? (
          <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <>Verify Code <ArrowRight size={16} /></>
        )}
      </button>
    </div>
  );
}

// ─── Step 2 – Account ─────────────────────────────────────────────────────────
function StepAccount({ onNext, isDark }: { onNext: () => void; isDark: boolean }) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputCls = `w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all ${
    isDark
      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white"
  }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    onNext();
  };

  return (
    <div className="max-w-sm mx-auto w-full">
      <h2 className={`mb-1 text-center ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800, fontSize: "1.4rem" }}>
        {mode === "signup" ? "Create Your Account" : "Welcome Back"}
      </h2>
      <p className={`text-sm text-center mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {mode === "signup" ? "Your tag profile will be linked to this account." : "Sign in to continue claiming your tag."}
      </p>

      {/* Mode toggle */}
      <div className={`flex p-1 rounded-xl mb-6 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
        {(["signup", "signin"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm transition-all ${mode === m ? "text-white shadow-sm" : isDark ? "text-slate-400" : "text-slate-500"}`}
            style={{ background: mode === m ? "linear-gradient(135deg, #4F46E5, #7C3AED)" : "transparent", fontWeight: mode === m ? 600 : 400 }}>
            {m === "signup" ? "Sign Up" : "Sign In"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className={inputCls} required />
        )}
        <div className="relative">
          <Mail size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" className={`${inputCls} pl-10`} required />
        </div>
        <div className="relative">
          <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPass ? "text" : "password"} placeholder="Password" className={`${inputCls} pl-10 pr-10`} required />
          <button type="button" onClick={() => setShowPass(!showPass)} className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-400"}`}>
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-70 mt-2"
          style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 700 }}>
          {loading ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <>{mode === "signup" ? "Create Account" : "Sign In"} <ArrowRight size={15} /></>}
        </button>
      </form>

      <div className="relative my-5">
        <div className={`absolute inset-y-0 left-0 right-0 flex items-center`}>
          <div className={`w-full border-t ${isDark ? "border-slate-700" : "border-slate-200"}`} />
        </div>
        <div className="relative flex justify-center">
          <span className={`px-3 text-xs ${isDark ? "bg-slate-950 text-slate-500" : "bg-white text-slate-400"}`}>or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {["Google", "Apple"].map((p) => (
          <button key={p} onClick={onNext}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm border transition-all hover:opacity-80 ${
              isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-700"
            }`} style={{ fontWeight: 500 }}>
            {p === "Google" ? (
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isDark ? "#fff" : "#000"}><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            )}
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3 – Choose Template ─────────────────────────────────────────────────
function StepTemplate({ selected, onSelect, onNext, isDark }: {
  selected: string; onSelect: (id: string) => void; onNext: () => void; isDark: boolean;
}) {
  return (
    <div className="max-w-sm mx-auto w-full">
      <h2 className={`mb-1 text-center ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800, fontSize: "1.4rem" }}>Choose Profile Type</h2>
      <p className={`text-sm text-center mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>What is this tag for? You can change this later.</p>

      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {templateTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;
          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all ${
                isSelected ? "shadow-md" : isDark ? "border-slate-800 hover:border-slate-600" : "border-slate-100 hover:border-slate-200"
              }`}
              style={{ borderColor: isSelected ? type.color : undefined, background: isSelected ? `${type.color}10` : isDark ? "#0F172A" : "#fff" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${type.color}18` }}>
                <Icon size={18} style={{ color: type.color }} />
              </div>
              <div>
                <p className={`text-xs ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>{type.label}</p>
                <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`} style={{ lineHeight: 1.4, fontSize: 10 }}>{type.desc}</p>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: type.color }}>
                  <Check size={11} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!selected}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white transition-all hover:opacity-90 disabled:opacity-40"
        style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 700 }}
      >
        Continue <ArrowRight size={15} />
      </button>
    </div>
  );
}

// ─── Step 4 – Activated ───────────────────────────────────────────────────────
function StepActivated({ templateId, isDark }: { templateId: string; isDark: boolean }) {
  const navigate = useNavigate();
  const type = templateTypes.find((t) => t.id === templateId) || templateTypes[0];
  const Icon = type.icon;

  // Confetti particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 300 - 150,
    y: -(Math.random() * 200 + 100),
    color: ["#4F46E5", "#7C3AED", "#06B6D4", "#F59E0B", "#10B981", "#EC4899"][Math.floor(Math.random() * 6)],
    size: Math.random() * 8 + 4,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="flex flex-col items-center text-center max-w-sm mx-auto relative overflow-hidden">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-sm"
            style={{ width: p.size, height: p.size, background: p.color, left: "50%", top: "40%" }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate }}
            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-2xl relative"
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
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full mb-4"
          style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
          <Sparkles size={12} className="text-emerald-400" />
          <span className="text-emerald-400 text-xs" style={{ fontWeight: 600 }}>Tag Activated!</span>
        </div>

        <h2 className={`mb-2 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
          You're all set!
        </h2>
        <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ lineHeight: 1.65 }}>
          Your <strong>{type.label}</strong> profile has been created. Now customize it with your details and a theme.
        </p>

        {/* Tag type info */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-8 ${isDark ? "bg-slate-900 border border-slate-800" : "bg-slate-50 border border-slate-100"}`}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${type.color}18` }}>
            <Icon size={18} style={{ color: type.color }} />
          </div>
          <div className="text-left">
            <p className={`text-sm ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>{type.label} Profile</p>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Ready to customize</p>
          </div>
          <div className="ml-auto w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check size={12} className="text-emerald-600" />
          </div>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={() => navigate("/editor")}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 700 }}
          >
            <Sparkles size={16} />
            Customize Profile
            <ArrowRight size={15} />
          </button>
          <Link to="/my-tags"
            className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm transition-colors ${
              isDark ? "text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700" : "text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100"
            }`} style={{ fontWeight: 500 }}>
            View My Tags
            <ChevronRight size={14} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main ClaimFlow ────────────────────────────────────────────────────────────
export function ClaimFlow() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { code: urlCode } = useParams();

  const [step, setStep] = useState(urlCode ? 2 : 1);
  const [code, setCode] = useState(urlCode || "");
  const [templateId, setTemplateId] = useState("individual");

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const progressPct = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className={`min-h-screen flex flex-col pt-16 ${isDark ? "bg-slate-950" : "bg-white"}`}>
      {/* Gradient header */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 60%, #06B6D4 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }} />
        <div className="relative max-w-lg mx-auto px-5 py-8">
          {/* Step labels */}
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                      step > s.id
                        ? "bg-white text-indigo-600"
                        : step === s.id
                        ? "bg-white/30 text-white border-2 border-white"
                        : "bg-white/10 text-white/40 border border-white/20"
                    }`}
                    style={{ fontWeight: 700 }}
                  >
                    {step > s.id ? <Check size={13} /> : s.id}
                  </div>
                  <span className={`text-xs whitespace-nowrap hidden sm:block ${step >= s.id ? "text-white/90" : "text-white/40"}`} style={{ fontWeight: step === s.id ? 600 : 400 }}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-8 sm:w-12 h-px mx-1 sm:mx-2" style={{ background: step > s.id ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)" }} />
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-5 py-10">
        {step > 1 && step < 4 && (
          <button onClick={back} className={`flex items-center gap-1.5 text-sm mb-6 ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"} transition-colors`}>
            <ArrowLeft size={15} />
            Back
          </button>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <StepCode code={code} onCodeChange={setCode} onNext={next} isDark={isDark} />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <StepAccount onNext={next} isDark={isDark} />
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <StepTemplate selected={templateId} onSelect={setTemplateId} onNext={next} isDark={isDark} />
            </motion.div>
          )}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <StepActivated templateId={templateId} isDark={isDark} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
