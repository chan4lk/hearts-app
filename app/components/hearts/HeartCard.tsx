'use client';

import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface HeartCardProps {
  heart: {
    id: string;
    message: string | null;
    createdAt: string;
    sender: { id: string; name: string; department: string | null };
    receiver: { id: string; name: string; department: string | null };
    valueTag: { id: string; name: string };
  };
}

function UserInitials({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-accent-muted flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
      {initials}
    </div>
  );
}

export default function HeartCard({ heart }: HeartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-elevated rounded-xl border border-theme p-4 shadow-theme-sm"
    >
      <div className="flex items-start gap-3">
        <UserInitials name={heart.sender.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-primary">{heart.sender.name}</span>
            <Heart className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="currentColor" />
            <span className="text-sm font-semibold text-primary">{heart.receiver.name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-muted text-accent">
              {heart.valueTag.name}
            </span>
            <span className="text-xs text-tertiary">
              {formatDistanceToNow(new Date(heart.createdAt), { addSuffix: true })}
            </span>
          </div>
          {heart.message && (
            <p className="text-sm text-secondary mt-2 leading-relaxed">{heart.message}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
