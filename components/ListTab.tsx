import React, { useState } from 'react';
import type { ShoppingItem } from '../types';

interface ListTabProps {
  shoppingList: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onAddItem: (name: string) => void;
  onClearChecked: () => void;
  onOpenMcpGuide: () => void;
}

export const ListTab: React.FC<ListTabProps> = ({
  shoppingList,
  onToggleItem,
  onAddItem,
  onClearChecked,
  onOpenMcpGuide,
}) => {
  const [newItemText, setNewItemText] = useState('');

  const listRemaining = shoppingList.filter(i => !i.checked).length;

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newItemText.trim();
    if (!text) return;
    onAddItem(text);
    setNewItemText('');
  };

  const aisleOrder = ['Produce', 'Dairy & eggs', 'Bakery', 'Proteins', 'Grains & pasta', 'Pantry staples', 'Other'];

  // Group items by aisle
  const aisles = Array.from(new Set(shoppingList.map(i => i.aisle || 'Other'))).sort((a: string, b: string) => {
    const idxA = aisleOrder.indexOf(a);
    const idxB = aisleOrder.indexOf(b);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  return (
    <div className="p-[6px_22px_120px] animate-fade-in flex flex-col min-h-0">
      {/* Header */}
      <div className="pt-2 flex justify-between items-center">
        <div>
          <h1 className="font-head text-[28px] font-bold tracking-[-0.4px] text-[var(--text,#15201a)]">
            Shopping
          </h1>
          <p className="text-[14.5px] text-[var(--muted,#717c75)] mt-[3px]">
            {listRemaining} {listRemaining === 1 ? 'item' : 'items'} left to buy
          </p>
        </div>
        <button
          onClick={onClearChecked}
          className="bg-transparent border-none cursor-pointer font-sans text-[14px] font-bold text-[var(--muted,#717c75)] hover:underline active:scale-95 transition-all"
        >
          Clear done
        </button>
      </div>

      {/* Autonomous AI Order Helper Banner */}
      <div
        onClick={onOpenMcpGuide}
        className="mt-4 cursor-pointer border border-solid border-indigo-200/50 bg-gradient-to-r from-indigo-50 to-indigo-100/30 rounded-xl p-3.5 flex items-center gap-3.5 shadow-sm active:scale-[0.99] transition-all hover:bg-indigo-100/40"
      >
        <div className="w-[38px] h-[38px] flex-none rounded-lg bg-indigo-600 flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-[20px]">smart_toy</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[14px] text-indigo-950">Autonomous Checkout</div>
          <div className="text-[12px] text-indigo-700 mt-[1px] truncate">
            Configure Swiggy MCP to order these items instantly
          </div>
        </div>
        <span className="material-symbols-outlined text-indigo-600 font-bold">
          chevron_right
        </span>
      </div>

      {/* Shopping List grouped by Aisle */}
      <div className="mt-[22px] grid grid-cols-1 md:grid-cols-2 gap-[22px]">
        {aisles.map((aisleName) => {
          const itemsInAisle = shoppingList.filter(item => (item.aisle || 'Other') === aisleName);
          if (itemsInAisle.length === 0) return null;

          return (
            <div key={aisleName}>
              {/* Aisle title */}
              <div className="text-[13px] font-bold tracking-[1.0px] uppercase text-[var(--muted,#717c75)] mb-[9px]">
                {aisleName}
              </div>

              {/* Group box */}
              <div className="bg-[var(--surface,#fff)] border border-solid border-[var(--line,#eceeea)] rounded-[var(--r,22px)] overflow-hidden shadow-sm">
                {itemsInAisle.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => onToggleItem(item.id)}
                    className="w-full text-left cursor-pointer bg-transparent border-none flex items-center gap-[13px] p-[14px_16px] hover:opacity-90 active:opacity-95 transition-all"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line,#eceeea)' }}
                  >
                    {/* Checkbox box */}
                    <span
                      className="w-[24px] h-[24px] flex-none rounded-[8px] border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: item.checked ? 'var(--accent,#15a85b)' : 'var(--line,#cfd6cd)',
                        backgroundColor: item.checked ? 'var(--accent,#15a85b)' : 'transparent',
                      }}
                    >
                      {item.checked && (
                        <span className="material-symbols-outlined" style={{ fontSize: '17px', color: '#fff', fontVariationSettings: "'wght' 600" }}>
                          check
                        </span>
                      )}
                    </span>

                    {/* Name */}
                    <span
                      className="flex-1 text-[15.5px] font-bold truncate transition-all"
                      style={{
                        color: item.checked ? 'var(--muted,#9aa39c)' : 'var(--text,#15201a)',
                        textDecoration: item.checked ? 'line-through' : 'none',
                      }}
                    >
                      {item.name}
                    </span>

                    {/* Quantity */}
                    <span className="text-[13.5px] text-[var(--muted,#717c75)] flex-none">{item.qty}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Add custom item input bar */}
        <form
          onSubmit={handleAddNewItem}
          className="flex gap-[10px] items-center bg-[var(--surface-2,#f5f8f4)] border border-solid border-transparent focus-within:border-[var(--accent,#15a85b)] rounded-[14px] p-[6px_8px_6px_16px] shadow-sm transition-all md:col-span-2"
        >
          <span className="material-symbols-outlined text-[var(--muted,#717c75)] flex-none">add</span>
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add an item"
            className="flex-1 border-none bg-transparent outline-none font-sans text-[15.5px] text-[var(--text,#15201a)] py-2.5 placeholder:text-[var(--muted,#717c75)]/70"
          />
          <button
            type="submit"
            className="h-10 px-[18px] border-none rounded-[11px] bg-[var(--accent,#15a85b)] text-white font-bold text-[14.5px] cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-sm flex-none"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
};
