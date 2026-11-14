import "./globals.css";
import BackButton from "@/components/BackButton";

export const metadata = {
  title: 'ElecHuniTown',
  description: 'Thiết bị gia dụng thông minh cho cuộc sống sinh viên',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}<BackButton /></body>
    </html>
  );
}
