import { Link } from "react-router";
import { useTheme } from "next-themes";
import { Zap, ArrowLeft } from "lucide-react";

export function NotFound() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen flex items-center justify-center pt-16 ${isDark ? "bg-slate-950" : "bg-white"}`}>
      <div className="text-center px-4">
        <div
          className="text-8xl mb-6 select-none"
          style={{ fontWeight: 900, background: "linear-gradient(135deg, #DC2626, #EA580C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          404
        </div>
        <h1 className={`mb-3 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 800 }}>Page not found</h1>
        <p className={`text-lg mb-8 max-w-sm mx-auto ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Looks like this link has no NFC tag attached. Let's get you back on track.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 600 }}
          >
            <Zap size={15} />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-colors ${
              isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            style={{ fontWeight: 600 }}
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
