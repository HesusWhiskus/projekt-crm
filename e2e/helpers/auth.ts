import { Page } from '@playwright/test'

/**
 * Helper to login a user in Playwright tests
 */
export async function loginUser(
  page: Page,
  email: string = 'test@example.com',
  password: string = 'TestPassword123!'
): Promise<void> {
  await page.goto('/signin')
  
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  
  // Wait for navigation after login
  await page.waitForURL(/\/dashboard|\/clients/, { timeout: 10000 })
}

/**
 * Helper to logout user
 */
export async function logoutUser(page: Page): Promise<void> {
  // Click logout button (adjust selector based on your UI)
  await page.click('button:has-text("Wyloguj")')
  
  // Wait for redirect to signin page
  await page.waitForURL(/\/signin/, { timeout: 5000 })
}

/**
 * Helper to check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check if we're on a protected page or if auth cookie exists
  const cookies = await page.context().cookies()
  return cookies.some(cookie => cookie.name.includes('next-auth') || cookie.name.includes('session'))
}









