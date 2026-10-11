import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Search,
  Filter,
  Trash2,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronRight,
  Info,
  Sparkles,
  Layers,
  BookOpen,
  X
} from 'lucide-react';
import {
  fetchDocumentsApi,
  uploadDocumentApi,
  deleteDocumentApi,
  retryDocumentApi,
  getDocumentAnalysisApi
} from '../services/api';
import { DocumentRecord, DocumentAnalysis } from '../types';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [integrityAcknowledged, setIntegrityAcknowledged] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Document Details Drawer State
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Polling active documents interval
  useEffect(() => {
    loadDocuments();
    const interval = setInterval(() => {
      // If any document is still in processing state, re-fetch
      setDocuments(prev => {
        const hasActive = prev.some(d => d.status === 'queued' || d.status === 'parsing' || d.status === 'analyzing');
        if (hasActive) {
          fetchDocumentsApi().then(setDocuments).catch(() => {});
        }
        return prev;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await fetchDocumentsApi();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setUploadError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'docx', 'doc', 'pptx', 'txt', 'jpg', 'jpeg', 'png'];
    if (!ext || !allowed.includes(ext)) {
      setUploadError(`File type .${ext} is not supported. Please upload PDF, DOCX, DOC, PPTX, TXT, or images.`);
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('File exceeds maximum size of 100 MB.');
      return;
    }
    setSelectedFile(file);
    setIsUploadModalOpen(true);
  };

  const handleExecuteUpload = async () => {
    if (!selectedFile) return;
    if (!integrityAcknowledged) {
      setUploadError('You must check the academic integrity acknowledgment before uploading.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      const createdDoc = await uploadDocumentApi(selectedFile, integrityAcknowledged);
      setDocuments(prev => [createdDoc, ...prev]);
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setIntegrityAcknowledged(false);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document and all its practice chunks?')) return;
    try {
      await deleteDocumentApi(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  const handleRetry = async (docId: string) => {
    try {
      const updated = await retryDocumentApi(docId);
      setDocuments(prev => prev.map(d => d.id === docId ? updated : d));
    } catch (err) {
      alert('Failed to trigger retry.');
    }
  };

  const handleViewDetails = (doc: DocumentRecord) => {
    setSelectedDoc(doc);
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.analysisSummary?.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Study Document Library
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Upload, inspect, and manage study materials (PDF, DOCX, PPTX, TXT, OCR images).
          </p>
        </div>
        <div>
          <label className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 inline-flex items-center gap-2 transition-all">
            <Upload className="w-4 h-4" />
            Upload Document
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.pptx,.txt,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500/60 bg-[#0c1324]/50 transition-colors text-center group cursor-pointer"
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.pdf,.docx,.doc,.pptx,.txt,.jpg,.jpeg,.png';
          input.onchange = (e: any) => {
            if (e.target.files && e.target.files[0]) handleFileSelected(e.target.files[0]);
          };
          input.click();
        }}
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
          <Upload className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-200">
          Drag and drop study files here, or <span className="text-indigo-400 underline">browse</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Supports PDF, DOCX, DOC, PPTX, TXT, JPG, PNG (up to 100 MB). Private by default.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents or topics..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="ready">Ready</option>
            <option value="parsing">Parsing</option>
            <option value="analyzing">Analyzing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Document Cards / Table */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-[#090f1d] border border-slate-800 text-slate-400 space-y-2">
          <BookOpen className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium">No documents match the current filter.</p>
          <p className="text-xs text-slate-500">Upload a learning file above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-[#0c1322] border border-slate-800/90 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/90 flex items-center justify-center flex-shrink-0 uppercase font-mono font-bold text-xs text-indigo-400">
                    {doc.fileType}
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize flex items-center gap-1 ${
                      doc.status === 'ready'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : doc.status === 'failed'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                    }`}
                  >
                    {doc.status === 'ready' && <CheckCircle2 className="w-3 h-3" />}
                    {doc.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                    {doc.status !== 'ready' && doc.status !== 'failed' && <RotateCw className="w-3 h-3 animate-spin" />}
                    {doc.status}
                  </span>
                </div>

                <h3 className="font-semibold text-white text-sm sm:text-base mt-3 line-clamp-1" title={doc.originalName}>
                  {doc.originalName}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {doc.pageCount > 0 ? `${doc.pageCount} pages` : 'Analyzing'}
                </p>

                {/* Subject and Topics Preview */}
                {doc.analysisSummary ? (
                  <div className="mt-3 text-xs text-slate-300 space-y-1">
                    <p className="font-semibold text-cyan-400">{doc.analysisSummary.subject}</p>
                    <p className="text-slate-400 line-clamp-1">
                      {doc.analysisSummary.mainTopics.slice(0, 3).join(', ')}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-500 italic">
                    {doc.status === 'failed' ? 'Processing encountered errors' : 'Processing document pipeline...'}
                  </div>
                )}

                {/* Page Warning Badge */}
                {doc.warnings && doc.warnings.length > 0 && (
                  <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                    <span className="truncate">{doc.warnings[0]}</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleViewDetails(doc)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  Details & Topics
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1.5">
                  {doc.status === 'failed' && (
                    <button
                      onClick={() => handleRetry(doc.id)}
                      title="Retry processing"
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    title="Delete document"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload & Academic Integrity Modal */}
      {isUploadModalOpen && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e1628] rounded-2xl border border-slate-800 max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setIsUploadModalOpen(false);
                setSelectedFile(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              Upload Learning Material
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <p className="font-semibold text-white">{selectedFile.name}</p>
              <p className="text-slate-400 mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>

            {/* Academic Integrity Mandate Notice */}
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Academic Integrity Statement
              </div>
              <p className="text-slate-300 leading-relaxed italic">
                "Use only materials you have permission to use. This tool is for learning and practice, not for submitting work you did not do."
              </p>
              <label className="flex items-start gap-2 pt-2 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={integrityAcknowledged}
                  onChange={(e) => setIntegrityAcknowledged(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>I confirm that I have permission to use this material for personal study and practice.</span>
              </label>
            </div>

            {uploadError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploading || !integrityAcknowledged}
                onClick={handleExecuteUpload}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md disabled:opacity-50 transition-all"
              >
                {uploading ? 'Processing & Enqueuing...' : 'Confirm & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Details Drawer */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1120] border-l border-slate-800 w-full max-w-xl h-full p-6 overflow-y-auto space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                {selectedDoc.fileType}
              </span>
              <h2 className="text-xl font-bold text-white mt-2">{selectedDoc.originalName}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Size: {(selectedDoc.fileSize / 1024 / 1024).toFixed(2)} MB • Pages: {selectedDoc.pageCount || 'Computed in background'}
              </p>
            </div>

            {/* AI Analysis Section */}
            {selectedDoc.analysisSummary ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Subject & Scope</h4>
                  <p className="text-sm font-semibold text-white">{selectedDoc.analysisSummary.subject}</p>
                  <p className="text-xs text-slate-400">{selectedDoc.analysisSummary.summaryText}</p>
                </div>

                {/* Main Topics */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Identified Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDoc.analysisSummary.mainTopics.map((top, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                      >
                        {top}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Subtopics */}
                {selectedDoc.analysisSummary.subtopics && selectedDoc.analysisSummary.subtopics.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Subtopics & Sections</h4>
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                      {selectedDoc.analysisSummary.subtopics.map((sub, idx) => (
                        <li key={idx}>{sub}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Formulas & Core Principles */}
                {selectedDoc.analysisSummary.commonFormulas && selectedDoc.analysisSummary.commonFormulas.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Common Formulas & Theorems</h4>
                    <div className="space-y-2">
                      {selectedDoc.analysisSummary.commonFormulas.map((f, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300">
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learning Objectives */}
                {selectedDoc.analysisSummary.learningObjectives && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Learning Objectives</h4>
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                      {selectedDoc.analysisSummary.learningObjectives.map((obj, idx) => (
                        <li key={idx}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Page Warnings */}
                {selectedDoc.warnings && selectedDoc.warnings.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      Parsing Notices ({selectedDoc.warnings.length})
                    </h4>
                    <div className="space-y-1 text-xs text-slate-300">
                      {selectedDoc.warnings.map((w, idx) => (
                        <p key={idx}>• {w}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs space-y-2">
                <RotateCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                <p>Analysis in progress. Checking document structure and question patterns...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
