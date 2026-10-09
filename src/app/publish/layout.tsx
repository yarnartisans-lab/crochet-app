import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Publish a Pattern | Crpapo',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PublishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}