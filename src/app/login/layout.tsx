import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In or Sign Up | Crpapo',
  description:
    'Log in or create a Crpapo account to start publishing, saving, and tracking interactive crochet patterns.',
  alternates: {
    canonical: 'https://crpapo.com/login',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}