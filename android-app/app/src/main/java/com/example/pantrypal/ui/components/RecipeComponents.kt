package com.example.pantrypal.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.pantrypal.data.model.Recipe
import com.example.pantrypal.theme.*
import java.net.URLEncoder

@Composable
fun RecipeCard(
    recipe: Recipe,
    modifier: Modifier = Modifier
) {
    var isSaved by remember { mutableStateOf(false) }
    var showMcpGuide by remember { mutableStateOf(false) }
    val context = LocalContext.current

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .animateContentSize()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header: Title & Save Heart
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = recipe.recipeName,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Serif,
                    color = BrandDark,
                    modifier = Modifier.weight(1f)
                )
                IconButton(onClick = { 
                    isSaved = !isSaved
                    val msg = if (isSaved) "Saved to cookbook!" else "Removed from cookbook"
                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                }) {
                    Icon(
                        imageVector = if (isSaved) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                        contentDescription = "Save Recipe",
                        tint = if (isSaved) Color.Red else Color.Gray
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Description
            Text(
                text = recipe.description,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                lineHeight = 20.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Cooking Time
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.AccessTime,
                    contentDescription = "Clock",
                    tint = BrandDark,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "${recipe.cookingTime} minutes",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrandDark
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Ingredients & Instructions Grid
            Column(modifier = Modifier.fillMaxWidth()) {
                // Ingredients Used
                Text(
                    text = "Ingredients Used",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrandText
                )
                Spacer(modifier = Modifier.height(4.dp))
                recipe.ingredients.forEach { ingredient ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(vertical = 2.dp)
                    ) {
                        Text(text = "• ", fontWeight = FontWeight.Bold, color = BrandPrimary)
                        Text(text = ingredient, fontSize = 14.sp)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Instructions
                Text(
                    text = "Instructions",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrandText
                )
                Spacer(modifier = Modifier.height(4.dp))
                recipe.instructions.forEachIndexed { index, step ->
                    Row(
                        modifier = Modifier.padding(vertical = 4.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Text(
                            text = "${index + 1}. ",
                            fontWeight = FontWeight.Bold,
                            color = BrandPrimary,
                            fontSize = 14.sp
                        )
                        Text(
                            text = step,
                            fontSize = 14.sp,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // Minimal Grocery List
            if (recipe.missingItems.isNotEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))
                GroceryListSection(
                    missingItems = recipe.missingItems,
                    onOpenMcp = { showMcpGuide = true }
                )
            }
        }
    }

    if (showMcpGuide) {
        SwiggyMcpGuideDialog(
            missingItems = recipe.missingItems,
            onDismiss = { showMcpGuide = false }
        )
    }
}

@Composable
fun GroceryListSection(
    missingItems: List<String>,
    onOpenMcp: () -> Unit
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFFFFFDE7), RoundedCornerShape(12.dp))
            .border(1.dp, BrandSecondary.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = Icons.Default.ShoppingCart,
                contentDescription = "Cart",
                tint = Color(0xFFF57F17),
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Minimal Grocery List",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFF57F17)
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        missingItems.forEach { item ->
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(vertical = 2.dp)
            ) {
                Text(text = "• ", color = Color(0xFFF57F17), fontWeight = FontWeight.Bold)
                Text(text = item, fontSize = 14.sp, color = Color(0xFFE65100))
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "Get them delivered in minutes:",
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFFE65100),
            modifier = Modifier.padding(bottom = 8.dp)
        )

        // Action Buttons Row
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = {
                        val query = URLEncoder.encode(missingItems.joinToString(" "), "UTF-8")
                        val url = "https://www.swiggy.com/instamart/search?query=$query"
                        openWebPage(context, url)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE91E63)),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) {
                    Text(text = "Swiggy Instamart", fontSize = 12.sp, color = Color.White, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = {
                        val query = URLEncoder.encode(missingItems.joinToString(" "), "UTF-8")
                        val url = "https://blinkit.com/search?q=$query"
                        openWebPage(context, url)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50)),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) {
                    Text(text = "Blinkit", fontSize = 12.sp, color = Color.White, fontWeight = FontWeight.Bold)
                }
            }

            Button(
                onClick = onOpenMcp,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3F51B5)),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(vertical = 8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.AutoAwesome,
                    contentDescription = "MCP Logo",
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(text = "Order via Swiggy MCP", fontSize = 12.sp, color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SwiggyMcpGuideDialog(
    missingItems: List<String>,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val mcpConfig = remember {
        """
        {
          "mcpServers": {
            "swiggy": {
              "command": "npx",
              "args": ["-y", "swiggy-mcp-server"]
            }
          }
        }
        """.trimIndent()
    }

    val aiPrompt = remember(missingItems) {
        "Please use the Swiggy Instamart MCP tools to find and add these ingredients to my cart: ${missingItems.joinToString(", ")}. Once everything is added, please initiate the checkout process."
    }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Terminal,
                            contentDescription = "MCP Guide",
                            tint = BrandDark,
                            modifier = Modifier.size(28.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "Swiggy MCP Guide",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = BrandDark
                            )
                            Text(
                                text = "Autonomous food ordering",
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Intro Alert
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(BrandLight.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                        .border(1.dp, BrandPrimary.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Text(
                        text = "Running Swiggy's official Model Context Protocol (MCP) server lets your workspace AI (Claude, Cursor, etc.) securely search Instamart, add ingredients, and trigger checkout on your behalf.",
                        fontSize = 12.sp,
                        color = BrandText,
                        lineHeight = 16.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Step 1: Server configuration
                Text(
                    text = "1. Configure Swiggy MCP Server",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrandText
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Add this configuration to your local MCP client settings file (e.g. claude_desktop_config.json):",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                    lineHeight = 16.sp
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Configuration code block
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF212121), RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Column {
                        Text(
                            text = mcpConfig,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp,
                            color = Color(0xFF81C784),
                            lineHeight = 15.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = {
                                copyToClipboard(context, mcpConfig)
                                Toast.makeText(context, "Config copied!", Toast.LENGTH_SHORT).show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = BrandDark),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.align(Alignment.End)
                        ) {
                            Text("Copy Config", fontSize = 10.sp, color = Color.White)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Step 2: Copy prompt
                Text(
                    text = "2. Prompt your MCP AI Assistant",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrandText
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Copy and paste this prompt to your MCP-enabled AI to autonomously populate your cart:",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                    lineHeight = 16.sp
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Prompt block
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFECEFF1), RoundedCornerShape(8.dp))
                        .border(1.dp, Color(0xFFCFD8DC), RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Column {
                        Text(
                            text = "\"$aiPrompt\"",
                            fontSize = 12.sp,
                            color = Color(0xFF37474F),
                            lineHeight = 16.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = {
                                copyToClipboard(context, aiPrompt)
                                Toast.makeText(context, "AI Prompt copied!", Toast.LENGTH_SHORT).show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF37474F)),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.align(Alignment.End)
                        ) {
                            Text("Copy Prompt", fontSize = 10.sp, color = Color.White)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = onDismiss,
                    colors = ButtonDefaults.buttonColors(containerColor = BrandPrimary),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Ready, let's cook!")
                }
            }
        }
    }
}

private fun copyToClipboard(context: Context, text: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText("PantryPal MCP", text)
    clipboard.setPrimaryClip(clip)
}

private fun openWebPage(context: Context, url: String) {
    try {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        context.startActivity(intent)
    } catch (e: Exception) {
        Toast.makeText(context, "Could not open browser. Please check internet.", Toast.LENGTH_SHORT).show()
    }
}
