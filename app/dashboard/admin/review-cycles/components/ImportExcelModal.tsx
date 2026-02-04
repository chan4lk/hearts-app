'use client';

import { useState, useRef } from 'react';
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

export default function ImportExcelModal({ isOpen, onClose, onImportComplete }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showSkippedUsers, setShowSkippedUsers] = useState(false);
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
            className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 4rem)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <BsFileEarmarkExcel className="w-6 h-6 text-teal-400" />
                <h2 className="text-xl font-bold text-white">Import Review Cycles from Excel</h2>
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
                <div className="space-y-6">
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>Upload an Excel file (.xlsx, .xls) or CSV file containing review cycle data.</p>
                    <p className="text-xs text-gray-400">
                      The system will automatically use your logged-in account information and skip users that don't exist in the system.
                    </p>
                  </div>

                  {/* File Upload Area */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      file
                        ? 'border-teal-500 bg-teal-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {file ? (
                      <div className="space-y-3">
                        <BsFileEarmarkExcel className="w-12 h-12 text-teal-400 mx-auto" />
                        <div>
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-gray-400 text-sm">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <BsUpload className="w-12 h-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-white mb-2">Drag and drop your Excel file here</p>
                          <p className="text-gray-400 text-sm mb-4">or</p>
                          <label className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg cursor-pointer transition-colors">
                            <BsUpload className="w-4 h-4" />
                            <span>Browse Files</span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".xlsx,.xls,.csv"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="text-gray-400 text-xs mt-4">
                          Supported formats: .xlsx, .xls, .csv
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Success/Error Message */}
                  <div
                    className={`p-4 rounded-lg flex items-start gap-3 ${
                      importResult.success
                        ? 'bg-green-500/20 border border-green-500/50'
                        : importResult.imported > 0 ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-red-500/20 border border-red-500/50'
                    }`}
                  >
                    {importResult.success ? (
                      <BsCheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : importResult.imported > 0 ? (
                      <BsExclamationTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <BsExclamationTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          importResult.success 
                            ? 'text-green-400' 
                            : importResult.imported > 0 ? 'text-blue-400' : 'text-red-400'
                        }`}
                      >
                        {importResult.success
                          ? `Import completed successfully!`
                          : importResult.imported > 0 
                            ? 'Import completed with some skipped users'
                            : 'No records were imported'}
                      </p>
                      <div className="text-sm text-gray-300 mt-2 space-y-1">
                        <p>✓ Imported: {importResult.imported} review cycle(s)</p>
                        <p>⊗ Skipped: {importResult.skipped} user(s)</p>
                      </div>
                      
                      {/* Imported Users List */}
                      {importResult.importedUsers && importResult.importedUsers.length > 0 && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded">
                          <p className="text-sm font-medium text-green-400 mb-2">Imported Users:</p>
                          <div className="space-y-1">
                            {importResult.importedUsers.map((user, idx) => (
                              <div key={idx} className="text-xs text-gray-300">
                                <span className="font-medium">Row {user.rowNumber}:</span> {user.firstName} → {user.systemUserName}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {importResult.message && (
                        <p className="text-sm text-gray-200 mt-3 italic">
                          {importResult.message}
                        </p>
                      )}
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-2 text-sm text-red-300">
                          <p className="font-medium">Errors:</p>
                          <ul className="list-disc list-inside mt-1">
                            {importResult.errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skipped Users - Collapsible */}
                  {importResult.skippedUsers && importResult.skippedUsers.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                      <button
                        onClick={() => setShowSkippedUsers(!showSkippedUsers)}
                        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center gap-2">
                          <BsExclamationTriangle className="w-5 h-5 text-yellow-400" />
                          <h3 className="font-medium text-yellow-400">
                            Skipped Users ({importResult.skippedUsers.length})
                          </h3>
                        </div>
                        <span className="text-yellow-400 text-sm">
                          {showSkippedUsers ? '▼' : '▶'}
                        </span>
                      </button>

                      {/* Collapsible Content */}
                      <AnimatePresence>
                        {showSkippedUsers && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4">
                              <p className="text-sm text-gray-300 mb-3">
                                The following users were skipped. Please ensure these users exist in the system before importing their review cycles:
                              </p>
                              <div className="max-h-96 overflow-y-auto space-y-2">
                                {importResult.skippedUsers.map((skip, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-gray-800/50 rounded p-3 text-sm border border-yellow-500/20"
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="flex-1">
                                        <p className="text-white font-medium">
                                          Row {skip.rowNumber}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* Excel Data Grid */}
                                    <div className="bg-gray-900/50 rounded p-2 mb-2 text-xs">
                                      <div className="space-y-1">
                                        {Object.entries(skip.excelData || {}).map(([key, value]) => (
                                          <div key={key} className="flex gap-2">
                                            <span className="font-medium text-yellow-300 min-w-fit">{key}:</span>
                                            <span className="text-gray-300 truncate">{String(value || '')}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    {/* Skip Reason */}
                                    <div className="pt-2 border-t border-yellow-500/20">
                                      <p className="text-yellow-400 text-xs">
                                        <span className="font-medium">Reason:</span> {skip.reason}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={downloadImportReport}
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                  <BsDownload className="w-4 h-4" />
                                  Download CSV Report
                                </button>
                              </div>
                              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-300">
                                <p className="font-medium mb-1">💡 Next Steps:</p>
                                <ul className="list-disc list-inside space-y-1 mt-2">
                                  <li>Download the skipped users report above</li>
                                  <li>Add the missing users to the system through the Users management page</li>
                                  <li>Import the Excel file again to complete the import</li>
                                </ul>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <BsUpload className="w-4 h-4" />
                        <span>Import</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

