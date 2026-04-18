export const MIN_SEARCH_QUERY_LENGTH = 2;
export const MAX_SEARCH_QUERY_LENGTH = 80;

const DISALLOWED_TOKENS_PATTERN =
  /\b(?:javascript|data|vbscript)\s*:|on[a-z]+\s*=|<[^>]*>|[`$\\{}[\]]/gi;
const UNSAFE_SEARCH_CHARS_PATTERN = /[^\p{L}\p{N}\s&'.,!():?/\-+#]/gu;

const replaceControlCharacters = (value) =>
  Array.from(value)
    .map((char) => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : char;
    })
    .join('');

export const sanitizeSearchInput = (value, options = {}) => {
  const maxLength = Number.isFinite(options.maxLength)
    ? Math.max(1, options.maxLength)
    : MAX_SEARCH_QUERY_LENGTH;

  if (typeof value !== 'string') {
    return '';
  }

  const normalizedValue = value.normalize('NFKC');
  if (!normalizedValue.trim()) {
    return '';
  }

  return replaceControlCharacters(normalizedValue)
    .replace(DISALLOWED_TOKENS_PATTERN, ' ')
    .replace(UNSAFE_SEARCH_CHARS_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
};

export const isSearchQueryLongEnough = (
  value,
  minLength = MIN_SEARCH_QUERY_LENGTH
) => sanitizeSearchInput(value).length >= minLength;

export const isSafeHttpUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};
