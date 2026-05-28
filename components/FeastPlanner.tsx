import React, { useState } from 'react';
import type { FeastFormData, FeastMenu, FeastPlan } from '../types';
import { generateFeastMenu, generateFeastPlan } from '../services/geminiService';
import { ImageUploader } from './ImageUploader';
import { SwiggyMcpGuide } from './SwiggyMcpGuide';
import { Sparkles } from 'lucide-react';

const initialFormData: FeastFormData = {
    theme: '',
    guests: 4,
    ageGroup: 'Mixed Adults',
    cuisine: 'Any',
    allergies: [],
    otherAllergies: '',
    vegetables: [],
    fruits: [],
    proteins: [],
    greens: [],
    spices: [],
    otherSpices: '',
};

const ageGroupOptions = ['Young Children', 'Teenagers', 'Young Adults', 'Mixed Adults', 'Seniors'];
const cuisineOptions = ['Any', 'Indian', 'Chinese', 'South Indian', 'North Indian', 'Greek', 'Mediterranean', 'Italian', 'Mexican', 'Japanese', 'Thai', 'American'];
const allergyOptions = ['Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Soy', 'Wheat', 'Fish', 'Shellfish', 'Gluten', 'Sesame'];
const spiceOptions = ['Salt', 'Black Pepper', 'Cumin', 'Coriander', 'Turmeric', 'Paprika', 'Chili Powder', 'Garlic Powder', 'Onion Powder', 'Oregano', 'Basil', 'Rosemary'];

// Icons for form fields
const ThemeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const GuestsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const CuisineIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9m-9 9a9 9 0 00-9-9" /></svg>;
const AgeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ShoppingCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>;

// Icons for Menu
const AppetizerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.24a2 2 0 00-1.846 2.756l.542 1.918a2 2 0 001.846 1.244h8.824a2 2 0 001.846-1.244l.542-1.918a2 2 0 00-1.022-3.303z" /></svg>;
const MainCourseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 3v2c0 1.657-1.343 3-3 3h-1V5h-2v3H9V5H7v3H6c-1.657 0-3-1.343-3-3V3M3 9v2c0 1.657 1.343 3 3 3h1v7h2v-7h6v7h2v-7h1c1.657 0 3-1.343 3-3V9" /></svg>;
const DessertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const BeverageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14h2v6h-2zm0 8h2v2h-2z" transform="rotate(-45 12 12) translate(-2 -2) scale(0.9)" /><path d="M11 5h2v6h-2zm0 8h2v2h-2z" transform="rotate(-45 12 12) translate(-2 -2) scale(0.9)" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l-4-4 2-2 4 4-2 2z" transform="translate(1 1) scale(0.85)" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19l-4-4" /></svg>;

const getIconForCourse = (course: string) => {
    if (course.toLowerCase().includes('appetizer')) return <AppetizerIcon />;
    if (course.toLowerCase().includes('main')) return <MainCourseIcon />;
    if (course.toLowerCase().includes('dessert')) return <DessertIcon />;
    if (course.toLowerCase().includes('beverage')) return <BeverageIcon />;
    return null;
}

export const FeastPlanner: React.FC = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<FeastFormData>(initialFormData);
    const [menuConcept, setMenuConcept] = useState<FeastMenu | null>(null);
    const [feastPlan, setFeastPlan] = useState<FeastPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showMcpGuide, setShowMcpGuide] = useState(false);
    
    const handleMultiSelectChange = (field: 'allergies' | 'spices', value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(c => c !== value)
                : [...prev[field], value]
        }));
    };

    const handleGenerateMenu = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.theme) {
            setError("Please enter a theme for your feast!");
            return;
        }
        setIsLoading(true);
        setError(null);
        setMenuConcept(null);
        try {
            const result = await generateFeastMenu(formData);
            setMenuConcept(result);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePlan = async () => {
        if (!menuConcept) return;
        setIsLoading(true);
        setError(null);
        setFeastPlan(null);
        try {
            const result = await generateFeastPlan(formData, menuConcept);
            setFeastPlan(result);
            setStep(3);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setFormData(initialFormData);
        setMenuConcept(null);
        setFeastPlan(null);
        setError(null);
        setIsLoading(false);
        setStep(1);
    };

    const handleRedesign = () => {
        setMenuConcept(null);
        setError(null);
        setStep(1);
    }

    if (isLoading) {
        return (
            <div className="text-center p-12 bg-white rounded-xl shadow-lg max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-brand-dark mb-4">Planning Your Feast...</h2>
                <p className="text-gray-600 mb-6">Our AI caterer is designing the perfect menu for your occasion.</p>
                <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="text-center p-12 bg-white rounded-xl shadow-lg border-2 border-red-500 max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-red-600 mb-4">Oops! There was a hiccup.</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button onClick={handleReset} className="px-8 py-3 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-dark transition-colors">
                    Start Over
                </button>
            </div>
        );
    }
    
    const StepIndicator = () => (
        <div className="flex justify-between items-center w-full mb-8 max-w-md mx-auto">
            {[1, 2, 3].map((s, i) => (
                <React.Fragment key={s}>
                    <div className="flex items-center z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${step >= s ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
                    </div>
                    {i < 2 && (
                        <div className="flex-1 h-1 bg-gray-200">
                             <div className="h-1 bg-brand-primary transition-all duration-500" style={{ width: step > s ? '100%' : '0%' }}></div>
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
    
    const renderStepContent = () => {
        switch (step) {
            case 1:
                if (menuConcept) {
                    return (
                        <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-2xl animate-fade-in border-t-8 border-brand-primary">
                            <div className="text-center mb-8">
                                <h2 className="text-4xl font-serif text-brand-dark mb-2">{menuConcept.menuTitle}</h2>
                                <p className="text-gray-600 italic">{menuConcept.description}</p>
                            </div>
                            
                            <div className="space-y-6">
                                {[
                                    { title: 'Appetizer', data: menuConcept.appetizer, icon: <AppetizerIcon /> },
                                    { title: 'Main Course', data: menuConcept.mainCourse, icon: <MainCourseIcon /> },
                                    { title: 'Dessert', data: menuConcept.dessert, icon: <DessertIcon /> },
                                    { title: 'Beverage Suggestion', data: menuConcept.beverage, icon: <BeverageIcon /> },
                                ].map(course => (
                                    <div key={course.title} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-shrink-0">{course.icon}</div>
                                        <div>
                                            <h3 className="font-bold text-xl text-brand-dark">{course.title}</h3>
                                            <p className="font-semibold text-lg text-gray-800">{course.data.name}</p>
                                            <p className="text-sm text-gray-600">{course.data.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                                 <button onClick={handleRedesign} className="px-8 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors">
                                    Redesign Menu
                                </button>
                                 <button onClick={() => setStep(2)} className="px-8 py-3 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-dark transition-colors">
                                    Help me Cook &rarr;
                                </button>
                            </div>
                        </div>
                    )
                }
                return (
                    <>
                        <h2 className="text-3xl font-bold text-center text-brand-dark">Plan Your Perfect Feast</h2>
                        <p className="text-center text-gray-600 mb-8">Tell us about your event, and we'll craft a memorable menu concept.</p>
                        <form onSubmit={handleGenerateMenu} className="space-y-6">
                           {/* Form content from original component */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="theme" className="block text-lg font-medium text-gray-700 mb-2"><ThemeIcon />Theme or Occasion</label>
                                    <input type="text" id="theme" value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})} placeholder="e.g., Summer BBQ" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary" required/>
                                </div>
                                <div>
                                    <label htmlFor="cuisine" className="block text-lg font-medium text-gray-700 mb-2"><CuisineIcon />Cuisine Preference</label>
                                    <select id="cuisine" value={formData.cuisine} onChange={e => setFormData({...formData, cuisine: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary">
                                        {cuisineOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="guests" className="block text-lg font-medium text-gray-700 mb-2"><GuestsIcon/>Number of Guests</label>
                                    <input type="number" id="guests" min="1" max="100" value={formData.guests} onChange={e => setFormData({...formData, guests: parseInt(e.target.value)})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"/>
                                </div>
                                <div>
                                    <label htmlFor="ageGroup" className="block text-lg font-medium text-gray-700 mb-2"><AgeIcon />Guest Age Group</label>
                                    <select id="ageGroup" value={formData.ageGroup} onChange={e => setFormData({...formData, ageGroup: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary">
                                        {ageGroupOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </div>
                             </div>
                            <div>
                                <label className="block text-lg font-medium text-gray-700 mb-2">Allergies or Ingredients to Avoid</label>
                                <div className="flex flex-wrap gap-2">
                                    {allergyOptions.map(option => (
                                        <button key={option} type="button" onClick={() => handleMultiSelectChange('allergies', option)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${formData.allergies.includes(option) ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{option}</button>
                                    ))}
                                </div>
                                <input type="text" value={formData.otherAllergies} onChange={(e) => setFormData({...formData, otherAllergies: e.target.value})} placeholder="Any other allergies?" className="w-full mt-3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary" />
                            </div>
                            <div className="text-center pt-4">
                                <button type="submit" className="px-10 py-4 bg-brand-secondary text-brand-text rounded-full font-bold hover:bg-yellow-500 transition-colors text-xl shadow-md hover:shadow-lg">
                                    Design My Menu
                                </button>
                             </div>
                        </form>
                    </>
                );
            case 2:
                return (
                    <div className="space-y-8 animate-fade-in">
                        <h2 className="text-3xl font-bold text-center text-brand-dark">Step 2: Inventory Check</h2>
                        <p className="text-center text-gray-600">Now, show me what ingredients you have on hand.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <ImageUploader title="Vegetables" files={formData.vegetables} setFiles={(files) => setFormData({...formData, vegetables: files})} />
                            <ImageUploader title="Fruits" files={formData.fruits} setFiles={(files) => setFormData({...formData, fruits: files})} />
                            <ImageUploader title="Proteins" files={formData.proteins} setFiles={(files) => setFormData({...formData, proteins: files})} />
                            <ImageUploader title="Greens & Herbs" files={formData.greens} setFiles={(files) => setFormData({...formData, greens: files})} />
                        </div>
                        <div>
                            <label className="block text-lg font-medium text-gray-700 mb-2">Available Spices</label>
                            <div className="flex flex-wrap gap-2">
                                {spiceOptions.map(option => (
                                    <button key={option} type="button" onClick={() => handleMultiSelectChange('spices', option)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${formData.spices.includes(option) ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{option}</button>
                                ))}
                            </div>
                             <input type="text" value={formData.otherSpices} onChange={(e) => setFormData({...formData, otherSpices: e.target.value})} placeholder="Any other spices?" className="w-full mt-3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary" />
                        </div>
                        <div className="mt-12 flex justify-between">
                             <button onClick={() => setStep(1)} className="px-8 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors">Back</button>
                            <button onClick={handleGeneratePlan} className="px-8 py-3 bg-brand-secondary text-brand-text rounded-full font-bold hover:bg-yellow-500 transition-colors ml-auto text-lg">Generate Cooking Plan!</button>
                        </div>
                    </div>
                );
            case 3:
                if (feastPlan) {
                     return (
                        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-2xl animate-fade-in border-t-8 border-brand-primary">
                            <div className="text-center mb-8">
                                <h2 className="text-4xl font-serif text-brand-dark mb-2">{feastPlan.feastTitle}</h2>
                                <p className="text-gray-600 italic">{feastPlan.feastDescription}</p>
                            </div>

                            <div className="space-y-8">
                                {feastPlan.recipes.map((recipe, index) => (
                                    <div key={index} className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-start space-x-4 mb-4">
                                            <div className="flex-shrink-0 pt-1">{getIconForCourse(recipe.course)}</div>
                                            <div>
                                                <h3 className="font-bold text-xl text-brand-dark">{recipe.course}</h3>
                                                <p className="font-semibold text-lg text-gray-800">{recipe.recipeName}</p>
                                                <p className="text-sm text-gray-600">{recipe.description}</p>
                                            </div>
                                        </div>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="font-bold text-lg mb-2 text-gray-800">Ingredients</h4>
                                                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                                                    {recipe.ingredients.map((item, i) => <li key={i}>{item}</li>)}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg mb-2 text-gray-800">Instructions</h4>
                                                <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
                                                    {recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
                                                </ol>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                             {feastPlan.missingItems && feastPlan.missingItems.length > 0 && (
                                <div className="mt-8 p-4 bg-yellow-100 border-l-4 border-brand-secondary rounded-r-lg">
                                    <h4 className="font-bold text-xl text-yellow-800 flex items-center"><ShoppingCartIcon/> Consolidated Grocery List</h4>
                                    <ul className="list-disc list-inside space-y-1 text-yellow-800 my-2">
                                    {feastPlan.missingItems.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                    <p className="text-yellow-700 text-sm mb-3 font-medium">Get them delivered in minutes:</p>
                                    <div className="flex flex-wrap gap-3">
                                        <a href={`https://www.swiggy.com/instamart/search?query=${encodeURIComponent(feastPlan.missingItems.join(' '))}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-pink-600 text-white text-sm font-semibold rounded-lg hover:bg-pink-700 transition-colors shadow">Order on Swiggy Instamart</a>
                                        <a href={`https://blinkit.com/search?q=${encodeURIComponent(feastPlan.missingItems.join(' '))}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow">Order on Blinkit (Zomato)</a>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowMcpGuide(true)} 
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow flex items-center gap-1.5 focus:ring-2 focus:ring-indigo-300 pointer-events-auto cursor-pointer"
                                        >
                                            <Sparkles className="h-4 w-4" /> Order via Swiggy MCP
                                        </button>
                                    </div>
                                </div>
                            )}

                            <SwiggyMcpGuide 
                                isOpen={showMcpGuide} 
                                onClose={() => setShowMcpGuide(false)} 
                                missingItems={feastPlan.missingItems} 
                            />

                            <div className="text-center mt-10">
                                 <button onClick={handleReset} className="px-8 py-3 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-dark transition-colors">
                                    Plan Another Feast
                                </button>
                            </div>
                        </div>
                    )
                }
                return null;
            default:
                return null;
        }
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            {step > 1 && <StepIndicator />}
            {renderStepContent()}
        </div>
    );
};