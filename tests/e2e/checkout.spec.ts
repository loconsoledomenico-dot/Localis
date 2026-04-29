import { test, expect } from '@playwright/test';

test.describe('Checkout flow', () => {
  // Requires real STRIPE_SECRET_KEY + populated stripe-prices.json. Skip until env is wired.
  test.fixme('clicking buy redirects to Stripe Checkout (host)', async ({ page }) => {
    await page.goto('/');
    const buyButton = page.getByRole('button', { name: /Acquista Bari Completa/i }).first();
    await buyButton.click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 });
    expect(page.url()).toContain('checkout.stripe.com');
  });

  test('thanks page handles missing session_id gracefully', async ({ page }) => {
    await page.goto('/thanks');
    await expect(page.getByRole('heading', { name: /tua guida ti aspetta/i })).toBeVisible();
  });

  test('access page with invalid token redirects to access-invalid', async ({ page }) => {
    await page.goto('/access/clearly-not-a-jwt');
    await expect(page).toHaveURL(/access-invalid/);
  });

  test('recover form submits and shows success', async ({ page }) => {
    await page.goto('/recover');
    await page.fill('input[name="email"]', 'test-noreal@example.com');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/Email inviata/)).toBeVisible({ timeout: 10_000 });
  });
});
