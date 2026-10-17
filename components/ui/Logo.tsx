import Link from "next/link";

interface LogoProps {
  size?: number;
  href?: string;
  showTagline?: boolean;
  className?: string;
}

export default function Logo({ size = 32, href = "/", showTagline = false, className = "" }: LogoProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2.5 transition-opacity hover:opacity-90 ${className}`}
    >
      {/* Minimalist Geometric Vector Mark */}
      <div
        className="relative flex items-center justify-center rounded-lg border border-white/[0.1] bg-[#16171a] shadow-sm transition-colors group-hover:border-white/[0.18]"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5 text-white"
        >
          {/* Minimalist Voice-Waveform Bars */}
          <rect x="3" y="9" width="2" height="6" rx="1" fill="#71717A" />
          <rect x="7" y="6" width="2" height="12" rx="1" fill="#EDEDED" />
          <rect x="11" y="4" width="2" height="16" rx="1" fill="#3B82F6" />
          <rect x="15" y="7" width="2" height="10" rx="1" fill="#EDEDED" />
          <rect x="19" y="10" width="2" height="4" rx="1" fill="#71717A" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 font-semibold text-sm tracking-tight text-[#ededed]">
          <span>VoiceForm</span>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.06] font-normal">
            AI
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] text-zinc-400 font-normal">
            Conversational voice forms
          </span>
        )}
      </div>
    </Link>
  );
}
