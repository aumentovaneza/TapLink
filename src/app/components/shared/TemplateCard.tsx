import { ReactNode } from "react";
import { useTheme } from "next-themes";
import { Check } from "lucide-react";
import { motion } from "motion/react";

interface TemplateCardProps {
  id: string;
  icon: ReactNode;
  name: string;
  description: string;
  color: string;
  selected?: boolean;
  onClick?: () => void;
  badge?: string;
  compact?: boolean;
}

export function TemplateCard({ id, icon, name, description, color, selected, onClick, badge, compact }: TemplateCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (compact) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
          selected
            ? "border-2 shadow-md"
            : isDark
            ? "border-slate-700 hover:border-slate-600 bg-slate-800/50"
            : "border-slate-200 hover:border-slate-300 bg-white"
        }`}
        style={{
          borderColor: selected ? color : undefined,
          background: selected ? `${color}08` : undefined,
        }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm truncate ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 600 }}>{name}</p>
          <p className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>{description}</p>
        </div>
        {selected && (
          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: color }}>
            <Check size={11} className="text-white" />
          </div>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-full p-5 rounded-2xl border-2 transition-all text-left ${
        selected
          ? "shadow-lg"
          : isDark
          ? "border-slate-800 hover:border-slate-700 bg-slate-900"
          : "border-slate-100 hover:border-slate-200 bg-white"
      }`}
      style={{
        borderColor: selected ? color : undefined,
        background: selected ? `${color}08` : undefined,
      }}
    >
      {badge && (
        <span
          className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full"
          style={{ background: `${color}15`, color, fontWeight: 600 }}
        >
          {badge}
        </span>
      )}

      <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{ background: `${color}15` }}>
        <span className="text-xl" style={{ color }}>{icon}</span>
      </div>

      <p className={`text-sm mb-1 ${isDark ? "text-white" : "text-slate-900"}`} style={{ fontWeight: 700 }}>{name}</p>
      <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>{description}</p>

      {selected && (
        <div
          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: color }}
        >
          <Check size={13} className="text-white" />
        </div>
      )}
    </motion.button>
  );
}
