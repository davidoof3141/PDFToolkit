"use client";

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface PageData {
  page_number: number;
  image_data: string;
  width: number;
  height: number;
  source_pdf: string;
  unique_id: string;
}

interface PdfData {
  filename: string;
  pdf_info: {
    page_count: number;
    metadata: any;
    filename: string;
  };
  pages: PageData[];
}

interface UploadResponse {
  message: string;
  filename: string;
  pdf_info?: any;
  pages?: PageData[];
  error?: string;
}

export default function PdfUpload() {
  const [allPages, setAllPages] = useState<PageData[]>([]);
  const [uploadedPdfs, setUploadedPdfs] = useState<string[]>([]);
  const [uploadedPdfsData, setUploadedPdfsData] = useState<PdfData[]>([]);
  const [isUploading, setIsUploading] = useState(false);5555
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pages' | 'files'>('pages');
  const [draggedPdfIndex, setDraggedPdfIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleUpload = useCallback(async (selectedFile: File) => {
    if (!selectedFile) {
      setError('No file selected.');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'An unknown error occurred' }));
        throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
      }

      const data: UploadResponse = await res.json();
      
      if (data.pages && data.pdf_info) {
        // Add unique IDs to pages and source PDF information
        const pagesWithIds: PageData[] = data.pages.map((page, index) => ({
          ...page,
          source_pdf: data.filename,
          unique_id: `${data.filename}-page-${page.page_number}-${Date.now()}-${index}`
        }));
        
        // Create PDF data for file view
        const newPdfData: PdfData = {
          filename: data.filename,
          pdf_info: data.pdf_info,
          pages: pagesWithIds
        };
        
        setAllPages(prev => [...prev, ...pagesWithIds]);
        setUploadedPdfs(prev => [...prev, data.filename]);
        setUploadedPdfsData(prev => [...prev, newPdfData]);
      } else if (data.error) {
        setError(`Upload successful but processing failed: ${data.error}`);
      }
      
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      handleUpload(selectedFile);
    } else if (selectedFile) {
      setError('Please select a valid PDF file.');
    }
  };

  const handleRemoveFile = (filename: string) => {
    setAllPages(prev => prev.filter(page => page.source_pdf !== filename));
    setUploadedPdfs(prev => prev.filter(pdf => pdf !== filename));
    setUploadedPdfsData(prev => prev.filter(pdf => pdf.filename !== filename));
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    setAllPages([]);
    setUploadedPdfs([]);
    setUploadedPdfsData([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, pageId?: string, pdfIndex?: number) => {
    if (pageId) {
      setDraggedPageId(pageId);
      setDraggedPdfIndex(null);
    } else if (pdfIndex !== undefined) {
      setDraggedPdfIndex(pdfIndex);
      setDraggedPageId(null);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetPageId?: string, targetPdfIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Handle page reordering in page view
    if (targetPageId && draggedPageId && draggedPageId !== targetPageId) {
      setAllPages(prev => {
        const newPages = [...prev];
        const draggedIndex = newPages.findIndex(p => p.unique_id === draggedPageId);
        const targetIndex = newPages.findIndex(p => p.unique_id === targetPageId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
          const [draggedPage] = newPages.splice(draggedIndex, 1);
          newPages.splice(targetIndex, 0, draggedPage);
        }
        
        return newPages;
      });
    }
    // Handle PDF reordering in file view
    else if (targetPdfIndex !== undefined && draggedPdfIndex !== null && draggedPdfIndex !== targetPdfIndex) {
      // Reorder PDFs
      setUploadedPdfsData(prev => {
        const newPdfs = [...prev];
        const [draggedPdf] = newPdfs.splice(draggedPdfIndex, 1);
        newPdfs.splice(targetPdfIndex, 0, draggedPdf);
        return newPdfs;
      });
      
      // Reorder PDF filenames array
      setUploadedPdfs(prev => {
        const newFilenames = [...prev];
        const [draggedFilename] = newFilenames.splice(draggedPdfIndex, 1);
        newFilenames.splice(targetPdfIndex, 0, draggedFilename);
        return newFilenames;
      });
      
      // Reorder all pages to match the new PDF order
      setAllPages(prev => {
        const newPdfsOrder = [...uploadedPdfsData];
        const [draggedPdf] = newPdfsOrder.splice(draggedPdfIndex, 1);
        newPdfsOrder.splice(targetPdfIndex, 0, draggedPdf);
        
        // Reconstruct pages in the new PDF order
        const reorderedPages: PageData[] = [];
        newPdfsOrder.forEach(pdf => {
          const pdfPages = prev.filter(page => page.source_pdf === pdf.filename);
          reorderedPages.push(...pdfPages);
        });
        
        return reorderedPages;
      });
    }
    // Handle file drop for new PDF upload
    else if (!targetPageId && targetPdfIndex === undefined) {
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile && droppedFile.type === 'application/pdf') {
        handleUpload(droppedFile);
      } else if (droppedFile) {
        setError('Please drop a valid PDF file.');
      }
    }
    
    setDraggedPageId(null);
    setDraggedPdfIndex(null);
  };

  const handleSubmit = async () => {
    if (allPages.length === 0) {
      setError('No pages to submit. Please upload at least one PDF.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const pages = allPages.map(page => ({
        source_pdf: page.source_pdf,
        page_number: page.page_number,
        unique_id: page.unique_id
      }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/create-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pages,
          filename: 'merged_document.pdf'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Redirect to result page
      router.push(`/result/${result.result_id}`);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create PDF. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleFileDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">PDF Toolkit</h2>
        <div className="flex items-center gap-4">
          {allPages.length > 0 && (
            <>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-red-600 hover:text-red-800 border border-red-300 hover:border-red-500 rounded-md transition-colors"
              >
                Clear All
              </button>
            <button
              onClick={handleDropzoneClick}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            >
              Add Another PDF
            </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || allPages.length === 0}
                className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors font-medium"
              >
                {isSubmitting ? 'Creating PDF...' : 'Create PDF'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Upload area or pages display */}
      {allPages.length === 0 ? (
        <div
          className={`flex justify-center items-center w-full h-80 border-2 border-dashed rounded-lg cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
            hover:border-gray-400 hover:bg-gray-100 transition-colors`}
          onClick={handleDropzoneClick}
          onDrop={(e) => handleDrop(e)}
          onDragOver={handleFileDragOver}
          onDragEnter={handleFileDragEnter}
          onDragLeave={handleFileDragLeave}
        >
          <input
            id="pdf-upload"
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <div className="text-center">
            <p className="text-gray-500">
              {isUploading ? 'Uploading...' : 'Drag & drop a PDF here, or click to select a file'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center items-center">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('pages')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'pages'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Page View
                </button>
                <button
                  onClick={() => setViewMode('files')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'files'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  File View
                </button>
              </div>
            <input
              id="pdf-upload-additional"
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
          </div>

          {/* Render based on view mode */}
          {viewMode === 'pages' ? (
            <>
              {/* Pages grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4 border-2 border-dashed border-gray-200 rounded-lg min-h-[200px]">
                {allPages.map((page) => (
                  <div
                    key={page.unique_id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, page.unique_id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, page.unique_id)}
                    className={`border border-gray-200 rounded-lg p-2 cursor-move hover:shadow-lg transition-shadow
                      ${draggedPageId === page.unique_id ? 'opacity-50' : ''}
                      hover:border-blue-300`}
                  >
                    <img
                      src={page.image_data}
                      alt={`Page ${page.page_number} from ${page.source_pdf}`}
                      className="w-full h-auto rounded pointer-events-none"
                    />
                    <div className="text-xs text-center text-gray-600 mt-2 space-y-1">
                      <p>Page {page.page_number}</p>
                      <p className="truncate text-gray-500">{page.source_pdf}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                Drag pages to reorder them. Click "Add Another PDF" to upload more files.
              </p>
            </>
          ) : (
            <>
              {/* File view - PDFs in same container */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4 border-2 border-dashed border-gray-200 rounded-lg min-h-[200px]">
                {uploadedPdfsData.map((pdf, pdfIndex) => (
                  <div
                    key={pdfIndex}
                    draggable
                    onDragStart={(e) => handleDragStart(e, undefined, pdfIndex)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, undefined, pdfIndex)}
                    className={`relative group border border-gray-200 rounded-lg p-2 cursor-move hover:shadow-lg transition-shadow hover:border-blue-300
                      ${draggedPdfIndex === pdfIndex ? 'opacity-50' : ''}`}
                  >
                    {/* Show first page image */}
                    <img
                      src={pdf.pages[0]?.image_data}
                      alt={`First page of ${pdf.filename}`}
                      className="w-full h-auto rounded"
                    />
                    <div className="text-xs text-center text-gray-600 mt-2 space-y-1">
                      <p className="font-medium truncate">{pdf.filename}</p>
                      <p className="text-gray-500">
                        {pdf.pdf_info.page_count} page{pdf.pdf_info.page_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveFile(pdf.filename)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label={`Remove ${pdf.filename}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                Drag PDFs to reorder them. This will affect the page order in Page view. Switch to Page view to see all pages and reorder individual pages.
              </p>
            </>
          )}
        </div>
      )}

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full animate-pulse"></div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
