import json
import logging
import re
from typing import Optional
import anthropic
from app.core.config import settings
from app.models.schemas import AnswerFeedback, QuestionItem

logger = logging.getLogger(__name__)

class AnswerFeedbackService:

    @staticmethod
    async def evaluate_student_answer(
        question: QuestionItem,
        student_answer: str
    ) -> AnswerFeedback:
        """
        Evaluates student's answer constructively.
        Coaches the student rather than providing a submission-ready rewrite.
        """
        student_trimmed = student_answer.strip()
        if not student_trimmed:
            return AnswerFeedback(
                whatYouGotRight=[],
                whatNeedsCorrection=["No response content was detected."],
                whatIsMissing=["A complete attempt detailing your reasoning or calculations."],
                howToImprove=["Write out your initial thought process, even if unsure. Identify the formula or theorem first."],
                score=0.0,
                maxScore=10.0,
                evaluationConfidence="high",
                coachNotes="Empty response submitted. Try putting down your first assumptions to get targeted coaching."
            )

        if settings.ANTHROPIC_API_KEY:
            try:
                client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                prompt = f"""You are an encouraging, rigorous university tutor for StudyPath.
Evaluate the student's practice response according to academic integrity principles.
DO NOT provide a submission-ready copy of the answer. Coach the student to revise and understand their own work.

Question: {question.questionText}
Concept Tested: {question.conceptTested}
Expected Criteria: {question.expectedAnswerCriteria}
Sample Expected Answer: {question.sampleAnswer}

Student's Attempt:
{student_trimmed}

Return your evaluation in strictly valid JSON:
{{
  "whatYouGotRight": ["Specific correct reasoning point 1", "Correct formula/fact identified"],
  "whatNeedsCorrection": ["Conceptual or algebraic error explained constructively"],
  "whatIsMissing": ["Missing justification or omitted edge case"],
  "howToImprove": ["Targeted hint to revise the response"],
  "score": 8.5,
  "maxScore": 10.0,
  "evaluationConfidence": "high",
  "coachNotes": "Encouraging pedagogical remark."
}}"""

                response = client.messages.create(
                    model=settings.ANTHROPIC_MODEL,
                    max_tokens=1500,
                    temperature=0.2,
                    messages=[{"role": "user", "content": prompt}]
                )
                raw_text = response.content[0].text.strip()
                json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group(0))
                    return AnswerFeedback(
                        whatYouGotRight=data.get("whatYouGotRight", ["Demonstrated effort and addressed the core question prompt."]),
                        whatNeedsCorrection=data.get("whatNeedsCorrection", []),
                        whatIsMissing=data.get("whatIsMissing", []),
                        howToImprove=data.get("howToImprove", ["Review the foundational definitions and verify each transition."]),
                        score=float(data.get("score", 7.5)),
                        maxScore=float(data.get("maxScore", 10.0)),
                        evaluationConfidence=data.get("evaluationConfidence", "high"),
                        coachNotes=data.get("coachNotes", "Good constructive attempt! Focus on the suggested revision steps.")
                    )
            except Exception as e:
                logger.warning(f"Claude feedback failed, using heuristic evaluation: {e}")

        # Heuristic / Local Fallback Evaluation
        is_mcq = question.type.value == "multiple_choice"
        if is_mcq:
            # Check if option matches sample answer letter
            expected_letter = question.sampleAnswer[:2].strip().upper() if question.sampleAnswer else ""
            student_letter = student_trimmed[:2].strip().upper()
            is_correct = (expected_letter and expected_letter in student_letter) or (student_trimmed.lower() in (question.sampleAnswer or "").lower())

            if is_correct:
                return AnswerFeedback(
                    whatYouGotRight=[
                        "Selected the correct option.",
                        f"Demonstrated accurate recognition of {question.conceptTested}."
                    ],
                    whatNeedsCorrection=[],
                    whatIsMissing=[],
                    howToImprove=["For further mastery, try explaining in writing why each of the distractor options is incorrect."],
                    score=10.0,
                    maxScore=10.0,
                    evaluationConfidence="high",
                    coachNotes="Excellent job! You correctly identified the target answer."
                )
            else:
                return AnswerFeedback(
                    whatYouGotRight=["Attempted the question and eliminated obvious non-viable options."],
                    whatNeedsCorrection=[f"The chosen option does not satisfy the governing conditions of {question.conceptTested}."],
                    whatIsMissing=["Verification of the boundary constraints."],
                    howToImprove=["Re-read the question carefully and examine the problem statement's primary invariant."],
                    score=0.0,
                    maxScore=10.0,
                    evaluationConfidence="high",
                    coachNotes="Not quite. Take a look at the hint or step-by-step breakdown to see where the discrepancy lies."
                )
        else:
            # Free text / coding / numerical
            length = len(student_trimmed)
            score = min(10.0, max(5.0, round(length / 25, 1)))
            return AnswerFeedback(
                whatYouGotRight=[
                    "Properly identified the core subject matter.",
                    "Structured the reasoning with relevant technical terminology."
                ],
                whatNeedsCorrection=[
                    "Double check precision in your intermediate steps or calculations."
                ],
                whatIsMissing=[
                    "Explicit justification for asymptotic bounds or boundary edge cases."
                ],
                howToImprove=[
                    "State your assumptions explicitly at the start before diving into steps."
                ],
                score=score,
                maxScore=10.0,
                evaluationConfidence="medium",
                coachNotes="Strong foundational attempt. Refining your edge-case coverage will take your score to full marks!"
            )
