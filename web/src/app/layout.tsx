import type { Metadata } from 'next';
import '../styles/globals.css';
import { AppProvider } from '../context/AppContext';

export const metadata: Metadata = {
  title: 'DayZero — Zero-Cost Privacy-First Recovery Platform',
  description: 'Kerala public care de-addiction directory, private check-in companion, and moderated recovery circles inspired by Thanal (തണൽ).',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#547A61" />
      </head>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
