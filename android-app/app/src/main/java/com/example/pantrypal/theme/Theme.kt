package com.example.pantrypal.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryDark,
    secondary = SecondaryDark,
    background = BackgroundDark,
    surface = SurfaceDark,
    onPrimary = Color.Black,
    onSecondary = Color.Black,
    onBackground = TextDark,
    onSurface = TextDark
)

private val LightColorScheme = lightColorScheme(
    primary = BrandPrimary,
    secondary = BrandSecondary,
    background = BrandBg,
    surface = Color.White,
    onPrimary = Color.White,
    onSecondary = BrandText,
    onBackground = BrandText,
    onSurface = BrandText
)

@Composable
fun PantryPalTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  content: @Composable () -> Unit,
) {
  val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

  MaterialTheme(
      colorScheme = colorScheme,
      typography = Typography,
      content = content
  )
}
