import { motion } from "framer-motion";
import { BsList, BsGrid, BsSliders } from "react-icons/bs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ViewMode, FilterStatus, RatingStatus, FilterRating } from "../types";

interface FiltersSectionProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  filterRating: FilterRating;
  setFilterRating: (rating: FilterRating) => void;
  ratingStatus: RatingStatus;
  setRatingStatus: (status: RatingStatus) => void;
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      mass: 0.5
    }
  }
};

export function FiltersSection({
  viewMode,
  setViewMode,
  filterStatus,
  setFilterStatus,
  filterRating,
  setFilterRating,
  ratingStatus,
  setRatingStatus
}: FiltersSectionProps) {
  return (
    <motion.div 
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="relative"
    >
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-10 px-1.5">
        {/* View Mode Toggle - Ultra Compact */}
        <div className="flex h-7 bg-gray-100 dark:bg-gray-700 rounded-md">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 ${
              viewMode === 'list'
                ? 'bg-gray-800 dark:bg-gray-600 text-white'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'
            }`}
            onClick={() => setViewMode('list')}
          >
            <BsList className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150 ${
              viewMode === 'grid'
                ? 'bg-gray-800 dark:bg-gray-600 text-white'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'
            }`}
            onClick={() => setViewMode('grid')}
          >
            <BsGrid className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Compact Filters Row */}
        <div className="flex items-center gap-1.5 flex-1">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-7 min-w-[110px] bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 border-0 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <SelectItem value="all" className="text-gray-700 dark:text-gray-300">All Statuses</SelectItem>
              <SelectItem value="PENDING" className="bg-gray-50 dark:bg-gray-700/50">
                <span className="inline-flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></span>
                  Pending
                </span>
              </SelectItem>
              <SelectItem value="APPROVED" className="bg-gray-50 dark:bg-gray-700/50">
                <span className="inline-flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-2"></span>
                  Approved
                </span>
              </SelectItem>
              <SelectItem value="REJECTED" className="bg-gray-50 dark:bg-gray-700/50">
                <span className="inline-flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-800 mr-2"></span>
                  Rejected
                </span>
              </SelectItem>
              <SelectItem value="COMPLETED" className="bg-gray-50 dark:bg-gray-700/50">
                <span className="inline-flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-900 mr-2"></span>
                  Completed
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="h-7 min-w-[110px] bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 border-0 text-sm">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <SelectItem value="all" className="text-gray-700 dark:text-gray-300">All Ratings</SelectItem>
              <SelectItem value="1" className="bg-gray-50 dark:bg-gray-700/50">★ Needs Improvement</SelectItem>
              <SelectItem value="2" className="bg-gray-50 dark:bg-gray-700/50">★★ Below Average</SelectItem>
              <SelectItem value="3" className="bg-gray-50 dark:bg-gray-700/50">★★★ Average</SelectItem>
              <SelectItem value="4" className="bg-gray-50 dark:bg-gray-700/50">★★★★ Above Average</SelectItem>
              <SelectItem value="5" className="bg-gray-50 dark:bg-gray-700/50">★★★★★ Excellent</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

          <Select value={ratingStatus} onValueChange={setRatingStatus}>
            <SelectTrigger className="h-7 min-w-[110px] bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 border-0 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <SelectItem value="all" className="text-gray-700 dark:text-gray-300">All Goals</SelectItem>
              <SelectItem value="rated" className="bg-gray-50 dark:bg-gray-700/50">
                <span className="inline-flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mr-2"></span>
                  Rated Goals
                </span>
              </SelectItem>
              <SelectItem value="unrated" className="bg-gray-50 dark:bg-gray-700/50">
                <span className="inline-flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></span>
                  Unrated Goals
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Settings Icon */}
        <motion.button
          whileHover={{ rotate: 90 }}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <BsSliders className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
} 