# PantryPal: Your AI Sous-Chef for Smart Cooking

## 1. Problem Statement
Every day, millions of households face the "What's for dinner?" dilemma, often resulting in decision fatigue, repetitive meals, or unnecessary grocery trips. Simultaneously, food waste is a global crisis, with a significant portion occurring at the consumer level because ingredients are forgotten in the back of the fridge or people don't know how to use what they have. Existing recipe apps often require users to buy *more* ingredients rather than helping them utilize what they *already* own.

## 2. Solution
**PantryPal** is an intelligent, vision-enabled culinary assistant that transforms the contents of your kitchen into delicious, personalized meals. By leveraging advanced AI (Gemini), PantryPal "sees" your ingredients through photo uploads and crafts recipes that prioritize what you have while minimizing what you need to buy. It bridges the gap between raw inventory and a finished plate, offering both quick daily solutions and comprehensive event planning. To ensure a seamless last-mile experience, PantryPal supports both direct fast-delivery deep-links (Swiggy Instamart and Zomato Blinkit) and cutting-edge **autonomous shopping** via the open-source **Swiggy Model Context Protocol (MCP) Server** integration.

## 3. Target User Journeys

### Journey A: The "Fridge-to-Table" Daily Cook
*   **Scenario**: A busy professional returns home at 7 PM with no plan for dinner.
*   **Action**: They snap a photo of their vegetable drawer and a half-empty pack of paneer.
*   **Experience**: PantryPal identifies the bell peppers, onions, and paneer. It suggests a "15-minute Kadai Paneer" that fits their "Quick & Easy" mood and "Vegetarian" dietary choice.
*   **Outcome**: A healthy meal is cooked in under 20 minutes using existing items, saving $20 on takeout and preventing the peppers from spoiling.

### Journey B: The "Stress-Free Host"
*   **Scenario**: A user is hosting a "Bollywood Night" themed dinner for 6 friends, some of whom have nut allergies.
*   **Action**: They select the "Host a Feast!" mode, enter the theme, and specify the allergy constraints.
*   **Experience**: The AI generates a cohesive 4-course menu (Appetizer, Main, Dessert, Beverage). After the user confirms the concept, they upload photos of their pantry.
*   **Outcome**: PantryPal provides detailed recipes for the entire menu and a consolidated "Minimal Grocery List" with direct links to Swiggy Instamart/Zomato Blinkit, and an automated prompt for **Swiggy MCP-enabled AI systems** to autonomously order the exact missing ingredients in seconds.

## 4. Future Scope
*   **Smart Inventory Tracking**: Integration with smart refrigerators or manual "pantry check-ins" to track ingredient expiration dates and send proactive recipe alerts.
*   **Nutritional Analytics**: Real-time calorie and macro-nutrient tracking based on the specific portions and ingredients used in generated recipes.
*   **Community Marketplace**: A platform for users to share "Pantry Wins"—creative recipes they discovered using odd combinations of leftovers.
*   **Voice-Guided Cooking**: A hands-free "Kitchen Mode" where the AI reads instructions aloud and answers questions like "What can I substitute for buttermilk?" in real-time.
*   **Full API Retail Integration**: Dynamic real-time cart synchronization directly with local retailers based on current local warehouse stock.
