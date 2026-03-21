'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { BsBell, BsCheckCircle, BsTrash, BsCircle, BsArrowClockwise, BsX } from 'react-icons/bs';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(Date.now());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasNewNotificationsRef = useRef(false);

  // Fetch notifications function
  const fetchNotifications = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    }
    
    try {
      const response = await fetch('/api/notifications?' + new URLSearchParams({ _t: Date.now().toString() }), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.notifications || [];
        
        // Check if there are new notifications
        setNotifications(prevNotifications => {
          if (prevNotifications.length > 0) {
            const existingIds = new Set(prevNotifications.map(n => n.id));
            const hasNew = newNotifications.some((n: Notification) => !existingIds.has(n.id));
            if (hasNew && !isOpen) {
              hasNewNotificationsRef.current = true;
            }
          }
          return newNotifications;
        });
        
        setLastFetchTime(Date.now());
      }
    } catch (error) {
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [isOpen]);

  // Initial load and polling
  useEffect(() => {
    if (!userId) return;
    
    // Initial fetch
    const loadNotifications = async () => {
      await fetchNotifications(false);
    };
    loadNotifications();
    
    // Poll for new notifications every 30 seconds (reduced from 5s to prevent query spam)
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only depend on userId

  // Refresh when dropdown opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications(true);
      hasNewNotificationsRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]); // Only depend on isOpen and userId

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
    }
  };

  const clearAllNotifications = async () => {
    try {
      // Delete all notifications one by one
      const deletePromises = notifications.map(notification =>
        fetch(`/api/notifications?id=${notification.id}`, {
          method: 'DELETE'
        })
      );

      await Promise.all(deletePromises);
      setNotifications([]);
    } catch (error) {
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Manual refresh function
  const handleRefresh = () => {
    fetchNotifications(true);
  };

  const getNotificationIcon = (type: string) => {
    // Simple colored circle indicators instead of emojis
    const colorClass = getNotificationColor(type);
    // Convert text color to background color
    const bgColor = colorClass.replace('text-indigo-400', 'bg-indigo-400')
      .replace('text-green-400', 'bg-green-400')
      .replace('text-red-400', 'bg-red-400')
      .replace('text-blue-400', 'bg-blue-400');
    
    return (
      <div className={`w-3 h-3 rounded-full ${bgColor} opacity-80`}></div>
    );
  };

  const getNotificationColor = (type: string) => {
    if (type.includes('REVIEW_CYCLE')) {
      return 'text-indigo-400';
    }
    if (type.includes('GOAL_APPROVED') || type.includes('GOAL_COMPLETED') || type.includes('RATING_RECEIVED')) {
      return 'text-green-400';
    }
    if (type.includes('GOAL_REJECTED') || type.includes('GOAL_DELETED') || type.includes('REVIEW_CYCLE_DELETED')) {
      return 'text-red-400';
    }
    if (type.includes('GOAL_UPDATED') || type.includes('GOAL_MODIFIED')) {
      return 'text-blue-400';
    }
    return 'text-blue-400';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-secondary hover:text-primary transition-all duration-200 rounded-lg hover:bg-indigo-500/10 group"
        aria-label="Notifications"
      >
        <motion.div
          animate={hasNewNotificationsRef.current ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <BsBell className={`w-5 h-5 transition-transform duration-200 ${unreadCount > 0 ? 'text-indigo-400' : ''} group-hover:scale-110`} />
        </motion.div>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-semibold px-1.5 shadow-red-500/50"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
        {/* Pulse animation for unread notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full opacity-75 animate-ping"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-surface-elevated backdrop-blur-xl rounded-xl shadow-2xl border border-theme overflow-hidden z-50 max-h-[500px] flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-theme flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
              <div className="flex items-center gap-2">
                <BsBell className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-primary">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <motion.div
                    animate={isRefreshing ? { rotate: 360 } : {}}
                    transition={{ duration: 0.5, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
                  >
                    <BsArrowClockwise className="w-4 h-4 text-secondary hover:text-indigo-400" />
                  </motion.div>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
                  title="Close"
                >
                  <BsX className="w-4 h-4 text-secondary hover:text-primary" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-secondary">
                  <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-secondary">
                  <BsBell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-[rgb(var(--color-border-primary))]">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20, y: -10 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group relative p-4 hover:bg-gradient-to-r hover:from-indigo-500/5 hover:to-purple-500/5 cursor-pointer transition-all duration-200 ${
                        !notification.isRead 
                          ? 'bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 border-l-4 border-indigo-500 shadow-sm' 
                          : 'hover:border-l-2 hover:border-theme'
                      }`}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      {/* Unread indicator dot */}
                      {!notification.isRead && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                      )}
                      
                      <div className="flex items-start gap-3 pl-2">
                        <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-relaxed ${
                            !notification.isRead ? 'text-primary font-medium' : 'text-secondary'
                          }`}>
                            {notification.message}
                          </p>
                          {notification.goal && (
                            <div className="mt-2 px-2 py-1 bg-surface-secondary rounded-md inline-block">
                              <p className="text-xs text-indigo-400 font-medium truncate max-w-[200px]">
                                {notification.goal.title}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-tertiary">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                            {!notification.isRead && (
                              <span className="text-xs px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full font-medium">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-2 rounded-lg hover:bg-indigo-500/20 transition-colors"
                              title="Mark as read"
                            >
                              <BsCheckCircle className="w-4 h-4 text-indigo-400 hover:text-indigo-300" />
                            </button>
                          )}
                          <button
                            onClick={(e) => deleteNotification(notification.id, e)}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                            title="Delete"
                          >
                            <BsTrash className="w-4 h-4 text-secondary hover:text-red-400" />
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
              <div className="px-4 py-3 border-t border-theme bg-surface-secondary flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Mark all as read
                      notifications
                        .filter(n => !n.isRead)
                        .forEach(n => markAsRead(n.id));
                    }}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10"
                    disabled={unreadCount === 0}
                  >
                    <BsCheckCircle className="w-3.5 h-3.5" />
                    Mark all as read
                  </button>
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                  >
                    <BsTrash className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                </div>
                <span className="text-xs text-tertiary">
                  Last updated: {formatDistanceToNow(new Date(lastFetchTime), { addSuffix: true })}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

