export const metadata = {
    title: 'Sample | PDF Toolkit'
};

export default function SamplePage() {
    return (
    <section className="space-y-6">
        <h1 className="text-2xl font-semibold">Sample Subpage</h1>
        <p className="text-gray-600 max-w-prose">
        This is a placeholder subpage to demonstrate routing under <code>/sample</code>.
        </p>
        <div className="rounded border bg-white p-4 shadow-sm">
        <h2 className="font-medium mb-2">Next steps</h2>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
            <li>Create an upload form for PDF files.</li>
            <li>Parse and display basic metadata (page count, size).</li>
            <li>Add actions: split, merge, extract text.</li>
        </ol>
        </div>
    </section>
    );
}
