import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { SNAPRECIPE_DIETARY_OPTIONS, useSnapRecipe, type DietaryPreference } from "@/lib/snaprecipe-store";

const LABELS: Record<DietaryPreference, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  "gluten-free": "Gluten-Free",
  "nut-free": "Nut-Free",
  halal: "Halal",
  "dairy-free": "Dairy-Free",
};

export default function SettingsScreen() {
  const {
    dietaryPreferences,
    notificationsEnabled,
    updateNotificationsEnabled,
    updatePreferences,
    scanUsage,
    freeScansRemaining,
    resetMonthlyUsageForTesting,
  } = useSnapRecipe();

  const togglePreference = async (preference: DietaryPreference) => {
    const next = dietaryPreferences.includes(preference)
      ? dietaryPreferences.filter((item) => item !== preference)
      : [...dietaryPreferences, preference];

    await updatePreferences(next);
  };

  const handleReset = () => {
    Alert.alert(
      "Reset free scans",
      "This is useful during local testing. It clears this month’s scan counter without removing your saved recipes.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            void resetMonthlyUsageForTesting();
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer className="px-5 pt-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="gap-5">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Preferences</Text>
            <Text className="text-sm leading-6 text-muted">
              Personalize every generated recipe so SnapRecipe starts from your dietary needs and current plan status.
            </Text>
          </View>

          <View className="rounded-[28px] border border-border bg-surface px-5 py-5">
            <Text className="text-lg font-semibold text-foreground">Dietary preferences</Text>
            <Text className="mt-2 text-sm leading-6 text-muted">
              These filters are injected into future recipe requests to guide ingredients and substitutions.
            </Text>
            <View className="mt-4 flex-row flex-wrap gap-3">
              {SNAPRECIPE_DIETARY_OPTIONS.map((preference) => {
                const selected = dietaryPreferences.includes(preference);
                return (
                  <Pressable
                    key={preference}
                    onPress={() => void togglePreference(preference)}
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

          <View className="rounded-[28px] border border-border bg-surface px-5 py-5">
            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground">Notifications</Text>
                <Text className="mt-2 text-sm leading-6 text-muted">
                  Keep scan reset reminders and saved-recipe nudges available when you want them.
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => {
                  void updateNotificationsEnabled(value);
                }}
                trackColor={{ false: "#EADFD5", true: "#F26B3A" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View className="rounded-[28px] border border-border bg-surface px-5 py-5">
            <Text className="text-lg font-semibold text-foreground">Free scan usage</Text>
            <Text className="mt-2 text-sm leading-6 text-muted">
              You have used {scanUsage.used} of {scanUsage.freeLimit} free scans for {scanUsage.monthKey}. That leaves {freeScansRemaining} free scans this month.
            </Text>
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
              className="mt-4 rounded-full border border-border bg-background px-4 py-3"
            >
              <Text className="text-center text-sm font-semibold text-foreground">Reset counter for local testing</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
