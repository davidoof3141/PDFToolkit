from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
from pathlib import Path
from ..services.pdf_service import PDFService

router = APIRouter()

# Define a directory to store uploaded files
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


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
                "pages": pages
            }
        except Exception as pdf_error:
            # If PDF processing fails, still return success for upload
            return {
                "message": "File uploaded successfully but processing failed",
                "filename": safe_filename,
                "error": str(pdf_error)
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not upload file: {e}"
        )
    finally:
        file.file.close()
