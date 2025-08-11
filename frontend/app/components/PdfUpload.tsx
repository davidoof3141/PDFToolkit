"use client";

import { useState, useRef, useCallback } from 'react';

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
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        
        setAllPages(prev => [...prev, ...pagesWithIds]);
        setUploadedPdfs(prev => [...prev, data.filename]);
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
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    setAllPages([]);
    setUploadedPdfs([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, pageId: string) => {
    setDraggedPageId(pageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetPageId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    } else if (!targetPageId) {
      // Handle file drop for new PDF upload
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile && droppedFile.type === 'application/pdf') {
        handleUpload(droppedFile);
      } else if (droppedFile) {
        setError('Please drop a valid PDF file.');
      }
    }
    
    setDraggedPageId(null);
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
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">PDF Toolkit</h2>
        {allPages.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-red-600 hover:text-red-800 border border-red-300 hover:border-red-500 rounded-md transition-colors"
          >
            Clear All
          </button>
        )}
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
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              PDF Pages ({allPages.length} total from {uploadedPdfs.length} PDF{uploadedPdfs.length !== 1 ? 's' : ''})
            </h3>
            <button
              onClick={handleDropzoneClick}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            >
              Add Another PDF
            </button>
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

          {/* Uploaded PDFs list */}
          {uploadedPdfs.length > 0 && (
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium">Uploaded files:</p>
              <div className="flex flex-wrap gap-2">
                {uploadedPdfs.map((filename) => (
                  <span
                    key={filename}
                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                  >
                    {filename}
                    <button
                      onClick={() => handleRemoveFile(filename)}
                      className="ml-2 text-red-500 hover:text-red-700"
                      aria-label={`Remove ${filename}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

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
