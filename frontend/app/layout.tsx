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
        <header className="py-5">
          <div className="flex justify-center items-center gap-4">
            <Image src="/ToolkitLogo.png" alt="PDF Toolkit Logo" width={50} height={50} />
            <h1 className={`text-3xl font-playwrite ${playwrite.className} text-teal-500`}>ToolKit</h1>
          </div>
        </header>
        <main className="mx-auto max-w-5xl p-6">{children}</main>
        <footer className="mx-auto max-w-5xl p-6 text-xs text-gray-500 border-t mt-12">
          PDF Toolkit &copy; {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}
