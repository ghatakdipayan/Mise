import React, { useMemo } from 'react';
import type { WeeklyPlan, Recipe, MealPlanEntry } from '../types';

interface PlanTabProps {
  weeklyPlan: WeeklyPlan;
  recipes: Recipe[];
  onSelectSlot: (day: string, slot: 'Lunch' | 'Dinner') => void;
  onSelectRecipe: (recipeName: string) => void;
  onClearSlot: (day: string, slot: 'Lunch' | 'Dinner') => void;
  onShopForWeek: () => void;
}

interface DayInfo {
  dow: string;
  date: number;
  monthLabel: string;
  showMonth: boolean;
  isToday: boolean;
}

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getThisWeek(): DayInfo[] {
  const today = new Date();
  const currentDow = today.getDay(); // 0 = Sun .. 6 = Sat
  const daysSinceMonday = (currentDow + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);

  const todayMonth = today.getMonth();

  return DOW_LABELS.map((dow, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      dow,
      date: d.getDate(),
      monthLabel: d.toLocaleDateString('en-US', { month: 'short' }),
      showMonth: d.getMonth() !== todayMonth,
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

const SLOT_META: Record<'recipe' | 'order-in' | 'eat-out', { icon: string; label: (entry: MealPlanEntry) => string }> = {
  'recipe': { icon: 'restaurant', label: (e) => (e.type === 'recipe' ? e.recipeName : '') },
  'order-in': { icon: 'moped', label: () => 'Order in' },
  'eat-out': { icon: 'dinner_dining', label: () => 'Eat out' },
};

export const PlanTab: React.FC<PlanTabProps> = ({
  weeklyPlan,
  recipes,
  onSelectSlot,
  onSelectRecipe,
  onClearSlot,
  onShopForWeek,
}) => {
  const weekDays = useMemo(getThisWeek, []);
  const weekdays = weekDays.slice(0, 5);
  const weekend = weekDays.slice(5, 7);

  const rangeLabel = (() => {
    const first = weekDays[0];
    const last = weekDays[6];
    if (first.monthLabel === last.monthLabel) {
      return `${first.monthLabel} ${first.date}–${last.date}`;
    }
    return `${first.monthLabel} ${first.date} – ${last.monthLabel} ${last.date}`;
  })();

  const renderDayCard = (day: DayInfo) => {
    const dayPlan = weeklyPlan[day.dow] || { Lunch: null, Dinner: null };

    return (
      <div
        key={day.dow}
        style={{
          borderColor: day.isToday ? 'var(--accent,#15a85b)' : 'var(--line,#eceeea)',
          backgroundColor: day.isToday ? 'var(--accent-soft,#e6f4ec)' : 'var(--surface,#fff)',
        }}
        className="border border-solid rounded-[var(--r,22px)] p-[15px_16px] flex flex-col shadow-sm"
      >
        {/* Day info */}
        <div className="flex items-center gap-[9px] mb-[11px]">
          <div
            style={{
              backgroundColor: day.isToday ? 'var(--accent,#15a85b)' : 'var(--surface-2,#f5f8f4)',
              color: day.isToday ? '#fff' : 'var(--text,#15201a)',
            }}
            className="w-[42px] h-[42px] flex-none rounded-[12px] flex flex-col items-center justify-center"
          >
            <span className="text-[10.5px] font-bold tracking-[0.5px] uppercase leading-none mb-0.5">
              {day.dow}
            </span>
            <span className="text-[18px] font-extrabold leading-tight">{day.date}</span>
          </div>
          <div className="flex flex-col">
            {day.isToday && (
              <span className="text-[12px] font-bold text-[var(--accent,#15a85b)] bg-[var(--accent-soft,#e6f4ec)] px-2.5 py-1 rounded-full border border-[var(--accent,#15a85b)]/20 shadow-sm w-fit">
                Today
              </span>
            )}
            {day.showMonth && !day.isToday && (
              <span className="text-[12px] font-semibold text-[var(--muted,#9aa39c)]">
                {day.monthLabel}
              </span>
            )}
          </div>
        </div>

        {/* Slots */}
        <div className="flex flex-col gap-2">
          {(['Lunch', 'Dinner'] as const).map((slot) => {
            const entry = dayPlan[slot];
            const recipe = entry?.type === 'recipe' ? recipes.find(r => r.recipeName === entry.recipeName) : null;

            if (!entry) {
              return (
                <button
                  key={slot}
                  onClick={() => onSelectSlot(day.dow, slot)}
                  style={{ backgroundColor: 'var(--surface-2,#f5f8f4)' }}
                  className="text-left cursor-pointer w-full flex items-center gap-[11px] p-[9px_11px] rounded-[13px] border border-solid border-transparent hover:opacity-90 active:scale-[0.99] transition-all"
                >
                  <span className="text-[11px] font-bold tracking-[0.5px] uppercase text-[var(--muted,#717c75)] w-[42px] flex-none">
                    {slot}
                  </span>
                  <span className="flex-1 text-[14.5px] text-[var(--muted,#717c75)]">Add a meal</span>
                  <span className="material-symbols-outlined text-[19px] text-[var(--muted,#717c75)] flex-none">
                    add
                  </span>
                </button>
              );
            }

            const meta = SLOT_META[entry.type];
            const recipeName = entry.type === 'recipe' ? entry.recipeName : null;
            const label = recipeName ?? meta.label(entry);

            return (
              <div
                key={slot}
                style={{ borderColor: 'var(--line,#eceeea)', backgroundColor: 'var(--surface,#fff)' }}
                className="w-full flex items-center gap-[11px] p-[9px_11px] rounded-[13px] border border-solid"
              >
                <span className="text-[11px] font-bold tracking-[0.5px] uppercase text-[var(--muted,#717c75)] w-[42px] flex-none">
                  {slot}
                </span>
                <button
                  onClick={() => (recipe && recipeName ? onSelectRecipe(recipeName) : onSelectSlot(day.dow, slot))}
                  className="flex-1 min-w-0 flex items-center gap-[8px] text-left cursor-pointer bg-transparent border-none p-0"
                >
                  <span className="flex-1 text-[15px] font-bold text-[var(--text,#15201a)] truncate">
                    {label}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[var(--accent,#15a85b)] flex-none">
                    {meta.icon}
                  </span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onClearSlot(day.dow, slot); }}
                  className="flex-none w-[22px] h-[22px] rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer text-[var(--muted,#9aa39c)] hover:text-[var(--text,#15201a)] hover:bg-[var(--surface-2,#f4f7f3)] transition-all"
                  aria-label="Remove"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-[6px_22px_120px] animate-fade-in flex flex-col min-h-0">
      {/* Header */}
      <div className="pt-2">
        <h1 className="font-head text-[28px] font-bold tracking-[-0.4px] text-[var(--text,#15201a)]">
          This week
        </h1>
        <p className="text-[14.5px] text-[var(--muted,#717c75)] mt-[3px]">
          {rangeLabel} · Tap a slot to plan
        </p>
        <button
          onClick={onShopForWeek}
          className="mt-4 w-full h-[50px] rounded-[14px] border border-solid border-[var(--accent,#15a85b)] bg-[var(--accent-soft,#e6f4ec)] text-[var(--accent-ink,#0d7a41)] font-bold text-[15px] cursor-pointer flex items-center justify-center gap-[8px] active:scale-[0.99] transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
          Shop for this week’s meals
        </button>
      </div>

      {/* Weekdays swimlane */}
      <div className="mt-6">
        <h2 className="text-[13px] font-extrabold uppercase tracking-[0.6px] text-[var(--muted,#9aa39c)] mb-2.5">
          Weekdays
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[13px]">
          {weekdays.map(renderDayCard)}
        </div>
      </div>

      {/* Weekend swimlane */}
      <div className="mt-7">
        <h2 className="text-[13px] font-extrabold uppercase tracking-[0.6px] text-[var(--muted,#9aa39c)] mb-2.5">
          Weekend
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[13px]">
          {weekend.map(renderDayCard)}
        </div>
      </div>
    </div>
  );
};
