import uuid
import re
from typing import List, Dict, Any, Optional
from app.models.schemas import DocumentChunk
from app.parsing.extractor import DocumentExtractionResult

class DocumentChunker:
    """
    Partitions extracted document pages into coherent chunks of 2-4 pages,
    respecting section boundaries and token limits.
    """
    
    @staticmethod
    def chunk_document(
        owner_id: str,
        document_id: str,
        extraction: DocumentExtractionResult,
        target_pages_per_chunk: int = 3,
        max_tokens_per_chunk: int = 2500
    ) -> List[DocumentChunk]:
        chunks: List[DocumentChunk] = []
        pages = extraction.pages
        total_pages = len(pages)
        if total_pages == 0:
            return chunks

        current_pages_texts: List[str] = []
        start_page = 1
        current_section = None
        current_token_count = 0

        for i, page in enumerate(pages):
            p_num = page.page_number
            p_text = page.text

            # Look for section headings in the page text (e.g., Chapter 1, Section 2, Heading)
            heading_match = re.search(r'^(?:Chapter|Section|Module|Unit|Topic|Part)\s+[0-9IVXLC]+[.:\s-]+([^\n]+)', p_text, re.MULTILINE | re.IGNORECASE)
            detected_heading = heading_match.group(0).strip() if heading_match else None
            
            if not current_section and detected_heading:
                current_section = detected_heading

            page_tokens = DocumentChunker._estimate_tokens(p_text)
            current_pages_texts.append(f"--- [Page {p_num}] ---\n{p_text}")
            current_token_count += page_tokens

            page_count_in_chunk = p_num - start_page + 1

            # Condition to flush chunk:
            # 1. Reached target pages (e.g. 3 pages) OR
            # 2. Reached token threshold OR
            # 3. Last page in document
            is_last_page = (i == total_pages - 1)
            should_flush = (
                page_count_in_chunk >= target_pages_per_chunk or
                current_token_count >= max_tokens_per_chunk or
                is_last_page
            )

            if should_flush and current_pages_texts:
                chunk_text = "\n\n".join(current_pages_texts)
                chunk_id = f"chk_{document_id}_{start_page}_{p_num}_{str(uuid.uuid4())[:8]}"
                
                chunks.append(DocumentChunk(
                    chunkId=chunk_id,
                    ownerId=owner_id,
                    documentId=document_id,
                    startPage=start_page,
                    endPage=p_num,
                    sectionTitle=current_section or f"Pages {start_page}–{p_num}",
                    extractedText=chunk_text,
                    contentMetadata={
                        "pageCount": page_count_in_chunk,
                        "hasScannedPages": any(pages[idx].is_scanned for idx in range(start_page - 1, p_num)),
                        "detectedHeading": current_section
                    },
                    tokenEstimate=current_token_count
                ))

                # Reset state for next chunk
                current_pages_texts = []
                start_page = p_num + 1
                current_section = None
                current_token_count = 0

        return chunks

    @staticmethod
    def _estimate_tokens(text: str) -> int:
        # Rough estimation: ~4 chars per token for English educational text
        return max(1, len(text) // 4)
