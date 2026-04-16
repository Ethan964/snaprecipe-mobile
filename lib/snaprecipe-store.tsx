import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type DietaryPreference =
  | "vegan"
  | "vegetarian"
  | "gluten-free"
  | "nut-free"
  | "halal"
  | "dairy-free";

export type RecipeIngredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  substitutes: string[];
};

export type RecipeInstruction = {
  step: number;
  text: string;
  timeMinutes?: number;
};

export type RecipeRecord = {
  id: string;
  imageUri?: string;
  dishName: string;
  confidence: "high" | "medium" | "low";
  cuisine: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  baseServings: number;
  difficulty: "easy" | "medium" | "hard";
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  dietaryTags: string[];
  tips: string;
  createdAt: string;
  source: "camera" | "library";
};

export type ScanUsage = {
  monthKey: string;
  used: number;
  freeLimit: number;
};

export type SnapRecipeState = {
  onboardingComplete: boolean;
  notificationsEnabled: boolean;
  dietaryPreferences: DietaryPreference[];
  savedRecipes: RecipeRecord[];
  scanUsage: ScanUsage;
};

export type CreateRecipeInput = Omit<RecipeRecord, "id" | "createdAt">;

export type SnapRecipeContextValue = SnapRecipeState & {
  hydrated: boolean;
  freeScansRemaining: number;
  hasReachedSoftPaywall: boolean;
  completeOnboarding: (input: {
    dietaryPreferences: DietaryPreference[];
    notificationsEnabled: boolean;
  }) => Promise<void>;
  updatePreferences: (preferences: DietaryPreference[]) => Promise<void>;
  updateNotificationsEnabled: (enabled: boolean) => Promise<void>;
  incrementScanUsage: () => Promise<ScanUsage>;
  saveRecipe: (recipe: CreateRecipeInput) => Promise<RecipeRecord>;
  removeRecipe: (recipeId: string) => Promise<void>;
  isRecipeSaved: (recipeId: string) => boolean;
  getSavedRecipeById: (recipeId: string) => RecipeRecord | undefined;
  findMatchingSavedRecipe: (recipe: Pick<CreateRecipeInput, "dishName" | "imageUri" | "source" | "prepTimeMinutes" | "cookTimeMinutes">) => RecipeRecord | undefined;
  resetMonthlyUsageForTesting: () => Promise<void>;
};

const STORAGE_KEY = "snaprecipe-state-v1";
const FREE_SCAN_LIMIT = 5;

const getMonthKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
};

const createInitialState = (): SnapRecipeState => ({
  onboardingComplete: false,
  notificationsEnabled: false,
  dietaryPreferences: [],
  savedRecipes: [],
  scanUsage: {
    monthKey: getMonthKey(),
    used: 0,
    freeLimit: FREE_SCAN_LIMIT,
  },
});

const SnapRecipeContext = createContext<SnapRecipeContextValue | null>(null);

export function createRecipeSignature(recipe: Pick<CreateRecipeInput, "dishName" | "imageUri" | "source" | "prepTimeMinutes" | "cookTimeMinutes">) {
  return [
    recipe.dishName.trim().toLowerCase(),
    recipe.imageUri ?? "no-image",
    recipe.source,
    recipe.prepTimeMinutes,
    recipe.cookTimeMinutes,
  ].join("::");
}

function normalizeState(state: SnapRecipeState): SnapRecipeState {
  const initial = createInitialState();
  const currentMonthKey = getMonthKey();
  const usage = state.scanUsage.monthKey === currentMonthKey
    ? state.scanUsage
    : { ...initial.scanUsage, monthKey: currentMonthKey };

  return {
    onboardingComplete: state.onboardingComplete ?? initial.onboardingComplete,
    notificationsEnabled: state.notificationsEnabled ?? initial.notificationsEnabled,
    dietaryPreferences: state.dietaryPreferences ?? initial.dietaryPreferences,
    savedRecipes: state.savedRecipes ?? initial.savedRecipes,
    scanUsage: {
      monthKey: usage.monthKey,
      used: usage.used ?? 0,
      freeLimit: usage.freeLimit ?? FREE_SCAN_LIMIT,
    },
  };
}

export function SnapRecipeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SnapRecipeState>(createInitialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          if (active) setHydrated(true);
          return;
        }

        const parsed = JSON.parse(raw) as SnapRecipeState;
        if (active) {
          setState(normalizeState(parsed));
          setHydrated(true);
        }
      } catch {
        if (active) {
          setState(createInitialState());
          setHydrated(true);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(async (nextState: SnapRecipeState) => {
    setState(nextState);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }, []);

  const completeOnboarding = useCallback(async ({ dietaryPreferences, notificationsEnabled }: {
    dietaryPreferences: DietaryPreference[];
    notificationsEnabled: boolean;
  }) => {
    const nextState = normalizeState({
      ...state,
      onboardingComplete: true,
      dietaryPreferences,
      notificationsEnabled,
    });
    await persist(nextState);
  }, [persist, state]);

  const updatePreferences = useCallback(async (dietaryPreferences: DietaryPreference[]) => {
    const nextState = normalizeState({ ...state, dietaryPreferences });
    await persist(nextState);
  }, [persist, state]);

  const updateNotificationsEnabled = useCallback(async (notificationsEnabled: boolean) => {
    const nextState = normalizeState({ ...state, notificationsEnabled });
    await persist(nextState);
  }, [persist, state]);

  const incrementScanUsage = useCallback(async () => {
    const normalized = normalizeState(state);
    const nextUsage = {
      ...normalized.scanUsage,
      used: normalized.scanUsage.used + 1,
    };
    const nextState = {
      ...normalized,
      scanUsage: nextUsage,
    };
    await persist(nextState);
    return nextUsage;
  }, [persist, state]);

  const saveRecipe = useCallback(async (recipe: CreateRecipeInput) => {
    const record: RecipeRecord = {
      ...recipe,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };

    const nextState = normalizeState({
      ...state,
      savedRecipes: [record, ...state.savedRecipes],
    });
    await persist(nextState);
    return record;
  }, [persist, state]);

  const removeRecipe = useCallback(async (recipeId: string) => {
    const nextState = normalizeState({
      ...state,
      savedRecipes: state.savedRecipes.filter((recipe) => recipe.id !== recipeId),
    });
    await persist(nextState);
  }, [persist, state]);

  const isRecipeSaved = useCallback((recipeId: string) => {
    return state.savedRecipes.some((recipe) => recipe.id === recipeId);
  }, [state.savedRecipes]);

  const getSavedRecipeById = useCallback((recipeId: string) => {
    return state.savedRecipes.find((recipe) => recipe.id === recipeId);
  }, [state.savedRecipes]);

  const findMatchingSavedRecipe = useCallback((recipe: Pick<CreateRecipeInput, "dishName" | "imageUri" | "source" | "prepTimeMinutes" | "cookTimeMinutes">) => {
    const targetSignature = createRecipeSignature(recipe);
    return state.savedRecipes.find((savedRecipe) => createRecipeSignature(savedRecipe) === targetSignature);
  }, [state.savedRecipes]);

  const resetMonthlyUsageForTesting = useCallback(async () => {
    const nextState = normalizeState({
      ...state,
      scanUsage: {
        monthKey: getMonthKey(),
        used: 0,
        freeLimit: FREE_SCAN_LIMIT,
      },
    });
    await persist(nextState);
  }, [persist, state]);

  const value = useMemo<SnapRecipeContextValue>(() => {
    const normalized = normalizeState(state);
    const freeScansRemaining = Math.max(normalized.scanUsage.freeLimit - normalized.scanUsage.used, 0);

    return {
      ...normalized,
      hydrated,
      freeScansRemaining,
      hasReachedSoftPaywall: normalized.scanUsage.used >= normalized.scanUsage.freeLimit,
      completeOnboarding,
      updatePreferences,
      updateNotificationsEnabled,
      incrementScanUsage,
      saveRecipe,
      removeRecipe,
      isRecipeSaved,
      getSavedRecipeById,
      findMatchingSavedRecipe,
      resetMonthlyUsageForTesting,
    };
  }, [completeOnboarding, findMatchingSavedRecipe, getSavedRecipeById, hydrated, incrementScanUsage, isRecipeSaved, removeRecipe, saveRecipe, state, updateNotificationsEnabled, updatePreferences, resetMonthlyUsageForTesting]);

  return <SnapRecipeContext.Provider value={value}>{children}</SnapRecipeContext.Provider>;
}

export function useSnapRecipe() {
  const context = useContext(SnapRecipeContext);
  if (!context) {
    throw new Error("useSnapRecipe must be used within SnapRecipeProvider");
  }

  return context;
}

export const SNAPRECIPE_DIETARY_OPTIONS: DietaryPreference[] = [
  "vegan",
  "vegetarian",
  "gluten-free",
  "nut-free",
  "halal",
  "dairy-free",
];

export const SNAPRECIPE_PREMIUM_FEATURES = [
  "Unlimited dish scans",
  "Unlimited saved recipes",
  "Always-on dietary personalization",
  "Priority recipe generation",
] as const;

export function scaleIngredientQuantity(quantity: number, baseServings: number, nextServings: number) {
  if (!Number.isFinite(quantity) || !Number.isFinite(baseServings) || !Number.isFinite(nextServings) || baseServings <= 0) {
    return quantity;
  }

  return Number(((quantity / baseServings) * nextServings).toFixed(2));
}

export function formatScaledQuantity(value: number) {
  if (Number.isInteger(value)) {
    return `${value}`;
  }

  return `${value}`.replace(/\.0+$/, "").replace(/(\.[1-9]*)0+$/, "$1");
}
