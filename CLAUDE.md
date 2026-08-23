# Handwerksbrauerei Schütte – Claude Code Project Guide

This file provides authoritative guidance to AI agents (Claude Code / Antigravity) working in this repository.

---

## 1. Project Overview & Tech Stack

* **Framework:** Next.js 16 (App Router), React 19, TypeScript
* **Styling:** Tailwind CSS v4 – configured via `@theme` in `src/app/globals.css`. **Do NOT create `tailwind.config.js` or `tailwind.config.ts`.**
* **UI Components:** shadcn/ui built on Base UI (`@base-ui/react`)
* **Icons:** Exclusively `lucide-react` (NO raw emojis or third-party icon libraries in UI code)
* **Backend / Database:** Firebase Firestore (Standard Edition)
* **Auth & Security:** Firebase Client SDK (Anonymous auth + permanent email link) + Firebase Admin SDK (Server Actions & Route Handlers)

---

## 2. Essential Commands

```bash
# Development & Build
npm run dev           # Start Next.js development server (0.0.0.0)
npm run build         # Production Turbopack build & TypeScript check
npm run start         # Start production server on port 3000 (for testing)

# Automated Test Harness (Playwright)
npm run test:all      # Run all Playwright tests on Chromium
npm run test:e2e      # Run complete brewery order flow & upgrade test
npm run test:mobile   # Run mobile viewport tests (iPhone 14 / 390x844)
npm run test:rental   # Run multi-quantity rental & stock limits test

# Post-Test Database Cleanup
npm run test:clean    # Purges all test orders & test users from Firestore
```

---

## 3. Core Architecture & Security Rules

1. **Server Actions for Price Security:**
   * Checkout logic (`src/app/actions/checkout.ts`) runs strictly on the server via Firebase Admin SDK.
   * Prices and stock are re-read from Firestore server-side. The client NEVER determines order prices or deposits.
2. **Admin Session Cookie Protection:**
   * `/admin` is guarded by an HttpOnly session cookie minted by Firebase Admin SDK and verified in proxy middleware (`src/proxy.ts` / `middleware.ts`).
   * Admin claims (`admin: true`) are set via Firebase Admin SDK, never on the client.
3. **Anonymous Authentication Flow:**
   * Every visitor receives an anonymous Firebase session (`signInAnonymously`) on initial load so all orders have a valid `userId`.
   * On account creation, the session is upgraded via `linkWithCredential` so history carries over seamlessly.
4. **Base UI Primitives (`@base-ui/react`):**
   * **NO `asChild` on triggers:** Triggers (`SheetTrigger`, `DialogTrigger`, `PopoverTrigger`) already render semantic `<button>` elements. Style them directly or use `render={<Component />}` to avoid nested `<button>` hydration errors.
5. **Decoupled Decimal Inputs:**
   * Currency/price inputs in admin forms must remain decoupled from integer cent state while focused (`isFocused` refs) to prevent intermediate keystrokes (like `"0,"`) from jumping.

---

## 4. UI, Design & Component Conventions

1. **Exclusively Lucide Icons (`lucide-react`):**
   * Use only icons from `lucide-react`.
   * Alias naming collisions with UI components (e.g. `import { Calendar as CalendarIcon } from "lucide-react";`).
2. **Product & Rental Cards:**
   * Fixed header and image aspect ratios (`aspect-16/9 object-cover`, `min-h-[4.5rem]` header, `min-h-[5.5rem]` description).
   * Pinned footers (`mt-auto`) so steppers, price tags, and buttons align on a single horizontal axis across cards.
   * Additive quantities: The button `"In den Warenkorb"` adds stepper quantity to cart up to `totalStock` and displays 1.5s visual feedback (`"✓ Im Warenkorb"`).
3. **PWA Standby Auto-Sync:**
   * Background `/api/version` check on app focus (`visibilitychange` / `pageshow`).
   * No intrusive or permanently floating overlays over the header in resting state.

---

## 5. German Legal Compliance (Click & Reserve)

* **Unverbindliche Vorbestellung:** Kaufvertrag entsteht erst bei physischer Übergabe im Laden. Buttons heißen *"Zur Reservierung"* oder *"Unverbindlich reservieren"* (NIEMALS *"Kaufen"* oder *"Zahlungspflichtig bestellen"*).
* **Preisangabenverordnung (PAngV):** Liter-Grundpreis (z. B. `6,67 € / l`) ist Pflicht; Pfand wird transparent separat ausgewiesen.
* **Jugendschutzgesetz (JuSchG):** Kein störendes Pop-up-Age-Gate; Altersprüfung (16+ für Bier) erfolgt bei Abholung vor Ort.
* **Lebensmittelinformationsverordnung (LMIV):** Allergene hervorgehoben (z. B. **Gerstenmalz**), Alkoholgehalt in Vol.-% angegeben.

---

## 6. Verification & Mandatory Cleanup Checklist

After EVERY code modification and test run, execute the following protocol:
1. **Build Verification:** Ensure `npm run build` exits with code 0.
2. **Test Run:** Run relevant Playwright tests (`npm run test:mobile`, `npm run test:rental`, `npm run test:e2e`).
3. **Stop Background Servers:** Immediately terminate all background servers (`npm run start`, `npm run dev`) to release port 3000.
4. **Delete Test Artifacts:** Delete `test-results/` and `playwright-report/`.
5. **Purge Test Database Records:** Run `npm run test:clean` to purge all test orders and test users from Firestore.
