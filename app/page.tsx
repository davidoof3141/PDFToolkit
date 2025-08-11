export default function Home() {
  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">PDF Toolkit</h1>
        <p className="mt-2 text-gray-600 max-w-prose">
          Work in progress. This toolkit will offer simple browser-based
          utilities for inspecting, splitting, merging and optimizing PDF
          files.
        </p>
      </div>
      <ul className="list-disc pl-5 text-gray-700 space-y-1">
        <li>Upload a PDF and view its metadata (coming soon)</li>
        <li>Split a PDF into separate pages (coming soon)</li>
        <li>Merge multiple PDFs (coming soon)</li>
      </ul>
      <p className="text-sm text-gray-500">Navigate to the Sample page via the top navigation to see a first stub subpage.</p>
    </section>
  );
}
