import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceForm AI | Speak • AI Fills • Done",
  description: "Next-generation AI-powered voice forms. Answer by speaking, effortlessly transcribed and structured in real time.",
  icons: {
    icon: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05070e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#05070e] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-white relative overflow-x-hidden">
        {/* Ambient atmospheric background lighting */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full ambient-glow-indigo blur-[120px]" />
          <div className="absolute top-1/4 -right-40 h-[600px] w-[600px] rounded-full ambient-glow-purple blur-[140px]" />
          <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full ambient-glow-cyan blur-[130px]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
