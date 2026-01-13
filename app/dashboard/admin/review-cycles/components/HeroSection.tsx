'use client';

import { BsCalendarCheck, BsPlus, BsDownload } from 'react-icons/bs';
import { showToast } from '@/app/utils/toast';

interface HeroSectionProps {
  onAddNew: () => void;
}

export default function HeroSection({ onAddNew }: HeroSectionProps) {
  const handleDownloadExcel = async () => {
    try {
      // Toast removed
      
      const response = await fetch('/api/admin/review-cycles/export', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to download data';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('spreadsheet')) {
        throw new Error('Invalid file type received');
      }
      
      const blob = await response.blob();
      
      // Check if blob is valid
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Get filename from Content-Disposition header or use default
      let filename = `review-cycles-${new Date().toISOString().split('T')[0]}.xlsx`;
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 100);
      
      // Toast removed
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to download Excel file. Please check your connection and try again.';
      // Toast removed
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-900/30 via-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-xl p-4 border border-indigo-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <BsCalendarCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white mb-0.5">Review Cycles Management</h1>
            <p className="text-gray-400 text-xs">Manage employee review cycles and performance evaluation schedules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md text-xs font-medium"
            title="Download Excel Data"
          >
            <BsDownload className="w-4 h-4" />
            <span>Download Excel</span>
          </button>
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-md text-xs font-medium"
          >
            <BsPlus className="w-4 h-4" />
            <span>Add Review Cycle</span>
          </button>
        </div>
      </div>
    </div>
  );
}

