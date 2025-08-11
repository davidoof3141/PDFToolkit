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
            List of dictionaries containing page information and base64-encoded
            images
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
                thumbnail.save(img_buffer, format="PNG")
                img_base64 = base64.b64encode(img_buffer.getvalue()).decode()

                pages.append(
                    {
                        "page_number": page_num + 1,
                        "image_data": f"data:image/png;base64,{img_base64}",
                        "width": pix.width,
                        "height": pix.height,
                    }
                )

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
                "filename": pdf_path.name,
            }
            doc.close()
            return info
        except Exception as e:
            raise Exception(f"Failed to get PDF info: {str(e)}")

    @staticmethod
    def create_pdf_from_pages(
        page_order: List[Dict[str, Any]], output_path: Path, uploads_dir: Path
    ) -> Dict[str, Any]:
        """
        Create a new PDF from reordered pages.

        Args:
            page_order: List of page info with source PDF and page number
            output_path: Path where the new PDF will be saved
            uploads_dir: Directory containing source PDFs

        Returns:
            Dictionary containing creation result information
        """
        try:
            # Create new PDF document
            new_doc = fitz.open()

            for page_info in page_order:
                source_filename = page_info.get("source_pdf")
                # Convert to 0-based index
                page_number = page_info.get("page_number", 1) - 1
                rotation = page_info.get("rotation", 0)

                source_path = uploads_dir / source_filename
                if not source_path.exists():
                    raise Exception(f"Source PDF not found: {source_filename}")

                # Open source document
                source_doc = fitz.open(source_path)

                if page_number >= source_doc.page_count:
                    source_doc.close()
                    raise Exception(
                        f"Page {page_number + 1} not found in " f"{source_filename}"
                    )

                # Insert the page into the new document
                new_doc.insert_pdf(
                    source_doc, from_page=page_number, to_page=page_number
                )

                # Get the newly inserted page and apply rotation if needed
                if rotation != 0:
                    new_page = new_doc[-1]  # Get the last inserted page
                    new_page.set_rotation(rotation)

                source_doc.close()

            # Save the new PDF
            new_doc.save(output_path)
            new_doc.close()

            return {
                "filename": output_path.name,
                "page_count": len(page_order),
                "file_path": str(output_path),
                "file_size": output_path.stat().st_size,
            }

        except Exception as e:
            raise Exception(f"Failed to create PDF: {str(e)}")
