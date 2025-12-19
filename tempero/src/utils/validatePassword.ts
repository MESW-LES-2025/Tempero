/**
 * Validates a password against the application's security requirements.
 * 
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number or symbol
 * 
 * @param password - The password to validate
 * @returns An error message string if invalid, or null if valid
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (password.toLowerCase() === password) {
    return "Password must contain at least one uppercase letter.";
  }

  if (password.toUpperCase() === password) {
    return "Password must contain at least one lowercase letter.";
  }

  const hasNumberOrSymbolAndLetters = /[\d\W_]/.test(password) && /[a-zA-Z]/.test(password);
  if (!hasNumberOrSymbolAndLetters) {
    return "Password must contain at least one number or symbol.";
  }

  return null;
}
