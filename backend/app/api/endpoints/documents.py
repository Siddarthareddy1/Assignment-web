import uuid
import os
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from app.models.schemas import (
    DocumentRecord,
    DocumentStatus,
    DocumentAnalysis,
    UserProfile
)
from app.core.config import settings
from app.core.security import get_current_user, verify_ownership
from app.services.firebase_service import firebase_service
from app.tasks.document_tasks import process_document_pipeline_async, celery_process_document

router = APIRouter()

ALLOWED_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
    "image/jpeg": "jpg",
    "image/png": "png"
}

ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "pptx", "txt", "jpg", "jpeg", "png"}

@router.post("", response_model=DocumentRecord, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    acknowledged_integrity: bool = Form(True),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Uploads a learning material file.
    Validates file type and size (<= 100MB), creates Firestore record,
    and enqueues background processing.
    """
    if not acknowledged_integrity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must acknowledge the Academic Integrity statement before uploading materials."
        )

    # 1. Validate file extension
    filename = file.filename or "uploaded_document"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PDF, DOCX, DOC, PPTX, TXT, JPG, PNG."
        )

    # 2. Read content and validate size (100 MB max)
    content = await file.read()
    file_size = len(content)
    max_bytes = settings.UPLOAD_MAX_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum upload limit of {settings.UPLOAD_MAX_SIZE_MB} MB."
        )
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    # 3. Store file securely
    doc_id = f"doc_{str(uuid.uuid4())[:12]}"
    storage_relative_path = f"uploads/{current_user.uid}/{doc_id}_{filename}"
    saved_path = await firebase_service.save_file_content(storage_relative_path, content)

    # 4. Create document record in Firestore
    now_iso = datetime.utcnow().isoformat()
    expires_iso = (datetime.utcnow() + timedelta(days=settings.DOCUMENT_RETENTION_DAYS)).isoformat()

    doc_record = DocumentRecord(
        id=doc_id,
        ownerId=current_user.uid,
        originalName=filename,
        storagePath=saved_path,
        fileType=ext,
        fileSize=file_size,
        pageCount=0,
        status=DocumentStatus.QUEUED,
        progress=5,
        warnings=[],
        createdAt=now_iso,
        updatedAt=now_iso,
        expiresAt=expires_iso
    )
    await firebase_service.save_document(doc_record.dict())

    # 5. Enqueue processing: try Celery first if configured; fallback to FastAPI background task
    try:
        celery_process_document.delay(doc_id, current_user.uid)
    except Exception:
        background_tasks.add_task(process_document_pipeline_async, doc_id, current_user.uid)

    return doc_record

@router.get("", response_model=List[DocumentRecord])
async def list_documents(current_user: UserProfile = Depends(get_current_user)):
    """Lists all study documents owned by the authenticated student."""
    docs = await firebase_service.list_documents(current_user.uid)
    return [DocumentRecord(**d) for d in docs]

@router.get("/{document_id}", response_model=DocumentRecord)
async def get_document(document_id: str, current_user: UserProfile = Depends(get_current_user)):
    """Retrieves document metadata, page warnings, and processing status."""
    doc = await firebase_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    verify_ownership(doc["ownerId"], current_user)
    return DocumentRecord(**doc)

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(document_id: str, current_user: UserProfile = Depends(get_current_user)):
    """Deletes the document, its chunks, and associated storage file."""
    doc = await firebase_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    verify_ownership(doc["ownerId"], current_user)
    await firebase_service.delete_document(document_id)
    return None

@router.post("/{document_id}/process", response_model=DocumentRecord)
async def retry_document_process(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user)
):
    """Retries processing for a failed or stalled document."""
    doc = await firebase_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    verify_ownership(doc["ownerId"], current_user)

    await firebase_service.update_document_status(
        document_id=document_id,
        status=DocumentStatus.QUEUED.value,
        progress=5,
        warnings=[]
    )

    try:
        celery_process_document.delay(document_id, current_user.uid)
    except Exception:
        background_tasks.add_task(process_document_pipeline_async, document_id, current_user.uid)

    updated_doc = await firebase_service.get_document(document_id)
    return DocumentRecord(**updated_doc)

@router.get("/{document_id}/status")
async def get_document_status(document_id: str, current_user: UserProfile = Depends(get_current_user)):
    """Lightweight endpoint for polling processing status and progress."""
    doc = await firebase_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    verify_ownership(doc["ownerId"], current_user)
    return {
        "documentId": doc["id"],
        "status": doc["status"],
        "progress": doc["progress"],
        "warnings": doc.get("warnings", []),
        "updatedAt": doc["updatedAt"]
    }

@router.get("/{document_id}/analysis", response_model=DocumentAnalysis)
async def get_document_analysis(document_id: str, current_user: UserProfile = Depends(get_current_user)):
    """Returns AI-extracted topic summaries, formulas, and difficulty."""
    doc = await firebase_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    verify_ownership(doc["ownerId"], current_user)
    analysis = doc.get("analysisSummary")
    if not analysis:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document analysis is not yet ready.")
    return DocumentAnalysis(**analysis)
