import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { formatScaledQuantity, useSnapRecipe } from "@/lib/snaprecipe-store";

export default function SavedScreen() {
  const { removeRecipe, savedRecipes } = useSnapRecipe();
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  return (
    <ScreenContainer className="px-5 pt-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="gap-5">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Saved Recipes</Text>
            <Text className="text-sm leading-6 text-muted">
              Your favorite dishes stay on device, ready to revisit whenever you want to cook them again.
            </Text>
          </View>

          {savedRecipes.length === 0 ? (
            <View className="rounded-[28px] border border-border bg-surface px-5 py-8">
              <Text className="text-xl font-semibold text-foreground">No saved recipes yet</Text>
              <Text className="mt-3 text-sm leading-6 text-muted">
                Scan a dish from the Home tab and save the recipe once it looks right. Your saved collection will appear here.
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {savedRecipes.map((recipe) => {
                const expanded = expandedRecipeId === recipe.id;

                return (
                  <Pressable
                    key={recipe.id}
                    onPress={() => setExpandedRecipeId((current) => (current === recipe.id ? null : recipe.id))}
                    style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
                    className="rounded-[28px] border border-border bg-surface px-5 py-5"
                  >
                    <View className="flex-row items-start justify-between gap-4">
                      <View className="flex-1 gap-1">
                        <Text className="text-xl font-semibold text-foreground">{recipe.dishName}</Text>
                        <Text className="text-sm text-muted">
                          {recipe.cuisine} · {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min · {recipe.difficulty}
                        </Text>
                      </View>
                      <View className="rounded-full bg-background px-3 py-1.5">
                        <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                          {recipe.confidence}
                        </Text>
                      </View>
                    </View>

                    <Text className="mt-4 text-sm leading-6 text-muted">{recipe.tips}</Text>

                    {expanded ? (
                      <View className="mt-5 gap-4">
                        <View className="rounded-[24px] bg-background px-4 py-4">
                          <Text className="text-sm font-semibold uppercase tracking-[1.2px] text-primary">Ingredients</Text>
                          <View className="mt-3 gap-3">
                            {recipe.ingredients.map((ingredient) => (
                              <Text key={ingredient.id} className="text-sm leading-6 text-foreground">
                                {formatScaledQuantity(ingredient.quantity)} {ingredient.unit} {ingredient.name}
                              </Text>
                            ))}
                          </View>
                        </View>

                        <View className="rounded-[24px] bg-background px-4 py-4">
                          <Text className="text-sm font-semibold uppercase tracking-[1.2px] text-primary">Instructions</Text>
                          <View className="mt-3 gap-3">
                            {recipe.instructions.map((instruction) => (
                              <View key={instruction.step}>
                                <Text className="text-sm font-semibold text-foreground">Step {instruction.step}</Text>
                                <Text className="mt-1 text-sm leading-6 text-muted">{instruction.text}</Text>
                              </View>
                            ))}
                          </View>
                        </View>

                        <Pressable
                          onPress={() => void removeRecipe(recipe.id)}
                          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                          className="rounded-full border border-border bg-white px-4 py-3"
                        >
                          <Text className="text-center text-sm font-semibold text-foreground">Remove from saved</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Text className="mt-4 text-sm font-semibold text-primary">Tap to reopen details</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
