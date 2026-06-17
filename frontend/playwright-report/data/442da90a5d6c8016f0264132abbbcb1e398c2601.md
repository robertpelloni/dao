# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> can navigate to system governance
- Location: tests/smoke.spec.ts:17:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'System Governance' })

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
  10 |   await expect(page.getByRole('button', { name: 'Proposals' })).toBeVisible();
  11 |   await expect(page.getByRole('button', { name: 'Committees' })).toBeVisible();
  12 |   await expect(page.getByRole('button', { name: 'My Identity' })).toBeVisible();
  13 |   await expect(page.getByRole('button', { name: 'Treasury' })).toBeVisible();
  14 |   await expect(page.getByRole('button', { name: 'System Governance' })).toBeVisible();
  15 | });
  16 |
  17 | test('can navigate to system governance', async ({ page }) => {
  18 |   await page.goto('/');
> 19 |   await page.getByRole('button', { name: 'System Governance' }).click();
     |                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  20 |   await expect(page.getByText('Protocol Oversight')).toBeVisible();
  21 |   await expect(page.getByText('Operational Health')).toBeVisible();
  22 | });
  23 |
```