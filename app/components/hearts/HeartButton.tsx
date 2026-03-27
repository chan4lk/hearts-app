'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, X, Send } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  department: string | null;
}

interface CompanyValue {
  id: string;
  name: string;
}

interface HeartButtonProps {
  onHeartSent?: () => void;
}

export default function HeartButton({ onHeartSent }: HeartButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [values, setValues] = useState<CompanyValue[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/admin/users').then(r => r.ok ? r.json() : []).then(setUsers);
      fetch('/api/admin/values').then(r => r.ok ? r.json() : []).then(data =>
        setValues(data.filter((v: any) => v.isActive))
      );
    }
  }, [isOpen]);

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!selectedUser || !selectedValue) return;
    setSending(true);
    setError('');

    const res = await fetch('/api/hearts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverId: selectedUser.id,
        valueTagId: selectedValue,
        message: message || undefined,
      }),
    });

    if (res.ok) {
      setSent(true);
      setTimeout(() => {
        setIsOpen(false);
        setSent(false);
        setSelectedUser(null);
        setSelectedValue('');
        setMessage('');
        setSearch('');
        onHeartSent?.();
      }, 1500);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to send heart');
    }
    setSending(false);
  };

  const reset = () => {
    setIsOpen(false);
    setSelectedUser(null);
    setSelectedValue('');
    setMessage('');
    setSearch('');
    setError('');
    setSent(false);
  };

  return (
    <>
      {/* FAB Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-accent rounded-full shadow-theme-lg flex items-center justify-center text-[rgb(var(--color-text-inverse))] hover:opacity-90 focus-ring"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Give a Heart"
      >
        <Heart className="w-6 h-6" fill="currentColor" />
      </motion.button>

      {/* Flyout */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={reset}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed z-50 bg-surface-elevated border border-theme shadow-theme-xl overflow-hidden flex flex-col bottom-4 right-4 left-4 max-h-[80vh] rounded-2xl sm:bottom-24 sm:right-6 sm:left-auto sm:w-[360px] sm:max-h-[500px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-theme">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Heart className="w-4 h-4 text-accent" fill="currentColor" /> Give a Heart
                </h3>
                <button onClick={reset} className="text-secondary hover:text-primary focus-ring rounded p-1" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {sent ? (
                /* Success state */
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 px-4"
                >
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [-10, 0] }}
                    transition={{ repeat: 2, duration: 0.3 }}
                  >
                    <Heart className="w-16 h-16 text-accent" fill="currentColor" />
                  </motion.div>
                  <p className="text-lg font-semibold text-primary mt-4">Heart sent!</p>
                  <p className="text-sm text-secondary">{selectedUser?.name} will be notified</p>
                </motion.div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Step 1: Select colleague */}
                  {!selectedUser ? (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search colleague..."
                          className="w-full pl-10 pr-4 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary placeholder:text-tertiary focus-ring"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1 max-h-[250px] overflow-y-auto">
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-secondary transition-colors text-left focus-ring"
                          >
                            <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center text-xs font-bold text-accent">
                              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-primary">{user.name}</p>
                              <p className="text-xs text-tertiary">{user.department || user.email}</p>
                            </div>
                          </button>
                        ))}
                        {filteredUsers.length === 0 && (
                          <p className="text-center text-sm text-tertiary py-4">No colleagues found</p>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Step 2: Select value + message */
                    <>
                      {/* Selected user chip */}
                      <div className="flex items-center gap-2 bg-accent-muted rounded-lg px-3 py-2">
                        <Heart className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium text-primary flex-1">{selectedUser.name}</span>
                        <button onClick={() => setSelectedUser(null)} className="text-secondary hover:text-primary focus-ring rounded" aria-label="Change recipient">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Value tags */}
                      <div>
                        <label className="text-xs font-medium text-secondary mb-2 block">For which value?</label>
                        <div className="flex flex-wrap gap-2">
                          {values.map((v) => (
                            <button
                              key={v.id}
                              onClick={() => setSelectedValue(v.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus-ring ${
                                selectedValue === v.id
                                  ? 'bg-accent text-[rgb(var(--color-text-inverse))]'
                                  : 'bg-surface-secondary text-secondary hover:bg-surface-tertiary'
                              }`}
                            >
                              {v.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="text-xs font-medium text-secondary mb-1 block">Message (optional)</label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="What did they do?"
                          rows={2}
                          maxLength={500}
                          className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary placeholder:text-tertiary focus-ring resize-none"
                        />
                      </div>

                      {error && <p className="text-xs text-error">{error}</p>}

                      {/* Send */}
                      <button
                        onClick={handleSend}
                        disabled={!selectedValue || sending}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 focus-ring"
                      >
                        <Send className="w-4 h-4" />
                        {sending ? 'Sending...' : 'Send Heart'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
