import {
  DocumentRecord,
  DocumentAnalysis,
  PracticeSetRecord,
  QuestionItem,
  SolutionExplanation,
  HintResponse,
  SimplifyResponse,
  AttemptRecord,
  AttemptFeedback,
  AnalyticsOverview
} from '../types';

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
  const formData = new FormData();
  formData.append('file', file);
  formData.append('acknowledged_integrity', String(acknowledgedIntegrity));

  const res = await fetch(`${API_BASE}/api/documents`, {
    method: 'POST',
    headers: getHeaders(true),
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload document');
  }
  return res.json();
}

export async function fetchDocumentsApi(): Promise<DocumentRecord[]> {
  const res = await fetch(`${API_BASE}/api/documents`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function getDocumentApi(id: string): Promise<DocumentRecord> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch document details');
  return res.json();
}

export async function deleteDocumentApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete document');
}

export async function retryDocumentApi(id: string): Promise<DocumentRecord> {
  const res = await fetch(`${API_BASE}/api/documents/${id}/process`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to retry document processing');
  return res.json();
}

export async function getDocumentStatusApi(id: string): Promise<{ documentId: string; status: string; progress: number; warnings: string[] }> {
  const res = await fetch(`${API_BASE}/api/documents/${id}/status`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch document status');
  return res.json();
}

export async function getDocumentAnalysisApi(id: string): Promise<DocumentAnalysis> {
  const res = await fetch(`${API_BASE}/api/documents/${id}/analysis`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch document analysis');
  return res.json();
}

// Practice Generator APIs
export async function generatePracticeSetApi(params: {
  documentId: string;
  selectedTopics: string[];
  difficulty: string;
  questionCount: number;
  questionTypes: string[];
  timeLimitMinutes?: number;
}): Promise<PracticeSetRecord> {
  const res = await fetch(`${API_BASE}/api/practice-sets/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to generate practice set');
  }
  return res.json();
}

export async function fetchPracticeSetsApi(): Promise<PracticeSetRecord[]> {
  const res = await fetch(`${API_BASE}/api/practice-sets`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch practice sets');
  return res.json();
}

export async function getPracticeSetApi(id: string): Promise<PracticeSetRecord> {
  const res = await fetch(`${API_BASE}/api/practice-sets/${id}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch practice set');
  return res.json();
}

export async function regenerateQuestionApi(practiceSetId: string, questionId: string, reason?: string): Promise<QuestionItem> {
  const res = await fetch(`${API_BASE}/api/practice-sets/${practiceSetId}/regenerate-question`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ questionId, reason })
  });
  if (!res.ok) throw new Error('Failed to regenerate question');
  return res.json();
}

// Solution & Hint APIs
export async function getSolutionApi(questionId: string, questionData?: QuestionItem): Promise<SolutionExplanation> {
  const res = await fetch(`${API_BASE}/api/solutions/${questionId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(questionData || null)
  });
  if (!res.ok) throw new Error('Failed to load solution explanation');
  return res.json();
}

export async function getHintApi(questionId: string, questionData?: QuestionItem): Promise<HintResponse> {
  const res = await fetch(`${API_BASE}/api/solutions/${questionId}/hint`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(questionData || null)
  });
  if (!res.ok) throw new Error('Failed to load hint');
  return res.json();
}

export async function getSimplifiedExplanationApi(questionId: string, questionData?: QuestionItem): Promise<SimplifyResponse> {
  const res = await fetch(`${API_BASE}/api/solutions/${questionId}/simplify`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(questionData || null)
  });
  if (!res.ok) throw new Error('Failed to load simplified explanation');
  return res.json();
}

// Attempt APIs
export async function submitAttemptApi(params: {
  practiceSetId: string;
  questionId: string;
  response: string;
  timeSpentSeconds?: number;
}): Promise<AttemptRecord> {
  const res = await fetch(`${API_BASE}/api/attempts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed to submit attempt');
  return res.json();
}

export async function fetchAttemptsApi(): Promise<AttemptRecord[]> {
  const res = await fetch(`${API_BASE}/api/attempts`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch attempts');
  return res.json();
}

// Analytics API
export async function fetchAnalyticsApi(): Promise<AnalyticsOverview> {
  const res = await fetch(`${API_BASE}/api/progress`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

// Retention APIs
export async function triggerRetentionCleanupApi(): Promise<{ deletedCount: number; message: string }> {
  const res = await fetch(`${API_BASE}/api/retention/cleanup`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to trigger retention cleanup');
  return res.json();
}

export async function deleteAllUserDataApi(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/retention/account-data`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete account data');
  return res.json();
}
