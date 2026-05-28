package com.example.pantrypal.data.repository

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Log
import com.example.pantrypal.BuildConfig
import com.example.pantrypal.data.model.*
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import com.google.ai.client.generativeai.type.generationConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import java.io.InputStream

class GeminiRepository(private val context: Context) {

    private val jsonInstance = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
    }

    private fun getModel(modelName: String = "gemini-1.5-flash"): GenerativeModel {
        val apiKey = BuildConfig.API_KEY
        if (apiKey.isEmpty()) {
            Log.e("GeminiRepository", "API_KEY is empty in BuildConfig!")
        }
        return GenerativeModel(
            modelName = modelName,
            apiKey = apiKey,
            generationConfig = generationConfig {
                responseMimeType = "application/json"
            }
        )
    }

    private fun loadBitmapFromUri(uriString: String): Bitmap? {
        return try {
            val uri = Uri.parse(uriString)
            val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
            BitmapFactory.decodeStream(inputStream)
        } catch (e: Exception) {
            Log.e("GeminiRepository", "Failed to load bitmap from uri: $uriString", e)
            null
        }
    }

    suspend fun generateRecipes(
        imageUris: List<String>,
        spices: List<String>,
        otherSpices: String,
        allergies: List<String>,
        otherAllergies: String,
        dietaryChoices: List<String>,
        mood: String,
        cookingTime: Int,
        servings: Int,
        mealType: String,
        cuisine: String
    ): List<Recipe> = withContext(Dispatchers.IO) {
        val model = getModel("gemini-1.5-flash")
        
        // Load bitmaps
        val bitmaps = imageUris.mapNotNull { loadBitmapFromUri(it) }

        val allSpices = (spices + otherSpices).filter { it.isNotBlank() }.joinToString(", ")
        val allAllergies = (allergies + otherAllergies).filter { it.isNotBlank() }.joinToString(", ")

        val prompt = """
            You are a creative chef's assistant. Your goal is to suggest delicious recipes using only the ingredients provided, minimizing waste and the need for new groceries. Based on the following images of ingredients and user preferences, generate 2 recipe ideas.

            - **User Preferences:**
            - Cuisine Preference: ${if (cuisine == "Any") "No specific preference, feel free to be creative!" else cuisine}
            - Allergies: ${allAllergies.ifBlank { "None" }} (strictly avoid these)
            - Dietary Choices: ${dietaryChoices.joinToString(", ").ifBlank { "None" }}
            - Desired Mood: $mood
            - Meal Type: $mealType
            - Max Cooking Time: $cookingTime minutes
            - Servings: $servings people
            - Available Spices: ${allSpices.ifBlank { "Basic spices like salt and pepper" }}

            For each recipe, provide the recipe name, a description, ingredients used, step-by-step instructions, and a minimal list of essential items to buy if something crucial is missing. If nothing is missing, the 'missingItems' list should be empty. Ensure the cooking time for each recipe is within the user's specified limit and the recipe strongly reflects the chosen cuisine.

            Return the response as a JSON array adhering to this schema:
            [
              {
                "recipeName": "String",
                "description": "String",
                "ingredients": ["String"],
                "instructions": ["String"],
                "missingItems": ["String"],
                "cookingTime": Integer
              }
            ]
        """.trimIndent()

        val inputContent = content {
            bitmaps.forEach { image(it) }
            text(prompt)
        }

        val response = model.generateContent(inputContent)
        val responseText = response.text ?: throw Exception("Empty response received from AI")
        Log.d("GeminiRepository", "Recipes Response: $responseText")
        
        try {
            jsonInstance.decodeFromString<List<Recipe>>(responseText)
        } catch (e: Exception) {
            Log.e("GeminiRepository", "JSON Parse error on response: $responseText", e)
            throw Exception("The AI returned an unexpected response format. Please try again.")
        }
    }

    suspend fun generateFeastMenu(
        theme: String,
        cuisine: String,
        guests: Int,
        ageGroup: String,
        allergies: List<String>,
        otherAllergies: String
    ): FeastMenu = withContext(Dispatchers.IO) {
        val model = getModel("gemini-1.5-flash")
        
        val allAllergies = (allergies + otherAllergies).filter { it.isNotBlank() }.joinToString(", ")

        val prompt = """
            You are an expert event caterer. Plan a full course menu (appetizer, main course, dessert, and a beverage suggestion) for a feast based on the following details:
            - **Theme/Occasion:** $theme
            - **Cuisine Preference:** ${if (cuisine == "Any") "No specific preference, be creative with the theme." else cuisine}
            - **Number of Guests:** $guests
            - **Guest Age Profile:** $ageGroup
            - **Allergies to Avoid:** ${allAllergies.ifBlank { "None" }} (strictly avoid any ingredients related to these allergies)

            The menu should be cohesive and appropriate for the theme and strongly reflect the chosen cuisine. For each dish, provide the name and a brief, enticing description.
            
            Return the response as a single JSON object adhering to this schema:
            {
              "menuTitle": "String",
              "description": "String",
              "appetizer": { "name": "String", "description": "String" },
              "mainCourse": { "name": "String", "description": "String" },
              "dessert": { "name": "String", "description": "String" },
              "beverage": { "name": "String", "description": "String" }
            }
        """.trimIndent()

        val response = model.generateContent(prompt)
        val responseText = response.text ?: throw Exception("Empty response received from AI")
        Log.d("GeminiRepository", "Feast Menu Response: $responseText")
        
        try {
            jsonInstance.decodeFromString<FeastMenu>(responseText)
        } catch (e: Exception) {
            Log.e("GeminiRepository", "JSON Parse error on response: $responseText", e)
            throw Exception("The AI returned an unexpected response format. Please try again.")
        }
    }

    suspend fun generateFeastPlan(
        theme: String,
        guests: Int,
        ageGroup: String,
        cuisine: String,
        allergies: List<String>,
        otherAllergies: String,
        imageUris: List<String>,
        spices: List<String>,
        otherSpices: String,
        menuConcept: FeastMenu
    ): FeastPlan = withContext(Dispatchers.IO) {
        val model = getModel("gemini-1.5-flash")
        
        val bitmaps = imageUris.mapNotNull { loadBitmapFromUri(it) }
        val allSpices = (spices + otherSpices).filter { it.isNotBlank() }.joinToString(", ")

        val conceptJson = """
            {
              "menuTitle": "${menuConcept.menuTitle}",
              "description": "${menuConcept.description}",
              "appetizer": { "name": "${menuConcept.appetizer.name}", "description": "${menuConcept.appetizer.description}" },
              "mainCourse": { "name": "${menuConcept.mainCourse.name}", "description": "${menuConcept.mainCourse.description}" },
              "dessert": { "name": "${menuConcept.dessert.name}", "description": "${menuConcept.dessert.description}" },
              "beverage": { "name": "${menuConcept.beverage.name}", "description": "${menuConcept.beverage.description}" }
            }
        """.trimIndent()

        val prompt = """
            You are a master chef creating a detailed cooking plan.
            **Menu Concept:** $conceptJson
            **Available Ingredients:** You will be provided images of the user's ingredients.
            **Available Spices:** ${allSpices.ifBlank { "Basic spices like salt and pepper" }}

            Your task is to convert this menu concept into a full, actionable plan. For each course in the menu (Appetizer, Main Course, Dessert, Beverage), provide a detailed recipe including:
            1. The course title (e.g., "Appetizer").
            2. The recipe name from the menu concept.
            3. A description of the dish.
            4. A complete list of ingredients required for the dish.
            5. Step-by-step instructions.

            After creating the recipes, analyze ALL ingredients required for the ENTIRE feast. Compare this with the ingredients shown in the images and the listed spices. Then, create a single, consolidated list of 'missingItems' that the user needs to buy. If an ingredient seems to be available, do not add it to the missing list. Be conservative; only list what is clearly missing. If nothing is needed, this list must be empty.

            Return the entire plan as a single JSON object adhering to this schema:
            {
              "feastTitle": "String",
              "feastDescription": "String",
              "recipes": [
                {
                  "course": "String",
                  "recipeName": "String",
                  "description": "String",
                  "ingredients": ["String"],
                  "instructions": ["String"]
                }
              ],
              "missingItems": ["String"]
            }
        """.trimIndent()

        val inputContent = content {
            bitmaps.forEach { image(it) }
            text(prompt)
        }

        val response = model.generateContent(inputContent)
        val responseText = response.text ?: throw Exception("Empty response received from AI")
        Log.d("GeminiRepository", "Feast Plan Response: $responseText")
        
        try {
            jsonInstance.decodeFromString<FeastPlan>(responseText)
        } catch (e: Exception) {
            Log.e("GeminiRepository", "JSON Parse error on response: $responseText", e)
            throw Exception("The AI returned an unexpected response format. Please try again.")
        }
    }
}
