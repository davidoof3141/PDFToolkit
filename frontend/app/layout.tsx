import type { Metadata } from "next";
import "./globals.css";
import { Playwrite_AU_QLD, Geist } from "next/font/google";
import Image from "next/image";

const playwrite = Playwrite_AU_QLD({
  variable: "--font-playwrite",
});

const geist = Geist({
  subsets: ['latin'],
})

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
