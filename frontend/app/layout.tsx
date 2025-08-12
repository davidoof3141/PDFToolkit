import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Toolkit",
  description: "Utility toolkit for working with PDF files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"> 
      <body
        className={`antialiased font-nunito min-h-screen bg-gray-50 text-gray-900`}
      >
        <main className="">{children}</main>
      </body>
    </html>
  );
}
