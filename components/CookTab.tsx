import React, { useState } from 'react';
import type { Recipe } from '../types';

interface CookTabProps {
  recipes: Recipe[];
  onSelectRecipe: (recipeName: string) => void;
  onOpenAppearance: () => void;
  pantryItems: string[]; // List of existing lowercase pantry names
  onGenerateRecipes: () => Promise<void>;
  isGenerating: boolean;
  userAvatar?: string;
}

type FilterKey = 'all' | 'ready' | 'almost' | 'quick' | 'breakfast';

export const CookTab: React.FC<CookTabProps> = ({
  recipes,
  onSelectRecipe,
  onOpenAppearance,
  pantryItems,
  onGenerateRecipes,
  isGenerating,
  userAvatar,
}) => {
  const [filter, setFilter] = useState<FilterKey>('all');

  // Greeting based on time
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning, Jordan';
    if (hours < 18) return 'Good afternoon, Jordan';
    return 'Good evening, Jordan';
  };

  // Format date: "Wednesday, 20 June" (or current date in 2026)
  const getFormattedDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
  };

  // Helper to calculate recipe completeness dynamically
  const rmeta = (r: Recipe) => {
    const total = r.ingredients.length;
    const have = r.ingredients.filter(ing => 
      pantryItems.includes(ing.toLowerCase())
    ).length;
    const missing = total - have;
    return {
      total,
      have,
      missing,
      ready: have === total,
    };
  };

  const recipeMetas = recipes.map(r => ({
    r,
    meta: rmeta(r),
  }));

  const readyCount = recipeMetas.filter(x => x.meta.ready).length;
  const almostCount = recipeMetas.filter(x => x.meta.missing === 1).length;

  const filters: { id: FilterKey; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'ready', label: 'Ready to cook' },
    { id: 'almost', label: 'Almost there' },
    { id: 'quick', label: 'Under 15 min' },
    { id: 'breakfast', label: 'Breakfast' },
  ];

  let filteredMetas = recipeMetas.slice();
  if (filter === 'ready') {
    filteredMetas = filteredMetas.filter(x => x.meta.ready);
  } else if (filter === 'almost') {
    filteredMetas = filteredMetas.filter(x => x.meta.missing >= 1);
  } else if (filter === 'quick') {
    filteredMetas = filteredMetas.filter(x => x.r.cookingTime <= 15);
  } else if (filter === 'breakfast') {
    filteredMetas = filteredMetas.filter(x => 
      x.r.recipeName.toLowerCase().includes('scramble') || 
      x.r.recipeName.toLowerCase().includes('toast') ||
      x.r.recipeName.toLowerCase().includes('omelette')
    );
  }

  // Sort by lowest missing ingredients first
  filteredMetas.sort((a, b) => a.meta.missing - b.meta.missing);

  // Icon mapping helper
  const getRecipeIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('spaghetti') || t.includes('pasta') || t.includes('noodle')) return 'ramen_dining';
    if (t.includes('salmon') || t.includes('chicken') || t.includes('meat')) return 'set_meal';
    if (t.includes('egg') || t.includes('scramble') || t.includes('omelette')) return 'egg_alt';
    if (t.includes('toast') || t.includes('sourdough')) return 'lunch_dining';
    if (t.includes('chickpea') || t.includes('bowl') || t.includes('salad')) return 'rice_bowl';
    return 'skillet';
  };

  const difficultyLevel = (time: number) => {
    if (time <= 15) return 'Easy';
    if (time <= 30) return 'Medium';
    return 'Hard';
  };

  return (
    <div className="p-[6px_22px_120px] animate-fade-in flex flex-col min-h-0">
      {/* Header bar */}
      <div className="flex justify-between items-start pt-2">
        <div>
          <div className="text-[14px] text-[var(--muted,#717c75)] font-semibold mb-1">
            {getFormattedDate()}
          </div>
          <h1 className="font-head text-[28px] font-bold tracking-[-0.4px] text-[var(--text,#15201a)]">
            {getGreeting()}
          </h1>
        </div>
        <button
          onClick={onOpenAppearance}
          className="w-[46px] h-[46px] flex-none rounded-full border border-[var(--line,#eceeea)] bg-[var(--surface,#fff)] cursor-pointer flex items-center justify-center font-head text-[17px] font-extrabold text-[var(--accent,#15a85b)] active:scale-95 transition-all shadow-sm lg:hidden"
        >
          {userAvatar || 'JM'}
        </button>
      </div>

      {/* Overview Status Banner and AI Generator Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        {/* Overview Status Banner */}
        <div className="bg-[var(--accent,#15a85b)] rounded-[var(--r,22px)] p-[22px_22px_20px] text-white relative overflow-hidden shadow-[0_10px_20px_-5px_rgba(21,168,91,0.25)]">
          <div className="absolute right-[-26px] top-[-26px] w-[140px] h-[140px] rounded-full bg-white/10" />
          <div className="absolute right-[24px] bottom-[-30px] w-[90px] h-[90px] rounded-full bg-white/8" />
          <span className="material-symbols-outlined text-[26px] opacity-90">restaurant_menu</span>
          <div className="text-[40px] font-extrabold tracking-[-1px] mt-1.5 leading-none">
            {readyCount} {readyCount === 1 ? 'recipe' : 'recipes'}
          </div>
          <div className="text-[16px] opacity-[0.92] mt-1.5 font-semibold">
            you can cook right now — nothing to buy
          </div>
          <div className="mt-4 inline-flex items-center gap-[6px] bg-white/18 p-[7px_13px] rounded-full text-[13.5px] font-bold">
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            {almostCount} more with 1 item
          </div>
        </div>

        {/* AI Recipe Generator Card */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[var(--r,22px)] p-5 text-white flex flex-col gap-3.5 shadow-[0_10px_20px_-5px_rgba(20,180,140,0.25)] relative overflow-hidden">
          <div className="absolute right-[-15px] bottom-[-20px] opacity-10">
            <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>
              temp_preferences_custom
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined" style={{ color: '#FFD700', fontSize: '24px' }}>
              cognition
            </span>
            <span className="font-bold tracking-[1.5px] text-[12px] uppercase text-emerald-100">
              Powered by Gemini
            </span>
          </div>
          <div>
            <h3 className="font-head text-[20px] font-extrabold leading-tight">Create Custom AI Recipes</h3>
            <p className="text-[13.5px] text-emerald-50 mt-1 opacity-90">
              Let the AI Chef study your pantry and whip up custom options matching your exact tastes.
            </p>
          </div>
          <button
            onClick={onGenerateRecipes}
            disabled={isGenerating}
            className="h-11 bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-xl text-[14.5px] border-none cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.98] w-full mt-1.5 shadow"
          >
            {isGenerating ? (
              <>
                <div className="w-[18px] h-[18px] border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
                Checking fridge pantry...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  auto_awesome
                </span>
                Ask AI Chef to Generate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Horizontal filters */}
      <div className="ppl-scroll mt-5 -mx-[22px] px-[22px] flex gap-[9px] overflow-x-auto whitespace-nowrap scrollbar-hide py-1">
        {filters.map((f) => {
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                backgroundColor: isActive ? 'var(--accent,#15a85b)' : 'var(--surface,#fff)',
                color: isActive ? '#fff' : 'var(--text,#15201a)',
                borderColor: isActive ? 'var(--accent,#15a85b)' : 'var(--line,#eceeea)',
              }}
              className="flex-none h-[38px] px-[17px] rounded-full font-sans text-[14.5px] font-semibold cursor-pointer border border-solid transition-all active:scale-95 shadow-sm"
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Recipes list container */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMetas.map(({ r, meta }, idx) => (
          <button
            key={idx}
            onClick={() => onSelectRecipe(r.recipeName)}
            className="text-left border border-solid border-[var(--line,#eceeea)] bg-[var(--surface,#fff)] rounded-[var(--r,22px)] overflow-hidden cursor-pointer p-0 hover:shadow-md transition-all active:scale-[0.99] flex flex-col"
          >
            {/* Cover image placeholder */}
            <div className="h-[158px] relative bg-[var(--accent-soft,#e6f4ec)] overflow-hidden flex items-center justify-center w-full">
              <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 16px, rgba(20,30,24,0.035) 16px 17px)' }} />
              <span
                className="material-symbols-outlined text-[48px] color-[var(--accent,#15a85b)] opacity-40 mx-auto"
                style={{
                  color: 'var(--accent,#15a85b)',
                  fontVariationSettings: "'wght' 300",
                }}
              >
                {getRecipeIcon(r.recipeName)}
              </span>
              <div className="absolute left-[12px] bottom-[10px] font-mono text-[9.5px] tracking-[0.4px] text-[var(--accent-ink,#0d7a41)] opacity-[0.45]">
                dish photo
              </div>

              {/* Status badges */}
              {meta.ready ? (
                <div className="absolute top-3 left-3 flex items-center gap-[4px] bg-[var(--accent,#15a85b)] text-white text-[12.5px] font-bold p-[5px_11px_5px_8px] rounded-full shadow-sm">
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Ready
                </div>
              ) : (
                <div className="absolute top-3 left-3 bg-white text-[#b4791f] text-[12.5px] font-bold p-[5px_11px] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  Need {meta.missing}
                </div>
              )}

              {/* Bookmark */}
              <div className="absolute top-2.5 right-2.5 w-[34px] h-[34px] rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-[var(--text,#15201a)]">
                  bookmark
                </span>
              </div>
            </div>

            {/* Info details */}
            <div className="p-[14px_16px_16px] w-full">
              <h3 className="font-head text-[18.5px] font-bold tracking-[-0.3px] leading-[1.2] text-[var(--text,#15201a)]">
                {r.recipeName}
              </h3>
              <div className="flex gap-[14px] mt-[9px] text-[var(--muted,#717c75)] text-[13.5px] font-semibold">
                <span className="flex items-center gap-[4px]">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {r.cookingTime} min
                </span>
                <span className="flex items-center gap-[4px]">
                  <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                  {difficultyLevel(r.cookingTime)}
                </span>
                <span className="flex items-center gap-[4px]">
                  <span className="material-symbols-outlined text-[16px]">grocery</span>
                  {meta.have}/{meta.total} have
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
