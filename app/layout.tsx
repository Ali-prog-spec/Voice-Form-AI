import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceForm • Intelligent Voice Forms",
  description: "Create and publish conversational forms respondents can answer by speaking.",
  icons: {
    icon: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090a0c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090a0c] text-[#ededed] antialiased selection:bg-blue-600/30 selection:text-white relative">
        {/* Subtle, refined top highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-blue-950/15 via-transparent to-transparent -z-10" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
