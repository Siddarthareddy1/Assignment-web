import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  Sliders,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { fetchDocumentsApi, generatePracticeSetApi } from '../services/api';
import { DocumentRecord, DifficultyLevel, QuestionType } from '../types';

export const PracticeConfigPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Configuration Form State
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'multiple_choice',
    'short_answer'
  ]);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(20);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      setLoadingDocs(true);
      const docs = await fetchDocumentsApi();
      setDocuments(docs);
      if (docs.length > 0) {
        setSelectedDocId(docs[0].id);
        // Pre-select first 2 topics from first document if available
        if (docs[0].analysisSummary?.mainTopics) {
          setSelectedTopics(docs[0].analysisSummary.mainTopics.slice(0, 3));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDocChange = (docId: string) => {
    setSelectedDocId(docId);
    const doc = documents.find(d => d.id === docId);
    if (doc?.analysisSummary?.mainTopics) {
      setSelectedTopics(doc.analysisSummary.mainTopics.slice(0, 3));
    } else {
      setSelectedTopics([]);
    }
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const toggleType = (qType: QuestionType) => {
    setSelectedTypes(prev => {
      if (prev.includes(qType)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(t => t !== qType);
      }
      return [...prev, qType];
    });
  };

  const handleGenerate = async () => {
    if (!selectedDocId) {
      setError('Please select a source document.');
      return;
    }
    if (selectedTopics.length === 0) {
      setError('Please select at least one topic to practice.');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const practiceSet = await generatePracticeSetApi({
        documentId: selectedDocId,
        selectedTopics,
        difficulty,
        questionCount,
        questionTypes: selectedTypes,
        timeLimitMinutes: timeLimit
      });
      navigate(`/practice/session/${practiceSet.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate practice set. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const currentDoc = documents.find(d => d.id === selectedDocId);
  const availableTopics = currentDoc?.analysisSummary?.mainTopics || [
    'Core Foundational Concepts',
    'Algorithmic Problem Solving',
    'Theorem Application',
    'Edge Case Analysis'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          AI Practice Generator
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Create Personalized Practice Set
        </h1>
        <p className="text-sm text-slate-400">
          Formulate original problem scenarios inspired by your study materials without cloning original assignments.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="p-6 sm:p-8 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-8 shadow-xl">
        {/* Step 1: Select Source Document */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            1. Source Study Material
          </label>
          {loadingDocs ? (
            <div className="h-10 bg-slate-900 rounded-xl animate-pulse" />
          ) : documents.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              No documents found. Please upload a study material first from the Document Library.
            </div>
          ) : (
            <select
              value={selectedDocId}
              onChange={(e) => handleDocChange(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.originalName} ({d.analysisSummary?.subject || 'Analyzing'})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step 2: Topics Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              2. Select Topics to Practice
            </label>
            <span className="text-xs text-slate-500">{selectedTopics.length} selected</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availableTopics.map((top, idx) => {
              const isChecked = selectedTopics.includes(top);
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => toggleTopic(top)}
                  className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all ${
                    isChecked
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="truncate pr-2">{top}</span>
                  {isChecked && <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Difficulty Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            3. Target Difficulty Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`py-3 px-4 rounded-xl border text-xs font-bold capitalize transition-all ${
                  difficulty === level
                    ? level === 'easy'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : level === 'medium'
                      ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                      : 'bg-rose-950/40 border-rose-500 text-rose-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Question Types */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            4. Question Types
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { type: 'multiple_choice' as QuestionType, label: 'Multiple Choice' },
              { type: 'short_answer' as QuestionType, label: 'Short Answer' },
              { type: 'coding' as QuestionType, label: 'Coding / Algorithmic' },
              { type: 'numerical' as QuestionType, label: 'Numerical Problems' }
            ].map(({ type, label }) => {
              const active = selectedTypes.includes(type);
              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`p-3 rounded-xl border text-xs font-medium text-center transition-all ${
                    active
                      ? 'bg-indigo-950/50 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 5: Question Count & Optional Timer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Question Count: <span className="text-cyan-400">{questionCount}</span>
            </label>
            <input
              type="range"
              min="2"
              max="15"
              step="1"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-900"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>2 Quick</span>
              <span>5 Standard</span>
              <span>15 Thorough</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Practice Time Limit
            </label>
            <select
              value={timeLimit || ''}
              onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">No Time Limit (Self-Paced)</option>
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="45">45 Minutes</option>
              <option value="60">60 Minutes</option>
            </select>
          </div>
        </div>

        {/* Watermark and Originality Guarantee */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            Every practice set includes an educational watermark and uses freshly formulated scenarios to support genuine problem-solving.
          </span>
        </div>

        {/* Submit Generator Button */}
        <button
          type="button"
          disabled={generating || documents.length === 0}
          onClick={handleGenerate}
          className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 hover:opacity-95 text-white shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Synthesizing Original Practice Problems...
            </>
          ) : (
            <>
              Generate Practice Set
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
