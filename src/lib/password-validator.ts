/**
 * Validates password strength
 * Requires: minimum 8 characters, uppercase, lowercase, numbers
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Hasło musi mieć co najmniej 8 znaków' }
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Hasło jest zbyt długie (max 128 znaków)' }
  }
  
  // Check complexity
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\[\]\\\/\-_+=~`]/.test(password)
  
  if (!hasUpperCase) {
    return { 
      valid: false, 
      error: 'Hasło musi zawierać co najmniej jedną wielką literę' 
    }
  }
  
  if (!hasLowerCase) {
    return { 
      valid: false, 
      error: 'Hasło musi zawierać co najmniej jedną małą literę' 
    }
  }
  
  if (!hasNumbers) {
    return { 
      valid: false, 
      error: 'Hasło musi zawierać co najmniej jedną cyfrę' 
    }
  }
  
  // Optional: check for common weak passwords
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'admin',
    'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
  ]
  
  const lowerPassword = password.toLowerCase()
  if (commonPasswords.some(common => lowerPassword.includes(common))) {
    return { 
      valid: false, 
      error: 'Hasło jest zbyt słabe. Użyj bardziej złożonego hasła.' 
    }
  }
  
  return { valid: true }
}

