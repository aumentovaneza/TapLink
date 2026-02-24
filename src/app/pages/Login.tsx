import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "next-themes";
import {
  Mail, Lock, Eye, EyeOff, Zap, ArrowRight,
  Check, AlertCircle, User, Shield
} from "lucide-react";
import { BrandLogo } from "../components/shared/BrandLogo";
import { ApiError, apiRequest } from "../lib/api";
import { dashboardPathForRole, getAccessToken, getSessionUser, SessionUser, setAccessToken, setSessionUser } from "../lib/session";

const features = [
  "Create unlimited NFC tag profiles",
  "Real-time tap analytics & insights",
  "8 visual themes for every template",
  "Share via NFC or QR code",
];

interface AuthResponse {
  user: SessionUser;
  accessToken: string;
}

export function Login() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [forgotSent, setForgotSent] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    const currentUser = getSessionUser();
    if (token && currentUser) {
      navigate(dashboardPathForRole(currentUser.role), { replace: true });
    }
  }, [navigate]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = "Valid email required";
    if (mode !== "forgot" && password.length < 8) errs.password = "Password must be at least 8 characters";
    if (mode === "signup" && !name.trim()) errs.name = "Name is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitError("");

    if (mode === "forgot") {
      setForgotSent(true);
      return;
    }

    setLoading(true);
    try {
      const payload = mode === "signup"
        ? await apiRequest<AuthResponse>("/auth/signup", {
            method: "POST",
            body: { name, email, password },
          })
        : await apiRequest<AuthResponse>("/auth/signin", {
            method: "POST",
            body: { email, password },
          });

      setAccessToken(payload.accessToken);
      setSessionUser(payload.user);
      navigate(dashboardPathForRole(payload.user.role), { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Unable to sign in right now.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (hasError?: boolean) =>
    `w-full px-4 py-3 rounded-xl text-sm outline-none border-2 transition-all ${
      hasError
        ? "border-rose-400 bg-rose-50/50"
        : isDark
        ? "bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-orange-500 focus:bg-slate-800"
        : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white"
    }`;

  return (
    <div className={`min-h-screen flex pt-16 ${isDark ? "bg-slate-950" : "bg-white"}`}>
      {/* ── Left panel — brand ─────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1C0500 0%, #3F1A0A 50%, #5B2206 100%)" }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        {/* Glow */}
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #DC2626, transparent)" }} />

        {/* Logo */}
        <Link to="/" className="relative z-10">
          <BrandLogo variant="color" size={36} nameClassName="text-xl" />
        </Link>

        {/* Center content */}
        <div className="relative z-10">
          <h2 className="text-white mb-3" style={{ fontWeight: 800, fontSize: "2rem", lineHeight: 1.2, letterSpacing: "-0.03em" }}>
            Your identity,<br />
            <span style={{ background: "linear-gradient(135deg, #DC2626, #EA580C, #FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              one tap away.
            </span>
          </h2>
          <p className="text-white/60 text-sm mb-8" style={{ lineHeight: 1.7 }}>
            Join 50,000+ professionals who share their world with a single NFC tap.
          </p>
          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(234,88,12,0.35)" }}>
                  <Check size={11} className="text-amber-200" />
                </div>
                <span className="text-white/75 text-sm">{f}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom trust */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.07)" }}>
            <Shield size={13} className="text-emerald-400" />
            <span className="text-white/60 text-xs">SOC 2 Certified</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.07)" }}>
            <Shield size={13} className="text-blue-400" />
            <span className="text-white/60 text-xs">GDPR Compliant</span>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────── */}
      <div className={`flex-1 flex flex-col items-center justify-center px-5 py-10 ${isDark ? "bg-slate-950" : "bg-white"}`}>
        {/* Mobile logo */}
        <Link to="/" className="lg:hidden mb-8">
          <BrandLogo size={32} variant={isDark ? "mono" : "color"} nameClassName="text-lg" />
        </Link>

        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* ── Forgot Password success ── */}
            {mode === "forgot" && forgotSent ? (
              <motion.div key="forgot-sent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                  <Mail size={28} className="text-white" />
                </div>
                <h2 className={`mb-2 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800, fontSize: "1.4rem" }}>Check your email</h2>
                <p className={`text-sm mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  We sent a password reset link to <strong>{email}</strong>
                </p>
                <button onClick={() => { setMode("signin"); setForgotSent(false); }}
                  className={`text-sm text-orange-600 hover:text-orange-500 transition-colors`} style={{ fontWeight: 600 }}>
                  Back to Sign In
                </button>
              </motion.div>
            ) : (
              <motion.div key={mode} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
                {/* Header */}
                <div className="mb-8">
                  <h1 className={`mb-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800, fontSize: "1.75rem", letterSpacing: "-0.02em" }}>
                    {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
                  </h1>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {mode === "signin" ? "Sign in to manage your NFC tags." :
                      mode === "signup" ? "Start sharing your profile with a tap." :
                      "We'll email you a reset link."}
                  </p>
                </div>

                {/* Mode toggle (signin/signup only) */}
                {mode !== "forgot" && (
                  <div className={`flex p-1 rounded-xl mb-6 ${isDark ? "bg-slate-900 border border-slate-800" : "bg-slate-100"}`}>
                    {(["signup", "signin"] as const).map((m) => (
                      <button key={m} onClick={() => { setMode(m); setErrors({}); setSubmitError(""); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${mode === m ? "text-white shadow-sm" : isDark ? "text-slate-400" : "text-slate-500"}`}
                        style={{ background: mode === m ? "linear-gradient(135deg, #DC2626, #EA580C)" : "transparent", fontWeight: mode === m ? 600 : 400 }}>
                        {m === "signup" ? "Sign Up" : "Sign In"}
                      </button>
                    ))}
                  </div>
                )}

                {submitError && (
                  <div className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-500 flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    {submitError}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <div>
                      <label className={`block text-xs mb-1.5 ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontWeight: 600 }}>Full Name *</label>
                      <div className="relative">
                        <User size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" className={`${inputCls(!!errors.name)} pl-10`} />
                      </div>
                      {errors.name && <p className="flex items-center gap-1.5 text-xs text-rose-500 mt-1"><AlertCircle size={11} />{errors.name}</p>}
                    </div>
                  )}

                  <div>
                    <label className={`block text-xs mb-1.5 ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontWeight: 600 }}>Email Address *</label>
                    <div className="relative">
                      <Mail size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className={`${inputCls(!!errors.email)} pl-10`} />
                    </div>
                    {errors.email && <p className="flex items-center gap-1.5 text-xs text-rose-500 mt-1"><AlertCircle size={11} />{errors.email}</p>}
                  </div>

                  {mode !== "forgot" && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontWeight: 600 }}>Password *</label>
                        {mode === "signin" && (
                          <button type="button" onClick={() => setMode("forgot")} className="text-xs text-orange-600 hover:text-orange-500 transition-colors" style={{ fontWeight: 500 }}>
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                        <input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type={showPass ? "text" : "password"}
                          placeholder={mode === "signup" ? "Min. 8 characters" : "••••••••"}
                          className={`${inputCls(!!errors.password)} pl-10 pr-12`}
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}>
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {errors.password && <p className="flex items-center gap-1.5 text-xs text-rose-500 mt-1"><AlertCircle size={11} />{errors.password}</p>}
                      {mode === "signup" && (
                        <div className="flex gap-1 mt-2">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{
                              background: password.length === 0 ? (isDark ? "#1e293b" : "#e2e8f0") :
                                password.length < 6 && i <= 1 ? "#EF4444" :
                                password.length < 8 && i <= 2 ? "#F59E0B" :
                                password.length >= 8 && i <= 4 ? "#10B981" : (isDark ? "#1e293b" : "#e2e8f0")
                            }} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {mode === "signup" && (
                    <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      By signing up, you agree to our{" "}
                      <a href="#" className="text-orange-600 hover:underline">Terms</a> and{" "}
                      <a href="#" className="text-orange-600 hover:underline">Privacy Policy</a>.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-70 mt-2"
                    style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 700, boxShadow: "0 6px 20px rgba(220,38,38,0.32)" }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        {mode === "forgot" ? "Send Reset Link" : mode === "signup" ? "Create Account" : "Sign In"}
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>

                {/* Back from forgot */}
                {mode === "forgot" && (
                  <button onClick={() => setMode("signin")}
                    className={`flex items-center justify-center gap-1.5 w-full mt-4 text-sm ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"} transition-colors`}>
                    <ArrowRight size={13} className="rotate-180" />
                    Back to Sign In
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
