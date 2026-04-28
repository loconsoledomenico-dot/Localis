import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders Italian page with logo and language switcher', async ({ page }) => {
    await page.goto('/');

    // Header logo present
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Localis', exact: true })).toBeVisible();

    // Italian content
    await expect(page.locator('html')).toHaveAttribute('lang', 'it');

    // Language switcher to English
    const langSwitch = page.getByRole('link', { name: /switch language/i });
    await expect(langSwitch).toBeVisible();
    await expect(langSwitch).toHaveText('EN');
  });

  test('switches to English page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /switch language/i }).click();
    await expect(page).toHaveURL(/\/en\//);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
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
