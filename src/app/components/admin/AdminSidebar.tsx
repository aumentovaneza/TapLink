import { Link, useLocation } from "react-router";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import {
  LayoutDashboard, Users, Activity, Wifi, Settings,
  Plus, X,
} from "lucide-react";

const ITEMS = [
  { icon: LayoutDashboard, label: "Overview",  path: "/dashboard" },
  { icon: Users,           label: "Profiles",  path: "/dashboard/profiles" },
  { icon: Activity,        label: "Analytics", path: "/dashboard/analytics" },
  { icon: Wifi,            label: "NFC Tags",  path: "/dashboard/tags" },
  { icon: Settings,        label: "Settings",  path: "/dashboard/settings" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

function NavContent({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  const { pathname } = useLocation();
  return (
    <div className="p-4">
      <div className="space-y-1">
        {ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive =
            path === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? "text-white"
                  : isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-800"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
              style={{
                background: isActive
                  ? "linear-gradient(135deg, #4F46E5, #7C3AED)"
                  : "transparent",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>

      <div
        className="mt-8 pt-6 border-t"
        style={{ borderColor: isDark ? "#1E293B" : "#F1F5F9" }}
      >
        <p
          className={`text-xs px-3 mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          style={{ fontWeight: 600, letterSpacing: "0.05em" }}
        >
          QUICK ACTIONS
        </p>
        <Link
          to="/editor"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-indigo-400 hover:bg-indigo-500/10 transition-colors"
          style={{ fontWeight: 500 }}
        >
          <Plus size={14} />
          New Profile
        </Link>
      </div>
    </div>
  );
}

export function AdminSidebar({ open, onClose }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <>
      {/* Desktop */}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-56 flex-shrink-0 border-r z-30 hidden lg:block ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <NavContent isDark={isDark} onClose={onClose} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -224 }}
              animate={{ x: 0 }}
              exit={{ x: -224 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className={`fixed left-0 top-16 bottom-0 w-56 z-50 border-r lg:hidden ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-1">
                <span
                  className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  style={{ fontWeight: 600, letterSpacing: "0.05em" }}
                >
                  ADMIN
                </span>
                <button
                  onClick={onClose}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    isDark
                      ? "text-slate-400 hover:bg-slate-800"
                      : "text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <X size={14} />
                </button>
              </div>
              <NavContent isDark={isDark} onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
