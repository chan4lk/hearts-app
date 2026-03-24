'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsUpload, BsX, BsFileEarmarkExcel, BsCheckCircle, BsExclamationTriangle, BsDownload } from 'react-icons/bs';
import * as XLSX from 'xlsx';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface SkippedUserData {
  rowNumber: number;
  reason: string;
  excelData: Record<string, any>;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  skippedUsers: SkippedUserData[];
  importedUsers?: Array<{
    rowNumber: number;
    firstName: string;
    systemUserName: string;
    status: string;
  }>;
  errors?: string[];
  message?: string;
  reportData?: string;
}

// Separate component for Skipped Users Modal
function SkippedUsersModal({ 
  isOpen, 
  onClose, 
  skippedUsers,
  onDownload
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  skippedUsers: SkippedUserData[];
  onDownload: () => void;
}) {
  return null; // Component removed - all content now in main modal
}

export default function ImportExcelModal({ isOpen, onClose, onImportComplete }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
        alert('Please select a valid Excel file (.xlsx, .xls) or CSV file');
        return;
      }
      
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/review-cycles/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const result: ImportResult = await response.json();

      if (!response.ok) {
        throw new Error(result.errors?.join(', ') || 'Import failed');
      }

      setImportResult(result);
      
      // Refresh the review cycles list if import was successful
      if (result.success && result.imported > 0) {
        onImportComplete();
      }
    } catch (error) { // handled silently
      setImportResult({
        success: false,
        imported: 0,
        skipped: 0,
        skippedUsers: [],
        errors: [error instanceof Error ? error.message : 'Failed to import file']
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = droppedFile.name.substring(droppedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (validExtensions.includes(fileExtension)) {
        setFile(droppedFile);
        setImportResult(null);
      } else {
        alert('Please select a valid Excel file (.xlsx, .xls) or CSV file');
      }
    }
  };

  const downloadImportReport = () => {
    if (!importResult || !importResult.reportData) {
      alert('No report data available');
      return;
    }

    // Decode base64 CSV
    const csvData = Buffer.from(importResult.reportData, 'base64').toString('utf-8');
    
    // Create blob and download
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `import-report-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 modal-overlay backdrop-blur-sm flex items-center justify-center z-[60]"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-elevated border border-theme rounded-2xl shadow-theme-lg w-full max-w-lg flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 6rem)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b-2 border-[rgba(var(--color-event-social),0.3)] bg-event-social">
              <div className="flex items-center gap-2">
                <BsFileEarmarkExcel className="w-5 h-5 text-cat-personal flex-shrink-0" />
                <h2 className="text-base font-bold text-primary">Import Review Cycles</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-secondary hover:text-primary transition-colors flex-shrink-0"
              >
                <BsX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {!importResult ? (
                <div className="space-y-3">
                  <p className="text-xs text-secondary">
                    Upload Excel (.xlsx) or CSV file with review cycle data
                  </p>

                  {/* File Upload Area - Compact */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      file
                        ? 'border-teal-500 bg-cat-personal'
                        : 'border-theme hover:border-theme'
                    }`}
                  >
                    {file ? (
                      <div className="space-y-1">
                        <BsFileEarmarkExcel className="w-8 h-8 text-cat-personal mx-auto" />
                        <p className="text-primary font-medium text-xs">{file.name}</p>
                        <p className="text-secondary text-xs">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                        <button
                          onClick={() => {
                            setFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="text-xs text-error hover:text-error mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <BsUpload className="w-8 h-8 text-secondary mx-auto" />
                        <p className="text-primary text-xs font-medium">Drop file or browse</p>
                        <label className="inline-flex items-center gap-1 px-2 py-1 bg-[rgb(var(--color-event-social))] hover:bg-[rgb(var(--color-event-social))] text-[rgb(var(--color-text-inverse))] rounded text-xs cursor-pointer transition-colors">
                          <BsUpload className="w-3 h-3" />
                          <span>Browse</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Result Card - Compact */}
                  <div
                    className={`p-3 rounded-lg border ${
                      importResult.success
                        ? 'bg-[rgb(var(--color-cat-training))]/15 border-green-500/40'
                        : importResult.imported > 0 
                          ? 'bg-[rgb(var(--color-info))]/15 border-blue-500/40' 
                          : 'bg-[rgb(var(--color-error))]/15 border-red-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {importResult.success ? (
                        <BsCheckCircle className="w-4 h-4 text-cat-training flex-shrink-0 mt-0.5" />
                      ) : importResult.imported > 0 ? (
                        <BsExclamationTriangle className="w-4 h-4 text-cat-professional flex-shrink-0 mt-0.5" />
                      ) : (
                        <BsExclamationTriangle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-xs ${
                          importResult.success 
                            ? 'text-cat-training' 
                            : importResult.imported > 0 ? 'text-cat-professional' : 'text-error'
                        }`}>
                          {importResult.success
                            ? 'Success!'
                            : importResult.imported > 0 
                              ? 'Completed'
                              : 'Failed'}
                        </p>
                        <div className="text-xs text-secondary mt-1 space-y-0">
                          <p>✓ Imported: <span className="font-semibold">{importResult.imported}</span></p>
                          {importResult.skipped > 0 && (
                            <p>⊗ Skipped: <span className="font-semibold">{importResult.skipped}</span></p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skipped Users List - All visible */}
                  {importResult.skippedUsers && importResult.skippedUsers.length > 0 && (
                    <div className="bg-rating-3 border border-yellow-500/30 rounded-lg p-3">
                      <h3 className="font-bold text-warning text-xs mb-2">
                        Skipped Users ({importResult.skippedUsers.length})
                      </h3>
                      <div className="space-y-1 max-h-56 overflow-y-auto">
                        {importResult.skippedUsers.map((skip, idx) => (
                          <div key={idx} className="bg-surface-secondary border border-[rgba(var(--color-rating-3),0.2)] rounded px-2 py-1.5 text-xs">
                            <div className="flex gap-2 items-start">
                              <span className="text-yellow-300 font-bold flex-shrink-0 min-w-fit">Row {skip.rowNumber}:</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-primary font-medium truncate text-xs">
                                  {skip.excelData?.Name || skip.excelData?.['Employee Name'] || skip.excelData?.['First Name'] || 'Unknown'}
                                </p>
                                <p className="text-secondary text-xs">
                                  {skip.reason.includes('does not exist') ? 'Not found' : skip.reason}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="p-3 bg-error-muted border border-red-500/30 rounded text-xs text-error">
                      <p className="font-medium mb-1">Errors:</p>
                      <ul className="space-y-0.5">
                        {importResult.errors.map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t-2 border-theme">
              {!importResult ? (
                <>
                  <button
                    onClick={handleClose}
                    className="px-3 py-1.5 text-xs text-secondary hover:text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="px-3 py-1.5 bg-[rgb(var(--color-event-social))] hover:bg-[rgb(var(--color-event-social))] text-[rgb(var(--color-text-inverse))] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs font-medium"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <BsUpload className="w-3 h-3" />
                        <span>Import</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {importResult.reportData && (
                    <button
                      onClick={downloadImportReport}
                      className="px-3 py-1.5 bg-accent hover:opacity-90 text-[rgb(var(--color-text-inverse))] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                    >
                      <BsDownload className="w-3 h-3" />
                      Download
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="px-3 py-1.5 bg-[rgb(var(--color-event-social))] hover:bg-[rgb(var(--color-event-social))] text-[rgb(var(--color-text-inverse))] rounded-lg transition-colors text-xs font-medium"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

