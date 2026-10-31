import React, { useState } from 'react';
import type { PantryItem } from '../types';
import { PANTRY_CATEGORIES } from '../utils/pantry';

interface PantryTabProps {
  pantryItems: PantryItem[];
  onOpenHub: () => void;
  onAddItem: () => void;
  onEditItem: (item: PantryItem) => void;
}

export const PantryTab: React.FC<PantryTabProps> = ({ pantryItems, onOpenHub, onAddItem, onEditItem }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Expiration helper: red/orange/yellow/green color indicators
  const getFreshness = (d: number) => {
    if (d <= 1) {
      return {
        dot: '#e0823c',
        fg: '#c4701f',
        label: d < 0 ? 'past date' : d === 0 ? 'today' : '1 day',
        ring: '#f3d9c6',
      };
    }
    if (d <= 3) {
      return {
        dot: '#e0a93c',
        fg: '#b4791f',
        label: `${d} days`,
        ring: '#eee3cf',
      };
    }
    if (d <= 7) {
      return {
        dot: '#15a85b',
        fg: 'var(--muted,#717c75)',
        label: `${d} days`,
        ring: '#eceeea',
      };
    }
    return {
      dot: '#cfd6cd',
      fg: 'var(--muted,#717c75)',
      label: 'fresh',
      ring: '#eceeea',
    };
  };

  // Filter based on search query
  const filteredItems = pantryItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorting expiring soon (<= 3 days)
  const expiringItems = pantryItems
    .filter(p => p.days <= 3)
    .sort((a, b) => a.days - b.days);

  const categoriesOrder = PANTRY_CATEGORIES;

  return (
    <div className="p-[6px_22px_120px] animate-fade-in flex flex-col min-h-0">
      {/* Header */}
      <div className="pt-2 flex justify-between items-center">
        <h1 className="font-head text-[28px] font-bold tracking-[-0.4px] text-[var(--text,#15201a)]">
          Pantry
        </h1>
        <div className="flex items-center gap-[10px]">
          <span className="text-[14px] text-[var(--muted,#717c75)] font-semibold">
            {pantryItems.length} items
          </span>
          <button
            onClick={onAddItem}
            aria-label="Add item"
            className="h-[38px] pl-[10px] pr-[14px] rounded-full border-none bg-[var(--accent,#15a85b)] text-white font-bold text-[14px] cursor-pointer flex items-center gap-[4px] active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="mt-4 h-12 rounded-[14px] bg-[var(--surface-2,#f5f8f4)] flex items-center gap-[9px] px-[15px] text-[var(--muted,#717c75)] border border-transparent focus-within:border-[var(--accent,#15a85b)] transition-all">
        <span className="material-symbols-outlined text-[21px]">search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your pantry"
          className="flex-1 border-none bg-transparent outline-none font-sans text-[15.5px] text-[var(--text,#15201a)] placeholder:text-[var(--muted,#717c75)]/70 py-2.5"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="border-none bg-transparent cursor-pointer text-[var(--muted,#717c75)] flex items-center"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Dashed Upload Pantry Widget */}
      <div
        onClick={onOpenHub}
        className="mt-3.5 cursor-pointer border-[1.5px] border-dashed border-[var(--accent,#15a85b)] rounded-[16px] p-[14px_16px] flex items-center gap-[13px] bg-[var(--accent-soft,#e6f4ec)] hover:bg-[var(--accent-soft,#e6f4ec)]/80 transition-all active:scale-[0.98]"
      >
        <div className="w-[42px] h-[42px] flex-none rounded-[12px] bg-[var(--accent,#15a85b)] flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-white text-[23px]">add_a_photo</span>
        </div>
        <div className="flex-1">
          <div className="font-bold text-[15.5px] text-[var(--text,#15201a)]">Refresh your pantry</div>
          <div className="text-[13.5px] text-[var(--accent-ink,#0d7a41)] mt-[1px]">
            Receipt, grocery apps or a quick photo
          </div>
        </div>
        <span className="material-symbols-outlined text-[var(--accent,#15a85b)] font-bold">
          chevron_right
        </span>
      </div>

      {/* Expiring Soon section */}
      {expiringItems.length > 0 && !searchQuery && (
        <div className="mt-[22px] flex flex-col">
          <div className="flex items-center gap-[8px]">
            <span className="material-symbols-outlined text-[19px] text-[#e0823c]">schedule</span>
            <span className="text-[13px] font-bold tracking-[1.0px] uppercase text-[#c4701f]">
              Use soon
            </span>
          </div>

          <div className="ppl-scroll mt-3 -mx-[22px] px-[22px] flex gap-[11px] overflow-x-auto whitespace-nowrap scrollbar-hide py-1">
            {expiringItems.map((item, idx) => {
              const fresh = getFreshness(item.days);
              return (
                <button
                  key={item.id || idx}
                  onClick={() => onEditItem(item)}
                  className="text-left cursor-pointer flex-none w-[120px] rounded-[16px] p-[14px] bg-[var(--surface,#fff)] border border-solid transition-all shadow-sm"
                  style={{ borderColor: fresh.ring }}
                >
                  <span className="material-symbols-outlined text-[24px]" style={{ color: fresh.fg }}>
                    {item.icon}
                  </span>
                  <div className="font-bold text-[14.5px] mt-2 leading-[1.2] truncate text-[var(--text,#15201a)]">
                    {item.name}
                  </div>
                  <div className="text-[12.5px] font-bold mt-[3px]" style={{ color: fresh.fg }}>
                    {item.days < 0 ? 'Past date' : item.days === 0 ? 'Use today' : `${item.days} ${item.days === 1 ? 'day' : 'days'} left`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pantry List grouped by categories */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {categoriesOrder.map((catName) => {
          const itemsInCat = filteredItems.filter(item => item.cat === catName);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={catName}>
              {/* Category Header */}
              <div className="flex justify-between items-baseline mb-[6px]">
                <h3 className="text-[16.5px] font-bold tracking-[-0.2px] text-[var(--text,#15201a)]">
                  {catName}
                </h3>
                <span className="text-[13px] text-[var(--muted,#717c75)] font-semibold">
                  {itemsInCat.length}
                </span>
              </div>

              {/* Categorized Box */}
              <div className="bg-[var(--surface,#fff)] border border-solid border-[var(--line,#eceeea)] rounded-[var(--r,22px)] overflow-hidden shadow-sm">
                {itemsInCat.map((item, i) => {
                  const fresh = getFreshness(item.days);
                  return (
                    <button
                      key={item.id}
                      onClick={() => onEditItem(item)}
                      className="w-full text-left bg-transparent border-none cursor-pointer flex items-center gap-[13px] p-[13px_16px] hover:bg-[var(--surface-2,#f5f8f4)] transition-all"
                      style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line,#eceeea)' }}
                    >
                      {/* Icon */}
                      <div className="w-[38px] h-[38px] flex-none rounded-[11px] bg-[var(--surface-2,#f5f8f4)] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px] text-[var(--muted,#717c75)]">
                          {item.icon}
                        </span>
                      </div>

                      {/* Info details */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[15.5px] truncate text-[var(--text,#15201a)]">
                          {item.name}
                        </div>
                        <div className="text-[13px] text-[var(--muted,#717c75)] truncate">{item.qty}</div>
                      </div>

                      {/* Expiring dot badge */}
                      <div className="flex items-center gap-[6px]">
                        <span
                          className="w-[7px] h-[7px] rounded-full"
                          style={{ backgroundColor: fresh.dot }}
                        />
                        <span className="text-[12.5px] font-bold" style={{ color: fresh.fg }}>
                          {fresh.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
