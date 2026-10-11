import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Award,
  Flame,
  ArrowRight,
  Upload,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Brain,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchDocumentsApi,
  fetchPracticeSetsApi,
  fetchAnalyticsApi
} from '../services/api';
import {
  DocumentRecord,
  PracticeSetRecord,
  AnalyticsOverview
} from '../types';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [practiceSets, setPracticeSets] = useState<PracticeSetRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [docsData, setsData, analyticsData] = await Promise.all([
          fetchDocumentsApi().catch(() => []),
          fetchPracticeSetsApi().catch(() => []),
          fetchAnalyticsApi().catch(() => null)
        ]);
        setDocuments(docsData);
        setPracticeSets(setsData);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const totalDocs = analytics?.totalDocuments ?? documents.length;
  const totalQuestions = analytics?.totalQuestionsPracticed ?? 0;
  const accuracy = analytics?.overallAccuracy ?? 0;
  const streak = analytics?.learningStreakDays ?? 0;
  const weakTopics = analytics?.weakTopics ?? [];
  const recommendations = analytics?.recommendations ?? [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-pulse space-y-8">
        <div className="h-10 bg-slate-800/60 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-800/40 rounded-2xl border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-72 bg-slate-800/30 rounded-2xl border border-slate-800" />
          <div className="h-72 bg-slate-800/30 rounded-2xl border border-slate-800" />
        </div>
      </div>
    );
  }

  // Brand New User Empty State
  const isBrandNewAccount = documents.length === 0 && practiceSets.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {currentUser?.displayName || 'Student'}!
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track your performance, review recent documents, and practice original problems.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/documents"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload Material
          </Link>
          <Link
            to="/practice"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            New Practice Set
          </Link>
        </div>
      </div>

      {/* Metrics Row (Actual Data Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-[#0e1628] border border-slate-800/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Study Documents</p>
            <p className="text-2xl font-bold text-white mt-0.5">{totalDocs}</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-[#0e1628] border border-slate-800/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Questions Practiced</p>
            <p className="text-2xl font-bold text-white mt-0.5">{totalQuestions}</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-[#0e1628] border border-slate-800/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overall Accuracy</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {totalQuestions > 0 ? `${accuracy}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-[#0e1628] border border-slate-800/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Flame className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Learning Streak</p>
            <p className="text-2xl font-bold text-white mt-0.5">{streak} Days</p>
          </div>
        </div>
      </div>

      {isBrandNewAccount ? (
        /* Empty State for New Students */
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-[#090f1d] max-w-2xl mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Your study library is empty</h3>
            <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
              Upload your first lecture notes, syllabus guide, or sample questions (PDF, DOCX, PPTX). StudyPath will analyze the content and build personalized practice sets.
            </p>
          </div>
          <Link
            to="/documents"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all text-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Your First Document
          </Link>
        </div>
      ) : (
        /* Real Dashboard Content */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Recent Materials & Practice Sets */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Uploaded Materials */}
            <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Recent Study Materials
                </h3>
                <Link to="/documents" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                  View all ({documents.length})
                </Link>
              </div>

              <div className="space-y-3">
                {documents.slice(0, 4).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 uppercase text-xs font-mono font-semibold text-slate-300">
                        {doc.fileType}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate max-w-xs sm:max-w-md">
                          {doc.originalName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {doc.pageCount > 0 ? `${doc.pageCount} pages • ` : ''}
                          {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${
                          doc.status === 'ready'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : doc.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Practice Sessions */}
            <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Recent Practice Sessions
                </h3>
                <Link to="/practice" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                  Create new set
                </Link>
              </div>

              {practiceSets.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-400">
                  No practice sets generated yet. Select a document to start!
                </div>
              ) : (
                <div className="space-y-3">
                  {practiceSets.slice(0, 4).map((ps) => (
                    <div
                      key={ps.id}
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{ps.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {ps.questions.length} questions • Topics: {ps.selectedTopics.slice(0, 2).join(', ')}
                        </p>
                      </div>
                      <Link
                        to={`/practice/session/${ps.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 transition-colors"
                      >
                        Practice
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Recommendations & Weak Topics */}
          <div className="space-y-8">
            {/* Recommended Next Practice */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c1322] to-[#11192e] border border-indigo-500/30 shadow-lg">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Brain className="w-4 h-4" />
                Personalized Recommendation
              </div>

              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-base font-bold text-white">
                    {recommendations[0].topic}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {recommendations[0].reason}
                  </p>
                  <p className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Target action:</span> {recommendations[0].suggestedAction}
                  </p>
                  <Link
                    to="/practice"
                    className="mt-3 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Start Targeted Practice
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Complete questions in your practice sets to generate intelligent recommendations.
                </p>
              )}
            </div>

            {/* Weak Topics Callout */}
            <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Attention Topics
              </h3>
              {weakTopics.length > 0 ? (
                <div className="space-y-2.5">
                  {weakTopics.map((wt, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs flex items-center justify-between"
                    >
                      <span className="font-medium text-amber-200">{wt}</span>
                      <Link
                        to="/practice"
                        className="text-amber-400 hover:underline font-semibold"
                      >
                        Reinforce
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  No weak topics flagged yet. All attempted areas maintain satisfactory accuracy!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
