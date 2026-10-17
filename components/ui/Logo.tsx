import Link from "next/link";

interface LogoProps {
  size?: number;
  href?: string;
  showTagline?: boolean;
  className?: string;
}

export default function Logo({ size = 42, href = "/", showTagline = false, className = "" }: LogoProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 transition-transform duration-200 hover:scale-[1.02] ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Ambient neon backglow behind logo */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500/40 via-purple-500/30 to-sky-400/40 blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="VoiceForm AI"
          width={size}
          height={size}
          className="relative rounded-xl border border-white/10 shadow-lg object-contain bg-black"
        />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center font-bold tracking-tight text-lg text-white">
          <span className="text-white drop-shadow-sm">VoiceForm</span>
          <span className="ml-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400 bg-clip-text text-transparent font-extrabold drop-shadow">
            AI
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] uppercase font-semibold tracking-[0.2em] text-slate-400 group-hover:text-indigo-300 transition-colors">
            Speak • AI Fills • Done
          </span>
        )}
      </div>
    </Link>
  );
}
