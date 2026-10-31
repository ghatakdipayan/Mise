# Mise Launch — News Briefing

As of 31 Oct 2026 · Owner: Dipayan Ghatak
Editable source: [Claude Doc](https://claude.ai/artifact/BDqyw51AhEEvDmk2MEzX21)

## Press release

*Draft for internal review. Launch date and market are placeholders until confirmed.*

### Meet Mise: the AI sous-chef that cooks from what's already in your fridge

**Snap your fridge, scan a receipt or connect Swiggy Instamart, and Mise tells you what you can cook tonight, plans your week and lists only what you're missing.**

**[CITY], [LAUNCH DATE]** — Today Mise launches a free, installable web app that turns the groceries you already own into meals you can make right now. Instead of starting with a recipe and shopping for it, Mise starts with your kitchen.

Most recipe apps answer "what's a good dinner?". Home cooks are really asking "what can I make with what I have, before the spinach goes off?" The result is decision fatigue at 7 pm, food thrown away, and repeat orders for things already in the fridge.

Mise fixes this in three steps. **Stock** your pantry in seconds: photograph a grocery receipt or the inside of your fridge and Mise's AI identifies and files every item, or connect your Swiggy Instamart account and import the last week of orders automatically. **Cook** from a list of recipes ranked by how many ingredients you already have, with a clear "Ready" or "Need 1" on every card; tap AI Chef for fresh ideas built only from your pantry and your diet, then follow a distraction-free Cook Mode with built-in timers. When you finish, tell Mise what you used up and your pantry updates itself. **Plan and shop** across the week with lunch and dinner slots that can hold a recipe, an order-in night or a meal out, then tap once to send every missing ingredient for the week to an aisle-sorted shopping list. Tick items off in the shop and they move straight into your pantry.

Mise also watches the clock for you. A "Use soon" strip puts everything expiring in the next three days at the top of your pantry, so the avocado gets eaten before it turns. Every item carries a real use-by date you can adjust, and recipes that clash with your diet or allergies are flagged before you start.

Mise works on any phone or computer, installs to the home screen like an app, signs in with Google, remembers your kitchen between visits, and comes in three looks: Fresh, Warm and Mono.

## What you can do with Mise

| Feature | What it does for you | Where |
| --- | --- | --- |
| Receipt scan | Photo of a paper receipt becomes pantry items, abbreviations decoded | Pantry → Refresh |
| Fridge photo | Spots visible ingredients on your shelves and files them | Pantry → Refresh |
| Swiggy Instamart import | Pulls items from your last 7 days of orders after a secure sign-in | Pantry → Refresh |
| Pantry editing | Add, edit or remove any item, including its use-by date | Pantry → Add, or tap an item |
| Use soon | Everything expiring within 3 days, front and centre; dates count down daily | Pantry |
| Ready-to-cook ranking | Every recipe shows Ready or Need N, fewest missing first | Cook |
| AI Chef | Two new recipes from what you have, following your diet and using up what expires first | Cook |
| Diet and allergy check | Flags recipes that clash with vegetarian, vegan, gluten-free and other settings, or with allergies | Avatar menu; recipe page |
| One-tap shopping | Add one or all missing ingredients to your list | Recipe |
| Cook Mode | One step at a time, progress bar, running timers with an alert | Recipe → Start cooking |
| I cooked this | After cooking, tick what you used up and it leaves your pantry | End of Cook Mode |
| Weekly planner | Lunch and dinner for this week: cook, order in or eat out | Plan |
| Shop for the week | Every missing ingredient for planned meals goes on the list | Plan |
| Smart shopping list | Sorted by aisle; bought items move to the pantry in one tap; prompt for ordering via Claude + Swiggy MCP | List |
| Remembers your kitchen | Pantry, list, plan and settings are saved on your device | Everywhere |
| Themes | Fresh, Warm or Mono | Avatar menu |

## Quotes and availability

*Quotes are placeholders written to the product's intent; replace them with real ones before release.*

"We kept seeing the same thing: people with a full fridge ordering dinner because they couldn't think what to make," said [Founder name], founder of Mise. "Mise flips the question. It starts with what you own, and only sends you shopping for the one thing you're missing."

"I scanned my Instamart orders on Sunday and by Wednesday I'd cooked three dinners without buying anything new. The 'use soon' list alone saved me a bag of spinach," said [Beta user name], a home cook in [City].

**Availability.** Mise is free and available today at [URL] on any modern phone or computer browser, and can be installed to the home screen. Sign in with a Google account. Live Swiggy Instamart import is available to Swiggy customers; Blinkit, Zepto, Amazon Fresh and BigBasket are coming soon.

## Briefing notes (internal)

**The one-line story:** Mise starts dinner from your fridge, not from a recipe.

**Talking points**

- Three ways to stock a pantry in seconds: receipt photo, fridge photo, Swiggy Instamart order history.
- Every recipe is ranked by what you already own; nothing else in the app is sorted by popularity.
- Waste reduction is built in: a three-day "Use soon" strip leads the pantry.
- Powered by Google Gemini 2.5 Flash for vision and recipe generation; Swiggy integration uses Swiggy's official MCP server with secure OAuth sign-in.

**Do not claim yet** (true in the code today, so avoid until fixed):

- That your kitchen syncs across devices: it is saved on one device only.
- Live ordering or checkout: Mise reads Swiggy orders but does not place them.
- Blinkit, Zepto, Amazon Fresh or BigBasket support: these are demos.
- That use-by dates are read from packaging: they are category estimates the user can edit.
- Any usage or waste-saved numbers: there is no analytics yet.

**Before this release goes out:** confirm launch market and date, choose a host and move the Gemini key and Swiggy proxy server-side, and replace placeholder quotes. Saving data, timers, pantry editing and the cooking-to-pantry loop shipped on 31 Oct 2026.
