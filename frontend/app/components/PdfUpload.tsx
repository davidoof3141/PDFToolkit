"use client";

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { uploadFile, api } from '../../lib/api';

interface PageData {
  page_number: number;
  image_data: string;
  width: number;
  height: number;
  source_pdf: string;
  unique_id: string;
}

interface PdfInfo {
  page_count: number;
  metadata: Record<string, unknown> | null;
  filename: string;
}

interface PdfData {
  filename: string;
  pdf_info: PdfInfo;
  pages: PageData[];
}

interface UploadResponse {
  message: string;
  filename: string;
  pdf_info?: PdfInfo;
  pages?: PageData[];
  error?: string;
}

export default function PdfUpload() {
  const [allPages, setAllPages] = useState<PageData[]>([]);
  const [uploadedPdfsData, setUploadedPdfsData] = useState<PdfData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pages' | 'files'>('pages');
  const [draggedPdfIndex, setDraggedPdfIndex] = useState<number | null>(null);
  const [pageRotations, setPageRotations] = useState<{ [key: string]: number }>({});
  const [zoomedPageId, setZoomedPageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleUpload = useCallback(async (selectedFile: File) => {
    if (!selectedFile) {
      setError('No file selected.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const data = await uploadFile<UploadResponse>('/upload', selectedFile);
      
      if (data.pages && data.pdf_info) {
        // Add unique IDs to pages and source PDF information
          const pagesWithIds: PageData[] = data.pages.map((page: PageData, index: number) => ({
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
        setUploadedPdfsData(prev => [...prev, newPdfData]);
      } else if (data.error) {
        setError(`Upload successful but processing failed: ${data.error}`);
      }
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(message);
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
    setUploadedPdfsData(prev => prev.filter(pdf => pdf.filename !== filename));
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    setAllPages([]);
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
        unique_id: page.unique_id,
        rotation: pageRotations[page.unique_id] || 0
      }));

      const result = await api<{ result_id: string }>(
        '/create-pdf',
        {
          method: 'POST',
          body: JSON.stringify({
            pages,
            filename: 'merged_document.pdf'
          }),
        }
      );
      
      // Redirect to result page
      router.push(`/result/${result.result_id}`);
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create PDF. Please try again.';
      setError(message);
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

  const handleDeletePage = (pageId: string) => {
    setAllPages(prev => prev.filter(page => page.unique_id !== pageId));
    // Remove rotation data for deleted page
    setPageRotations(prev => {
      const newRotations = { ...prev };
      delete newRotations[pageId];
      return newRotations;
    });
    // Close zoom if this page was zoomed
    if (zoomedPageId === pageId) {
      setZoomedPageId(null);
    }
  };

  const handleRotatePage = (pageId: string) => {
    setPageRotations(prev => ({
      ...prev,
      [pageId]: ((prev[pageId] || 0) + 90) % 360
    }));
  };

  const handleZoomPage = (pageId: string) => {
    setZoomedPageId(pageId);
  };

  const handleCloseZoom = () => {
    setZoomedPageId(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">PDF Upload</h2>
        <div className="flex items-center gap-4">
          {allPages.length > 0 && (
            <>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-rose-400 hover:text-rose-600 border border-rose-200 hover:border-rose-300 rounded-md transition-colors"
              >
                Clear All
              </button>
            <button
              onClick={handleDropzoneClick}
              className="px-4 py-2 bg-sky-400 text-white hover:bg-sky-500 rounded-md transition-colors"
            >
              Add Another PDF
            </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || allPages.length === 0}
                className="px-6 py-2 bg-emerald-400 text-white hover:bg-emerald-500 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors font-medium"
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
                    className={`relative group border border-gray-200 rounded-lg p-2 cursor-move hover:shadow-lg transition-shadow
                      ${draggedPageId === page.unique_id ? 'opacity-50' : ''}
                      hover:border-blue-300`}
                  >
                    {/* Page Image */}
                    <div className="relative overflow-hidden rounded">
                      <Image
                        src={page.image_data}
                        alt={`Page ${page.page_number} from ${page.source_pdf}`}
                        width={page.width}
                        height={page.height}
                        className="w-full h-auto rounded pointer-events-none transition-transform duration-300"
                        style={{ 
                          transform: `rotate(${pageRotations[page.unique_id] || 0}deg)` 
                        }}
                        unoptimized
                      />
                      
                      {/* Hover Controls Bar */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex gap-1 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePage(page.unique_id);
                            }}
                            className="p-1.5 bg-rose-400 hover:bg-rose-500 text-white rounded-full transition-colors"
                            title="Delete page"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          
                          {/* Rotate Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRotatePage(page.unique_id);
                            }}
                            className="p-1.5 bg-sky-400 hover:bg-sky-500 text-white rounded-full transition-colors"
                            title="Rotate page"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          
                          {/* Zoom Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleZoomPage(page.unique_id);
                            }}
                            className="p-1.5 bg-emerald-400 hover:bg-emerald-500 text-white rounded-full transition-colors"
                            title="Zoom page"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Page Info */}
                    <div className="text-xs text-center text-gray-600 mt-2 space-y-1">
                      <p>Page {page.page_number}</p>
                      <p className="truncate text-gray-500">{page.source_pdf}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                Drag pages to reorder them. Hover over pages for delete, rotate, and zoom options.
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
                    <Image
                      src={pdf.pages[0]?.image_data || ''}
                      alt={`First page of ${pdf.filename}`}
                      width={pdf.pages[0]?.width || 100}
                      height={pdf.pages[0]?.height || 140}
                      className="w-full h-auto rounded"
                      unoptimized
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
                      className="absolute top-1 right-1 p-1 bg-rose-400 text-white rounded-full hover:bg-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label={`Remove ${pdf.filename}`}
                      title="Delete PDF"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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

      {/* Zoom Modal */}
      {zoomedPageId && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4" onClick={handleCloseZoom}>
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={handleCloseZoom}
              className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full transition-colors"
              title="Close zoom"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {(() => {
              const zoomedPage = allPages.find(page => page.unique_id === zoomedPageId);
              return zoomedPage ? (
                <Image
                  src={zoomedPage.image_data}
                  alt={`Zoomed Page ${zoomedPage.page_number} from ${zoomedPage.source_pdf}`}
                  width={zoomedPage.width}
                  height={zoomedPage.height}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-300"
                  style={{ 
                    transform: `rotate(${pageRotations[zoomedPage.unique_id] || 0}deg)` 
                  }}
                  onClick={(e) => e.stopPropagation()}
                  unoptimized
                />
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
