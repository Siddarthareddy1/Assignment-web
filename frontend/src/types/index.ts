export type DocumentStatus = 'uploading' | 'queued' | 'parsing' | 'analyzing' | 'ready' | 'failed';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple_choice' | 'short_answer' | 'long_answer' | 'essay' | 'coding' | 'numerical' | 'diagram_based';

export interface DocumentAnalysis {
  subject: string;
  courseOrChapter?: string;
  mainTopics: string[];
  subtopics: string[];
  questionTypes: QuestionType[];
  approximateDifficulty: DifficultyLevel;
  questionCount: number;
  commonFormulas: string[];
  formattingPatterns: string[];
  learningObjectives: string[];
  summaryText: string;
}

export interface DocumentRecord {
  id: string;
  ownerId: string;
  originalName: string;
  storagePath: string;
  fileType: string;
  fileSize: number;
  pageCount: number;
  status: DocumentStatus;
  progress: number;
  analysisSummary?: DocumentAnalysis;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface QuestionItem {
  id: string;
  topic: string;
  difficulty: DifficultyLevel;
  type: QuestionType;
  questionText: string;
  options?: string[];
  expectedAnswerCriteria: string;
  conceptTested: string;
  sampleAnswer?: string;
  hint?: string;
  watermark: string;
}

export interface PracticeSetRecord {
  id: string;
  ownerId: string;
  documentId: string;
  title: string;
  selectedTopics: string[];
  difficulty: DifficultyLevel;
  questionTypes: QuestionType[];
  questions: QuestionItem[];
  timeLimitMinutes?: number;
  createdAt: string;
  status: string;
}

export interface SolutionStep {
  stepNumber: number;
  title: string;
  explanation: string;
  whyNecessary: string;
}

export interface SolutionExplanation {
  questionId: string;
  whatQuestionIsAsking: string;
  relevantConcept: string;
  formulaOrPrinciple?: string;
  steps: {
    stepNumber: number;
    title: string;
    explanation: string;
    whyNecessary: string;
  }[];
  finalAnswer: string;
  commonMistakes: string[];
  tipOrQuickMethod?: string;
  complexityAnalysis?: string;
}

export interface HintResponse {
  questionId: string;
  hintText: string;
  guidingQuestion: string;
}

export interface SimplifyResponse {
  questionId: string;
  simplifiedExplanation: string;
  realWorldAnalogy: string;
}

export interface AnswerFeedback {
  whatYouGotRight: string[];
  whatNeedsCorrection: string[];
  whatIsMissing: string[];
  howToImprove: string[];
  score?: number;
  maxScore?: number;
  evaluationConfidence: string;
  coachNotes: string;
}

export type AttemptFeedback = AnswerFeedback;

export interface AttemptRecord {
  id: string;
  ownerId: string;
  practiceSetId: string;
  questionId: string;
  response: string;
  feedback: AnswerFeedback;
  score?: number;
  completedAt: string;
}

export interface TopicPerformance {
  topic: string;
  attemptedCount: number;
  correctCount: number;
  accuracy: number;
  lastPracticedAt?: string;
}

export interface AccuracyPoint {
  date: string;
  accuracy: number;
  attemptsCount: number;
}

export interface RecommendationItem {
  id: string;
  topic: string;
  reason: string;
  suggestedAction: string;
  difficulty: DifficultyLevel;
  priority: string;
}

export interface AnalyticsOverview {
  totalDocuments: number;
  totalQuestionsPracticed: number;
  overallAccuracy: number;
  learningStreakDays: number;
  accuracyOverTime: AccuracyPoint[];
  topicPerformance: TopicPerformance[];
  strongTopics: string[];
  weakTopics: string[];
  difficultyBreakdown: Record<string, number>;
  recommendations: RecommendationItem[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt?: string;
  preferences?: Record<string, any>;
}
