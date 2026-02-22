import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Moon,
  Sun,
  Menu,
  X,
  Wifi,
  LogIn,
} from "lucide-react";

const navItems: { label: string; path: string }[] = [];

export function Root() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900"}`}>
      {/* ── Navigation bar ───────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md transition-colors ${
          isDark
            ? "bg-slate-950/90 border-slate-800"
            : "bg-white/90 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 group"
              onClick={() => setMobileOpen(false)}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
              >
                <Wifi size={16} className="text-white" />
              </div>
              <span
                className={`text-base ${isDark ? "text-white" : "text-slate-900"}`}
                style={{ fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                Tap
                <span
                  style={{
                    background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Link
                </span>
              </span>
            </Link>

            {/* Desktop nav links */}
            {navItems.length > 0 && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-4 py-2 rounded-xl text-sm transition-all duration-150 ${
                        isActive
                          ? isDark
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-900"
                          : isDark
                          ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                      style={{ fontWeight: isActive ? 600 : 400 }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 ${
                  isDark
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {/* CTA */}
              <Link
                to="/editor"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white transition-all hover:opacity-90 hover:-translate-y-px shadow-md"
                style={{
                  background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                  fontWeight: 600,
                }}
              >
                <Zap size={13} />
                Activate Tag
              </Link>

              {/* Login */}
              <Link
                to="/login"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all ${
                  isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-800"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
                style={{ fontWeight: 500 }}
              >
                <LogIn size={14} />
                Log in
              </Link>

              {/* Mobile menu button */}
              {navItems.length > 0 && (
                <button
                  onClick={() => setMobileOpen((o) => !o)}
                  aria-label="Toggle menu"
                  className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isDark
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {mobileOpen ? <X size={17} /> : <Menu size={17} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && navItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`md:hidden border-t overflow-hidden ${
                isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-100"
              }`}
            >
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                        isActive
                          ? isDark
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-900"
                          : isDark
                          ? "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                      style={{ fontWeight: isActive ? 600 : 400 }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <div className={`border-t mt-2 pt-3 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                      isDark ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                    }`}
                    style={{ fontWeight: 500 }}
                  >
                    <LogIn size={14} />
                    Log in
                  </Link>
                  <Link
                    to="/editor"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 mt-1 px-4 py-3 rounded-xl text-sm text-white"
                    style={{
                      background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                      fontWeight: 600,
                    }}
                  >
                    <Zap size={14} />
                    Activate Your Tag
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Page content ─────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
