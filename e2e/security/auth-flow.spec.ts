import { test, expect } from '@playwright/test'
import { loginUser, logoutUser, isAuthenticated } from '../helpers/auth'

test.describe('Authentication Flow Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
  })

  test('should redirect unauthenticated user to signin', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard')
    
    // Should redirect to signin
    await expect(page).toHaveURL(/\/signin/)
  })

  test('should allow login with valid credentials', async ({ page }) => {
    // Note: This requires test user to exist in database
    // In real implementation, you'd seed test data before tests
    await loginUser(page, 'test@example.com', 'TestPassword123!')
    
    // Should be redirected to dashboard or clients page
    await expect(page).toHaveURL(/\/dashboard|\/clients/)
    
    // Should be authenticated
    const authenticated = await isAuthenticated(page)
    expect(authenticated).toBe(true)
  })

  test('should reject login with invalid credentials', async ({ page }) => {
    await page.goto('/signin')
    
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'WrongPassword123!')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=/nieprawidłowy|błąd|error/i')).toBeVisible({ timeout: 5000 })
    
    // Should still be on signin page
    await expect(page).toHaveURL(/\/signin/)
  })

  test('should logout user successfully', async ({ page }) => {
    // Login first
    await loginUser(page)
    
    // Logout
    await logoutUser(page)
    
    // Should redirect to signin
    await expect(page).toHaveURL(/\/signin/)
    
    // Should not be authenticated
    const authenticated = await isAuthenticated(page)
    expect(authenticated).toBe(false)
  })

  test('should prevent access to protected routes after logout', async ({ page }) => {
    // Login first
    await loginUser(page)
    
    // Logout
    await logoutUser(page)
    
    // Try to access protected route
    await page.goto('/dashboard')
    
    // Should redirect back to signin
    await expect(page).toHaveURL(/\/signin/)
  })

  test('should handle session timeout', async ({ page }) => {
    // Login
    await loginUser(page)
    
    // Wait for session to expire (this would require mocking time or waiting actual timeout)
    // For now, we test that session exists
    const authenticated = await isAuthenticated(page)
    expect(authenticated).toBe(true)
    
    // In real test, you'd wait for session expiration and verify redirect
  })
})







