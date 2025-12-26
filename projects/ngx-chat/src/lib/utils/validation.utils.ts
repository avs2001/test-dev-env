import type { ChatValidationConfig } from '../models/config.model';
import { DEFAULT_VALIDATION_CONFIG } from '../models/config.model';

/** Result of message validation */
export interface ValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly sanitized?: string;
}

/** Characters considered invisible that should be stripped */
const INVISIBLE_CHARS_REGEX = /[\u200B-\u200D\u2060\uFEFF\u180E]/g;

/** Control characters (except newline/tab) */
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Validate a message content
 * @param content - Message content to validate
 * @param config - Validation configuration (optional)
 * @returns Validation result
 */
export function validateMessage(
  content: string,
  config: Partial<ChatValidationConfig> = {}
): ValidationResult {
  const mergedConfig = { ...DEFAULT_VALIDATION_CONFIG, ...config };

  // Apply sanitization if enabled
  let sanitized = content;

  if (mergedConfig.trimWhitespace) {
    sanitized = sanitized.trim();
  }

  if (mergedConfig.stripInvisibleChars) {
    sanitized = sanitized.replace(INVISIBLE_CHARS_REGEX, '');
    sanitized = sanitized.replace(CONTROL_CHARS_REGEX, '');
  }

  if (mergedConfig.normalizeUnicode) {
    sanitized = sanitized.normalize('NFC');
  }

  // Check minimum length
  if (!mergedConfig.allowEmptyContent && sanitized.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (sanitized.length < mergedConfig.minMessageLength) {
    return {
      valid: false,
      error: `Message must be at least ${mergedConfig.minMessageLength} characters`,
    };
  }

  // Check maximum length
  if (sanitized.length > mergedConfig.maxMessageLength) {
    return {
      valid: false,
      error: `Message cannot exceed ${mergedConfig.maxMessageLength} characters`,
    };
  }

  // Check word length
  if (mergedConfig.maxWordLength > 0) {
    const words = sanitized.split(/\s+/);
    const longWord = words.find((word) => word.length > mergedConfig.maxWordLength);
    if (longWord) {
      return {
        valid: false,
        error: `Words cannot exceed ${mergedConfig.maxWordLength} characters`,
      };
    }
  }

  // Check forbidden patterns
  for (const pattern of mergedConfig.forbiddenPatterns) {
    if (pattern.test(sanitized)) {
      return { valid: false, error: 'Message contains forbidden content' };
    }
  }

  return { valid: true, sanitized };
}

/**
 * Sanitize message content without validating
 * @param content - Content to sanitize
 * @param config - Validation configuration (optional)
 * @returns Sanitized content
 */
export function sanitizeContent(
  content: string,
  config: Partial<ChatValidationConfig> = {}
): string {
  const mergedConfig = { ...DEFAULT_VALIDATION_CONFIG, ...config };

  let sanitized = content;

  if (mergedConfig.trimWhitespace) {
    sanitized = sanitized.trim();
  }

  if (mergedConfig.stripInvisibleChars) {
    sanitized = sanitized.replace(INVISIBLE_CHARS_REGEX, '');
    sanitized = sanitized.replace(CONTROL_CHARS_REGEX, '');
  }

  if (mergedConfig.normalizeUnicode) {
    sanitized = sanitized.normalize('NFC');
  }

  return sanitized;
}

/**
 * Check if content is empty or only whitespace
 * @param content - Content to check
 * @returns Whether the content is empty
 */
export function isEmpty(content: string): boolean {
  return content.trim().length === 0;
}

/**
 * Check if content contains only whitespace and invisible characters
 * @param content - Content to check
 * @returns Whether the content is effectively empty
 */
export function isEffectivelyEmpty(content: string): boolean {
  const cleaned = content.replace(INVISIBLE_CHARS_REGEX, '').replace(CONTROL_CHARS_REGEX, '');
  return cleaned.trim().length === 0;
}

/**
 * Get the character count (handling multi-byte characters correctly)
 * @param content - Content to count
 * @returns Character count
 */
export function getCharacterCount(content: string): number {
  // Use spread operator to correctly count Unicode characters
  return [...content].length;
}

/**
 * Get the word count
 * @param content - Content to count
 * @returns Word count
 */
export function getWordCount(content: string): number {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}

/**
 * Truncate content to a maximum length, adding ellipsis if truncated
 * @param content - Content to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Ellipsis string (default: '...')
 * @returns Truncated content
 */
export function truncate(content: string, maxLength: number, ellipsis = '...'): string {
  const chars = [...content];
  if (chars.length <= maxLength) {
    return content;
  }
  return chars.slice(0, maxLength - ellipsis.length).join('') + ellipsis;
}

/**
 * Check if content contains a URL
 * @param content - Content to check
 * @returns Whether the content contains a URL
 */
export function containsUrl(content: string): boolean {
  const urlPattern = /https?:\/\/[^\s]+/i;
  return urlPattern.test(content);
}

/**
 * Extract URLs from content
 * @param content - Content to search
 * @returns Array of URLs found
 */
export function extractUrls(content: string): string[] {
  const urlPattern = /https?:\/\/[^\s]+/gi;
  return content.match(urlPattern) ?? [];
}
