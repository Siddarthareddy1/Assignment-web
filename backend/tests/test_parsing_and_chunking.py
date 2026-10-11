import io
import pytest
import pymupdf
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from app.parsing.extractor import DocumentExtractor
from app.parsing.chunker import DocumentChunker

def create_sample_pdf_bytes(page_count: int = 5) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    for p in range(1, page_count + 1):
        c.drawString(72, 700, f"Chapter {p}: Algorithmic Paradigms")
        c.drawString(72, 650, f"Section {p}.1: Core Formulations and Recurrences.")
        c.drawString(72, 600, f"Educational text content for page {p} of the testing document.")
        c.showPage()
    c.save()
    return buf.getvalue()

def test_pdf_parsing_success():
    pdf_bytes = create_sample_pdf_bytes(5)
    result = DocumentExtractor.extract_pdf(pdf_bytes)
    assert result.total_pages == 5
    assert len(result.pages) == 5
    assert "Chapter 1" in result.pages[0].text
    assert result.pages[0].page_number == 1

def test_corrupted_pdf_handling():
    corrupted_bytes = b"NOT_A_VALID_PDF_HEADER_RAW_BYTES_CORRUPTED"
    with pytest.raises(ValueError) as exc:
        DocumentExtractor.extract_pdf(corrupted_bytes)
    assert "Corrupted or invalid PDF" in str(exc.value)

def test_txt_parsing():
    sample_text = "Chapter 1: Theory\n\nThis is a sample document for plain text processing."
    result = DocumentExtractor.extract_txt(sample_text.encode("utf-8"))
    assert result.total_pages >= 1
    assert "Chapter 1" in result.pages[0].text

def test_chunker_boundaries_and_page_ranges():
    pdf_bytes = create_sample_pdf_bytes(7)
    extraction = DocumentExtractor.extract_pdf(pdf_bytes)
    chunks = DocumentChunker.chunk_document(
        owner_id="test_owner",
        document_id="test_doc",
        extraction=extraction,
        target_pages_per_chunk=3
    )

    # 7 pages with target 3 pages per chunk should produce 3 chunks: [1-3], [4-6], [7-7]
    assert len(chunks) == 3
    assert chunks[0].startPage == 1
    assert chunks[0].endPage == 3
    assert chunks[1].startPage == 4
    assert chunks[1].endPage == 6
    assert chunks[2].startPage == 7
    assert chunks[2].endPage == 7
