import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  User,
  Shield,
  Clock,
  Trash2,
  Download,
  Moon,
  Sun,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { triggerRetentionCleanupApi, deleteAllUserDataApi, fetchDocumentsApi, fetchAttemptsApi } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [cleanupStatus, setCleanupStatus] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleRunCleanup = async () => {
    try {
      setCleaning(true);
      const res = await triggerRetentionCleanupApi();
      setCleanupStatus(res.message);
    } catch (err: any) {
      setCleanupStatus('Failed to trigger retention cleanup.');
    } finally {
      setCleaning(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const [docs, attempts] = await Promise.all([
        fetchDocumentsApi().catch(() => []),
        fetchAttemptsApi().catch(() => [])
      ]);
      const dataToExport = {
        exportedAt: new Date().toISOString(),
        user: currentUser,
        documents: docs,
        attempts: attempts
      };
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studypath_data_${currentUser?.uid || 'user'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export data.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    try {
      setDeleting(true);
      await deleteAllUserDataApi();
      await logout();
      navigate('/');
    } catch (err) {
      alert('Failed to delete account data.');
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800/80">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-400" />
          Account & Privacy Settings
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your profile, theme, data privacy, and 30-day retention policies.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            Student Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Display Name:</span>
              <p className="font-semibold text-white mt-0.5">{currentUser?.displayName || 'Student'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Email Address:</span>
              <p className="font-semibold text-white mt-0.5">{currentUser?.email || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              Appearance Theme
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Current theme: <span className="capitalize font-semibold text-slate-200">{theme}</span> mode
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>

        {/* 30-Day Retention Policy Card */}
        <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Automated 30-Day File Retention Policy
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            In compliance with academic privacy and data governance, all uploaded study files and derived parsed chunks are automatically scheduled for permanent erasure 30 days after upload.
          </p>

          {cleanupStatus && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{cleanupStatus}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleRunCleanup}
              disabled={cleaning}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cleaning ? 'animate-spin' : ''}`} />
              {cleaning ? 'Scanning & Purging...' : 'Run Scheduled Cleanup Check Now'}
            </button>
          </div>
        </div>

        {/* Data Export & Privacy */}
        <div className="p-6 rounded-2xl bg-[#0c1322] border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Data Export & Portability
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Download a portable JSON archive of your study material metadata, generated practice question history, and feedback evaluations.
          </p>

          <button
            onClick={handleExportData}
            disabled={exporting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Exporting Archive...' : 'Export My Study Data (.json)'}
          </button>
        </div>

        {/* Danger Zone: Account & Data Deletion */}
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              Danger Zone: Permanent Data Deletion
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Permanently erase all your uploaded documents, generated practice sets, attempts, and learning statistics. This action is irreversible.
            </p>
          </div>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete All Account Data
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e1628] rounded-2xl border border-rose-500/40 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              Confirm Permanent Erasure
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently erase all your uploaded documents, questions, attempts, and learning metrics?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllData}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                {deleting ? 'Erasing...' : 'Confirm Erase Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
