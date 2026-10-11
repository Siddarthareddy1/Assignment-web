import asyncio
import logging
from typing import Dict, Any, Optional
from app.core.config import settings
from app.models.schemas import DocumentStatus
from app.services.firebase_service import firebase_service
from app.parsing.extractor import DocumentExtractor
from app.parsing.chunker import DocumentChunker
from app.ai.document_analysis import DocumentAnalysisService
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

async def process_document_pipeline_async(document_id: str, owner_id: str) -> None:
    """
    Main asynchronous document processing pipeline.
    Invoked either by Celery background worker or FastAPI BackgroundTasks.
    """
    logger.info(f"Starting processing pipeline for document: {document_id}")
    doc = await firebase_service.get_document(document_id)
    if not doc:
        logger.error(f"Document {document_id} not found for processing.")
        return

    try:
        # Stage 1: Parsing
        await firebase_service.update_document_status(
            document_id=document_id,
            status=DocumentStatus.PARSING.value,
            progress=20
        )

        file_bytes = await firebase_service.get_file_content(doc["storagePath"])
        file_type = doc.get("fileType", "").lower()

        # Execute format extraction
        if "pdf" in file_type:
            extraction = DocumentExtractor.extract_pdf(file_bytes)
        elif "docx" in file_type:
            extraction = DocumentExtractor.extract_docx(file_bytes)
        elif file_type == "doc":
            extraction = DocumentExtractor.extract_legacy_doc(file_bytes)
        elif "pptx" in file_type or "presentation" in file_type:
            extraction = DocumentExtractor.extract_pptx(file_bytes)
        elif "txt" in file_type or "text" in file_type:
            extraction = DocumentExtractor.extract_txt(file_bytes)
        elif any(img_t in file_type for img_t in ["png", "jpg", "jpeg"]):
            extraction = DocumentExtractor.extract_image(file_bytes, file_type)
        else:
            # Fallback to text parsing
            extraction = DocumentExtractor.extract_txt(file_bytes)

        # Stage 2: Chunking (2-4 pages per chunk)
        await firebase_service.update_document_status(
            document_id=document_id,
            status=DocumentStatus.PARSING.value,
            progress=50
        )

        chunks = DocumentChunker.chunk_document(
            owner_id=owner_id,
            document_id=document_id,
            extraction=extraction,
            target_pages_per_chunk=3
        )

        # Save chunks to Firestore
        chunks_dicts = [c.dict() for c in chunks]
        await firebase_service.save_chunks(document_id, chunks_dicts)

        # Stage 3: AI Analysis with Claude
        await firebase_service.update_document_status(
            document_id=document_id,
            status=DocumentStatus.ANALYZING.value,
            progress=75
        )

        analysis = await DocumentAnalysisService.analyze_document_chunks(chunks)

        # Update document to Ready with full analysis summary and page warnings
        doc_update = await firebase_service.get_document(document_id)
        existing_warnings = doc_update.get("warnings", []) if doc_update else []
        all_warnings = list(set(existing_warnings + extraction.warnings))

        await firebase_service.update_document_status(
            document_id=document_id,
            status=DocumentStatus.READY.value,
            progress=100,
            analysis_summary=analysis.dict(),
            warnings=all_warnings
        )
        logger.info(f"Document {document_id} processing successfully completed.")

    except Exception as e:
        logger.error(f"Error processing document {document_id}: {str(e)}", exc_info=True)
        await firebase_service.update_document_status(
            document_id=document_id,
            status=DocumentStatus.FAILED.value,
            progress=0,
            warnings=[f"Processing failed: {str(e)}"]
        )

@celery_app.task(name="tasks.process_document", bind=True, max_retries=2)
def celery_process_document(self, document_id: str, owner_id: str):
    """Celery task entry point."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        loop.run_until_complete(process_document_pipeline_async(document_id, owner_id))
    except Exception as exc:
        logger.error(f"Celery task retry due to: {exc}")
        raise self.retry(exc=exc, countdown=10)
