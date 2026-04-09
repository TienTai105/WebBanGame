/**
 * Password validation utility
 * Enforces strong password policy
 */

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter (automatic if mixed)
 * - At least 1 number
 * - At least 1 special character (@$!%*?&)
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = []

  // Check minimum length
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter')
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least 1 number')
  }

  // Check for special characters
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least 1 special character (@$!%*?&)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get user-friendly password requirement message
 */
export const getPasswordRequirements = (): string => {
  return `Password must contain:
- At least 8 characters
- 1 uppercase letter (A-Z)
- 1 number (0-9)
- 1 special character (@$!%*?&)`
}
