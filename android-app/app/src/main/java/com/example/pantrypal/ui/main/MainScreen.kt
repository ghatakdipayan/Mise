package com.example.pantrypal.ui.main

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.RestaurantMenu
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation3.runtime.NavKey
import com.example.pantrypal.RecipeGenerator
import com.example.pantrypal.FeastPlanner
import com.example.pantrypal.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onItemClick: (NavKey) -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "PantryPal",
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Serif,
                            color = BrandDark
                        )
                        Text(
                            text = "Your AI Sous-Chef for Smart Cooking",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                        )
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "How can I help you today?",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = BrandText,
                textAlign = TextAlign.Center
            )
            
            Text(
                text = "Choose an option to begin your culinary adventure. Whether you're planning tonight's dinner or a grand feast, I'm here to assist!",
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .padding(horizontal = 16.dp, vertical = 8.dp)
                    .widthIn(max = 480.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Fridge Card
            ModeCard(
                title = "What's in my Fridge?",
                description = "Suggest creative recipes using the ingredients you already have. Reduce waste and discover new favorites.",
                icon = {
                    Icon(
                        imageVector = Icons.Default.Restaurant,
                        contentDescription = "Fridge Icon",
                        tint = BrandPrimary,
                        modifier = Modifier.size(48.dp)
                    )
                },
                onClick = { onItemClick(RecipeGenerator) }
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Feast Card
            ModeCard(
                title = "Host a Feast!",
                description = "Plan a complete, themed menu for any occasion. From appetizers to desserts, impress your guests with ease.",
                icon = {
                    Icon(
                        imageVector = Icons.Default.RestaurantMenu,
                        contentDescription = "Feast Icon",
                        tint = BrandPrimary,
                        modifier = Modifier.size(48.dp)
                    )
                },
                onClick = { onItemClick(FeastPlanner) }
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Text(
                text = "Crafted with ❤️ by PantryPal AI",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                modifier = Modifier.padding(bottom = 16.dp)
            )
        }
    }
}

@Composable
fun ModeCard(
    title: String,
    description: String,
    icon: @Composable () -> Unit,
    onClick: () -> Unit
) {
    ElevatedCard(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 4.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .widthIn(max = 480.dp)
            .clickable { onClick() }
    ) {
        Column(
            modifier = Modifier
                .padding(24.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            icon()
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = title,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = BrandDark,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = description,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                textAlign = TextAlign.Center,
                lineHeight = 20.sp
            )
        }
    }
}
