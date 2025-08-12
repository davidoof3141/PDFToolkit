# PDF Toolkit

A modern web application for PDF manipulation that allows users to upload, reorder, rotate, and merge PDF pages with an intuitive interface.

## Features

### Core Functionality
- **PDF Upload**: Upload multiple PDF files with drag-and-drop support
- **Drag & Drop Reordering**: Intuitive page reordering
- **Page Rotation**: Rotate pages
- **Page Management**: Delete unwanted pages
- **PDF Merging**: Create new PDFs from selected and reordered pages

## Tech Stack

### Frontend
- **Framework**: [Next.js 15.4.6](https://nextjs.org/) with React 19
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) with Python
- **PDF Processing**: [PyMuPDF (fitz)](https://pymupdf.readthedocs.io/) for PDF manipulation
- **Testing**: [pytest](https://pytest.org/) framework

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

## API Documentation

### Main Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check
- `POST /api/upload` - Upload PDF files
- `POST /api/create-pdf` - Create merged PDF from pages
- `GET /api/download/{result_id}` - Download generated PDF
- `GET /api/result/{result_id}` - Get PDF result information

### Admin Endpoints

- `GET /api/cleanup/stats` - File statistics
- `POST /api/cleanup/old-files` - Clean old files
- `POST /api/cleanup/all-files` - Remove all files

Interactive API documentation is available at `http://localhost:8000/docs` when the backend is running.
