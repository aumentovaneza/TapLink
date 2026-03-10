import colorIcon from "../../../assets/brand/taparoo-icon-color.svg";

interface TaparooIconColorProps {
  size?: number;
  className?: string;
}

export function TaparooIconColor({ size = 16, className = "" }: TaparooIconColorProps) {
  return (
    <img
      src={colorIcon}
      alt="Taparoo icon"
      width={size}
      height={size}
      className={`shrink-0 ${className}`.trim()}
    />
  );
}
