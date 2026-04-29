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

  test('checkout button shows phase-0 stub', async ({ page }) => {
    await page.goto('/#prezzi');
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('disponibile a breve');
      await dialog.dismiss();
    });
    await page.getByRole('button', { name: /Ascolta tutto/i }).first().click({ force: true });
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
