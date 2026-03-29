# AVISHU Superapp

A role-based Expo / React Native application that showcases the AVISHU brand across three connected roles—Customer, Franchisee, and Production—moving the same order through its lifecycle with realtime updates.

## Overview
- Premium, monochrome mobile experience built with Expo Router.
- Single codebase with role shells for Customer, Franchisee, and Production.
- Firebase-backed realtime data (Firestore, Auth) with a demo-friendly fallback if config is missing.
- Optimized for quick live demos on real devices via Expo Go.

## Core Product Idea
One order, three perspectives:
- Customers browse, place orders, and track status with chat support.
- Franchisees accept, route to production, and hand off to delivery.
- Production manages queue/active/ready tasks and updates status back to the network.

## Quick Start (TL;DR)
1) Install: `npm install`
2) Env: copy `.env.example` → `.env` and fill Firebase client keys (see below)
3) Run: `npm start`
4) Open on phone: install **Expo Go**, scan the QR from the terminal/web UI
5) Demo: sign in with any `+7` phone, OTP code `120120`, pick a role, walk the order flow

## Main Features
### Customer
- Onboarding with phone verification and nickname setup
- Catalog browsing, product detail, purchase or preorder
- Order tracker with realtime status
- Order-scoped support chat
- Profile with nickname editing

### Franchisee
- Boutique dashboard for incoming orders
- Accept order, send to production, mark ready for delivery
- Client overview and basic profile

### Production
- Queue, Active, and Ready boards
- Task detail with internal production notes
- Mark tasks ready and push status back to franchisee/customer

## Tech Stack
- **Framework**: Expo (React Native), Expo Router
- **UI**: React Native components, react-native-svg, react-native-maps
- **State**: Zustand for local/dummy data fallback
- **Backend**: Firebase (Auth, Firestore)
- **Tooling**: TypeScript, Expo Dev Client, Metro bundler

## Project Architecture / Structure
```
app/
  _layout.tsx
  (public)/
  (auth)/
  (customer)/
  (franchisee)/
  (production)/
assets/
components/
  auth/ brand/ chat/ customer/ franchisee/ layout/ navigation/ order/ product/ production/ public/ ui/
hooks/
lib/
  firebase/
services/
store/
types/
```
- Route groups under `app/` isolate role shells.
- `services/` holds Firestore and auth interactions.
- `store/` contains Zustand stores used for demo/local fallback.
- `lib/firebase/` centralizes Firebase config and guards against missing env.

## Prerequisites
- Node.js 18+ and npm
- Expo CLI (installed via `npm install -g expo-cli` is optional; `npx expo` works fine)
- iOS or Android phone with the **Expo Go** app installed
- (Optional) Android Studio or Xcode simulators; physical device recommended for quickest demo

## Installation
```bash
npm install
```
If you hit permission or network issues, retry with a clean cache: `npm install --force` is not recommended unless needed; prefer fixing the root cause.

## Environment Variables
This app expects Firebase client config at runtime. These are public client keys (not server secrets), but do **not** place private service accounts or backend secrets in the mobile env.

1) Copy the template
```bash
cp .env.example .env
```
2) Fill the values in `.env`:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```
- These map directly to `firebaseConfig` in `lib/firebase/config.ts`.
- If you don’t have the keys, request them from the maintainer privately, then paste them into `.env`.
- Never commit `.env` with real credentials.

## Running the App Locally
1) Start the Expo dev server
```bash
npm start
```
2) Choose a target in the Expo CLI UI or commands:
- Android device/emulator: `a`
- iOS simulator (macOS): `i`
- Web (if desired): `w`
3) Stop the server with `Ctrl+C`. Restart with `npm start` again.

## Opening on a Phone with Expo Go
1) Install **Expo Go** from the App Store / Google Play.
2) Connect phone and dev machine to the same Wi‑Fi.
3) Run `npm start` and scan the QR code:
- iOS: scan with the Camera app (or Expo Go’s scanner)
- Android: scan directly inside Expo Go
4) Wait for the bundle to load; the app opens automatically in Expo Go.

## Demo Walkthrough (suggested for judges)
1) Open app → onboarding screens → phone entry (`+7` numbers are accepted)
2) Enter OTP `120120` (demo code)
3) Pick a role:
   - Customer: browse catalog, open a product, place an order (purchase or preorder)
   - Franchisee: accept the new order, send to production
   - Production: move the task to Active, add a note, mark Ready
4) Switch back to Franchisee: send ready order to delivery
5) Switch back to Customer: open Orders and Chat to show realtime status updates

## Firebase Usage
- **Auth**: anonymous bootstrap plus phone verification UI; demo OTP `120120`
- **Firestore**: orders, products, users, chats; listeners drive realtime updates
- **Fallback**: if Firebase config is missing, the app uses a local Zustand demo store so the flow still works (no external writes)

## Troubleshooting
- Expo server not starting: clear cache `npx expo start -c`
- QR code not opening: ensure same Wi‑Fi; try switching connection to “Tunnel” in Expo CLI
- Expo Go stuck on loading: close Expo Go, reopen, and re-scan; clear Metro cache `npx expo start -c`
- Firebase config missing: confirm `.env` is present and keys are non-empty; restart dev server after edits
- Dependency install issues: delete `node_modules`, run `npm install`; ensure Node 18+
- Simulator not launching: start Android emulator / iOS Simulator manually, then press `a` / `i`

## Known Limitations
- Demo-friendly auth; not production-hardened
- Firebase security rules not provided here
- Seeded catalog and simplified delivery model
- Push notifications not wired in this build

## Next Steps / Roadmap
- Production batching, assignment, and scheduling
- Push notifications for order status changes
- Admin analytics and audit tooling

## Verification
Current local check:
```bash
npm run typecheck
```
