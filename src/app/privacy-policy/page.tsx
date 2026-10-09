import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Crpapo',
  description:
    'Read the Crpapo Privacy Policy to understand how we collect, use, and protect your information when you use our interactive crochet pattern library.',
  alternates: {
    canonical: 'https://crpapo.com/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mt-2">Last updated: October 2026</p>
        </header>

        <article className="prose prose-stone max-w-none space-y-8 text-[#2D2D2D] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. Overview</h2>
            <p className="text-gray-600">
              Welcome to <strong>Crpapo</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), available at{' '}
              <a href="https://crpapo.com" className="text-[#D97757] underline">
                https://crpapo.com
              </a>
              . We respect your privacy and are committed to protecting any personal information you
              share with us. This Privacy Policy explains what information we collect, how it is used,
              and how we safeguard your data when using our interactive crochet pattern platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>
                <strong>Account Information:</strong> When you register as a creator or crafter, we
                collect your email address and authentication credentials securely processed through
                Supabase Auth.
              </li>
              <li>
                <strong>Profile & Content:</strong> Creators may optionally share profile usernames,
                bios, avatars, external social media links (Instagram, Pinterest, YouTube, personal
                websites), and pattern materials/instructions.
              </li>
              <li>
                <strong>Local Pattern Progress:</strong> Row completion data and active row counters
                are saved locally on your device via browser local storage (LocalStorage) so your
                progress is never lost while crafting.
              </li>
              <li>
                <strong>Analytics & Usage Data:</strong> We collect non-personally identifiable usage
                metrics (such as page views, device type, browser type, and referrer) using Google
                Analytics (GA4) and Vercel Web Analytics to improve application performance and user
                experience.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. How We Use Your Information</h2>
            <p className="text-gray-600">We use collected information solely to:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Provide, maintain, and enhance the Crpapo platform and interactive pattern tracking.</li>
              <li>Authenticate accounts and secure creator publishing workflows.</li>
              <li>Display creator attribution and pattern galleries.</li>
              <li>Detect and prevent spam, fraud, or terms-of-service violations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">4. Affiliate Links & External Content</h2>
            <p className="text-gray-600">
              Some crochet patterns on Crpapo may feature outbound links to recommended yarns, crochet
              hooks, or external video tutorials (e.g., YouTube). Some of these links may be
              affiliate links where designers or Crpapo may earn a modest commission at no extra cost
              to you. We do not share your personal account information with external merchants.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">5. Data Security & Storage</h2>
            <p className="text-gray-600">
              Your account details and published content are protected using enterprise-grade cloud
              infrastructure provided by Supabase and Vercel. We implement strict Row-Level Security
              (RLS) policies to protect non-public account information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">6. Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions or requests regarding your personal data or this Privacy
              Policy, please contact us at{' '}
              <a href="mailto:contact@crpapo.com" className="text-[#D97757] underline">
                contact@crpapo.com
              </a>{' '}
              or visit our{' '}
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