package com.example.pantrypal

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable
data object Main : NavKey

@Serializable
data object RecipeGenerator : NavKey

@Serializable
data object FeastPlanner : NavKey
