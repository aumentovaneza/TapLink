import { useTheme } from "next-themes";

function Bone({ className = "" }: { className?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: isDark ? "#1e293b" : "#e2e8f0" }}
    />
  );
}

export function TagCardSkeleton() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
      <div className="flex items-start gap-4">
        <Bone className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          <Bone className="h-4 w-36" />
          <Bone className="h-3 w-24" />
          <div className="flex gap-2 mt-3">
            <Bone className="h-6 w-16 rounded-full" />
            <Bone className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Bone className="w-8 h-8 rounded-lg flex-shrink-0" />
      </div>
      <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: isDark ? "#1e293b" : "#f1f5f9" }}>
        {[1, 2, 3].map((i) => <Bone key={i} className="h-8 flex-1 rounded-lg" />)}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
      <div className="flex justify-between items-start mb-4">
        <Bone className="h-3 w-24" />
        <Bone className="w-8 h-8 rounded-lg" />
      </div>
      <Bone className="h-8 w-20 mb-2" />
      <Bone className="h-3 w-28" />
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
      <div className="flex justify-between mb-4">
        <Bone className="h-4 w-32" />
        <Bone className="h-8 w-24 rounded-lg" />
      </div>
      <div className="animate-pulse rounded-xl" style={{ height, background: isDark ? "#1e293b" : "#f1f5f9" }} />
    </div>
  );
}

export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
      {/* Header */}
      <div className={`flex gap-4 px-5 py-3 border-b ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-slate-50"}`}>
        {[40, 80, 50, 60, 40].map((w, i) => (
          <Bone key={i} className={`h-3 w-${w}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`flex items-center gap-4 px-5 py-4 border-b last:border-0 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
          <Bone className="w-9 h-9 rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Bone className="h-3.5 w-32" />
            <Bone className="h-3 w-20" />
          </div>
          <Bone className="h-3 w-14 hidden sm:block" />
          <Bone className="h-6 w-16 rounded-full hidden md:block" />
          <Bone className="h-8 w-8 rounded-lg ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function ProfileCardSkeleton() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className={`p-6 rounded-2xl border flex flex-col items-center text-center ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
      <Bone className="w-20 h-20 rounded-full mb-4" />
      <Bone className="h-4 w-28 mb-2" />
      <Bone className="h-3 w-20 mb-5" />
      <div className="w-full space-y-2">
        {[1, 2, 3].map((i) => <Bone key={i} className="h-10 w-full rounded-xl" />)}
      </div>
    </div>
  );
}
