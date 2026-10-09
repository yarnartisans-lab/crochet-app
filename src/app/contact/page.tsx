import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us | Crpapo',
  description:
    'Have a question, feedback, or need help with Crpapo? Get in touch with our team. We are here to support creators and crafters.',
  alternates: {
    canonical: 'https://crpapo.com/contact',
  },
};

export default function ContactPage() {
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

      <main className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Contact Us</h1>
          <p className="text-base text-gray-500 mt-2">
            Have questions, feedback, or need help with a pattern? We&apos;d love to hear from you.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#D97757]/10 flex items-center justify-center text-[#D97757]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold">Email Support</h2>
            <p className="text-sm text-gray-500">
              For general inquiries, account assistance, or creator questions:
            </p>
            <a
              href="mailto:contact@crpapo.com"
              className="inline-block text-[#D97757] font-semibold text-sm hover:underline"
            >
              contact@crpapo.com
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#146b53]/10 flex items-center justify-center text-[#146b53]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold">Creator Community</h2>
            <p className="text-sm text-gray-500">
              Are you a crochet designer wanting to publish your interactive patterns?
            </p>
            <Link
              href="/publish"
              className="inline-block text-[#146b53] font-semibold text-sm hover:underline"
            >
              Start Publishing →
            </Link>
          </div>
        </div>

        <section className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-[#2D2D2D]">How does interactive row tracking work?</p>
              <p className="text-gray-500 mt-1">
                When viewing any pattern, tap on each row as you complete it. Your progress is
                automatically saved in your browser, so you can pick right back up whenever you
                reopen the page.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#2D2D2D]">Is Crpapo free to use?</p>
              <p className="text-gray-500 mt-1">
                Yes! All patterns in the public library are free to access and track.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#2D2D2D]">How do I report a broken or infringing pattern?</p>
              <p className="text-gray-500 mt-1">
                Every pattern page includes a &quot;Report this Pattern&quot; button in the sidebar that directly
                flags the item for administrative review.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}