import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Pattern | Crpapo',
  robots: {
    index: false,
    follow: false,
  },
};

export default function EditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}