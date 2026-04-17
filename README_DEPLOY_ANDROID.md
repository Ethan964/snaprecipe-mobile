# SnapRecipe Deployment README

**Author:** Manus AI  
**Date:** April 16, 2026

## What this repository is

This repository is the current **SnapRecipe** mobile app codebase. It is suitable for an **Android soft launch now**. The important reality is that the app is ready for store deployment as a product test, but **real store billing still needs to be wired if you want live subscription revenue inside Google Play**. The app already has the product flow, paywall state, branding, and store-facing UX; the missing commercialization step is actual billing integration.

## The cheapest recommended deployment path

If your goal is to get live as cheaply as possible, the recommended sequence is to launch **Android first**, keep the first release either free or very lightly monetized, and avoid iOS until Android shows traction. Google Play requires a **US$25 one-time registration fee**.[1] Apple requires **$99 per year** for the Apple Developer Program.[2]

| Decision | Cheapest recommendation | Why |
|---|---|---|
| **First platform** | Android only | Lowest fixed cost |
| **First release type** | Soft launch | Reduces risk and support load |
| **Monetization choice** | Free first, or add one monthly and one annual subscription | Keeps scope simple |
| **Cloud setup** | Minimal privacy/support site plus only essential backend hosting | Avoids overhead |
| **Advertising** | Organic content first | Paid installs are too risky early |

## Exact steps to deploy on Android

### 1. Get the repository

Use the attached project version as the repository snapshot for this app. In the project UI, you can also open the latest version and use the code panel or the download option to export the full source tree.

### 2. Create your Google Play developer account

Open Play Console and create a developer account. Google states that the registration fee is **US$25 one time**.[1]

### 3. Prepare the minimum launch materials

Before building the production artifact, prepare these assets and links.

| Item | What you need |
|---|---|
| **App title** | SnapRecipe |
| **Short description** | Turn food photos into practical recipes in seconds. |
| **Privacy policy URL** | A simple public page explaining photo usage, storage, billing, and contact details |
| **Support email** | One working support inbox |
| **Screenshots** | Real screenshots from the current app |
| **Feature graphic** | Optional for some surfaces, but recommended |

### 4. Build the Android release

For this project, the correct way to generate the Android build is **not** to try to build it manually in the sandbox. Instead, open the latest project version in the Management UI and click **Publish**. That workflow is the supported route for generating the production Android package from this project environment.

| Step | Action |
|---|---|
| **A** | Open the latest project version |
| **B** | Review the checkpoint so you know you are publishing the right code |
| **C** | Click **Publish** in the UI |
| **D** | Wait for the Android build artifact to finish |
| **E** | Download the generated Android package |

### 5. Create the Play Console app entry

Google's official app setup flow is straightforward.[3] In Play Console, create the app, set the default language, enter the app name, choose **App** instead of **Game**, and set the app to **Free** if you want the cheapest validation launch. If you plan to use subscriptions, the app can still be a free download while monetizing via in-app purchases.

### 6. Upload the release

Create an internal test or closed test first, upload the Android package, complete the store listing, fill out the app content forms, and then move to production only after the internal build works on a real device.[4]

| Release order | Why |
|---|---|
| **Internal testing** | Fast sanity check |
| **Closed testing** | Optional if you want a few external testers |
| **Production** | Only after the app installs and core flow works |

## Exact steps to set up payment

The honest answer is that **payments are not finished inside the current codebase yet**. If you want the absolute cheapest launch, publish without billing first and validate usage. If you want revenue from day one, do the steps below before production launch.

### Cheapest payment path

The cheapest long-term path is to use **Google Play Billing directly**, because it avoids adding another paid SaaS layer. Google documents the billing integration and subscription setup process through the Play Billing system.[5] [6]

### Simpler but not always cheapest engineering path

If you want a simpler subscription implementation with easier entitlement handling, use **RevenueCat** on top of Google Play Billing. That usually reduces engineering complexity, but it can add platform dependency and future cost. For a strict low-cost launch, direct Play Billing is the more frugal option.

### Payment setup sequence

| Step | Action | Where |
|---|---|---|
| **1** | Decide the premium offer | Monthly and annual subscription |
| **2** | Create subscription products | Google Play Console |
| **3** | Add billing integration in the app | Codebase |
| **4** | Show real product prices in the paywall | App UI |
| **5** | Add restore / account recovery behavior if needed | App logic |
| **6** | Test purchases with license testers | Google Play test track |
| **7** | Release only after test purchases succeed | Production release |

### Minimum subscription structure I recommend

| Product | Suggested price | Purpose |
|---|---:|---|
| **SnapRecipe Premium Monthly** | $4.99/month | Low-friction entry option |
| **SnapRecipe Premium Yearly** | $29.99/year | Better cash collection and stronger value anchor |

### Exact payment tasks to complete

1. In **Google Play Console**, create a subscription group named `SnapRecipe Premium`.
2. Inside that group, create two products: one monthly and one yearly subscription.[6]
3. In the app code, integrate **Google Play Billing** so the paywall fetches live products rather than showing only static premium messaging.[5]
4. Update the paywall text so it displays actual prices returned by Google Play.
5. Add purchase success handling that unlocks premium scan access.
6. Add purchase restore or entitlement refresh logic so paid users keep access after reinstall or device change.
7. Add license testers in Play Console and run test purchases before release.

If you want, I can do the billing integration work next, but it is **not already complete** in the current repository.

## Exact steps to set up cheap, efficient cloud

You do **not** need an expensive backend on day one unless you want production AI generation at scale. The cheapest architecture is to keep the hosted surface area very small.

### What you actually need at minimum

| Need | Cheapest setup |
|---|---|
| **Privacy policy** | Static page on Cloudflare Pages, GitHub Pages, Carrd, or Notion |
| **Support page** | Same static site as privacy page |
| **Marketing site** | Optional; same static site if needed |
| **App backend** | Only host it if the current AI recipe flow depends on a live server you control |

### Cheapest cloud recommendation

For the very first launch, use this structure:

| Component | Cheap choice | Why |
|---|---|---|
| **Static pages** | Cloudflare Pages or GitHub Pages | Near-zero cost and simple |
| **Custom domain** | Optional at first | Can wait until traction exists |
| **Backend API** | Lowest-cost small instance on Render, Railway, or Fly.io only if needed | Avoid overpaying before usage exists |
| **Database** | Do not add one unless you need accounts or cross-device sync | The app already uses local storage for many flows |

### Cheap cloud setup sequence

1. Create one tiny public site for `/privacy` and `/support`.
2. Point a low-cost domain to it only if you want better credibility; otherwise use the platform URL first.
3. If your production AI flow requires backend hosting, deploy only the minimal API service.
4. Put **hard spend caps** anywhere the provider allows them.
5. Do not add a managed database unless you truly need accounts, sync, or stored history.

### Cheap hosting rule

If you can avoid hosting a database and avoid storing user uploads, do it. Early overhead usually comes from background infrastructure, not the app binary itself.

## Exact steps to advertise cheaply

The cheapest advertising plan is **not paid ads first**. The cheapest effective plan is founder-led organic content plus direct outreach.

### Cheapest launch marketing sequence

| Stage | Action | Cost |
|---|---|---:|
| **1** | Post short demos showing photo-to-recipe flow | $0 |
| **2** | Share the app in cooking, meal-prep, and student communities | $0 |
| **3** | DM small food creators and offer free premium access | $0 to very low |
| **4** | Collect testimonials and simple user clips | $0 |
| **5** | Only test paid ads after conversion data exists | Controlled later spend |

### What the ad message should be

Do not advertise “AI cooking assistant.” That is vague. The clearer message is:

> **See a dish. Get a recipe. Cook it tonight.**

### Cheapest advertising instructions

1. Record three to five short phone videos of the actual app flow.
2. Post them on TikTok, Instagram Reels, and Shorts from a founder account.
3. Use simple hooks such as “I built an app that turns food photos into recipes.”
4. Track whether viewers click, install, and generate a first recipe.
5. Do not spend on paid installs until you can see that users save recipes or convert to premium.

## What to do first, in order

| Order | Action |
|---|---|
| **1** | Use the attached repo version as your working codebase |
| **2** | Create the Google Play developer account |
| **3** | Publish the Android build from the UI |
| **4** | Create privacy and support pages |
| **5** | Upload the app to internal testing in Play Console |
| **6** | Decide whether to ship free first or add billing before production |
| **7** | Launch softly and use organic creator-style promotion |
| **8** | Add iOS only after Android shows traction |

## Final reality check

If you want the **fastest and cheapest serious launch**, release the Android version first, avoid paying Apple yet, keep cloud extremely small, and do not treat ad spend as the growth engine. The app should earn the right to bigger infrastructure and paid marketing by showing real user behavior first.

## References

[1]: https://support.google.com/googleplay/android-developer/answer/6112435?hl=en "Get started with Play Console - Play Console Help"
[2]: https://developer.apple.com/help/account/membership/program-enrollment/ "Enrollment - Membership - Account - Help"
[3]: https://support.google.com/googleplay/android-developer/answer/9859152?hl=en "Create and set up your app - Play Console Help"
[4]: https://support.google.com/googleplay/android-developer/answer/9859348?hl=en "Prepare and roll out a release - Play Console Help"
[5]: https://developer.android.com/google/play/billing "Google Play's billing system - Android Developers"
[6]: https://support.google.com/googleplay/android-developer/answer/140504?hl=en "Create and manage subscriptions - Play Console Help"
