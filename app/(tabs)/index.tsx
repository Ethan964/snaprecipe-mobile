import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  Switch,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import {
  SNAPRECIPE_DIETARY_OPTIONS,
  formatScaledQuantity,
  scaleIngredientQuantity,
  useSnapRecipe,
  type DietaryPreference,
} from "@/lib/snaprecipe-store";
import type { GeneratedRecipe } from "@/shared/snaprecipe";

const LABELS: Record<DietaryPreference, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  "gluten-free": "Gluten-Free",
  "nut-free": "Nut-Free",
  halal: "Halal",
  "dairy-free": "Dairy-Free",
};

export default function HomeScreen() {
  const {
    onboardingComplete,
    completeOnboarding,
    dietaryPreferences,
    findMatchingSavedRecipe,
    freeScansRemaining,
    hasReachedSoftPaywall,
    incrementScanUsage,
    notificationsEnabled,
    removeRecipe,
    saveRecipe,
    savedRecipes,
    scanUsage,
  } = useSnapRecipe();

  const generateRecipeMutation = trpc.snapRecipe.generate.useMutation();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const [selectedPreferences, setSelectedPreferences] = useState<DietaryPreference[]>(dietaryPreferences);
  const [notifyOptIn, setNotifyOptIn] = useState(notificationsEnabled);
  const [step, setStep] = useState(0);
  const [captureMode, setCaptureMode] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState<GeneratedRecipe | null>(null);
  const [activeServings, setActiveServings] = useState(2);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("Analyzing your dish...");

  const recentRecipe = savedRecipes[0];
  const savedActiveRecipe = activeRecipe
    ? findMatchingSavedRecipe(activeRecipe)
    : undefined;
  const progressWidth = useMemo(() => {
    const ratio = scanUsage.freeLimit === 0 ? 0 : Math.min(scanUsage.used / scanUsage.freeLimit, 1);
    return Math.max(ratio * 100, scanUsage.used > 0 ? 10 : 0);
  }, [scanUsage.freeLimit, scanUsage.used]);

  const togglePreference = (preference: DietaryPreference) => {
    setSelectedPreferences((current) =>
      current.includes(preference)
        ? current.filter((item) => item !== preference)
        : [...current, preference],
    );
  };

  const finishOnboarding = async () => {
    await completeOnboarding({
      dietaryPreferences: selectedPreferences,
      notificationsEnabled: notifyOptIn,
    });
  };

  const createShareText = (recipe: GeneratedRecipe) => {
    return [
      `${recipe.dishName}`,
      `${recipe.cuisine} · ${recipe.prepTimeMinutes + recipe.cookTimeMinutes} min · Serves ${recipe.servings}`,
      "",
      "Ingredients:",
      ...recipe.ingredients.map((ingredient) => `- ${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`),
      "",
      "Instructions:",
      ...recipe.instructions.map((instruction) => `${instruction.step}. ${instruction.text}`),
      "",
      `Chef tip: ${recipe.tips}`,
    ].join("\n");
  };

  const analyzeImage = async ({
    imageDataUrl,
    imageUri,
    source,
  }: {
    imageDataUrl: string;
    imageUri?: string;
    source: "camera" | "library";
  }) => {
    if (freeScansRemaining <= 0) {
      Alert.alert(
        "Free scans used",
        "You have already used this month’s free scans. The premium upgrade flow will be added next, so the current build stops additional scans here.",
      );
      return;
    }

    setCaptureMode(false);
    setIsAnalyzing(true);
    setAnalysisMessage("Analyzing your dish...");

    try {
      await incrementScanUsage();
      setAnalysisMessage("Finding the perfect recipe...");

      const recipe = await generateRecipeMutation.mutateAsync({
        imageDataUrl,
        imageUri,
        source,
        dietaryPreferences,
      });

      setActiveRecipe(recipe);
      setActiveServings(recipe.servings);
    } catch {
      Alert.alert(
        "Recipe generation unavailable",
        "The recipe could not be generated right now. Please try again with a clearer food image.",
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisMessage("Analyzing your dish...");
    }
  };

  const handleCapture = async () => {
    try {
      if (!cameraPermission?.granted) {
        const result = await requestCameraPermission();
        if (!result.granted) {
          Alert.alert("Camera access needed", "Please allow camera access to scan dishes from the live view.");
          return;
        }
      }

      setCaptureMode(true);
    } catch {
      Alert.alert("Camera unavailable", "The camera could not be opened on this device.");
    }
  };

  const takePicture = async () => {
    const camera = cameraRef.current;
    if (!camera) return;

    try {
      const photo = (await camera.takePictureAsync({
        quality: 0.7,
        base64: true,
      })) as CameraCapturedPicture;

      if (!photo.base64) {
        throw new Error("Missing base64 payload");
      }

      await analyzeImage({
        imageDataUrl: `data:image/jpeg;base64,${photo.base64}`,
        imageUri: photo.uri,
        source: "camera",
      });
    } catch {
      Alert.alert("Capture failed", "SnapRecipe could not capture that image. Please try again.");
    }
  };

  const importFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
        allowsEditing: true,
        aspect: [4, 5],
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.base64) {
        throw new Error("Missing base64 payload");
      }

      await analyzeImage({
        imageDataUrl: `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`,
        imageUri: asset.uri,
        source: "library",
      });
    } catch {
      Alert.alert("Import failed", "SnapRecipe could not use that photo. Please try another image.");
    }
  };

  const shareRecipe = async () => {
    if (!activeRecipe) return;

    try {
      await Share.share({ message: createShareText(activeRecipe) });
    } catch {
      Alert.alert("Share unavailable", "The recipe could not be shared from this device right now.");
    }
  };

  const toggleSaveRecipe = async () => {
    if (!activeRecipe) return;

    if (savedActiveRecipe) {
      await removeRecipe(savedActiveRecipe.id);
      return;
    }

    await saveRecipe({
      ...activeRecipe,
      baseServings: activeRecipe.baseServings,
    });
  };

  if (!onboardingComplete) {
    return (
      <ScreenContainer className="px-5 pt-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-between gap-6">
            <View className="gap-4">
              <View className="self-start rounded-full bg-surface px-4 py-2">
                <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-primary">Point. Snap. Cook.</Text>
              </View>

              <View className="rounded-[32px] border border-border bg-surface px-6 py-7">
                {step === 0 ? (
                  <View className="gap-5">
                    <Text className="text-4xl font-bold leading-tight text-foreground">Turn any food photo into a recipe you can actually cook.</Text>
                    <Text className="text-base leading-7 text-muted">
                      SnapRecipe identifies the dish, drafts ingredients with quantities, and gives you step-by-step instructions with smart substitutions.
                    </Text>
                    <View className="gap-3 rounded-[24px] bg-background px-4 py-4">
                      <Text className="text-sm font-semibold text-foreground">How it works</Text>
                      <Text className="text-sm leading-6 text-muted">Photograph a plate, import a screenshot, or use a menu photo. We turn the image into a practical recipe in seconds.</Text>
                    </View>
                  </View>
                ) : step === 1 ? (
                  <View className="gap-5">
                    <Text className="text-3xl font-bold leading-tight text-foreground">Choose dietary preferences once.</Text>
                    <Text className="text-base leading-7 text-muted">
                      These selections guide future ingredients and substitution ideas, so every recipe starts closer to what you can cook.
                    </Text>
                    <View className="flex-row flex-wrap gap-3">
                      {SNAPRECIPE_DIETARY_OPTIONS.map((preference) => {
                        const selected = selectedPreferences.includes(preference);
                        return (
                          <Pressable
                            key={preference}
                            onPress={() => togglePreference(preference)}
                            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                            className={`rounded-full border px-4 py-3 ${selected ? "border-primary bg-primary" : "border-border bg-background"}`}
                          >
                            <Text className={`text-sm font-semibold ${selected ? "text-background" : "text-foreground"}`}>
                              {LABELS[preference]}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <View className="gap-5">
                    <Text className="text-3xl font-bold leading-tight text-foreground">Stay on top of your free scan resets.</Text>
                    <Text className="text-base leading-7 text-muted">
                      Enable reminders if you want a nudge when your monthly free scans reset or when a saved recipe is ready to revisit.
                    </Text>
                    <View className="rounded-[24px] bg-background px-5 py-5">
                      <View className="flex-row items-center justify-between gap-4">
                        <View className="flex-1">
                          <Text className="text-lg font-semibold text-foreground">Useful notifications</Text>
                          <Text className="mt-2 text-sm leading-6 text-muted">Monthly scan reset reminders and saved recipe prompts.</Text>
                        </View>
                        <Switch
                          value={notifyOptIn}
                          onValueChange={setNotifyOptIn}
                          trackColor={{ false: "#EADFD5", true: "#F26B3A" }}
                          thumbColor="#FFFFFF"
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View className="gap-3">
              <View className="flex-row items-center gap-2 self-center rounded-full bg-background px-4 py-2">
                {[0, 1, 2].map((item) => (
                  <View key={item} className={`h-2.5 rounded-full ${step === item ? "w-8 bg-primary" : "w-2.5 bg-border"}`} />
                ))}
              </View>

              {step < 2 ? (
                <Pressable
                  onPress={() => setStep((current) => current + 1)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
                  className="rounded-full bg-primary px-5 py-4"
                >
                  <Text className="text-center text-base font-semibold text-background">Continue</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => void finishOnboarding()}
                  style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
                  className="rounded-full bg-primary px-5 py-4"
                >
                  <Text className="text-center text-base font-semibold text-background">Start cooking</Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => {
                  if (step === 0) {
                    void completeOnboarding({ dietaryPreferences: [], notificationsEnabled: false });
                    return;
                  }
                  setStep((current) => Math.max(current - 1, 0));
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                className="rounded-full border border-border bg-surface px-5 py-4"
              >
                <Text className="text-center text-base font-semibold text-foreground">{step === 0 ? "Skip for now" : "Back"}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (captureMode) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="bg-black">
        <View className="flex-1 bg-black">
          {cameraPermission?.granted ? (
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
              <View className="flex-1 justify-between px-5 pb-8 pt-4">
                <View className="flex-row items-center justify-between">
                  <Pressable
                    onPress={() => setCaptureMode(false)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    className="rounded-full bg-black/35 px-4 py-3"
                  >
                    <Text className="text-sm font-semibold text-white">Close</Text>
                  </Pressable>
                  <View className="rounded-full bg-black/35 px-4 py-3">
                    <Text className="text-sm font-semibold text-white">Center the dish in frame</Text>
                  </View>
                </View>

                <View className="items-center gap-5">
                  <Text className="text-center text-sm leading-6 text-white/80">
                    Use even lighting and fill most of the frame with the food for the best recipe guess.
                  </Text>
                  <View className="flex-row items-center gap-6">
                    <Pressable
                      onPress={() => void importFromLibrary()}
                      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                      className="rounded-full bg-white/15 px-5 py-4"
                    >
                      <Text className="text-sm font-semibold text-white">Photos</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void takePicture()}
                      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}
                      className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-primary"
                    >
                      <View className="h-14 w-14 rounded-full bg-white" />
                    </Pressable>
                    <View className="w-[84px]" />
                  </View>
                </View>
              </View>
            </CameraView>
          ) : (
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-center text-3xl font-bold text-white">Camera access needed</Text>
              <Text className="mt-4 text-center text-base leading-7 text-white/75">
                Allow camera access so SnapRecipe can analyze dishes directly from the live capture view.
              </Text>
              <Pressable
                onPress={() => void requestCameraPermission()}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                className="mt-6 rounded-full bg-primary px-5 py-4"
              >
                <Text className="text-base font-semibold text-white">Grant camera access</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-5 pt-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="gap-5">
          <View className="gap-2">
            <Text className="text-sm font-semibold uppercase tracking-[1.5px] text-primary">SnapRecipe</Text>
            <Text className="text-4xl font-bold leading-tight text-foreground">See a dish. Get a recipe. Start cooking.</Text>
            <Text className="text-base leading-7 text-muted">
              Use your monthly free scans on meals you want to recreate, then save the hits that deserve a second try.
            </Text>
          </View>

          <View className="rounded-[30px] border border-border bg-surface px-5 py-5">
            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-1 gap-1">
                <Text className="text-lg font-semibold text-foreground">Free scans this month</Text>
                <Text className="text-sm text-muted">{scanUsage.used} of {scanUsage.freeLimit} used</Text>
              </View>
              <View className="rounded-full bg-background px-4 py-2">
                <Text className="text-sm font-semibold text-primary">{freeScansRemaining} left</Text>
              </View>
            </View>
            <View className="mt-4 h-3 rounded-full bg-background">
              <View className="h-3 rounded-full bg-primary" style={{ width: `${progressWidth}%` as const }} />
            </View>
          </View>

          <View className="gap-3">
            <Pressable
              onPress={() => void handleCapture()}
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
              className="rounded-[30px] bg-primary px-5 py-5"
            >
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-1 gap-2">
                  <Text className="text-2xl font-bold text-background">Snap a dish</Text>
                  <Text className="text-sm leading-6 text-background/80">Launch the live camera and turn a plate, menu, or screenshot-worthy meal into a recipe.</Text>
                </View>
                <View className="h-14 w-14 items-center justify-center rounded-full bg-background/15">
                  <IconSymbol name="camera.fill" size={28} color="#FFFFFF" />
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => void importFromLibrary()}
              style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}
              className="rounded-[30px] border border-border bg-surface px-5 py-5"
            >
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-1 gap-2">
                  <Text className="text-2xl font-bold text-foreground">Import from Photos</Text>
                  <Text className="text-sm leading-6 text-muted">Recreate a restaurant meal, travel memory, or social post without typing the dish name.</Text>
                </View>
                <View className="h-14 w-14 items-center justify-center rounded-full bg-background">
                  <IconSymbol name="photo.on.rectangle" size={28} color="#F26B3A" />
                </View>
              </View>
            </Pressable>
          </View>

          <View className="rounded-[30px] border border-border bg-surface px-5 py-5">
            <View className="flex-row items-center justify-between gap-4">
              <Text className="text-lg font-semibold text-foreground">Dietary profile</Text>
              <View className="rounded-full bg-background px-3 py-1.5">
                <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-primary">{dietaryPreferences.length === 0 ? "Flexible" : `${dietaryPreferences.length} active`}</Text>
              </View>
            </View>
            <Text className="mt-2 text-sm leading-6 text-muted">
              {dietaryPreferences.length === 0
                ? "No filters are currently active. SnapRecipe will return the broadest, most likely recipe interpretation."
                : dietaryPreferences.map((item) => LABELS[item]).join(", ")}
            </Text>
          </View>

          {hasReachedSoftPaywall ? (
            <View className="rounded-[30px] border border-warning bg-[#FFF4E5] px-5 py-5">
              <Text className="text-xl font-semibold text-foreground">You have used 5 of 5 free scans this month.</Text>
              <Text className="mt-2 text-sm leading-6 text-muted">
                The soft paywall experience is now active in the interface. A future subscription step can present Monthly, Yearly, and Restore Purchase actions.
              </Text>
              <View className="mt-4 rounded-[22px] bg-white px-4 py-4">
                <Text className="text-sm font-semibold text-foreground">Premium preview</Text>
                <Text className="mt-2 text-sm leading-6 text-muted">Unlimited scans, unlimited saved recipes, and priority recipe generation.</Text>
              </View>
            </View>
          ) : null}

          {isAnalyzing ? (
            <View className="rounded-[30px] border border-border bg-surface px-5 py-8">
              <View className="items-center gap-4">
                <ActivityIndicator size="large" color="#F26B3A" />
                <Text className="text-xl font-semibold text-foreground">{analysisMessage}</Text>
                <Text className="text-center text-sm leading-6 text-muted">
                  SnapRecipe is identifying the dish, estimating quantities, and turning the image into a practical recipe.
                </Text>
              </View>
            </View>
          ) : null}

          {activeRecipe ? (
            <View className="gap-4 rounded-[30px] border border-border bg-surface px-5 py-5">
              {activeRecipe.imageUri ? (
                <Image source={{ uri: activeRecipe.imageUri }} className="h-56 w-full rounded-[24px]" resizeMode="cover" />
              ) : null}

              <View className="gap-2">
                <View className="flex-row items-start justify-between gap-4">
                  <View className="flex-1 gap-1">
                    <Text className="text-3xl font-bold text-foreground">{activeRecipe.dishName}</Text>
                    <Text className="text-sm text-muted">
                      {activeRecipe.cuisine} · {activeRecipe.prepTimeMinutes + activeRecipe.cookTimeMinutes} min · {activeRecipe.difficulty}
                    </Text>
                  </View>
                  <View className="rounded-full bg-background px-3 py-1.5">
                    <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-primary">
                      {activeRecipe.confidence} confidence
                    </Text>
                  </View>
                </View>
                <Text className="text-sm leading-6 text-muted">
                  Personalized with {dietaryPreferences.length === 0 ? "no active dietary filters" : dietaryPreferences.map((item) => LABELS[item]).join(", ")}.
                </Text>
              </View>

              <View className="rounded-[24px] bg-background px-4 py-4">
                <View className="flex-row items-center justify-between gap-4">
                  <Text className="text-lg font-semibold text-foreground">Servings</Text>
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      onPress={() => setActiveServings((current) => Math.max(1, current - 1))}
                      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                      className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface"
                    >
                      <Text className="text-lg font-semibold text-foreground">−</Text>
                    </Pressable>
                    <Text className="min-w-[32px] text-center text-lg font-semibold text-foreground">{activeServings}</Text>
                    <Pressable
                      onPress={() => setActiveServings((current) => current + 1)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                      className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface"
                    >
                      <Text className="text-lg font-semibold text-foreground">+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View className="gap-3">
                <Text className="text-xl font-semibold text-foreground">Ingredients</Text>
                {activeRecipe.ingredients.map((ingredient) => {
                  const scaledQuantity = scaleIngredientQuantity(
                    ingredient.quantity,
                    activeRecipe.baseServings,
                    activeServings,
                  );

                  return (
                    <View key={ingredient.id} className="rounded-[24px] bg-background px-4 py-4">
                      <Text className="text-base font-semibold text-foreground">
                        {formatScaledQuantity(scaledQuantity)} {ingredient.unit} {ingredient.name}
                      </Text>
                      {ingredient.substitutes.length > 0 ? (
                        <Text className="mt-2 text-sm leading-6 text-muted">
                          Swaps: {ingredient.substitutes.join(", ")}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>

              <View className="gap-3">
                <Text className="text-xl font-semibold text-foreground">Instructions</Text>
                {activeRecipe.instructions.map((instruction) => (
                  <View key={instruction.step} className="rounded-[24px] bg-background px-4 py-4">
                    <Text className="text-sm font-semibold uppercase tracking-[1.2px] text-primary">Step {instruction.step}</Text>
                    <Text className="mt-2 text-base leading-7 text-foreground">{instruction.text}</Text>
                    {instruction.timeMinutes ? (
                      <Text className="mt-2 text-sm text-muted">Estimated time: {instruction.timeMinutes} min</Text>
                    ) : null}
                  </View>
                ))}
              </View>

              <View className="rounded-[24px] bg-background px-4 py-4">
                <Text className="text-sm font-semibold uppercase tracking-[1.2px] text-primary">Chef tip</Text>
                <Text className="mt-2 text-base leading-7 text-foreground">{activeRecipe.tips}</Text>
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => void toggleSaveRecipe()}
                  style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
                  className="flex-1 rounded-full border border-border bg-background px-5 py-4"
                >
                  <Text className="text-center text-base font-semibold text-foreground">{savedActiveRecipe ? "Unsave" : "Save"}</Text>
                </Pressable>
                <Pressable
                  onPress={() => void shareRecipe()}
                  style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
                  className="flex-1 rounded-full border border-border bg-background px-5 py-4"
                >
                  <Text className="text-center text-base font-semibold text-foreground">Share</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => setActiveRecipe(null)}
                style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
                className="rounded-full bg-primary px-5 py-4"
              >
                <Text className="text-center text-base font-semibold text-background">Try another dish</Text>
              </Pressable>
            </View>
          ) : null}

          <View className="rounded-[30px] border border-border bg-surface px-5 py-5">
            <View className="flex-row items-center justify-between gap-4">
              <Text className="text-lg font-semibold text-foreground">Saved highlights</Text>
              <Text className="text-sm font-semibold text-primary">{savedRecipes.length} saved</Text>
            </View>
            {recentRecipe ? (
              <View className="mt-4 rounded-[24px] bg-background px-4 py-4">
                <Text className="text-xl font-semibold text-foreground">{recentRecipe.dishName}</Text>
                <Text className="mt-2 text-sm text-muted">{recentRecipe.cuisine} · {recentRecipe.prepTimeMinutes + recentRecipe.cookTimeMinutes} min · {recentRecipe.difficulty}</Text>
                <Text className="mt-3 text-sm leading-6 text-muted">{recentRecipe.tips}</Text>
              </View>
            ) : (
              <Text className="mt-4 text-sm leading-6 text-muted">
                Your first saved recipe will appear here so you can jump back into a favorite dish quickly.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
