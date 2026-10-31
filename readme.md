# Mise: Your AI Sous-Chef for Smart Cooking

Mise is a vision-enabled culinary assistant designed to minimize food waste and eliminate decision fatigue in the kitchen. By leveraging advanced AI, Mise "sees" the ingredients you already own through photos of your fridge or uploaded grocery receipts, crafting tailored recipe ideas so you can cook right away without unnecessary shopping trips. 

This repository implements the premium, unified mobile-app mockup experience centered in a responsive desktop device container.

---

## Key Features

### 1. Vision-Based Pantry Scanning (Gemini 2.5 Flash)
Using the `@google/genai` SDK, users can scan or upload a file directly to classify and restock items:
- **Scan Receipt**: Analyzes a paper receipt to extract item names, map categories, and determine icons automatically.
- **Fridge Photo**: Scans pantry shelf photos to identify and track visible ingredients.
- **Connection Simulation**: Simulates order-history integration for apps like *Swiggy Instamart*, *Blinkit*, *Zepto*, *Amazon Fresh*, and *BigBasket*.
- *Note: A built-in simulation mode is available for offline validation and demo purposes.*

### 2. Multi-Theme Custom Styling System
The app features three distinct design themes selector accessible via the user avatar:
- **Fresh (Clean White & Garden Green)**: High-contrast, friendly rounded components (`--r: 22px`).
- **Warm (Cosy Cookbook)**: Earthy cookbook textures featuring elegant serif headings (`Newsreader` serif font) and soft corners (`--r: 16px`).
- **Mono (Bold Minimal)**: Dynamic high-contrast minimal theme featuring tight spacing and high-impact borders (`--r: 10px`).

### 3. Step-by-Step Cooking Guide (Cook Mode)
Provides a focused step-by-step kitchen assistant layout:
- Visible progress bar showing the percentage completion.
- Big counter numbers.
- Automated timer detection (e.g. tracking steps that require precise boiling or searing times).
- Completion toasts when the meal is finished.

### 4. Interactive Weekly Meal Planner
Allows planning meals across a Monday–Sunday grid:
- Highlighted **Today** badge indicators.
- Lunch and Dinner planning slots.
- Recipe Picker bottom drawer that displays recipes sorted by ingredient readiness (fully ready recipes appear first).

### 5. Categorized Inventory & Expirations
- Pantry items are sorted by category: *Produce*, *Dairy & Eggs*, *Proteins*, *Grains & Pasta*, and *Pantry Staples*.
- Proactive **Use Soon** horizontal carousel highlighting ingredients expiring in 3 days or less.
- Search-bar functionality for direct pantry exploration.

### 6. Intelligent Shopping Lists & Swiggy MCP Integration
- Automatically groups missing recipe ingredients into shopping aisles.
- Supports checking off items (strike-through) and clearing completed lists.
- Provides a detailed modal guide for configure a **Swiggy Model Context Protocol (MCP) Server** to automate grocery checkout directly from your local Claude Desktop configuration.

### 7. Launch-readiness features
- **Saved on device**: pantry, shopping list, weekly plan, AI recipes, theme and food preferences survive reloads. The plan resets automatically each new week.
- **Real expiry dates**: every pantry item has a use-by date that counts down daily. Restocked items get a shelf life by category (produce 5 days, proteins 3, dairy 10, grains 180, staples 365).
- **Manual pantry editing**: add an item, change quantity, category or use-by date, or remove it.
- **"I cooked this"**: finishing Cook Mode asks which ingredients you used up and removes them from the pantry.
- **Working timers**: timed steps in Cook Mode run a real countdown with pause, reset, a beep and vibration.
- **Bought → pantry**: ticked shopping-list items move into the pantry in one tap.
- **Shop for the week**: one tap adds every missing ingredient for this week's planned recipes to the list.
- **Diet and allergy preferences**: set in the avatar menu; AI Chef follows them and recipes that clash show a warning.
- **Works without an API key**: the app loads and demo modes work; AI features explain that a key is needed.

---

## Directory Architecture

```
Mise/
├── App.tsx                    # Coordinates global states and active sheets
├── index.html                 # Hosts Google Fonts and Material Icon sets
├── index.css                  # Handles animations, scrollbar hide, and resets
├── types.ts                   # Unified TypeScript definitions
├── components/
│   ├── Onboarding.tsx         # Welcome screens slider
│   ├── CookTab.tsx            # Home greeting, cards list, and AI recipe generator
│   ├── PantryTab.tsx          # Inventory categorization and search
│   ├── PlanTab.tsx            # Weekly slot scheduler
│   ├── ListTab.tsx            # Shopping items grouped by aisle
│   ├── RecipeDetail.tsx       # Ingredients checklist overlay
│   ├── CookMode.tsx           # Step-by-step active cooking interface
│   ├── RefreshHub.tsx         # Receipts scanner, cameras, and API links
│   ├── AppearanceSheet.tsx    # App styling custom variables configuration
│   ├── RecipePicker.tsx       # Sorted recipe planning drawer
│   ├── PantryItemSheet.tsx    # Add / edit / remove a pantry item
│   └── SwiggyMcpGuide.tsx     # Swiggy MCP Server instructions
├── server/
│   ├── index.ts               # Node server: app hosting, /api/ai, /swiggy-api relay
│   └── gemini.ts              # Gemini prompts and schemas (server-side only)
├── services/
│   ├── geminiService.ts       # Browser wrappers that call /api/ai
│   ├── swiggyMcp.ts           # Swiggy Instamart OAuth + MCP client
│   └── firebase.ts            # Google sign-in
├── utils/
│   └── pantry.ts              # Expiry dates, ingredient matching, allergens, device storage
├── Key_Artifacts/             # Six-page narrative and launch news briefing
├── Dockerfile                 # Cloud Run image
└── deploy.sh                  # One-command deploy to GCP
```

---

## Local Development

### 1. Environment configuration
Copy `.env.example` to `.env` and add your Gemini API key. The key is used only by the server (`server/gemini.ts`) and is never sent to the browser:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
Firebase values are optional locally; without them the app uses a mock sign-in.

### 2. Commands
```bash
npm install
npm run dev        # app + API on http://localhost:3000 (Vite hot reload inside the Node server)
npm run build      # builds the app (dist/) and the server (dist-server/)
npm start          # runs the production build on http://localhost:8080
npm run typecheck
```

---

## Hosting on Google Cloud (Cloud Run)

Mise runs as one Cloud Run service, `mise`, in project `pantrypal-ai-488608` (region `asia-south1`, Mumbai). The same Node server:
- serves the built app,
- runs every Gemini call server-side at `/api/ai/*` (fixed prompts, per-IP rate limit; key from Secret Manager),
- relays Swiggy Instamart MCP calls at `/swiggy-api/*` (Swiggy blocks direct browser calls).

### Deploy
In [Google Cloud Shell](https://shell.cloud.google.com) (already signed in to the right Google account):
```bash
git clone https://github.com/ghatakdipayan/Mise.git
cd Mise
./deploy.sh
```
The script is safe to re-run. It uses the existing project (never creates one) and:
1. enables Cloud Run, Cloud Build, Artifact Registry, Secret Manager, Firebase and Identity Toolkit APIs;
2. asks for your Gemini API key once and stores it in Secret Manager as `gemini-api-key`;
3. reads the project's Firebase web app config so Google sign-in works;
4. builds the `Dockerfile` with Cloud Build and deploys to Cloud Run;
5. adds the Cloud Run address to Firebase Auth's authorized domains;
6. prints the live URL and checks `/healthz`.

Rotate the Gemini key: `gcloud secrets versions add gemini-api-key --data-file=-`, then re-run `./deploy.sh`.
