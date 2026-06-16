import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JR Label Cloud',
  description: 'Food safety compliance admin website for shelf-life label operations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
