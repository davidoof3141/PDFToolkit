import PdfUpload from './components/PdfUpload';
import { Playwrite_AU_QLD } from "next/font/google";
import Image from "next/image";

const playwrite = Playwrite_AU_QLD({
  variable: "--font-playwrite",
});
export default function Home() {
  return (
    <>
            <header className="py-5">
          <div className="flex justify-center items-center gap-4">
            <Image src="/ToolkitLogo.png" alt="PDF Toolkit Logo" width={50} height={50} />
            <h1 className={`text-3xl font-playwrite ${playwrite.className} text-teal-500`}>ToolKit</h1>
          </div>
        </header>
            <section className="space-y-8">
      <PdfUpload />
    </section>
    </>
  );
}
