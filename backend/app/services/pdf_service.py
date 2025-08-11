"""PDF processing service for page extraction and manipulation."""

import base64
from pathlib import Path
from typing import List, Dict, Any
import fitz  # PyMuPDF
from PIL import Image
import io


class PDFService:
    """Service for PDF processing operations."""
    
    @staticmethod
    def extract_pages(pdf_path: Path) -> List[Dict[str, Any]]:
        """
        Extract pages from a PDF and convert them to images.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            List of dictionaries containing page information and base64 images
        """
        pages = []
        
        try:
            # Open the PDF document
            doc = fitz.open(pdf_path)
            
            for page_num in range(doc.page_count):
                page = doc[page_num]
                
                # Convert page to image
                mat = fitz.Matrix(2, 2)  # Scale factor for better quality
                pix = page.get_pixmap(matrix=mat)
                
                # Convert pixmap to PIL Image
                img_data = pix.pil_tobytes("PNG")
                img = Image.open(io.BytesIO(img_data))
                
                # Create thumbnail for preview (max 300px width)
                thumbnail = img.copy()
                thumbnail.thumbnail((300, 400), Image.Resampling.LANCZOS)
                
                # Convert to base64 for frontend display
                img_buffer = io.BytesIO()
                thumbnail.save(img_buffer, format='PNG')
                img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
                
                pages.append({
                    "page_number": page_num + 1,
                    "image_data": f"data:image/png;base64,{img_base64}",
                    "width": pix.width,
                    "height": pix.height
                })
            
            doc.close()
            
        except Exception as e:
            raise Exception(f"Failed to process PDF: {str(e)}")
        
        return pages
    
    @staticmethod
    def get_pdf_info(pdf_path: Path) -> Dict[str, Any]:
        """
        Get basic information about the PDF.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Dictionary containing PDF metadata
        """
        try:
            doc = fitz.open(pdf_path)
            info = {
                "page_count": doc.page_count,
                "metadata": doc.metadata,
                "filename": pdf_path.name
            }
            doc.close()
            return info
        except Exception as e:
            raise Exception(f"Failed to get PDF info: {str(e)}")
