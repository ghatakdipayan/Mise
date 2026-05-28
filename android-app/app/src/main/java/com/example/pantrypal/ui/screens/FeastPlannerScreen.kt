package com.example.pantrypal.ui.screens

import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.pantrypal.data.model.*
import com.example.pantrypal.data.repository.GeminiRepository
import com.example.pantrypal.theme.*
import com.example.pantrypal.ui.components.GroceryListSection
import com.example.pantrypal.ui.components.SwiggyMcpGuideDialog
import kotlinx.coroutines.launch

private val ageGroupOptions = listOf("Young Children", "Teenagers", "Young Adults", "Mixed Adults", "Seniors")
private val cuisineOptions = listOf("Any", "Indian", "Chinese", "South Indian", "North Indian", "Greek", "Mediterranean", "Italian", "Mexican", "Japanese", "Thai", "American")
private val allergyOptions = listOf("Peanuts", "Tree Nuts", "Milk", "Eggs", "Soy", "Wheat", "Fish", "Shellfish", "Gluten", "Sesame")
private val spiceOptions = listOf("Salt", "Black Pepper", "Cumin", "Coriander", "Turmeric", "Paprika", "Chili Powder", "Garlic Powder", "Onion Powder", "Oregano", "Basil", "Rosemary")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeastPlannerScreen(
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val repository = remember { GeminiRepository(context) }

    var step by remember { mutableStateOf(1) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    
    var menuConcept by remember { mutableStateOf<FeastMenu?>(null) }
    var feastPlan by remember { mutableStateOf<FeastPlan?>(null) }
    var showMcpGuide by remember { mutableStateOf(false) }

    // Form inputs
    var theme by remember { mutableStateOf("") }
    var guests by remember { mutableStateOf(4) }
    var ageGroup by remember { mutableStateOf("Mixed Adults") }
    var cuisine by remember { mutableStateOf("Any") }
    val selectedAllergies = remember { mutableStateListOf<String>() }
    var otherAllergies by remember { mutableStateOf("") }

    // Pantry Check inputs
    var vegetables by remember { mutableStateOf<List<SelectedImage>>(emptyList()) }
    var fruits by remember { mutableStateOf<List<SelectedImage>>(emptyList()) }
    var proteins by remember { mutableStateOf<List<SelectedImage>>(emptyList()) }
    var greens by remember { mutableStateOf<List<SelectedImage>>(emptyList()) }
    val selectedSpices = remember { mutableStateListOf<String>() }
    var otherSpices by remember { mutableStateOf("") }

    fun resetPlanner() {
        step = 1
        menuConcept = null
        feastPlan = null
        error = null
        theme = ""
        guests = 4
        ageGroup = "Mixed Adults"
        cuisine = "Any"
        selectedAllergies.clear()
        otherAllergies = ""
        vegetables = emptyList()
        fruits = emptyList()
        proteins = emptyList()
        greens = emptyList()
        selectedSpices.clear()
        otherSpices = ""
    }

    val handleGenerateMenu = {
        if (theme.isBlank()) {
            Toast.makeText(context, "Please enter a theme for your feast!", Toast.LENGTH_SHORT).show()
        } else {
            coroutineScope.launch {
                isLoading = true
                error = null
                menuConcept = null
                try {
                    val result = repository.generateFeastMenu(
                        theme = theme,
                        cuisine = cuisine,
                        guests = guests,
                        ageGroup = ageGroup,
                        allergies = selectedAllergies.toList(),
                        otherAllergies = otherAllergies
                    )
                    menuConcept = result
                } catch (e: Exception) {
                    error = e.message ?: "An unknown error occurred."
                } finally {
                    isLoading = false
                }
            }
        }
    }

    val handleGeneratePlan = {
        val concept = menuConcept
        if (concept != null) {
            coroutineScope.launch {
                isLoading = true
                error = null
                feastPlan = null
                try {
                    val imageUris = (vegetables + fruits + proteins + greens).mapNotNull { it.uriString }
                    val result = repository.generateFeastPlan(
                        theme = theme,
                        guests = guests,
                        ageGroup = ageGroup,
                        cuisine = cuisine,
                        allergies = selectedAllergies.toList(),
                        otherAllergies = otherAllergies,
                        imageUris = imageUris,
                        spices = selectedSpices.toList(),
                        otherSpices = otherSpices,
                        menuConcept = concept
                    )
                    feastPlan = result
                    step = 3
                } catch (e: Exception) {
                    error = e.message ?: "An unknown error occurred."
                } finally {
                    isLoading = false
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Host a Feast!", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = {
                        if (step > 1) {
                            if (step == 3) step = 2 else {
                                menuConcept = null
                                step = 1
                            }
                        } else onBackClick()
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
                        text = "Planning Your Feast...",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = BrandDark
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Our AI caterer is designing the perfect menu for your occasion.",
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
                        text = "Oops! There was a hiccup.",
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
                        onClick = { resetPlanner() },
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
                    if (step > 1) {
                        StepIndicator(currentStep = step)
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    when (step) {
                        1 -> {
                            val concept = menuConcept
                            if (concept == null) {
                                FeastStep1Form(
                                    theme = theme,
                                    onThemeChange = { theme = it },
                                    cuisine = cuisine,
                                    onCuisineChange = { cuisine = it },
                                    guests = guests,
                                    onGuestsChange = { guests = it },
                                    ageGroup = ageGroup,
                                    onAgeGroupChange = { ageGroup = it },
                                    selectedAllergies = selectedAllergies,
                                    otherAllergies = otherAllergies,
                                    onOtherAllergiesChange = { otherAllergies = it },
                                    onSubmit = { handleGenerateMenu() }
                                )
                            } else {
                                FeastMenuPreview(
                                    menu = concept,
                                    onRedesign = { menuConcept = null },
                                    onProceed = { step = 2 }
                                )
                            }
                        }
                        2 -> {
                            FeastStep2Inventory(
                                vegetables = vegetables,
                                onVegetablesChange = { vegetables = it },
                                fruits = fruits,
                                onFruitsChange = { fruits = it },
                                proteins = proteins,
                                onProteinsChange = { proteins = it },
                                greens = greens,
                                onGreensChange = { greens = it },
                                selectedSpices = selectedSpices,
                                otherSpices = otherSpices,
                                onOtherSpicesChange = { otherSpices = it },
                                onBack = { step = 1 },
                                onSubmitPlan = { handleGeneratePlan() }
                            )
                        }
                        3 -> {
                            val plan = feastPlan
                            if (plan != null) {
                                FeastStep3CookingPlan(
                                    plan = plan,
                                    onOpenMcp = { showMcpGuide = true },
                                    onReset = { resetPlanner() }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showMcpGuide) {
        val missing = feastPlan?.missingItems ?: emptyList()
        SwiggyMcpGuideDialog(
            missingItems = missing,
            onDismiss = { showMcpGuide = false }
        )
    }
}

@Composable
fun FeastStep1Form(
    theme: String,
    onThemeChange: (String) -> Unit,
    cuisine: String,
    onCuisineChange: (String) -> Unit,
    guests: Int,
    onGuestsChange: (Int) -> Unit,
    ageGroup: String,
    onAgeGroupChange: (String) -> Unit,
    selectedAllergies: MutableList<String>,
    otherAllergies: String,
    onOtherAllergiesChange: (String) -> Unit,
    onSubmit: () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "Plan Your Perfect Feast",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = BrandDark,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            text = "Tell us about your event, and we'll craft a memorable menu concept.",
            fontSize = 14.sp,
            color = Color.Gray,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Theme / Occasion
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(imageVector = Icons.Default.Event, contentDescription = "Theme", tint = Color.Gray)
            Spacer(modifier = Modifier.width(6.dp))
            Text(text = "Theme or Occasion", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BrandText)
        }
        Spacer(modifier = Modifier.height(4.dp))
        OutlinedTextField(
            value = theme,
            onValueChange = onThemeChange,
            placeholder = { Text("e.g. Summer BBQ, Bollywood Night") },
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth(),
            colors = TextFieldDefaults.colors(focusedIndicatorColor = BrandPrimary, focusedLabelColor = BrandPrimary)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Cuisine & Guests
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.RestaurantMenu, contentDescription = "Cuisine", tint = Color.Gray, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "Cuisine", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BrandText)
                }
                Spacer(modifier = Modifier.height(4.dp))
                DropdownSelector(options = cuisineOptions, selected = cuisine, onSelectedChange = onCuisineChange)
            }
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.People, contentDescription = "Guests", tint = Color.Gray, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "Guests count", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BrandText)
                }
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = guests.toString(),
                    onValueChange = {
                        val value = it.toIntOrNull() ?: 1
                        onGuestsChange(value.coerceIn(1, 100))
                    },
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth(),
                    colors = TextFieldDefaults.colors(focusedIndicatorColor = BrandPrimary)
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Age Group
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(imageVector = Icons.Default.CalendarToday, contentDescription = "Age Group", tint = Color.Gray, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(4.dp))
            Text(text = "Guest Age Group", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BrandText)
        }
        Spacer(modifier = Modifier.height(4.dp))
        DropdownSelector(options = ageGroupOptions, selected = ageGroup, onSelectedChange = onAgeGroupChange)

        Spacer(modifier = Modifier.height(16.dp))

        // Allergies
        PreferenceChipsSection(title = "Allergies or Ingredients to Avoid", options = allergyOptions, selected = selectedAllergies)
        OutlinedTextField(
            value = otherAllergies,
            onValueChange = onOtherAllergiesChange,
            label = { Text("Any other allergies?") },
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth(),
            colors = TextFieldDefaults.colors(focusedIndicatorColor = BrandPrimary, focusedLabelColor = BrandPrimary)
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = onSubmit,
            colors = ButtonDefaults.buttonColors(containerColor = BrandSecondary, contentColor = BrandText),
            shape = RoundedCornerShape(24.dp),
            modifier = Modifier
                .align(Alignment.CenterHorizontally)
                .width(220.dp)
        ) {
            Text("Design My Menu", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun FeastMenuPreview(
    menu: FeastMenu,
    onRedesign: () -> Unit,
    onProceed: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier
            .fillMaxWidth()
            .border(2.dp, BrandPrimary.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Text(
                text = menu.menuTitle,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif,
                color = BrandDark,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = menu.description,
                fontSize = 14.sp,
                color = Color.Gray,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(24.dp))

            val items = listOf(
                CourseMenuPreview("Appetizer", menu.appetizer.name, menu.appetizer.description, Icons.Default.Fastfood),
                CourseMenuPreview("Main Course", menu.mainCourse.name, menu.mainCourse.description, Icons.Default.LocalPizza),
                CourseMenuPreview("Dessert", menu.dessert.name, menu.dessert.description, Icons.Default.Cake),
                CourseMenuPreview("Beverage Suggestion", menu.beverage.name, menu.beverage.description, Icons.Default.LocalCafe)
            )

            items.forEach { item ->
                Row(
                    verticalAlignment = Alignment.Top,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 10.dp)
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(40.dp)
                            .background(BrandLight.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                    ) {
                        Icon(imageVector = item.icon, contentDescription = item.course, tint = BrandDark)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = item.course, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = BrandDark)
                        Text(text = item.name, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = BrandText)
                        Text(text = item.description, fontSize = 13.sp, color = Color.Gray, lineHeight = 18.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedButton(
                    onClick = onRedesign,
                    shape = RoundedCornerShape(24.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = BrandDark),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Redesign Menu")
                }
                Button(
                    onClick = onProceed,
                    shape = RoundedCornerShape(24.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Help me Cook →")
                }
            }
        }
    }
}

data class CourseMenuPreview(
    val course: String,
    val name: String,
    val description: String,
    val icon: ImageVector
)

@Composable
fun FeastStep2Inventory(
    vegetables: List<SelectedImage>,
    onVegetablesChange: (List<SelectedImage>) -> Unit,
    fruits: List<SelectedImage>,
    onFruitsChange: (List<SelectedImage>) -> Unit,
    proteins: List<SelectedImage>,
    onProteinsChange: (List<SelectedImage>) -> Unit,
    greens: List<SelectedImage>,
    onGreensChange: (List<SelectedImage>) -> Unit,
    selectedSpices: MutableList<String>,
    otherSpices: String,
    onOtherSpicesChange: (String) -> Unit,
    onBack: () -> Unit,
    onSubmitPlan: () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "Step 2: Inventory Check",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = BrandDark,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            text = "Show me what ingredients you have on hand to cross-reference.",
            fontSize = 14.sp,
            color = Color.Gray,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        IngredientUploaderSection(title = "Vegetables", items = vegetables, onChange = onVegetablesChange, mockNames = listOf("Paneer", "Bell Peppers", "Garlic", "Ginger"))
        Spacer(modifier = Modifier.height(16.dp))
        IngredientUploaderSection(title = "Fruits", items = fruits, onChange = onFruitsChange, mockNames = listOf("Limes", "Oranges", "Pineapple"))
        Spacer(modifier = Modifier.height(16.dp))
        IngredientUploaderSection(title = "Proteins", items = proteins, onChange = onProteinsChange, mockNames = listOf("Cashew nuts", "Heavy Cream", "Chicken Breast"))
        Spacer(modifier = Modifier.height(16.dp))
        IngredientUploaderSection(title = "Greens & Herbs", items = greens, onChange = onGreensChange, mockNames = listOf("Coriander Leaves", "Mint", "Curry Leaves"))

        Spacer(modifier = Modifier.height(16.dp))

        PreferenceChipsSection(title = "Available Spices", options = spiceOptions, selected = selectedSpices)
        OutlinedTextField(
            value = otherSpices,
            onValueChange = onOtherSpicesChange,
            label = { Text("Any other spices?") },
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth(),
            colors = TextFieldDefaults.colors(focusedIndicatorColor = BrandPrimary, focusedLabelColor = BrandPrimary)
        )

        Spacer(modifier = Modifier.height(24.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            OutlinedButton(
                onClick = onBack,
                shape = RoundedCornerShape(24.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = BrandDark),
                modifier = Modifier.width(120.dp)
            ) {
                Text("Back")
            }
            Button(
                onClick = onSubmitPlan,
                shape = RoundedCornerShape(24.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BrandSecondary, contentColor = BrandText),
                modifier = Modifier.width(220.dp)
            ) {
                Text("Generate Cooking Plan!", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun FeastStep3CookingPlan(
    plan: FeastPlan,
    onOpenMcp: () -> Unit,
    onReset: () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = plan.feastTitle,
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
            color = BrandDark,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            text = plan.feastDescription,
            fontSize = 14.sp,
            color = Color.Gray,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        plan.recipes.forEach { rec ->
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        val icon = when {
                            rec.course.contains("Appetizer", true) -> Icons.Default.Fastfood
                            rec.course.contains("Main", true) -> Icons.Default.LocalPizza
                            rec.course.contains("Dessert", true) -> Icons.Default.Cake
                            else -> Icons.Default.LocalCafe
                        }
                        Icon(imageVector = icon, contentDescription = rec.course, tint = BrandDark)
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(text = rec.course, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = BrandDark)
                            Text(text = rec.recipeName, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = BrandText)
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = rec.description, fontSize = 13.sp, color = Color.Gray)

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(text = "Ingredients", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BrandText)
                    rec.ingredients.forEach { ing ->
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 1.dp)) {
                            Text(text = "• ", color = BrandPrimary, fontWeight = FontWeight.Bold)
                            Text(text = ing, fontSize = 13.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(text = "Instructions", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BrandText)
                    rec.instructions.forEachIndexed { index, step ->
                        Row(modifier = Modifier.padding(vertical = 2.dp), verticalAlignment = Alignment.Top) {
                            Text(text = "${index + 1}. ", color = BrandPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text(text = step, fontSize = 13.sp, modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }

        if (plan.missingItems.isNotEmpty()) {
            Spacer(modifier = Modifier.height(16.dp))
            GroceryListSection(
                missingItems = plan.missingItems,
                onOpenMcp = onOpenMcp
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = onReset,
            colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary),
            shape = RoundedCornerShape(24.dp),
            modifier = Modifier
                .align(Alignment.CenterHorizontally)
                .width(220.dp)
        ) {
            Text("Plan Another Feast")
        }
    }
}
