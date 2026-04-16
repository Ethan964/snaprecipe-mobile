# SnapRecipe Design Plan

## Product Direction

**SnapRecipe** is a portrait-first mobile cooking companion designed for fast, one-handed use. The core interaction is visually direct: the user sees a dish, captures or imports a photo, and receives a clear, personalized recipe with minimal typing. The interface should feel native to iOS, using generous spacing, rounded surfaces, strong typographic hierarchy, and focused calls to action. The app should prioritize speed, reassurance, and delight while keeping the primary flow frictionless.

## Screen List

| Screen | Purpose | Notes |
|---|---|---|
| **Onboarding: Welcome** | Introduce the value proposition and visual identity. | Explains photo-to-recipe workflow in one glance. |
| **Onboarding: Preferences** | Collect dietary preferences for recipe personalization. | Vegan, gluten-free, nut-free, halal, dairy-free, and none. |
| **Onboarding: Notifications** | Ask for scan reset and saved recipe reminder notifications. | Framed as optional utility, not marketing pressure. |
| **Home / Capture Hub** | Main launch screen with scan counter, hero messaging, and primary capture actions. | Full emphasis on camera and photo import. |
| **Camera Capture** | Live capture entry point for snapping a dish. | Full-screen, minimal chrome, large shutter button. |
| **Gallery Import** | Select an existing food image from the photo library. | Uses native picker and returns into the analysis flow. |
| **Analysis Loading** | Shows animated progress while the image is analyzed. | Reassures the user with rotating culinary messages. |
| **Recipe Detail** | Displays dish name, confidence, time, ingredients, steps, tips, substitutions, and servings control. | This is the core content screen of the app. |
| **Saved Recipes** | Lists locally saved recipes with quick metadata. | Search can be deferred, but list clarity is required. |
| **Saved Recipe Detail** | Reopens a previously saved recipe in the same reading format. | Shared component structure with Recipe Detail. |
| **Upgrade Paywall Sheet** | Presents free scan limit status and premium plans. | Appears after the user has already received value. |
| **Settings / Preferences** | Lets users revise dietary preferences and notification choices. | Also displays scan usage summary. |

## Primary Content and Functionality

| Screen | Primary Content | Required Functionality |
|---|---|---|
| **Welcome** | Brand mark, tagline, short explanatory copy, illustration cues. | Continue to onboarding preferences or skip. |
| **Preferences** | Choice chips for dietary restrictions and cooking style defaults. | Save preferences locally and apply them to future recipe requests. |
| **Notifications** | Utility-focused copy and toggle-style prompt. | Request notification permission or continue without it. |
| **Home / Capture Hub** | Greeting, scan usage progress, recent saved recipe preview, two large action cards. | Open camera, import photo, jump to saved recipes, surface free-scan state. |
| **Camera Capture** | Camera preview, back control, flash control, shutter button, gallery shortcut. | Request camera permission, capture image, route to loading. |
| **Gallery Import** | Native image picker result preview. | Pick image from library and route to loading. |
| **Analysis Loading** | Progress ring or animated pulse, dynamic status messages, image thumbnail. | Simulate or perform AI analysis, prevent duplicate submissions, allow cancellation if safe. |
| **Recipe Detail** | Dish title, confidence badge, cuisine, prep/cook times, difficulty, servings stepper, ingredient list, expandable substitutions, instructions, chef tip, save/share controls. | Save recipe locally, share recipe text, adjust servings, start another scan, and trigger post-value paywall when appropriate. |
| **Saved Recipes** | Recipe cards with dish image, title, cuisine, saved date, and difficulty/time summary. | Open detail, empty state when none saved, persist favorites locally. |
| **Upgrade Paywall Sheet** | Monthly and yearly options, savings emphasis, restore purchase, premium feature list. | Show soft-gated upgrade prompt after scan limit is exceeded or after scan five completion. |
| **Settings / Preferences** | Dietary preference chips, notification status, scan counter explanation, app info. | Update local settings and persist them. |

## Key User Flows

### Core Scan Flow

The user launches the app and lands on the **Home / Capture Hub**. They tap the primary camera action, capture a food photo, move into the **Analysis Loading** screen, and then arrive on **Recipe Detail** with a generated recipe. From there, the user can adjust servings, review substitutions, save the recipe, share it, or start another scan.

### Gallery Import Flow

The user opens the **Home / Capture Hub**, taps the import action, selects a food photo from the library, and is taken to **Analysis Loading**. Once processing completes, the same **Recipe Detail** layout appears, ensuring parity between live capture and imported photos.

### Save and Revisit Flow

The user views a recipe and taps **Save**. The recipe is stored locally without requiring login. Later, the user opens the **Saved Recipes** tab, selects a saved card, and reads the same detailed recipe view with identical ingredient and instruction formatting.

### Free-to-Premium Conversion Flow

The user completes their fifth free scan and still receives the generated recipe. When they leave the recipe or attempt another scan, the **Upgrade Paywall Sheet** appears as a soft gate. The messaging emphasizes unlimited scans, unlimited saves, and dietary personalization while keeping the dismissal option clear.

### Preference Personalization Flow

During onboarding, the user selects dietary preferences such as vegan or gluten-free. These preferences are stored locally and injected into future recipe generation requests so that returned ingredients and substitutions align with the user’s constraints.

## Layout and Interaction Principles

All screens should be designed for **portrait 9:16 composition** and **one-handed usage**. Primary actions belong in the lower half of the screen, especially on the home and recipe screens. Typography should use a large, warm title style paired with highly readable body copy. Content blocks should be grouped into rounded cards with subtle borders, creating an editorial but native feeling rather than a dashboard aesthetic.

The home screen should feature a vertically stacked layout with a compact header, a scan-progress panel, and two large action cards for **Snap a Dish** and **Import from Photos**. The recipe screen should favor a scrollable editorial layout, with the title and quick metadata visible above the fold, followed by ingredients and instructions in clearly separated sections. The servings control should remain visually prominent because it is one of the most practical utilities in the app.

Feedback should be immediate and calm. Primary button taps should use light haptics on native devices. Loading states should feel culinary and human rather than technical, using phrases such as “Analyzing your dish” and “Balancing ingredients.” Motion should remain subtle, using fades and gentle scale transitions instead of spring-heavy effects.

## Color Choices

| Token | Color | Purpose |
|---|---|---|
| **Primary** | `#F26B3A` | Warm tomato-orange accent for key actions and progress highlights. |
| **Secondary Accent** | `#F7C873` | Soft saffron highlight for premium prompts and badges. |
| **Background** | `#FFF9F3` | Warm cream base that feels culinary and inviting. |
| **Surface** | `#FFFFFF` | Elevated cards, sheets, and recipe sections. |
| **Foreground** | `#1F1B18` | Rich espresso text for strong readability. |
| **Muted** | `#786B63` | Secondary metadata and explanatory copy. |
| **Border** | `#EADFD5` | Soft dividers that keep the interface airy. |
| **Success** | `#3E9B62` | Save confirmations and positive states. |
| **Warning** | `#D68A1F` | Scan usage warnings and limited free-tier nudges. |
| **Error** | `#C94B4B` | Permission failures and blocking issues. |

The palette should communicate food, warmth, and usefulness. It should avoid neon saturation and instead resemble premium kitchen editorial design. The premium paywall can lean slightly more into saffron and warm gold accents while remaining consistent with the primary tomato-orange brand color.

## Information Architecture Priorities

| Priority | Why it matters |
|---|---|
| **Capture first** | The app’s core value is instant recipe generation from images, so capture must dominate navigation and screen hierarchy. |
| **Recipe clarity second** | Once the recipe is shown, readability and practical cooking utility matter more than decorative visuals. |
| **Saved recipes third** | Local persistence creates habit formation without requiring account creation. |
| **Settings fourth** | Preferences support personalization, but should not distract from the primary flow. |

## MVP Build Scope for This Iteration

This implementation should focus on the launch-worthy MVP described in the blueprint: onboarding, image capture and import entry points, AI-powered recipe generation, servings adjustment, ingredient substitutions, local saving, sharing, scan usage tracking, and a soft paywall. Cloud sync, affiliate integrations, advanced nutrition, timers, and watch or widget experiences should remain outside the first build unless explicitly added later.

## Implementation Notes

The initialized project is based on Expo and should therefore interpret the blueprint through a React Native and Expo-native implementation rather than the original SwiftUI suggestion. Camera, image import, local persistence, haptics, and sharing should use Expo-supported modules so the experience remains testable within the current project structure while still targeting an iOS-first product direction.

The first implementation should default to local storage for preferences, free scan counts, onboarding state, and saved recipes. Server-side support can be introduced only where truly required for AI processing, since the product blueprint benefits from image understanding and recipe generation. The user-facing experience, however, should not require authentication in the MVP.
