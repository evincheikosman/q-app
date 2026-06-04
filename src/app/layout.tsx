import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Q — Your class, on cue.",
  description: "AI-powered routine and playlist builder for Lagree fitness instructors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
          <div className="flex-1 pb-[72px]">{children}</div>
          <BottomNav />
        </body>
    </html>
  );
}
