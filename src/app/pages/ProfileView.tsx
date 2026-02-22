import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe, Linkedin, Twitter, Instagram, Github, Mail, Phone, Youtube,
  Share2, QrCode, Zap, ExternalLink, Copy, Check, X, TrendingUp,
  MapPin, Calendar, Star, ChevronRight, Edit
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { getTheme } from "../data/themes";

const DEMO_PHOTO = "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0JTIwc21pbGluZ3xlbnwxfHx8fDE3NzE3NTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080";

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

const profile = {
  name: "Alex Rivera",
  title: "Product Designer",
  company: "Designly Studio",
  location: "San Francisco, CA",
  bio: "Creating digital experiences that people love. 5+ years in UX/UI design. Available for freelance projects and collaborations.",
  photo: DEMO_PHOTO,
  themeId: "wave",
  gradient: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)",
  textColor: "#fff",
  showGraphic: true,
  tapCount: 1847,
  tags: ["UX Design", "Product Strategy", "Branding"],
  links: [
    { id: "1", type: "linkedin", label: "LinkedIn Profile", url: "#", color: "#0077B5" },
    { id: "2", type: "website", label: "Portfolio", url: "#", color: "#4F46E5" },
    { id: "3", type: "twitter", label: "Twitter / X", url: "#", color: "#1DA1F2" },
    { id: "4", type: "instagram", label: "Instagram", url: "#", color: "#E1306C" },
    { id: "5", type: "email", label: "Email Me", url: "#", color: "#EA4335" },
    { id: "6", type: "github", label: "GitHub", url: "#", color: "#333" },
  ],
};

// Simple QR Code SVG placeholder
function QRCodeSVG({ size = 120 }: { size?: number }) {
  const cells = [];
  const grid = 21;
  const cellSize = size / grid;

  // Simplified QR pattern
  const pattern = Array.from({ length: grid }, (_, r) =>
    Array.from({ length: grid }, (_, c) => {
      // Finder patterns (corners)
      const inTopLeft = r < 7 && c < 7;
      const inTopRight = r < 7 && c >= grid - 7;
      const inBotLeft = r >= grid - 7 && c < 7;
      if (inTopLeft || inTopRight || inBotLeft) {
        if (r === 0 || r === 6 || c === 0 || c === 6) return 1;
        if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return 1;
        if (r >= grid-7 && r <= grid-7+0 && c >= 2 && c <= 4) return 1;
        return 0;
      }
      // Random data modules
      return Math.random() > 0.5 ? 1 : 0;
    })
  );

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      if (pattern[r][c]) {
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={c * cellSize}
            y={r * cellSize}
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

export function ProfileView() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const profileTheme = getTheme(profile.themeId);
  const ThemeGraphic = profileTheme.Graphic;
  const [taps, setTaps] = useState(profile.tapCount);
  const [showShare, setShowShare] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [clickedLink, setClickedLink] = useState<string | null>(null);

  useEffect(() => {
    // Simulate tap counter
    const t = setTimeout(() => setTaps((c) => c + 1), 1500);
    return () => clearTimeout(t);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkClick = (id: string) => {
    setClickedLink(id);
    setTimeout(() => setClickedLink(null), 600);
  };

  return (
    <div className={`min-h-screen pt-16 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="max-w-md mx-auto px-4 pb-24">
        {/* Edit Banner */}
        <div
          className="mt-4 mb-6 flex items-center justify-between px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: isDark ? "rgba(79,70,229,0.1)" : "rgba(79,70,229,0.06)",
            border: "1px solid rgba(79,70,229,0.2)",
          }}
        >
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-indigo-500" />
            <span className={isDark ? "text-slate-300" : "text-slate-600"} style={{ fontWeight: 500 }}>Demo Profile — TapLink</span>
          </div>
          <Link
            to="/editor"
            className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 transition-colors"
            style={{ fontWeight: 600 }}
          >
            <Edit size={11} />
            Edit
          </Link>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden mb-4 shadow-xl"
          style={{ background: profile.gradient }}
        >
          {/* Theme graphic overlay */}
          {ThemeGraphic && profile.showGraphic && (
            <div className="absolute inset-0 pointer-events-none z-0">
              <ThemeGraphic />
            </div>
          )}
          {/* Background decoration */}
          <div className="relative px-6 pt-10 pb-8 z-10">
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.4), transparent)", transform: "translate(30%, -30%)" }}
            />
            <div
              className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.6), transparent)", transform: "translate(-20%, 20%)" }}
            />

            {/* Photo */}
            <div className="relative z-10 flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div
                  className="w-24 h-24 rounded-full overflow-hidden shadow-2xl"
                  style={{ border: "3px solid rgba(255,255,255,0.4)" }}
                >
                  <ImageWithFallback src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                </div>
              </motion.div>
            </div>

            {/* Name & Info */}
            <div className="relative z-10 text-center mb-4">
              <h1 className="text-xl mb-1" style={{ color: profile.textColor, fontWeight: 800, letterSpacing: "-0.02em" }}>
                {profile.name}
              </h1>
              <p className="text-sm opacity-90 mb-1" style={{ color: profile.textColor, fontWeight: 500 }}>
                {profile.title} · {profile.company}
              </p>
              <div className="flex items-center justify-center gap-1 text-xs opacity-70" style={{ color: profile.textColor }}>
                <MapPin size={10} />
                {profile.location}
              </div>
            </div>

            {/* Bio */}
            <p className="relative z-10 text-sm text-center leading-relaxed mb-5" style={{ color: profile.textColor, opacity: 0.85 }}>
              {profile.bio}
            </p>

            {/* Tags */}
            <div className="relative z-10 flex flex-wrap justify-center gap-2 mb-2">
              {profile.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs"
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    color: profile.textColor,
                    backdropFilter: "blur(8px)",
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Tap Counter */}
          <div
            className="px-6 py-3 flex items-center justify-center gap-2 text-xs"
            style={{ background: "rgba(0,0,0,0.15)", color: profile.textColor }}
          >
            <TrendingUp size={12} style={{ opacity: 0.8 }} />
            <motion.span
              key={taps}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{ fontWeight: 600 }}
            >
              {taps.toLocaleString()} profile taps
            </motion.span>
          </div>
        </motion.div>

        {/* Links */}
        <div className="space-y-3 mb-4">
          {profile.links.map((link, i) => {
            const Icon = linkIcons[link.type] || Globe;
            const isClicked = clickedLink === link.id;
            return (
              <motion.button
                key={link.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                onClick={() => handleLinkClick(link.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 active:scale-[0.98] text-left ${
                  isDark ? "bg-slate-900 border border-slate-800 hover:border-indigo-500/40" : "bg-white border border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-md"
                }`}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${link.color}15` }}
                >
                  <Icon size={20} style={{ color: link.color }} />
                </div>
                <span className={`flex-1 text-sm ${isDark ? "text-white" : "text-slate-800"}`} style={{ fontWeight: 600 }}>
                  {link.label}
                </span>
                <AnimatePresence mode="wait">
                  {isClicked ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check size={16} className="text-emerald-500" />
                    </motion.div>
                  ) : (
                    <motion.div key="arrow">
                      <ExternalLink size={14} className={isDark ? "text-slate-500" : "text-slate-300"} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 600, boxShadow: "0 4px 15px rgba(79,70,229,0.3)" }}
          >
            <Share2 size={15} />
            Share Profile
          </button>
          <button
            onClick={() => setShowQR(true)}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm transition-all hover:opacity-90 active:scale-95 ${
              isDark ? "bg-slate-900 border border-slate-800 text-white" : "bg-white border border-slate-200 text-slate-700"
            }`}
            style={{ fontWeight: 600 }}
          >
            <QrCode size={15} />
            QR Code
          </button>
        </div>

        {/* Powered by */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs"
            style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}
          >
            Powered by
            <span style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 700 }}>
              TapLink
            </span>
          </Link>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowShare(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-3xl p-6 ${isDark ? "bg-slate-900" : "bg-white"} shadow-2xl`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>Share Profile</h2>
                <button onClick={() => setShowShare(false)} className={isDark ? "text-slate-400" : "text-slate-400"}>
                  <X size={18} />
                </button>
              </div>

              {/* QR Code in Share */}
              <div className="flex justify-center mb-6">
                <div className="p-3 rounded-2xl bg-white shadow-md">
                  <QRCodeSVG size={120} />
                </div>
              </div>

              {/* Copy Link */}
              <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${isDark ? "bg-slate-800" : "bg-slate-50"}`}>
                <input
                  readOnly
                  value={typeof window !== "undefined" ? window.location.href : "https://taplink.app/alex"}
                  className={`flex-1 text-xs bg-transparent outline-none ${isDark ? "text-slate-300" : "text-slate-600"}`}
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs transition-all"
                  style={{ background: copied ? "#10B981" : "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 600 }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Social Share */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Twitter", color: "#1DA1F2", icon: Twitter },
                  { label: "LinkedIn", color: "#0077B5", icon: Linkedin },
                  { label: "Email", color: "#EA4335", icon: Mail },
                  { label: "More", color: "#6B7280", icon: Share2 },
                ].map(({ label, color, icon: Icon }) => (
                  <button
                    key={label}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105 active:scale-95"
                    style={{ background: `${color}15` }}
                  >
                    <Icon size={20} style={{ color }} />
                    <span className="text-xs" style={{ color, fontWeight: 500 }}>{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
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
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-xs rounded-3xl p-8 text-center ${isDark ? "bg-slate-900" : "bg-white"} shadow-2xl`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>Your QR Code</h2>
                <button onClick={() => setShowQR(false)} className={isDark ? "text-slate-400" : "text-slate-400"}>
                  <X size={18} />
                </button>
              </div>

              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-2xl bg-white shadow-md">
                  <QRCodeSVG size={160} />
                </div>
              </div>

              <p className={`text-xs mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Scan this code to instantly open your profile — no NFC needed
              </p>

              <div className="flex gap-2">
                <button
                  className="flex-1 py-3 rounded-xl text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 600 }}
                >
                  Download
                </button>
                <button
                  onClick={handleCopy}
                  className={`flex-1 py-3 rounded-xl text-sm border transition-colors ${
                    isDark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
