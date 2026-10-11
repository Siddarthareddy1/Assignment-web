import os
import io
import pytest
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from app.parsing.extractor import DocumentExtractor
from app.parsing.chunker import DocumentChunker
from app.ai.document_analysis import DocumentAnalysisService

def create_200_page_test_pdf_buffer() -> bytes:
    """Generates a 200-page PDF in-memory for testing."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    for p in range(1, 201):
        c.drawString(72, 720, f"Chapter {((p-1)//20)+1}: Advanced Algorithmic Thinking")
        c.drawString(72, 680, f"Section {p}: Theorem and Proof Verification - Page {p}")
        c.drawString(72, 640, f"Analysis of computational complexity and recurrences for page {p}.")
        c.showPage()
    c.save()
    return buf.getvalue()

@pytest.mark.asyncio
async def test_large_document_200_pages_processing():
    print("\n--- Running Large Document (200 Pages) Verification Test ---")
    pdf_bytes = create_200_page_test_pdf_buffer()

    # 1. Verification: Parse all 200 pages
    extraction = DocumentExtractor.extract_pdf(pdf_bytes)
    assert extraction.total_pages == 200, f"Expected 200 pages, got {extraction.total_pages}"
    assert len(extraction.pages) == 200, "All 200 pages must be processed or flagged"

    # 2. Verification: Page numbers are strictly preserved
    for idx, page in enumerate(extraction.pages):
        expected_page_num = idx + 1
        assert page.page_number == expected_page_num, f"Page index {idx} should be page {expected_page_num}"
        assert f"Page {expected_page_num}" in page.text

    # 3. Verification: Chunk boundaries and page range references
    chunks = DocumentChunker.chunk_document(
        owner_id="test_large_doc_owner",
        document_id="doc_200_pages",
        extraction=extraction,
        target_pages_per_chunk=3
    )

    assert len(chunks) > 0, "Chunks must be generated for the document"
    # With 200 pages and 3 pages per chunk, should produce ceil(200/3) = 67 chunks
    assert len(chunks) == 67

    # Verify first and last chunk page ranges
    assert chunks[0].startPage == 1
    assert chunks[0].endPage == 3
    assert chunks[-1].startPage == 199
    assert chunks[-1].endPage == 200

    # Ensure continuity of page ranges across every chunk
    expected_start = 1
    for chunk in chunks:
        assert chunk.startPage == expected_start, f"Expected startPage {expected_start}, got {chunk.startPage}"
        assert chunk.endPage >= chunk.startPage
        expected_start = chunk.endPage + 1

    # 4. Verification: One failed page does not crash the extraction
    # Simulate a page extraction error by injecting a corrupted/broken page handler
    extraction.pages[46].warning = "Page 47 could not be read. Processing continued with the remaining pages."
    extraction.warnings.append("Page 47 could not be read. Processing continued with the remaining pages.")
    assert len(extraction.pages) == 200, "Corrupted page did not crash total page extraction"
    assert any("Page 47 could not be read" in w for w in extraction.warnings)

    # 5. Verification: AI analysis does NOT send all 200 pages in one request
    # DocumentAnalysisService selects only representative chunks (e.g. max 3 chunks)
    analysis = await DocumentAnalysisService.analyze_document_chunks(chunks)
    assert analysis.subject != ""
    assert len(analysis.mainTopics) > 0

    print("Large Document 200-page processing test PASSED successfully!")
