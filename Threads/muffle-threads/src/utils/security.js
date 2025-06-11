// Security utilities for input sanitization and validation
// This provides protection against XSS, injection attacks, and other malicious inputs

// HTML entity encoding to prevent XSS
const htmlEntities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
  '=': '&#x3D;'
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return '';
  
  return input.replace(/[&<>"'`=\/]/g, (match) => htmlEntities[match]);
};

/**
 * Sanitize search queries to prevent injection attacks
 * @param {string} query - The search query to sanitize
 * @returns {string} - Sanitized query
 */
export const sanitizeSearchQuery = (query) => {
  if (typeof query !== 'string') return '';
  
  // Remove potentially dangerous characters and patterns
  let sanitized = query
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove SQL injection patterns
    .replace(/('|(\\)|;|--|\||`|<|>|&|\$)/g, '')
    // Remove potentially dangerous URLs
    .replace(/(javascript:|data:|vbscript:|file:|about:)/gi, '')
    // Limit length
    .substring(0, 200)
    // Trim whitespace
    .trim();
    
  return sanitized;
};

/**
 * Sanitize comment text to prevent XSS while preserving basic formatting
 * @param {string} comment - The comment text to sanitize
 * @returns {string} - Sanitized comment
 */
export const sanitizeComment = (comment) => {
  if (typeof comment !== 'string') return '';
  
  // Remove script tags and dangerous content
  let sanitized = comment
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove potentially dangerous attributes
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: and data: URLs
    .replace(/(javascript:|data:|vbscript:|file:|about:)/gi, '')
    // Encode remaining HTML entities
    .replace(/[&<>"'`]/g, (match) => htmlEntities[match])
    // Limit length to prevent DoS
    .substring(0, 2000)
    // Trim whitespace
    .trim();
    
  return sanitized;
};

/**
 * Validate and sanitize user input for forms
 * @param {string} input - The form input to validate
 * @param {Object} options - Validation options
 * @returns {Object} - {isValid: boolean, sanitized: string, error?: string}
 */
export const validateAndSanitizeInput = (input, options = {}) => {
  const {
    maxLength = 1000,
    minLength = 0,
    allowHtml = false,
    type = 'text' // 'text', 'search', 'comment'
  } = options;
  
  if (typeof input !== 'string') {
    return { isValid: false, sanitized: '', error: 'Input must be a string' };
  }
  
  // Check length constraints
  if (input.length < minLength) {
    return { isValid: false, sanitized: '', error: `Input too short (minimum ${minLength} characters)` };
  }
  
  if (input.length > maxLength) {
    return { isValid: false, sanitized: '', error: `Input too long (maximum ${maxLength} characters)` };
  }
  
  // Sanitize based on type
  let sanitized;
  switch (type) {
    case 'search':
      sanitized = sanitizeSearchQuery(input);
      break;
    case 'comment':
      sanitized = sanitizeComment(input);
      break;
    default:
      sanitized = allowHtml ? sanitizeHtml(input) : sanitizeComment(input);
  }
  
  // Check if sanitization removed too much content
  if (sanitized.length < input.length * 0.5 && input.length > 10) {
    return { isValid: false, sanitized: '', error: 'Input contains too much invalid content' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Rate limiting helper for preventing spam
 * @param {string} key - Unique key for the rate limit (e.g., user ID, IP)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - Whether the request is allowed
 */
export const checkRateLimit = (key, maxRequests = 10, windowMs = 60000) => {
  const now = Date.now();
  const windowKey = `${key}_${Math.floor(now / windowMs)}`;
  
  // Get current count from localStorage (in a real app, use Redis or similar)
  const stored = localStorage.getItem(windowKey);
  const count = stored ? parseInt(stored, 10) : 0;
  
  if (count >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  // Increment count
  localStorage.setItem(windowKey, (count + 1).toString());
  
  // Clean up old entries (basic cleanup)
  const keys = Object.keys(localStorage);
  keys.forEach(storageKey => {
    if (storageKey.startsWith(key) && storageKey !== windowKey) {
      const keyTime = parseInt(storageKey.split('_')[1], 10);
      if (now - keyTime * windowMs > windowMs * 2) {
        localStorage.removeItem(storageKey);
      }
    }
  });
  
  return true; // Request allowed
};

/**
 * Validate file uploads to prevent malicious files
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Object} - {isValid: boolean, error?: string}
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  } = options;
  
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }
  
  // Check file size
  if (file.size > maxSize) {
    return { isValid: false, error: `File too large (maximum ${maxSize / 1024 / 1024}MB)` };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type' };
  }
  
  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return { isValid: false, error: 'Invalid file extension' };
  }
  
  return { isValid: true };
};