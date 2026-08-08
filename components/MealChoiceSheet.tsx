import React from 'react';

interface MealChoiceSheetProps {
  day: string;
  slot: 'Lunch' | 'Dinner';
  currentType: 'recipe' | 'order-in' | 'eat-out' | null;
  onCook: () => void;
  onOrderIn: () => void;
  onEatOut: () => void;
  onRemove: () => void;
  onClose: () => void;
}

const DAY_NAMES: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};

export const MealChoiceSheet: React.FC<MealChoiceSheetProps> = ({
  day,
  slot,
  currentType,
  onCook,
  onOrderIn,
  onEatOut,
  onRemove,
  onClose,
}) => {
  const options = [
    { key: 'cook', icon: 'skillet', title: 'Cook a recipe', sub: 'Pick from what you have', onClick: onCook },
    { key: 'order-in', icon: 'moped', title: 'Order in', sub: 'Mark this meal as delivery', onClick: onOrderIn },
    { key: 'eat-out', icon: 'dinner_dining', title: 'Eat out', sub: 'Mark this meal as dining out', onClick: onEatOut },
  ];

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 bg-[rgba(15,20,17,0.4)] flex items-end lg:items-center lg:justify-center animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full lg:max-w-md flex flex-col bg-[var(--bg,#fff)] rounded-t-[26px] lg:rounded-[26px] pt-[10px] pb-[10px] animate-sheet-up"
      >
        {/* Handle */}
        <div className="w-[38px] h-[5px] rounded-full bg-[var(--line,#eceeea)] mx-auto mb-3.5" />

        <div className="px-[22px] pb-[8px]">
          <h2 className="font-head text-[21px] font-bold text-[var(--text,#15201a)]">
            Plan {slot}
          </h2>
          <p className="text-[13.5px] text-[var(--muted,#717c75)] mt-[2px]">
            {DAY_NAMES[day] || day}
          </p>
        </div>

        <div className="px-[22px] pt-2 flex flex-col gap-[9px]">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={opt.onClick}
              className="w-full text-left cursor-pointer flex items-center gap-[13px] p-[11px] rounded-[15px] border border-[var(--line,#eceeea)] bg-[var(--surface,#fff)] hover:bg-[var(--surface-2,#f4f7f3)] transition-all"
            >
              <div className="w-[48px] h-[48px] flex-none rounded-[12px] bg-[var(--accent-soft,#e6f4ec)] flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--accent,#15a85b)' }}>
                  {opt.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[15.5px] text-[var(--text,#15201a)]">{opt.title}</div>
                <div className="text-[13px] text-[var(--muted,#717c75)]">{opt.sub}</div>
              </div>
              <span className="material-symbols-outlined text-[19px] text-[var(--muted,#9aa39c)] flex-none">
                chevron_right
              </span>
            </button>
          ))}

          {currentType && (
            <button
              onClick={onRemove}
              className="w-full text-center cursor-pointer p-[12px] mt-1 rounded-[15px] text-[14px] font-semibold text-[var(--muted,#9aa39c)] hover:text-[var(--text,#15201a)] bg-transparent border-none transition-all"
            >
              Remove plan for this meal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
