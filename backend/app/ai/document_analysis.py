import json
import logging
import re
from typing import List, Optional
import anthropic
from app.core.config import settings
from app.models.schemas import DocumentAnalysis, DocumentChunk, DifficultyLevel, QuestionType

logger = logging.getLogger(__name__)

class DocumentAnalysisService:
    @staticmethod
    async def analyze_document_chunks(chunks: List[DocumentChunk]) -> DocumentAnalysis:
        """
        Analyzes representative chunks of the uploaded document using Claude.
        Never sends an entire 200-page document in a single request.
        """
        # Select representative chunks: first chunk, middle chunk, and another representative chunk
        selected_chunks = []
        if len(chunks) <= 3:
            selected_chunks = chunks
        else:
            selected_chunks = [chunks[0], chunks[len(chunks) // 2], chunks[-1]]

        combined_text = "\n\n".join([
            f"[Section: {c.sectionTitle} (Pages {c.startPage}–{c.endPage})]:\n{c.extractedText[:2500]}"
            for c in selected_chunks
        ])

        # If Anthropic API key is available, call Claude API
        if settings.ANTHROPIC_API_KEY:
            try:
                client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                prompt = f"""You are an expert curriculum and educational analyst for StudyPath.
Analyze the following study material excerpt:

{combined_text}

Provide an educational content analysis in pure JSON with exactly this structure:
{{
  "subject": "Name of the subject (e.g. Data Structures and Algorithms)",
  "courseOrChapter": "Course or chapter title",
  "mainTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3", "Subtopic 4"],
  "questionTypes": ["multiple_choice", "short_answer", "coding", "numerical"],
  "approximateDifficulty": "medium",
  "questionCount": 10,
  "commonFormulas": ["Formula or core principle 1", "Formula or core principle 2"],
  "formattingPatterns": ["Sample problem format observed"],
  "learningObjectives": ["Objective 1", "Objective 2"],
  "summaryText": "A 2-3 sentence overview of what the document covers."
}}

Only output valid JSON, nothing else."""

                response = client.messages.create(
                    model=settings.ANTHROPIC_MODEL,
                    max_tokens=1500,
                    temperature=0.2,
                    messages=[{"role": "user", "content": prompt}]
                )
                raw_text = response.content[0].text.strip()
                # Extract JSON block
                json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    return DocumentAnalysis(
                        subject=parsed.get("subject", "General Academic Study"),
                        courseOrChapter=parsed.get("courseOrChapter", "Module 1"),
                        mainTopics=parsed.get("mainTopics", ["Core Concepts", "Problem Solving"]),
                        subtopics=parsed.get("subtopics", ["Fundamental Theory", "Practical Applications"]),
                        questionTypes=[QuestionType(qt) for qt in parsed.get("questionTypes", ["multiple_choice", "short_answer"]) if qt in QuestionType._value2member_map_],
                        approximateDifficulty=DifficultyLevel(parsed.get("approximateDifficulty", "medium").lower()),
                        questionCount=parsed.get("questionCount", 8),
                        commonFormulas=parsed.get("commonFormulas", []),
                        formattingPatterns=parsed.get("formattingPatterns", []),
                        learningObjectives=parsed.get("learningObjectives", ["Master foundational concepts"]),
                        summaryText=parsed.get("summaryText", "Material covers comprehensive study guidelines and practice concepts.")
                    )
            except Exception as e:
                logger.warning(f"Claude API analysis failed, falling back to heuristic parsing: {e}")

        # Smart Heuristic / Demo Fallback
        return DocumentAnalysisService._heuristic_analysis(chunks)

    @staticmethod
    def _heuristic_analysis(chunks: List[DocumentChunk]) -> DocumentAnalysis:
        full_text = " ".join([c.extractedText[:1000] for c in chunks])
        lower_text = full_text.lower()

        # Heuristic detection of subject & topics
        subject = "Computer Science & Engineering"
        topics = ["Data Structures", "Algorithms", "Time Complexity", "Recursion"]
        q_types = [QuestionType.MULTIPLE_CHOICE, QuestionType.SHORT_ANSWER, QuestionType.CODING]

        if "quantum" in lower_text or "qubit" in lower_text:
            subject = "Quantum Computing"
            topics = ["Qubits & Superposition", "Quantum Gates", "Entanglement", "Measurement"]
            q_types = [QuestionType.MULTIPLE_CHOICE, QuestionType.NUMERICAL, QuestionType.SHORT_ANSWER]
        elif "calculus" in lower_text or "derivative" in lower_text or "integral" in lower_text:
            subject = "Mathematics & Calculus"
            topics = ["Differentiation", "Integration", "Limits & Continuity", "Optimization"]
            q_types = [QuestionType.NUMERICAL, QuestionType.SHORT_ANSWER]
        elif "history" in lower_text or "revolution" in lower_text or "century" in lower_text:
            subject = "History & Social Studies"
            topics = ["Historical Timeline", "Societal Impact", "Key Figures", "Treaties"]
            q_types = [QuestionType.MULTIPLE_CHOICE, QuestionType.ESSAY]
        elif "physics" in lower_text or "velocity" in lower_text or "newton" in lower_text:
            subject = "Physics & Mechanics"
            topics = ["Kinematics", "Newton's Laws", "Energy & Momentum", "Rotational Dynamics"]
            q_types = [QuestionType.NUMERICAL, QuestionType.MULTIPLE_CHOICE]

        topic_count = len(topics)
        return DocumentAnalysis(
            subject=subject,
            courseOrChapter="Unit 1: Fundamentals and Principles",
            mainTopics=topics,
            subtopics=[f"{t} Applications" for t in topics] + ["Review & Synthesis"],
            questionTypes=q_types,
            approximateDifficulty=DifficultyLevel.MEDIUM,
            questionCount=max(6, len(chunks) * 2),
            commonFormulas=["Fundamental Identity: E = mc²", "Recurrence Relation: T(n) = 2T(n/2) + O(n)"],
            formattingPatterns=["Standard academic question format with problem statement and constraints."],
            learningObjectives=[
                "Understand fundamental theorems and core mechanisms.",
                "Apply algorithmic techniques to novel problem instances.",
                "Identify common edge cases and analysis pitfalls."
            ],
            summaryText=f"Your material covers {topic_count} key topics ({', '.join(topics[:3])}) with structured problem formats. Ready for personalized practice generation."
        )
