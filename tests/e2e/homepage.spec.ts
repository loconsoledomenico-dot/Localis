import { test, expect } from '@playwright/test';

test.describe('Italian homepage', () => {
  test('header renders logo and language switcher', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Localis', exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'it');
    const langSwitch = page.getByRole('link', { name: /switch language/i });
    await expect(langSwitch).toBeVisible();
    await expect(langSwitch).toHaveText('EN');
  });

  test('renders hero with correct copy', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ascolta Bari');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('come una storia');
    await expect(page.getByText('Mentre sei lì.')).toBeVisible();
  });

  test('renders 5 guide cards', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('a').filter({ hasText: /Bari|Porto|San Nicola|Meglio|Teatri/ });
    expect(await cards.count()).toBeGreaterThanOrEqual(5);
  });

  test('renders pricing section with two cards', async ({ page }) => {
    await page.goto('/#prezzi');
    await expect(page.getByRole('heading', { name: 'Guida singola' })).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Bari completa' })).toBeAttached();
  });

  test('checkout button calls /api/checkout', async ({ page }) => {
    await page.goto('/#prezzi');

    // Intercept the API call (we don't want to actually hit Stripe in tests)
    let apiCalled = false;
    await page.route('**/api/checkout', async (route) => {
      apiCalled = true;
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Stripe price ID not configured for product "bari-vecchia"' }),
      });
    });

    // Capture the alert (shown when API errors out)
    let alertMsg = '';
    page.on('dialog', async (dialog) => {
      alertMsg = dialog.message();
      await dialog.dismiss();
    });

    await page.getByRole('button', { name: /Ascolta tutto/i }).first().click({ force: true });

    // Wait for the request and the resulting alert
    await expect.poll(() => apiCalled).toBe(true);
    await expect.poll(() => alertMsg).toContain('Impossibile');
  });

  test('language switcher navigates to English', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /switch language/i }).click();
    await expect(page).toHaveURL(/\/en\//);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Listen to Bari');
  });

  test('skip-to-content link appears on Tab focus', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /skip to main content|salta al contenuto/i });
    await expect(skipLink).toBeFocused();
  });

  test('footer renders copyright and links', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/© Localis/)).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Termini' })).toBeVisible();
  });
});

test.describe('English homepage', () => {
  test('renders English hero copy', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.getByText("While you're there.")).toBeVisible();
  });
});
