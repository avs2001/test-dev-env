/**
 * Counter for generating unique IDs within a session
 */
let idCounter = 0;

/**
 * Generate a unique ID with an optional prefix
 * @param prefix - Optional prefix for the ID (default: 'ngx-chat')
 * @returns Unique string ID
 */
export function generateId(prefix = 'ngx-chat'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const counter = (idCounter++).toString(36);
  return `${prefix}-${timestamp}-${random}-${counter}`;
}

/**
 * Generate a short unique ID (8 characters)
 * @returns Short unique string ID
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Check if a string is a valid ngx-chat ID
 * @param id - The ID to validate
 * @param prefix - Expected prefix (default: 'ngx-chat')
 * @returns Whether the ID is valid
 */
export function isValidId(id: string, prefix = 'ngx-chat'): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  const pattern = new RegExp(`^${prefix}-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$`);
  return pattern.test(id);
}

/**
 * Reset the ID counter (useful for testing)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}
