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

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-2xs' : 'w-10 h-10 text-xs';
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-[rgb(var(--color-heart))] to-[rgb(var(--color-accent))] flex items-center justify-center font-bold text-[rgb(var(--color-text-inverse))] flex-shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

export default function HeartCard({ heart }: HeartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group card-interactive p-5"
    >
      {/* Sender → Receiver header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={heart.sender.name} />
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <span className="text-sm font-semibold text-primary">{heart.sender.name}</span>
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4 text-[rgb(var(--color-heart))]" fill="currentColor" />
          </span>
          <span className="text-sm font-semibold text-primary">{heart.receiver.name}</span>
        </div>
        <span className="text-xs text-tertiary flex-shrink-0">
          {formatDistanceToNow(new Date(heart.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Value tag */}
      <div className="mb-2">
        <span className="badge-heart">
          <Heart className="w-3 h-3" fill="currentColor" />
          {heart.valueTag.name}
        </span>
      </div>

      {/* Message */}
      {heart.message && (
        <p className="text-sm text-secondary leading-relaxed pl-1 border-l-2 border-[rgba(var(--color-heart),0.2)] ml-1">
          {heart.message}
        </p>
      )}

      {/* Departments */}
      {(heart.sender.department || heart.receiver.department) && (
        <div className="flex items-center gap-2 mt-3 text-2xs text-tertiary">
          {heart.sender.department && <span>{heart.sender.department}</span>}
          {heart.sender.department && heart.receiver.department && <span>→</span>}
          {heart.receiver.department && <span>{heart.receiver.department}</span>}
        </div>
      )}
    </motion.div>
  );
}
