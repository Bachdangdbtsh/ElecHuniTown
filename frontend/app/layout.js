import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BackButton from "@/components/BackButton";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}<BackButton /></body>
    </html>
  );
}
