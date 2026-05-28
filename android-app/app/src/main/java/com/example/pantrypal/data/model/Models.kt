package com.example.pantrypal.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Recipe(
    val recipeName: String,
    val description: String,
    val ingredients: List<String>,
    val instructions: List<String>,
    val missingItems: List<String> = emptyList(),
    val cookingTime: Int
)

@Serializable
data class Dish(
    val name: String,
    val description: String
)

@Serializable
data class FeastMenu(
    val menuTitle: String,
    val description: String,
    val appetizer: Dish,
    val mainCourse: Dish,
    val dessert: Dish,
    val beverage: Dish
)

@Serializable
data class DetailedRecipe(
    val course: String,
    val recipeName: String,
    val description: String,
    val ingredients: List<String>,
    val instructions: List<String>
)

@Serializable
data class FeastPlan(
    val feastTitle: String,
    val feastDescription: String,
    val recipes: List<DetailedRecipe>,
    val missingItems: List<String> = emptyList()
)

data class SelectedImage(
    val id: String,
    val uriString: String? = null,
    val name: String
)
