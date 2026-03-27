'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Target, Sparkles, ArrowRight, Check } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [heartSent, setHeartSent] = useState(false);

  useEffect(() => {
    fetch('/api/admin/values').then(r => r.ok ? r.json() : []).then(d => setValues(d.filter((v: any) => v.isActive)));
    fetch('/api/admin/users').then(r => r.ok ? r.json() : []).then(d => setUsers(d.filter((u: any) => u.id !== session?.user?.id)));
  }, [session]);

  const sendHeart = async () => {
    if (!selectedUser || !selectedValue) return;
    const res = await fetch('/api/hearts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: selectedUser, valueTagId: selectedValue }),
    });
    if (res.ok) setHeartSent(true);
  };

  const finish = () => {
    localStorage.setItem('aspirehub-onboarded', 'true');
    onComplete();
  };

  const steps = [
    // Step 0: Welcome
    {
      title: `Welcome to AspireHub!`,
      subtitle: `Hey ${session?.user?.name?.split(' ')[0] || 'there'}! Let's get you set up in 30 seconds.`,
      icon: Sparkles,
      content: (
        <div className="text-center space-y-4">
          <p className="text-sm text-secondary">AspireHub is where your team recognizes great work, tracks goals, and builds a culture of appreciation.</p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Heart, label: 'Give Hearts', desc: 'Recognize peers' },
              { icon: Target, label: 'Track Goals', desc: 'Stay aligned' },
              { icon: Check, label: 'Fair Reviews', desc: 'Evidence-based' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-surface-secondary rounded-lg p-3 text-center">
                <Icon className="w-6 h-6 text-accent mx-auto mb-1" />
                <p className="text-xs font-semibold text-primary">{label}</p>
                <p className="text-2xs text-tertiary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // Step 1: Give first Heart
    {
      title: 'Give Your First Heart',
      subtitle: 'Recognize someone who made a difference. It takes 5 seconds.',
      icon: Heart,
      content: heartSent ? (
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center py-6">
          <Heart className="w-16 h-16 text-accent mx-auto mb-3" fill="currentColor" />
          <p className="text-lg font-semibold text-primary">Heart sent!</p>
          <p className="text-sm text-secondary">Your colleague will be recognized</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-secondary mb-1 block">Who deserves recognition?</label>
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring">
              <option value="">Select a colleague...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-secondary mb-1 block">For which value?</label>
            <div className="flex flex-wrap gap-2">
              {values.map(v => (
                <button key={v.id} onClick={() => setSelectedValue(v.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium focus-ring transition-colors ${
                    selectedValue === v.id ? 'bg-accent text-[rgb(var(--color-text-inverse))]' : 'bg-surface-secondary text-secondary hover:bg-surface-tertiary'
                  }`}>
                  {v.name}
                </button>
              ))}
            </div>
          </div>
          <button onClick={sendHeart} disabled={!selectedUser || !selectedValue}
            className="w-full py-2.5 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 focus-ring flex items-center justify-center gap-2">
            <Heart className="w-4 h-4" /> Send Heart
          </button>
        </div>
      ),
    },
    // Step 2: Ready!
    {
      title: "You're All Set!",
      subtitle: 'Your AspireHub journey begins now.',
      icon: Sparkles,
      content: (
        <div className="text-center space-y-4">
          <div className="space-y-2 text-sm text-secondary">
            <p><strong className="text-primary">Hearts Feed</strong> — See recognition in real-time</p>
            <p><strong className="text-primary">Goals</strong> — Set and track your objectives</p>
            <p><strong className="text-primary">Reviews</strong> — Evidence-based performance reviews</p>
            <p><strong className="text-primary">Events</strong> — Company activities and events</p>
          </div>
          <button onClick={finish}
            className="w-full py-3 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-semibold hover:opacity-90 focus-ring">
            Go to Hearts Feed
          </button>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-surface-elevated rounded-2xl border border-theme shadow-theme-xl w-full max-w-md overflow-hidden"
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-5">
          {steps.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-accent' : i < step ? 'bg-success' : 'bg-surface-secondary'}`} />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-3">
                <Icon className="w-7 h-7 text-accent" />
              </div>
              <h2 className="text-lg font-bold text-primary">{currentStep.title}</h2>
              <p className="text-sm text-secondary mt-1">{currentStep.subtitle}</p>
            </div>
            {currentStep.content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {!isLast && (
          <div className="px-6 pb-5 flex justify-between items-center">
            <button onClick={finish} className="text-xs text-tertiary hover:text-secondary focus-ring rounded px-2 py-1">
              Skip onboarding
            </button>
            <button onClick={() => setStep(s => Math.min(s + 1, steps.length - 1))}
              className="inline-flex items-center gap-1 px-4 py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium hover:opacity-90 focus-ring">
              {step === 1 && heartSent ? 'Continue' : step === 0 ? "Let's go" : 'Next'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
