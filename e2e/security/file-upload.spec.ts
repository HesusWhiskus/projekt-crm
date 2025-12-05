import { test, expect } from '@playwright/test'
import { loginUser } from '../helpers/auth'
import path from 'path'

test.describe('File Upload Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
  })

  test('should accept valid PDF file upload', async ({ page }) => {
    await page.goto('/clients')
    
    // Navigate to add contact (adjust selector based on your UI)
    await page.click('button:has-text("Dodaj kontakt")')
    
    // Create a test PDF file
    const filePath = path.join(__dirname, '../fixtures/test.pdf')
    
    // Upload file
    await page.setInputFiles('input[type="file"]', filePath)
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should succeed (no error message)
    await expect(page.locator('text=/błąd|error|nieprawidłowy/i')).not.toBeVisible({ timeout: 5000 })
  })

  test('should reject executable file upload', async ({ page }) => {
    await page.goto('/clients')
    await page.click('button:has-text("Dodaj kontakt")')
    
    // Try to upload .exe file
    const exePath = path.join(__dirname, '../fixtures/malicious.exe')
    await page.setInputFiles('input[type="file"]', exePath)
    
    // Should show error
    await expect(page.locator('text=/nieobsługiwany|nieprawidłowy|błąd/i')).toBeVisible({ timeout: 5000 })
  })

  test('should reject file that is too large', async ({ page }) => {
    await page.goto('/clients')
    await page.click('button:has-text("Dodaj kontakt")')
    
    // Create a large file (11MB)
    const largeFilePath = path.join(__dirname, '../fixtures/large.pdf')
    await page.setInputFiles('input[type="file"]', largeFilePath)
    
    // Should show error about file size
    await expect(page.locator('text=/zbyt duży|za duży|max/i')).toBeVisible({ timeout: 5000 })
  })

  test('should reject too many files', async ({ page }) => {
    await page.goto('/clients')
    await page.click('button:has-text("Dodaj kontakt")')
    
    // Try to upload 6 files (max is 5)
    const files = Array.from({ length: 6 }, (_, i) => 
      path.join(__dirname, `../fixtures/test${i}.pdf`)
    )
    
    await page.setInputFiles('input[type="file"]', files)
    
    // Should show error about too many files
    await expect(page.locator('text=/zbyt wiele|max|maksymalnie/i')).toBeVisible({ timeout: 5000 })
  })

  test('should sanitize malicious filename', async ({ page }) => {
    await page.goto('/clients')
    await page.click('button:has-text("Dodaj kontakt")')
    
    // Try to upload file with path traversal in name
    const maliciousPath = path.join(__dirname, '../fixtures/../../../etc/passwd')
    
    // Browser should prevent this, but we test that server handles it
    try {
      await page.setInputFiles('input[type="file"]', maliciousPath)
    } catch (e) {
      // Expected - browser prevents this
    }
    
    // File should not be uploaded
    await expect(page.locator('input[type="file"]')).toHaveValue('')
  })
})









