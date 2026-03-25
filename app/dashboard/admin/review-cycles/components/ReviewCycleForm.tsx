'use client';

import { useState, useEffect, useRef } from 'react';
import { BsX, BsCalendar, BsPerson, BsBriefcase, BsSearch, BsChevronDown } from 'react-icons/bs';
import { searchDesignations, searchJobCategories } from '@/app/components/shared/constants';

interface ReviewCycle {
  id: string;
  userId: string;
  reportingPersonId?: string | null;
  jobCategory: string | null;
  designation: string | null;
  dateOfAppointment: string | null;
  after6Months: string | null;
  reviewMonth: string | null;
  adjustedReviewMonth: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  reportingPerson?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface ReviewCycleFormProps {
  reviewCycle: ReviewCycle | null;
  onSave: (data: any) => Promise<void> | void;
  onClose: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ReviewCycleForm({ reviewCycle, onSave, onClose }: ReviewCycleFormProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false); // Start as false for optimistic loading
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  // Helper function to get month name from date
  const getMonthName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  // Helper function to calculate 6 months and 1 year from appointment date
  const calculateReviewDates = (appointmentDate: string) => {
    if (!appointmentDate) {
      return { after6Months: '', reviewMonth: '' };
    }

    const date = new Date(appointmentDate);
    if (isNaN(date.getTime())) {
      return { after6Months: '', reviewMonth: '' };
    }

    // Calculate 6 months from appointment date
    const sixMonthsLater = new Date(date);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    const after6MonthsMonth = getMonthName(sixMonthsLater);

    // Calculate 1 year from appointment date
    const oneYearLater = new Date(date);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const reviewMonthMonth = getMonthName(oneYearLater);

    return {
      after6Months: after6MonthsMonth,
      reviewMonth: reviewMonthMonth
    };
  };

  // Initialize form data with today's date as default for new records
  const getInitialDate = () => {
    if (reviewCycle?.dateOfAppointment) {
      return new Date(reviewCycle.dateOfAppointment).toISOString().split('T')[0];
    }
    // Default to today's date for new records
    return new Date().toISOString().split('T')[0];
  };

  const initialDate = getInitialDate();
  const initialCalculations = calculateReviewDates(initialDate);

  const [formData, setFormData] = useState({
    userId: reviewCycle?.userId || '',
    reportingPersonId: reviewCycle?.reportingPersonId || '',
    jobCategory: reviewCycle?.jobCategory || '',
    designation: reviewCycle?.designation || '',
    dateOfAppointment: initialDate,
    after6Months: reviewCycle?.after6Months || initialCalculations.after6Months,
    reviewMonth: reviewCycle?.reviewMonth || initialCalculations.reviewMonth,
    adjustedReviewMonth: reviewCycle?.adjustedReviewMonth || ''
  });

  // Track the calculated review month for comparison
  useEffect(() => {
    if (formData.dateOfAppointment) {
      const calculations = calculateReviewDates(formData.dateOfAppointment);
      setCalculatedReviewMonth(calculations.reviewMonth);
    } else {
      setCalculatedReviewMonth('');
    }
  }, [formData.dateOfAppointment]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const employeeRef = useRef<HTMLDivElement>(null);
  const [reportingPersonSearch, setReportingPersonSearch] = useState('');
  const [showReportingPersonDropdown, setShowReportingPersonDropdown] = useState(false);
  const reportingPersonRef = useRef<HTMLDivElement>(null);
  const [designationSearch, setDesignationSearch] = useState('');
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const designationRef = useRef<HTMLDivElement>(null);
  const [jobCategorySearch, setJobCategorySearch] = useState('');
  const [showJobCategoryDropdown, setShowJobCategoryDropdown] = useState(false);
  const jobCategoryRef = useRef<HTMLDivElement>(null);
  const [calculatedReviewMonth, setCalculatedReviewMonth] = useState<string>('');

  useEffect(() => {
    // Fetch users once and use for both employees and reporting persons
    // Start loading in background immediately
    fetchUsers();
    
    // Cleanup function to cancel request if component unmounts
    return () => {
      // Request will complete but state updates will be ignored if unmounted
    };
  }, []);
  
  // Sync employees with users since they're the same list
  useEffect(() => {
    setEmployees(users);
    // Set loading to false when users are loaded (even if empty)
    if (!loadingUsers) {
      setLoadingEmployees(false);
    }
  }, [users, loadingUsers]);

  // Initialize form values when reviewCycle changes
  useEffect(() => {
    if (reviewCycle) {
      // Set initial employee value
      if (reviewCycle.user) {
        setEmployeeSearch(reviewCycle.user.name);
      }
      // Set initial reporting person value
      if (reviewCycle.reportingPerson) {
        setReportingPersonSearch(reviewCycle.reportingPerson.name);
      }
      // Set initial designation value
      if (reviewCycle.designation) {
        setDesignationSearch(reviewCycle.designation);
      }
      // Set initial job category value
      if (reviewCycle.jobCategory) {
        setJobCategorySearch(reviewCycle.jobCategory);
      }
    }
  }, [reviewCycle]);

  // Sync search fields when users/employees load and formData has values
  useEffect(() => {
    if (formData.userId && users.length > 0 && !employeeSearch) {
      const selected = users.find(u => u.id === formData.userId);
      if (selected) {
        setEmployeeSearch(selected.name);
      }
    }
  }, [formData.userId, users]);

  useEffect(() => {
    if (formData.reportingPersonId && employees.length > 0 && !reportingPersonSearch) {
      const selected = employees.find(e => e.id === formData.reportingPersonId);
      if (selected) {
        setReportingPersonSearch(selected.name);
      }
    }
  }, [formData.reportingPersonId, employees]);

  useEffect(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeRef.current && !employeeRef.current.contains(event.target as Node)) {
        setShowEmployeeDropdown(false);
      }
      if (reportingPersonRef.current && !reportingPersonRef.current.contains(event.target as Node)) {
        setShowReportingPersonDropdown(false);
      }
      if (designationRef.current && !designationRef.current.contains(event.target as Node)) {
        setShowDesignationDropdown(false);
      }
      if (jobCategoryRef.current && !jobCategoryRef.current.contains(event.target as Node)) {
        setShowJobCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      // Fetch all users with minimal fields for faster loading
      // Use minimal=true to get only id, name, email, role (no relations)
      const response = await fetch('/api/admin/users?minimal=true&limit=1000&page=1&sortBy=name&sortOrder=asc');
      if (response.ok) {
        const data = await response.json();
        // API now returns { users: [...], pagination: {...} }
        // Handle both old format (array) and new format (object)
        const usersList = Array.isArray(data) ? data : (data.users || []);
        // Only keep essential fields for dropdown (id, name, email, role)
        const minimalUsers = usersList.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }));
        setUsers(minimalUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };


  // Filter users by search term only (name or email)
  // No filtering by manager assignment - all users are available
  // Ensure users is an array before filtering
  const filteredUsers = Array.isArray(users) ? users.filter(user => 
    user && user.name && user.email &&
    (user.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
     user.email.toLowerCase().includes(employeeSearch.toLowerCase()))
  ) : [];

  const filteredEmployees = Array.isArray(employees) ? employees.filter(emp => 
    emp && emp.name && emp.email &&
    (emp.name.toLowerCase().includes(reportingPersonSearch.toLowerCase()) ||
     emp.email.toLowerCase().includes(reportingPersonSearch.toLowerCase()))
  ) : [];

  const filteredDesignations = searchDesignations(designationSearch);
  const filteredJobCategories = searchJobCategories(jobCategorySearch);

  const handleEmployeeSelect = (userId: string) => {
    const selected = users.find(u => u.id === userId);
    if (selected) {
      setFormData(prev => ({ ...prev, userId }));
      setEmployeeSearch(selected.name);
      setShowEmployeeDropdown(false);
      if (errors.userId) {
        setErrors(prev => ({ ...prev, userId: '' }));
      }
    }
  };

  const handleReportingPersonSelect = (employeeId: string) => {
    const selected = employees.find(e => e.id === employeeId);
    if (selected) {
      setFormData(prev => ({ ...prev, reportingPersonId: employeeId }));
      setReportingPersonSearch(selected.name);
      setShowReportingPersonDropdown(false);
    }
  };

  const handleDesignationSelect = (designation: string) => {
    setFormData(prev => ({ ...prev, designation }));
    setDesignationSearch(designation);
    setShowDesignationDropdown(false);
  };

  const handleJobCategorySelect = (jobCategory: string) => {
    setFormData(prev => ({ ...prev, jobCategory }));
    setJobCategorySearch(jobCategory);
    setShowJobCategoryDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!formData.userId) {
      newErrors.userId = 'User is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Call onSave - it will handle closing the form and updating UI
      const result = onSave(formData);
      // If onSave returns a promise, wait for it
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      // Keep loading state briefly for visual feedback, then clear
      setTimeout(() => setLoading(false), 100);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate After 6 Months and Review Month when dateOfAppointment changes
      if (field === 'dateOfAppointment' && value) {
        const calculations = calculateReviewDates(value);
        updated.after6Months = calculations.after6Months;
        updated.reviewMonth = calculations.reviewMonth;
      }
      
      return updated;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedUser = users.find(u => u.id === formData.userId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed Header - Brand Teal Color */}
      <div className="flex-shrink-0 px-6 py-4 bg-accent border-b border-[rgba(var(--color-event-social),0.3)] z-10 rounded-t-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[rgb(var(--color-text-inverse))]" style={{ color: '#ffffff' }}>
            Review Cycle
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <BsX className="w-5 h-5 text-[rgb(var(--color-text-inverse))]" style={{ color: '#ffffff' }} />
          </button>
        </div>
      </div>

      {/* Scrollable Form Fields - Only This Scrolls */}
      <form 
        id="review-cycle-form" 
        onSubmit={handleSubmit} 
        className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-4 min-h-0"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(107, 114, 128, 0.5) transparent'
        }}
      >
        {/* Employee Selection - Searchable Dropdown */}
        <div ref={employeeRef} className="relative">
          <label className="block text-sm font-semibold text-secondary mb-2" style={{ color: '#e5e7eb' }}>
            <BsPerson className="inline w-4 h-4 mr-2" />
            Employee *
          </label>
          <div className="relative">
            <div className="relative">
              <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setShowEmployeeDropdown(true);
                  if (!e.target.value) {
                    setFormData(prev => ({ ...prev, userId: '' }));
                  }
                }}
                onFocus={() => {
                  setShowEmployeeDropdown(true);
                  // Trigger fetch if users haven't loaded yet
                  if (users.length === 0 && !loadingUsers) {
                    fetchUsers();
                  }
                }}
                placeholder={loadingUsers ? "Loading employees..." : "Search employee by name or email..."}
                disabled={loadingUsers && users.length === 0}
                className={`w-full pl-10 pr-10 py-2 bg-surface-secondary text-primary rounded-lg border ${
                  errors.userId ? 'border-[rgb(var(--color-error))]' : 'border-theme'
                } focus:outline-none focus:ring-2 focus-ring disabled:opacity-50 disabled:cursor-wait`}
              />
              <button
                type="button"
                onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-secondary hover:text-primary"
              >
                <BsChevronDown className={`w-4 h-4 transition-transform ${showEmployeeDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {showEmployeeDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-surface-elevated border border-theme rounded-lg max-h-60 overflow-y-auto">
                {loadingUsers ? (
                  <div className="px-4 py-8 text-center text-secondary text-sm">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[rgb(var(--color-accent))] mx-auto mb-2"></div>
                    Loading employees...
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleEmployeeSelect(user.id)}
                      className={`px-4 py-2 cursor-pointer hover:bg-surface-secondary transition-colors ${
                        formData.userId === user.id ? 'bg-accent-muted/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-primary font-medium">{user.name}</div>
                          <div className="text-secondary text-sm">{user.email}</div>
                        </div>
                        {user.role && (
                          <span className="px-2 py-0.5 text-xs rounded bg-accent-muted text-accent">
                            {user.role}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-secondary text-sm">No employees found</div>
                )}
              </div>
            )}
          </div>
          {errors.userId && (
            <p className="mt-1 text-sm text-error">{errors.userId}</p>
          )}
        </div>

        {/* Reporting Person - Searchable Dropdown */}
        <div ref={reportingPersonRef} className="relative">
          <label className="block text-sm font-semibold text-secondary mb-2" style={{ color: '#e5e7eb' }}>
            <BsPerson className="inline w-4 h-4 mr-2" />
            Reporting Person
          </label>
          <div className="relative">
            <div className="relative">
              <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                value={reportingPersonSearch}
                onChange={(e) => {
                  setReportingPersonSearch(e.target.value);
                  setShowReportingPersonDropdown(true);
                  if (!e.target.value) {
                    setFormData(prev => ({ ...prev, reportingPersonId: '' }));
                  }
                }}
                onFocus={() => {
                  setShowReportingPersonDropdown(true);
                  // Trigger fetch if employees haven't loaded yet
                  if (employees.length === 0 && !loadingEmployees) {
                    fetchUsers();
                  }
                }}
                placeholder={loadingEmployees ? "Loading reporting persons..." : "Search person by name or email..."}
                disabled={loadingEmployees && employees.length === 0}
                className="w-full pl-10 pr-10 py-2 bg-surface-secondary text-primary rounded-lg border border-theme focus:outline-none focus:ring-2 focus-ring disabled:opacity-50 disabled:cursor-wait"
              />
              <button
                type="button"
                onClick={() => setShowReportingPersonDropdown(!showReportingPersonDropdown)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-secondary hover:text-primary"
              >
                <BsChevronDown className={`w-4 h-4 transition-transform ${showReportingPersonDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {showReportingPersonDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-surface-elevated border border-theme rounded-lg max-h-60 overflow-y-auto">
                {loadingEmployees ? (
                  <div className="px-4 py-8 text-center text-secondary text-sm">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[rgb(var(--color-accent))] mx-auto mb-2"></div>
                    Loading reporting persons...
                  </div>
                ) : filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => handleReportingPersonSelect(emp.id)}
                      className={`px-4 py-2 cursor-pointer hover:bg-surface-secondary transition-colors ${
                        formData.reportingPersonId === emp.id ? 'bg-accent-muted/50' : ''
                      }`}
                    >
                      <div className="text-primary font-medium">{emp.name}</div>
                      <div className="text-secondary text-sm">{emp.email}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-secondary text-sm">No employees found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Job Category - Searchable Dropdown */}
        <div ref={jobCategoryRef} className="relative">
          <label className="block text-sm font-semibold text-secondary mb-2" style={{ color: '#e5e7eb' }}>
            <BsBriefcase className="inline w-4 h-4 mr-2" />
            Job Category
          </label>
          <div className="relative">
            <div className="relative">
              <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                value={jobCategorySearch}
                onChange={(e) => {
                  setJobCategorySearch(e.target.value);
                  setShowJobCategoryDropdown(true);
                  if (!e.target.value) {
                    setFormData(prev => ({ ...prev, jobCategory: '' }));
                  }
                }}
                onFocus={(e) => {
                  setShowJobCategoryDropdown(true);
                  // If empty, ensure all categories are shown
                  if (!jobCategorySearch) {
                    setJobCategorySearch('');
                  }
                }}
                placeholder="Search job category..."
                className="w-full pl-10 pr-10 py-2 bg-surface-secondary text-primary rounded-lg border border-theme focus:outline-none focus:ring-2 focus-ring"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowJobCategoryDropdown(!showJobCategoryDropdown);
                  if (!showJobCategoryDropdown && !jobCategorySearch) {
                    // If opening dropdown with no search, show all options
                    setJobCategorySearch('');
                  }
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-secondary hover:text-primary"
              >
                <BsChevronDown className={`w-4 h-4 transition-transform ${showJobCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {showJobCategoryDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-surface-elevated border border-theme rounded-lg max-h-60 overflow-y-auto">
                {filteredJobCategories.length > 0 ? (
                  filteredJobCategories.map((category) => (
                    <div
                      key={category}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleJobCategorySelect(category);
                      }}
                      className={`px-4 py-2 cursor-pointer hover:bg-surface-secondary transition-colors ${
                        formData.jobCategory === category ? 'bg-accent-muted/50' : ''
                      }`}
                    >
                      <div className="text-primary font-medium">{category}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-secondary text-sm">No job categories found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Designation - Searchable Dropdown */}
        <div ref={designationRef} className="relative">
          <label className="block text-sm font-semibold text-secondary mb-2" style={{ color: '#e5e7eb' }}>
            <BsBriefcase className="inline w-4 h-4 mr-2" />
            Designation
          </label>
          <div className="relative">
            <div className="relative">
              <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                value={designationSearch}
                onChange={(e) => {
                  setDesignationSearch(e.target.value);
                  setShowDesignationDropdown(true);
                  if (!e.target.value) {
                    setFormData(prev => ({ ...prev, designation: '' }));
                  }
                }}
                onFocus={(e) => {
                  setShowDesignationDropdown(true);
                  // If empty, ensure all designations are shown
                  if (!designationSearch) {
                    setDesignationSearch('');
                  }
                }}
                placeholder="Search designation..."
                className="w-full pl-10 pr-10 py-2 bg-surface-secondary text-primary rounded-lg border border-theme focus:outline-none focus:ring-2 focus-ring"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDesignationDropdown(!showDesignationDropdown);
                  if (!showDesignationDropdown && !designationSearch) {
                    // If opening dropdown with no search, show all options
                    setDesignationSearch('');
                  }
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-secondary hover:text-primary"
              >
                <BsChevronDown className={`w-4 h-4 transition-transform ${showDesignationDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {showDesignationDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-surface-elevated border border-theme rounded-lg max-h-60 overflow-y-auto">
                {filteredDesignations.length > 0 ? (
                  filteredDesignations.map((designation) => (
                    <div
                      key={designation}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDesignationSelect(designation);
                      }}
                      className={`px-4 py-2 cursor-pointer hover:bg-surface-secondary transition-colors ${
                        formData.designation === designation ? 'bg-accent-muted/50' : ''
                      }`}
                    >
                      <div className="text-primary font-medium">{designation}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-secondary text-sm">No designations found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Date of Appointment */}
        <div>
          <label className="block text-sm font-semibold text-secondary mb-2" style={{ color: '#e5e7eb' }}>
            <BsCalendar className="inline w-4 h-4 mr-2" />
            Date of Appointment (Joined Date)
          </label>
          <input
            type="date"
            value={formData.dateOfAppointment}
            onChange={(e) => handleChange('dateOfAppointment', e.target.value)}
            className="w-full px-4 py-2 bg-surface-secondary text-primary rounded-lg border border-theme focus:outline-none focus:ring-2 focus-ring"
          />
          {formData.dateOfAppointment && (
            <p className="mt-1 text-xs text-secondary">
              {new Date(formData.dateOfAppointment).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
        </div>

        {/* After 6 Months */}
        <div>
          <label className="block text-sm font-semibold text-secondary mb-2" style={{ color: '#e5e7eb' }}>
            After 6 Months
          </label>
          <select
            value={formData.after6Months}
            onChange={(e) => handleChange('after6Months', e.target.value)}
            className="w-full px-4 py-2 bg-surface-secondary text-primary rounded-lg border border-theme focus:outline-none focus:ring-2 focus-ring"
          >
            <option value="">Select Month</option>
            {MONTHS.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        {/* Review Month */}
        <div>
          <label className="block text-sm font-semibold text-secondary mb-2" style={{ color: '#e5e7eb' }}>
            Review Month
            {calculatedReviewMonth && formData.reviewMonth === calculatedReviewMonth && (
              <span className="ml-2 text-xs text-accent font-normal"></span>
            )}
          </label>
          <select
            value={formData.reviewMonth}
            onChange={(e) => handleChange('reviewMonth', e.target.value)}
            className="w-full px-4 py-2 bg-surface-secondary text-primary rounded-lg border border-theme focus:outline-none focus:ring-2 focus-ring"
          >
            <option value="">Select Month</option>
            {MONTHS.map((month) => (
              <option key={month} value={month}>
                {month}
                {month === calculatedReviewMonth && formData.reviewMonth === calculatedReviewMonth ? '' : ''}
              </option>
            ))}
          </select>
          {calculatedReviewMonth && formData.reviewMonth !== calculatedReviewMonth && (
            <p className="mt-1 text-xs text-warning">
              ⚠️ Changed from calculated: <span className="line-through text-secondary">{calculatedReviewMonth}</span>
            </p>
          )}
        </div>

        {/* Adjusted Review Month */}
        <div>
          <label className="block text-sm font-semibold text-secondary mb-2" style={{ color: '#e5e7eb' }}>
            Adjusted Review Month
          </label>
          <select
            value={formData.adjustedReviewMonth}
            onChange={(e) => handleChange('adjustedReviewMonth', e.target.value)}
            className="w-full px-4 py-2 bg-surface-secondary text-primary rounded-lg border border-theme focus:outline-none focus:ring-2 focus-ring"
          >
            <option value="">Select Month</option>
            {MONTHS.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
          {/* Show comparison when adjusted month is different from review month */}
          {formData.adjustedReviewMonth && 
           formData.reviewMonth && 
           formData.adjustedReviewMonth !== formData.reviewMonth && (
            <div className="mt-2 p-3 bg-warning-muted border border-[rgba(var(--color-warning),0.3)] rounded-lg">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-warning font-medium">Original:</span>
                <span className="px-2 py-1 bg-surface-secondary rounded text-secondary line-through decoration-amber-400 decoration-2">
                  {formData.reviewMonth}
                </span>
                <span className="text-tertiary">→</span>
                <span className="text-cat-training font-medium">Adjusted:</span>
                <span className="px-2 py-1 bg-cat-training rounded text-cat-training font-semibold border border-[rgb(var(--color-cat-training))]/30">
                  {formData.adjustedReviewMonth}
                </span>
              </div>
              {calculatedReviewMonth && formData.reviewMonth !== calculatedReviewMonth && (
                <div className="mt-2 pt-2 border-t border-[rgb(var(--color-warning))]/20">
                  <span className="text-xs text-secondary">
                    Note: Review Month was also changed from calculated: <span className="line-through">{calculatedReviewMonth}</span>
                  </span>
                </div>
              )}
            </div>
          )}
          {/* Show calculated review month hint when no adjustment */}
          {!formData.adjustedReviewMonth && formData.reviewMonth && calculatedReviewMonth && (
            <p className="mt-1 text-xs text-secondary">
            </p>
          )}
        </div>

      </form>

      {/* Fixed Footer with Buttons */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-theme bg-surface-secondary flex items-center justify-end gap-3 rounded-b-xl">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors rounded-lg hover:bg-surface-secondary"
          style={{ color: '#d1d5db' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          form="review-cycle-form"
          disabled={loading}
          className="px-6 py-2 text-sm font-medium bg-[rgb(var(--color-event-social))] hover:bg-[rgb(var(--color-event-social))] text-[rgb(var(--color-text-inverse))] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          style={{ color: '#ffffff' }}
        >
          {loading ? 'Saving...' : (reviewCycle ? 'Update' : 'Add')}
        </button>
      </div>
    </div>
  );
}

