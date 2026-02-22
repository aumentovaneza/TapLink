import { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useTheme } from "next-themes";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface BaseFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

type InputFieldProps = BaseFieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  as?: "input";
};
type TextareaFieldProps = BaseFieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
  as: "textarea";
  rows?: number;
};
type FieldProps = InputFieldProps | TextareaFieldProps;

export function FormField(props: FieldProps) {
  const { label, error, hint, required, className = "", icon, suffix, as, ...rest } = props as InputFieldProps & TextareaFieldProps;
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = (rest as InputHTMLAttributes<HTMLInputElement>).type === "password";

  const inputCls = `w-full px-3.5 ${icon ? "pl-10" : ""} ${isPassword || suffix ? "pr-10" : ""} py-2.5 rounded-xl text-sm outline-none transition-all border ${
    error
      ? "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 focus:border-rose-500"
      : isDark
      ? "bg-slate-800/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:bg-slate-800"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white"
  }`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className={`flex items-center gap-1 text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`} style={{ fontWeight: 600 }}>
          {label}
          {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-slate-400"}`}>{icon}</span>
        )}

        {as === "textarea" ? (
          <textarea
            {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            rows={(rest as TextareaFieldProps).rows || 3}
            className={`${inputCls} resize-none`}
          />
        ) : (
          <input
            {...(rest as InputHTMLAttributes<HTMLInputElement>)}
            type={isPassword && showPassword ? "text" : (rest as InputHTMLAttributes<HTMLInputElement>).type}
            className={inputCls}
          />
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"} transition-colors`}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}

        {suffix && !isPassword && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</span>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-rose-500">
          <AlertCircle size={11} className="flex-shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{hint}</p>
      )}
    </div>
  );
}
