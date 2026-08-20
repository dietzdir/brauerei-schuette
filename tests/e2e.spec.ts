import { test, expect } from "@playwright/test";

test("complete brewery ordering flow with single bottle, quantity preset, account prioritization, mandatory guest fields, email notice and post-checkout upgrade", async ({
  page,
}) => {
  test.setTimeout(60000);

  // 1. Navigate to app
  await page.goto("http://localhost:3000");

  // 2. Expect Title & Header
  await expect(page.locator("h1")).toContainText("Handwerksbrauerei Schütte");
  await expect(page.locator("body")).toContainText("Unser Sortiment");

  // 3. Wait for products to load
  await expect(page.locator("text=Börde Pils")).toBeVisible({ timeout: 30000 });

  // 4. Locate Börde Pils card
  const boerdePilsCard = page.locator("[data-slot='card']", { hasText: "Börde Pils" });
  await expect(boerdePilsCard).toBeVisible();

  // 5. Select 0,75 Liter Flasche if dropdown is available
  const variantSelect = boerdePilsCard.locator("button[role='combobox']");
  if (await variantSelect.isVisible()) {
    await variantSelect.click();
    await page.locator("[role='option']", { hasText: "0,75 Liter Flasche" }).click();
  }

  // Click 6er Kasten preset button if visible
  const sixPackPreset = boerdePilsCard.locator("button", { hasText: "6er Kasten" });
  if (await sixPackPreset.isVisible()) {
    await sixPackPreset.click();
  }

  // Click add to cart (this automatically opens the cart drawer)
  const addButton = boerdePilsCard.locator("button", { hasText: "Warenkorb" }).last();
  await addButton.click();

  // 6. Verify cart drawer opened automatically from adding item
  await expect(page.locator("[role='dialog']").locator("text=Warenkorb").first()).toBeVisible({ timeout: 5000 });

  // 7. Verify deposit breakdown in cart
  await expect(page.locator("text=Zwischensumme Artikel:")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Pfand (Flaschen / Gebinde):")).toBeVisible();
  await expect(page.locator("text=Gesamtbetrag (inkl. Pfand):")).toBeVisible();

  // 8. Click "Zur Reservierung"
  const proceedButton = page.locator("button", { hasText: "Zur Reservierung" });
  await proceedButton.click();

  // 9. Verify Account Prioritization step
  await expect(page.locator("text=Mit Kundenkonto bestellen (Empfohlen)")).toBeVisible();
  await expect(page.locator("text=Als Gast fortfahren")).toBeVisible();

  // 10. Click "Als Gast reservieren"
  const guestButton = page.locator("button", { hasText: "Als Gast reservieren" }).or(page.locator("button", { hasText: "Als Gast bestellen" }));
  await guestButton.click();

  // 11. Fill in required guest contact details
  const nameInput = page.locator("#checkout-name");
  await expect(nameInput).toBeVisible({ timeout: 5000 });
  await nameInput.fill("Max Mustermann");

  const emailInput = page.locator("#checkout-email");
  await emailInput.fill("max.mustermann@beispiel.de");

  const phoneInput = page.locator("#checkout-phone");
  await phoneInput.fill("0170 12345678");

  // 12. Submit reservation
  const checkoutButton = page.locator("button", { hasText: "Unverbindlich reservieren" }).or(page.locator("button", { hasText: "Kostenpflichtig bestellen" }));
  await checkoutButton.click();

  // 13. Expect confirmation message, email notice, and order ID
  await expect(page.locator("text=Reservierung erfolgreich!").or(page.locator("text=Bestellung erfolgreich!"))).toBeVisible({ timeout: 30000 });
  await expect(page.locator("text=Bestätigungs-E-Mail gesendet")).toBeVisible();
  await expect(page.locator("text=max.mustermann@beispiel.de")).toBeVisible();
  await expect(page.locator("text=Bestellung in Kundenkonto sichern")).toBeVisible();

  // 14. Open order history drawer
  const historyButton = page.locator("button", { hasText: "Zur Bestellhistorie" });
  await historyButton.click();
  const ordersDrawer = page.locator("[data-slot='sheet-content'][data-open]");
  await expect(ordersDrawer).toBeVisible({ timeout: 10000 });
  await expect(ordersDrawer.locator("text=Ihre Reservierungen")).toBeVisible();
  await page.keyboard.press("Escape"); // Close history drawer
});
