import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import (
    AttemptSubmitRequest,
    AttemptRecord,
    AnswerFeedback,
    QuestionItem,
    UserProfile
)
from app.core.security import get_current_user, verify_ownership
from app.services.firebase_service import firebase_service
from app.ai.answer_feedback import AnswerFeedbackService

router = APIRouter()

@router.post("", response_model=AttemptRecord, status_code=status.HTTP_201_CREATED)
async def submit_attempt(
    request: AttemptSubmitRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Submits a student's answer attempt.
    Analyzes the attempt using pedagogical criteria and returns structured coaching feedback:
    - What you got right
    - What needs correction
    - What is missing
    - How to improve
    - Rubric Score
    """
    # 1. Fetch practice set and question
    ps_data = await firebase_service.get_practice_set(request.practiceSetId)
    if not ps_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Practice set not found")
    verify_ownership(ps_data["ownerId"], current_user)

    target_q = None
    for q in ps_data.get("questions", []):
        if q.get("id") == request.questionId:
            target_q = QuestionItem(**q)
            break

    if not target_q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found in practice set")

    # 2. Generate constructive feedback
    feedback = await AnswerFeedbackService.evaluate_student_answer(target_q, request.response)

    # 3. Store attempt record
    attempt_id = f"att_{str(uuid.uuid4())[:12]}"
    now_iso = datetime.utcnow().isoformat()

    attempt_record = AttemptRecord(
        id=attempt_id,
        ownerId=current_user.uid,
        practiceSetId=request.practiceSetId,
        questionId=request.questionId,
        response=request.response,
        feedback=feedback,
        score=feedback.score,
        completedAt=now_iso
    )

    await firebase_service.save_attempt(attempt_record.dict())

    return attempt_record

@router.get("", response_model=List[AttemptRecord])
async def list_attempts(current_user: UserProfile = Depends(get_current_user)):
    """Lists all past practice attempts submitted by the student."""
    attempts = await firebase_service.list_attempts(current_user.uid)
    return [AttemptRecord(**a) for a in attempts]
