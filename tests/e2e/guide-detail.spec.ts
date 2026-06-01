import { test, expect } from '@playwright/test';

test.describe('Guide detail page', () => {
  test('Bari Vecchia detail renders title, trailer, chapters, sidebar', async ({ page }) => {
    await page.goto('/guide/bari-vecchia');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bari Vecchia');
    await expect(page.locator('audio').first()).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Capitoli' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Guida singola' })).toBeVisible();
  });

  test('Bari Vecchia detail renders the SEO editorial block under the preview', async ({ page }) => {
    await page.goto('/guide/bari-vecchia');
    await expect(
      page.getByRole('heading', {
        name: 'Capire Bari Vecchia: L’itinerario audio oltre le trappole turistiche',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Vedere Bari Vecchia è facile. Capirla è un’altra cosa.',
      }),
    ).toBeVisible();
    await expect(
      page.getByText('Audioguide nate dalla ricerca e raccontate da chi ci è nato'),
    ).toBeVisible();
  });

  test('English version renders correctly', async ({ page }) => {
    await page.goto('/en/guide/bari-vecchia');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Old Bari');
    await expect(page.getByRole('heading', { name: 'Chapters' })).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Understand Old Bari: the audio route beyond tourist traps',
      }),
    ).toBeVisible();
  });

  test('German version renders the localized SEO editorial block', async ({ page }) => {
    await page.goto('/de/guide/bari-vecchia');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bari Vecchia');
    await expect(page.getByRole('heading', { name: 'Kapitel' })).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Bari Vecchia verstehen: die Audio-Route jenseits der Touristenfallen',
      }),
    ).toBeVisible();
  });

  test('soon-status guide is not directly accessible', async ({ page }) => {
    const response = await page.goto('/guide/tre-teatri', { waitUntil: 'commit' });
    expect(response?.status()).toBe(404);
  });
});

test.describe('Legal and error pages', () => {
  test('404 page renders for unknown route', async ({ page }) => {
    const response = await page.goto('/this-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByText('404')).toBeVisible();
  });

  test('terms page renders', async ({ page }) => {
    await page.goto('/termini');
    await expect(page.getByRole('heading', { name: 'Termini di servizio' })).toBeVisible();
  });

  test('privacy page renders', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Informativa privacy' })).toBeVisible();
  });

  test('about page renders both languages', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: /progetto pugliese/i })).toBeVisible();
    await page.goto('/en/about');
    await expect(page.getByRole('heading', { name: /Puglia-born/i })).toBeVisible();
  });
});
