import React from 'react';
import type { Recipe, FoodPreferences } from '../types';
import { hasIngredient, preferenceConflicts } from '../utils/pantry';

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
  onStartCook: () => void;
  pantryItems: string[]; // List of existing lowercase pantry names
  onAddToList: (name: string, silent?: boolean) => void;
  toast: (msg: string) => void;
  preferences: FoodPreferences;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  onClose,
  onStartCook,
  pantryItems,
  onAddToList,
  toast,
  preferences,
}) => {
  const conflicts = preferenceConflicts(recipe.ingredients, preferences);
  // Check ingredient status dynamically
  const parsedIngredients = recipe.ingredients.map(name => {
    const isHave = hasIngredient(name, pantryItems);
    return {
      name,
      have: isHave,
      missing: !isHave,
    };
  });

  const total = parsedIngredients.length;
  const haveCount = parsedIngredients.filter(i => i.have).length;
  const missingCount = total - haveCount;
  const isReady = haveCount === total;

  const handleAddAllMissing = () => {
    const missing = parsedIngredients.filter(i => i.missing).map(i => i.name);
    missing.forEach(name => onAddToList(name, true));
    toast(`${missing.length} items added to your list`);
  };

  // Recipe steps parsing
  const steps = recipe.instructions.map((text, idx) => ({
    n: idx + 1,
    text: text.split('|')[0], // Trim timer if it's there
  }));

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
    <div
      onClick={onClose}
      className="absolute inset-0 z-20 bg-transparent lg:bg-black/40 flex items-center justify-center animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ppl-scroll relative w-full h-full lg:max-w-3xl lg:h-[90%] bg-[var(--bg,#fff)] lg:rounded-[26px] lg:shadow-2xl overflow-y-auto"
      >
      {/* Top Banner (Photo placeholder) */}
      <div className="h-[280px] relative bg-[var(--accent-soft,#e6f4ec)] display-flex items-center justify-center overflow-hidden flex items-center">
        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 18px, rgba(20,30,24,0.04) 18px 19px)' }} />
        <span
          className="material-symbols-outlined mx-auto"
          style={{
            fontSize: '78px',
            color: 'var(--accent,#15a85b)',
            opacity: 0.4,
            fontVariationSettings: "'wght' 250",
          }}
        >
          {getRecipeIcon(recipe.recipeName)}
        </span>
        <div className="absolute left-[18px] bottom-3.5 font-mono text-[10px] text-[var(--accent-ink,#0d7a41)] opacity-[0.45]">
          dish photo
        </div>

        {/* Back and Bookmark Buttons */}
        <button
          onClick={onClose}
          className="absolute top-3.5 left-[18px] w-[42px] h-[42px] rounded-full border-none cursor-pointer bg-white/92 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.1)] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '23px', color: 'var(--text,#15201a)' }}>
            arrow_back
          </span>
        </button>
        <button className="absolute top-3.5 right-[18px] w-[42px] h-[42px] rounded-full border-none cursor-pointer bg-white/92 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.1)] active:scale-95 transition-all">
          <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--text,#15201a)' }}>
            bookmark
          </span>
        </button>
      </div>

      {/* Main Details Body */}
      <div className="p-[22px_24px_150px]">
        {/* Tags */}
        <div className="flex gap-[7px] flex-wrap">
          {difficultyLevel(recipe.cookingTime) === 'Easy' && (
            <span className="text-[12.5px] font-bold text-[var(--accent-ink,#0d7a41)] bg-[var(--accent-soft,#e6f4ec)] p-[4px_11px] rounded-full">
              Quick
            </span>
          )}
          <span className="text-[12.5px] font-bold text-[var(--accent-ink,#0d7a41)] bg-[var(--accent-soft,#e6f4ec)] p-[4px_11px] rounded-full">
            Dinner
          </span>
        </div>

        <h1 className="font-head text-[30px] font-bold tracking-[-0.5px] mt-[13px] leading-[1.1] text-[var(--text,#15201a)]">
          {recipe.recipeName}
        </h1>

        {/* Recipe Stats Card */}
        <div className="flex gap-0 mt-[18px] bg-[var(--surface-2,#f5f8f4)] rounded-[16px] p-1">
          <div className="flex-1 text-center py-[11px]">
            <div className="material-symbols-outlined" style={{ fontSize: '21px', color: 'var(--accent,#15a85b)' }}>
              schedule
            </div>
            <div className="text-[16px] font-bold mt-[3px] text-[var(--text,#15201a)]">{recipe.cookingTime}m</div>
            <div className="text-[11.5px] text-[var(--muted,#717c75)]">time</div>
          </div>
          <div className="flex-1 text-center py-[11px] border-l border-r border-[var(--line,#eceeea)]">
            <div className="material-symbols-outlined" style={{ fontSize: '21px', color: 'var(--accent,#15a85b)' }}>
              group
            </div>
            <div className="text-[16px] font-bold mt-[3px] text-[var(--text,#15201a)]">2 servings</div>
            <div className="text-[11.5px] text-[var(--muted,#717c75)]">servings</div>
          </div>
          <div className="flex-1 text-center py-[11px]">
            <div className="material-symbols-outlined" style={{ fontSize: '21px', color: 'var(--accent,#15a85b)' }}>
              local_fire_department
            </div>
            <div className="text-[16px] font-bold mt-[3px] text-[var(--text,#15201a)]">
              {difficultyLevel(recipe.cookingTime)}
            </div>
            <div className="text-[11.5px] text-[var(--muted,#717c75)]">level</div>
          </div>
        </div>

        {/* Diet and allergy warning */}
        {conflicts.length > 0 && (
          <div className="mt-[20px] flex gap-[10px] items-start rounded-[14px] border border-solid border-[#f1c9c0] bg-[#fdf1ee] p-[12px_14px]">
            <span className="material-symbols-outlined text-[#c0442b] text-[21px] flex-none">warning</span>
            <div className="min-w-0">
              <div className="font-bold text-[14px] text-[#9a3420]">Check your preferences</div>
              {conflicts.map(c => (
                <div key={c} className="text-[13px] text-[#9a3420] mt-[2px]">{c}</div>
              ))}
            </div>
          </div>
        )}

        {/* Ingredients Header */}
        <div className="flex justify-between items-baseline mt-[26px]">
          <h2 className="font-head text-[20px] font-bold text-[var(--text,#15201a)]">Ingredients</h2>
          <span
            className="text-[14px] font-semibold"
            style={{ color: isReady ? 'var(--accent,#15a85b)' : '#c4701f' }}
          >
            {haveCount} of {total} in pantry
          </span>
        </div>

        {/* Ingredients list */}
        <div className="mt-3 flex flex-col gap-[9px]">
          {parsedIngredients.map((ing, idx) => (
            <div
              key={idx}
              className="flex items-center gap-[13px] p-[12px_15px] rounded-[14px] border transition-all"
              style={{
                backgroundColor: ing.have ? 'var(--surface,#fff)' : '#fffaf2',
                borderColor: ing.have ? 'var(--line,#eceeea)' : '#f1e3cd',
              }}
            >
              {/* Check/Add Icon */}
              <span
                className="w-[26px] h-[26px] flex-none rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: ing.have ? 'var(--accent-soft,#e6f4ec)' : '#fbeede',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '17px',
                    color: ing.have ? 'var(--accent,#15a85b)' : '#c4701f',
                    fontVariationSettings: "'wght' 600",
                  }}
                >
                  {ing.have ? 'check' : 'add'}
                </span>
              </span>

              <span className="flex-1 text-[15.5px] font-bold text-[var(--text,#15201a)]">{ing.name}</span>

              {ing.have ? (
                <span className="text-[13px] font-semibold text-[var(--accent,#15a85b)]">In pantry</span>
              ) : (
                <button
                  onClick={() => {
                    onAddToList(ing.name);
                    toast(`${ing.name} added to your list`);
                  }}
                  className="font-sans cursor-pointer text-[13px] font-bold text-[#c4701f] bg-[#fff4e3] border-none p-[6px_12px] rounded-full active:scale-95 transition-all"
                >
                  Add to list
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add all missing button */}
        {missingCount > 0 && (
          <button
            onClick={handleAddAllMissing}
            className="mt-3.5 w-full h-[50px] rounded-[14px] border-[1.5px] border-[var(--line,#eceeea)] bg-[var(--surface,#fff)] cursor-pointer text-[15px] font-bold text-[var(--text,#15201a)] flex items-center justify-center gap-2 hover:bg-[var(--surface-2,#f5f8f4)] active:scale-98 transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              add_shopping_cart
            </span>
            Add {missingCount} missing to shopping list
          </button>
        )}

        {/* Cooking Method */}
        <h2 className="font-head text-[20px] font-bold mt-7 text-[var(--text,#15201a)]">Method</h2>
        <div className="mt-3.5 flex flex-col gap-4">
          {steps.map((st) => (
            <div key={st.n} className="flex gap-3.5">
              <div className="w-[30px] h-[30px] flex-none rounded-full bg-[var(--accent-soft,#e6f4ec)] text-[var(--accent-ink,#0d7a41)] flex items-center justify-center font-extrabold text-[14px]">
                {st.n}
              </div>
              <p className="flex-1 text-[15.5px] leading-[1.5] pt-[3px] text-[var(--text,#15201a)]">
                {st.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Start Cooking Floating Button */}
      <div className="absolute bottom-0 left-0 right-0 p-[14px_22px_28px] bg-gradient-to-t from-[var(--bg,#fff)] via-[var(--bg,#fff)]/80 to-transparent pointer-events-none flex justify-center">
        <button
          onClick={onStartCook}
          className="pointer-events-auto w-full h-[58px] border-none rounded-full bg-[var(--accent,#15a85b)] text-white font-bold text-[17px] cursor-pointer flex items-center justify-center gap-[9px] shadow-[0_12px_26px_-8px_var(--accent,#15a85b)] hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
            soup_kitchen
          </span>
          Start cooking
        </button>
      </div>
    </div>
  </div>
  );
};
