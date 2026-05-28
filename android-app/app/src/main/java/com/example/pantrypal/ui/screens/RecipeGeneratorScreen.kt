package com.example.pantrypal.ui.screens

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.pantrypal.data.model.Recipe
import com.example.pantrypal.data.model.SelectedImage
import com.example.pantrypal.data.repository.GeminiRepository
import com.example.pantrypal.theme.*
import com.example.pantrypal.ui.components.RecipeCard
import kotlinx.coroutines.launch
import java.util.UUID

private val dietaryOptions = listOf("Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Keto")
private val moodOptions = listOf("Comfort Food", "Light & Healthy", "Quick & Easy", "Spicy", "Adventurous")
private val mealTypeOptions = listOf("Breakfast", "Lunch", "Dinner", "Snack", "Dessert")
private val cuisineOptions = listOf("Any", "Indian", "Chinese", "South Indian", "North Indian", "Greek", "Mediterranean", "Italian", "Mexican", "Japanese", "Thai", "American")
private val spiceOptions = listOf("Salt", "Black Pepper", "Cumin", "Coriander", "Turmeric", "Paprika", "Chili Powder", "Garlic Powder", "Onion Powder", "Oregano", "Basil", "Rosemary")
private val allergyOptions = listOf("Peanuts", "Tree Nuts", "Milk", "Eggs", "Soy", "Wheat", "Fish", "Shellfish", "Gluten", "Sesame")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecipeGeneratorScreen(
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val repository = remember { GeminiRepository(context) }

    var step by remember { mutableStateOf(1) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var recipes by remember { mutableStateOf<List<Recipe>>(emptyList()) }

    // Form states
    var vegetables by remember { mutableStateOf<List<SelectedImage>>(emptyList()) }
    var fruits by remember { mutableStateOf<List<SelectedImage>>(emptyList()) }
    var proteins by remember { mutableStateOf<List<SelectedImage>>(emptyList()) }
    var greens by remember { mutableStateOf<List<SelectedImage>>(emptyList()) }
    
    val selectedSpices = remember { mutableStateListOf<String>() }
    var otherSpices by remember { mutableStateOf("") }
    
    val selectedAllergies = remember { mutableStateListOf<String>() }
    var otherAllergies by remember { mutableStateOf("") }

    val selectedDietary = remember { mutableStateListOf<String>() }

    var cuisine by remember { mutableStateOf("Any") }
    var mood by remember { mutableStateOf("Comfort Food") }
    var mealType by remember { mutableStateOf("Dinner") }
    var servings by remember { mutableStateOf(2) }
    var cookingTime by remember { mutableStateOf(30f) }

    fun resetForm() {
        step = 1
        recipes = emptyList()
        error = null
        vegetables = emptyList()
        fruits = emptyList()
        proteins = emptyList()
        greens = emptyList()
        selectedSpices.clear()
        otherSpices = ""
        selectedAllergies.clear()
        otherAllergies = ""
        selectedDietary.clear()
        cuisine = "Any"
        mood = "Comfort Food"
        mealType = "Dinner"
        servings = 2
        cookingTime = 30f
    }

    val handleSubmit = {
        coroutineScope.launch {
            isLoading = true
            error = null
            recipes = emptyList()
            try {
                val imageUris = (vegetables + fruits + proteins + greens).mapNotNull { it.uriString }
                val result = repository.generateRecipes(
                    imageUris = imageUris,
                    spices = selectedSpices.toList(),
                    otherSpices = otherSpices,
                    allergies = selectedAllergies.toList(),
                    otherAllergies = otherAllergies,
                    dietaryChoices = selectedDietary.toList(),
                    mood = mood,
                    cookingTime = cookingTime.toInt(),
                    servings = servings,
                    mealType = mealType,
                    cuisine = cuisine
                )
                recipes = result
                step = 4
            } catch (e: Exception) {
                error = e.message ?: "An unknown error occurred."
            } finally {
                isLoading = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("What's in my Fridge?", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = {
                        if (step > 1 && step < 4) step-- else onBackClick()
                    }) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Box(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (isLoading) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "Crafting Your Recipes...",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = BrandDark
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Our AI chef is checking your ingredients and firing up the oven!",
                        fontSize = 14.sp,
                        color = Color.Gray,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(32.dp))
                    CircularProgressIndicator(color = BrandPrimary, modifier = Modifier.size(64.dp))
                }
            } else if (error != null) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Error",
                        tint = Color.Red,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Oops! Something went wrong.",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Red
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = error ?: "",
                        fontSize = 14.sp,
                        color = Color.Gray,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(
                        onClick = { resetForm() },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary)
                    ) {
                        Text("Start Over")
                    }
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    if (step < 4) {
                        StepIndicator(currentStep = step)
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    when (step) {
                        1 -> Step1Ingredients(
                            vegetables = vegetables,
                            onVegetablesChange = { vegetables = it },
                            fruits = fruits,
                            onFruitsChange = { fruits = it },
                            proteins = proteins,
                            onProteinsChange = { proteins = it },
                            greens = greens,
                            onGreensChange = { greens = it }
                        )
                        2 -> Step2Preferences(
                            selectedSpices = selectedSpices,
                            otherSpices = otherSpices,
                            onOtherSpicesChange = { otherSpices = it },
                            selectedAllergies = selectedAllergies,
                            otherAllergies = otherAllergies,
                            onOtherAllergiesChange = { otherAllergies = it },
                            selectedDietary = selectedDietary,
                            cuisine = cuisine,
                            onCuisineChange = { cuisine = it },
                            mood = mood,
                            onMoodChange = { mood = it }
                        )
                        3 -> Step3Finishing(
                            mealType = mealType,
                            onMealTypeChange = { mealType = it },
                            servings = servings,
                            onServingsChange = { servings = it },
                            cookingTime = cookingTime,
                            onCookingTimeChange = { cookingTime = it }
                        )
                        4 -> Step4Recipes(
                            recipes = recipes,
                            onReset = { resetForm() }
                        )
                    }

                    Spacer(modifier = Modifier.height(32.dp))

                    // Bottom Navigation Buttons
                    if (step < 4) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            if (step > 1) {
                                OutlinedButton(
                                    onClick = { step-- },
                                    shape = RoundedCornerShape(24.dp),
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = BrandDark),
                                    modifier = Modifier.width(120.dp)
                                ) {
                                    Text("Back")
                                }
                            } else {
                                Box(modifier = Modifier.width(120.dp))
                            }

                            if (step < 3) {
                                Button(
                                    onClick = { step++ },
                                    shape = RoundedCornerShape(24.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary),
                                    modifier = Modifier.width(120.dp)
                                ) {
                                    Text("Next")
                                }
                            } else if (step == 3) {
                                Button(
                                    onClick = { handleSubmit() },
                                    shape = RoundedCornerShape(24.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = BrandSecondary, contentColor = BrandText),
                                    modifier = Modifier.width(180.dp)
                                ) {
                                    Text("Generate Recipes!", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StepIndicator(currentStep: Int) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        (1..3).forEach { s ->
            val isActive = currentStep >= s
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(36.dp)
                    .background(if (isActive) BrandPrimary else Color.LightGray, CircleShape)
            ) {
                Text(
                    text = s.toString(),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }
            if (s < 3) {
                val isLineActive = currentStep > s
                Divider(
                    color = if (isLineActive) BrandPrimary else Color.LightGray,
                    modifier = Modifier
                        .weight(1f)
                        .height(3.dp)
                        .padding(horizontal = 4.dp)
                )
            }
        }
    }
}

@Composable
fun Step1Ingredients(
    vegetables: List<SelectedImage>,
    onVegetablesChange: (List<SelectedImage>) -> Unit,
    fruits: List<SelectedImage>,
    onFruitsChange: (List<SelectedImage>) -> Unit,
    proteins: List<SelectedImage>,
    onProteinsChange: (List<SelectedImage>) -> Unit,
    greens: List<SelectedImage>,
    onGreensChange: (List<SelectedImage>) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "Step 1: Upload Your Ingredients",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = BrandDark,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            text = "Show me what you've got! Snap a picture or select available items.",
            fontSize = 14.sp,
            color = Color.Gray,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        IngredientUploaderSection(title = "Vegetables", items = vegetables, onChange = onVegetablesChange, mockNames = listOf("Bell Peppers", "Onions", "Tomatoes"))
        Spacer(modifier = Modifier.height(16.dp))
        IngredientUploaderSection(title = "Fruits", items = fruits, onChange = onFruitsChange, mockNames = listOf("Mangoes", "Apples", "Bananas"))
        Spacer(modifier = Modifier.height(16.dp))
        IngredientUploaderSection(title = "Proteins", items = proteins, onChange = onProteinsChange, mockNames = listOf("Paneer", "Chicken breast", "Eggs", "Tofu"))
        Spacer(modifier = Modifier.height(16.dp))
        IngredientUploaderSection(title = "Greens & Herbs", items = greens, onChange = onGreensChange, mockNames = listOf("Coriander", "Mint", "Spinach"))
    }
}

@Composable
fun IngredientUploaderSection(
    title: String,
    items: List<SelectedImage>,
    onChange: (List<SelectedImage>) -> Unit,
    mockNames: List<String>
) {
    val context = LocalContext.current
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            val name = uri.lastPathSegment ?: "image"
            onChange(items + SelectedImage(id = UUID.randomUUID().toString(), uriString = uri.toString(), name = name))
        }
    }

    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = BrandText)
                
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Mock Quick Add Button (developer-friendly, visual wow factor)
                    TextButton(
                        onClick = {
                            val mockName = mockNames.random()
                            // Use a placeholder or dummy URI. In GeminiRepository we handle empty/non-real URIs safely.
                            // We can use a package resource URI representing a default image or simply mock the vision upload!
                            onChange(items + SelectedImage(id = UUID.randomUUID().toString(), uriString = null, name = "Mock: $mockName"))
                            Toast.makeText(context, "Added mock $mockName!", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.textButtonColors(contentColor = BrandPrimary)
                    ) {
                        Text("+ Quick Mock", fontSize = 12.sp)
                    }

                    IconButton(onClick = {
                        launcher.launch(androidx.activity.result.PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                    }) {
                        Icon(imageVector = Icons.Default.AddPhotoAlternate, contentDescription = "Add Picture", tint = BrandDark)
                    }
                }
            }

            if (items.isEmpty()) {
                Text(
                    text = "No ingredients uploaded. Snap a photo or tap '+ Quick Mock'",
                    fontSize = 12.sp,
                    color = Color.LightGray,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            } else {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items.forEach { img ->
                        Box(
                            modifier = Modifier
                                .size(90.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .border(1.dp, Color.LightGray, RoundedCornerShape(8.dp))
                                .background(Color(0xFFEEEEEE))
                        ) {
                            if (img.uriString != null) {
                                AsyncImage(
                                    model = img.uriString,
                                    contentDescription = img.name,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Box(
                                    modifier = Modifier.fillMaxSize(),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = img.name.replace("Mock: ", ""),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = BrandDark,
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.padding(4.dp)
                                    )
                                }
                            }
                            
                            IconButton(
                                onClick = { onChange(items.filter { it.id != img.id }) },
                                modifier = Modifier
                                    .size(24.dp)
                                    .align(Alignment.TopEnd)
                                    .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Delete,
                                    contentDescription = "Remove",
                                    tint = Color.White,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun Step2Preferences(
    selectedSpices: MutableList<String>,
    otherSpices: String,
    onOtherSpicesChange: (String) -> Unit,
    selectedAllergies: MutableList<String>,
    otherAllergies: String,
    onOtherAllergiesChange: (String) -> Unit,
    selectedDietary: MutableList<String>,
    cuisine: String,
    onCuisineChange: (String) -> Unit,
    mood: String,
    onMoodChange: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "Step 2: Tastes & Preferences",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = BrandDark,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            text = "Let's fine-tune the flavor profile to your liking.",
            fontSize = 14.sp,
            color = Color.Gray,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Spices Selection
        PreferenceChipsSection(title = "Available Spices", options = spiceOptions, selected = selectedSpices)
        OutlinedTextField(
            value = otherSpices,
            onValueChange = onOtherSpicesChange,
            label = { Text("Any other spices?") },
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
            colors = TextFieldDefaults.colors(focusedIndicatorColor = BrandPrimary, focusedLabelColor = BrandPrimary)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Allergies Selection
        PreferenceChipsSection(title = "Allergies or Ingredients to Avoid", options = allergyOptions, selected = selectedAllergies)
        OutlinedTextField(
            value = otherAllergies,
            onValueChange = onOtherAllergiesChange,
            label = { Text("Any other allergies?") },
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
            colors = TextFieldDefaults.colors(focusedIndicatorColor = BrandPrimary, focusedLabelColor = BrandPrimary)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Dietary Selection
        PreferenceChipsSection(title = "Dietary Choices", options = dietaryOptions, selected = selectedDietary)

        Spacer(modifier = Modifier.height(16.dp))

        // Cuisine & Mood Dropdowns
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = "Cuisine Preference", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BrandText)
                Spacer(modifier = Modifier.height(4.dp))
                DropdownSelector(options = cuisineOptions, selected = cuisine, onSelectedChange = onCuisineChange)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(text = "What's your mood?", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BrandText)
                Spacer(modifier = Modifier.height(4.dp))
                DropdownSelector(options = moodOptions, selected = mood, onSelectedChange = onMoodChange)
            }
        }
    }
}

@Composable
fun PreferenceChipsSection(
    title: String,
    options: List<String>,
    selected: MutableList<String>
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(text = title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BrandText)
        Spacer(modifier = Modifier.height(6.dp))
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            options.forEach { option ->
                val isSelected = selected.contains(option)
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (isSelected) BrandPrimary else Color(0xFFE0E0E0))
                        .clickable {
                            if (isSelected) selected.remove(option) else selected.add(option)
                        }
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = option,
                        color = if (isSelected) Color.White else BrandText,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun FlowRow(
    modifier: Modifier = Modifier,
    horizontalArrangement: Arrangement.Horizontal = Arrangement.Start,
    verticalArrangement: Arrangement.Vertical = Arrangement.Top,
    content: @Composable () -> Unit
) {
    androidx.compose.foundation.layout.FlowRow(
        modifier = modifier,
        horizontalArrangement = horizontalArrangement,
        verticalArrangement = verticalArrangement
    ) {
        content()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DropdownSelector(
    options: List<String>,
    selected: String,
    onSelectedChange: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded }
    ) {
        OutlinedTextField(
            readOnly = true,
            value = selected,
            onValueChange = {},
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(
                focusedBorderColor = BrandPrimary,
                focusedLabelColor = BrandPrimary
            ),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .menuAnchor()
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            options.forEach { selectionOption ->
                DropdownMenuItem(
                    text = { Text(selectionOption) },
                    onClick = {
                        onSelectedChange(selectionOption)
                        expanded = false
                    }
                )
            }
        }
    }
}

@Composable
fun Step3Finishing(
    mealType: String,
    onMealTypeChange: (String) -> Unit,
    servings: Int,
    onServingsChange: (Int) -> Unit,
    cookingTime: Float,
    onCookingTimeChange: (Float) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "Step 3: The Finishing Touches",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = BrandDark,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            text = "Almost there! Just a few more details.",
            fontSize = 14.sp,
            color = Color.Gray,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(text = "Meal Type", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BrandText)
        Spacer(modifier = Modifier.height(4.dp))
        DropdownSelector(options = mealTypeOptions, selected = mealType, onSelectedChange = onMealTypeChange)

        Spacer(modifier = Modifier.height(16.dp))

        Text(text = "How many people?", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BrandText)
        Spacer(modifier = Modifier.height(6.dp))
        OutlinedTextField(
            value = servings.toString(),
            onValueChange = {
                val value = it.toIntOrNull() ?: 1
                onServingsChange(value.coerceIn(1, 20))
            },
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth(),
            colors = TextFieldDefaults.colors(focusedIndicatorColor = BrandPrimary, focusedLabelColor = BrandPrimary)
        )

        Spacer(modifier = Modifier.height(24.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = "How much time do you have?", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BrandText)
            Text(
                text = "${cookingTime.toInt()} minutes",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = BrandPrimary
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Slider(
            value = cookingTime,
            onValueChange = onCookingTimeChange,
            valueRange = 10f..120f,
            steps = 22, // intervals of 5 mins (10 to 120)
            colors = SliderDefaults.colors(
                thumbColor = BrandPrimary,
                activeTrackColor = BrandPrimary,
                inactiveTrackColor = Color.LightGray
            ),
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
fun Step4Recipes(
    recipes: List<Recipe>,
    onReset: () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "Your Culinary Creations!",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = BrandDark,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))

        if (recipes.isEmpty()) {
            Text(
                text = "No recipes generated. Please try again.",
                fontSize = 14.sp,
                color = Color.Gray,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        } else {
            recipes.forEach { recipe ->
                RecipeCard(recipe = recipe)
                Spacer(modifier = Modifier.height(16.dp))
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = onReset,
            colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary),
            shape = RoundedCornerShape(24.dp),
            modifier = Modifier
                .align(Alignment.CenterHorizontally)
                .width(220.dp)
        ) {
            Text("Create a New Meal")
        }
    }
}
