import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import ThreeBackgroundWrapper from '@/components/ThreeBackgroundWrapper';

export const metadata: Metadata = {
  title: 'NexIMS - Premium Inventory Management',
  description: 'A modern, robust, and beautiful Inventory Management System.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-transparent text-slate-200 antialiased overflow-hidden print:overflow-visible print:bg-white print:text-black" style={{ fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
        <div className="print:hidden">
          <ThreeBackgroundWrapper />
        </div>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
