import { TestUser } from '../helpers/auth'

/**
 * Test data fixtures for security tests
 */
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'AdminPassword123!',
    role: 'ADMIN' as const,
    name: 'Admin User',
  },
  user: {
    email: 'user@test.com',
    password: 'UserPassword123!',
    role: 'USER' as const,
    name: 'Regular User',
  },
}

/**
 * Test file data for upload tests
 */
export const testFiles = {
  valid: {
    pdf: {
      name: 'test.pdf',
      content: Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF'),
      type: 'application/pdf',
    },
    png: {
      name: 'test.png',
      content: Buffer.from('\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR'),
      type: 'image/png',
    },
    jpg: {
      name: 'test.jpg',
      content: Buffer.from('\xFF\xD8\xFF\xE0'),
      type: 'image/jpeg',
    },
  },
  invalid: {
    exe: {
      name: 'malicious.exe',
      content: Buffer.from('MZ\x90\x00'),
      type: 'application/x-msdownload',
    },
    script: {
      name: 'script.js',
      content: Buffer.from('alert("XSS")'),
      type: 'application/javascript',
    },
    html: {
      name: 'malicious.html',
      content: Buffer.from('<script>alert("XSS")</script>'),
      type: 'text/html',
    },
    pathTraversal: {
      name: '../../../etc/passwd',
      content: Buffer.from('test'),
      type: 'text/plain',
    },
  },
  tooLarge: {
    name: 'large.pdf',
    content: Buffer.alloc(11 * 1024 * 1024), // 11MB
    type: 'application/pdf',
  },
}

/**
 * Test query parameters for validation tests
 */
export const testQueryParams = {
  valid: {
    uuid: 'clx1234567890abcdefghijklmn',
    status: 'NEW_LEAD',
    search: 'test query',
  },
  invalid: {
    invalidUuid: 'not-a-uuid',
    invalidStatus: 'INVALID_STATUS',
    tooLongSearch: 'a'.repeat(101),
    sqlInjection: "'; DROP TABLE users; --",
    xss: '<script>alert("XSS")</script>',
  },
}

