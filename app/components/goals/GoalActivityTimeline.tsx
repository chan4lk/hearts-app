'use client';

import { motion } from 'framer-motion';
import { 
  BsCheckCircle, 
  BsCircle, 
  BsPlayCircle, 
  BsPauseCircle,
  BsFlag,
  BsClock,
  BsPerson,
  BsChat
} from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';

interface ActivityEvent {
  id: string;
  type: 'created' | 'progress_update' | 'status_change' | 'comment' | 'completed';
  timestamp: Date;
  user: {
    name: string;
    role: string;
  };
  data: {
    progress?: number;
    previousProgress?: number;
    status?: string;
    previousStatus?: string;
    notes?: string;
    comment?: string;
  };
}

interface GoalActivityTimelineProps {
  activities: ActivityEvent[];
}

export default function GoalActivityTimeline({ activities }: GoalActivityTimelineProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <BsCircle className="w-4 h-4 text-cat-professional" />;
      case 'progress_update':
        return <BsPlayCircle className="w-4 h-4 text-cat-training" />;
      case 'status_change':
        return <BsFlag className="w-4 h-4 text-warning" />;
      case 'comment':
        return <BsChat className="w-4 h-4 text-cat-technical" />;
      case 'completed':
        return <BsCheckCircle className="w-4 h-4 text-success" />;
      default:
        return <BsClock className="w-4 h-4 text-secondary" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'border-[rgb(var(--color-info))]';
      case 'progress_update':
        return 'border-[rgb(var(--color-cat-training))]';
      case 'status_change':
        return 'border-[rgb(var(--color-warning))]';
      case 'comment':
        return 'border-[rgb(var(--color-cat-technical))]';
      case 'completed':
        return 'border-[rgb(var(--color-success))]';
      default:
        return 'border-gray-500';
    }
  };

  const getActivityMessage = (activity: ActivityEvent) => {
    switch (activity.type) {
      case 'created':
        return 'Goal created';
      case 'progress_update':
        return `Updated progress from ${activity.data.previousProgress || 0}% to ${activity.data.progress}%`;
      case 'status_change':
        return `Changed status from ${activity.data.previousStatus} to ${activity.data.status}`;
      case 'comment':
        return `Added a comment`;
      case 'completed':
        return 'Marked goal as completed';
      default:
        return 'Activity recorded';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="bg-surface-secondary border border-theme rounded-lg p-8 text-center">
        <BsClock className="w-12 h-12 text-tertiary mx-auto mb-3" />
        <p className="text-secondary">No activity yet</p>
        <p className="text-sm text-tertiary mt-1">
          Updates will appear here as progress is made
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-primary mb-4">Activity Timeline</h3>
      
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[rgb(var(--color-border-primary))]" />

        {/* Activity Items */}
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-14"
            >
              {/* Icon */}
              <div className={`absolute left-4 top-1 w-8 h-8 rounded-full border-2 ${getActivityColor(activity.type)} bg-surface-primary flex items-center justify-center`}>
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="bg-surface-secondary border border-theme rounded-lg p-4 hover:bg-surface-tertiary transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-primary font-medium">
                      {getActivityMessage(activity)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <BsPerson className="w-3 h-3 text-tertiary" />
                      <span className="text-sm text-secondary">
                        {activity.user.name}
                      </span>
                      <span className="text-xs text-tertiary">
                        ({activity.user.role})
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-tertiary whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>

                {/* Additional Details */}
                {activity.data.notes && (
                  <div className="mt-3 p-3 bg-surface-primary rounded border border-theme">
                    <p className="text-sm text-secondary">{activity.data.notes}</p>
                  </div>
                )}

                {activity.data.comment && (
                  <div className="mt-3 p-3 bg-cat-technical/20 rounded border border-[rgb(var(--color-cat-technical))]/20">
                    <p className="text-sm text-secondary">{activity.data.comment}</p>
                  </div>
                )}

                {/* Progress Bar for Progress Updates */}
                {activity.type === 'progress_update' && activity.data.progress !== undefined && (
                  <div className="mt-3">
                    <div className="h-2 bg-[rgb(var(--color-border-primary))] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[rgb(var(--color-cat-training))] transition-all duration-500"
                        style={{ width: `${activity.data.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

