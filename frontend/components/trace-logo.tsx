import React from "react";

interface TraceMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  variant?: "gradient" | "monochrome" | "white";
}

/**
 * Official TRACE Logo Mark
 * Exact geometric ribbon T with the continuous internal trace path and telemetry nodes.
 */
export function TraceMark({
  size = 22,
  variant = "gradient",
  className = "",
  ...props
}: TraceMarkProps) {
  const beamId = React.useId();
  const stemId = React.useId();
  const sheenId = React.useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient
          id={beamId}
          x1="6"
          y1="8"
          x2="42"
          y2="18"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="45%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>

        <linearGradient
          id={stemId}
          x1="20"
          y1="14"
          x2="28"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="55%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#00F0FF" />
        </linearGradient>

        <linearGradient
          id={sheenId}
          x1="6"
          y1="8"
          x2="42"
          y2="8"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Ambient Glow */}
      <path
        d="M 8 10 H 40 V 17 H 28 V 40 H 20 V 17 H 8 Z"
        fill={variant === "white" ? "#FFFFFF" : `url(#${beamId})`}
        opacity="0.3"
      />

      {/* Top Crossbar */}
      <path
        d="M 7 9 C 7 7.895 7.895 7 9 7 H 39 C 40.105 7 41 7.895 41 9 V 15 C 41 16.105 40.105 17 39 17 H 9 C 7.895 17 7 16.105 7 15 V 9 Z"
        fill={variant === "white" ? "#FFFFFF" : `url(#${beamId})`}
      />
      <path
        d="M 9 8.5 H 39 C 39.55 8.5 40 8.95 40 9.5 V 10.5 C 40 11.05 39.55 11.5 39 11.5 H 9 C 8.45 11.5 8 11.05 8 10.5 V 9.5 C 8 8.95 8.45 8.5 9 8.5 Z"
        fill={`url(#${sheenId})`}
        opacity="0.8"
      />

      {/* Vertical Core Column */}
      <path
        d="M 20.5 15 H 27.5 V 39 C 27.5 40.657 26.157 42 24.5 42 H 23.5 C 21.843 42 20.5 40.657 20.5 39 V 15 Z"
        fill={variant === "white" ? "#FFFFFF" : `url(#${stemId})`}
      />

      {/* Central Laser Track Line */}
      <path
        d="M 24 12 V 38"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Nodes */}
      <circle cx="24" cy="12" r="2.2" fill="#FFFFFF" />
      <circle cx="24" cy="25" r="1.8" fill="#00F0FF" />
      <circle cx="24" cy="38" r="2.2" fill="#00F0FF" />
      <circle cx="9" cy="12" r="1.5" fill="#00F0FF" />
      <circle cx="39" cy="12" r="1.5" fill="#EC4899" />
    </svg>
  );
}

export function TraceWordmark({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      className={`font-bold tracking-[0.14em] text-[var(--text-primary)] font-mono text-[14.5px] leading-none select-none ${className}`}
    >
      TRACE
    </span>
  );
}

export function TraceLogo({
  size = 22,
  className = "",
  showWordmark = true,
  variant = "gradient",
}: {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  variant?: "gradient" | "monochrome" | "white";
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="grid place-items-center">
        <TraceMark size={size} variant={variant} />
      </span>
      {showWordmark && <TraceWordmark />}
    </div>
  );
}
