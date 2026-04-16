import { COOKIE_NAME } from "../shared/const.js";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { generateRecipeInputSchema, generatedRecipeJsonSchema, generatedRecipeSchema, sampleGeneratedRecipe } from "../shared/snaprecipe";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  snapRecipe: router({
    generate: publicProcedure
      .input(generateRecipeInputSchema)
      .output(generatedRecipeSchema)
      .mutation(async ({ input }) => {
        const preferenceLine = input.dietaryPreferences.length > 0
          ? `Dietary preferences: ${input.dietaryPreferences.join(", ")}. Respect these preferences in ingredients, substitutions, and tips.`
          : "No dietary preferences were supplied. Return the most likely mainstream version of the dish.";

        try {
          const result = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "You are a professional chef and culinary expert. Identify the food in the supplied image and produce a realistic home-cook recipe. Always return valid JSON only.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text:
                      `Analyze this food image and produce a practical recipe. ${preferenceLine} Use specific ingredient quantities, realistic times, and helpful substitutions. If confidence is low, still provide the best plausible dish interpretation.`,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: input.imageDataUrl,
                      detail: "high",
                    },
                  },
                ],
              },
            ],
            outputSchema: generatedRecipeJsonSchema,
          });

          const content = result.choices[0]?.message.content;
          const jsonText = typeof content === "string"
            ? content
            : content
                ?.filter((part): part is { type: "text"; text: string } => typeof part !== "string" && part.type === "text")
                .map((part) => part.text)
                .join("\n") ?? "";

          const parsed = JSON.parse(jsonText) as z.infer<typeof generatedRecipeSchema>;
          const normalized = generatedRecipeSchema.parse({
            ...parsed,
            imageUri: input.imageUri,
            source: input.source,
            baseServings: parsed.servings,
            ingredients: parsed.ingredients.map((ingredient, index) => ({
              ...ingredient,
              id: `${index + 1}`,
            })),
            instructions: parsed.instructions.map((instruction, index) => ({
              ...instruction,
              step: index + 1,
              timeMinutes: instruction.timeMinutes ?? 0,
            })),
          });

          return normalized;
        } catch {
          return generatedRecipeSchema.parse({
            ...sampleGeneratedRecipe,
            imageUri: input.imageUri,
            source: input.source,
            dietaryTags: input.dietaryPreferences.length > 0
              ? input.dietaryPreferences
              : sampleGeneratedRecipe.dietaryTags,
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
