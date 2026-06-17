# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> sidebar has expected items
- Location: tests/smoke.spec.ts:8:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Proposals' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: 'Proposals' })

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('has title', async ({ page }) => {
  4  |   await page.goto('/');
  5  |   await expect(page).toHaveTitle(/LiquidGov Dashboard/);
  6  | });
  7  |
  8  | test('sidebar has expected items', async ({ page }) => {
  9  |   await page.goto('/');
> 10 |   await expect(page.getByRole('button', { name: 'Proposals' })).toBeVisible();
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  11 |   await expect(page.getByRole('button', { name: 'Committees' })).toBeVisible();
  12 |   await expect(page.getByRole('button', { name: 'My Identity' })).toBeVisible();
  13 |   await expect(page.getByRole('button', { name: 'Treasury' })).toBeVisible();
  14 |   await expect(page.getByRole('button', { name: 'System Governance' })).toBeVisible();
  15 | });
  16 |
  17 | test('can navigate to system governance', async ({ page }) => {
  18 |   await page.goto('/');
  19 |   await page.getByRole('button', { name: 'System Governance' }).click();
  20 |   await expect(page.getByText('Protocol Oversight')).toBeVisible();
  21 |   await expect(page.getByText('Operational Health')).toBeVisible();
  22 | });
  23 |
```