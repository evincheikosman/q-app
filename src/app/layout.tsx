import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import AuthProvider from "@/components/AuthProvider";
import PenFont from "@/components/PenFont";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "800"],
  display: "swap",
});

// The pen (Zeyada) is loaded browser-side in globals.css — used ONLY for
// handwritten notes via .font-pen, never UI text.

export const metadata: Metadata = {
  title: "Q — Your class, on cue.",
  description: "AI-powered routine and playlist builder for Lagree fitness instructors.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Q" },
};

export const viewport = {
  themeColor: "#0D0D0F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <PenFont />
        <AuthProvider>
          <div className="flex-1 pb-[72px] app-column">{children}</div>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
