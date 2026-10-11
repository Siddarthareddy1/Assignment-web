import json
import logging
import re
from typing import Optional
import anthropic
from app.core.config import settings
from app.models.schemas import (
    SolutionExplanation,
    SolutionStep,
    HintResponse,
    SimplifyResponse,
    QuestionItem
)

logger = logging.getLogger(__name__)

class SolutionExplainerService:

    @staticmethod
    async def get_solution_explanation(question: QuestionItem) -> SolutionExplanation:
        """Generates comprehensive step-by-step breakdown using Claude with high-fidelity fallback."""
        if settings.ANTHROPIC_API_KEY:
            try:
                client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                prompt = f"""You are a master academic tutor for StudyPath.
Provide a clear, pedagogical step-by-step solution to this question:

Question: {question.questionText}
Topic: {question.topic}
Type: {question.type.value}
Difficulty: {question.difficulty.value}

Provide your response in strictly valid JSON:
{{
  "questionId": "{question.id}",
  "whatQuestionIsAsking": "Clear summary of the objective...",
  "relevantConcept": "Core concept explanation...",
  "formulaOrPrinciple": "Relevant mathematical formula or logical principle...",
  "steps": [
    {{
      "stepNumber": 1,
      "title": "Step 1 title",
      "explanation": "Detailed step explanation...",
      "whyNecessary": "Why this step cannot be skipped..."
    }},
    {{
      "stepNumber": 2,
      "title": "Step 2 title",
      "explanation": "Detailed step explanation...",
      "whyNecessary": "Why this step cannot be skipped..."
    }}
  ],
  "finalAnswer": "Precise final answer...",
  "commonMistakes": ["Pitfall 1 to avoid", "Pitfall 2 to avoid"],
  "tipOrQuickMethod": "Shortcut or intuition booster...",
  "complexityAnalysis": "Time & space complexity if applicable"
}}"""

                response = client.messages.create(
                    model=settings.ANTHROPIC_MODEL,
                    max_tokens=2000,
                    temperature=0.2,
                    messages=[{"role": "user", "content": prompt}]
                )
                raw_text = response.content[0].text.strip()
                json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group(0))
                    steps = [
                        SolutionStep(
                            stepNumber=s["stepNumber"],
                            title=s["title"],
                            explanation=s["explanation"],
                            whyNecessary=s["whyNecessary"]
                        )
                        for s in data.get("steps", [])
                    ]
                    return SolutionExplanation(
                        questionId=question.id,
                        whatQuestionIsAsking=data.get("whatQuestionIsAsking", "Derive the correct mathematical or logical outcome."),
                        relevantConcept=data.get("relevantConcept", question.conceptTested),
                        formulaOrPrinciple=data.get("formulaOrPrinciple"),
                        steps=steps,
                        finalAnswer=data.get("finalAnswer", question.sampleAnswer or "See steps above."),
                        commonMistakes=data.get("commonMistakes", ["Misreading variable bounds", "Skipping base case"]),
                        tipOrQuickMethod=data.get("tipOrQuickMethod", "Verify with small input examples first."),
                        complexityAnalysis=data.get("complexityAnalysis")
                    )
            except Exception as e:
                logger.warning(f"Claude solution explainer failed, using pedagogical fallback: {e}")

        # Curated pedagogical fallback
        return SolutionExplanation(
            questionId=question.id,
            whatQuestionIsAsking=f"The question asks to evaluate the core behavior of {question.topic} under given constraints and determine the exact solution.",
            relevantConcept=f"Tested Concept: {question.conceptTested}. Focuses on understanding invariants, boundary conditions, and foundational theory.",
            formulaOrPrinciple="Core Formulation: Apply formal definitions and verify transitions at each discrete stage.",
            steps=[
                SolutionStep(
                    stepNumber=1,
                    title="Deconstruct the Given Premises",
                    explanation=f"Carefully extract the initial parameters from: '{question.questionText[:80]}...'. Map all identifiers to their mathematical or logical roles.",
                    whyNecessary="Ensures no subtle constraints or variable definitions are overlooked."
                ),
                SolutionStep(
                    stepNumber=2,
                    title="Apply the Governing Theorem",
                    explanation=f"Relate the problem parameters to {question.conceptTested}. Substitute the specific values into the theorem.",
                    whyNecessary="Transforms a general theorem into a concrete, solvable equation or logic chain."
                ),
                SolutionStep(
                    stepNumber=3,
                    title="Simplify and Derive Result",
                    explanation="Execute algebraic or step-by-step transformations systematically. Test intermediate values against sanity bounds.",
                    whyNecessary="Guarantees numerical and symbolic accuracy before finalizing the conclusion."
                )
            ],
            finalAnswer=question.sampleAnswer or "The correct result derived through rigorous step execution.",
            commonMistakes=[
                "Confusing worst-case behavior with average-case expectations.",
                "Neglecting boundary conditions such as empty inputs or zero denominators.",
                "Prematurely rounding intermediate fractions."
            ],
            tipOrQuickMethod="Quick intuition check: Plug in n = 1 or a minimal test case to verify that the derived formula holds true.",
            complexityAnalysis="Time Complexity: O(1) or logarithmic evaluation; Space Complexity: O(1) auxiliary."
        )

    @staticmethod
    async def get_hint(question: QuestionItem) -> HintResponse:
        hint_text = question.hint or "Think about the underlying relationship between the given parameters and base constraints."
        guiding_q = "What happens to the equation or algorithm when you consider the smallest non-trivial input?"
        return HintResponse(
            questionId=question.id,
            hintText=hint_text,
            guidingQuestion=guiding_q
        )

    @staticmethod
    async def get_simplified_explanation(question: QuestionItem) -> SimplifyResponse:
        return SimplifyResponse(
            questionId=question.id,
            simplifiedExplanation=f"In simple terms, imagine you are organizing items so you can retrieve them with minimal effort. This question tests how efficiently you can do that for {question.topic}.",
            realWorldAnalogy="Like looking up a word in a physical dictionary: instead of flipping every single page from page 1, you open to the middle, decide if your word is earlier or later, and repeat."
        )
