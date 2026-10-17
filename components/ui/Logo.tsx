import Link from "next/link";

export default function Logo({ size = 40, href = "/" }: { size?: number; href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-semibold text-slate-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" width={size} height={size} className="rounded-lg" />
      <span>VoiceForm AI</span>
    </Link>
  );
}
