import { extname, basename } from 'path'
import { randomBytes } from 'crypto'

/**
 * Allowed MIME types and their corresponding file extensions
 */
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
}

/**
 * Maximum file size: 10MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Maximum number of files per upload
 */
export const MAX_FILES_PER_UPLOAD = 5

/**
 * Sanitizes filename by removing path traversal attempts and special characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts - only keep basename
  const sanitized = basename(filename)
  
  // Remove special characters, keep only alphanumeric, dots, dashes, underscores, and spaces
  return sanitized.replace(/[^a-zA-Z0-9._\s-]/g, '_')
}

/**
 * Validates file type, size, and extension
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: 'Plik jest pusty' }
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `Plik jest zbyt duży. Maksymalny rozmiar: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
    }
  }
  
  // Get file extension
  const extension = extname(file.name).toLowerCase()
  
  // Validate MIME type
  const allowedExtensions = ALLOWED_MIME_TYPES[file.type as keyof typeof ALLOWED_MIME_TYPES]
  
  if (!allowedExtensions) {
    return { 
      valid: false, 
      error: `Nieobsługiwany typ pliku. Dozwolone typy: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}` 
    }
  }
  
  // Verify file extension matches MIME type
  // (MIME type can be spoofed, so we check extension too)
  if (!allowedExtensions.includes(extension)) {
    return { 
      valid: false, 
      error: `Rozszerzenie pliku (${extension}) nie pasuje do typu MIME (${file.type})` 
    }
  }
  
  return { valid: true }
}

/**
 * Generates a safe filename with timestamp and random suffix
 */
export function generateSafeFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename)
  const extension = extname(sanitized)
  const nameWithoutExt = basename(sanitized, extension)
  const randomSuffix = randomBytes(8).toString('hex')
  const timestamp = Date.now()
  
  // Limit name length to avoid filesystem issues
  const truncatedName = nameWithoutExt.substring(0, 50)
  
  return `${timestamp}-${randomSuffix}-${truncatedName}${extension}`
}

/**
 * Validates multiple files
 */
export function validateFiles(files: File[]): { valid: boolean; error?: string } {
  if (files.length === 0) {
    return { valid: true }
  }
  
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return { 
      valid: false, 
      error: `Można przesłać maksymalnie ${MAX_FILES_PER_UPLOAD} plików na raz` 
    }
  }
  
  // Validate each file
  for (const file of files) {
    const validation = validateFile(file)
    if (!validation.valid) {
      return validation
    }
  }
  
  return { valid: true }
}

