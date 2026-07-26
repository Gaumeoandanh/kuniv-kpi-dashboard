export default function CatIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="K-UNIV mascot cat"
    >
      <circle cx="60" cy="60" r="58" fill="#CCFBF1" />
      {/* ears */}
      <path d="M32 40 L24 14 L52 34 Z" fill="#0D9488" />
      <path d="M88 40 L96 14 L68 34 Z" fill="#0D9488" />
      <path d="M35 38 L30 20 L50 34 Z" fill="#5EEAD4" />
      <path d="M85 38 L90 20 L70 34 Z" fill="#5EEAD4" />
      {/* face */}
      <ellipse cx="60" cy="66" rx="34" ry="30" fill="#FFFFFF" />
      {/* eyes */}
      <circle cx="48" cy="62" r="4.5" fill="#0F766E" />
      <circle cx="72" cy="62" r="4.5" fill="#0F766E" />
      {/* blush */}
      <ellipse cx="40" cy="74" rx="6" ry="3.5" fill="#FDA4AF" opacity="0.7" />
      <ellipse cx="80" cy="74" rx="6" ry="3.5" fill="#FDA4AF" opacity="0.7" />
      {/* nose + mouth */}
      <path d="M60 70 L56 75 L64 75 Z" fill="#0D9488" />
      <path
        d="M60 75 Q60 80 52 80 M60 75 Q60 80 68 80"
        stroke="#0F766E"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* whiskers */}
      <path
        d="M20 64 L38 66 M20 72 L38 70 M100 64 L82 66 M100 72 L82 70"
        stroke="#0F766E"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
