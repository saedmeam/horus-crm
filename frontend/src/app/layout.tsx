import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import GlobalAlerts from '@/components/GlobalAlerts';
import CustomAlert from '@/components/CustomAlert';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Horustech CRM',
  description: 'Sistema de gestion de chats y ventas',
  icons: {
    icon: '/logo-icon.png?v=2'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='es' className={geistSans.variable + ' ' + geistMono.variable + ' h-full antialiased'}>
      <body className='h-full flex flex-col overflow-hidden m-0 p-0'>
        {children}
        <GlobalAlerts />
        <CustomAlert />
      </body>
    </html>
  );
}