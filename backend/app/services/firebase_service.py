import os
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import credentials, firestore, storage
from app.core.config import settings

logger = logging.getLogger(__name__)

class FirebaseService:
    _instance = None
    _db = None
    _bucket = None
    _is_mock = False
    _mock_data: Dict[str, Dict[str, Any]] = {}

    def __init__(self):
        self._init_firebase()

    def _init_firebase(self):
        # Check if Firebase credentials are provided
        cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS
        project_id = settings.FIREBASE_PROJECT_ID

        if cred_path and os.path.exists(cred_path):
            try:
                if not firebase_admin._apps:
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred, {
                        'storageBucket': settings.FIREBASE_STORAGE_BUCKET or f"{project_id}.appspot.com"
                    })
                self._db = firestore.client()
                self._bucket = storage.bucket()
                self._is_mock = False
                logger.info("Connected to live Firebase instance via credentials file.")
                return
            except Exception as e:
                logger.warning(f"Failed to initialize Firebase with credentials file: {e}")

        # Try default credentials if in Google Cloud Run or App Engine
        try:
            if not firebase_admin._apps and project_id:
                firebase_admin.initialize_app(options={
                    'projectId': project_id,
                    'storageBucket': settings.FIREBASE_STORAGE_BUCKET
                })
                self._db = firestore.client()
                self._bucket = storage.bucket()
                self._is_mock = False
                logger.info("Connected to Firebase via Application Default Credentials.")
                return
        except Exception as e:
            logger.info(f"Firebase ADC not available: {e}")

        # Local development / Demo mode fallback
        self._is_mock = True
        logger.info("Operating in standalone storage mode for development.")
        self._mock_data = {
            "users": {},
            "documents": {},
            "chunks": {},
            "practiceSets": {},
            "attempts": {},
            "progress": {},
            "jobs": {}
        }
        os.makedirs(settings.LOCAL_STORAGE_DIR, exist_ok=True)

    # --- Document operations ---
    async def save_document(self, doc_data: Dict[str, Any]) -> str:
        doc_id = doc_data["id"]
        if not self._is_mock and self._db:
            self._db.collection("documents").document(doc_id).set(doc_data)
        else:
            self._mock_data["documents"][doc_id] = doc_data
        return doc_id

    async def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        if not self._is_mock and self._db:
            doc_ref = self._db.collection("documents").document(doc_id).get()
            return doc_ref.to_dict() if doc_ref.exists else None
        return self._mock_data["documents"].get(doc_id)

    async def list_documents(self, owner_id: str) -> List[Dict[str, Any]]:
        if not self._is_mock and self._db:
            docs = self._db.collection("documents").where("ownerId", "==", owner_id).stream()
            return [d.to_dict() for d in docs]
        return [
            d for d in self._mock_data["documents"].values()
            if d.get("ownerId") == owner_id
        ]

    async def update_document_status(
        self,
        doc_id: str,
        status: str,
        progress: int,
        analysis_summary: Optional[Dict[str, Any]] = None,
        warnings: Optional[List[str]] = None
    ) -> None:
        update_data = {
            "status": status,
            "progress": progress,
            "updatedAt": datetime.utcnow().isoformat()
        }
        if analysis_summary is not None:
            update_data["analysisSummary"] = analysis_summary
        if warnings is not None:
            update_data["warnings"] = warnings

        if not self._is_mock and self._db:
            self._db.collection("documents").document(doc_id).update(update_data)
        else:
            if doc_id in self._mock_data["documents"]:
                self._mock_data["documents"][doc_id].update(update_data)

    async def delete_document(self, doc_id: str) -> None:
        if not self._is_mock and self._db:
            self._db.collection("documents").document(doc_id).delete()
            # Also clean up chunks
            chunks = self._db.collection("documents").document(doc_id).collection("chunks").stream()
            for chunk in chunks:
                chunk.reference.delete()
        else:
            self._mock_data["documents"].pop(doc_id, None)
            # Remove chunks
            self._mock_data["chunks"] = {
                k: v for k, v in self._mock_data["chunks"].items()
                if v.get("documentId") != doc_id
            }

    # --- Chunk operations ---
    async def save_chunks(self, document_id: str, chunks: List[Dict[str, Any]]) -> None:
        if not self._is_mock and self._db:
            batch = self._db.batch()
            doc_ref = self._db.collection("documents").document(document_id)
            for c in chunks:
                chunk_ref = doc_ref.collection("chunks").document(c["chunkId"])
                batch.set(chunk_ref, c)
            batch.commit()
        else:
            for c in chunks:
                self._mock_data["chunks"][c["chunkId"]] = c

    async def get_chunks_for_document(self, document_id: str) -> List[Dict[str, Any]]:
        if not self._is_mock and self._db:
            stream = self._db.collection("documents").document(document_id).collection("chunks").stream()
            return [c.to_dict() for c in stream]
        return [
            c for c in self._mock_data["chunks"].values()
            if c.get("documentId") == document_id
        ]

    # --- Practice Set operations ---
    async def save_practice_set(self, practice_set: Dict[str, Any]) -> str:
        ps_id = practice_set["id"]
        if not self._is_mock and self._db:
            self._db.collection("practiceSets").document(ps_id).set(practice_set)
        else:
            self._mock_data["practiceSets"][ps_id] = practice_set
        return ps_id

    async def get_practice_set(self, practice_set_id: str) -> Optional[Dict[str, Any]]:
        if not self._is_mock and self._db:
            doc = self._db.collection("practiceSets").document(practice_set_id).get()
            return doc.to_dict() if doc.exists else None
        return self._mock_data["practiceSets"].get(practice_set_id)

    async def list_practice_sets(self, owner_id: str) -> List[Dict[str, Any]]:
        if not self._is_mock and self._db:
            sets = self._db.collection("practiceSets").where("ownerId", "==", owner_id).stream()
            return [s.to_dict() for s in sets]
        return [
            s for s in self._mock_data["practiceSets"].values()
            if s.get("ownerId") == owner_id
        ]

    # --- Attempt & Progress operations ---
    async def save_attempt(self, attempt: Dict[str, Any]) -> str:
        attempt_id = attempt["id"]
        if not self._is_mock and self._db:
            self._db.collection("attempts").document(attempt_id).set(attempt)
        else:
            self._mock_data["attempts"][attempt_id] = attempt
        return attempt_id

    async def list_attempts(self, owner_id: str) -> List[Dict[str, Any]]:
        if not self._is_mock and self._db:
            docs = self._db.collection("attempts").where("ownerId", "==", owner_id).stream()
            return [d.to_dict() for d in docs]
        return [
            a for a in self._mock_data["attempts"].values()
            if a.get("ownerId") == owner_id
        ]

    # --- Storage File handling ---
    async def save_file_content(self, relative_path: str, content: bytes) -> str:
        """Stores file in Firebase Storage if live, or local storage dir."""
        if not self._is_mock and self._bucket:
            blob = self._bucket.blob(relative_path)
            blob.upload_from_string(content)
            return blob.name
        else:
            full_path = os.path.join(settings.LOCAL_STORAGE_DIR, relative_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "wb") as f:
                f.write(content)
            return full_path

    async def get_file_content(self, relative_path: str) -> bytes:
        if not self._is_mock and self._bucket:
            blob = self._bucket.blob(relative_path)
            return blob.download_as_bytes()
        else:
            full_path = relative_path if os.path.isabs(relative_path) else os.path.join(settings.LOCAL_STORAGE_DIR, relative_path)
            if os.path.exists(full_path):
                with open(full_path, "rb") as f:
                    return f.read()
            raise FileNotFoundError(f"File not found: {relative_path}")

    # --- 30-Day Retention Cleanup ---
    async def cleanup_expired_files(self) -> int:
        """Deletes files older than retention policy."""
        now = datetime.utcnow()
        deleted_count = 0
        all_docs = list(self._mock_data["documents"].values()) if self._is_mock else []
        if not self._is_mock and self._db:
            docs = self._db.collection("documents").stream()
            all_docs = [d.to_dict() for d in docs]

        for doc in all_docs:
            expires_at_str = doc.get("expiresAt")
            if expires_at_str:
                try:
                    expires_at = datetime.fromisoformat(expires_at_str)
                    if now > expires_at:
                        await self.delete_document(doc["id"])
                        deleted_count += 1
                except Exception as e:
                    logger.warning(f"Error parsing expiresAt for doc {doc.get('id')}: {e}")
        return deleted_count

firebase_service = FirebaseService()
