import { test, expect } from '@playwright/test';

test('user can open login page', async ({ page }) => {

  await page.goto('http://localhost:4174/login');

  await expect(page).toHaveTitle(/Career Link Nepal/i);

});