import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Clock,
  Flag,
  RotateCw,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Award,
  Send,
  Code,
  FileText,
  X
} from 'lucide-react';
import {
  getPracticeSetApi,
  submitAttemptApi,
  regenerateQuestionApi,
  getSolutionApi,
  getHintApi,
  getSimplifiedExplanationApi
} from '../services/api';
import {
  PracticeSetRecord,
  QuestionItem,
  SolutionExplanation,
  HintResponse,
  SimplifyResponse,
  AttemptRecord
} from '../types';

export const PracticeSessionPage: React.FC = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();

  const [practiceSet, setPracticeSet] = useState<PracticeSetRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student Responses
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [submittedAttempts, setSubmittedAttempts] = useState<Record<string, AttemptRecord>>({});

  // Submitting state
  const [submittingCurrent, setSubmittingCurrent] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Modals
  const [activeSolution, setActiveSolution] = useState<SolutionExplanation | null>(null);
  const [activeHint, setActiveHint] = useState<HintResponse | null>(null);
  const [activeSimplify, setActiveSimplify] = useState<SimplifyResponse | null>(null);
  const [loadingHelper, setLoadingHelper] = useState(false);

  // Practice Set Completion
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (setId) {
      loadPracticeSet(setId);
    }
  }, [setId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev > 1) return prev - 1;
        clearInterval(timer);
        return 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const loadPracticeSet = async (id: string) => {
    try {
      setLoading(true);
      const data = await getPracticeSetApi(id);
      setPracticeSet(data);
      if (data.timeLimitMinutes) {
        setTimeLeft(data.timeLimitMinutes * 60);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !practiceSet) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading your practice session...</p>
      </div>
    );
  }

  const currentQ = practiceSet.questions[currentIndex];
  const currentResponse = responses[currentQ.id] || '';
  const currentAttempt = submittedAttempts[currentQ.id];
  const isMarked = markedForReview[currentQ.id] || false;

  const handleResponseChange = (val: string) => {
    setResponses(prev => ({ ...prev, [currentQ.id]: val }));
  };

  const toggleMarkForReview = () => {
    setMarkedForReview(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const handleRegenerateQuestion = async () => {
    if (!window.confirm('Regenerate this question with a new scenario?')) return;
    try {
      setRegenerating(true);
      const newQ = await regenerateQuestionApi(practiceSet.id, currentQ.id);
      const updatedQuestions = [...practiceSet.questions];
      updatedQuestions[currentIndex] = newQ;
      setPracticeSet({ ...practiceSet, questions: updatedQuestions });
      // Clear response for regenerated question
      setResponses(prev => {
        const copy = { ...prev };
        delete copy[currentQ.id];
        return copy;
      });
    } catch (err) {
      alert('Failed to regenerate question.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!currentResponse.trim()) {
      alert('Please enter or select your answer before submitting.');
      return;
    }
    try {
      setSubmittingCurrent(true);
      const attempt = await submitAttemptApi({
        practiceSetId: practiceSet.id,
        questionId: currentQ.id,
        response: currentResponse
      });
      setSubmittedAttempts(prev => ({ ...prev, [currentQ.id]: attempt }));

      // Check if all questions are now answered
      const allAnswered = practiceSet.questions.every(
        q => q.id === currentQ.id || submittedAttempts[q.id]
      );
      if (allAnswered) {
        setIsCompleted(true);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      alert('Failed to submit attempt.');
    } finally {
      setSubmittingCurrent(false);
    }
  };

  const handleShowSolution = async () => {
    try {
      setLoadingHelper(true);
      const sol = await getSolutionApi(currentQ.id, currentQ);
      setActiveSolution(sol);
    } catch (err) {
      alert('Failed to load step-by-step solution.');
    } finally {
      setLoadingHelper(false);
    }
  };

  const handleShowHint = async () => {
    try {
      setLoadingHelper(true);
      const h = await getHintApi(currentQ.id, currentQ);
      setActiveHint(h);
    } catch (err) {
      alert('Failed to load hint.');
    } finally {
      setLoadingHelper(false);
    }
  };

  const handleShowSimplify = async () => {
    try {
      setLoadingHelper(true);
      const s = await getSimplifiedExplanationApi(currentQ.id, currentQ);
      setActiveSimplify(s);
    } catch (err) {
      alert('Failed to load simplified explanation.');
    } finally {
      setLoadingHelper(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Top Session Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c1322] border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            {practiceSet.title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Question {currentIndex + 1} of {practiceSet.questions.length} • Difficulty: {currentQ.difficulty}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {timeLeft !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-semibold text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          )}

          <button
            onClick={toggleMarkForReview}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isMarked
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            {isMarked ? 'Marked for Review' : 'Mark for Review'}
          </button>
        </div>
      </div>

      {/* Question Navigator Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {practiceSet.questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const hasAttempt = submittedAttempts[q.id];
          const hasAnswer = responses[q.id] && responses[q.id].trim();
          const flagged = markedForReview[q.id];

          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center relative flex-shrink-0 ${
                isCurrent
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400'
                  : hasAttempt
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : hasAnswer
                  ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {idx + 1}
              {flagged && (
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Question Card with Educational Watermark */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-6 shadow-xl relative practice-watermark">
        {/* Question Topic & Type */}
        <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800/80">
          <span className="font-semibold text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-800/60">
            {currentQ.topic}
          </span>
          <span className="text-slate-400 capitalize font-mono">
            {currentQ.type.replace('_', ' ')}
          </span>
        </div>

        {/* Question Statement */}
        <div className="text-base sm:text-lg font-medium text-white leading-relaxed whitespace-pre-wrap">
          {currentQ.questionText}
        </div>

        {/* Answer Input depending on Question Type */}
        <div className="pt-2">
          {currentQ.type === 'multiple_choice' && currentQ.options ? (
            <div className="space-y-3">
              {currentQ.options.map((opt, oIdx) => {
                const optLetter = opt.charAt(0);
                const isSelected = currentResponse.startsWith(optLetter);
                return (
                  <button
                    key={oIdx}
                    type="button"
                    disabled={Boolean(currentAttempt)}
                    onClick={() => handleResponseChange(opt)}
                    className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500 text-indigo-100 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : currentQ.type === 'coding' ? (
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                Write or paste your code implementation below:
              </label>
              <textarea
                disabled={Boolean(currentAttempt)}
                rows={8}
                value={currentResponse}
                onChange={(e) => handleResponseChange(e.target.value)}
                placeholder="def solve(n):\n    # Write your logic here..."
                className="w-full p-4 bg-slate-950 font-mono text-xs text-indigo-200 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          ) : currentQ.type === 'numerical' ? (
            <div className="space-y-2 max-w-sm">
              <label className="text-xs font-medium text-slate-400">Your Calculated Numerical Value:</label>
              <input
                type="text"
                disabled={Boolean(currentAttempt)}
                value={currentResponse}
                onChange={(e) => handleResponseChange(e.target.value)}
                placeholder="e.g. 42 or O(n log n)"
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Your Explanatory Response:</label>
              <textarea
                disabled={Boolean(currentAttempt)}
                rows={5}
                value={currentResponse}
                onChange={(e) => handleResponseChange(e.target.value)}
                placeholder="State your reasoning, governing equations, and derivation..."
                className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Submit or Coaching Feedback Card */}
        {currentAttempt ? (
          /* Real Coaching Feedback Display */
          <div className="mt-6 p-5 rounded-xl bg-slate-900/90 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-white">AI Coach Feedback</span>
              </div>
              {currentAttempt.score !== undefined && (
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  Score: {currentAttempt.score} / 10
                </span>
              )}
            </div>

            {/* What you got right */}
            {currentAttempt.feedback.whatYouGotRight?.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  What you got right:
                </p>
                <ul className="list-disc list-inside text-slate-300 pl-2 space-y-0.5">
                  {currentAttempt.feedback.whatYouGotRight.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* What needs correction */}
            {currentAttempt.feedback.whatNeedsCorrection?.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <p className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  What needs correction:
                </p>
                <ul className="list-disc list-inside text-slate-300 pl-2 space-y-0.5">
                  {currentAttempt.feedback.whatNeedsCorrection.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* How to improve */}
            {currentAttempt.feedback.howToImprove?.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <p className="font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                  How to improve:
                </p>
                <ul className="list-disc list-inside text-slate-300 pl-2 space-y-0.5">
                  {currentAttempt.feedback.howToImprove.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}

            {currentAttempt.feedback.coachNotes && (
              <p className="text-xs text-slate-400 italic pt-1">
                "{currentAttempt.feedback.coachNotes}"
              </p>
            )}
          </div>
        ) : (
          <div className="pt-2">
            <button
              type="button"
              disabled={submittingCurrent || !currentResponse.trim()}
              onClick={handleSubmitAttempt}
              className="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 text-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submittingCurrent ? 'Evaluating...' : 'Submit Attempt'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Learning Assistance Bar: Explanations, Hints, Regenerate */}
        <div className="pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleShowHint}
              disabled={loadingHelper}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Give Me a Hint First
            </button>
            <button
              onClick={handleShowSolution}
              disabled={loadingHelper}
              className="px-3 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 flex items-center gap-1.5 transition-colors font-medium"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              Show Step-by-Step Solution
            </button>
            <button
              onClick={handleShowSimplify}
              disabled={loadingHelper}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
              Explain Simpler
            </button>
          </div>

          <button
            onClick={handleRegenerateQuestion}
            disabled={regenerating}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerate This Question
          </button>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 disabled:opacity-40 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous Question
        </button>

        <span className="text-xs text-slate-500">
          {currentIndex + 1} of {practiceSet.questions.length}
        </span>

        <button
          disabled={currentIndex === practiceSet.questions.length - 1}
          onClick={() => setCurrentIndex(prev => Math.min(practiceSet.questions.length - 1, prev + 1))}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 disabled:opacity-40 transition-colors"
        >
          Next Question
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Step-by-Step Solution Modal */}
      {activeSolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1120] rounded-2xl border border-slate-800 max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setActiveSolution(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Step-by-Step Solution Breakdown
            </h3>

            {/* Question Objective */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
              <span className="font-semibold text-cyan-400">What the question is asking:</span>
              <p className="text-slate-300">{activeSolution.whatQuestionIsAsking}</p>
            </div>

            {/* Relevant Concept & Principle */}
            <div className="text-xs text-slate-300 space-y-2">
              <p>
                <span className="font-semibold text-slate-200">Relevant Concept:</span> {activeSolution.relevantConcept}
              </p>
              {activeSolution.formulaOrPrinciple && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300">
                  {activeSolution.formulaOrPrinciple}
                </div>
              )}
            </div>

            {/* Solution Steps */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Solution Steps</h4>
              {activeSolution.steps.map((step) => (
                <div key={step.stepNumber} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">
                      {step.stepNumber}
                    </span>
                    <span>{step.title}</span>
                  </div>
                  <p className="text-slate-300 pl-7 leading-relaxed">{step.explanation}</p>
                  <p className="text-slate-400 pl-7 italic text-[11px]">
                    Why necessary: {step.whyNecessary}
                  </p>
                </div>
              ))}
            </div>

            {/* Final Answer */}
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
              <span className="font-bold text-emerald-400">Final Conclusion:</span>
              <p className="font-medium">{activeSolution.finalAnswer}</p>
            </div>

            {/* Common Mistakes */}
            {activeSolution.commonMistakes && activeSolution.commonMistakes.length > 0 && (
              <div className="text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-amber-400">Common Mistakes to Avoid:</span>
                <ul className="list-disc list-inside text-slate-300 pl-2">
                  {activeSolution.commonMistakes.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hint Modal */}
      {activeHint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1120] rounded-2xl border border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button onClick={() => setActiveHint(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Guiding Hint
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              {activeHint.hintText}
            </p>
            <p className="text-xs text-cyan-300 font-medium">
              💡 Guiding question: {activeHint.guidingQuestion}
            </p>
          </div>
        </div>
      )}

      {/* Simplify Modal */}
      {activeSimplify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1120] rounded-2xl border border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button onClick={() => setActiveSimplify(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              Simplified Intuition
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <p className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
                {activeSimplify.simplifiedExplanation}
              </p>
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-200">
                <span className="font-bold text-purple-300">Real-World Analogy:</span>
                <p className="mt-1">{activeSimplify.realWorldAnalogy}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
