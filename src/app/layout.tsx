import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// UPDATED: Global SEO Metadata for Crpapo
export const metadata: Metadata = {
  title: "Crpapo | The Interactive Pattern Library",
  description: "The interactive pattern library where crafters never lose their place, and designers share their work beautifully.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAF9] text-[#2D2D2D]">
        
        {/* Main Content Area */}
        <div className="flex-1">
          {children}
        </div>

        {/* Global Footer & Affiliate Disclosure */}
        <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-6 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xl font-extrabold tracking-tighter text-[#2D2D2D]">Crpapo</p>
              <p className="text-xs text-gray-500 max-w-lg leading-relaxed">
                Crpapo is a platform for crafters and designers. Some patterns contain affiliate links, meaning designers may earn a commission if you make a purchase through those links, at no extra cost to you.
              </p>
            </div>
            <div className="text-xs font-semibold text-gray-400 flex gap-4">
              <span>© {new Date().getFullYear()} Crpapo. All rights reserved.</span>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}