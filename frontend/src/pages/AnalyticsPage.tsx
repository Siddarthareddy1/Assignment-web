import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
  Target,
  Brain
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { fetchAnalyticsApi } from '../services/api';
import { AnalyticsOverview } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await fetchAnalyticsApi();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-pulse space-y-8">
        <div className="h-10 bg-slate-800 rounded-xl w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-80 bg-slate-800/40 rounded-2xl" />
          <div className="h-80 bg-slate-800/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  const accuracyData = analytics?.accuracyOverTime || [];
  const topicData = analytics?.topicPerformance || [];
  const strongTopics = analytics?.strongTopics || [];
  const weakTopics = analytics?.weakTopics || [];
  const recommendations = analytics?.recommendations || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-400" />
            Performance & Progress Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real metrics calculated from your actual practice attempts and answer evaluations.
          </p>
        </div>

        <Link
          to="/practice"
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 inline-flex items-center gap-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          Practice Weak Areas
        </Link>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-[#0c1322] border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Questions Attempted</p>
            <p className="text-2xl font-bold text-white mt-0.5">{analytics?.totalQuestionsPracticed || 0}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c1322] border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overall Accuracy</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {(analytics?.totalQuestionsPracticed || 0) > 0 ? `${analytics?.overallAccuracy}%` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c1322] border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Study Streak</p>
            <p className="text-2xl font-bold text-white mt-0.5">{analytics?.learningStreakDays || 0} Days</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Accuracy Over Time */}
        <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Accuracy Progression Over Time
            </h3>
            <span className="text-xs text-slate-500">Chronological</span>
          </div>

          <div className="h-64 w-full">
            {accuracyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Complete practice attempts to generate the accuracy curve.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accuracyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="accuracy" stroke="#818CF8" strokeWidth={2} fillOpacity={1} fill="url(#accuracyGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Topic-wise Performance */}
        <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Topic-Wise Accuracy (%)
            </h3>
            <span className="text-xs text-slate-500">Target: ≥ 70%</span>
          </div>

          <div className="h-64 w-full">
            {topicData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No topic data yet. Try a practice set!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="topic" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.slice(0, 12)} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                    {topicData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.accuracy >= 75 ? '#10B981' : entry.accuracy >= 60 ? '#F59E0B' : '#EF4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Strong vs Weak Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Topics */}
        <div className="p-6 rounded-2xl bg-[#0c1322] border border-emerald-500/20 space-y-3">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Mastered Topics (≥ 80% Accuracy)
          </h3>
          {strongTopics.length > 0 ? (
            <div className="space-y-2">
              {strongTopics.map((st, i) => (
                <div key={i} className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200">
                  {st}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Continue practicing to earn topic mastery badges!
            </p>
          )}
        </div>

        {/* Weak Topics */}
        <div className="p-6 rounded-2xl bg-[#0c1322] border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Needs Attention (&lt; 65% Accuracy)
          </h3>
          {weakTopics.length > 0 ? (
            <div className="space-y-2">
              {weakTopics.map((wt, i) => (
                <div key={i} className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200 flex items-center justify-between">
                  <span>{wt}</span>
                  <Link to="/practice" className="font-semibold underline text-amber-300">
                    Practice Now
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Great progress! No critical weakness flags detected.
            </p>
          )}
        </div>
      </div>

      {/* Real Recommendations */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0c1322] to-[#121c33] border border-indigo-500/30 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <Brain className="w-4 h-4" />
          Personalized Curriculum Recommendations
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-white text-sm">{rec.topic}</span>
              <p className="text-slate-300">{rec.reason}</p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Difficulty: {rec.difficulty}</span>
                <Link to="/practice" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                  Start Practice
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
