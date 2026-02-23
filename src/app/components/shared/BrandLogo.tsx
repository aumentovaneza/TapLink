import colorIcon from "../../../assets/brand/taparoo-icon-color.svg";
import darkIcon from "../../../assets/brand/taparoo-icon-dark.svg";
import monoIcon from "../../../assets/brand/taparoo-icon-mono.svg";
import blackIcon from "../../../assets/brand/taparoo-icon-black.svg";

type BrandVariant = "auto" | "color" | "dark" | "mono" | "black";

interface BrandLogoProps {
  className?: string;
  iconClassName?: string;
  nameClassName?: string;
  showName?: boolean;
  size?: number;
  variant?: BrandVariant;
}

const ICONS: Record<Exclude<BrandVariant, "auto">, string> = {
  color: colorIcon,
  dark: darkIcon,
  mono: monoIcon,
  black: blackIcon,
};

export function BrandLogo({
  className = "",
  iconClassName = "",
  nameClassName = "",
  showName = true,
  size = 32,
  variant = "auto",
}: BrandLogoProps) {
  const resolvedVariant = variant === "auto" ? "color" : variant;
  const iconSrc = ICONS[resolvedVariant];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <img
        src={iconSrc}
        alt="Taparoo logo"
        width={size}
        height={size}
        className={`shrink-0 ${iconClassName}`.trim()}
      />
      {showName ? (
        <span
          className={nameClassName}
          style={{
            fontFamily: "var(--font-family-heading)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            background: "var(--brand-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Taparoo
        </span>
      ) : null}
    </span>
  );
}
