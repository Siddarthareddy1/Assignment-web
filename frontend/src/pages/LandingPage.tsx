import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Brain,
  FileCheck,
  CheckCircle2,
  Clock,
  ChevronDown,
  Layers,
  HelpCircle,
  Lightbulb,
  Zap,
  Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { currentUser, loginAsDemoStudent } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How does StudyPath guarantee academic integrity?",
      a: "StudyPath never duplicates or clones questions from your uploaded materials. Instead, our AI analyzes the underlying concepts, theorems, and structural difficulty to generate brand NEW practice scenarios with different variables, numbers, and problem statements."
    },
    {
      q: "What file types can I upload?",
      a: "We support PDF, DOCX, legacy DOC, PPTX, TXT, as well as scanned images (PNG, JPG, JPEG) up to 100 MB. Our multi-engine pipeline automatically extracts text, formulas, and tabular data."
    },
    {
      q: "Can the system handle large 200+ page textbooks?",
      a: "Yes! Large documents are partitioned into bounded chunks of 2–4 pages and processed asynchronously. If an individual page is unreadable, it is logged as a warning while the remaining document finishes cleanly."
    },
    {
      q: "How does the feedback coaching work?",
      a: "When you submit an attempt, the AI acts as a patient university tutor. It breaks down what you got right, what needs correction, what is missing, and provides targeted hints for improvement—rather than merely handing you a submission-ready answer."
    },
    {
      q: "What is the data retention policy?",
      a: "To protect student privacy and copyright, uploaded files are private by default and scheduled for automatic permanent deletion after 30 days. You can also delete your files or account data at any time."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Glow Background Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[350px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI-Powered Conceptual Learning for Students</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Master Concepts. <br />
            <span className="gradient-text-indigo-cyan">Don't Memorize Answers.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload your lecture notes, sample question papers, or study guides. StudyPath extracts core topics and generates original, personalized practice problems with step-by-step coaching.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {currentUser ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  Start Learning Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={loginAsDemoStudent}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Instant Demo Experience
                </button>
              </>
            )}
            <a
              href="#features"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Explore Features
            </a>
          </div>

          {/* Academic Integrity Guarantee Banner */}
          <div className="mt-12 max-w-xl mx-auto flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-900/40 border border-slate-800/80 py-2.5 px-4 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict Originality: Generates novel practice questions. No assignment copying.</span>
          </div>

          {/* Interactive Product Preview Card */}
          <div className="mt-16 max-w-5xl mx-auto rounded-2xl glass-panel p-2 sm:p-4 shadow-2xl shadow-indigo-950/40 border border-slate-800">
            <div className="bg-[#0b1120] rounded-xl border border-slate-800/80 p-4 sm:p-6 text-left">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 text-xs font-mono text-slate-400">StudyPath • Interactive Practice Session</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  Practice Material
                </span>
              </div>

              {/* Sample Problem Breakdown */}
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-cyan-400 bg-cyan-950/50 px-2.5 py-1 rounded border border-cyan-800/60">
                    Topic: Dynamic Programming & Recurrences
                  </span>
                  <span className="text-xs font-medium text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/60">
                    Difficulty: Medium
                  </span>
                </div>

                <p className="text-slate-200 font-medium text-sm sm:text-base leading-relaxed">
                  "Consider an algorithm with recurrence relation <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs">T(n) = 3T(n/2) + O(n)</code>. According to the Master Theorem, what is its asymptotic upper bound?"
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 text-slate-300 text-xs flex items-center justify-between hover:border-slate-700 transition-colors">
                    <span>A) O(n log n)</span>
                  </div>
                  <div className="p-3 rounded-lg border border-indigo-500/50 bg-indigo-950/20 text-indigo-200 text-xs flex items-center justify-between">
                    <span>B) O(n^{'{'}log_2 3{'}'})</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <div className="mt-4 p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="font-semibold text-white">AI Step-by-Step Coaching:</p>
                    <p className="text-slate-400">
                      Compute <code className="text-cyan-300 font-mono">log_2(3) ≈ 1.58</code>. Since <code className="text-cyan-300 font-mono">1.58 &gt; 1</code>, the recursive branching dominates the root cost, falling under Case 1 of the Master Theorem.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow Section */}
      <section className="py-20 bg-[#070b14] border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              How StudyPath Works
            </h2>
            <p className="mt-4 text-slate-400 text-base">
              A seamless, private 3-step learning cycle designed for comprehensive exam preparation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 relative group hover:border-indigo-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg mb-5 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Upload Study Materials</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Add lecture slides, past exams, or assignments (PDF, DOCX, PPTX). Our engine parses formulas, tables, and sections while keeping your files private.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 relative group hover:border-cyan-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-lg mb-5 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Generate Original Practice</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Choose topics, difficulty, and question formats. The AI synthesizes brand-new problems testing the exact underlying principles without duplicating questions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 relative group hover:border-purple-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg mb-5 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Receive Coaching & Track Growth</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Submit attempts and receive constructive feedback on what was right, what was missing, and how to improve. Monitor your streaks and weak areas in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Engineered for Deep Learning
            </h2>
            <p className="mt-4 text-slate-400 text-base">
              Every feature is built to help you understand principles instead of guessing answers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-3">
              <Brain className="w-8 h-8 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Original Problem Synthesis</h3>
              <p className="text-sm text-slate-400">
                Guaranteed originality safeguards ensure practice questions test concepts with fresh scenarios and numbers, never reproducing copyright materials.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-3">
              <Layers className="w-8 h-8 text-cyan-400" />
              <h3 className="text-base font-semibold text-white">Fault-Tolerant Parsing</h3>
              <p className="text-sm text-slate-400">
                Robust pipeline handles 200+ page documents incrementally. An unreadable page won't crash the processing job—it records a warning and keeps going.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-3">
              <Lightbulb className="w-8 h-8 text-amber-400" />
              <h3 className="text-base font-semibold text-white">Step-by-Step Explanations</h3>
              <p className="text-sm text-slate-400">
                Need help? Deconstruct questions step-by-step, request progressive hints, or toggle "Explain Simpler" for everyday real-world analogies.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-3">
              <FileCheck className="w-8 h-8 text-emerald-400" />
              <h3 className="text-base font-semibold text-white">Pedagogical Answer Feedback</h3>
              <p className="text-sm text-slate-400">
                Submissions are evaluated constructively: What you got right, What needs correction, What is missing, and targeted advice on how to improve.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-3">
              <Target className="w-8 h-8 text-rose-400" />
              <h3 className="text-base font-semibold text-white">Personalized Recommendations</h3>
              <p className="text-sm text-slate-400">
                Targeted practice sets generated automatically based on topics where your accuracy is lower or concepts you haven't practiced recently.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-3">
              <Clock className="w-8 h-8 text-purple-400" />
              <h3 className="text-base font-semibold text-white">Automatic 30-Day Expiry</h3>
              <p className="text-sm text-slate-400">
                Uploaded study materials are automatically purged after 30 days to protect your privacy and ensure clean storage hygiene.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-[#070b14] border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-indigo-400" />
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              Everything you need to know about StudyPath's features and academic standards.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-slate-200 font-medium hover:text-white transition-colors"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-indigo-400' : ''}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 sm:px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Accelerate Your Learning?
          </h2>
          <p className="mt-4 text-slate-400 text-base max-w-xl mx-auto">
            Upload your first study document today and generate personalized practice problems in minutes.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to={currentUser ? "/dashboard" : "/auth"}
              className="px-8 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
