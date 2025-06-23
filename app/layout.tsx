import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { RoleProvider } from './components/context/RoleContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Performance Management System',
  description: 'A system for managing employee performance and goals',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <RoleProvider>
            {children}
          </RoleProvider>
        </Providers>
      </body>
    </html>
  );
} 