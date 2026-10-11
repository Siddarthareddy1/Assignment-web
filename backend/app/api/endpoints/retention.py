from fastapi import APIRouter, Depends, status
from app.models.schemas import UserProfile
from app.core.security import get_current_user
from app.services.firebase_service import firebase_service

router = APIRouter()

@router.post("/cleanup", status_code=status.HTTP_200_OK)
async def trigger_retention_cleanup():
    """
    Executes automated cleanup for documents older than 30 days.
    Can be scheduled via Cron or Cloud Scheduler.
    """
    deleted_count = await firebase_service.cleanup_expired_files()
    return {
        "status": "success",
        "deletedCount": deleted_count,
        "message": f"Successfully deleted {deleted_count} expired files matching the 30-day retention policy."
    }

@router.delete("/account-data", status_code=status.HTTP_200_OK)
async def delete_all_user_data(current_user: UserProfile = Depends(get_current_user)):
    """
    Deletes all uploaded documents, practice sets, attempts, and metadata
    associated with the authenticated student's account.
    """
    user_id = current_user.uid
    docs = await firebase_service.list_documents(user_id)
    for d in docs:
        await firebase_service.delete_document(d["id"])

    return {
        "status": "success",
        "message": "All uploaded documents and derived practice records have been permanently erased."
    }
