import React from 'react';
import type { AppTheme, FoodPreferences } from '../types';
import { ALLERGY_OPTIONS, DIET_OPTIONS } from '../utils/pantry';

interface AppearanceSheetProps {
  activeTheme: string;
  onSelectTheme: (themeKey: string) => void;
  onClose: () => void;
  themes: Record<string, AppTheme>;
  onSignOut?: () => void;
  preferences: FoodPreferences;
  onChangePreferences: (prefs: FoodPreferences) => void;
}

export const AppearanceSheet: React.FC<AppearanceSheetProps> = ({
  activeTheme,
  onSelectTheme,
  onClose,
  themes,
  onSignOut,
  preferences,
  onChangePreferences,
}) => {
  const toggle = (key: keyof FoodPreferences, value: string) => {
    const current = preferences[key];
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    onChangePreferences({ ...preferences, [key]: next });
  };

  const chip = (key: keyof FoodPreferences, value: string) => {
    const on = preferences[key].includes(value);
    return (
      <button
        key={value}
        onClick={() => toggle(key, value)}
        aria-pressed={on}
        style={{
          borderColor: on ? 'var(--accent,#15a85b)' : 'var(--line,#eceeea)',
          backgroundColor: on ? 'var(--accent-soft,#e6f4ec)' : 'var(--surface,#fff)',
          color: on ? 'var(--accent-ink,#0d7a41)' : 'var(--text,#15201a)',
        }}
        className="px-[13px] py-[8px] rounded-full border border-solid text-[14px] font-semibold cursor-pointer flex items-center gap-[4px]"
      >
        {on && <span className="material-symbols-outlined text-[16px]">check</span>}
        {value}
      </button>
    );
  };

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 bg-[rgba(15,20,17,0.4)] flex items-end lg:items-center lg:justify-center animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full lg:max-w-md max-h-[90%] overflow-y-auto ppl-scroll bg-[var(--bg,#fff)] rounded-t-[26px] lg:rounded-[26px] p-[10px_22px_30px] animate-sheet-up"
      >
        {/* Handle */}
        <div className="w-[38px] h-[5px] rounded-full bg-[var(--line,#eceeea)] mx-auto mb-4" />

        <h2 className="font-head text-[22px] font-bold text-[var(--text,#15201a)]">Appearance</h2>
        <p className="text-[14px] text-[var(--muted,#717c75)] mt-[3px]">Try a different look for Mise</p>

        <div className="mt-[18px] flex flex-col gap-[11px]">
          {Object.entries(themes).map(([id, t]: [string, AppTheme]) => {
            const isSelected = activeTheme === id;
            return (
              <button
                key={id}
                onClick={() => onSelectTheme(id)}
                style={{
                  borderColor: isSelected ? 'var(--accent,#15a85b)' : 'var(--line,#eceeea)',
                  backgroundColor: isSelected ? 'var(--accent-soft,#e6f4ec)' : 'var(--surface,#fff)',
                }}
                className="w-full text-left cursor-pointer flex items-center gap-[14px] p-[13px_14px] rounded-[16px] border-2 transition-all"
              >
                {/* Theme Color Swatches */}
                <div className="flex gap-[4px] flex-none">
                  <span className="w-[26px] h-[38px] rounded-[7px]" style={{ backgroundColor: t.sw[0] }} />
                  <span className="w-[26px] h-[38px] rounded-[7px]" style={{ backgroundColor: t.sw[1] }} />
                  <span className="w-[26px] h-[38px] rounded-[7px] border border-black/5" style={{ backgroundColor: t.sw[2] }} />
                </div>

                {/* Theme Description */}
                <div className="flex-1">
                  <div className="font-bold text-[16px] text-[var(--text,#15201a)]">{t.name}</div>
                  <div className="text-[13px] text-[var(--muted,#717c75)] mt-[1px]">{t.desc}</div>
                </div>

                {/* Checkbox radio icon */}
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '24px',
                    color: isSelected ? 'var(--accent,#15a85b)' : 'var(--line,#cfd6cd)',
                  }}
                >
                  {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Food preferences: steer AI Chef and flag clashing recipes */}
        <h2 className="font-head text-[22px] font-bold text-[var(--text,#15201a)] mt-7">Food preferences</h2>
        <p className="text-[14px] text-[var(--muted,#717c75)] mt-[3px]">
          AI Chef follows these, and recipes that clash are flagged.
        </p>
        <div className="text-[13px] font-bold tracking-[0.6px] uppercase text-[var(--muted,#717c75)] mt-4 mb-[8px]">Diet</div>
        <div className="flex flex-wrap gap-[8px]">{DIET_OPTIONS.map(d => chip('diets', d))}</div>
        <div className="text-[13px] font-bold tracking-[0.6px] uppercase text-[var(--muted,#717c75)] mt-4 mb-[8px]">Allergies</div>
        <div className="flex flex-wrap gap-[8px]">{ALLERGY_OPTIONS.map(a => chip('allergies', a))}</div>

        {onSignOut && (
          <button
            onClick={() => {
              onSignOut();
              onClose();
            }}
            className="w-full h-12 mt-6 border border-solid border-red-100 hover:border-red-200 rounded-xl bg-red-50/50 hover:bg-red-50 text-red-600 font-bold text-[14.5px] cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[19px]">logout</span>
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
};
