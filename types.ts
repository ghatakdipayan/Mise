export interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

export interface FormData {
  vegetables: ImageFile[];
  fruits: ImageFile[];
  proteins: ImageFile[];
  greens: ImageFile[];
  spices: string[];
  otherSpices: string;
  allergies: string[];
  otherAllergies: string;
  dietaryChoices: string[];
  mood: string;
  cookingTime: number;
  servings: number;
  mealType: string;
  cuisine: string;
}

export interface Recipe {
  recipeName: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  missingItems: string[];
  cookingTime: number;
}

export interface FeastFormData {
    theme: string;
    guests: number;
    ageGroup: string;
    cuisine: string;
    allergies: string[];
    otherAllergies: string;
    // Fields for inventory check
    vegetables: ImageFile[];
    fruits: ImageFile[];
    proteins: ImageFile[];
    greens: ImageFile[];
    spices: string[];
    otherSpices: string;
}

export interface FeastMenu {
    menuTitle: string;
    description: string;
    appetizer: { name: string; description: string; };
    mainCourse: { name: string; description: string; };
    dessert: { name: string; description: string; };
    beverage: { name: string; description: string; };
}

export interface DetailedRecipe {
    course: string;
    recipeName: string;
    description: string;
    ingredients: string[];
    instructions: string[];
}

export interface FeastPlan {
    feastTitle: string;
    feastDescription: string;
    recipes: DetailedRecipe[];
    missingItems: string[];
}

export interface PantryItem {
  id: string;
  name: string;
  cat: string;
  qty: string;
  days: number;
  icon: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  aisle: string;
  qty: string;
  checked: boolean;
}

export type MealPlanEntry =
  | { type: 'recipe'; recipeName: string }
  | { type: 'order-in' }
  | { type: 'eat-out' };

export interface WeeklyPlan {
  [day: string]: {
    Lunch: MealPlanEntry | null;
    Dinner: MealPlanEntry | null;
  };
}

export interface AppTheme {
  name: string;
  desc: string;
  vars: Record<string, string>;
  sw: string[];
}