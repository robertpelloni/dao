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
    await expect(page.getByRole('button', { name: 'Health Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Autonomous Tasks' })).toBeVisible();
});
test('can navigate to autonomous tasks', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Autonomous Tasks').click();
    await expect(page.getByText('Autonomous Protocol Tasks')).toBeVisible();
});
//# sourceMappingURL=smoke.spec.js.map