import pytest
from app.models.schemas import (
    PracticeSetGenerateRequest,
    DifficultyLevel,
    QuestionType,
    QuestionItem,
    DocumentChunk
)
from app.ai.question_generator import QuestionGeneratorService
from app.ai.solution_explainer import SolutionExplainerService
from app.ai.answer_feedback import AnswerFeedbackService

@pytest.mark.asyncio
async def test_question_generation_schema_and_watermark():
    chunk = DocumentChunk(
        chunkId="chk_1",
        ownerId="user_1",
        documentId="doc_1",
        startPage=1,
        endPage=3,
        sectionTitle="Divide and Conquer",
        extractedText="Divide and conquer splits problems into subproblems. Example: MergeSort.",
        tokenEstimate=100
    )
    request = PracticeSetGenerateRequest(
        documentId="doc_1",
        selectedTopics=["Divide and Conquer"],
        difficulty=DifficultyLevel.MEDIUM,
        questionCount=3,
        questionTypes=[QuestionType.MULTIPLE_CHOICE, QuestionType.SHORT_ANSWER]
    )

    pset = await QuestionGeneratorService.generate_practice_set(
        owner_id="user_1",
        request=request,
        relevant_chunks=[chunk]
    )

    assert pset.ownerId == "user_1"
    assert len(pset.questions) == 3
    for q in pset.questions:
        assert q.watermark == "Practice Material • Not for Submission"
        assert q.questionText != ""
        assert q.difficulty == DifficultyLevel.MEDIUM

@pytest.mark.asyncio
async def test_solution_explainer_structure():
    q = QuestionItem(
        id="q_100",
        topic="Dynamic Programming",
        difficulty=DifficultyLevel.MEDIUM,
        type=QuestionType.MULTIPLE_CHOICE,
        questionText="What is the optimal substructure property?",
        sampleAnswer="An optimal solution contains optimal sub-solutions.",
        expectedAnswerCriteria="Defines substructure property.",
        conceptTested="Dynamic Programming Substructure"
    )

    explanation = await SolutionExplainerService.get_solution_explanation(q)
    assert explanation.questionId == "q_100"
    assert len(explanation.steps) >= 2
    assert explanation.finalAnswer != ""
    assert len(explanation.commonMistakes) > 0

@pytest.mark.asyncio
async def test_answer_feedback_coaching_format():
    q = QuestionItem(
        id="q_200",
        topic="Sorting",
        difficulty=DifficultyLevel.EASY,
        type=QuestionType.MULTIPLE_CHOICE,
        questionText="Which sorting algorithm is stable?",
        options=["A) QuickSort", "B) MergeSort", "C) HeapSort", "D) SelectionSort"],
        sampleAnswer="B) MergeSort",
        expectedAnswerCriteria="Identifies MergeSort as stable.",
        conceptTested="Sorting Stability"
    )

    # Correct submission
    fb_correct = await AnswerFeedbackService.evaluate_student_answer(q, "B) MergeSort")
    assert fb_correct.score == 10.0
    assert len(fb_correct.whatYouGotRight) > 0

    # Incorrect submission
    fb_incorrect = await AnswerFeedbackService.evaluate_student_answer(q, "A) QuickSort")
    assert fb_incorrect.score == 0.0
    assert len(fb_incorrect.whatNeedsCorrection) > 0
    assert len(fb_incorrect.howToImprove) > 0
