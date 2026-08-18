---
trigger: always_on
---

## Project Rules

### Stack
- Next.js (App Router), TypeScript — latest stable via `create-next-app@latest`
- Tailwind CSS v4 — CSS-first config via `@theme` in `app/globals.css`. Do **not** create a `tailwind.config.js`/`.ts`.
- shadcn/ui — init with `npx shadcn@latest init` (the package is `shadcn`; the old `shadcn-ui` package name is deprecated — don't follow tutorials that use it)
- Firebase
- Modern typefaces, no serifs

### Architecture principles

1. **Checkout does not write to Firestore directly from the client.** Implement it as a Next.js Server Action running with the Firebase Admin SDK. The action re-reads the current price for each selected variant from `products` server-side and only then writes the `orders` document — the client never determines the price that ends up in the order.
2. **`/admin` is protected by a verified session cookie, not a client-side check alone.** Flow: client signs in → gets an ID token → POSTs it to a Route Handler → Route Handler uses the Firebase Admin SDK to mint an HttpOnly session cookie → `middleware.ts` verifies that cookie on every request to `/admin/*`, redirecting to `/login` if missing/invalid. A bare `onAuthStateChanged` + client-side redirect is not sufficient on its own — the page briefly renders before the redirect fires.
3. **Every visitor is authenticated, even guests.** Sign in anonymously (`signInAnonymously`) on first load if there's no session yet, so every order always has a real `userId` — there is no separate "guest" data path. When someone chooses to create an account, upgrade the same session with `linkWithCredential` (email/password) so the UID — and their order/cart history — carries over instead of starting fresh.
4. **Container/variant identifiers are a shared, fixed set, not free text per product.** See `ContainerType` below. The Aggregation View (Mission 4) depends on these being spelled identically across every product.
5. **Admin access is granted via a Firebase custom claim (`admin: true`), set through the Admin SDK** — e.g. a one-off local script, not something the client can set on itself. A UI for managing admins is out of scope for now.
6. **Firebase Admin SDK & Next.js 15 ESM Compatibility:** When using `firebase-admin` in Next.js App Router, ensure `jose` is strictly pinned to `4.x` (e.g., `"jose": "4.15.9"`) via npm `"overrides"` in `package.json`. Otherwise, `jwks-rsa` will crash with `ERR_REQUIRE_ESM` on Vercel due to loading an ESM version of `jose` via `require()`. Also, ensure `["firebase-admin", "jwks-rsa", "jose"]` are added to `serverExternalPackages` in `next.config.ts`.

### Data model (TypeScript)

```typescript
type ContainerType =
  | "0.75l bottle (6-crate)"
  | "5l keg"
  | "10l keg"
  | "30l keg"
  | "50l keg";

interface ProductVariant {
  type: ContainerType;
  price: number;        // EUR cents (integer) — avoids float rounding issues
  sku?: string;
}

interface Product {
  id: string;
  name: string;                     // "Börde Pils", "Wakatu Lager", ...
  category: "Beer" | "Lemonade";    // Lemonade: only "0.75l bottle (6-crate)" as variant
  variants: ProductVariant[];
}

interface UserProfile {
  uid: string;
  customerType: "business" | "private";
  companyName?: string;             // set if customerType === "business"
  displayName?: string;
  isAnonymous: boolean;
  createdAt: Timestamp;
}

interface OrderItem {
  productId: string;
  productName: string;              // snapshot, avoids a join for display
  variantType: ContainerType;
  quantity: number;
  unitPrice: number;                // snapshot, validated server-side at creation
}

interface Order {
  id: string;
  userId: string;                   // anonymous or permanent Firebase UID
  customerName: string;
  customerType: "business" | "private";  // denormalized from UserProfile at order time
  status: "pending" | "ready" | "completed";
  createdAt: Timestamp;
  items: OrderItem[];
}
```

`customerType` is scaffolding, not finished business logic — no different pricing, discounts, or minimum-order rules are attached to it yet. Don't invent pricing-tier logic beyond what's specified here; that's a deliberate follow-up decision, not something to infer.

### Firestore Security Rules (starting point — adapt, don't skip)

```
service cloud.firestore {
  match /databases/{database}/documents {

    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    match /users/{userId} {
      allow read, create: if request.auth != null && request.auth.uid == userId;
      allow update, delete: if request.auth != null && request.auth.uid == userId;
      // customerType is self-editable in v1 since no pricing hangs off it yet —
      // revisit (e.g. restrict to admin) if/when business pricing is added.
    }

    match /orders/{orderId} {
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid || 
         (request.auth.token.email != null && resource.data.customerEmail == request.auth.token.email) || 
         request.auth.token.admin == true);
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && request.auth.token.admin == true; // status transitions only
      allow delete: if false;
    }
  }
}
```

### UI & Component Conventions (Base UI)

1. **Base UI Primitives (`@base-ui/react`)**:
   - **No `asChild`**: Base UI triggers (e.g. `PopoverTrigger`, `AlertDialogTrigger`, `SheetTrigger`, `DialogTrigger`) already render semantic `<button>` elements. Do NOT use `asChild` with a nested `<Button>`. Instead, style the trigger directly or use the `render={<Component ... />}` prop to prevent nested `<button>` hydration errors.
   - **Select Component Labels**: When using `@base-ui/react/select`, pass explicit `label` attributes to `<SelectItem>` or provide localized text children to `<SelectValue>` if options contain icons/complex JSX to prevent falling back to raw technical value strings.
   - **Pickup Datepicker**: Use a calendar Popover where unavailable dates are strictly disabled, and the exact time range (and optional note) for the selected slot is displayed underneath.

2. **Dynamic Shop Banners**:
   - Keep user-facing notices automatically synchronized with database records. Derive opening hour banners dynamically from scheduled `OpeningHourException` objects (filtered to relevant upcoming windows, e.g. next 14 days) with time ranges and reasons, avoiding redundant manual text fields.

3. **Form State & Currency Inputs**:
   - **No Unsolicited Auto-Prefill**: Never automatically overwrite or prefill dependent fields (e.g. deposit, price, or category) upon selection/addition unless explicitly specified. All inputs must remain neutral and directly editable.
   - **Decoupled Decimal Inputs**: Keep float/decimal inputs (e.g. EUR currency inputs) decoupled from integer Cent state while focused (via `isFocused` refs) to ensure intermediate keystrokes (such as `"0,"` or `""`) are never overwritten during typing.

4. **Product Cards & Grid Alignment**:
   - **No `justify-between` on Card Outer Container**: Avoid `flex-col justify-between` on outer product cards in multi-item grids, as varying text lengths will distribute vertical gaps asymmetrically.
   - **Fixed Alignment & Pinned Headers**: Fix top elements (Image with `aspect-16/9 object-cover`, `CardHeader` with `min-h-[4.5rem]`, Description block with `min-h-[5.5rem]`) with `shrink-0` and pin the footer cleanly to the bottom (`mt-auto` / `flex-1 flex flex-col justify-between`).
   - **AI-Generated Image Watermarking**: Support optional `isAiGenerated?: boolean` on `Product`. When active, render a semi-transparent watermark badge (`✨ KI-Symbolbild`) in the bottom-right corner of the image.
   - **Category-Specific Presets & Icons**:
     - Crate quick presets (`6er Kasten`, `12er`, `24er`) are strictly reserved for 0.75l beer bottles. 0.33l bottles and kegs render only the quantity stepper.
     - Use `GlassWater` as the category icon for soft drinks / Brausen (`Lemonade`).

### Verification

After each mission, confirm `next build` succeeds, then use Antigravity's browser subagent to click through the flow you just built before marking the mission done (concrete checks are listed per mission below).