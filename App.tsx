import React, { useState, useEffect } from 'react';
import type { PantryItem, ShoppingItem, WeeklyPlan, AppTheme, Recipe, FoodPreferences } from './types';
import { generateRecipesFromPantry } from './services/geminiService';
import { Onboarding } from './components/Onboarding';
import { CookTab } from './components/CookTab';
import { PantryTab } from './components/PantryTab';
import { PlanTab } from './components/PlanTab';
import { ListTab } from './components/ListTab';
import { RecipeDetail } from './components/RecipeDetail';
import { CookMode } from './components/CookMode';
import { RefreshHub } from './components/RefreshHub';
import { AppearanceSheet } from './components/AppearanceSheet';
import { RecipePicker } from './components/RecipePicker';
import { MealChoiceSheet } from './components/MealChoiceSheet';
import { SwiggyMcpGuide } from './components/SwiggyMcpGuide';
import { PantryItemSheet } from './components/PantryItemSheet';
import {
  refreshExpiry, isoInDays, daysUntil, defaultShelfLife, aisleToCategory, CATEGORY_ICON,
  hasIngredient, loadJSON, saveJSON, currentWeekKey,
} from './utils/pantry';
import { AuthScreen } from './components/AuthScreen';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './services/firebase';
import * as swiggyMcp from './services/swiggyMcp';

const themes: Record<string, AppTheme> = {
  fresh: {
    name: 'Fresh',
    desc: 'Clean white · garden green',
    vars: {
      '--bg': '#ffffff',
      '--device-bg': '#ffffff',
      '--surface': '#ffffff',
      '--surface-2': '#f4f7f3',
      '--text': '#15201a',
      '--muted': '#717c75',
      '--accent': '#15a85b',
      '--accent-ink': '#0d7a41',
      '--accent-soft': '#e6f4ec',
      '--line': '#ebeee9',
      '--r': '22px',
      '--font-body': "'Hanken Grotesk',sans-serif",
      '--font-head': "'Hanken Grotesk',sans-serif",
    },
    sw: ['#15a85b', '#f4c33d', '#ffffff'],
  },
  warm: {
    name: 'Warm',
    desc: 'Cosy cookbook · serif headings',
    vars: {
      '--bg': '#fbf7f0',
      '--device-bg': '#fbf7f0',
      '--surface': '#fffdf8',
      '--surface-2': '#f2ebdd',
      '--text': '#241f17',
      '--muted': '#807463',
      '--accent': '#3f7152',
      '--accent-ink': '#2b5239',
      '--accent-soft': '#e8efe6',
      '--line': '#ece3d3',
      '--r': '16px',
      '--font-body': "'Hanken Grotesk',sans-serif",
      '--font-head': "'Newsreader',serif",
    },
    sw: ['#3f7152', '#d98a4f', '#fbf7f0'],
  },
  mono: {
    name: 'Mono',
    desc: 'Bold minimal · tight & graphic',
    vars: {
      '--bg': '#fafaf8',
      '--device-bg': '#fafaf8',
      '--surface': '#ffffff',
      '--surface-2': '#f1f1ee',
      '--text': '#0e0e0c',
      '--muted': '#76766f',
      '--accent': '#1bb35e',
      '--accent-ink': '#0f7a3f',
      '--accent-soft': '#e9f7ef',
      '--line': '#e6e6e1',
      '--r': '10px',
      '--font-body': "'Schibsted Grotesk',sans-serif",
      '--font-head': "'Schibsted Grotesk',sans-serif",
    },
    sw: ['#0e0e0c', '#1bb35e', '#fafaf8'],
  },
};

const defaultRecipes: Recipe[] = [
  {
    recipeName: 'Lemon Garlic Spaghetti',
    description: 'A quick, bright pasta dish flavored with toasted garlic, lemon zest, juice, and a generous amount of parmesan cheese.',
    ingredients: ['Spaghetti', 'Garlic', 'Lemon', 'Olive oil', 'Parmesan', 'Chili flakes'],
    instructions: [
      'Bring a large pot of well-salted water to the boil.',
      'Cook the spaghetti until al dente, about 9 minutes. Reserve a cup of pasta water.|9:00',
      'Gently sizzle sliced garlic and chili flakes in olive oil until fragrant — don’t let it brown.',
      'Add lemon zest and juice off the heat, then toss in the pasta with a splash of pasta water.',
      'Finish with grated parmesan and toss until glossy. Serve straight away.'
    ],
    cookingTime: 20,
    missingItems: []
  },
  {
    recipeName: 'Smoked Salmon Scramble',
    description: 'Soft scrambled eggs gently folded with flakes of savory smoked salmon and fresh chives, served on toasted sourdough.',
    ingredients: ['Eggs', 'Smoked salmon', 'Butter', 'Chives', 'Sourdough'],
    instructions: [
      'Whisk the eggs with a pinch of salt until fully combined.',
      'Melt butter in a non-stick pan over low heat.',
      'Add the eggs and stir slowly, pulling them off the heat just before fully set.|2:30',
      'Fold through torn smoked salmon and serve on toasted sourdough.'
    ],
    cookingTime: 12,
    missingItems: []
  },
  {
    recipeName: 'Avocado Toast Deluxe',
    description: 'Creamy mashed avocado piled high on toasted artisan sourdough bread, topped with a perfectly cooked egg.',
    ingredients: ['Sourdough', 'Avocado', 'Lemon', 'Chili flakes', 'Eggs', 'Olive oil'],
    instructions: [
      'Toast the sourdough until deeply golden.',
      'Mash avocado with lemon juice, salt and a drizzle of olive oil.',
      'Fry or poach an egg to your liking.|3:00',
      'Pile avocado on toast, top with the egg and a pinch of chili flakes.'
    ],
    cookingTime: 8,
    missingItems: []
  },
  {
    recipeName: 'Chickpea Power Bowl',
    description: 'A protein-rich bowl of spiced roasted chickpeas, fluffy quinoa, fresh vegetables, and spinach tossed in lemon dressing.',
    ingredients: ['Chickpeas', 'Quinoa', 'Cherry tomatoes', 'Bell pepper', 'Lemon', 'Cumin', 'Olive oil', 'Spinach'],
    instructions: [
      'Rinse the quinoa, then simmer in double its volume of water for 12 minutes.|12:00',
      'Toss chickpeas with cumin and olive oil; roast or pan-fry until crisp.',
      'Chop tomatoes and bell pepper; whisk a lemon-olive oil dressing.',
      'Build the bowl over spinach and finish with the dressing.'
    ],
    cookingTime: 25,
    missingItems: []
  },
  {
    recipeName: 'Honey Soy Glazed Chicken',
    description: 'Tender pan-seared chicken breast simmered in a sticky sweet honey soy glaze, served over fluffy steamed rice.',
    ingredients: ['Chicken breast', 'Soy sauce', 'Honey', 'Garlic', 'Basmati rice', 'Chili flakes'],
    instructions: [
      'Rinse and steam the rice until fluffy.|15:00',
      'Sear sliced chicken in a hot pan until golden on both sides.',
      'Add garlic, then a glaze of soy sauce and honey; bubble until sticky.',
      'Scatter chili flakes and serve over the rice.'
    ],
    cookingTime: 30,
    missingItems: []
  },
  {
    recipeName: 'Tomato Quinoa Salad',
    description: 'A light, refreshing salad made with quinoa, halved cherry tomatoes, red onion, crumbled feta, and fresh lemon juice.',
    ingredients: ['Quinoa', 'Cherry tomatoes', 'Red onion', 'Lemon', 'Olive oil', 'Feta'],
    instructions: [
      'Cook the quinoa and let it cool slightly.',
      'Halve the tomatoes and finely slice the red onion.',
      'Dress with lemon and olive oil, then fold in crumbled feta.'
    ],
    cookingTime: 15,
    missingItems: []
  },
  {
    recipeName: 'Spinach & Feta Omelette',
    description: 'A classic breakfast omelette stuffed with fresh wilted baby spinach and salty crumbled feta cheese.',
    ingredients: ['Eggs', 'Spinach', 'Feta', 'Butter'],
    instructions: [
      'Whisk the eggs with seasoning.',
      'Wilt the spinach in butter, then pour in the eggs.|2:00',
      'Crumble over feta, fold and slide onto a plate.'
    ],
    cookingTime: 10,
    missingItems: []
  },
  {
    recipeName: 'One-Pan Lemon Chicken & Rice',
    description: 'A simple one-pot meal featuring golden seared chicken and aromatic basmati rice cooked together with lemon juice and bell peppers.',
    ingredients: ['Chicken breast', 'Basmati rice', 'Lemon', 'Garlic', 'Red onion', 'Bell pepper', 'Olive oil'],
    instructions: [
      'Brown seasoned chicken in olive oil, then set aside.',
      'Soften onion, garlic and pepper in the same pan.',
      'Stir in rice and water; nestle the chicken back on top.|20:00',
      'Cover and cook until the rice is tender, then finish with lemon.'
    ],
    cookingTime: 35,
    missingItems: []
  }
];

const initialPantry: PantryItem[] = [
  { id: 'p0', name: 'Spinach', cat: 'Produce', qty: '1 bag', days: 2, icon: 'eco' },
  { id: 'p1', name: 'Cherry tomatoes', cat: 'Produce', qty: '1 pint', days: 5, icon: 'nutrition' },
  { id: 'p2', name: 'Avocado', cat: 'Produce', qty: '2', days: 1, icon: 'nutrition' },
  { id: 'p3', name: 'Lemon', cat: 'Produce', qty: '4', days: 14, icon: 'nutrition' },
  { id: 'p4', name: 'Garlic', cat: 'Produce', qty: '1 bulb', days: 30, icon: 'eco' },
  { id: 'p5', name: 'Red onion', cat: 'Produce', qty: '2', days: 21, icon: 'eco' },
  { id: 'p6', name: 'Bell pepper', cat: 'Produce', qty: '3', days: 6, icon: 'eco' },
  { id: 'p7', name: 'Eggs', cat: 'Dairy & eggs', qty: '10', days: 16, icon: 'egg' },
  { id: 'p8', name: 'Greek yogurt', cat: 'Dairy & eggs', qty: '1 tub', days: 6, icon: 'icecream' },
  { id: 'p9', name: 'Parmesan', cat: 'Dairy & eggs', qty: '120g', days: 40, icon: 'lunch_dining' },
  { id: 'p10', name: 'Butter', cat: 'Dairy & eggs', qty: '1 stick', days: 30, icon: 'lunch_dining' },
  { id: 'p11', name: 'Chicken breast', cat: 'Proteins', qty: '500g', days: 2, icon: 'set_meal' },
  { id: 'p12', name: 'Chickpeas', cat: 'Proteins', qty: '2 cans', days: 400, icon: 'grain' },
  { id: 'p13', name: 'Smoked salmon', cat: 'Proteins', qty: '150g', days: 4, icon: 'set_meal' },
  { id: 'p14', name: 'Spaghetti', cat: 'Grains & pasta', qty: '500g', days: 200, icon: 'ramen_dining' },
  { id: 'p15', name: 'Basmati rice', cat: 'Grains & pasta', qty: '1 kg', days: 300, icon: 'rice_bowl' },
  { id: 'p16', name: 'Quinoa', cat: 'Grains & pasta', qty: '500g', days: 200, icon: 'grain' },
  { id: 'p17', name: 'Sourdough', cat: 'Grains & pasta', qty: '½ loaf', days: 3, icon: 'bakery_dining' },
  { id: 'p18', name: 'Olive oil', cat: 'Pantry staples', qty: '1 bottle', days: 365, icon: 'water_drop' },
  { id: 'p19', name: 'Soy sauce', cat: 'Pantry staples', qty: '1 bottle', days: 365, icon: 'water_drop' },
  { id: 'p20', name: 'Honey', cat: 'Pantry staples', qty: '1 jar', days: 365, icon: 'water_drop' },
  { id: 'p21', name: 'Cumin', cat: 'Pantry staples', qty: '1 jar', days: 365, icon: 'grain' },
  { id: 'p22', name: 'Chili flakes', cat: 'Pantry staples', qty: '1 jar', days: 365, icon: 'local_fire_department' }
];

const initialList: ShoppingItem[] = [
  { id: 'l1', name: 'Feta', aisle: 'Dairy & eggs', qty: '200g', checked: false },
  { id: 'l2', name: 'Chives', aisle: 'Produce', qty: '1 bunch', checked: false },
  { id: 'l3', name: 'Milk', aisle: 'Dairy & eggs', qty: '1 carton', checked: false },
  { id: 'l4', name: 'Sourdough loaf', aisle: 'Bakery', qty: '1', checked: true },
  { id: 'l5', name: 'Lemons', aisle: 'Produce', qty: 'x4', checked: false }
];

const initialPlan: WeeklyPlan = {
  Mon: { Lunch: null, Dinner: { type: 'recipe', recipeName: 'Honey Soy Glazed Chicken' } },
  Tue: { Lunch: null, Dinner: { type: 'recipe', recipeName: 'Lemon Garlic Spaghetti' } },
  Wed: { Lunch: null, Dinner: null },
  Thu: { Lunch: { type: 'recipe', recipeName: 'Chickpea Power Bowl' }, Dinner: { type: 'recipe', recipeName: 'One-Pan Lemon Chicken & Rice' } },
  Fri: { Lunch: null, Dinner: { type: 'eat-out' } },
  Sat: { Lunch: { type: 'order-in' }, Dinner: { type: 'recipe', recipeName: 'Avocado Toast Deluxe' } },
  Sun: { Lunch: null, Dinner: null }
};

const STORE = {
  theme: 'mise_theme',
  pantry: 'mise_pantry',
  list: 'mise_list',
  plan: 'mise_plan',
  planWeek: 'mise_plan_week',
  recipes: 'mise_recipes',
  prefs: 'mise_prefs',
};

const emptyPlan = (): WeeklyPlan =>
  Object.fromEntries(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => [d, { Lunch: null, Dinner: null }]));

const getAisle = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('tomato') || n.includes('spinach') || n.includes('avocado') || n.includes('lemon') || n.includes('onion') || n.includes('pepper') || n.includes('garlic') || n.includes('coriander') || n.includes('carrot') || n.includes('banana') || n.includes('chives')) return 'Produce';
  if (n.includes('egg') || n.includes('yogurt') || n.includes('parmesan') || n.includes('butter') || n.includes('cheese') || n.includes('milk') || n.includes('curd') || n.includes('paneer') || n.includes('ghee')) return 'Dairy & eggs';
  if (n.includes('chicken') || n.includes('salmon') || n.includes('fish') || n.includes('meat') || n.includes('beef')) return 'Proteins';
  if (n.includes('spaghetti') || n.includes('pasta') || n.includes('rice') || n.includes('quinoa') || n.includes('bread') || n.includes('sourdough') || n.includes('atta')) return 'Grains & pasta';
  if (n.includes('oil') || n.includes('soy') || n.includes('honey') || n.includes('cumin') || n.includes('flakes') || n.includes('salt') || n.includes('pepper') || n.includes('dal')) return 'Pantry staples';
  return 'Other';
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<'auth' | 'app'>(() => {
    const user = localStorage.getItem('mise_user');
    return user ? 'app' : 'auth';
  });

  // Onboarding is a dismissible overlay, not a gate — it shows on top of the
  // already-usable app unless the user previously chose "Don't show again".
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('mise_onboarded') !== 'true';
  });

  const [userProfile, setUserProfile] = useState<{ name: string; email: string; avatar: string; provider?: string } | null>(() => {
    const saved = localStorage.getItem('mise_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSignIn = (provider: string, profile: { name: string; email: string; avatar: string }) => {
    const fullProfile = { ...profile, provider };
    localStorage.setItem('mise_user', JSON.stringify(fullProfile));
    setUserProfile(fullProfile);
    setAppState('app');
  };

  const handleSignOut = async () => {
    localStorage.removeItem('mise_user');
    setUserProfile(null);
    setAppState('auth');

    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Firebase sign out failed:', error);
      }
    }
  };

  const handleDismissOnboarding = (dontShowAgain: boolean) => {
    setShowOnboarding(false);
    if (dontShowAgain) {
      localStorage.setItem('mise_onboarded', 'true');
    }
  };

  // Listen to real Firebase Auth changes
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    // Retrieve auth redirect results (e.g. from popup fallbacks); onAuthStateChanged
    // below picks up the resulting session, so this only needs to surface errors.
    getRedirectResult(auth)
      .catch((error) => {
        console.error('Redirect authentication failed:', error);
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const name = user.displayName || 'Google User';
        const email = user.email || '';
        
        // Safe initials extraction to prevent crashes with empty or double spaces
        const initials = name
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'U';
        
        const isFacebook = user.providerData?.some((p) => p.providerId.includes('facebook')) || false;
        const provider = isFacebook ? 'facebook' : 'google';
        const profile = { name, email, avatar: initials, provider };
        localStorage.setItem('mise_user', JSON.stringify(profile));
        setUserProfile(profile);
        setAppState('app');
      } else {
        // Only reset state if the user was actually logged in using a real Firebase provider
        const saved = localStorage.getItem('mise_user');
        if (saved) {
          try {
            const profile = JSON.parse(saved);
            if (profile.provider === 'google' || profile.provider === 'facebook') {
              setUserProfile(null);
              setAppState('auth');
            }
          } catch (e) {
            setUserProfile(null);
            setAppState('auth');
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Everything the user builds up is saved on this device and restored on reload.
  const [theme, setTheme] = useState<string>(() => loadJSON(STORE.theme, 'fresh'));
  const [tab, setTab] = useState<'cook' | 'pantry' | 'plan' | 'list'>('cook');
  const [pantry, setPantry] = useState<PantryItem[]>(() => refreshExpiry(loadJSON(STORE.pantry, initialPantry)));
  const [list, setList] = useState<ShoppingItem[]>(() => loadJSON(STORE.list, initialList));
  const [plan, setPlan] = useState<WeeklyPlan>(() => {
    // The plan is keyed by weekday, so a new week starts with a clean slate.
    const savedWeek = loadJSON<string | null>(STORE.planWeek, null);
    if (savedWeek === null) return initialPlan;
    return savedWeek === currentWeekKey() ? loadJSON(STORE.plan, initialPlan) : emptyPlan();
  });
  const [recipes, setRecipes] = useState<Recipe[]>(() => loadJSON(STORE.recipes, defaultRecipes));
  const [preferences, setPreferences] = useState<FoodPreferences>(() => loadJSON(STORE.prefs, { diets: [], allergies: [] }));
  const [editingPantryItem, setEditingPantryItem] = useState<PantryItem | 'new' | null>(null);

  useEffect(() => saveJSON(STORE.theme, theme), [theme]);
  useEffect(() => saveJSON(STORE.pantry, pantry), [pantry]);
  useEffect(() => saveJSON(STORE.list, list), [list]);
  useEffect(() => {
    saveJSON(STORE.plan, plan);
    saveJSON(STORE.planWeek, currentWeekKey());
  }, [plan]);
  useEffect(() => saveJSON(STORE.recipes, recipes), [recipes]);
  useEffect(() => saveJSON(STORE.prefs, preferences), [preferences]);

  // Recount "days left" when the app comes back to the foreground on a later day.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setPantry(prev => refreshExpiry(prev));
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const [selectedRecipeName, setSelectedRecipeName] = useState<string | null>(null);
  const [isCookMode, setIsCookMode] = useState<boolean>(false);
  const [isHubOpen, setIsHubOpen] = useState<boolean>(false);
  const [appearanceOpen, setAppearanceOpen] = useState<boolean>(false);
  const [pickerSlot, setPickerSlot] = useState<{ day: string; slot: 'Lunch' | 'Dinner' } | null>(null);
  const [mealChoiceSlot, setMealChoiceSlot] = useState<{ day: string; slot: 'Lunch' | 'Dinner' } | null>(null);

  const [isMcpGuideOpen, setIsMcpGuideOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [toastText, setToastText] = useState<string | null>(null);
  const [swiggyAutoResume, setSwiggyAutoResume] = useState<boolean>(false);

  // Manage toasts cleanly
  useEffect(() => {
    if (toastText) {
      const timer = setTimeout(() => setToastText(null), 2200);
      return () => clearTimeout(timer);
    }
  }, [toastText]);

  const triggerToast = (msg: string) => {
    setToastText(msg);
  };

  // Complete the Swiggy OAuth redirect if we just landed back from mcp.swiggy.com
  useEffect(() => {
    swiggyMcp.handleRedirectCallback().then((result) => {
      if (!result.handled) return;
      if (result.success) {
        triggerToast('Connected your Swiggy account');
        if (result.shouldResumeRefresh) {
          setIsHubOpen(true);
          setSwiggyAutoResume(true);
        }
      } else {
        triggerToast(result.error || 'Could not connect to Swiggy');
      }
    });
  }, []);

  const handleAddItem = (name: string, silent = false) => {
    const exists = list.some(item => item.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      if (!silent) triggerToast(`${name} is already on your list`);
      return;
    }
    const newItem: ShoppingItem = {
      id: 'l_' + Date.now() + Math.random().toString(36).substr(2, 9),
      name,
      aisle: getAisle(name),
      qty: '1',
      checked: false,
    };
    setList(prev => [...prev, newItem]);
    if (!silent) triggerToast(`${name} added to your list`);
  };

  const handleToggleItem = (id: string) => {
    setList(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleClearChecked = () => {
    setList(prev => prev.filter(item => !item.checked));
  };

  const handleAddItemsToPantry = (items: { name: string; cat: string; icon: string; qty?: string }[]) => {
    const newPantryItems: PantryItem[] = items.map((it, index) => {
      // Check if it already exists to update or keep days
      // Restocking means fresh stock, so expiry restarts from the category's shelf life.
      const expiresOn = isoInDays(defaultShelfLife(it.cat));
      return {
        id: 'p_' + Date.now() + index,
        name: it.name,
        cat: it.cat,
        qty: it.qty || '1',
        days: daysUntil(expiresOn),
        expiresOn,
        icon: it.icon || CATEGORY_ICON[it.cat] || 'grocery',
      };
    });

    // Remove duplicates from pantry to restock cleanly
    setPantry(prev => {
      const filtered = prev.filter(p => 
        !newPantryItems.some(np => np.name.toLowerCase() === p.name.toLowerCase())
      );
      return [...filtered, ...newPantryItems];
    });
  };

  const handleSavePantryItem = (item: PantryItem) => {
    setPantry(prev => {
      const exists = prev.some(p => p.id === item.id);
      return exists ? prev.map(p => (p.id === item.id ? item : p)) : [...prev, item];
    });
    triggerToast(editingPantryItem === 'new' ? `${item.name} added to your pantry` : `${item.name} updated`);
    setEditingPantryItem(null);
  };

  const handleRemovePantryItem = (id: string) => {
    const item = pantry.find(p => p.id === id);
    setPantry(prev => prev.filter(p => p.id !== id));
    if (item) triggerToast(`${item.name} removed from your pantry`);
    setEditingPantryItem(null);
  };

  const handleUsedUp = (ids: string[]) => {
    setPantry(prev => prev.filter(p => !ids.includes(p.id)));
  };

  const handleMoveCheckedToPantry = () => {
    const bought = list.filter(i => i.checked);
    if (!bought.length) return;
    handleAddItemsToPantry(
      bought.map(i => {
        const cat = aisleToCategory(i.aisle);
        return { name: i.name, cat, icon: CATEGORY_ICON[cat], qty: i.qty };
      })
    );
    setList(prev => prev.filter(i => !i.checked));
    triggerToast(`${bought.length} ${bought.length === 1 ? 'item' : 'items'} moved to your pantry`);
  };

  const handleShopForWeek = () => {
    const plannedNames = Object.values(plan).flatMap(day =>
      [day.Lunch, day.Dinner].flatMap(e => (e && e.type === 'recipe' ? [e.recipeName] : []))
    );
    const plannedRecipes = recipes.filter(r => plannedNames.includes(r.recipeName));
    if (!plannedRecipes.length) {
      triggerToast('Plan a recipe first, then shop for it');
      return;
    }
    const pantryNames = pantry.map(p => p.name);
    const onList = list.map(i => i.name);
    const needed: string[] = [];
    plannedRecipes.forEach(r =>
      r.ingredients.forEach(ing => {
        if (hasIngredient(ing, pantryNames) || hasIngredient(ing, onList)) return;
        if (!needed.some(n => n.toLowerCase() === ing.toLowerCase())) needed.push(ing);
      })
    );
    if (!needed.length) {
      triggerToast(`You have everything for ${plannedRecipes.length} planned meals`);
      return;
    }
    needed.forEach(name => handleAddItem(name, true));
    triggerToast(`${needed.length} ${needed.length === 1 ? 'item' : 'items'} added for this week’s meals`);
  };

  const handleSelectSlot = (day: string, slot: 'Lunch' | 'Dinner') => {
    setMealChoiceSlot({ day, slot });
  };

  const handlePickerSelect = (recipeTitle: string) => {
    if (!pickerSlot) return;
    const { day, slot } = pickerSlot;
    setPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: { type: 'recipe', recipeName: recipeTitle },
      },
    }));
    setPickerSlot(null);
    triggerToast(`${recipeTitle} added to ${day}`);
  };

  const handleChooseCook = () => {
    if (!mealChoiceSlot) return;
    setPickerSlot(mealChoiceSlot);
    setMealChoiceSlot(null);
  };

  const handleChooseMealStatus = (status: 'order-in' | 'eat-out') => {
    if (!mealChoiceSlot) return;
    const { day, slot } = mealChoiceSlot;
    setPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: { type: status },
      },
    }));
    triggerToast(status === 'order-in' ? `${slot} marked as ordering in` : `${slot} marked as eating out`);
    setMealChoiceSlot(null);
  };

  const handleClearMealSlot = (day: string, slot: 'Lunch' | 'Dinner') => {
    setPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: null,
      },
    }));
  };

  const handleRemoveFromChoiceSheet = () => {
    if (!mealChoiceSlot) return;
    handleClearMealSlot(mealChoiceSlot.day, mealChoiceSlot.slot);
    setMealChoiceSlot(null);
  };

  const handleGenerateRecipes = async () => {
    setIsGenerating(true);
    try {
      const ingredientNames = pantry.map(p => p.name);
      const useSoon = pantry.filter(p => p.days <= 3).map(p => p.name);
      const generated = await generateRecipesFromPantry(ingredientNames, preferences, useSoon);
      
      // Append generated recipes to local state (avoiding duplicates)
      setRecipes(prev => {
        const filtered = prev.filter(p =>
          !generated.some(g => g.recipeName.toLowerCase() === p.recipeName.toLowerCase())
        );
        return [...generated, ...filtered];
      });

      triggerToast(`AI Chef generated ${generated.length} recipes!`);
      // Automatically open the first generated recipe
      if (generated.length > 0) {
        setSelectedRecipeName(generated[0].recipeName);
      }
    } catch (e: any) {
      triggerToast(e.message || 'Error generating recipes. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentTheme = themes[theme] || themes.fresh;
  const lowercasePantryNames = pantry.map(p => p.name.toLowerCase());

  const activeRecipe = selectedRecipeName ? recipes.find(r => r.recipeName === selectedRecipeName) : null;

  // Render proper Tab views
  const renderTab = () => {
    switch (tab) {
      case 'cook':
        return (
          <CookTab
            recipes={recipes}
            onSelectRecipe={setSelectedRecipeName}
            onOpenAppearance={() => setAppearanceOpen(true)}
            pantryItems={lowercasePantryNames}
            onGenerateRecipes={handleGenerateRecipes}
            isGenerating={isGenerating}
            userAvatar={userProfile?.avatar || 'JM'}
            userName={userProfile?.name}
          />
        );
      case 'pantry':
        return (
          <PantryTab
            pantryItems={pantry}
            onOpenHub={() => setIsHubOpen(true)}
            onAddItem={() => setEditingPantryItem('new')}
            onEditItem={setEditingPantryItem}
          />
        );
      case 'plan':
        return (
          <PlanTab
            weeklyPlan={plan}
            recipes={recipes}
            onSelectSlot={handleSelectSlot}
            onSelectRecipe={setSelectedRecipeName}
            onClearSlot={handleClearMealSlot}
            onShopForWeek={handleShopForWeek}
          />
        );
      case 'list':
        return (
          <ListTab
            shoppingList={list}
            onToggleItem={handleToggleItem}
            onAddItem={(name) => handleAddItem(name)}
            onClearChecked={handleClearChecked}
            onOpenMcpGuide={() => setIsMcpGuideOpen(true)}
            onMoveCheckedToPantry={handleMoveCheckedToPantry}
          />
        );
      default:
        return null;
    }
  };

  if (appState === 'auth') {
    return (
      <div style={currentTheme.vars as React.CSSProperties} className="h-screen w-screen bg-[var(--bg,#fff)]">
        <AuthScreen onSignIn={handleSignIn} />
      </div>
    );
  }

  return (
    <div
      style={currentTheme.vars as React.CSSProperties}
      className="h-screen w-screen flex bg-[var(--bg,#fff)] select-none text-[var(--text,#15201a)] font-sans overflow-hidden relative"
    >
      {/* Desktop Sidebar Navigation Panel */}
      <div className="hidden lg:flex flex-col w-64 bg-[var(--surface,#fff)] border-r border-[var(--line,#eceeea)] p-6 justify-between flex-none">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/icon-192.png" className="w-10 h-10 rounded-xl shadow-sm" alt="Mise Logo" />
            <span
              style={{ fontFamily: 'var(--font-head)' }}
              className="text-2xl font-bold tracking-tight text-[var(--text,#15201a)]"
            >
              Mise
            </span>
          </div>

          {/* Sidebar Menu Items */}
          <div className="flex flex-col gap-1.5 mt-8">
            {/* Cook Tab Link */}
            <button
              onClick={() => setTab('cook')}
              style={{
                color: tab === 'cook' ? 'var(--accent,#15a85b)' : 'var(--muted,#717c75)',
                backgroundColor: tab === 'cook' ? 'var(--accent-soft,#e6f4ec)' : 'transparent',
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border-none cursor-pointer font-sans font-bold text-[15px] hover:bg-[var(--surface-2,#f4f7f3)] transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${tab === 'cook' ? 1 : 0}` }}>
                skillet
              </span>
              <span>Cook</span>
            </button>

            {/* Pantry Tab Link */}
            <button
              onClick={() => setTab('pantry')}
              style={{
                color: tab === 'pantry' ? 'var(--accent,#15a85b)' : 'var(--muted,#717c75)',
                backgroundColor: tab === 'pantry' ? 'var(--accent-soft,#e6f4ec)' : 'transparent',
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border-none cursor-pointer font-sans font-bold text-[15px] hover:bg-[var(--surface-2,#f4f7f3)] transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${tab === 'pantry' ? 1 : 0}` }}>
                kitchen
              </span>
              <span>Pantry</span>
            </button>

            {/* Plan Tab Link */}
            <button
              onClick={() => setTab('plan')}
              style={{
                color: tab === 'plan' ? 'var(--accent,#15a85b)' : 'var(--muted,#717c75)',
                backgroundColor: tab === 'plan' ? 'var(--accent-soft,#e6f4ec)' : 'transparent',
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border-none cursor-pointer font-sans font-bold text-[15px] hover:bg-[var(--surface-2,#f4f7f3)] transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${tab === 'plan' ? 1 : 0}` }}>
                calendar_month
              </span>
              <span>Plan</span>
            </button>

            {/* List Tab Link */}
            <button
              onClick={() => setTab('list')}
              style={{
                color: tab === 'list' ? 'var(--accent,#15a85b)' : 'var(--muted,#717c75)',
                backgroundColor: tab === 'list' ? 'var(--accent-soft,#e6f4ec)' : 'transparent',
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border-none cursor-pointer font-sans font-bold text-[15px] hover:bg-[var(--surface-2,#f4f7f3)] transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${tab === 'list' ? 1 : 0}` }}>
                checklist
              </span>
              <span>List</span>
            </button>
          </div>
        </div>

        {/* Sidebar Profile Settings */}
        <button
          onClick={() => setAppearanceOpen(true)}
          className="flex items-center gap-3 border-none bg-transparent cursor-pointer p-2 hover:opacity-85 text-left w-full mt-auto"
        >
          <div className="w-[42px] h-[42px] rounded-full bg-[var(--surface-2,#f4f7f3)] flex items-center justify-center font-head text-[16px] font-extrabold text-[var(--accent,#15a85b)] border border-[var(--line,#eceeea)]">
            {userProfile?.avatar || 'JM'}
          </div>
          <div className="flex flex-col">
            <div className="font-bold text-[14px] text-[var(--text,#15201a)]">{userProfile?.name || 'Jordan Morris'}</div>
            <div className="text-[12px] text-[var(--muted,#717c75)] mt-[1px]">Customize appearance</div>
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 relative bg-[var(--bg,#fff)]">
        {/* Mobile Status Bar (Hidden on desktop) */}
        <div className="h-[52px] flex-none flex items-end justify-between px-[30px] pb-2 relative z-10 text-[var(--text,#15201a)] lg:hidden">
          <span className="text-[15px] font-bold tracking-[0.2px]">9:41</span>
          <div className="flex gap-[7px] items-center text-[17px]">
            <span className="material-symbols-outlined" style={{ fontSize: '17px', fontVariationSettings: "'wght' 500, 'FILL' 1" }}>
              signal_cellular_alt
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'wght' 500, 'FILL' 1" }}>
              wifi
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '17px', fontVariationSettings: "'wght' 500, 'FILL' 1" }}>
              battery_full
            </span>
          </div>
        </div>

        {/* Inner Content Area */}
        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
              {/* Inner Tab scroll area */}
              <div className="ppl-scroll flex-1 overflow-y-auto min-h-0">
                {renderTab()}
              </div>

              {/* Mobile bottom navigation bar (Hidden on desktop) */}
              <div className="flex-none h-[84px] bg-[var(--surface,#fff)] border-t border-[var(--line,#eceeea)] flex items-start pt-[9px] px-2 relative lg:hidden">
                {/* Cook tab */}
                <button
                  onClick={() => setTab('cook')}
                  className="flex-1 bg-transparent border-none cursor-pointer flex flex-col items-center gap-0.5"
                  style={{ color: tab === 'cook' ? 'var(--accent,#15a85b)' : 'var(--muted,#9aa39c)' }}
                >
                  <span
                    className="material-symbols-outlined text-[25px]"
                    style={{ fontVariationSettings: `'FILL' ${tab === 'cook' ? 1 : 0}` }}
                  >
                    skillet
                  </span>
                  <span className="text-[11px] font-bold">Cook</span>
                </button>

                {/* Pantry tab */}
                <button
                  onClick={() => setTab('pantry')}
                  className="flex-1 bg-transparent border-none cursor-pointer flex flex-col items-center gap-0.5"
                  style={{ color: tab === 'pantry' ? 'var(--accent,#15a85b)' : 'var(--muted,#9aa39c)' }}
                >
                  <span
                    className="material-symbols-outlined text-[25px]"
                    style={{ fontVariationSettings: `'FILL' ${tab === 'pantry' ? 1 : 0}` }}
                  >
                    kitchen
                  </span>
                  <span className="text-[11px] font-bold">Pantry</span>
                </button>

                {/* Center refresh plus button */}
                <div className="flex-1 flex justify-center">
                  <button
                    onClick={() => setIsHubOpen(true)}
                    className="w-14 h-14 -mt-3 rounded-full border-none cursor-pointer bg-[var(--accent,#15a85b)] text-white flex items-center justify-center shadow-[0_8px_20px_-5px_var(--accent,#15a85b)] active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[27px] font-bold">add</span>
                  </button>
                </div>

                {/* Plan tab */}
                <button
                  onClick={() => setTab('plan')}
                  className="flex-1 bg-transparent border-none cursor-pointer flex flex-col items-center gap-0.5"
                  style={{ color: tab === 'plan' ? 'var(--accent,#15a85b)' : 'var(--muted,#9aa39c)' }}
                >
                  <span
                    className="material-symbols-outlined text-[25px]"
                    style={{ fontVariationSettings: `'FILL' ${tab === 'plan' ? 1 : 0}` }}
                  >
                    calendar_month
                  </span>
                  <span className="text-[11px] font-bold">Plan</span>
                </button>

                {/* List tab */}
                <button
                  onClick={() => setTab('list')}
                  className="flex-1 bg-transparent border-none cursor-pointer flex flex-col items-center gap-0.5"
                  style={{ color: tab === 'list' ? 'var(--accent,#15a85b)' : 'var(--muted,#9aa39c)' }}
                >
                  <span
                    className="material-symbols-outlined text-[25px]"
                    style={{ fontVariationSettings: `'FILL' ${tab === 'list' ? 1 : 0}` }}
                  >
                    checklist
                  </span>
                  <span className="text-[11px] font-bold">List</span>
                </button>
              </div>
            </div>
        </div>

        {/* Onboarding: dismissible splash overlay, not a mandatory gate */}
        {showOnboarding && <Onboarding onDismiss={handleDismissOnboarding} />}

        {/* Modal Sheet 1: Recipe Detail Overlay */}
        {activeRecipe && !isCookMode && (
          <RecipeDetail
            recipe={activeRecipe}
            onClose={() => setSelectedRecipeName(null)}
            onStartCook={() => setIsCookMode(true)}
            pantryItems={lowercasePantryNames}
            onAddToList={(name, silent) => handleAddItem(name, silent)}
            toast={triggerToast}
            preferences={preferences}
          />
        )}

        {/* Modal Sheet 2: Cook Mode Active Overlay */}
        {activeRecipe && isCookMode && (
          <CookMode
            recipe={activeRecipe}
            onClose={() => {
              setIsCookMode(false);
              setSelectedRecipeName(null);
            }}
            toast={triggerToast}
            pantry={pantry}
            onUsedUp={handleUsedUp}
          />
        )}

        {/* Modal Sheet 3: Refresh Hub bottom drawer */}
        <RefreshHub
          isOpen={isHubOpen}
          onClose={() => setIsHubOpen(false)}
          onAddItemsToPantry={handleAddItemsToPantry}
          toast={triggerToast}
          pantryItems={lowercasePantryNames}
          autoResumeInstamart={swiggyAutoResume}
          onAutoResumeHandled={() => setSwiggyAutoResume(false)}
        />

        {/* Modal Sheet 4: Theme Appearance Selector bottom drawer */}
        {appearanceOpen && (
          <AppearanceSheet
            activeTheme={theme}
            onSelectTheme={setTheme}
            onClose={() => setAppearanceOpen(false)}
            themes={themes}
            onSignOut={handleSignOut}
            preferences={preferences}
            onChangePreferences={setPreferences}
          />
        )}

        {/* Pantry item add / edit sheet */}
        {editingPantryItem && (
          <PantryItemSheet
            item={editingPantryItem === 'new' ? null : editingPantryItem}
            onSave={handleSavePantryItem}
            onRemove={handleRemovePantryItem}
            onClose={() => setEditingPantryItem(null)}
          />
        )}

        {/* Modal Sheet 5a: Meal planner choice sheet — cook / order in / eat out */}
        {mealChoiceSlot && (
          <MealChoiceSheet
            day={mealChoiceSlot.day}
            slot={mealChoiceSlot.slot}
            currentType={plan[mealChoiceSlot.day]?.[mealChoiceSlot.slot]?.type ?? null}
            onCook={handleChooseCook}
            onOrderIn={() => handleChooseMealStatus('order-in')}
            onEatOut={() => handleChooseMealStatus('eat-out')}
            onRemove={handleRemoveFromChoiceSheet}
            onClose={() => setMealChoiceSlot(null)}
          />
        )}

        {/* Modal Sheet 5b: Meal planner Recipe Picker bottom drawer */}
        {pickerSlot && (
          <RecipePicker
            pickerSlot={pickerSlot.slot.toLowerCase()}
            recipes={recipes}
            onPick={handlePickerSelect}
            onClose={() => setPickerSlot(null)}
            pantryItems={lowercasePantryNames}
          />
        )}

        {/* Modal Sheet 6: Swiggy MCP Autonomous Checkout Guide Dialog */}
        <SwiggyMcpGuide
          isOpen={isMcpGuideOpen}
          onClose={() => setIsMcpGuideOpen(false)}
          missingItems={list.filter(i => !i.checked).map(i => i.name)}
        />

        {/* Toast popup */}
        {toastText && (
          <div className="absolute left-[18px] right-[18px] bottom-[100px] z-50 flex justify-center pointer-events-none">
            <div className="bg-[#15201a] text-white p-[13px_20px] rounded-full text-[14.5px] font-semibold flex items-center gap-[9px] shadow-[0_12px_30px_-8px_rgba(0,0,0,0.5)] animate-pop-in">
              <span className="material-symbols-outlined" style={{ fontSize: '19px', color: '#7bd88f' }}>
                check_circle
              </span>
              {toastText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;