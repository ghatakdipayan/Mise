import React, { useState } from 'react';
import { RecipeGenerator } from './components/RecipeGenerator';
import { FeastPlanner } from './components/FeastPlanner';

type AppMode = 'recipe' | 'feast';

const RecipeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
);

const FeastIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0 2c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4zm6 4h2v-1c0-1.84-1.2-3.4-2.8-3.8M6 16H4v-1c0-1.84 1.2-3.4 2.8-3.8" />
    </svg>
);

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode | null>(null);

  const Header = () => (
    <header className="w-full text-center py-8 bg-white shadow-lg border-b-4 border-brand-light">
      <h1 className="text-5xl font-serif text-brand-dark">PantryPal</h1>
      <p className="text-lg text-gray-600 mt-2">Your AI Sous-Chef for Smart Cooking</p>
    </header>
  );

  const ModeSelector = () => (
    <div className="text-center">
        <h2 className="text-3xl font-bold text-brand-dark mb-2">How can I help you today?</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">Choose an option to begin your culinary adventure. Whether you're planning tonight's dinner or a grand feast, I'm here to assist!</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div
                onClick={() => setMode('recipe')}
                className="p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transform transition-all duration-300 cursor-pointer border-4 border-transparent hover:border-brand-primary"
            >
                <RecipeIcon/>
                <h3 className="text-2xl font-bold text-brand-dark mb-2">What's in my Fridge?</h3>
                <p className="text-gray-600">Suggest creative recipes using the ingredients you already have. Reduce waste and discover new favorites.</p>
            </div>
            <div
                onClick={() => setMode('feast')}
                className="p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transform transition-all duration-300 cursor-pointer border-4 border-transparent hover:border-brand-primary"
            >
                <FeastIcon/>
                <h3 className="text-2xl font-bold text-brand-dark mb-2">Host a Feast!</h3>
                <p className="text-gray-600">Plan a complete, themed menu for any occasion. From appetizers to desserts, impress your guests with ease.</p>
            </div>
        </div>
    </div>
  );
  
  const handleBackToSelection = () => {
    setMode(null);
  };

  return (
    <div className="min-h-screen font-sans text-brand-text">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {mode === null ? (
            <ModeSelector />
        ) : (
            <>
                <div className="text-center mb-8">
                     <button onClick={handleBackToSelection} className="text-brand-primary font-semibold hover:underline">
                        &larr; Back to selection
                    </button>
                </div>
                <div className="mt-6 animate-fade-in">
                  {mode === 'recipe' ? <RecipeGenerator /> : <FeastPlanner />}
                </div>
            </>
        )}
      </main>
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Crafted with ❤️ by PantryPal AI</p>
      </footer>
    </div>
  );
};

export default App;