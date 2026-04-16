import { z } from "zod";

export const recipeIngredientSchema = z.object({
  id: z.string().default("ingredient"),
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  substitutes: z.array(z.string()),
});

export const recipeInstructionSchema = z.object({
  step: z.number(),
  text: z.string(),
  timeMinutes: z.number().optional(),
});

export const generatedRecipeSchema = z.object({
  imageUri: z.string().optional(),
  dishName: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  cuisine: z.string(),
  prepTimeMinutes: z.number(),
  cookTimeMinutes: z.number(),
  servings: z.number(),
  baseServings: z.number(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  ingredients: z.array(recipeIngredientSchema),
  instructions: z.array(recipeInstructionSchema),
  dietaryTags: z.array(z.string()),
  tips: z.string(),
  source: z.enum(["camera", "library"]),
});

export const generateRecipeInputSchema = z.object({
  imageDataUrl: z.string(),
  imageUri: z.string().optional(),
  source: z.enum(["camera", "library"]),
  dietaryPreferences: z.array(z.string()),
});

export type GeneratedRecipe = z.infer<typeof generatedRecipeSchema>;
export type GenerateRecipeInput = z.infer<typeof generateRecipeInputSchema>;

export const generatedRecipeJsonSchema = {
  name: "snaprecipe_recipe",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      dishName: { type: "string" },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      cuisine: { type: "string" },
      prepTimeMinutes: { type: "number" },
      cookTimeMinutes: { type: "number" },
      servings: { type: "number" },
      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
      ingredients: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            quantity: { type: "number" },
            unit: { type: "string" },
            substitutes: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["name", "quantity", "unit", "substitutes"],
        },
      },
      instructions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            step: { type: "number" },
            text: { type: "string" },
            timeMinutes: { type: "number" },
          },
          required: ["step", "text", "timeMinutes"],
        },
      },
      dietaryTags: {
        type: "array",
        items: { type: "string" },
      },
      tips: { type: "string" },
    },
    required: [
      "dishName",
      "confidence",
      "cuisine",
      "prepTimeMinutes",
      "cookTimeMinutes",
      "servings",
      "difficulty",
      "ingredients",
      "instructions",
      "dietaryTags",
      "tips",
    ],
  },
} as const;

export const sampleGeneratedRecipe: GeneratedRecipe = {
  dishName: "Roasted Tomato Pasta",
  confidence: "medium",
  cuisine: "Italian-inspired",
  prepTimeMinutes: 15,
  cookTimeMinutes: 25,
  servings: 2,
  baseServings: 2,
  difficulty: "easy",
  ingredients: [
    { id: "1", name: "cherry tomatoes", quantity: 2, unit: "cups", substitutes: ["roma tomatoes", "canned whole tomatoes"] },
    { id: "2", name: "short pasta", quantity: 8, unit: "oz", substitutes: ["spaghetti", "gluten-free pasta"] },
    { id: "3", name: "garlic cloves", quantity: 3, unit: "whole", substitutes: ["garlic paste", "shallot"] },
    { id: "4", name: "olive oil", quantity: 2, unit: "tbsp", substitutes: ["avocado oil", "butter"] },
    { id: "5", name: "parmesan", quantity: 0.25, unit: "cup", substitutes: ["pecorino", "nutritional yeast"] },
  ],
  instructions: [
    { step: 1, text: "Roast the tomatoes, garlic, and olive oil until blistered and jammy.", timeMinutes: 18 },
    { step: 2, text: "Cook the pasta in salted water until just tender, then reserve a little pasta water.", timeMinutes: 10 },
    { step: 3, text: "Mash the roasted tomatoes into a quick sauce, toss with pasta, and loosen with pasta water as needed.", timeMinutes: 4 },
    { step: 4, text: "Finish with parmesan and black pepper, then serve immediately.", timeMinutes: 2 },
  ],
  dietaryTags: ["vegetarian"],
  tips: "Roast until the tomatoes begin to collapse so the sauce tastes concentrated rather than watery.",
  source: "library",
};
