import type { PantryItem, FoodPreferences } from '../types';

// ---- dates ----

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Local-date ISO string (YYYY-MM-DD) `n` days from today. */
export const isoInDays = (n: number): string => {
  const d = startOfToday();
  d.setDate(d.getDate() + n);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

/** Whole days from today until an ISO date (negative once it has passed). */
export const daysUntil = (iso: string): number => {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - startOfToday().getTime()) / DAY_MS);
};

/** Typical shelf life in days, used when we don't know an item's real expiry. */
export const SHELF_LIFE: Record<string, number> = {
  'Produce': 5,
  'Dairy & eggs': 10,
  'Proteins': 3,
  'Grains & pasta': 180,
  'Pantry staples': 365,
  'Other': 7,
};

export const CATEGORY_ICON: Record<string, string> = {
  'Produce': 'eco',
  'Dairy & eggs': 'egg',
  'Proteins': 'set_meal',
  'Grains & pasta': 'grain',
  'Pantry staples': 'water_drop',
  'Other': 'grocery',
};

export const PANTRY_CATEGORIES = ['Produce', 'Dairy & eggs', 'Proteins', 'Grains & pasta', 'Pantry staples', 'Other'];

export const defaultShelfLife = (cat: string): number => SHELF_LIFE[cat] ?? 7;

/** Gives every item an expiry date and recomputes `days` from it for today. */
export const refreshExpiry = (items: PantryItem[]): PantryItem[] =>
  items.map(item => {
    const expiresOn = item.expiresOn || isoInDays(item.days);
    return { ...item, expiresOn, days: daysUntil(expiresOn) };
  });

/** Maps a shopping-list aisle to a pantry category. */
export const aisleToCategory = (aisle: string): string => {
  if (aisle === 'Bakery') return 'Grains & pasta';
  return PANTRY_CATEGORIES.includes(aisle) ? aisle : 'Other';
};

// ---- ingredient matching ----

const norm = (s: string) => s.trim().toLowerCase();

/** True when a recipe ingredient is covered by a pantry item name (either contains the other). */
export const ingredientMatches = (ingredient: string, pantryName: string): boolean => {
  const a = norm(ingredient);
  const b = norm(pantryName);
  return a === b || a.includes(b) || b.includes(a);
};

export const hasIngredient = (ingredient: string, pantryNames: string[]): boolean =>
  pantryNames.some(p => ingredientMatches(ingredient, p));

// ---- allergens ----

const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  'Nuts': ['almond', 'cashew', 'walnut', 'pistachio', 'pecan', 'hazelnut', 'nut'],
  'Peanuts': ['peanut'],
  'Dairy': ['milk', 'butter', 'cheese', 'parmesan', 'feta', 'yogurt', 'yoghurt', 'cream', 'paneer', 'ghee', 'curd'],
  'Eggs': ['egg', 'omelette', 'mayonnaise'],
  'Gluten': ['bread', 'sourdough', 'spaghetti', 'pasta', 'flour', 'atta', 'noodle', 'wheat', 'couscous'],
  'Soy': ['soy', 'tofu', 'edamame'],
  'Fish': ['salmon', 'tuna', 'fish', 'anchov', 'cod'],
  'Shellfish': ['prawn', 'shrimp', 'crab', 'lobster', 'mussel', 'clam'],
  'Sesame': ['sesame', 'tahini'],
};

const MEAT = ['chicken', 'beef', 'pork', 'mutton', 'lamb', 'bacon', 'ham', 'turkey', 'sausage'];
const SEAFOOD = ['salmon', 'tuna', 'fish', 'prawn', 'shrimp', 'crab', 'anchov', 'cod'];

export const ALLERGY_OPTIONS = Object.keys(ALLERGEN_KEYWORDS);
export const DIET_OPTIONS = ['Vegetarian', 'Eggetarian', 'Vegan', 'Gluten-free', 'Dairy-free'];

const containsAny = (ingredients: string[], words: string[]) =>
  ingredients.filter(i => words.some(w => norm(i).includes(w)));

/** Returns human-readable warnings for ingredients that clash with the user's preferences. */
export const preferenceConflicts = (ingredients: string[], prefs: FoodPreferences): string[] => {
  const out: string[] = [];
  const add = (label: string, hits: string[]) => {
    if (hits.length) out.push(`${label}: ${Array.from(new Set(hits)).join(', ')}`);
  };
  prefs.allergies.forEach(a => add(`Contains ${a.toLowerCase()}`, containsAny(ingredients, ALLERGEN_KEYWORDS[a] || [a.toLowerCase()])));
  const diets = prefs.diets;
  if (diets.includes('Vegetarian') || diets.includes('Eggetarian') || diets.includes('Vegan')) {
    add('Not vegetarian', containsAny(ingredients, [...MEAT, ...SEAFOOD]));
  }
  if (diets.includes('Vegetarian')) add('Contains egg', containsAny(ingredients, ALLERGEN_KEYWORDS['Eggs']));
  if (diets.includes('Vegan')) {
    add('Not vegan', containsAny(ingredients, [...ALLERGEN_KEYWORDS['Dairy'], ...ALLERGEN_KEYWORDS['Eggs'], 'honey']));
  }
  if (diets.includes('Gluten-free') && !prefs.allergies.includes('Gluten')) add('Contains gluten', containsAny(ingredients, ALLERGEN_KEYWORDS['Gluten']));
  if (diets.includes('Dairy-free') && !prefs.allergies.includes('Dairy')) add('Contains dairy', containsAny(ingredients, ALLERGEN_KEYWORDS['Dairy']));
  return out;
};

// ---- device storage ----

export const loadJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const saveJSON = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode): the app keeps working in memory.
  }
};

/** ISO date of this week's Monday, used to reset the meal plan each new week. */
export const currentWeekKey = (): string => {
  const d = startOfToday();
  const sinceMonday = (d.getDay() + 6) % 7;
  return isoInDays(-sinceMonday);
};
