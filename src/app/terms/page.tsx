import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Crpapo',
  description:
    'Read the Crpapo Terms of Service governing the use of our interactive pattern library, creator publishing tools, and content guidelines.',
  alternates: {
    canonical: 'https://crpapo.com/terms',
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#2D2D2D]">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tighter">
            Crpapo
          </Link>
          <Link
            href="/explore"
            className="text-sm font-semibold text-gray-500 hover:text-[#D97757]"
          >
            ← Explore Patterns
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-gray-500 mt-2">Last updated: October 2026</p>
        </header>

        <article className="prose prose-stone max-w-none space-y-8 text-[#2D2D2D] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. Acceptance of Terms</h2>
            <p className="text-gray-600">
              By accessing, browsing, or publishing on <strong>Crpapo</strong> (accessible at{' '}
              <a href="https://crpapo.com" className="text-[#D97757] underline">
                https://crpapo.com
              </a>
              ), you agree to comply with and be bound by these Terms of Service. If you do not agree
              with any part of these terms, please discontinue use of the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. Creator Rights & Intellectual Property</h2>
            <p className="text-gray-600">
              Designers and creators retain ownership and copyright of the original text, step-by-step
              instructions, and images they publish to Crpapo. By submitting a pattern to Crpapo, you
              grant us a non-exclusive, worldwide license to display, host, and index your content to
              enable the interactive pattern library features for users.
            </p>
            <p className="text-gray-600">
              Creators represent and warrant that they have all necessary rights and permissions to
              publish their submitted patterns and that content does not infringe upon any third-party
              copyrights or trademarks.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. Acceptable Use Policy</h2>
            <p className="text-gray-600">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Publish plagiarized, misleading, or abusive content.</li>
              <li>Upload malicious code, scripts, or corrupted files.</li>
              <li>Attempt to scrape, reverse engineer, or disrupt the operation of the platform.</li>
              <li>Impersonate any person, brand, or entity.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">4. Content Moderation & Reporting</h2>
            <p className="text-gray-600">
              Crpapo provides community reporting tools on every pattern page. We reserve the right to
              review, unpublish, or permanently delete any content or account that violates our
              acceptable use policies, intellectual property rights, or community standards.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">5. Disclaimer of Warranties</h2>
            <p className="text-gray-600">
              Crpapo is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of
              any kind, either express or implied. While we strive to ensure 100% uptime and reliable
              row tracking, we make no guarantees that service will be uninterrupted or error-free.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">6. Contact Information</h2>
            <p className="text-gray-600">
              Questions regarding these Terms of Service can be directed to{' '}
              <a href="mailto:contact@crpapo.com" className="text-[#D97757] underline">
                contact@crpapo.com
              </a>{' '}
              or via our{' '}
              <Link href="/contact" className="text-[#D97757] underline">
                Contact Page
              </Link>
              .
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}