from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import (
    PracticeSetGenerateRequest,
    PracticeSetRecord,
    RegenerateQuestionRequest,
    QuestionItem,
    UserProfile,
    DocumentChunk
)
from app.core.security import get_current_user, verify_ownership
from app.services.firebase_service import firebase_service
from app.ai.question_generator import QuestionGeneratorService

router = APIRouter()

@router.post("/generate", response_model=PracticeSetRecord, status_code=status.HTTP_201_CREATED)
async def generate_practice_set(
    request: PracticeSetGenerateRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Generates original practice questions based on selected topics and difficulty.
    Validates user ownership of source document and enforces academic integrity.
    """
    # 1. Verify source document exists and belongs to user
    doc = await firebase_service.get_document(request.documentId)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source document not found")
    verify_ownership(doc["ownerId"], current_user)

    # 2. Retrieve relevant chunks
    chunks_data = await firebase_service.get_chunks_for_document(request.documentId)
    chunks = [DocumentChunk(**c) for c in chunks_data]

    # Filter chunks matching selected topics if possible
    relevant_chunks = []
    if request.selectedTopics:
        for c in chunks:
            if any(t.lower() in c.extractedText.lower() or t.lower() in (c.sectionTitle or "").lower() for t in request.selectedTopics):
                relevant_chunks.append(c)
    if not relevant_chunks:
        relevant_chunks = chunks[:5]  # Fallback to initial chunks

    # 3. Generate practice set with originality guarantees
    practice_set = await QuestionGeneratorService.generate_practice_set(
        owner_id=current_user.uid,
        request=request,
        relevant_chunks=relevant_chunks
    )

    # 4. Save to Firestore
    await firebase_service.save_practice_set(practice_set.dict())

    return practice_set

@router.get("", response_model=List[PracticeSetRecord])
async def list_practice_sets(current_user: UserProfile = Depends(get_current_user)):
    """Lists all practice sets created for the authenticated student."""
    sets = await firebase_service.list_practice_sets(current_user.uid)
    return [PracticeSetRecord(**s) for s in sets]

@router.get("/{practice_set_id}", response_model=PracticeSetRecord)
async def get_practice_set(practice_set_id: str, current_user: UserProfile = Depends(get_current_user)):
    """Retrieves practice set. Answers remain hidden until solutions are requested."""
    ps = await firebase_service.get_practice_set(practice_set_id)
    if not ps:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Practice set not found")
    verify_ownership(ps["ownerId"], current_user)
    return PracticeSetRecord(**ps)

@router.post("/{practice_set_id}/regenerate-question", response_model=QuestionItem)
async def regenerate_question(
    practice_set_id: str,
    request: RegenerateQuestionRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """Regenerates a single question inside a practice set without recreating the whole set."""
    ps_data = await firebase_service.get_practice_set(practice_set_id)
    if not ps_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Practice set not found")
    verify_ownership(ps_data["ownerId"], current_user)

    ps = PracticeSetRecord(**ps_data)
    target_q = None
    target_idx = -1
    for idx, q in enumerate(ps.questions):
        if q.id == request.questionId:
            target_q = q
            target_idx = idx
            break

    if not target_q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question ID not found in practice set")

    new_q = await QuestionGeneratorService.regenerate_single_question(
        old_question=target_q,
        difficulty=ps.difficulty,
        reason=request.reason
    )

    ps.questions[target_idx] = new_q
    await firebase_service.save_practice_set(ps.dict())

    return new_q
