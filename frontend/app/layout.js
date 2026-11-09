import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import './eht-ui.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata = {
  title: 'ElecHuniTown',
  description: 'Thiết bị gia dụng thông minh cho cuộc sống sinh viên',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={jakarta.variable}>
      <body style={{ fontFamily: 'var(--font-jakarta), system-ui, sans-serif', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
