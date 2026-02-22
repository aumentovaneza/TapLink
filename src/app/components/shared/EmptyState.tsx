import { ReactNode } from "react";
import { Link } from "react-router";
import { useTheme } from "next-themes";

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary";
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function EmptyState({ icon, title, description, actions = [], size = "md", className = "" }: EmptyStateProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const sizeMap = {
    sm: { wrapper: "py-10 px-6", iconBox: "w-12 h-12", iconSize: "text-xl" },
    md: { wrapper: "py-16 px-8", iconBox: "w-16 h-16", iconSize: "text-2xl" },
    lg: { wrapper: "py-24 px-10", iconBox: "w-20 h-20", iconSize: "text-3xl" },
  };
  const s = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center ${s.wrapper} ${className}`}>
      <div
        className={`${s.iconBox} rounded-2xl flex items-center justify-center mb-5 ${s.iconSize}`}
        style={{ background: isDark ? "rgba(79,70,229,0.12)" : "rgba(79,70,229,0.07)", border: `1px solid ${isDark ? "rgba(79,70,229,0.2)" : "rgba(79,70,229,0.12)"}` }}
      >
        <span className="text-indigo-400">{icon}</span>
      </div>

      <h3 className={`mb-2 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>{title}</h3>

      {description && (
        <p className={`text-sm max-w-xs ${isDark ? "text-slate-400" : "text-slate-500"}`} style={{ lineHeight: 1.65 }}>
          {description}
        </p>
      )}

      {actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {actions.map((action, i) => {
            const isPrimary = action.variant === "primary" || (i === 0 && action.variant !== "secondary");
            const cls = `inline-flex items-center px-5 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5 ${
              isPrimary
                ? "text-white hover:opacity-90"
                : isDark
                ? "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`;
            const style = isPrimary ? { background: "linear-gradient(135deg, #4F46E5, #7C3AED)", fontWeight: 600 } : { fontWeight: 500 };

            if (action.href) return <Link key={action.label} to={action.href} className={cls} style={style}>{action.label}</Link>;
            return <button key={action.label} onClick={action.onClick} className={cls} style={style}>{action.label}</button>;
          })}
        </div>
      )}
    </div>
  );
}
