import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Vanguard Terminal',
  description: 'Site Health Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${jetbrainsMono.variable} font-mono h-full bg-[#0a0a0a] text-[#00ff41] antialiased`}>
        {children}
      </body>
    </html>
  );
}
