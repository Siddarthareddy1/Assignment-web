from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class DocumentStatus(str, Enum):
    UPLOADING = "uploading"
    QUEUED = "queued"
    PARSING = "parsing"
    ANALYZING = "analyzing"
    READY = "ready"
    FAILED = "failed"

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    SHORT_ANSWER = "short_answer"
    LONG_ANSWER = "long_answer"
    ESSAY = "essay"
    CODING = "coding"
    NUMERICAL = "numerical"
    DIAGRAM_BASED = "diagram_based"

# --- User Schema ---
class UserProfile(BaseModel):
    uid: str
    email: str
    displayName: Optional[str] = "Student"
    createdAt: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = Field(default_factory=dict)

# --- Document Schemas ---
class DocumentChunk(BaseModel):
    chunkId: str
    ownerId: str
    documentId: str
    startPage: int
    endPage: int
    sectionTitle: Optional[str] = None
    extractedText: str
    contentMetadata: Dict[str, Any] = Field(default_factory=dict)
    tokenEstimate: int = 0

class DocumentAnalysis(BaseModel):
    subject: str = "General Studies"
    courseOrChapter: Optional[str] = None
    mainTopics: List[str] = Field(default_factory=list)
    subtopics: List[str] = Field(default_factory=list)
    questionTypes: List[QuestionType] = Field(default_factory=list)
    approximateDifficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    questionCount: int = 0
    commonFormulas: List[str] = Field(default_factory=list)
    formattingPatterns: List[str] = Field(default_factory=list)
    learningObjectives: List[str] = Field(default_factory=list)
    summaryText: str = ""

class DocumentRecord(BaseModel):
    id: str
    ownerId: str
    originalName: str
    storagePath: str
    fileType: str
    fileSize: int
    pageCount: int = 0
    status: DocumentStatus = DocumentStatus.QUEUED
    progress: int = 0
    analysisSummary: Optional[DocumentAnalysis] = None
    warnings: List[str] = Field(default_factory=list)
    createdAt: str
    updatedAt: str
    expiresAt: str

# --- Practice Generator Schemas ---
class QuestionOption(BaseModel):
    id: str
    text: str

class QuestionItem(BaseModel):
    id: str
    topic: str
    difficulty: DifficultyLevel
    type: QuestionType
    questionText: str
    options: Optional[List[str]] = None
    expectedAnswerCriteria: str
    conceptTested: str
    sampleAnswer: Optional[str] = None
    hint: Optional[str] = None
    watermark: str = "Practice Material • Not for Submission"

class PracticeSetGenerateRequest(BaseModel):
    documentId: str
    selectedTopics: List[str]
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    questionCount: int = Field(default=5, ge=1, le=20)
    questionTypes: List[QuestionType] = Field(default_factory=lambda: [QuestionType.MULTIPLE_CHOICE])
    timeLimitMinutes: Optional[int] = Field(default=None, ge=1, le=180)

class PracticeSetRecord(BaseModel):
    id: str
    ownerId: str
    documentId: str
    title: str
    selectedTopics: List[str]
    difficulty: DifficultyLevel
    questionTypes: List[QuestionType]
    questions: List[QuestionItem]
    timeLimitMinutes: Optional[int] = None
    createdAt: str
    status: str = "active"

class RegenerateQuestionRequest(BaseModel):
    questionId: str
    reason: Optional[str] = None

# --- Solution & Hint Schemas ---
class SolutionStep(BaseModel):
    stepNumber: int
    title: str
    explanation: str
    whyNecessary: str

class SolutionExplanation(BaseModel):
    questionId: str
    whatQuestionIsAsking: str
    relevantConcept: str
    formulaOrPrinciple: Optional[str] = None
    steps: List[SolutionStep]
    finalAnswer: str
    commonMistakes: List[str] = Field(default_factory=list)
    tipOrQuickMethod: Optional[str] = None
    complexityAnalysis: Optional[str] = None

class HintResponse(BaseModel):
    questionId: str
    hintText: str
    guidingQuestion: str

class SimplifyResponse(BaseModel):
    questionId: str
    simplifiedExplanation: str
    realWorldAnalogy: str

# --- Attempt & Feedback Schemas ---
class AttemptSubmitRequest(BaseModel):
    practiceSetId: str
    questionId: str
    response: str
    timeSpentSeconds: Optional[int] = 0

class AnswerFeedback(BaseModel):
    whatYouGotRight: List[str] = Field(default_factory=list)
    whatNeedsCorrection: List[str] = Field(default_factory=list)
    whatIsMissing: List[str] = Field(default_factory=list)
    howToImprove: List[str] = Field(default_factory=list)
    score: Optional[float] = None
    maxScore: Optional[float] = 10.0
    evaluationConfidence: str = "high"
    coachNotes: str = ""

class AttemptRecord(BaseModel):
    id: str
    ownerId: str
    practiceSetId: str
    questionId: str
    response: str
    feedback: AnswerFeedback
    score: Optional[float] = None
    completedAt: str

# --- Analytics Schemas ---
class TopicPerformance(BaseModel):
    topic: str
    attemptedCount: int
    correctCount: int
    accuracy: float
    lastPracticedAt: Optional[str] = None

class AccuracyPoint(BaseModel):
    date: str
    accuracy: float
    attemptsCount: int

class RecommendationItem(BaseModel):
    id: str
    topic: str
    reason: str
    suggestedAction: str
    difficulty: DifficultyLevel
    priority: str

class AnalyticsOverview(BaseModel):
    totalDocuments: int
    totalQuestionsPracticed: int
    overallAccuracy: float
    learningStreakDays: int
    accuracyOverTime: List[AccuracyPoint] = Field(default_factory=list)
    topicPerformance: List[TopicPerformance] = Field(default_factory=list)
    strongTopics: List[str] = Field(default_factory=list)
    weakTopics: List[str] = Field(default_factory=list)
    difficultyBreakdown: Dict[str, int] = Field(default_factory=dict)
    recommendations: List[RecommendationItem] = Field(default_factory=list)

# --- Background Job Record ---
class JobRecord(BaseModel):
    jobId: str
    ownerId: str
    documentId: str
    currentStage: str
    progress: int
    retryCount: int = 0
    lastSuccessfulStage: Optional[str] = None
    errorCode: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)
    createdAt: str
    updatedAt: str
