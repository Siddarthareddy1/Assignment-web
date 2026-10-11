import {
  DocumentRecord,
  DocumentAnalysis,
  PracticeSetRecord,
  QuestionItem,
  SolutionExplanation,
  HintResponse,
  SimplifyResponse,
  AttemptRecord,
  AnalyticsOverview,
  DifficultyLevel,
  QuestionType
} from '../types';
import { localEngine } from './localEngine';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

let authToken: string | null = null;
let currentUserId: string | null = null;

export const setApiAuthToken = (token: string | null, userId: string | null = null) => {
  authToken = token;
  currentUserId = userId;
};

const getHeaders = (isFormData: boolean = false): HeadersInit => {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  } else {
    headers['Authorization'] = 'Bearer mock-demo-token';
  }
  if (currentUserId) {
    headers['x-demo-user-id'] = currentUserId;
  }
  return headers;
};

// Document APIs
export async function uploadDocumentApi(file: File, acknowledgedIntegrity: boolean): Promise<DocumentRecord> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('acknowledged_integrity', String(acknowledgedIntegrity));

    const res = await fetch(`${API_BASE}/api/documents`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend upload unreachable, activating client processing engine fallback:', err);
  }

  // Graceful client fallback: ensures 100% successful upload on Vercel or offline runs
  return await localEngine.uploadDocument(file, acknowledgedIntegrity);
}

export async function fetchDocumentsApi(): Promise<DocumentRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/api/documents`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, using local storage documents:', err);
  }
  return await localEngine.getDocuments();
}

export async function getDocumentApi(id: string): Promise<DocumentRecord> {
  try {
    const res = await fetch(`${API_BASE}/api/documents/${id}`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, fetching document locally:', err);
  }
  return await localEngine.getDocument(id);
}

export async function deleteDocumentApi(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (res.ok) return;
  } catch (err) {
    console.warn('Backend unreachable, deleting document locally:', err);
  }
  return await localEngine.deleteDocument(id);
}

export async function retryDocumentApi(id: string): Promise<DocumentRecord> {
  try {
    const res = await fetch(`${API_BASE}/api/documents/${id}/process`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, retrying document locally:', err);
  }
  return await localEngine.retryDocument(id);
}

export async function getDocumentStatusApi(id: string): Promise<{ documentId: string; status: string; progress: number; warnings: string[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/documents/${id}/status`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // ignore
  }
  const doc = await localEngine.getDocument(id);
  return {
    documentId: doc.id,
    status: doc.status,
    progress: doc.progress,
    warnings: doc.warnings || []
  };
}

export async function getDocumentAnalysisApi(id: string): Promise<DocumentAnalysis> {
  try {
    const res = await fetch(`${API_BASE}/api/documents/${id}/analysis`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // ignore
  }
  const doc = await localEngine.getDocument(id);
  if (doc.analysisSummary) return doc.analysisSummary;
  throw new Error('Analysis not ready');
}

// Practice Generator APIs
export async function generatePracticeSetApi(params: {
  documentId: string;
  selectedTopics: string[];
  difficulty: DifficultyLevel;
  questionCount: number;
  questionTypes: QuestionType[];
  timeLimitMinutes?: number;
}): Promise<PracticeSetRecord> {
  try {
    const res = await fetch(`${API_BASE}/api/practice-sets/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, generating practice set locally:', err);
  }
  return await localEngine.generatePracticeSet(params);
}

export async function fetchPracticeSetsApi(): Promise<PracticeSetRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/api/practice-sets`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, fetching practice sets locally:', err);
  }
  return await localEngine.getPracticeSets();
}

export async function getPracticeSetApi(id: string): Promise<PracticeSetRecord> {
  try {
    const res = await fetch(`${API_BASE}/api/practice-sets/${id}`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, fetching practice set locally:', err);
  }
  return await localEngine.getPracticeSet(id);
}

export async function regenerateQuestionApi(practiceSetId: string, questionId: string, reason?: string): Promise<QuestionItem> {
  try {
    const res = await fetch(`${API_BASE}/api/practice-sets/${practiceSetId}/regenerate-question`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ questionId, reason })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, regenerating question locally:', err);
  }
  return await localEngine.regenerateQuestion(practiceSetId, questionId);
}

// Solution & Hint APIs
export async function getSolutionApi(questionId: string, questionData?: QuestionItem): Promise<SolutionExplanation> {
  try {
    const res = await fetch(`${API_BASE}/api/solutions/${questionId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(questionData || null)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, computing solution locally:', err);
  }
  return await localEngine.getSolution(questionId, questionData);
}

export async function getHintApi(questionId: string, questionData?: QuestionItem): Promise<HintResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/solutions/${questionId}/hint`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(questionData || null)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, computing hint locally:', err);
  }
  return await localEngine.getHint(questionId, questionData);
}

export async function getSimplifiedExplanationApi(questionId: string, questionData?: QuestionItem): Promise<SimplifyResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/solutions/${questionId}/simplify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(questionData || null)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, computing simplified explanation locally:', err);
  }
  return await localEngine.getSimplifiedExplanation(questionId, questionData);
}

// Attempt APIs
export async function submitAttemptApi(params: {
  practiceSetId: string;
  questionId: string;
  response: string;
  timeSpentSeconds?: number;
}): Promise<AttemptRecord> {
  try {
    const res = await fetch(`${API_BASE}/api/attempts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, evaluating attempt locally:', err);
  }
  return await localEngine.submitAttempt(params);
}

export async function fetchAttemptsApi(): Promise<AttemptRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/api/attempts`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, fetching attempts locally:', err);
  }
  return await localEngine.getAttempts();
}

// Analytics API
export async function fetchAnalyticsApi(): Promise<AnalyticsOverview> {
  try {
    const res = await fetch(`${API_BASE}/api/progress`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, computing analytics locally:', err);
  }
  return await localEngine.getAnalytics();
}

// Retention APIs
export async function triggerRetentionCleanupApi(): Promise<{ deletedCount: number; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/retention/cleanup`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, running retention cleanup locally:', err);
  }
  return await localEngine.cleanupExpiredFiles();
}

export async function deleteAllUserDataApi(): Promise<{ message: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/retention/account-data`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unreachable, wiping user data locally:', err);
  }
  return await localEngine.deleteAllUserData();
}
