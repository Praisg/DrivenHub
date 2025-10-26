/**
 * Email validation and storage utilities
 */
export interface EmailCapture {
  email: string;
  timestamp: string;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get stored emails from localStorage (for demo purposes)
 */
export function getStoredEmails(): EmailCapture[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('lab-member-emails');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Store email to localStorage (for demo purposes)
 */
export function storeEmail(email: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const emails = getStoredEmails();
    
    // Check for duplicates
    if (emails.some(e => e.email.toLowerCase() === email.toLowerCase())) {
      return false;
    }
    
    const newEmail: EmailCapture = {
      email: email.toLowerCase().trim(),
      timestamp: new Date().toISOString(),
    };
    
    emails.push(newEmail);
    localStorage.setItem('lab-member-emails', JSON.stringify(emails));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get email count for display
 */
export function getEmailCount(): number {
  return getStoredEmails().length;
}
