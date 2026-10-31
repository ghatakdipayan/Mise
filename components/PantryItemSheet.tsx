import React, { useState } from 'react';
import type { PantryItem } from '../types';
import { CATEGORY_ICON, PANTRY_CATEGORIES, defaultShelfLife, isoInDays, daysUntil } from '../utils/pantry';

interface PantryItemSheetProps {
  /** The item to edit, or null to add a new one. */
  item: PantryItem | null;
  onSave: (item: PantryItem) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export const PantryItemSheet: React.FC<PantryItemSheetProps> = ({ item, onSave, onRemove, onClose }) => {
  const isNew = !item;
  const [name, setName] = useState(item?.name ?? '');
  const [cat, setCat] = useState(item?.cat ?? 'Produce');
  const [qty, setQty] = useState(item?.qty ?? '1');
  const [expiresOn, setExpiresOn] = useState(item?.expiresOn ?? isoInDays(defaultShelfLife('Produce')));
  const [touchedExpiry, setTouchedExpiry] = useState(!isNew);

  const handleCategory = (next: string) => {
    setCat(next);
    // Until the user picks a date, follow the category's typical shelf life.
    if (!touchedExpiry) setExpiresOn(isoInDays(defaultShelfLife(next)));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({
      id: item?.id ?? 'p_' + Date.now(),
      name: trimmed,
      cat,
      qty: qty.trim() || '1',
      icon: item && item.cat === cat ? item.icon : CATEGORY_ICON[cat] || 'grocery',
      expiresOn,
      days: daysUntil(expiresOn),
    });
  };

  const quickDates = [
    { label: 'Today', days: 0 },
    { label: '3 days', days: 3 },
    { label: '1 week', days: 7 },
    { label: '1 month', days: 30 },
  ];

  const inputCls =
    'w-full h-12 rounded-[14px] bg-[var(--surface-2,#f5f8f4)] border border-solid border-transparent focus:border-[var(--accent,#15a85b)] outline-none px-[15px] font-sans text-[15.5px] text-[var(--text,#15201a)]';
  const labelCls = 'text-[13px] font-bold tracking-[0.6px] uppercase text-[var(--muted,#717c75)] mb-[7px] block';

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 bg-[rgba(15,20,17,0.4)] flex items-end lg:items-center lg:justify-center animate-fade-in"
    >
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="w-full lg:max-w-md max-h-[90%] overflow-y-auto ppl-scroll bg-[var(--bg,#fff)] rounded-t-[26px] lg:rounded-[26px] p-[10px_22px_30px] animate-sheet-up"
      >
        <div className="w-[38px] h-[5px] rounded-full bg-[var(--line,#eceeea)] mx-auto mb-4" />
        <h2 className="font-head text-[22px] font-bold text-[var(--text,#15201a)]">
          {isNew ? 'Add to pantry' : 'Edit item'}
        </h2>

        <div className="mt-5 flex flex-col gap-[16px]">
          <div>
            <label className={labelCls} htmlFor="pi-name">Name</label>
            <input id="pi-name" autoFocus={isNew} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Paneer" className={inputCls} />
          </div>

          <div>
            <span className={labelCls}>Category</span>
            <div className="flex flex-wrap gap-[8px]">
              {PANTRY_CATEGORIES.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => handleCategory(c)}
                  style={{
                    borderColor: cat === c ? 'var(--accent,#15a85b)' : 'var(--line,#eceeea)',
                    backgroundColor: cat === c ? 'var(--accent-soft,#e6f4ec)' : 'var(--surface,#fff)',
                    color: cat === c ? 'var(--accent-ink,#0d7a41)' : 'var(--text,#15201a)',
                  }}
                  className="px-[13px] py-[8px] rounded-full border border-solid text-[14px] font-semibold cursor-pointer"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="pi-qty">Quantity</label>
            <input id="pi-qty" value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 200g, 2, 1 bag" className={inputCls} />
          </div>

          <div>
            <label className={labelCls} htmlFor="pi-exp">Use by</label>
            <input
              id="pi-exp"
              type="date"
              value={expiresOn}
              onChange={e => { setExpiresOn(e.target.value); setTouchedExpiry(true); }}
              className={inputCls}
            />
            <div className="flex flex-wrap gap-[8px] mt-[9px]">
              {quickDates.map(q => (
                <button
                  type="button"
                  key={q.label}
                  onClick={() => { setExpiresOn(isoInDays(q.days)); setTouchedExpiry(true); }}
                  className="px-[12px] py-[6px] rounded-full border border-solid border-[var(--line,#eceeea)] bg-[var(--surface,#fff)] text-[13px] font-semibold text-[var(--muted,#717c75)] cursor-pointer"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          style={{ opacity: name.trim() ? 1 : 0.5 }}
          className="w-full h-[54px] mt-6 border-none rounded-full bg-[var(--accent,#15a85b)] text-white font-bold text-[16px] cursor-pointer"
        >
          {isNew ? 'Add to pantry' : 'Save changes'}
        </button>

        {!isNew && (
          <button
            type="button"
            onClick={() => onRemove(item!.id)}
            className="w-full h-12 mt-3 border border-solid border-red-100 rounded-full bg-red-50/50 text-red-600 font-bold text-[14.5px] cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[19px]">delete</span>
            Used up / remove
          </button>
        )}
      </form>
    </div>
  );
};
