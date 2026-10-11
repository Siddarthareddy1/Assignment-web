import React from 'react';
import { BookOpen, ShieldAlert, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-[#070b14] text-slate-400 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-lg font-bold text-white">StudyPath</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              An AI-powered personalized study assistant helping students master concepts through original practice questions, step-by-step coaching, and deep performance insights.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/60 border border-slate-800 p-3 rounded-lg max-w-md">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                Academic Integrity: StudyPath generates original practice problems to reinforce understanding. It is not intended for assignment cloning or submitting work under false authorship.
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/dashboard" className="hover:text-indigo-400 transition-colors">Dashboard</Link></li>
              <li><Link to="/documents" className="hover:text-indigo-400 transition-colors">Document Library</Link></li>
              <li><Link to="/practice" className="hover:text-indigo-400 transition-colors">Practice Generator</Link></li>
              <li><Link to="/analytics" className="hover:text-indigo-400 transition-colors">Performance Analytics</Link></li>
            </ul>
          </div>

          {/* Compliance & Security */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Integrity & Policies</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/settings" className="hover:text-indigo-400 transition-colors">Privacy & Retention Policy</Link></li>
              <li><span className="text-slate-500">Automatic 30-Day Expiry</span></li>
              <li><span className="text-slate-500">Private Data Isolation</span></li>
              <li><a href="#faq" className="hover:text-indigo-400 transition-colors">Integrity FAQs</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} StudyPath AI. All rights reserved. Designed for mastery, not memorization.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built for academic excellence with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
