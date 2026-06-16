import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/LiquidGov Dashboard/);
});

test('sidebar has expected items', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Proposals' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Committees' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'My Identity' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Treasury' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'System Governance' })).toBeVisible();
});

test('can navigate to system governance', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'System Governance' }).click();
  await expect(page.getByText('Protocol Oversight')).toBeVisible();
  await expect(page.getByText('Operational Health')).toBeVisible();
});
