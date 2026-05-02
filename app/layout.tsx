import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adena Payroll Dashboard",
  description: "Quản lý công cày Adena, thanh toán và bảng xếp hạng nhân viên."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
