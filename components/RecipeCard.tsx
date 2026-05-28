import React, { useState, useEffect } from 'react';
import type { Recipe } from '../types';
import { SwiggyMcpGuide } from './SwiggyMcpGuide';
import { Sparkles } from 'lucide-react';

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clipRule="evenodd" />
    </svg>
);
const ShoppingCartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${filled ? 'text-red-500' : 'text-gray-400'}`} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

export const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showMcpGuide, setShowMcpGuide] = useState(false);

  useEffect(() => {
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    const alreadySaved = savedRecipes.some((r: Recipe) => r.recipeName === recipe.recipeName);
    setIsSaved(alreadySaved);
  }, [recipe.recipeName]);

  const handleSave = () => {
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    if (isSaved) {
      const updatedRecipes = savedRecipes.filter((r: Recipe) => r.recipeName !== recipe.recipeName);
      localStorage.setItem('savedRecipes', JSON.stringify(updatedRecipes));
      setIsSaved(false);
    } else {
      savedRecipes.push(recipe);
      localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
      setIsSaved(true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 relative">
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-3xl font-serif text-brand-dark pr-8">{recipe.recipeName}</h3>
          <button 
            onClick={handleSave}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title={isSaved ? "Remove from saved" : "Save recipe"}
          >
            <HeartIcon filled={isSaved} />
          </button>
        </div>
        <p className="text-gray-600 mb-4">{recipe.description}</p>
        <div className="flex items-center text-brand-dark font-semibold mb-6">
            <ClockIcon /> {recipe.cookingTime} minutes
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-xl mb-2 text-gray-800">Ingredients Used</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {recipe.ingredients.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xl mb-2 text-gray-800">Instructions</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              {recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
        </div>

        {recipe.missingItems && recipe.missingItems.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-brand-secondary rounded-r-lg">
            <h4 className="font-bold text-lg text-yellow-800 flex items-center"><ShoppingCartIcon/> Minimal Grocery List</h4>
            <ul className="list-disc list-inside space-y-1 text-yellow-800 my-2">
              {recipe.missingItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            <p className="text-yellow-700 text-sm mb-3 font-medium">Get them delivered in minutes:</p>
            <div className="flex flex-wrap gap-3">
                <a 
                    href={`https://www.swiggy.com/instamart/search?query=${encodeURIComponent(recipe.missingItems.join(' '))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-pink-600 text-white text-sm font-semibold rounded-lg hover:bg-pink-700 transition-colors shadow"
                >
                    Order on Swiggy Instamart
                </a>
                <a 
                    href={`https://blinkit.com/search?q=${encodeURIComponent(recipe.missingItems.join(' '))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow"
                >
                    Order on Blinkit (Zomato)
                </a>
                <button 
                    type="button"
                    onClick={() => setShowMcpGuide(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow flex items-center gap-1.5 focus:ring-2 focus:ring-indigo-300"
                >
                    <Sparkles className="h-4 w-4" /> Order via Swiggy MCP
                </button>
            </div>
          </div>
        )}
        <SwiggyMcpGuide 
          isOpen={showMcpGuide} 
          onClose={() => setShowMcpGuide(false)} 
          missingItems={recipe.missingItems} 
        />
      </div>
    </div>
  );
};