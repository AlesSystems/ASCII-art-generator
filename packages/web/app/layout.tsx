import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono, VT323 } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const vt323 = VT323({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-vt323',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ASCII.ART — image to ASCII converter',
  description: 'Convert images to ASCII art in your browser. No uploads, all local.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${vt323.variable}`}
    >
      <body style={{ fontFamily: 'var(--font-inter)' }}>
        {children}
      </body>
    </html>
  );
}
