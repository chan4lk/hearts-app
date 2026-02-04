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
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to Row 5 when modal opens
  useEffect(() => {
    if (isOpen && containerRef.current) {
      setTimeout(() => {
        const scrollHeight = containerRef.current?.scrollHeight || 0;
        const itemHeight = 70; // approximate height of each item
        const scrollToItem = 4; // Row 5 is index 4 (0-based)
        containerRef.current?.scrollTo({
          top: scrollToItem * itemHeight,
          behavior: 'smooth'
        });
      }, 300);
    }
  }, [isOpen]);

  // Simplify skip reason message
  const getSimpleReason = (reason: string): string => {
    if (reason.includes('does not exist')) {
      return 'User not found in system';
    }
    if (reason.includes('No review cycle data')) {
      return 'No data provided';
    }
    if (reason.includes('missing or invalid')) {
      return 'Missing required data';
    }
    if (reason.includes('Import error')) {
      return 'Import error';
    }
    return reason;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70]"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 4rem)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-600 bg-yellow-500/15 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <BsExclamationTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                <h2 className="font-bold text-white">Skipped Users ({skippedUsers.length})</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <BsX className="w-6 h-6" />
              </button>
            </div>

            {/* Content - Simple List */}
            <div className="flex-1 overflow-y-auto p-4" ref={containerRef}>
              <div className="space-y-2">
                {skippedUsers.map((skip, idx) => (
                  <div key={idx} className="bg-gray-800/50 border border-yellow-500/20 rounded p-3 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-yellow-300 font-semibold min-w-fit">Row {skip.rowNumber}:</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {skip.excelData?.Name || skip.excelData?.['Employee Name'] || skip.excelData?.['First Name'] || 'Unknown'}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">{getSimpleReason(skip.reason)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-700">
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-medium"
              >
                <BsDownload className="w-4 h-4" />
                Download Report
              </button>
              <button
                onClick={onClose}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-xs font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ImportExcelModal({ isOpen, onClose, onImportComplete }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showSkippedUsersModal, setShowSkippedUsersModal] = useState(false);
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
        setTimeout(() => {
          onImportComplete();
        }, 2000);
      }
    } catch (error) {
      console.error('Import error:', error);
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
    <>
      {/* Main Import Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
              style={{ maxHeight: 'calc(100vh - 4rem)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <BsFileEarmarkExcel className="w-6 h-6 text-teal-400" />
                  <h2 className="text-lg font-bold text-white">Import Review Cycles</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <BsX className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {!importResult ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-300">
                      Upload an Excel file (.xlsx, .xls) or CSV containing review cycle data.
                    </p>

                    {/* File Upload Area - Compact */}
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        file
                          ? 'border-teal-500 bg-teal-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      {file ? (
                        <div className="space-y-2">
                          <BsFileEarmarkExcel className="w-10 h-10 text-teal-400 mx-auto" />
                          <p className="text-white font-medium text-sm">{file.name}</p>
                          <p className="text-gray-400 text-xs">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                          <button
                            onClick={() => {
                              setFile(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            className="text-xs text-red-400 hover:text-red-300 mt-2"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <BsUpload className="w-10 h-10 text-gray-400 mx-auto" />
                          <p className="text-white text-sm">Drop file here or browse</p>
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs cursor-pointer transition-colors">
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
                      className={`p-4 rounded-lg border ${
                        importResult.success
                          ? 'bg-green-500/20 border-green-500/50'
                          : importResult.imported > 0 
                            ? 'bg-blue-500/20 border-blue-500/50' 
                            : 'bg-red-500/20 border-red-500/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {importResult.success ? (
                          <BsCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : importResult.imported > 0 ? (
                          <BsExclamationTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <BsExclamationTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${
                            importResult.success 
                              ? 'text-green-400' 
                              : importResult.imported > 0 ? 'text-blue-400' : 'text-red-400'
                          }`}>
                            {importResult.success
                              ? 'Import Successful!'
                              : importResult.imported > 0 
                                ? 'Import Completed'
                                : 'Import Failed'}
                          </p>
                          <div className="text-xs text-gray-300 mt-1 space-y-0.5">
                            <p>✓ Imported: <span className="font-semibold">{importResult.imported}</span></p>
                            {importResult.skipped > 0 && (
                              <p>⊗ Skipped: <span className="font-semibold">{importResult.skipped}</span></p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Errors */}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
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
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
                {!importResult ? (
                  <>
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={!file || isUploading}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                    {importResult.skipped > 0 && (
                      <button
                        onClick={() => setShowSkippedUsersModal(true)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <BsExclamationTriangle className="w-4 h-4" />
                        View Skipped ({importResult.skipped})
                      </button>
                    )}
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm font-medium"
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

      {/* Skipped Users Modal */}
      <SkippedUsersModal
        isOpen={showSkippedUsersModal}
        onClose={() => setShowSkippedUsersModal(false)}
        skippedUsers={importResult?.skippedUsers || []}
        onDownload={downloadImportReport}
      />
    </>
  );
}

