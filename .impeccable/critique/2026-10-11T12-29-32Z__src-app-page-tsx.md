---
target: src/app/page.tsx
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\KI-Programmierung\\brauerei-schuette\\src\\app\\page.tsx"
target_fingerprint: "sha256:ac316384f9fac1c3a807e9af284eb94d1e94a9da76cddb8f47a63175dc2f5023"
target_path: "C:\\KI-Programmierung\\brauerei-schuette\\src\\app\\page.tsx"
timestamp: 2026-10-11T12-29-32Z
slug: src-app-page-tsx
---
# Design Critique: Handwerksbrauerei Schütte Storefront & Ordering Experience

Target: `src/app/page.tsx`
Method: dual-agent (A: 8c0b9488-b311-441d-b52c-591aedb669ec · B: 5626f6f6-2aa5-4da6-bcc4-d8499c8c559c)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 3 | Cart count bump animation and inline confirmation are solid; checkout form validation errors appear only at top of modal. |
| 2 | Match Between System & Real World | 3 | Authentic German brewing and retail terminology ("Werksverkauf", "Pfand", "Kaution", "Zahlung vor Ort"). |
| 3 | User Control and Freedom | 3 | Back navigation and quantity adjustments are clear; lacks self-service order modification in history drawer. |
| 4 | Consistency and Standards | 2 | Zero-radius craft rule violated by rogue `rounded-xl` in `AuthModal.tsx`; button heights and selection tokens diverge. |
| 5 | Error Prevention | 3 | Calendar blocks invalid dates; stock limits prevent overbooking. Missing phone number formatting guardrails. |
| 6 | Recognition Rather Than Recall | 2 | Checkout steps 2 & 3 completely hide the itemized cart breakdown, forcing mental recall of selected items. |
| 7 | Flexibility and Efficiency | 3 | Quick crate presets (`6er Kasten`, `12er`, `24er`) are superb accelerators; lacks global search shortcut. |
| 8 | Aesthetic and Minimalist Design | 2 | Heavy card visual noise (14 micro-elements per card, nested borders) and out-of-place rotating neon conic glow. |
| 9 | Error Recovery | 3 | Plain-language German error messages that preserve user form inputs. |
| 10 | Help and Documentation | 3 | Transparent legal notices and pickup terms; lacks brief inline FAQ on parking, pickup procedures, and cash/card. |
| **Total** | | **27 / 40** | **Acceptable (67.5%)** — Strong craft foundation compromised by card clutter, checkout recall gaps, and contrast deficits. |

### Design Specificity Verdict

- **LLM Assessment**: The visual language adopts a deliberate, commendable **Modern Craft Industrial** direction (condensed uppercase `Anton` typography, deep `#0F4851` petrol grounding, zero-radius rectangular architecture). However, the experience currently resembles an **ERP wholesale inventory portal** rather than an artisan brewery in the Börde: there is zero sensory brewhouse storytelling, no malt/copper kettle imagery, and an abrupt drop directly into product cards.
- **Deterministic Scan**: The automated detector surfaced **1 advisory finding** (`bounce-easing` in `src/app/globals.css:264`), verified as a true positive in the cart badge bump animation. Further static code inspection revealed:
  1. A severe **WCAG 2.1 AA contrast failure** (2.89:1 vs 4.5:1 required) on primary action buttons using `#00A8BC` with white text (`ProductCard.tsx:318`, `Header.tsx:101`).
  2. An out-of-place **sci-fi neon conic-gradient glow** (`rotating-glow-wrapper`) in `CartDrawer.tsx` that causes layout shifts (`CLS`).
  3. Over 50 hardcoded arbitrary hex utilities bypassing Tailwind theme tokens and dark mode.
- **Visual Overlays**: Headless subagent runtime without interactive graphical display; deterministic AST/CSS scan executed as evidence.

### Overall Impression
The app gets the hardest parts right: legal compliance, crate ordering mechanics, and frictionless guest-to-account conversion are world-class. But visually, it swings between an austere wholesale inventory table and flashy gamer-style animations, lacking the warmth, aroma, and human craftsmanship of a local brewery.

### What's Working
1. **Flawless Click & Reserve Legal & Trust Architecture**: Basic price per liter (PAngV), itemized bottle/crate deposit, and JuSchG age verification are communicated without deceit.
2. **Frictionless Post-Checkout Account Upgrade**: Ordering requires no upfront account; guests can secure their history with a 1-field password form on the success screen.
3. **Ergonomic Regional Crate Presets**: `6er Kasten`, `12er`, and `24er` buttons on 0.75l bottles match regional buying habits.

### Priority Issues

#### [P1] Severe Color Contrast Failure on Primary Action Buttons (WCAG AA Deficit)
- **What**: The primary cart buttons in `ProductCard.tsx` and `Header.tsx` use `bg-[#00a8bc] text-white`. The contrast ratio is **2.89:1**, far below the WCAG 2.1 AA minimum of 4.5:1.
- **Why it matters**: Crucial CTA buttons and micro-badges are washed out and difficult to read, especially in bright sunlight or for users with low vision.
- **Fix**: Rebalance the primary CTA button color to the deep brand petrol (`#0F4851` text-white provides 9.4:1 contrast) or darken the teal to at least `#007584` (4.6:1).
- **Suggested command**: `$impeccable colorize` or `$impeccable audit`.

#### [P1] ProductCard Cognitive Overload & "Border Fatigue"
- **What**: Every 320px card displays 14 competing micro-elements: image, multiple badges, title, flavor profile, description, color, base price, single price, dropdown, stepper, 3 preset buttons, deposit, and full allergen text.
- **Why it matters**: Visual noise creates choice paralysis and overwhelms users.
- **Fix**: Relocate mandatory LMIV allergen text into an expandable trigger or slide-over drawer; simplify card borders to let bottle imagery breathe.
- **Suggested command**: `$impeccable distill` or `$impeccable layout`.

#### [P1] Brewhouse Soul & Sensory Storytelling Deficit
- **What**: The storefront jumps immediately from a status card into the product grid with zero imagery or narrative about the Rottmersleben brewery, copper kettles, or the brewer's craft.
- **Why it matters**: Customers pay a premium for craft beer because of heritage and passion. Without storytelling, the site feels like a generic beverage depot.
- **Fix**: Add a rich, compact Hero & Brewhouse section celebrating the local Börde terroir and Friday pickup tradition.
- **Suggested command**: `$impeccable bolder` or `$impeccable delight`.

#### [P2] Missing Cart Breakdown in Checkout Steps (Memory Bridge Violation)
- **What**: In `CartDrawer.tsx`, advancing to guest contact details completely hides the list of selected bottles and quantities, showing only a generic total sum.
- **Why it matters**: Causes checkout anxiety; customers cannot verify what they are reserving before clicking submit.
- **Fix**: Add a compact, sticky or collapsible order summary card at the top of Checkout Step 3.
- **Suggested command**: `$impeccable clarify` or `$impeccable layout`.

#### [P2] Animation Anti-Patterns: Elastic Bounce & Neon Conic Glow
- **What**: `globals.css` uses an elastic bounce curve (`cubic-bezier(0.34, 1.56, 0.64, 1)`) on cart count bumps and a rotating electric cyan/amber conic gradient (`rotating-glow-wrapper`) on cart items that causes 8px vertical layout shifts.
- **Why it matters**: Tacky animations undermine the artisanal, grounded identity and induce visual instability.
- **Fix**: Replace bounce with exponential easing (`ease-out-expo`) and replace neon glow with a warm amber highlight badge without margin shifts.
- **Suggested command**: `$impeccable polish`.

### Persona Red Flags
- **Alex (Power User)**: Step 2 interstitial slows down frequent re-orders; no 1-click "Wiederholen" (repeat past order) button.
- **Jordan (First-Timer)**: No pickup guidance (parking, pickup gate, cash vs card at the brewery counter); container terminology ("0.75l Flasche") creates confusion about whether a crate is included.
- **Sam (Accessibility-Dependent)**: Quantity input flanked by 5 adjacent button stops creates exhausting tab navigation; form validation errors do not autofocus invalid inputs.

### Minor Observations
- **Asymmetric Mobile Benefits Bar**: `BenefitsBar.tsx` hides 2 of 3 cards on mobile, leaving an awkward lone box.
- **Logo Raster Artifacts**: Header uses a JPEG with a rectangular bounding box instead of a transparent vector emblem.
- **Token Inconsistency**: Rogue `rounded-xl` in `AuthModal.tsx` breaks the zero-radius design language.

### Questions to Consider
1. What if the homepage opened with the atmosphere and aroma of the Rottmersleben brewhouse before showing product cards?
2. Does every beer card need to display legal allergen text permanently, or could that be progressively disclosed?
3. Could returning customers have a 1-Click re-order option directly from their order history?
