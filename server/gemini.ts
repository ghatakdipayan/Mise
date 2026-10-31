// Server-side Gemini calls. The API key lives only on the server (Cloud Run secret),
// never in the browser bundle. Prompts and schemas are fixed here so the public
// /api/ai endpoints can't be used as a general-purpose Gemini proxy.
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';
import type { Recipe, FeastMenu, FeastPlan, FoodPreferences } from '../types';

export interface InlineImage {
  data: string; // base64, no data: prefix
  mimeType: string;
}

/** Recipe form as sent by the browser: images already base64-encoded. */
export interface RecipeFormInput {
  images: InlineImage[];
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

export interface FeastFormInput {
  theme: string;
  guests: number;
  ageGroup: string;
  cuisine: string;
  allergies: string[];
  otherAllergies: string;
  images: InlineImage[];
  spices: string[];
  otherSpices: string;
}

let client: GoogleGenAI | null = null;

export const isAiConfigured = () => !!process.env.GEMINI_API_KEY;

const getClient = (): GoogleGenAI => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('AI features are not configured on this server (GEMINI_API_KEY is missing).');
  }
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
};

const ai = {
  models: {
    generateContent: (...args: Parameters<GoogleGenAI['models']['generateContent']>) =>
      getClient().models.generateContent(...args),
  },
};

const recipeSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        recipeName: { type: Type.STRING, description: 'The name of the recipe.'},
        description: { type: Type.STRING, description: 'A brief, enticing description of the dish.'},
        ingredients: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of ingredients used from what was available.',
        },
        instructions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Step-by-step cooking instructions.',
        },
        missingItems: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'A minimal list of essential items to buy. Should be empty if nothing is needed.',
        },
        cookingTime: { type: Type.INTEGER, description: 'Estimated cooking time in minutes.'}
      },
      required: ["recipeName", "description", "ingredients", "instructions", "missingItems", "cookingTime"],
    },
};

export const generateRecipes = async (formData: RecipeFormInput): Promise<Recipe[]> => {
  const imageParts = formData.images.map(img => ({ inlineData: img }));

  const allSpices = [...formData.spices, formData.otherSpices].filter(Boolean).join(', ');
  const allAllergies = [...formData.allergies, formData.otherAllergies].filter(Boolean).join(', ');

  const prompt = `You are a creative chef's assistant. Your goal is to suggest delicious recipes using only the ingredients provided, minimizing waste and the need for new groceries. Based on the following images of ingredients and user preferences, generate 2 recipe ideas.

- **User Preferences:**
- Cuisine Preference: ${formData.cuisine === 'Any' ? 'No specific preference, feel free to be creative!' : formData.cuisine}
- Allergies: ${allAllergies || 'None'} (strictly avoid these)
- Dietary Choices: ${formData.dietaryChoices.join(', ') || 'None'}
- Desired Mood: ${formData.mood}
- Meal Type: ${formData.mealType}
- Max Cooking Time: ${formData.cookingTime} minutes
- Servings: ${formData.servings} people
- Available Spices: ${allSpices || 'Basic spices like salt and pepper'}

For each recipe, provide the recipe name, a description, ingredients used, step-by-step instructions, and a minimal list of essential items to buy if something crucial is missing. If nothing is missing, the 'missingItems' list should be empty. Ensure the cooking time for each recipe is within the user's specified limit and the recipe strongly reflects the chosen cuisine.

Return the response as a JSON array adhering to the provided schema.
`;
  
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
        parts: [
            ...imageParts,
            { text: prompt }
        ]
    },
    config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
    }
  });

  const responseText = response.text.trim();
  try {
    const recipes: Recipe[] = JSON.parse(responseText);
    return recipes;
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", responseText);
    throw new Error("The AI returned an unexpected response format. Please try again.");
  }
};


const feastSchema = {
    type: Type.OBJECT,
    properties: {
      menuTitle: { type: Type.STRING, description: 'A creative title for the whole menu.' },
      description: { type: Type.STRING, description: 'A brief, thematic description of the feast.' },
      appetizer: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["name", "description"]
      },
      mainCourse: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["name", "description"]
      },
      dessert: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["name", "description"]
      },
      beverage: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["name", "description"]
      },
    },
    required: ["menuTitle", "description", "appetizer", "mainCourse", "dessert", "beverage"],
};

export const generateFeastMenu = async (formData: FeastFormInput): Promise<FeastMenu> => {
    const allAllergies = [...formData.allergies, formData.otherAllergies].filter(Boolean).join(', ');

    const prompt = `You are an expert event caterer. Plan a full course menu (appetizer, main course, dessert, and a beverage suggestion) for a feast based on the following details:
- **Theme/Occasion:** ${formData.theme}
- **Cuisine Preference:** ${formData.cuisine === 'Any' ? 'No specific preference, be creative with the theme.' : formData.cuisine}
- **Number of Guests:** ${formData.guests}
- **Guest Age Profile:** ${formData.ageGroup}
- **Allergies to Avoid:** ${allAllergies || 'None'} (strictly avoid any ingredients related to these allergies)

The menu should be cohesive and appropriate for the theme and strongly reflect the chosen cuisine. For each dish, provide the name and a brief, enticing description. Return the response as a single JSON object adhering to the provided schema.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: feastSchema
        }
    });
    
    const responseText = response.text.trim();
    try {
        const feastMenu: FeastMenu = JSON.parse(responseText);
        return feastMenu;
    } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", responseText);
        throw new Error("The AI returned an unexpected response format. Please try again.");
    }
};

const feastPlanSchema = {
    type: Type.OBJECT,
    properties: {
      feastTitle: { type: Type.STRING, description: 'The creative title for the whole menu, same as the input.' },
      feastDescription: { type: Type.STRING, description: 'The thematic description for the feast, same as the input.' },
      recipes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            course: { type: Type.STRING, description: 'The course category, e.g., "Appetizer", "Main Course", "Dessert", "Beverage".'},
            recipeName: { type: Type.STRING, description: 'The name of the recipe for this course.' },
            description: { type: Type.STRING, description: 'A brief description of the dish.' },
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of ALL ingredients required for this recipe.',
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Step-by-step cooking instructions for this recipe.',
            },
          },
          required: ["course", "recipeName", "description", "ingredients", "instructions"],
        },
      },
      missingItems: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'A consolidated, minimal list of essential items to buy for the ENTIRE feast. Should be empty if nothing is needed.',
      },
    },
    required: ["feastTitle", "feastDescription", "recipes", "missingItems"],
};

export const generateFeastPlan = async (formData: FeastFormInput, menuConcept: FeastMenu): Promise<FeastPlan> => {
    const imageParts = formData.images.map(img => ({ inlineData: img }));

    const allSpices = [...formData.spices, formData.otherSpices].filter(Boolean).join(', ');
    
    const prompt = `You are a master chef creating a detailed cooking plan.
**Menu Concept:** ${JSON.stringify(menuConcept)}
**Available Ingredients:** You will be provided images of the user's ingredients.
**Available Spices:** ${allSpices || 'Basic spices like salt and pepper'}

Your task is to convert this menu concept into a full, actionable plan. For each course in the menu (Appetizer, Main Course, Dessert, Beverage), provide a detailed recipe including:
1.  The course title (e.g., "Appetizer").
2.  The recipe name from the menu concept.
3.  A description of the dish.
4.  A complete list of ingredients required for the dish.
5.  Step-by-step instructions.

After creating the recipes, analyze ALL ingredients required for the ENTIRE feast. Compare this with the ingredients shown in the images and the listed spices. Then, create a single, consolidated list of 'missingItems' that the user needs to buy. If an ingredient seems to be available, do not add it to the missing list. Be conservative; only list what is clearly missing. If nothing is needed, this list must be empty.

Return the entire plan as a single JSON object adhering to the provided schema.
`;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                ...imageParts,
                { text: prompt }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: feastPlanSchema
        }
      });
      
      const responseText = response.text.trim();
      try {
          const feastPlan: FeastPlan = JSON.parse(responseText);
          return feastPlan;
      } catch (e) {
          console.error("Failed to parse Gemini response as JSON:", responseText);
          throw new Error("The AI returned an unexpected response format. Please try again.");
      }
};

const scanSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'The name of the ingredient, properly capitalized (e.g. "Whole wheat bread" or "Greek yogurt").' },
      cat: { type: Type.STRING, description: 'Category: "Produce", "Dairy & eggs", "Proteins", "Grains & pasta", or "Pantry staples".' },
      icon: { type: Type.STRING, description: 'Material Symbols Outlined icon name (e.g., "eco" for produce/herbs, "nutrition" for fruits/veg, "egg" for eggs, "icecream" or "lunch_dining" for yogurt/cheese/butter, "set_meal" for meat/fish, "grain" for legumes/spices, "rice_bowl" or "ramen_dining" or "bakery_dining" for grains, "water_drop" for oils/liquids).' }
    },
    required: ["name", "cat", "icon"]
  }
};

export const analyzeReceiptImage = async (image: InlineImage): Promise<{name: string, cat: string, icon: string}[]> => {
  const imagePart = { inlineData: image };

  const prompt = `Analyze this receipt image and identify all food ingredients or grocery items purchased. Extrapolate any abbreviated item names (e.g., "CHRY TOM" becomes "Cherry tomatoes", "ORG YOG" becomes "Greek yogurt"). For each item, classify its category into one of: "Produce", "Dairy & eggs", "Proteins", "Grains & pasta", "Pantry staples". Return a JSON array matching the schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [imagePart, prompt],
    config: {
      responseMimeType: "application/json",
      responseSchema: scanSchema
    }
  });

  const responseText = response.text.trim();
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", responseText);
    throw new Error("Could not parse receipt scan result. Please try again.");
  }
};

export const analyzeFridgeImage = async (image: InlineImage): Promise<{name: string, cat: string, icon: string}[]> => {
  const imagePart = { inlineData: image };

  const prompt = `Analyze this image of a refrigerator interior or pantry shelf. Spot all visible ingredients, food items, vegetables, dairy, or leftovers. For each item, classify its category into one of: "Produce", "Dairy & eggs", "Proteins", "Grains & pasta", "Pantry staples". Return a JSON array matching the schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [imagePart, prompt],
    config: {
      responseMimeType: "application/json",
      responseSchema: scanSchema
    }
  });

  const responseText = response.text.trim();
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", responseText);
    throw new Error("Could not parse fridge photo scan result. Please try again.");
  }
};

export const generateRecipesFromPantry = async (
  pantryIngredients: string[],
  prefs?: FoodPreferences,
  useSoon: string[] = [],
): Promise<Recipe[]> => {
  const dietLine = prefs?.diets.length
    ? `Every recipe MUST be suitable for these diets: ${prefs.diets.join(', ')}.`
    : '';
  const allergyLine = prefs?.allergies.length
    ? `The user is allergic to: ${prefs.allergies.join(', ')}. Never include these or ingredients containing them.`
    : '';
  const useSoonLine = useSoon.length
    ? `Prioritise these ingredients because they expire soon: ${useSoon.join(', ')}.`
    : '';
  const prompt = `You are a creative chef's assistant. Based on these ingredients currently in the user's pantry: ${pantryIngredients.join(', ')}, suggest 2 delicious recipes they can cook right now.
  ${dietLine}
  ${allergyLine}
  ${useSoonLine}
  Use the pantry ingredient names exactly as written above in the 'ingredients' list. If a step needs timing, end that instruction with "|M:SS" (for example "Simmer the rice.|12:00"). 
  Minimize the need for extra groceries, focusing heavily on what is already available. If a recipe needs some other basic kitchen staple, check if it's in the list. If any ingredients are missing, list them in 'missingItems'. Otherwise 'missingItems' should be empty.
  Return a JSON array of recipes matching the schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: recipeSchema
    }
  });

  const responseText = response.text.trim();
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", responseText);
    throw new Error("Failed to generate recipes from pantry. Please try again.");
  }
};