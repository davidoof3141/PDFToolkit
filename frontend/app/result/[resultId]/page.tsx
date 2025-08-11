"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PdfResult {
  result_id: string;
  filename: string;
  file_size: number;
  created_at: number;
  download_url: string;
}

interface PdfResultPageProps {
  params: {
    resultId: string;
  };
}

export default function PdfResultPage({ params }: PdfResultPageProps) {
  const [result, setResult] = useState<PdfResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/result/${params.resultId}`
        );

        if (!response.ok) {
          throw new Error('PDF result not found');
        }

        const data = await response.json();
        setResult(data);

        // Create PDF blob URL for viewing
        const pdfResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/download/${params.resultId}`
        );

        if (pdfResponse.ok) {
          const blob = await pdfResponse.blob();
          const url = window.URL.createObjectURL(blob);
          setPdfUrl(url);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load PDF result');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();

    // Cleanup function to revoke the object URL when component unmounts
    return () => {
      // This cleanup will run when the component unmounts
    };
  }, [params.resultId]);

  // Separate useEffect for cleanup
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleDownload = async () => {
    if (!result) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/download/${result.result_id}`
      );

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to download PDF');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center text-gray-600 mt-4">Loading PDF result...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error || 'PDF result not found'}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="h-full flex">
        {/* Main content area - PDF Preview */}
        <div className="flex-1">
          {/* PDF Viewer */}
          <div className="h-full overflow-hidden">
            {pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                width="100%"
                height="100%"
                className="border-0"
                title="PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading PDF...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar with download options */}
        <div className={`${isSidebarMinimized ? 'w-0' : 'w-80'} transition-all duration-300 relative`}>
          {!isSidebarMinimized && (
            <div className="bg-white rounded-xl shadow-md p-6 h-full overflow-y-auto">
              {/* Success indicator */}
              <div className="text-center mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-green-500 text-3xl mb-2">✓</div>
                <h3 className="text-lg font-semibold text-green-800 mb-1">Success!</h3>
                <p className="text-sm text-green-600">Your PDF has been created</p>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-4">File Details</h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Filename</div>
                  <div className="font-medium text-gray-800 truncate">{result.filename}</div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">File Size</div>
                  <div className="font-medium text-gray-800">{formatFileSize(result.file_size)}</div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Created</div>
                  <div className="font-medium text-gray-800">{formatDate(result.created_at)}</div>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={handleDownload}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    Download PDF
                  </button>

                  <button
                    onClick={() => router.push('/')}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" />
                    </svg>
                    Return to Home
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Minimize/Expand button */}
        <button
          onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 z-20 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300"
          title={isSidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isSidebarMinimized ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
