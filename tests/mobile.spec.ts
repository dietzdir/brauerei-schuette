import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  isMobile: true,
  hasTouch: true,
});

test.describe("Mobile Viewport Tests (iPhone 14 / 390x844)", () => {
  test("1. Homepage layout and no horizontal overflow", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Header checks
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("header h1")).toContainText("Brauerei Schütte");
    
    // Check no horizontal scrolling on body
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1);

    // Section title
    await expect(page.locator("text=Unser Sortiment")).toBeVisible();

    // Werksverkauf Announcement banner
    await expect(page.locator("text=Nächster Verkauf:").or(page.locator("text=Immer"))).toBeVisible();

    // Benefits: only "Einfache Vorbestellung" is visible on mobile
    await expect(page.locator("text=Flexible Gebinde")).not.toBeVisible();
    await expect(page.locator("text=Einfache Vorbestellung")).toBeVisible();
  });

  test("2. Product filtering and mobile variant selection", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for products
    await expect(page.locator("button", { hasText: "In den Warenkorb" }).first()).toBeVisible({ timeout: 15000 });

    // Test filter tabs on mobile
    await page.locator("button[role='tab']", { hasText: "Biere" }).click();
    await page.waitForTimeout(300);
    await page.locator("button[role='tab']", { hasText: "Brausen" }).click();
    await page.waitForTimeout(300);
    await page.locator("button[role='tab']", { hasText: "Alle" }).click();

    // Add first product to cart
    const addToCartBtn = page.locator("button", { hasText: "In den Warenkorb" }).first();
    await addToCartBtn.click();

    // Check cart counter in header
    const cartBadge = page.locator("header button").locator("span.bg-\\[\\#0f4851\\]");
    await expect(cartBadge).toBeVisible();
  });

  test("3. Mobile Cart Drawer and complete Guest Checkout", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Wait for products and add one to cart
    await expect(page.locator("button", { hasText: "In den Warenkorb" }).first()).toBeVisible({ timeout: 15000 });
    await page.locator("button", { hasText: "In den Warenkorb" }).first().click();

    // Open Cart Drawer
    const cartHeaderBtn = page.locator("header").locator("button:has(svg.lucide-shopping-cart)");
    await cartHeaderBtn.click();

    // Cart Sheet should be visible
    await expect(page.locator("[role='dialog']").locator("text=Warenkorb").first()).toBeVisible();
    await expect(page.locator("text=Gesamtbetrag (inkl. Pfand):")).toBeVisible();

    // Step 1: Proceed to checkout
    const proceedBtn = page.locator("button", { hasText: "Zur Reservierung" }).or(page.locator("button", { hasText: "Weiter" }));
    await proceedBtn.click();

    // Step 2: Choose Guest Checkout
    const guestChoiceBtn = page.locator("button", { hasText: "Als Gast reservieren" }).or(page.locator("button", { hasText: "Als Gast bestellen" }));
    if (await guestChoiceBtn.isVisible()) {
      await guestChoiceBtn.click();
    }

    // Step 3: Contact Form
    const nameInput = page.locator("#checkout-name");
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill("Mobile Testkunde");

    const emailInput = page.locator("#checkout-email");
    await emailInput.fill("mobile.test@example.com");

    const phoneInput = page.locator("#checkout-phone");
    await phoneInput.fill("0170 98765432");

    // Submit reservation
    const reserveBtn = page.locator("button", { hasText: "Unverbindlich reservieren" }).or(page.locator("button", { hasText: "Verbindlich reservieren" })).or(page.locator("button[type='submit']", { hasText: "reservieren" }));
    await reserveBtn.click();

    // Confirmation screen
    await expect(page.locator("text=Reservierung erfolgreich!").or(page.locator("text=Bestellung erfolgreich!"))).toBeVisible({ timeout: 20000 });
  });

  test("4. Legal pages and mobile navigation", async ({ page }) => {
    await page.goto("http://localhost:3000/impressum");
    await expect(page.locator("h1")).toContainText("Impressum");
    
    // Check no horizontal scroll on impressum
    const impressumScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const impressumClientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(impressumScrollWidth).toBeLessThanOrEqual(impressumClientWidth + 1);

    await page.goto("http://localhost:3000/datenschutz");
    await expect(page.locator("h1")).toContainText("Datenschutzerklärung");

    const dsScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const dsClientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(dsScrollWidth).toBeLessThanOrEqual(dsClientWidth + 1);
  });

  test("5. Auth Modal dialog on mobile viewport", async ({ page }) => {
    await page.goto("http://localhost:3000");
    // Wait for hydration and products to be fully loaded
    await expect(page.locator("button", { hasText: "In den Warenkorb" }).first()).toBeVisible({ timeout: 15000 });

    // Click Login/Konto button in header
    const authBtn = page.locator("header button[aria-label='Kundenkonto öffnen']");
    await authBtn.click();

    // Dialog should be open
    await expect(page.locator("[data-slot='dialog-content']")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("[data-slot='dialog-title']")).toContainText("Kundenkonto");

    // Close modal
    await page.keyboard.press("Escape");
  });

  test("6. Orders Drawer on mobile viewport", async ({ page }) => {
    await page.goto("http://localhost:3000");
    // Wait for hydration and products to be fully loaded
    await expect(page.locator("button", { hasText: "In den Warenkorb" }).first()).toBeVisible({ timeout: 15000 });

    // Click History button in header
    const historyBtn = page.locator("header button[aria-label='Bestellhistorie öffnen']");
    await historyBtn.click();

    // Orders drawer should be open
    await expect(page.locator("[data-slot='sheet-content']")).toBeVisible({ timeout: 10000 });

    // Close drawer
    await page.keyboard.press("Escape");
  });

  test("7. Admin Login on mobile viewport", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await expect(page.locator("h2")).toContainText("Admin Login");

    // Check no horizontal scroll on login page
    const loginScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const loginClientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(loginScrollWidth).toBeLessThanOrEqual(loginClientWidth + 1);
  });
});
