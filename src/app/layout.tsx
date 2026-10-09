import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Global SEO Metadata for Crpapo
export const metadata: Metadata = {
  metadataBase: new URL("https://crpapo.com"),
  title: {
    default: "Crpapo | The Interactive Pattern Library",
    template: "%s | Crpapo",
  },
  description:
    "The interactive crochet pattern library where crafters never lose their place, and designers share their work beautifully.",
  keywords: [
    "crochet patterns",
    "free crochet patterns",
    "interactive pattern tracker",
    "crochet row counter",
    "amigurumi patterns",
    "crochet garment patterns",
    "crochet pattern library",
  ],
  authors: [{ name: "Crpapo" }],
  creator: "Crpapo",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://crpapo.com",
    siteName: "Crpapo",
    title: "Crpapo | The Interactive Pattern Library",
    description:
      "The interactive crochet pattern library where crafters never lose their place, and designers share their work beautifully.",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Crpapo - The Interactive Pattern Library",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crpapo | The Interactive Pattern Library",
    description:
      "The interactive crochet pattern library where crafters never lose their place, and designers share their work beautifully.",
    images: ["/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

const globalJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://crpapo.com/#organization",
      name: "Crpapo",
      url: "https://crpapo.com",
      logo: "https://crpapo.com/icon.png",
      description:
        "The interactive pattern library where crafters never lose their place, and designers share their work beautifully.",
    },
    {
      "@type": "WebSite",
      "@id": "https://crpapo.com/#website",
      url: "https://crpapo.com",
      name: "Crpapo",
      description:
        "Interactive crochet pattern library and row tracking tool for crafters and designers.",
      publisher: {
        "@id": "https://crpapo.com/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://crpapo.com/explore?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
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
      <head>
        {/* Global WebSite & Organization Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalJsonLd) }}
        />
        {/* Google Analytics GA4 */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-6965SMN50D"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-6965SMN50D', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#FAFAF9] text-[#2D2D2D]">
        {/* Main Content Area */}
        <div className="flex-1">{children}</div>

        {/* Professional Global Footer */}
        <footer className="bg-white border-t border-gray-200 pt-12 pb-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8">
              {/* Brand & Disclosure Column */}
              <div className="md:col-span-2 space-y-4">
                <p className="text-2xl font-extrabold tracking-tighter text-[#2D2D2D]">
                  Crpapo
                </p>
                <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                  The interactive pattern library where crafters never lose their place, and
                  designers share their work beautifully.
                </p>
                <p className="text-xs text-gray-400 max-w-md leading-relaxed">
                  *Some patterns contain affiliate links. Designers may earn a commission if you make
                  a purchase through those links, at no extra cost to you.
                </p>
              </div>

              {/* Platform Navigation */}
              <div>
                <h3 className="font-bold text-[#2D2D2D] mb-4">Platform</h3>
                <ul className="space-y-3 text-sm text-gray-500 font-medium">
                  <li>
                    <Link
                      href="/explore"
                      className="hover:text-[#D97757] transition-colors"
                    >
                      Explore Patterns
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard"
                      className="hover:text-[#D97757] transition-colors"
                    >
                      Creator Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="hover:text-[#D97757] transition-colors"
                    >
                      Log in / Sign up
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal & Support */}
              <div>
                <h3 className="font-bold text-[#2D2D2D] mb-4">Legal</h3>
                <ul className="space-y-3 text-sm text-gray-500 font-medium">
                  <li>
                    <Link href="/terms" className="hover:text-[#D97757] transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy" className="hover:text-[#D97757] transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-[#D97757] transition-colors">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright Bar */}
            <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <span className="text-xs font-semibold text-gray-400">
                © {new Date().getFullYear()} Crpapo. All rights reserved.
              </span>
            </div>
          </div>
        </footer>

        {/* Vercel Web Analytics */}
        <Analytics />
      </body>
    </html>
  );
}