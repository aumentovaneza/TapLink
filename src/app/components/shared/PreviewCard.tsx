import { useTheme } from "next-themes";
import { Globe } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

const themes: Record<string, { gradient: string; text: string }> = {
  wave:     { gradient: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)", text: "#fff" },
  sunset:   { gradient: "linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)",  text: "#fff" },
  ocean:    { gradient: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",                text: "#fff" },
  forest:   { gradient: "linear-gradient(135deg, #065f46 0%, #059669 100%)",                text: "#fff" },
  "dark-pro": { gradient: "linear-gradient(135deg, #0f0c29 0%, #302b63 100%)",             text: "#a78bfa" },
  rose:     { gradient: "linear-gradient(135deg, #fda4af 0%, #e11d48 100%)",               text: "#fff" },
  noir:     { gradient: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",               text: "#e5e7eb" },
  minimal:  { gradient: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",               text: "#1e293b" },
  gold:     { gradient: "linear-gradient(135deg, #78350f 0%, #d97706 100%)",               text: "#fff" },
  neon:     { gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%)",               text: "#00ff9f" },
};

interface PreviewCardProps {
  themeId?: string;
  name?: string;
  sub?: string;
  photo?: string;
  photoShape?: "circle" | "rounded" | "banner";
  links?: { label: string; icon?: typeof Globe }[];
  size?: "xs" | "sm" | "md";
  className?: string;
  /** Show a phone shell around the preview */
  withShell?: boolean;
}

export function PreviewCard({
  themeId = "wave",
  name = "Your Name",
  sub = "Your Title",
  photo,
  photoShape = "circle",
  links = [],
  size = "md",
  className = "",
  withShell = true,
}: PreviewCardProps) {
  const currentTheme = themes[themeId] || themes.wave;

  const dims = {
    xs: { w: 100, h: 200, notch: "w-10 h-3", avatar: "w-10 h-10", name: 7, sub: 6, link: 5 },
    sm: { w: 140, h: 280, notch: "w-14 h-4", avatar: "w-14 h-14", name: 9, sub: 7.5, link: 6.5 },
    md: { w: 200, h: 400, notch: "w-20 h-5", avatar: "w-20 h-20", name: 12, sub: 10, link: 9 },
  };
  const d = dims[size];

  const screen = (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: currentTheme.gradient }}
    >
      {/* Status bar area */}
      <div className="flex-shrink-0" style={{ height: size === "xs" ? 18 : size === "sm" ? 24 : 36 }} />

      <div className="flex-1 flex flex-col items-center overflow-hidden" style={{ padding: size === "xs" ? 6 : size === "sm" ? 10 : 16 }}>
        {/* Photo */}
        {photo ? (
          photoShape === "banner" ? (
            <div className="w-full rounded-lg overflow-hidden flex-shrink-0 mb-2" style={{ height: size === "xs" ? 28 : size === "sm" ? 40 : 60 }}>
              <ImageWithFallback src={photo} alt={name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className={`flex-shrink-0 overflow-hidden border border-white/30 mb-2 ${photoShape === "circle" ? "rounded-full" : "rounded-xl"} ${d.avatar}`}
            >
              <ImageWithFallback src={photo} alt={name} className="w-full h-full object-cover" />
            </div>
          )
        ) : (
          <div
            className={`flex-shrink-0 mb-2 border border-white/20 flex items-center justify-center ${photoShape === "circle" ? "rounded-full" : "rounded-xl"} ${d.avatar}`}
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <Globe size={size === "xs" ? 12 : size === "sm" ? 16 : 20} style={{ color: currentTheme.text, opacity: 0.5 }} />
          </div>
        )}

        {/* Name & sub */}
        <p className="text-center mb-0.5 truncate w-full" style={{ color: currentTheme.text, fontWeight: 700, fontSize: d.name }}>{name}</p>
        <p className="text-center truncate w-full mb-2 opacity-70" style={{ color: currentTheme.text, fontSize: d.sub }}>{sub}</p>

        {/* Links */}
        <div className="w-full mt-auto space-y-1">
          {(links.length ? links : [{ label: "Link 1" }, { label: "Link 2" }, { label: "Link 3" }]).slice(0, 3).map((link, i) => {
            const Icon = link.icon || Globe;
            return (
              <div
                key={i}
                className="flex items-center justify-center gap-1 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  padding: size === "xs" ? "3px 6px" : size === "sm" ? "4px 8px" : "7px 10px",
                }}
              >
                <span style={{ color: currentTheme.text, fontSize: d.link, fontWeight: 500 }}>{link.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (!withShell) {
    return (
      <div className={`rounded-2xl overflow-hidden ${className}`} style={{ width: d.w, height: d.h }}>
        {screen}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: d.w, height: d.h }}>
      {/* Shell */}
      <div className="absolute inset-0 rounded-[2rem] bg-slate-800 shadow-2xl" style={{ borderRadius: size === "xs" ? "1.25rem" : size === "sm" ? "1.75rem" : "2.5rem" }} />
      {/* Notch */}
      <div className={`absolute ${d.notch} bg-slate-800 rounded-full z-10`} style={{ top: size === "xs" ? 4 : 6, left: "50%", transform: "translateX(-50%)" }} />
      {/* Screen */}
      <div className="absolute inset-[3px] overflow-hidden" style={{ borderRadius: size === "xs" ? "1.15rem" : size === "sm" ? "1.6rem" : "2.3rem" }}>
        {screen}
      </div>
    </div>
  );
}
