import json
import uuid
import re
import logging
from typing import List, Optional
import anthropic
from app.core.config import settings
from app.models.schemas import (
    PracticeSetGenerateRequest,
    PracticeSetRecord,
    QuestionItem,
    DifficultyLevel,
    QuestionType,
    DocumentChunk
)

logger = logging.getLogger(__name__)

class QuestionGeneratorService:
    @staticmethod
    async def generate_practice_set(
        owner_id: str,
        request: PracticeSetGenerateRequest,
        relevant_chunks: List[DocumentChunk]
    ) -> PracticeSetRecord:
        """
        Generates original practice questions based on concepts in relevant chunks.
        Performs originality checks to ensure no copyright or source duplication.
        """
        # Collect excerpt context (max 3000 chars across chunks)
        context_snippets = [
            f"Topic: {c.sectionTitle}\n{c.extractedText[:1200]}"
            for c in relevant_chunks[:3]
        ]
        context_text = "\n---\n".join(context_snippets)

        questions: List[QuestionItem] = []

        if settings.ANTHROPIC_API_KEY:
            try:
                client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                prompt = f"""You are an educational assessment engineer for StudyPath.
Your task is to generate {request.questionCount} completely ORIGINAL practice questions inspired by the concepts below.

ACADEMIC INTEGRITY REQUIREMENTS:
1. Do NOT copy or clone any question verbatim from the source.
2. Formulate brand NEW problem scenarios, numbers, variables, and wording.
3. Target difficulty: {request.difficulty.value}.
4. Target topics: {', '.join(request.selectedTopics)}.
5. Question types to include: {[qt.value for qt in request.questionTypes]}.

Reference Educational Concepts:
{context_text}

Return JSON with an array of questions:
[
  {{
    "topic": "Topic Name",
    "difficulty": "{request.difficulty.value}",
    "type": "multiple_choice",
    "questionText": "Original problem statement...",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "expectedAnswerCriteria": "Criteria needed for full credit...",
    "conceptTested": "Core concept tested...",
    "sampleAnswer": "Correct answer / option letter",
    "hint": "A subtle hint without revealing the solution."
  }}
]

Output only the JSON array."""

                response = client.messages.create(
                    model=settings.ANTHROPIC_MODEL,
                    max_tokens=2500,
                    temperature=0.3,
                    messages=[{"role": "user", "content": prompt}]
                )
                raw_text = response.content[0].text.strip()
                json_match = re.search(r'\[.*\]', raw_text, re.DOTALL)
                if json_match:
                    items = json.loads(json_match.group(0))
                    for item in items:
                        q_obj = QuestionGeneratorService._parse_and_validate_question(item, request.difficulty, context_text)
                        if q_obj:
                            questions.append(q_obj)
            except Exception as e:
                logger.warning(f"Claude question generation failed, using educational template generator: {e}")

        # Fallback to high-quality educational template generator if API was unavailable or had missing questions
        if len(questions) < request.questionCount:
            needed = request.questionCount - len(questions)
            fallback_qs = QuestionGeneratorService._generate_curated_questions(
                request.selectedTopics,
                request.difficulty,
                request.questionTypes,
                needed
            )
            questions.extend(fallback_qs)

        ps_id = f"pset_{str(uuid.uuid4())[:12]}"
        title = f"{', '.join(request.selectedTopics[:2])} Practice Set ({request.difficulty.value.capitalize()})"

        return PracticeSetRecord(
            id=ps_id,
            ownerId=owner_id,
            documentId=request.documentId,
            title=title,
            selectedTopics=request.selectedTopics,
            difficulty=request.difficulty,
            questionTypes=request.questionTypes,
            questions=questions,
            timeLimitMinutes=request.timeLimitMinutes,
            createdAt=str(uuid.uuid1())
        )

    @staticmethod
    def _parse_and_validate_question(item: dict, difficulty: DifficultyLevel, source_text: str) -> Optional[QuestionItem]:
        q_text = item.get("questionText", "").strip()
        if not q_text:
            return None

        # Originality overlap check: ensure no 10-word substring match with source text
        words = q_text.lower().split()
        if len(words) >= 10:
            for i in range(len(words) - 9):
                phrase = " ".join(words[i:i+10])
                if phrase in source_text.lower():
                    logger.info("Question discarded due to high textual overlap with source.")
                    return None

        q_type_str = item.get("type", "multiple_choice")
        q_type = QuestionType(q_type_str) if q_type_str in QuestionType._value2member_map_ else QuestionType.MULTIPLE_CHOICE

        return QuestionItem(
            id=f"q_{str(uuid.uuid4())[:8]}",
            topic=item.get("topic", "Core Fundamentals"),
            difficulty=difficulty,
            type=q_type,
            questionText=q_text,
            options=item.get("options") if q_type == QuestionType.MULTIPLE_CHOICE else None,
            expectedAnswerCriteria=item.get("expectedAnswerCriteria", "Demonstrates logical reasoning and correct steps."),
            conceptTested=item.get("conceptTested", "Algorithmic Analysis"),
            sampleAnswer=item.get("sampleAnswer", ""),
            hint=item.get("hint", "Review the relationship between variables and base cases.")
        )

    @staticmethod
    async def regenerate_single_question(
        old_question: QuestionItem,
        difficulty: DifficultyLevel,
        reason: Optional[str] = None
    ) -> QuestionItem:
        """Regenerates a single problematic or requested question."""
        new_q = QuestionGeneratorService._generate_curated_questions(
            [old_question.topic],
            difficulty,
            [old_question.type],
            count=1
        )[0]
        new_q.id = old_question.id  # keep ID consistent for replacement
        return new_q

    @staticmethod
    def _generate_curated_questions(
        topics: List[str],
        difficulty: DifficultyLevel,
        question_types: List[QuestionType],
        count: int
    ) -> List[QuestionItem]:
        generated: List[QuestionItem] = []
        templates = [
            {
                "type": QuestionType.MULTIPLE_CHOICE,
                "text": "Consider an algorithm with recurrence relation T(n) = 3T(n/2) + O(n). According to the Master Theorem, what is its asymptotic upper bound?",
                "options": ["A) O(n log n)", "B) O(n^{log_2 3})", "C) O(n^2)", "D) O(2^n)"],
                "answer": "B) O(n^{log_2 3})",
                "concept": "Master Theorem (Case 1 where a > b^c)",
                "hint": "Calculate log_b(a) and compare it against the polynomial term exponent c."
            },
            {
                "type": QuestionType.CODING,
                "text": "Design a function `find_middle_node(head)` that identifies the middle node of a singly-linked list in a single traversal pass without computing total length beforehand. Specify the time and space complexity.",
                "options": None,
                "answer": "Use two pointers: slow and fast. Advance fast by 2 and slow by 1. Time O(N), Space O(1).",
                "concept": "Two-Pointer (Floyd's Tortoise and Hare) Technique",
                "hint": "Consider having two pointers moving at different velocities."
            },
            {
                "type": QuestionType.NUMERICAL,
                "text": "A hash table contains 64 slots and utilizes separate chaining. If 320 distinct keys are inserted with uniform distribution, calculate the expected load factor λ and the expected average search time for an unsuccessful search.",
                "options": None,
                "answer": "Load factor λ = 320 / 64 = 5. Unsuccessful search cost is 1 + λ = 6 operations.",
                "concept": "Hash Table Load Factor and Collision Chaining",
                "hint": "Load factor λ is defined as the total elements divided by table capacity."
            },
            {
                "type": QuestionType.SHORT_ANSWER,
                "text": "Explain why QuickSort exhibits O(n^2) worst-case time complexity, and describe two distinct pivot selection strategies designed to mitigate this risk in practical systems.",
                "options": None,
                "answer": "Worst-case occurs when partitions are extremely unbalanced (e.g. already sorted array with extremal pivot). Mitigations: Randomized pivot selection and Median-of-Three pivot strategy.",
                "concept": "Partitioning Degeneracy and Pivot Engineering",
                "hint": "Think about what happens when the chosen pivot divides an n-element array into 0 and n-1 elements."
            },
            {
                "type": QuestionType.MULTIPLE_CHOICE,
                "text": "Which of the following data structures provides the lowest worst-case time complexity for finding the minimum element while simultaneously guaranteeing O(1) amortized insertion?",
                "options": ["A) Unsorted Array", "B) Binary Search Tree", "C) Fibonacci Heap", "D) Simple Queue"],
                "answer": "C) Fibonacci Heap",
                "concept": "Priority Queue Amortized Time Bounds",
                "hint": "Look for a heap variant that supports lazy tree unioning."
            }
        ]

        for i in range(count):
            tpl = templates[i % len(templates)]
            topic = topics[i % len(topics)] if topics else "Computer Science"
            generated.append(QuestionItem(
                id=f"q_{str(uuid.uuid4())[:8]}",
                topic=topic,
                difficulty=difficulty,
                type=tpl["type"],
                questionText=tpl["text"],
                options=tpl["options"],
                expectedAnswerCriteria="Clear conceptual understanding with correct derivation.",
                conceptTested=tpl["concept"],
                sampleAnswer=tpl["answer"],
                hint=tpl["hint"]
            ))
        return generated
