import React, { useState, useCallback } from 'react';
import type { FormData, ImageFile, Recipe } from '../types';
import { generateRecipes } from '../services/geminiService';
import { ImageUploader } from './ImageUploader';
import { RecipeCard } from './RecipeCard';

const initialFormData: FormData = {
  vegetables: [],
  fruits: [],
  proteins: [],
  greens: [],
  spices: [],
  otherSpices: '',
  allergies: [],
  otherAllergies: '',
  dietaryChoices: [],
  mood: 'Comfort Food',
  cookingTime: 30,
  servings: 2,
  mealType: 'Dinner',
  cuisine: 'Any',
};

const dietaryOptions = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free', 'Keto'];
const moodOptions = ['Comfort Food', 'Light & Healthy', 'Quick & Easy', 'Spicy', 'Adventurous'];
const mealTypeOptions = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];
const cuisineOptions = ['Any', 'Indian', 'Chinese', 'South Indian', 'North Indian', 'Greek', 'Mediterranean', 'Italian', 'Mexican', 'Japanese', 'Thai', 'American'];
const spiceOptions = ['Salt', 'Black Pepper', 'Cumin', 'Coriander', 'Turmeric', 'Paprika', 'Chili Powder', 'Garlic Powder', 'Onion Powder', 'Oregano', 'Basil', 'Rosemary'];
const allergyOptions = ['Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Soy', 'Wheat', 'Fish', 'Shellfish', 'Gluten', 'Sesame'];


export const RecipeGenerator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);
  
  const handleMultiSelectChange = (field: 'dietaryChoices' | 'spices' | 'allergies', value: string) => {
    setFormData(prev => ({
        ...prev,
        [field]: prev[field].includes(value)
            ? prev[field].filter(c => c !== value)
            : [...prev[field], value]
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setRecipes([]);
    try {
      const result = await generateRecipes(formData);
      setRecipes(result);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setFormData(initialFormData);
    setRecipes([]);
    setError(null);
    setIsLoading(false);
    setStep(1);
  };

  const StepIndicator = () => (
    <div className="flex justify-between items-center w-full mb-8">
        <div className="flex items-center z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${step >= 1 ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
        </div>
        <div className="flex-1 h-1 bg-gray-200">
            <div className="h-1 bg-brand-primary transition-all duration-500" style={{ width: step > 1 ? '100%' : '0%' }}></div>
        </div>
        <div className="flex items-center z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${step >= 2 ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
        </div>
        <div className="flex-1 h-1 bg-gray-200">
            <div className="h-1 bg-brand-primary transition-all duration-500" style={{ width: step > 2 ? '100%' : '0%' }}></div>
        </div>
        <div className="flex items-center z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${step >= 3 ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
        </div>
    </div>
);

  
  const ChoiceButton = ({ label, field, options }: { label: string, field: 'dietaryChoices' | 'spices' | 'allergies', options: string[]}) => (
    <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex flex-wrap gap-2">
            {options.map(option => (
                <button key={option} type="button" onClick={() => handleMultiSelectChange(field, option)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${formData[field].includes(option) ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{option}</button>
            ))}
        </div>
    </div>
  )


  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-brand-dark">Step 1: Upload Your Ingredients</h2>
            <p className="text-center text-gray-600">Show me what you've got! Snap a picture of your available items.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ImageUploader title="Vegetables" files={formData.vegetables} setFiles={(files) => setFormData({...formData, vegetables: files})} />
                <ImageUploader title="Fruits" files={formData.fruits} setFiles={(files) => setFormData({...formData, fruits: files})} />
                <ImageUploader title="Proteins" files={formData.proteins} setFiles={(files) => setFormData({...formData, proteins: files})} />
                <ImageUploader title="Greens & Herbs" files={formData.greens} setFiles={(files) => setFormData({...formData, greens: files})} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8 animate-fade-in">
             <h2 className="text-3xl font-bold text-center text-brand-dark">Step 2: Tastes & Preferences</h2>
             <p className="text-center text-gray-600">Let's fine-tune the flavor profile to your liking.</p>
             <div className="space-y-6">
                <ChoiceButton label="Available Spices" field="spices" options={spiceOptions} />
                <input type="text" value={formData.otherSpices} onChange={(e) => setFormData({...formData, otherSpices: e.target.value})} placeholder="Any other spices?" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary" />
                
                <ChoiceButton label="Allergies or Ingredients to Avoid" field="allergies" options={allergyOptions} />
                <input type="text" value={formData.otherAllergies} onChange={(e) => setFormData({...formData, otherAllergies: e.target.value})} placeholder="Any other allergies?" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary" />

                <ChoiceButton label="Dietary Choices" field="dietaryChoices" options={dietaryOptions} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">Cuisine Preference</label>
                        <select value={formData.cuisine} onChange={(e) => setFormData({...formData, cuisine: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary">
                            {cuisineOptions.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">What's your mood?</label>
                        <select value={formData.mood} onChange={(e) => setFormData({...formData, mood: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary">
                            {moodOptions.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </div>
                </div>
             </div>
          </div>
        );
      case 3:
        return (
            <div className="space-y-8 animate-fade-in">
                <h2 className="text-3xl font-bold text-center text-brand-dark">Step 3: The Finishing Touches</h2>
                <p className="text-center text-gray-600">Almost there! Just a few more details.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">Meal Type</label>
                        <select value={formData.mealType} onChange={(e) => setFormData({...formData, mealType: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary">
                            {mealTypeOptions.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="servings" className="block text-lg font-medium text-gray-700 mb-2">How many people?</label>
                        <input type="number" id="servings" min="1" max="20" value={formData.servings} onChange={(e) => setFormData({...formData, servings: parseInt(e.target.value)})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="cookingTime" className="block text-lg font-medium text-gray-700 mb-2">How much time do you have? <span className="font-bold text-brand-primary">{formData.cookingTime} minutes</span></label>
                        <input type="range" id="cookingTime" min="10" max="120" step="5" value={formData.cookingTime} onChange={(e) => setFormData({...formData, cookingTime: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary" />
                    </div>
                </div>
            </div>
        );
        case 4:
            return (
                <div className="animate-fade-in">
                    <h2 className="text-3xl font-bold text-center text-brand-dark mb-6">Your Culinary Creations!</h2>
                    <div className="space-y-8">
                        {recipes.map((recipe, index) => <RecipeCard key={index} recipe={recipe} />)}
                    </div>
                </div>
            );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
        <div className="text-center p-12 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-brand-dark mb-4">Crafting Your Recipes...</h2>
            <p className="text-gray-600 mb-6">Our AI chef is checking your ingredients and firing up the oven!</p>
            <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="text-center p-12 bg-white rounded-xl shadow-lg border-2 border-red-500">
            <h2 className="text-3xl font-bold text-red-600 mb-4">Oops! Something went wrong.</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={handleReset} className="px-8 py-3 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-dark transition-colors">
                Start Over
            </button>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      {step < 4 && <StepIndicator />}
      <div className="mt-8">
        {renderStep()}
      </div>

      <div className="mt-12 flex justify-between">
        {step > 1 && step < 4 && (
          <button onClick={handleBack} className="px-8 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors">
            Back
          </button>
        )}
        {step < 3 && (
          <button onClick={handleNext} className="px-8 py-3 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-dark transition-colors ml-auto">
            Next
          </button>
        )}
        {step === 3 && (
          <button onClick={handleSubmit} className="px-8 py-3 bg-brand-secondary text-brand-text rounded-full font-bold hover:bg-yellow-500 transition-colors ml-auto text-lg">
            Generate Recipes!
          </button>
        )}
        {step === 4 && (
            <button onClick={handleReset} className="px-8 py-3 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-dark transition-colors mx-auto">
                Create a New Meal
            </button>
        )}
      </div>
    </div>
  );
};