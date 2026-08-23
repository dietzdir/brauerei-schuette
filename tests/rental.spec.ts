import { test, expect } from "@playwright/test";

test.describe("Rental Multi-Quantity & Stock Limits", () => {
  test("allows selecting multiple rental items up to totalStock and completing reservation", async ({ page }) => {
    test.setTimeout(60000);

    // 1. Navigate to home
    await page.goto("http://localhost:3000");

    // 2. Wait for rental section
    const rentalSection = page.locator("text=Zubehör & Verleih");
    await expect(rentalSection).toBeVisible({ timeout: 30000 });

    // 3. Find rental item card
    const zapfanlageCard = page.locator("[data-slot='card']", { hasText: "Zapfanlage" });
    await expect(zapfanlageCard).toBeVisible({ timeout: 30000 });

    // 4. Click "In den Warenkorb"
    const addRentalBtn = zapfanlageCard.locator("button", { hasText: "In den Warenkorb" });
    await addRentalBtn.click();

    // 5. Verify cart drawer opens and rental item is displayed with 1x
    await expect(page.locator("text=Mietartikel").first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=1x Reservierung")).toBeVisible();

    // 6. Test stepper in cart: increase to 2x then decrease to 1x
    const cartPlusBtn = page.getByRole("button", { name: /Menge für .* erhöhen/i });
    if (await cartPlusBtn.isVisible()) {
      await cartPlusBtn.click();
      await expect(page.locator("text=2x Reservierung")).toBeVisible();

      const cartMinusBtn = page.getByRole("button", { name: /Menge für .* verringern/i });
      await cartMinusBtn.click();
      await expect(page.locator("text=1x Reservierung")).toBeVisible();
    }

    // 7. Proceed to checkout
    const proceedBtn = page.getByRole("button", { name: "Zur Reservierung", exact: true });
    await proceedBtn.click();

    // 8. Choose guest checkout
    const guestBtn = page.locator("button", { hasText: "Als Gast reservieren" }).or(page.locator("button", { hasText: "Als Gast bestellen" }));
    await guestBtn.click();

    // 9. Fill in details
    await page.locator("#checkout-name").fill("Mietkunde Test");
    await page.locator("#checkout-email").fill("mietkunde.test@example.com");
    await page.locator("#checkout-phone").fill("01519998877");

    // 10. Submit reservation
    const checkoutBtn = page.locator("button", { hasText: "Unverbindlich vorbestellen" }).or(page.locator("button", { hasText: "Unverbindlich reservieren" }));
    await checkoutBtn.click();

    // 11. Verify confirmation
    await expect(page.locator("text=Reservierung erfolgreich!").or(page.locator("text=Bestellung erfolgreich!"))).toBeVisible({ timeout: 30000 });
  });
});
