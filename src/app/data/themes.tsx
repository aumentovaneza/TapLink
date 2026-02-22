import React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ThemeDef {
  id: string;
  name: string;
  gradient: string;
  text: string;
  badge?: "New" | "Popular";
  suggestedFor?: string[];
  Graphic?: React.FC;
}

export interface Palette {
  id: string;
  name: string;
  previewColors: string[];
  gradient: string;
  text: string;
}

// ── SVG wrapper ───────────────────────────────────────────────────────────────
function G({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// ── PAW PRINT ─────────────────────────────────────────────────────────────────
// Group opacity = flat silhouette — overlapping shapes merge cleanly.
// Heel pad + 4 toes arranged on a gentle arc: outer toes lower & angled,
// inner toes higher & upright — all forming one continuous crescent.
function Paw({ x, y, s, r }: { x: number; y: number; s: number; r: number }) {
  const u = s / 10;
  const oX = 4.6*u, oY = 0.2*u;   // outer toe centres
  const iX = 1.9*u, iY = -2.9*u;  // inner toe centres
  return (
    <g transform={`translate(${x},${y}) rotate(${r})`} fill="white" opacity={0.30}>
      {/* Heel pad – slightly narrower so toes read as separate lobes */}
      <ellipse cx={0}   cy={ 4.0*u} rx={4.6*u} ry={3.4*u} />
      {/* Outer toes – angled outward so they fan away from center */}
      <ellipse cx={-oX} cy={oY} rx={1.5*u} ry={2.0*u}
        transform={`rotate(-20,${-oX},${oY})`} />
      <ellipse cx={ oX} cy={oY} rx={1.5*u} ry={2.0*u}
        transform={`rotate( 20,${ oX},${oY})`} />
      {/* Inner toes – upright, forming the top of the arc */}
      <ellipse cx={-iX} cy={iY} rx={1.75*u} ry={2.15*u} />
      <ellipse cx={ iX} cy={iY} rx={1.75*u} ry={2.15*u} />
    </g>
  );
}

// ── DOG BONE ──────────────────────────────────────────────────────────────────
// Classic double-knob dog-toy bone: narrow shaft + two large lobes at each end.
// Bigger knobs and a slightly narrower shaft make the shape instantly recognisable.
function DogBone({ x, y, s, r }: { x: number; y: number; s: number; r: number }) {
  const hw = s * 0.52;   // half shaft length (center → knob center)
  const sh = s * 0.088;  // shaft half-height
  const kr = s * 0.24;   // knob lobe radius — larger = more recognisable
  const ko = s * 0.175;  // knob lobe vertical offset
  return (
    <g transform={`translate(${x},${y}) rotate(${r})`} fill="white" opacity={0.28}>
      {/* Shaft */}
      <rect x={-(hw - kr*0.4)} y={-sh} width={(hw - kr*0.4)*2} height={sh*2} rx={sh} />
      {/* Left knob lobes */}
      <circle cx={-hw} cy={-ko} r={kr} />
      <circle cx={-hw} cy={ ko} r={kr} />
      {/* Right knob lobes */}
      <circle cx={ hw} cy={-ko} r={kr} />
      <circle cx={ hw} cy={ ko} r={kr} />
    </g>
  );
}

// ── CHERRY BLOSSOM ────────────────────────────────────────────────────────────
// Five petals with pink fills + darker stroke outlines so each flower reads
// clearly against the light-pink Sakura gradient background.
function Blossom({ x, y, s }: { x: number; y: number; s: number }) {
  const pDist = s * 0.48;   // petal center distance from origin (wider = less overlap)
  const pRx   = s * 0.27;
  const pRy   = s * 0.40;
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Petals — individual rgba fills so they pop against light background */}
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        const cx  = +(Math.cos(rad) * pDist).toFixed(2);
        const cy  = +(Math.sin(rad) * pDist).toFixed(2);
        return (
          <ellipse
            key={i}
            cx={cx} cy={cy}
            rx={pRx} ry={pRy}
            fill="rgba(255,140,185,0.52)"
            stroke="rgba(200,60,110,0.22)"
            strokeWidth={s * 0.022}
            transform={`rotate(${angle},${cx},${cy})`}
          />
        );
      })}
      {/* Stamen disk */}
      <circle cx="0" cy="0" r={s * 0.13} fill="rgba(215,70,95,0.72)" />
      {/* Stamen tips */}
      {[0, 60, 120, 180, 240, 300].map((a, i) => {
        const rad = (a * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={+(Math.cos(rad) * s * 0.08).toFixed(2)}
            cy={+(Math.sin(rad) * s * 0.08).toFixed(2)}
            r={s * 0.026}
            fill="rgba(255,160,60,0.88)"
          />
        );
      })}
    </g>
  );
}

// ── COFFEE BEAN ───────────────────────────────────────────────────────────────
function Bean({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${r})`} fill="none">
      <ellipse cx="0" cy="0" rx="4" ry="6.5" stroke="rgba(255,220,160,0.22)" strokeWidth="0.9" />
      <path d="M 0,-5.8 Q 1.8,0 0,5.8" stroke="rgba(255,220,160,0.18)" strokeWidth="0.65" fill="none" />
    </g>
  );
}

// ── ROSE BLOOM ────────────────────────────────────────────────────────────────
// Top-down rose: 7 outer petals + 5 inner petals (offset to fill gaps) + center bud.
// Group opacity = flat silhouette so overlapping ellipses don't compound.
function RoseBloom({ x, y, s }: { x: number; y: number; s: number }) {
  const outerN = 7, innerN = 5;
  return (
    <g transform={`translate(${x},${y})`} opacity={0.22}>
      {/* Outer ring — 7 rounded petals */}
      {Array.from({ length: outerN }, (_, i) => {
        const angle = (i * 360) / outerN;
        const rad   = ((angle - 90) * Math.PI) / 180;
        const cx    = +(Math.cos(rad) * s * 0.50).toFixed(2);
        const cy    = +(Math.sin(rad) * s * 0.50).toFixed(2);
        return (
          <ellipse key={`o${i}`} cx={cx} cy={cy}
            rx={s * 0.24} ry={s * 0.38}
            fill="white"
            transform={`rotate(${angle},${cx},${cy})`} />
        );
      })}
      {/* Inner ring — 5 petals rotated to fill the gaps between outer ones */}
      {Array.from({ length: innerN }, (_, i) => {
        const angle = (i * 360) / innerN + (360 / innerN / 2);
        const rad   = ((angle - 90) * Math.PI) / 180;
        const cx    = +(Math.cos(rad) * s * 0.27).toFixed(2);
        const cy    = +(Math.sin(rad) * s * 0.27).toFixed(2);
        return (
          <ellipse key={`i${i}`} cx={cx} cy={cy}
            rx={s * 0.17} ry={s * 0.26}
            fill="white"
            transform={`rotate(${angle},${cx},${cy})`} />
        );
      })}
      {/* Center bud */}
      <circle cx="0" cy="0" r={s * 0.11} fill="white" />
    </g>
  );
}

// ── RESTAURANT FORK ───────────────────────────────────────────────────────────
// Simplified fork silhouette: pill handle → narrow neck → 3 rounded tines.
// Group opacity = clean flat silhouette regardless of internal overlaps.
function RFork({ x, y, s, r }: { x: number; y: number; s: number; r: number }) {
  const u = s / 10;
  return (
    <g transform={`translate(${x},${y}) rotate(${r})`} fill="white" opacity={0.28}>
      {/* Handle – rounded pill */}
      <rect x={-1.8*u} y={2.5*u} width={3.6*u} height={13*u} rx={1.8*u} />
      {/* Neck – narrows before fan */}
      <rect x={-1.1*u} y={-2.5*u} width={2.2*u} height={6*u} rx={0.7*u} />
      {/* Three tines */}
      <rect x={-3.8*u} y={-15.5*u} width={1.8*u} height={12*u} rx={0.9*u} />
      <rect x={-0.9*u} y={-15.5*u} width={1.8*u} height={12*u} rx={0.9*u} />
      <rect x={ 2.0*u} y={-15.5*u} width={1.8*u} height={12*u} rx={0.9*u} />
    </g>
  );
}

// ── RESTAURANT KNIFE ──────────────────────────────────────────────────────────
// Knife silhouette: pill handle → raised bolster → tapered blade.
function RKnife({ x, y, s, r }: { x: number; y: number; s: number; r: number }) {
  const u = s / 10;
  return (
    <g transform={`translate(${x},${y}) rotate(${r})`} fill="white" opacity={0.28}>
      {/* Handle */}
      <rect x={-1.8*u} y={2.5*u} width={3.6*u} height={13*u} rx={1.8*u} />
      {/* Bolster */}
      <rect x={-2.3*u} y={-0.8*u} width={4.6*u} height={4*u} rx={1.0*u} />
      {/* Blade – tapered toward tip */}
      <path d={`M ${-1.6*u},${-1*u} L ${1.5*u},${-1*u} L ${0.6*u},${-17*u} L ${-1.6*u},${-16*u} Z`}
        strokeLinejoin="round" />
    </g>
  );
}

// ── RESTAURANT PLATE ──────────────────────────────────────────────────────────
// Three concentric ring strokes — outer rim, service ring, well — suggest a real plate.
function RPlate({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx="0" cy="0" r={s}
        fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth={s * 0.06} />
      <circle cx="0" cy="0" r={s * 0.76}
        fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={s * 0.048} />
      <circle cx="0" cy="0" r={s * 0.52}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={s * 0.038} />
    </g>
  );
}

// ── WINE GLASS ────────────────────────────────────────────────────────────────
// Classic wine glass silhouette: wide rim → cubic-bezier bowl → thin stem → flat base.
// Group opacity = flat silhouette so bowl + rim ellipse don't compound.
function RWineGlass({ x, y, s, r }: { x: number; y: number; s: number; r: number }) {
  const u = s / 10;
  return (
    <g transform={`translate(${x},${y}) rotate(${r})`} fill="white" opacity={0.26}>
      {/* Bowl — cubic bezier: wide at rim, bulges slightly mid-bowl, narrows to stem */}
      <path d={`
        M ${-4.0*u},${-10*u}
        C ${-6.5*u},${-4*u} ${-2.0*u},${2*u} ${-1.1*u},${2.2*u}
        Q ${0},${2.6*u} ${1.1*u},${2.2*u}
        C ${2.0*u},${2*u} ${6.5*u},${-4*u} ${4.0*u},${-10*u}
        Z
      `} />
      {/* Rim cap — subtle ellipse makes the opening read as a circle */}
      <ellipse cx={0} cy={-10*u} rx={4.0*u} ry={0.85*u} />
      {/* Stem */}
      <rect x={-0.72*u} y={2.4*u} width={1.44*u} height={10*u} rx={0.72*u} />
      {/* Base */}
      <ellipse cx={0} cy={13*u} rx={4.4*u} ry={1.1*u} />
    </g>
  );
}

// ── 20 Themes ─────────────────────────────────────────────────────────────────
export const themes: ThemeDef[] = [

  // ── 1 ── WAVE ─────────────────────────────────────────────────────────────
  {
    id: "wave", name: "Wave", badge: "Popular",
    gradient: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)",
    text: "#fff",
    Graphic: () => (
      <G>
        <path d="M -10,75 C 10,65 25,82 45,74 C 65,66 80,80 110,72" stroke="rgba(255,255,255,0.13)" strokeWidth="7" fill="none" />
        <path d="M -10,85 C 10,75 25,92 45,84 C 65,76 80,90 110,82" stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="none" />
        <path d="M -10,93 C 10,83 25,100 45,92 C 65,84 80,98 110,90" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
      </G>
    ),
  },

  // ── 2 ── SUNSET ───────────────────────────────────────────────────────────
  {
    id: "sunset", name: "Sunset",
    gradient: "linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)",
    text: "#fff",
    Graphic: () => (
      <G>
        <circle cx="78" cy="18" r="22" fill="rgba(255,255,255,0.05)" />
        <circle cx="78" cy="18" r="14" fill="rgba(255,255,255,0.06)" />
        <circle cx="78" cy="18" r="8"  fill="rgba(255,255,255,0.09)" />
        {[52, 60, 68, 76, 84].map((y, i) => (
          <line key={i} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
        ))}
      </G>
    ),
  },

  // ── 3 ── OCEAN ────────────────────────────────────────────────────────────
  {
    id: "ocean", name: "Ocean",
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
    text: "#fff",
    Graphic: () => (
      <G>
        {[32, 46, 60, 72, 82, 91].map((y, i) => (
          <path key={i}
            d={`M -10,${y} Q 12,${y-5} 28,${y} Q 44,${y+5} 60,${y} Q 76,${y-5} 92,${y} Q 108,${y+5} 120,${y}`}
            stroke={`rgba(255,255,255,${0.07 + i * 0.01})`}
            strokeWidth={2.5 - i * 0.25} fill="none" />
        ))}
      </G>
    ),
  },

  // ── 4 ── FOREST ───────────────────────────────────────────────────────────
  {
    id: "forest", name: "Forest",
    gradient: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
    text: "#fff",
    Graphic: () => (
      <G>
        {[[14,28,-22],[80,22,18],[50,12,0],[28,80,-32],[74,84,28],[92,58,-14]].map(([cx,cy,rot],i) => (
          <ellipse key={i} cx={cx} cy={cy} rx="10" ry="16"
            fill="rgba(255,255,255,0.05)" transform={`rotate(${rot},${cx},${cy})`} />
        ))}
        <path d="M 20,100 Q 30,60 50,40 Q 65,25 80,20" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" fill="none" />
        <path d="M 0,90 Q 15,75 28,60 Q 38,50 42,35"    stroke="rgba(255,255,255,0.05)" strokeWidth="1"   fill="none" />
      </G>
    ),
  },

  // ── 5 ── DARK PRO ─────────────────────────────────────────────────────────
  {
    id: "dark-pro", name: "Dark Pro",
    gradient: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    text: "#a78bfa",
    Graphic: () => (
      <G>
        {Array.from({ length: 9 }, (_, row) =>
          Array.from({ length: 6 }, (_, col) => (
            <circle key={`${row}-${col}`} cx={col*20+10} cy={row*12+6} r="0.6" fill="rgba(167,139,250,0.2)" />
          ))
        )}
        <circle cx="72" cy="28" r="22" fill="rgba(124,58,237,0.08)" />
        <circle cx="72" cy="28" r="13" fill="rgba(124,58,237,0.07)" />
        <circle cx="20" cy="75" r="14" fill="rgba(79,70,229,0.07)" />
      </G>
    ),
  },

  // ── 6 ── ROSE ─────────────────────────────────────────────────────────────
  {
    id: "rose", name: "Rose",
    gradient: "linear-gradient(135deg, #fda4af 0%, #fb7185 50%, #e11d48 100%)",
    text: "#fff",
    Graphic: () => (
      <G>
        {/* Large anchor bloom upper-right */}
        <RoseBloom x={74} y={18} s={24} />
        {/* Medium bloom left-center */}
        <RoseBloom x={18} y={44} s={19} />
        {/* Large bloom lower-center */}
        <RoseBloom x={55} y={68} s={22} />
        {/* Small bloom upper-left */}
        <RoseBloom x={40} y={12} s={13} />
        {/* Smaller accent lower-right */}
        <RoseBloom x={88} y={70} s={14} />
        {/* Tiny accent lower-left */}
        <RoseBloom x={24} y={86} s={11} />
        {/* Tiny accent right-mid */}
        <RoseBloom x={92} y={38} s={10} />
      </G>
    ),
  },

  // ── 7 ── NOIR ─────────────────────────────────────────────────────────────
  {
    id: "noir", name: "Noir",
    gradient: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
    text: "#e5e7eb",
    Graphic: () => (
      <G>
        {[0,15,30,45,60,75,90,105,120].map((v,i) => (
          <line key={i} x1={v-30} y1="0" x2={v+20} y2="100" stroke="rgba(255,255,255,0.025)" strokeWidth="6" />
        ))}
      </G>
    ),
  },

  // ── 8 ── MINIMAL ──────────────────────────────────────────────────────────
  {
    id: "minimal", name: "Minimal",
    gradient: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    text: "#1e293b",
    Graphic: () => (
      <G>
        {Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 6 }, (_, col) => (
            <circle key={`${row}-${col}`} cx={col*20+10} cy={row*14+7} r="0.7" fill="rgba(30,41,59,0.07)" />
          ))
        )}
      </G>
    ),
  },

  // ── 9 ── GOLD ─────────────────────────────────────────────────────────────
  {
    id: "gold", name: "Gold",
    gradient: "linear-gradient(135deg, #78350f 0%, #d97706 50%, #fbbf24 100%)",
    text: "#fff",
    Graphic: () => (
      <G>
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          return (
            <line key={i} x1="85" y1="15"
              x2={85 + Math.cos(angle) * 90} y2={15 + Math.sin(angle) * 90}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1.8" />
          );
        })}
        <circle cx="85" cy="15" r="9" fill="rgba(255,255,255,0.1)" />
        <circle cx="85" cy="15" r="5" fill="rgba(255,255,255,0.14)" />
        <circle cx="85" cy="15" r="2" fill="rgba(255,255,255,0.2)" />
      </G>
    ),
  },

  // ── 10 ── NEON ────────────────────────────────────────────────────────────
  {
    id: "neon", name: "Neon",
    gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%)",
    text: "#00ff9f",
    Graphic: () => (
      <G>
        {[25,50,75].map((v,i) => (
          <g key={i}>
            <line x1={v} y1="0" x2={v} y2="100" stroke="rgba(0,255,159,0.07)" strokeWidth="0.5" />
            <line x1="0" y1={v} x2="100" y2={v} stroke="rgba(0,255,159,0.07)" strokeWidth="0.5" />
          </g>
        ))}
        {[0,10,20,30,40,50,60,70,80,90].map((v,i) => (
          <line key={i} x1="0" y1={v+5} x2="100" y2={v+5} stroke="rgba(0,255,159,0.03)" strokeWidth="4" />
        ))}
        <circle cx="50" cy="50" r="30" fill="rgba(0,255,159,0.03)" />
      </G>
    ),
  },

  // ════════════════════════════════════════════════════════════════════════════
  // GRAPHIC THEMES
  // ════════════════════════════════════════════════════════════════════════════

  // ── 11 ── PAWS ────────────────────────────────────────────────────────────
  {
    id: "paws", name: "Paws", badge: "New",
    gradient: "linear-gradient(150deg, #F59E0B 0%, #D97706 55%, #92400E 100%)",
    text: "#fff",
    suggestedFor: ["pet"],
    Graphic: () => (
      <G>
        {/* ── Main walking trail — left+right foot alternating diagonally ── */}
        {/* Each pair is offset: left foot slightly left, right foot slightly right */}
        <Paw x={26}  y={87}  s={14} r={-14} />  {/* L */}
        <Paw x={50}  y={75}  s={14} r={16}  />  {/* R */}
        <Paw x={24}  y={61}  s={13} r={-13} />  {/* L */}
        <Paw x={48}  y={47}  s={14} r={15}  />  {/* R */}
        <Paw x={22}  y={32}  s={13} r={-15} />  {/* L */}
        <Paw x={46}  y={18}  s={13} r={14}  />  {/* R */}
        {/* ── Accent prints — right edge, smaller, scattered ── */}
        <Paw x={80}  y={22}  s={9}  r={28}  />
        <Paw x={88}  y={50}  s={8}  r={-24} />
        <Paw x={82}  y={76}  s={9}  r={22}  />
      </G>
    ),
  },

  // ── 12 ── BONES ───────────────────────────────────────────────────────────
  {
    id: "bones", name: "Bones", badge: "New",
    gradient: "linear-gradient(150deg, #6366F1 0%, #4F46E5 50%, #3730A3 100%)",
    text: "#fff",
    suggestedFor: ["pet"],
    Graphic: () => (
      <G>
        <DogBone x={24}  y={16}  s={22} r={-28} />
        <DogBone x={76}  y={11}  s={18} r={44}  />
        <DogBone x={47}  y={45}  s={21} r={-6}  />
        <DogBone x={86}  y={62}  s={17} r={70}  />
        <DogBone x={13}  y={73}  s={19} r={-44} />
        <DogBone x={60}  y={84}  s={17} r={25}  />
        <DogBone x={30}  y={91}  s={14} r={-30} />
        {/* Small paw accent prints */}
        <Paw x={90}  y={26}  s={6}  r={12}  />
        <Paw x={8}   y={46}  s={5}  r={-20} />
      </G>
    ),
  },

  // ── 13 ── ESPRESSO ────────────────────────────────────────────────────────
  {
    id: "espresso", name: "Espresso", badge: "New",
    gradient: "linear-gradient(150deg, #1C0A00 0%, #2C1500 50%, #4A2200 100%)",
    text: "#E8D5B7",
    suggestedFor: ["cafe"],
    Graphic: () => (
      <G>
        <Bean x={18}  y={16}  r={-20} /><Bean x={76}  y={10}  r={38}  />
        <Bean x={50}  y={38}  r={-8}  /><Bean x={88}  y={52}  r={55}  />
        <Bean x={14}  y={58}  r={-42} /><Bean x={62}  y={72}  r={28}  />
        <Bean x={34}  y={83}  r={-18} /><Bean x={84}  y={80}  r={12}  />
        <Bean x={28}  y={28}  r={65}  /><Bean x={70}  y={48}  r={-30} />
        <path d="M 46,22 Q 42,17 46,12 Q 50,7 46,2"  stroke="rgba(255,220,160,0.14)" strokeWidth="1.1" fill="none" />
        <path d="M 54,25 Q 50,20 54,15 Q 58,10 54,5" stroke="rgba(255,220,160,0.11)" strokeWidth="1"   fill="none" />
        <path d="M 38,20 Q 34,15 38,10 Q 42,5 38,0"  stroke="rgba(255,220,160,0.09)" strokeWidth="0.9" fill="none" />
      </G>
    ),
  },

  // ── 14 ── PLATED ──────────────────────────────────────────────────────────
  // Single elegant hero place-setting: one large plate centred on the card,
  // fork left + knife right at proper scale, wine glass in upper-right as a
  // secondary focal point, and one quiet accent plate in the upper-left corner.
  {
    id: "plated", name: "Plated", badge: "New",
    gradient: "linear-gradient(150deg, #1C0509 0%, #3D1018 50%, #6B2030 100%)",
    text: "#FFD5DC",
    suggestedFor: ["cafe"],
    Graphic: () => (
      <G>
        {/* ── Hero place-setting ── */}
        {/* Plate — centred, large enough to anchor the composition */}
        <RPlate x={50} y={63} s={25} />
        {/* Fork — left of plate, vertical with a whisker of inward lean */}
        <RFork  x={8}  y={61} s={15} r={3}  />
        {/* Knife — right of plate, mirrored lean */}
        <RKnife x={92} y={63} s={15} r={-3} />

        {/* ── Secondary focal point — wine glass upper-right ── */}
        <RWineGlass x={80} y={20} s={17} r={0} />

        {/* ── Quiet accent — small plate ring upper-left ── */}
        <RPlate x={20} y={22} s={10} />
      </G>
    ),
  },

  // ── 15 ── VINYL ───────────────────────────────────────────────────────────
  // Top-down turntable view: large record with fine grooves, purple label,
  // center spindle hole, and a curved tonearm from top-right to the groove.
  {
    id: "vinyl", name: "Vinyl", badge: "New",
    gradient: "linear-gradient(150deg, #0A0A0A 0%, #1A1A2E 55%, #12122A 100%)",
    text: "#E5E7EB",
    suggestedFor: ["musician"],
    Graphic: () => (
      <G>
        {/* Record disc */}
        <circle cx="56" cy="66" r="32" fill="rgba(4,4,14,0.60)" />
        {/* Grooves — 10 fine concentric rings */}
        {[29, 26, 23, 20, 17, 14, 11.5, 9.5, 7.5, 6].map((r, i) => (
          <circle key={i} cx="56" cy="66" r={r}
            stroke={`rgba(255,255,255,${0.035 + i * 0.008})`}
            strokeWidth="0.65" fill="none" />
        ))}
        {/* Label */}
        <circle cx="56" cy="66" r="8.5" fill="rgba(109,40,217,0.62)" />
        <circle cx="56" cy="66" r="5.5" fill="rgba(91,33,182,0.42)" />
        {/* Center spindle hole */}
        <circle cx="56" cy="66" r="1.8" fill="rgba(0,0,0,0.92)" />
        {/* Sheen highlight across upper-left of disc */}
        <path d="M 30,42 Q 40,34 55,38"
          stroke="rgba(255,255,255,0.07)" strokeWidth="9" fill="none" strokeLinecap="round" />
        {/* Platter mat outer ring */}
        <circle cx="56" cy="66" r="32"
          stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" fill="none" />
        {/* ── Tonearm ── */}
        {/* Pivot bearing */}
        <circle cx="91" cy="12" r="3.5" fill="rgba(255,255,255,0.18)" />
        {/* Arm tube — curves from pivot down to needle position on record */}
        <path d="M 91,12 Q 88,32 72,50"
          stroke="rgba(255,255,255,0.30)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* Headshell / cartridge at needle end */}
        <rect x="68" y="47" width="9" height="5" rx="1.5"
          fill="rgba(255,255,255,0.20)" transform="rotate(-35,68,47)" />
        {/* Needle tip touching the groove */}
        <circle cx="71" cy="50" r="1.6" fill="rgba(255,255,255,0.38)" />
        {/* Counterweight at back of arm */}
        <rect x="88" y="9" width="7" height="3.5" rx="1.2"
          fill="rgba(255,255,255,0.14)" />
      </G>
    ),
  },

  // ── 16 ── COSMOS ──────────────────────────────────────────────────────────
  {
    id: "cosmos", name: "Cosmos", badge: "New",
    gradient: "linear-gradient(150deg, #020412 0%, #0B1437 50%, #18104A 100%)",
    text: "#fff",
    suggestedFor: ["individual"],
    Graphic: () => {
      const stars: [number,number,number][] = [
        [7,4,.6],[22,11,.4],[44,3,.7],[66,7,.5],[83,14,.4],[91,4,.6],
        [14,24,.5],[53,19,.8],[91,29,.5],[35,31,.4],[74,27,.6],
        [5,44,.5],[27,47,.4],[62,41,.7],[88,49,.5],[46,53,.4],
        [17,61,.6],[71,64,.5],[37,69,.7],[95,67,.4],[8,74,.5],
        [51,77,.4],[84,79,.6],[24,84,.5],[64,87,.4],[41,91,.6],
        [77,91,.5],[11,91,.4],[97,87,.5],[31,17,.5],[69,41,.4],
        [58,6,.5],[3,62,.4],[80,55,.3],
      ];
      return (
        <G>
          {stars.map(([x,y,r],i) => <circle key={i} cx={x} cy={y} r={r} fill="rgba(255,255,255,0.88)" />)}
          {([[30,14,2],[84,38,1.6],[10,53,1.4]] as [number,number,number][]).map(([x,y,s],i) => (
            <path key={i}
              d={`M${x},${y-s} L${x+s*.3},${y-s*.3} L${x+s},${y} L${x+s*.3},${y+s*.3} L${x},${y+s} L${x-s*.3},${y+s*.3} L${x-s},${y} L${x-s*.3},${y-s*.3}Z`}
              fill="rgba(255,255,255,0.75)" />
          ))}
          <circle cx="58" cy="34" r="28" fill="rgba(79,70,229,0.08)" />
          <circle cx="22" cy="68" r="20" fill="rgba(124,58,237,0.06)" />
          <circle cx="82" cy="72" r="15" fill="rgba(6,182,212,0.05)" />
        </G>
      );
    },
  },

  // ── 17 ── AURORA ──────────────────────────────────────────────────────────
  {
    id: "aurora", name: "Aurora", badge: "New",
    gradient: "linear-gradient(160deg, #0D1B2A 0%, #0E2318 50%, #0D2A1A 100%)",
    text: "#fff",
    suggestedFor: ["individual", "musician"],
    Graphic: () => (
      <G>
        <path d="M -10,32 Q 12,20 32,28 Q 52,36 68,22 Q 84,10 110,26" stroke="rgba(52,211,153,0.28)" strokeWidth="9" fill="none" />
        <path d="M -10,46 Q 18,36 38,43 Q 58,50 76,36 Q 90,24 110,40" stroke="rgba(56,189,248,0.22)" strokeWidth="7" fill="none" />
        <path d="M -10,58 Q 16,50 36,56 Q 56,62 74,48 Q 88,36 110,53" stroke="rgba(167,139,250,0.2)"  strokeWidth="5.5" fill="none" />
        <path d="M -10,68 Q 20,61 40,67 Q 60,73 76,60 Q 88,49 110,64" stroke="rgba(52,211,153,0.14)" strokeWidth="4" fill="none" />
        <path d="M -10,78 Q 22,72 42,77 Q 62,82 78,70 Q 90,60 110,74" stroke="rgba(56,189,248,0.1)"  strokeWidth="3" fill="none" />
        {[[9,4,.4],[28,7,.5],[54,2,.4],[74,9,.5],[90,5,.4],[18,14,.4],[83,17,.5],[44,11,.3]].map(([x,y,r],i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="rgba(255,255,255,0.82)" />
        ))}
      </G>
    ),
  },

  // ── 18 ── SAKURA ──────────────────────────────────────────────────────────
  {
    id: "sakura", name: "Sakura", badge: "New",
    gradient: "linear-gradient(150deg, #FEF2F2 0%, #FCE7F3 50%, #FBD0E6 100%)",
    text: "#831843",
    suggestedFor: ["individual", "cafe"],
    Graphic: () => (
      <G>
        {/* ── Branch structure ── */}
        {/* Main diagonal branch bottom-left → top-right */}
        <path d="M 4,100 Q 22,72 42,44 Q 55,22 72,8"
          stroke="rgba(140,55,82,0.28)" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        {/* Left sub-branch from mid-main */}
        <path d="M 28,66 Q 18,56 10,50"
          stroke="rgba(140,55,82,0.22)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Upper-right sub-branch */}
        <path d="M 48,40 Q 58,32 64,22"
          stroke="rgba(140,55,82,0.22)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Right fork at top */}
        <path d="M 62,16 Q 74,26 86,22"
          stroke="rgba(140,55,82,0.20)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Lower-left twig */}
        <path d="M 18,78 Q 10,70 6,64"
          stroke="rgba(140,55,82,0.18)" strokeWidth="1.3" fill="none" strokeLinecap="round" />

        {/* ── Blossoms at branch tips and key nodes ── */}
        <Blossom x={8}   y={48}  s={14} />
        <Blossom x={44}  y={38}  s={15} />
        <Blossom x={62}  y={18}  s={13} />
        <Blossom x={84}  y={20}  s={12} />
        <Blossom x={6}   y={62}  s={11} />
        <Blossom x={26}  y={62}  s={12} />
        <Blossom x={72}  y={10}  s={11} />
        {/* Scattered blossoms off-branch */}
        <Blossom x={88}  y={52}  s={9}  />
        <Blossom x={92}  y={76}  s={8}  />
        <Blossom x={34}  y={86}  s={9}  />
      </G>
    ),
  },

  // ── 19 ── STAGE ───────────────────────────────────────────────────────────
  {
    id: "stage", name: "Stage", badge: "New",
    gradient: "linear-gradient(170deg, #0A0A0A 0%, #1A1A2E 55%, #0D0D1A 100%)",
    text: "#fff",
    suggestedFor: ["event", "musician"],
    Graphic: () => (
      <G>
        <path d="M 18,0 L 0,100 L 38,100 Z"  fill="rgba(255,255,255,0.04)" />
        <path d="M 50,0 L 28,100 L 72,100 Z"  fill="rgba(255,255,255,0.055)" />
        <path d="M 82,0 L 62,100 L 100,100 Z" fill="rgba(255,255,255,0.04)" />
        <circle cx="18" cy="0" r="2.5" fill="rgba(255,255,200,0.25)" />
        <circle cx="50" cy="0" r="2.8" fill="rgba(255,255,200,0.30)" />
        <circle cx="82" cy="0" r="2.5" fill="rgba(255,255,200,0.25)" />
        <circle cx="18" cy="0" r="7"   fill="rgba(255,255,180,0.06)" />
        <circle cx="50" cy="0" r="8"   fill="rgba(255,255,180,0.07)" />
        <circle cx="82" cy="0" r="7"   fill="rgba(255,255,180,0.06)" />
        <ellipse cx="19" cy="100" rx="20" ry="5" fill="rgba(255,255,255,0.05)" />
        <ellipse cx="50" cy="100" rx="24" ry="6" fill="rgba(255,255,255,0.06)" />
        <ellipse cx="81" cy="100" rx="20" ry="5" fill="rgba(255,255,255,0.05)" />
        {[[5,6,.4],[14,12,.3],[35,8,.4],[66,6,.3],[88,10,.4],[95,20,.3],[75,4,.4]].map(([x,y,r],i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="rgba(255,255,255,0.65)" />
        ))}
      </G>
    ),
  },

  // ── 20 ── BLUEPRINT ───────────────────────────────────────────────────────
  {
    id: "blueprint", name: "Blueprint", badge: "New",
    gradient: "linear-gradient(150deg, #0A1628 0%, #0D2137 50%, #112846 100%)",
    text: "#BAE6FD",
    suggestedFor: ["business"],
    Graphic: () => (
      <G>
        {[10,20,30,40,50,60,70,80,90].map((v) => (
          <g key={v}>
            <line x1={v} y1="0" x2={v} y2="100" stroke="rgba(186,230,253,0.07)" strokeWidth="0.4" />
            <line x1="0" y1={v} x2="100" y2={v} stroke="rgba(186,230,253,0.07)" strokeWidth="0.4" />
          </g>
        ))}
        {[25,50,75].map((v) => (
          <g key={v}>
            <line x1={v} y1="0" x2={v} y2="100" stroke="rgba(186,230,253,0.12)" strokeWidth="0.6" />
            <line x1="0" y1={v} x2="100" y2={v} stroke="rgba(186,230,253,0.12)" strokeWidth="0.6" />
          </g>
        ))}
        <path d="M 4,18 V 4 H 18"   stroke="rgba(186,230,253,0.3)" strokeWidth="0.8" fill="none" />
        <path d="M 96,18 V 4 H 82"  stroke="rgba(186,230,253,0.3)" strokeWidth="0.8" fill="none" />
        <path d="M 4,82 V 96 H 18"  stroke="rgba(186,230,253,0.2)" strokeWidth="0.8" fill="none" />
        <path d="M 96,82 V 96 H 82" stroke="rgba(186,230,253,0.2)" strokeWidth="0.8" fill="none" />
        <circle cx="84" cy="80" r="9"   stroke="rgba(186,230,253,0.18)" strokeWidth="0.6" fill="none" />
        <circle cx="84" cy="80" r="4.5" stroke="rgba(186,230,253,0.12)" strokeWidth="0.5" fill="none" />
        <line x1="84" y1="71" x2="84" y2="89" stroke="rgba(186,230,253,0.15)" strokeWidth="0.5" />
        <line x1="75" y1="80" x2="93" y2="80" stroke="rgba(186,230,253,0.15)" strokeWidth="0.5" />
        <line x1="5"  y1="93" x2="38" y2="93" stroke="rgba(186,230,253,0.2)" strokeWidth="0.5" />
        <line x1="5"  y1="91" x2="5"  y2="95" stroke="rgba(186,230,253,0.2)" strokeWidth="0.5" />
        <line x1="38" y1="91" x2="38" y2="95" stroke="rgba(186,230,253,0.2)" strokeWidth="0.5" />
      </G>
    ),
  },
];

// ── Color Palettes ─────────────────────────────────────────────────────────────
export const palettes: Palette[] = [
  { id: "original",     name: "Original",     previewColors: [],              gradient: "",  text: "" },
  { id: "midnight",     name: "Midnight",     previewColors: ["#020617","#1E293B"],  gradient: "linear-gradient(150deg,#020617 0%,#1E293B 100%)",       text: "#fff" },
  { id: "deep-ocean",   name: "Deep Ocean",   previewColors: ["#0C4A6E","#0EA5E9"],  gradient: "linear-gradient(150deg,#0C4A6E 0%,#0369A1 50%,#0EA5E9 100%)",       text: "#fff" },
  { id: "aubergine",    name: "Aubergine",    previewColors: ["#3B0764","#7C3AED"],  gradient: "linear-gradient(150deg,#3B0764 0%,#6D28D9 50%,#7C3AED 100%)",       text: "#fff" },
  { id: "dark-forest",  name: "Dark Forest",  previewColors: ["#022C22","#065F46"],  gradient: "linear-gradient(150deg,#022C22 0%,#064E3B 50%,#065F46 100%)",       text: "#6EE7B7" },
  { id: "crimson",      name: "Crimson",      previewColors: ["#450A0A","#B91C1C"],  gradient: "linear-gradient(150deg,#450A0A 0%,#7F1D1D 50%,#B91C1C 100%)",       text: "#fff" },
  { id: "warm-ember",   name: "Warm Ember",   previewColors: ["#431407","#EA580C"],  gradient: "linear-gradient(150deg,#431407 0%,#9A3412 50%,#EA580C 100%)",       text: "#fff" },
  { id: "electric",     name: "Electric",     previewColors: ["#1E1B4B","#818CF8"],  gradient: "linear-gradient(150deg,#1E1B4B 0%,#3730A3 50%,#818CF8 100%)",       text: "#fff" },
  { id: "cosmic",       name: "Cosmic",       previewColors: ["#1A0533","#C026D3"],  gradient: "linear-gradient(150deg,#1A0533 0%,#7E22CE 50%,#C026D3 100%)",       text: "#fff" },
  { id: "tropical",     name: "Tropical",     previewColors: ["#0D3B38","#14B8A6"],  gradient: "linear-gradient(150deg,#0D3B38 0%,#0F766E 50%,#14B8A6 100%)",       text: "#fff" },
  { id: "rose-gold",    name: "Rose Gold",    previewColors: ["#881337","#FB7185"],  gradient: "linear-gradient(150deg,#881337 0%,#BE123C 50%,#FB7185 100%)",       text: "#fff" },
  { id: "amber-glow",   name: "Amber Glow",   previewColors: ["#451A03","#D97706"],  gradient: "linear-gradient(150deg,#451A03 0%,#92400E 50%,#D97706 100%)",       text: "#fff" },
  { id: "cotton-candy", name: "Cotton Candy", previewColors: ["#F9A8D4","#C084FC"],  gradient: "linear-gradient(150deg,#FDF2F8 0%,#F9A8D4 50%,#C084FC 100%)",       text: "#831843" },
  { id: "arctic",       name: "Arctic",       previewColors: ["#E0F2FE","#BAE6FD"],  gradient: "linear-gradient(150deg,#F0F9FF 0%,#E0F2FE 50%,#BAE6FD 100%)",       text: "#0C4A6E" },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────────
export function getTheme(id: string): ThemeDef {
  return themes.find((t) => t.id === id) ?? themes[0];
}

export function suggestedThemes(templateTypeId: string): ThemeDef[] {
  return themes.filter((t) => t.suggestedFor?.includes(templateTypeId));
}

export function getGradient(themeId: string, paletteId: string): { gradient: string; text: string } {
  const theme = getTheme(themeId);
  if (!paletteId || paletteId === "original") return { gradient: theme.gradient, text: theme.text };
  const palette = palettes.find((p) => p.id === paletteId);
  if (!palette || !palette.gradient) return { gradient: theme.gradient, text: theme.text };
  return { gradient: palette.gradient, text: palette.text };
}