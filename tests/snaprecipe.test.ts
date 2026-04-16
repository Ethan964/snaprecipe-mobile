import { describe, expect, it } from "vitest";

import { createRecipeSignature, formatScaledQuantity, scaleIngredientQuantity } from "../lib/snaprecipe-store";
import { generatedRecipeSchema, sampleGeneratedRecipe } from "../shared/snaprecipe";

describe("SnapRecipe recipe schema", () => {
  it("accepts the fallback generated recipe shape", () => {
    const parsed = generatedRecipeSchema.parse({
      ...sampleGeneratedRecipe,
      imageUri: "file://dish.jpg",
      baseServings: sampleGeneratedRecipe.servings,
    });

    expect(parsed.dishName).toBe("Roasted Tomato Pasta");
    expect(parsed.ingredients).toHaveLength(5);
    expect(parsed.instructions[0]?.step).toBe(1);
  });
});

describe("recipe matching helpers", () => {
  it("creates the same signature for the same saved recipe identity", () => {
    const a = createRecipeSignature({
      dishName: "Roasted Tomato Pasta",
      imageUri: "file://dish.jpg",
      source: "library",
      prepTimeMinutes: 15,
      cookTimeMinutes: 25,
    });

    const b = createRecipeSignature({
      dishName: " roasted tomato pasta ",
      imageUri: "file://dish.jpg",
      source: "library",
      prepTimeMinutes: 15,
      cookTimeMinutes: 25,
    });

    expect(a).toBe(b);
  });
});

describe("servings scaling helpers", () => {
  it("rescales ingredient quantities proportionally", () => {
    expect(scaleIngredientQuantity(2, 2, 4)).toBe(4);
    expect(scaleIngredientQuantity(0.25, 2, 3)).toBe(0.38);
  });

  it("formats whole numbers and trimmed decimals cleanly", () => {
    expect(formatScaledQuantity(4)).toBe("4");
    expect(formatScaledQuantity(0.5)).toBe("0.5");
    expect(formatScaledQuantity(1.25)).toBe("1.25");
  });
});
