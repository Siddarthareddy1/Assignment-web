import asyncio
import os
import sys
from datetime import datetime, timedelta

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.services.firebase_service import firebase_service
from app.models.schemas import (
    DocumentRecord,
    DocumentStatus,
    DocumentAnalysis,
    PracticeSetRecord,
    QuestionItem,
    AttemptRecord,
    AnswerFeedback,
    DifficultyLevel,
    QuestionType
)

async def seed_sample_data():
    print("Seeding safe, original StudyPath sample data...")
    demo_uid = "usr_demo_student_42"
    doc_id = "doc_sample_algorithms_101"
    now = datetime.utcnow()

    # 1. Sample Document
    sample_doc = DocumentRecord(
        id=doc_id,
        ownerId=demo_uid,
        originalName="Algorithms_and_Data_Structures_Sample.pdf",
        storagePath="samples/Algorithms_and_Data_Structures_Sample.pdf",
        fileType="pdf",
        fileSize=1420500,
        pageCount=18,
        status=DocumentStatus.READY,
        progress=100,
        analysisSummary=DocumentAnalysis(
            subject="Algorithms & Computation Theory",
            courseOrChapter="CS-204: Advanced Algorithmic Thinking",
            mainTopics=[
                "Master Theorem & Recurrences",
                "Divide & Conquer Strategies",
                "Graph Traversal & Search",
                "Dynamic Programming Invariants"
            ],
            subtopics=[
                "Asymptotic Big-O Bounds",
                "Depth-First Search vs Breadth-First Search",
                "Memoization Tables",
                "Greedy Choice Property"
            ],
            questionTypes=[
                QuestionType.MULTIPLE_CHOICE,
                QuestionType.SHORT_ANSWER,
                QuestionType.CODING,
                QuestionType.NUMERICAL
            ],
            approximateDifficulty=DifficultyLevel.MEDIUM,
            questionCount=12,
            commonFormulas=[
                "T(n) = a*T(n/b) + O(n^d)",
                "Space Complexity: O(V + E) for Adjacency List"
            ],
            formattingPatterns=["Formal theorem followed by complexity analysis exercises."],
            learningObjectives=[
                "Deconstruct recursive algorithms into recurrence equations.",
                "Select optimal graph exploration strategies.",
                "Construct optimal substructure proofs for DP."
            ],
            summaryText="Sample guide covers essential algorithms with mathematical proofs and complexity derivations."
        ),
        warnings=[],
        createdAt=(now - timedelta(days=3)).isoformat(),
        updatedAt=(now - timedelta(days=3)).isoformat(),
        expiresAt=(now + timedelta(days=27)).isoformat()
    )
    await firebase_service.save_document(sample_doc.dict())

    # 2. Sample Practice Set
    pset_id = "pset_demo_graph_mastery"
    questions = [
        QuestionItem(
            id="q_demo_01",
            topic="Master Theorem & Recurrences",
            difficulty=DifficultyLevel.MEDIUM,
            type=QuestionType.MULTIPLE_CHOICE,
            questionText="Given the recurrence relation T(n) = 4T(n/2) + O(n^2), what is the tight asymptotic time complexity bound according to the Master Theorem?",
            options=[
                "A) O(n^2)",
                "B) O(n^2 log n)",
                "C) O(n^3)",
                "D) O(2^n)"
            ],
            expectedAnswerCriteria="Correctly identify Master Theorem Case 2 where log_b(a) = log_2(4) = 2 equals d = 2.",
            conceptTested="Master Theorem Critical Exponent Equality (Case 2)",
            sampleAnswer="B) O(n^2 log n)",
            hint="Compute log_b(a) and compare with the exponent of the non-recursive overhead f(n)."
        ),
        QuestionItem(
            id="q_demo_02",
            topic="Graph Traversal & Search",
            difficulty=DifficultyLevel.MEDIUM,
            type=QuestionType.SHORT_ANSWER,
            questionText="Under what edge weight condition does Breadth-First Search (BFS) guarantee finding the shortest path between two vertices in a graph? Explain why.",
            options=None,
            expectedAnswerCriteria="Must specify unweighted or uniform edge weights, and explain level-by-level queue expansion.",
            conceptTested="BFS Shortest-Path Property on Uniform Weight Graphs",
            sampleAnswer="BFS guarantees the shortest path when all edges have equal non-negative weight (or weight = 1), because vertices are visited in non-decreasing order of distance from the source.",
            hint="Consider how the FIFO queue controls the sequence in which node frontiers are explored."
        ),
        QuestionItem(
            id="q_demo_03",
            topic="Dynamic Programming Invariants",
            difficulty=DifficultyLevel.HARD,
            type=QuestionType.CODING,
            questionText="Write a Python function `coin_change_min(coins: list[int], amount: int) -> int` that determines the fewest number of coins needed to make up the given amount. Return -1 if impossible.",
            options=None,
            expectedAnswerCriteria="Bottom-up DP table or top-down memoization with O(amount * len(coins)) complexity.",
            conceptTested="Unbounded Knapsack / Minimum Coin Change DP",
            sampleAnswer="def coin_change_min(coins, amount):\n    dp = [float('inf')] * (amount + 1)\n    dp[0] = 0\n    for c in coins:\n        for a in range(c, amount + 1):\n            dp[a] = min(dp[a], dp[a - c] + 1)\n    return dp[amount] if dp[amount] != float('inf') else -1",
            hint="Initialize a DP array of size amount + 1 with infinity, setting dp[0] = 0."
        )
    ]

    sample_pset = PracticeSetRecord(
        id=pset_id,
        ownerId=demo_uid,
        documentId=doc_id,
        title="Algorithms Core Practice Set (Medium)",
        selectedTopics=["Master Theorem & Recurrences", "Graph Traversal & Search", "Dynamic Programming Invariants"],
        difficulty=DifficultyLevel.MEDIUM,
        questionTypes=[QuestionType.MULTIPLE_CHOICE, QuestionType.SHORT_ANSWER, QuestionType.CODING],
        questions=questions,
        timeLimitMinutes=30,
        createdAt=(now - timedelta(days=2)).isoformat()
    )
    await firebase_service.save_practice_set(sample_pset.dict())

    # 3. Sample Attempts with real pedagogical coaching feedback
    attempts = [
        AttemptRecord(
            id="att_demo_01",
            ownerId=demo_uid,
            practiceSetId=pset_id,
            questionId="q_demo_01",
            response="B) O(n^2 log n)",
            feedback=AnswerFeedback(
                whatYouGotRight=[
                    "Selected the correct asymptotic bound: O(n^2 log n).",
                    "Recognized that log_2(4) = 2 matches the polynomial overhead exponent."
                ],
                whatNeedsCorrection=[],
                whatIsMissing=[],
                howToImprove=["Try proving the recurrence using a recursion tree to visualize why the log n factor appears."],
                score=10.0,
                maxScore=10.0,
                evaluationConfidence="high",
                coachNotes="Perfect derivation of Master Theorem Case 2!"
            ),
            score=10.0,
            completedAt=(now - timedelta(days=2)).isoformat()
        ),
        AttemptRecord(
            id="att_demo_02",
            ownerId=demo_uid,
            practiceSetId=pset_id,
            questionId="q_demo_02",
            response="BFS works when the graph has no weights. It explores neighbors first.",
            feedback=AnswerFeedback(
                whatYouGotRight=[
                    "Correctly identified unweighted graphs as the primary context.",
                    "Noted that BFS explores immediate neighbors first."
                ],
                whatNeedsCorrection=[
                    "More precisely, BFS also works if all edge weights are identical and positive (uniform weights), not just unweighted."
                ],
                whatIsMissing=[
                    "Explanation of how the FIFO queue guarantees that vertices at distance k are processed before vertices at distance k+1."
                ],
                howToImprove=[
                    "Mention the monotonic distance invariant maintained by the exploration queue."
                ],
                score=7.5,
                maxScore=10.0,
                evaluationConfidence="high",
                coachNotes="Solid intuitive answer. Adding the queue invariant will make your explanation exam-ready."
            ),
            score=7.5,
            completedAt=(now - timedelta(days=1)).isoformat()
        )
    ]

    for att in attempts:
        await firebase_service.save_attempt(att.dict())

    print(f"Sample data successfully seeded for user '{demo_uid}'!")

if __name__ == "__main__":
    asyncio.run(seed_sample_data())
