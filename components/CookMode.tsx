import React, { useEffect, useRef, useState } from 'react';
import type { Recipe, PantryItem } from '../types';
import { ingredientMatches } from '../utils/pantry';

interface CookModeProps {
  recipe: Recipe;
  onClose: () => void;
  toast: (msg: string) => void;
  pantry: PantryItem[];
  /** Called with the ids of pantry items the cook used up. */
  onUsedUp: (pantryIds: string[]) => void;
}

/** "9:00" -> 540 seconds; "1:05:00" -> 3900. Returns 0 if it can't be read. */
const parseTimer = (text: string): number => {
  const parts = text.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
};

const formatTime = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/** Short beep using Web Audio, with vibration where supported. */
const alertTimerDone = () => {
  try {
    navigator.vibrate?.([300, 150, 300, 150, 300]);
  } catch { /* not supported */ }
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.2);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch { /* audio blocked */ }
};

export const CookMode: React.FC<CookModeProps> = ({ recipe, onClose, toast, pantry, onUsedUp }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [usedUp, setUsedUp] = useState<Record<string, boolean>>({});
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const endsAt = useRef<number>(0);

  const steps = recipe.instructions;
  const total = steps.length;
  const rawStep = steps[currentStep] || '';
  
  // Parse instructions and timers (split on '|')
  const parts = rawStep.split('|');
  const stepText = parts[0];
  const hasTimer = parts.length > 1;
  const timerText = parts[1] || '';
  const timerTotal = hasTimer ? parseTimer(timerText) : 0;

  // Each step starts with its own timer reset and paused.
  useEffect(() => {
    setRunning(false);
    setRemaining(timerTotal);
  }, [currentStep, timerTotal]);

  // Tick against a wall-clock end time so the timer stays right if the tab sleeps.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setRunning(false);
        alertTimerDone();
        toast(`Timer done — step ${currentStep + 1}`);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, currentStep, toast]);

  const toggleTimer = () => {
    if (running) {
      setRunning(false);
      return;
    }
    const start = remaining > 0 ? remaining : timerTotal;
    endsAt.current = Date.now() + start * 1000;
    setRemaining(start);
    setRunning(true);
  };

  const resetTimer = () => {
    setRunning(false);
    setRemaining(timerTotal);
  };

  // Pantry items this recipe drew on, for the "what did you use up?" step.
  const usedPantryItems = pantry.filter(p => recipe.ingredients.some(ing => ingredientMatches(ing, p.name)));

  const handleSavePantry = () => {
    const ids = Object.keys(usedUp).filter(id => usedUp[id]);
    if (ids.length) onUsedUp(ids);
    onClose();
    toast(ids.length ? `Pantry updated — ${ids.length} used up` : 'Nice work — enjoy your meal!');
  };

  const pct = Math.round(((currentStep + 1) / total) * 100) + '%';
  const bigStepNum = String(currentStep + 1).padStart(2, '0');

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < total - 1) {
      setCurrentStep(currentStep + 1);
    } else if (usedPantryItems.length) {
      setRunning(false);
      setFinished(true);
    } else {
      onClose();
      toast('Nice work — enjoy your meal!');
    }
  };

  if (finished) {
    return (
      <div className="absolute inset-0 z-30 bg-transparent lg:bg-black/40 flex items-center justify-center animate-fade-in">
        <div className="relative w-full h-full lg:max-w-xl lg:h-[85%] lg:rounded-[26px] lg:shadow-2xl bg-[var(--bg,#fff)] flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto ppl-scroll p-[34px_24px_16px]">
            <div className="w-[58px] h-[58px] rounded-full bg-[var(--accent-soft,#e6f4ec)] flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--accent,#15a85b)]" style={{ fontSize: '32px' }}>
                celebration
              </span>
            </div>
            <h2 className="font-head text-[26px] font-bold mt-4 text-[var(--text,#15201a)]">
              Nice work — {recipe.recipeName} is done
            </h2>
            <p className="text-[15px] text-[var(--muted,#717c75)] mt-2">
              Did you use anything up? Tick it and we’ll take it out of your pantry.
            </p>

            <div className="mt-5 bg-[var(--surface,#fff)] border border-solid border-[var(--line,#eceeea)] rounded-[var(--r,22px)] overflow-hidden">
              {usedPantryItems.map((item, i) => {
                const on = !!usedUp[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => setUsedUp(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    className="w-full text-left bg-transparent border-none cursor-pointer flex items-center gap-[13px] p-[14px_16px]"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line,#eceeea)' }}
                  >
                    <span
                      className="w-[24px] h-[24px] flex-none rounded-[8px] border-2 flex items-center justify-center"
                      style={{
                        borderColor: on ? 'var(--accent,#15a85b)' : 'var(--line,#cfd6cd)',
                        backgroundColor: on ? 'var(--accent,#15a85b)' : 'transparent',
                      }}
                    >
                      {on && <span className="material-symbols-outlined" style={{ fontSize: '17px', color: '#fff' }}>check</span>}
                    </span>
                    <span className="flex-1 font-bold text-[15.5px] text-[var(--text,#15201a)] truncate">{item.name}</span>
                    <span className="text-[13px] text-[var(--muted,#717c75)]">{item.qty}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-[16px_22px_30px] flex gap-3 flex-none">
            <button
              onClick={() => { onClose(); toast('Nice work — enjoy your meal!'); }}
              className="h-[58px] px-6 rounded-full border border-[var(--line,#eceeea)] bg-[var(--surface,#fff)] font-bold text-[16px] text-[var(--text,#15201a)] cursor-pointer"
            >
              Skip
            </button>
            <button
              onClick={handleSavePantry}
              className="flex-1 h-[58px] border-none rounded-full bg-[var(--accent,#15a85b)] text-white font-bold text-[17px] cursor-pointer flex items-center justify-center gap-[8px]"
            >
              Update pantry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-30 bg-transparent lg:bg-black/40 flex items-center justify-center animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full h-full lg:max-w-xl lg:h-[85%] lg:rounded-[26px] lg:shadow-2xl bg-[var(--bg,#fff)] flex flex-col justify-between"
      >
        {/* Top Header */}
        <div className="p-[14px_22px_0] flex items-center justify-between flex-none">
          <button
            onClick={onClose}
            className="w-[42px] h-[42px] rounded-full border border-[var(--line,#eceeea)] bg-[var(--surface,#fff)] cursor-pointer flex items-center justify-center active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--text,#15201a)' }}>
              close
            </span>
          </button>
          <span className="text-[14.5px] font-bold truncate max-w-[200px] text-[var(--text,#15201a)]">
            {recipe.recipeName}
          </span>
          <div className="w-[42px]" />
        </div>

        {/* Progress Section */}
        <div className="p-[18px_22px_0] flex-none">
          <div className="flex justify-between text-[13px] font-bold text-[var(--muted,#717c75)] mb-2">
            <span>Step {currentStep + 1} of {total}</span>
            <span>{pct}</span>
          </div>
          <div className="h-[6px] rounded-full bg-[var(--surface-2,#f5f8f4)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent,#15a85b)] transition-all duration-350"
              style={{ width: pct }}
            />
          </div>
        </div>

        {/* Big Step Number and Content Area */}
        <div className="flex-1 min-h-0 flex flex-col justify-center px-[30px] py-[18px] animate-pop-in">
          <div className="font-head text-[64px] font-extrabold text-[var(--accent-soft,#e6f4ec)] leading-none mb-4">
            {bigStepNum}
          </div>

          {/* Running timer for steps that need one */}
          {hasTimer && timerTotal > 0 && (
            <div className="mb-4 self-start flex items-center gap-[8px]">
              <button
                onClick={toggleTimer}
                style={{
                  backgroundColor: remaining === 0 ? '#fdecd9' : running ? 'var(--accent,#15a85b)' : 'var(--accent-soft,#e6f4ec)',
                  color: remaining === 0 ? '#b45f12' : running ? '#fff' : 'var(--accent-ink,#0d7a41)',
                }}
                className="inline-flex items-center gap-[8px] p-[10px_18px] rounded-full font-bold text-[17px] border-none cursor-pointer tabular-nums active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '21px' }}>
                  {remaining === 0 ? 'alarm' : running ? 'pause' : 'play_arrow'}
                </span>
                {remaining === 0 ? 'Time’s up' : formatTime(remaining)}
              </button>
              {(running || remaining !== timerTotal) && (
                <button
                  onClick={resetTimer}
                  aria-label="Reset timer"
                  className="w-[40px] h-[40px] rounded-full border border-[var(--line,#eceeea)] bg-[var(--surface,#fff)] cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[var(--muted,#717c75)]" style={{ fontSize: '20px' }}>restart_alt</span>
                </button>
              )}
            </div>
          )}

          <p className="text-[24px] leading-[1.42] font-semibold text-[var(--text,#15201a)] tracking-[-0.2px]">
            {stepText}
          </p>
        </div>

        {/* Navigation Footer */}
        <div className="p-[16px_22px_30px] flex gap-3 flex-none bg-[var(--bg,#fff)]">
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            style={{ opacity: currentStep === 0 ? 0.4 : 1 }}
            className="w-[58px] h-[58px] flex-none rounded-full border border-[var(--line,#eceeea)] bg-[var(--surface,#fff)] cursor-pointer flex items-center justify-center active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--text,#15201a)' }}>
              arrow_back
            </span>
          </button>

          {/* Next/Finish Button */}
          <button
            onClick={handleNext}
            className="flex-1 h-[58px] border-none rounded-full bg-[var(--accent,#15a85b)] text-white font-bold text-[17px] cursor-pointer flex items-center justify-center gap-[8px] hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(21,168,91,0.2)]"
          >
            {currentStep === total - 1 ? 'Finish' : 'Next step'}
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              {currentStep === total - 1 ? 'check' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
