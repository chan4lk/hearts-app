'use client';

import { useEffect, useState, useRef } from 'react';
import { BsBell, BsCheckCircle, BsTrash, BsCircle } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  goal?: {
    id: string;
    title: string;
  } | null;
}

interface NotificationsDropdownProps {
  userId?: string;
}

export default function NotificationsDropdown({ userId }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'REVIEW_CYCLE_CREATED':
      case 'REVIEW_CYCLE_UPDATED':
        return '📋';
      case 'GOAL_CREATED':
      case 'GOAL_UPDATED':
        return '🎯';
      case 'GOAL_APPROVED':
        return '✅';
      case 'GOAL_REJECTED':
        return '❌';
      case 'RATING_RECEIVED':
        return '⭐';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    if (type.includes('REVIEW_CYCLE')) {
      return 'text-indigo-400';
    }
    if (type.includes('GOAL_APPROVED') || type.includes('RATING_RECEIVED')) {
      return 'text-green-400';
    }
    if (type.includes('GOAL_REJECTED')) {
      return 'text-red-400';
    }
    return 'text-blue-400';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
        aria-label="Notifications"
      >
        <BsBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden z-50 max-h-[500px] flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-gray-400">{unreadCount} unread</span>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-400">
                  <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <BsBell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-gray-800/50 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''
                      }`}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`text-xl flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 leading-relaxed">
                            {notification.message}
                          </p>
                          {notification.goal && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              Goal: {notification.goal.title}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors"
                              title="Mark as read"
                            >
                              <BsCircle className="w-4 h-4 text-indigo-400" />
                            </button>
                          )}
                          <button
                            onClick={(e) => deleteNotification(notification.id, e)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                            title="Delete"
                          >
                            <BsTrash className="w-4 h-4 text-gray-400 hover:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/30">
                <button
                  onClick={() => {
                    // Mark all as read
                    notifications
                      .filter(n => !n.isRead)
                      .forEach(n => markAsRead(n.id));
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  disabled={unreadCount === 0}
                >
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

