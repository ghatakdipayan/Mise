// Browser-side AI calls. Gemini runs on our server (see server/gemini.ts), so the
// API key never ships to the browser. These wrappers keep the same signatures the
// screens already use and post to the server's fixed /api/ai endpoints.
import type { FormData, FeastFormData, Recipe, FeastMenu, FeastPlan, FoodPreferences, ImageFile } from '../types';

interface InlineImage {
  data: string;
  mimeType: string;
}

const fileToInline = (file: File): Promise<InlineImage> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ data: result.split(',')[1], mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = () => reject(new Error('Could not read that image. Please try another.'));
  });

const imagesFrom = (groups: ImageFile[][]): Promise<InlineImage[]> =>
  Promise.all(groups.flat().map(img => fileToInline(img.file)));

const callAi = async <T,>(action: string, body: unknown): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(`/api/ai/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach Mise. Check your connection and try again.');
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.error || 'Something went wrong with the AI. Please try again.');
  }
  return payload as T;
};

export const analyzeReceiptImage = async (file: File) =>
  callAi<{ name: string; cat: string; icon: string }[]>('receipt', { image: await fileToInline(file) });

export const analyzeFridgeImage = async (file: File) =>
  callAi<{ name: string; cat: string; icon: string }[]>('fridge', { image: await fileToInline(file) });

export const generateRecipesFromPantry = (
  pantryIngredients: string[],
  prefs?: FoodPreferences,
  useSoon: string[] = [],
) => callAi<Recipe[]>('pantry-recipes', { pantryIngredients, prefs, useSoon });

// Legacy PantryPal flows (Recipe Generator, Feast Planner).

export const generateRecipes = async (formData: FormData) => {
  const { vegetables, fruits, proteins, greens, ...rest } = formData;
  return callAi<Recipe[]>('recipes', { ...rest, images: await imagesFrom([vegetables, fruits, proteins, greens]) });
};

const feastInput = async (formData: FeastFormData) => {
  const { vegetables, fruits, proteins, greens, ...rest } = formData;
  return { ...rest, images: await imagesFrom([vegetables, fruits, proteins, greens]) };
};

export const generateFeastMenu = async (formData: FeastFormData) =>
  callAi<FeastMenu>('feast-menu', { formData: await feastInput(formData) });

export const generateFeastPlan = async (formData: FeastFormData, menuConcept: FeastMenu) =>
  callAi<FeastPlan>('feast-plan', { formData: await feastInput(formData), menuConcept });
