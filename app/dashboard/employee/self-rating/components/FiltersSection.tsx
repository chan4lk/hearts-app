import { motion } from "framer-motion";
import { BsSliders, BsGrid, BsListUl } from "react-icons/bs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
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
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
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
      <div className="flex items-center gap-3 bg-gradient-to-b from-gray-800/80 to-gray-900/80 backdrop-blur-xl 
                    rounded-2xl border border-white/10 px-4 py-2.5 shadow-xl">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-indigo-500 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <BsGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-indigo-500 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <BsListUl className="w-4 h-4" />
          </button>
        </div>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 min-w-[130px] bg-white/5 hover:bg-white/10 border-0 rounded-xl text-sm text-white/90">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border border-white/10 shadow-xl rounded-xl">
            <SelectItem value="all" className="text-white/90">All Statuses</SelectItem>
            <SelectItem value="PENDING" className="text-white/90">
              <span className="inline-flex items-center">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-2"></span>
                Pending
              </span>
            </SelectItem>
            <SelectItem value="APPROVED" className="text-white/90">
              <span className="inline-flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
                Approved
              </span>
            </SelectItem>
            <SelectItem value="REJECTED" className="text-white/90">
              <span className="inline-flex items-center">
                <span className="w-2 h-2 rounded-full bg-rose-400 mr-2"></span>
                Rejected
              </span>
            </SelectItem>
            <SelectItem value="COMPLETED" className="text-white/90">
              <span className="inline-flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
                Completed
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Rating Filter */}
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="h-8 min-w-[130px] bg-white/5 hover:bg-white/10 border-0 rounded-xl text-sm text-white/90">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border border-white/10 shadow-xl rounded-xl">
            <SelectItem value="all" className="text-white/90">All Ratings</SelectItem>
            <SelectItem value="1" className="text-white/90">★ Needs Improvement</SelectItem>
            <SelectItem value="2" className="text-white/90">★★ Below Average</SelectItem>
            <SelectItem value="3" className="text-white/90">★★★ Average</SelectItem>
            <SelectItem value="4" className="text-white/90">★★★★ Above Average</SelectItem>
            <SelectItem value="5" className="text-white/90">★★★★★ Excellent</SelectItem>
          </SelectContent>
        </Select>

        {/* Rating Status Filter */}
        <Select value={ratingStatus} onValueChange={setRatingStatus}>
          <SelectTrigger className="h-8 min-w-[130px] bg-white/5 hover:bg-white/10 border-0 rounded-xl text-sm text-white/90">
            <SelectValue placeholder="Rating Status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border border-white/10 shadow-xl rounded-xl">
            <SelectItem value="all" className="text-white/90">All Goals</SelectItem>
            <SelectItem value="rated" className="text-white/90">
              <span className="inline-flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
                Rated Goals
              </span>
            </SelectItem>
            <SelectItem value="unrated" className="text-white/90">
              <span className="inline-flex items-center">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-2"></span>
                Unrated Goals
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
} 