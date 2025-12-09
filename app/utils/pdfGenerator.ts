import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFReportData {
  summary: {
    totalGoals: number;
    completedGoals: number;
    completionRate: number;
    averageRating: number;
    ratedGoals: number;
    ratingCompletionRate: number;
    overdueGoals: number;
    totalUsers: number;
  };
  breakdowns: {
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    byDepartment: Record<string, number>;
  };
  trends: {
    monthly: Record<string, number>;
  };
  employeePerformance: Array<{
    employeeId: string;
    employeeName: string;
    totalGoals: number;
    completedGoals: number;
    averageRating: number;
    completionRate: number;
  }>;
  metadata?: {
    exportedAt: string;
    exportedBy: string;
    role: string;
    filters?: {
      startDate?: string;
      endDate?: string;
      employeeId?: string;
      department?: string;
    };
  };
}

export function generatePDFReport(data: PDFReportData, title: string = 'Analytics Report'): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Colors
  const primaryColor = [59, 130, 246]; // Blue
  const secondaryColor = [16, 185, 129]; // Green
  const textColor = [31, 41, 55]; // Dark gray
  const lightGray = [243, 244, 246];

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Cover Page
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 35, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Performance Analytics Dashboard', pageWidth / 2, 50, { align: 'center' });

  yPosition = 80;

  // Metadata Section
  if (data.metadata) {
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const metadataText = [
      `Generated: ${new Date(data.metadata.exportedAt).toLocaleString()}`,
      `Exported by: ${data.metadata.exportedBy}`,
      `Role: ${data.metadata.role}`,
    ];

    if (data.metadata.filters) {
      const filters = data.metadata.filters;
      if (filters.startDate && filters.endDate) {
        metadataText.push(`Date Range: ${filters.startDate} to ${filters.endDate}`);
      }
      if (filters.employeeId) {
        metadataText.push(`Employee: ${filters.employeeId}`);
      }
      if (filters.department) {
        metadataText.push(`Department: ${filters.department}`);
      }
    }

    metadataText.forEach((text, index) => {
      doc.text(text, 20, yPosition + (index * 7));
    });

    yPosition += metadataText.length * 7 + 15;
  }

  // Summary Section
  checkPageBreak(50);
  doc.setFillColor(...lightGray);
  doc.rect(15, yPosition - 5, pageWidth - 30, 25, 'F');
  
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Metrics Summary', 20, yPosition + 5);

  yPosition += 15;

  // Summary Stats in Grid
  const summaryStats = [
    { label: 'Total Goals', value: data.summary.totalGoals.toString() },
    { label: 'Completed', value: data.summary.completedGoals.toString() },
    { label: 'Completion Rate', value: `${data.summary.completionRate.toFixed(1)}%` },
    { label: 'Average Rating', value: data.summary.averageRating.toFixed(2) },
    { label: 'Rated Goals', value: data.summary.ratedGoals.toString() },
    { label: 'Overdue Goals', value: data.summary.overdueGoals.toString() },
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const colWidth = (pageWidth - 40) / 3;
  const rowHeight = 8;
  let col = 0;
  let row = 0;

  summaryStats.forEach((stat, index) => {
    const x = 20 + (col * colWidth);
    const y = yPosition + (row * rowHeight);
    
    doc.setTextColor(100, 100, 100);
    doc.text(stat.label + ':', x, y);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, x + 50, y);
    doc.setFont('helvetica', 'normal');

    col++;
    if (col >= 3) {
      col = 0;
      row++;
    }
  });

  yPosition += row * rowHeight + 20;

  // Breakdowns Section
  checkPageBreak(100);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('Goals Breakdown', 20, yPosition);
  yPosition += 10;

  // Status Breakdown Table
  if (Object.keys(data.breakdowns.byStatus).length > 0) {
    checkPageBreak(50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('By Status', 20, yPosition);
    yPosition += 7;

    const statusData = Object.entries(data.breakdowns.byStatus).map(([status, count]) => [
      status,
      count.toString(),
      `${((count / data.summary.totalGoals) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Status', 'Count', 'Percentage']],
      body: statusData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Category Breakdown Table
  if (Object.keys(data.breakdowns.byCategory).length > 0) {
    checkPageBreak(50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('By Category', 20, yPosition);
    yPosition += 7;

    const categoryData = Object.entries(data.breakdowns.byCategory).map(([category, count]) => [
      category,
      count.toString(),
      `${((count / data.summary.totalGoals) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Category', 'Count', 'Percentage']],
      body: categoryData,
      theme: 'striped',
      headStyles: { fillColor: secondaryColor, textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Priority Breakdown Table
  if (Object.keys(data.breakdowns.byPriority).length > 0) {
    checkPageBreak(50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('By Priority', 20, yPosition);
    yPosition += 7;

    const priorityData = Object.entries(data.breakdowns.byPriority).map(([priority, count]) => [
      priority,
      count.toString(),
      `${((count / data.summary.totalGoals) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Priority', 'Count', 'Percentage']],
      body: priorityData,
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246], textColor: 255 }, // Purple
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Department Breakdown Table (if available)
  if (Object.keys(data.breakdowns.byDepartment).length > 0) {
    checkPageBreak(50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('By Department', 20, yPosition);
    yPosition += 7;

    const departmentData = Object.entries(data.breakdowns.byDepartment).map(([dept, count]) => [
      dept,
      count.toString(),
      `${((count / data.summary.totalGoals) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Department', 'Count', 'Percentage']],
      body: departmentData,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: 255 }, // Orange
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Employee Performance Table
  if (data.employeePerformance && data.employeePerformance.length > 0) {
    checkPageBreak(80);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Performance', 20, yPosition);
    yPosition += 7;

    const performanceData = data.employeePerformance.map(emp => [
      emp.employeeName,
      emp.totalGoals.toString(),
      emp.completedGoals.toString(),
      `${emp.completionRate.toFixed(1)}%`,
      emp.averageRating.toFixed(2)
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Employee', 'Total Goals', 'Completed', 'Completion Rate', 'Avg Rating']],
      body: performanceData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Monthly Trends (if available)
  if (data.trends.monthly && Object.keys(data.trends.monthly).length > 0) {
    checkPageBreak(50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Trends', 20, yPosition);
    yPosition += 7;

    const monthlyData = Object.entries(data.trends.monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => [
        new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count.toString()
      ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Month', 'Goals Created']],
      body: monthlyData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
    });
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'Bistec AspireHub - Performance Management System',
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  return doc;
}

