import type { Metadata } from "next";
import Link from "next/link";
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
      <body className="antialiased font-sans min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-10">
          <nav className="mx-auto max-w-5xl flex gap-6 p-4 text-sm font-medium">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <Link href="/sample" className="hover:text-blue-600">Sample</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl p-6">{children}</main>
        <footer className="mx-auto max-w-5xl p-6 text-xs text-gray-500 border-t mt-12">
          PDF Toolkit &copy; {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}
