from fastapi import APIRouter, Depends, HTTPException, Body, status
from app.models.schemas import (
    SolutionExplanation,
    HintResponse,
    SimplifyResponse,
    QuestionItem,
    UserProfile
)
from app.core.security import get_current_user
from app.services.firebase_service import firebase_service
from app.ai.solution_explainer import SolutionExplainerService

router = APIRouter()

async def _resolve_question_from_any_set(question_id: str, owner_id: str) -> QuestionItem:
    """Finds question object across student's practice sets."""
    sets = await firebase_service.list_practice_sets(owner_id)
    for s in sets:
        for q in s.get("questions", []):
            if q.get("id") == question_id:
                return QuestionItem(**q)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found in student's practice sets")

@router.post("/{question_id}", response_model=SolutionExplanation)
async def get_solution(
    question_id: str,
    question_data: QuestionItem = Body(None),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Returns step-by-step explainer for the question:
    1. What the question is asking
    2. The relevant concept
    3. Formula or principle used
    4. Each solution step and why necessary
    5. Final answer
    6. Common mistakes
    7. Quick tip
    """
    target_q = question_data or await _resolve_question_from_any_set(question_id, current_user.uid)
    return await SolutionExplainerService.get_solution_explanation(target_q)

@router.post("/{question_id}/hint", response_model=HintResponse)
async def get_hint(
    question_id: str,
    question_data: QuestionItem = Body(None),
    current_user: UserProfile = Depends(get_current_user)
):
    """Provides a subtle hint without revealing the full answer immediately."""
    target_q = question_data or await _resolve_question_from_any_set(question_id, current_user.uid)
    return await SolutionExplainerService.get_hint(target_q)

@router.post("/{question_id}/simplify", response_model=SimplifyResponse)
async def get_simplified_explanation(
    question_id: str,
    question_data: QuestionItem = Body(None),
    current_user: UserProfile = Depends(get_current_user)
):
    """Explains the problem concept simply with intuitive analogies."""
    target_q = question_data or await _resolve_question_from_any_set(question_id, current_user.uid)
    return await SolutionExplainerService.get_simplified_explanation(target_q)
