'use client';

import { useState, useRef } from 'react';
import { BsX, BsUpload, BsFileEarmarkExcel, BsCheckCircle, BsExclamationTriangle } from 'react-icons/bs';
import * as XLSX from 'xlsx';
import { showToast } from '@/app/utils/toast';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: ImportError[];
}

export default function ExcelImportModal({ isOpen, onClose, onImportSuccess }: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
      showToast.error('Invalid file type', 'Please upload an Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    setFile(selectedFile);
    setImportResult(null);
    parseFile(selectedFile);
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (jsonData.length < 2) {
          showToast.error('Invalid file', 'Excel file must have at least a header row and one data row');
          setFile(null);
          return;
        }

        // Get headers (first row)
        const headers = (jsonData[0] as any[]).map((h: any) => String(h).trim().toLowerCase());
        
        // Expected column mappings (flexible matching)
        const expectedColumns = {
          email: ['email', 'employee email', 'user email', 'e-mail'],
          name: ['name', 'employee name', 'full name', 'user name'],
          reportingpersonemail: ['reporting person email', 'manager email', 'reporting email', 'reportingperson email'],
          reportingpersonname: ['reporting person name', 'manager name', 'reporting name', 'reportingperson name'],
          jobcategory: ['job category', 'jobcategory', 'category'],
          designation: ['designation', 'position', 'title'],
          dateofappointment: ['date of appointment', 'appointment date', 'joined date', 'dateofappointment', 'join date'],
          after6months: ['after 6 months', '6 months', 'after6months', 'six months'],
          reviewmonth: ['review month', 'reviewmonth'],
          adjustedreviewmonth: ['adjusted review month', 'adjustedreviewmonth', 'adjusted month']
        };

        // Find column indices
        const columnMap: Record<string, number> = {};
        Object.entries(expectedColumns).forEach(([key, variations]) => {
          const index = headers.findIndex(h => variations.some(v => h.includes(v)));
          if (index !== -1) {
            columnMap[key] = index;
          }
        });

        // Validate required columns
        if (!columnMap.email && !columnMap.name) {
          showToast.error('Missing required columns', 'Excel file must have either "Email" or "Name" column');
          setFile(null);
          return;
        }

        // Parse data rows
        const parsedData = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0) continue;

          const record: any = {};
          Object.entries(columnMap).forEach(([key, index]) => {
            if (index !== undefined && row[index] !== undefined) {
              const value = row[index];
              if (value !== null && value !== undefined && value !== '') {
                record[key] = String(value).trim();
              }
            }
          });

          // Only add records with at least email or name
          if (record.email || record.name) {
            parsedData.push(record);
          }
        }

        if (parsedData.length === 0) {
          showToast.error('No valid data', 'Excel file does not contain any valid data rows');
          setFile(null);
          return;
        }

        setPreview(parsedData.slice(0, 5)); // Show first 5 rows as preview
      } catch (error) {
        console.error('Error parsing file:', error);
        showToast.error('Error parsing file', error instanceof Error ? error.message : 'Failed to parse Excel file');
        setFile(null);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/review-cycles/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setImportResult(result);
      
      if (result.success > 0) {
        showToast.success(
          'Import Successful',
          `Successfully imported ${result.success} review cycle(s)${result.failed > 0 ? `. ${result.failed} failed.` : ''}`
        );
        setTimeout(() => {
          onImportSuccess();
          handleClose();
        }, 2000);
      } else {
        showToast.error('Import Failed', 'No review cycles were imported. Please check the errors.');
      }
    } catch (error) {
      console.error('Import error:', error);
      showToast.error('Import Error', error instanceof Error ? error.message : 'Failed to import review cycles');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Review Cycles from Excel</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <BsX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Excel File (.xlsx, .xls, or .csv)
            </label>
            <div className="mt-1 flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                  <BsUpload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {file ? file.name : 'Click to browse or drag and drop'}
                  </span>
                </div>
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Required columns: Email (or Name), Date of Appointment. Optional: Reporting Person, Job Category, Designation, After 6 Months, Review Month, Adjusted Review Month
            </p>
          </div>

          {/* Preview Section */}
          {preview.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Preview ({preview.length} of {preview.length} rows shown)
              </h3>
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Email/Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Reporting Person</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Job Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Designation</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Appointment Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {preview.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                          {row.email || row.name || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                          {row.reportingpersonname || row.reportingpersonemail || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                          {row.jobcategory || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                          {row.designation || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                          {row.dateofappointment || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className={`p-4 rounded-lg border ${
              importResult.success > 0 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                {importResult.success > 0 ? (
                  <BsCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <BsExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`text-sm font-semibold mb-2 ${
                    importResult.success > 0 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    Import Results
                  </h4>
                  <p className={`text-sm mb-2 ${
                    importResult.success > 0 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    Successfully imported: {importResult.success} | Failed: {importResult.failed}
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      <p className="text-xs font-medium text-red-900 dark:text-red-100 mb-1">Errors:</p>
                      <ul className="text-xs text-red-800 dark:text-red-200 space-y-1">
                        {importResult.errors.slice(0, 10).map((error, idx) => (
                          <li key={idx}>
                            Row {error.row}: {error.field} - {error.message}
                          </li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li className="text-gray-600 dark:text-gray-400">
                            ... and {importResult.errors.length - 10} more errors
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Importing...
                </>
              ) : (
                <>
                  <BsFileEarmarkExcel className="w-4 h-4" />
                  Import Review Cycles
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
