from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import shutil
import uuid
from pathlib import Path
from ..services.pdf_service import PDFService

router = APIRouter()

# Define a directory to store uploaded files
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Define a directory to store generated files
OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)


class PageInfo(BaseModel):
    source_pdf: str
    page_number: int
    unique_id: str
    rotation: int = 0


class CreatePDFRequest(BaseModel):
    pages: List[PageInfo]
    filename: str = "merged_document.pdf"


@router.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}


@router.get("/version", tags=["meta"])
async def version():
    return {"version": "0.1.0"}


@router.post("/upload", tags=["pdf"])
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400, detail="Invalid file type. Only PDFs are allowed."
        )

    try:
        # Sanitize filename to prevent security issues
        safe_filename = Path(file.filename).name
        if not safe_filename:
            raise HTTPException(status_code=400, detail="Invalid filename.")

        file_path = UPLOAD_DIR / safe_filename

        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process PDF to extract pages
        try:
            pages = PDFService.extract_pages(file_path)
            pdf_info = PDFService.get_pdf_info(file_path)

            return {
                "message": "File uploaded and processed successfully",
                "filename": safe_filename,
                "pdf_info": pdf_info,
                "pages": pages,
            }
        except Exception as pdf_error:
            # If PDF processing fails, still return success for upload
            return {
                "message": "File uploaded successfully but processing failed",
                "filename": safe_filename,
                "error": str(pdf_error),
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not upload file: {e}")
    finally:
        file.file.close()


@router.post("/create-pdf", tags=["pdf"])
async def create_pdf(request: CreatePDFRequest):
    """Create a new PDF from reordered pages."""
    try:
        # Generate unique filename
        unique_id = uuid.uuid4().hex[:8]
        output_filename = f"{unique_id}_{request.filename}"
        output_path = OUTPUT_DIR / output_filename

        # Convert request pages to the format expected by the service
        page_order = [
            {
                "source_pdf": page.source_pdf,
                "page_number": page.page_number,
                "unique_id": page.unique_id,
                "rotation": page.rotation,
            }
            for page in request.pages
        ]

        # Create the PDF
        result = PDFService.create_pdf_from_pages(page_order, output_path, UPLOAD_DIR)

        return {
            "message": "PDF created successfully",
            "result_id": unique_id,
            "filename": output_filename,
            "page_count": result["page_count"],
            "file_size": result["file_size"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not create PDF: {e}")


@router.get("/download/{result_id}", tags=["pdf"])
async def download_pdf(result_id: str):
    """Download the created PDF by result ID."""
    try:
        # Find the file with the result_id prefix
        matching_files = list(OUTPUT_DIR.glob(f"{result_id}_*"))

        if not matching_files:
            raise HTTPException(status_code=404, detail="PDF not found")

        file_path = matching_files[0]

        return FileResponse(
            path=file_path,
            media_type="application/pdf",
            filename=file_path.name,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not download PDF: {e}")


@router.get("/result/{result_id}", tags=["pdf"])
async def get_pdf_result(result_id: str):
    """Get information about the created PDF."""
    try:
        # Find the file with the result_id prefix
        matching_files = list(OUTPUT_DIR.glob(f"{result_id}_*"))

        if not matching_files:
            raise HTTPException(status_code=404, detail="PDF not found")

        file_path = matching_files[0]
        file_stats = file_path.stat()

        return {
            "result_id": result_id,
            "filename": file_path.name,
            "file_size": file_stats.st_size,
            "created_at": file_stats.st_ctime,
            "download_url": f"/api/download/{result_id}",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not get PDF info: {e}")
