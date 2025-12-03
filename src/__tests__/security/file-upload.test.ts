import { describe, it, expect } from 'vitest'
import { validateFile, validateFiles, sanitizeFilename, generateSafeFilename, MAX_FILES_PER_UPLOAD } from '@/lib/file-upload'
import { createMockFile } from '../helpers/mocks'
import { testFiles } from '../fixtures/test-data'

describe('File Upload Security Tests', () => {
  describe('validateFile', () => {
    it('should accept valid PDF file', () => {
      const file = createMockFile(
        testFiles.valid.pdf.name,
        testFiles.valid.pdf.content,
        testFiles.valid.pdf.type
      )
      
      const result = validateFile(file)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept valid PNG file', () => {
      const file = createMockFile(
        testFiles.valid.png.name,
        testFiles.valid.png.content,
        testFiles.valid.png.type
      )
      
      const result = validateFile(file)
      expect(result.valid).toBe(true)
    })

    it('should accept valid JPG file', () => {
      const file = createMockFile(
        testFiles.valid.jpg.name,
        testFiles.valid.jpg.content,
        testFiles.valid.jpg.type
      )
      
      const result = validateFile(file)
      expect(result.valid).toBe(true)
    })

    it('should reject executable file (.exe)', () => {
      const file = createMockFile(
        testFiles.invalid.exe.name,
        testFiles.invalid.exe.content,
        testFiles.invalid.exe.type
      )
      
      const result = validateFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Nieobsługiwany typ pliku')
    })

    it('should reject JavaScript file', () => {
      const file = createMockFile(
        testFiles.invalid.script.name,
        testFiles.invalid.script.content,
        testFiles.invalid.script.type
      )
      
      const result = validateFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Nieobsługiwany typ pliku')
    })

    it('should reject HTML file', () => {
      const file = createMockFile(
        testFiles.invalid.html.name,
        testFiles.invalid.html.content,
        testFiles.invalid.html.type
      )
      
      const result = validateFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Nieobsługiwany typ pliku')
    })

    it('should reject file that is too large', () => {
      const largeFile = createMockFile(
        testFiles.tooLarge.name,
        testFiles.tooLarge.content,
        testFiles.tooLarge.type
      )
      
      const result = validateFile(largeFile)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('zbyt duży')
      expect(result.error).toContain('10MB')
    })

    it('should reject empty file', () => {
      const emptyFile = createMockFile('empty.pdf', Buffer.alloc(0), 'application/pdf')
      
      const result = validateFile(emptyFile)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('pusty')
    })

    it('should reject file with mismatched extension and MIME type', () => {
      // File claims to be PDF but has .exe extension
      const maliciousFile = createMockFile(
        'malicious.exe',
        Buffer.from('fake pdf content'),
        'application/pdf'
      )
      
      const result = validateFile(maliciousFile)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('nie pasuje do typu MIME')
    })
  })

  describe('validateFiles', () => {
    it('should accept valid files array', () => {
      const files = [
        createMockFile('test1.pdf', Buffer.from('pdf content'), 'application/pdf'),
        createMockFile('test2.png', Buffer.from('png content'), 'image/png'),
      ]
      
      const result = validateFiles(files)
      expect(result.valid).toBe(true)
    })

    it('should accept empty files array', () => {
      const result = validateFiles([])
      expect(result.valid).toBe(true)
    })

    it('should reject too many files', () => {
      const files = Array.from({ length: MAX_FILES_PER_UPLOAD + 1 }, (_, i) =>
        createMockFile(`test${i}.pdf`, Buffer.from('content'), 'application/pdf')
      )
      
      const result = validateFiles(files)
      expect(result.valid).toBe(false)
      expect(result.error).toContain(`maksymalnie ${MAX_FILES_PER_UPLOAD} plików`)
    })

    it('should reject array with invalid file', () => {
      const files = [
        createMockFile('test1.pdf', Buffer.from('content'), 'application/pdf'),
        createMockFile('malicious.exe', Buffer.from('content'), 'application/x-msdownload'),
      ]
      
      const result = validateFiles(files)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Nieobsługiwany typ pliku')
    })
  })

  describe('sanitizeFilename', () => {
    it('should remove path traversal attempts', () => {
      const malicious = '../../../etc/passwd'
      const sanitized = sanitizeFilename(malicious)
      
      expect(sanitized).not.toContain('../')
      expect(sanitized).toBe('passwd')
    })

    it('should remove special characters', () => {
      const filename = 'test<script>alert("xss")</script>.pdf'
      const sanitized = sanitizeFilename(filename)
      
      expect(sanitized).not.toContain('<')
      expect(sanitized).not.toContain('>')
      expect(sanitized).not.toContain('"')
    })

    it('should preserve valid characters', () => {
      const filename = 'test-file_123.pdf'
      const sanitized = sanitizeFilename(filename)
      
      expect(sanitized).toBe('test-file_123.pdf')
    })

    it('should handle Windows path separators', () => {
      const filename = 'C:\\Windows\\System32\\file.exe'
      const sanitized = sanitizeFilename(filename)
      
      expect(sanitized).not.toContain('\\')
      expect(sanitized).toBe('file.exe')
    })

    it('should handle Unix path separators', () => {
      const filename = '/home/user/file.txt'
      const sanitized = sanitizeFilename(filename)
      
      expect(sanitized).not.toContain('/')
      expect(sanitized).toBe('file.txt')
    })
  })

  describe('generateSafeFilename', () => {
    it('should generate unique filename with timestamp', () => {
      const original = 'test.pdf'
      const safe1 = generateSafeFilename(original)
      const safe2 = generateSafeFilename(original)
      
      expect(safe1).not.toBe(safe2)
      expect(safe1).toContain('.pdf')
      expect(safe1).toMatch(/^\d+-[a-f0-9]+-test\.pdf$/)
    })

    it('should sanitize malicious filename', () => {
      const malicious = '../../../etc/passwd'
      const safe = generateSafeFilename(malicious)
      
      expect(safe).not.toContain('../')
      expect(safe).toMatch(/^\d+-[a-f0-9]+-passwd$/)
    })

    it('should truncate very long filenames', () => {
      const longName = 'a'.repeat(200) + '.pdf'
      const safe = generateSafeFilename(longName)
      
      // Should be truncated but still valid
      expect(safe.length).toBeLessThan(300)
      expect(safe).toContain('.pdf')
    })

    it('should preserve file extension', () => {
      const files = [
        'test.pdf',
        'document.docx',
        'image.png',
        'spreadsheet.xlsx',
      ]
      
      files.forEach(filename => {
        const safe = generateSafeFilename(filename)
        const ext = filename.split('.').pop()
        expect(safe).toContain(`.${ext}`)
      })
    })
  })

  describe('File Upload Integration', () => {
    it('should handle multiple valid files correctly', () => {
      const files = [
        createMockFile('doc1.pdf', Buffer.from('content1'), 'application/pdf'),
        createMockFile('doc2.pdf', Buffer.from('content2'), 'application/pdf'),
        createMockFile('image.png', Buffer.from('content3'), 'image/png'),
      ]
      
      const result = validateFiles(files)
      expect(result.valid).toBe(true)
      
      // All files should be valid individually
      files.forEach(file => {
        expect(validateFile(file).valid).toBe(true)
      })
    })

    it('should reject mixed valid and invalid files', () => {
      const files = [
        createMockFile('doc1.pdf', Buffer.from('content'), 'application/pdf'),
        createMockFile('malicious.exe', Buffer.from('content'), 'application/x-msdownload'),
      ]
      
      const result = validateFiles(files)
      expect(result.valid).toBe(false)
    })
  })
})







