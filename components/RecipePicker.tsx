import React from 'react';
import { hasIngredient } from '../utils/pantry';
import type { Recipe } from '../types';

interface RecipePickerProps {
  pickerSlot: string;
  recipes: Recipe[];
  onPick: (recipeId: string) => void;
  onClose: () => void;
  pantryItems: string[]; // List of lowercase ingredient names in pantry
}

export const RecipePicker: React.FC<RecipePickerProps> = ({
  pickerSlot,
  recipes,
  onPick,
  onClose,
  pantryItems,
}) => {
  // Helper to calculate recipe metadata locally
  const rmeta = (r: Recipe) => {
    const total = r.ingredients.length;
    const have = r.ingredients.filter(ing => hasIngredient(ing, pantryItems)).length;
    const missing = total - have;
    return {
      total,
      have,
      missing,
      ready: have === total,
    };
  };

  const pickerRecipes = recipes.map(r => {
    const meta = rmeta(r);
    return {
      id: r.recipeName, // using recipeName as a unique ID for simulation
      title: r.recipeName,
      // Default icon mapping if none is defined
      icon: 'ramen_dining',
      time: r.cookingTime,
      ready: meta.ready,
      haveLabel: meta.ready ? 'ready to cook' : `need ${meta.missing}`,
    };
  }).sort((a, b) => (a.ready === b.ready ? 0 : a.ready ? -1 : 1));

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 bg-[rgba(15,20,17,0.4)] flex items-end lg:items-center lg:justify-center animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-h-[72%] lg:max-h-[85%] lg:max-w-md flex flex-col bg-[var(--bg,#fff)] rounded-t-[26px] lg:rounded-[26px] pt-[10px] animate-sheet-up"
      >
        {/* Handle */}
        <div className="w-[38px] h-[5px] rounded-full bg-[var(--line,#eceeea)] mx-auto mb-3.5" />

        <div className="px-[22px] pb-[8px]">
          <h2 className="font-head text-[21px] font-bold">Plan {pickerSlot}</h2>
          <p className="text-[13.5px] text-[var(--muted,#717c75)] mt-[2px]">Pick something you can make</p>
        </div>

        {/* Recipe Picker List */}
        <div className="ppl-scroll flex-1 min-h-0 overflow-y-auto px-[22px] pb-[26px]">
          <div className="flex flex-col gap-[9px]">
            {pickerRecipes.map((r, idx) => (
              <button
                key={idx}
                onClick={() => onPick(r.title)}
                className="w-full text-left cursor-pointer flex items-center gap-[13px] p-[11px] rounded-[15px] border border-[var(--line,#eceeea)] bg-[var(--surface,#fff)] hover:bg-[var(--surface-2,#f4f7f3)] transition-all"
              >
                {/* Icon box */}
                <div className="w-[48px] h-[48px] flex-none rounded-[12px] bg-[var(--accent-soft,#e6f4ec)] flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--accent,#15a85b)', opacity: 0.7 }}>
                    {r.icon}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15.5px] truncate">{r.title}</div>
                  <div className="text-[13px] text-[var(--muted,#717c75)] truncate">
                    {r.time} min · {r.haveLabel}
                  </div>
                </div>

                {/* Ready dot indicator */}
                {r.ready && (
                  <span className="w-[9px] h-[9px] rounded-full bg-[var(--accent,#15a85b)] flex-none" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
