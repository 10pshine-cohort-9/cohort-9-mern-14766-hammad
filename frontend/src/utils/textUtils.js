/**
 * Utility functions for text manipulation, HTML detection, and entity ID resolution.
 */

const HTML_TAG_REGEX = /<[a-z][\s\S]*>/i;

/**
 * Determines whether a given string contains HTML markup tags.
 * @param {string} str - String to test.
 * @returns {boolean} True if HTML tags are detected.
 */
export const isHtml = (str) => {
  if (!str || typeof str !== 'string') return false;
  return HTML_TAG_REGEX.test(str);
};

/**
 * Checks if HTML formatted content is empty or contains only whitespace/tags.
 * @param {string} html - HTML markup string.
 * @returns {boolean} True if content has no printable text.
 */
export const isContentEmpty = (html) => {
  if (!html || typeof html !== 'string') return true;
  const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return stripped.length === 0;
};

/**
 * Safely extracts the primary identifier from a note entity object.
 * @param {Object} note - Note object.
 * @returns {string} Note ID.
 */
export const getNoteId = (note) => {
  if (!note || typeof note !== 'object') return '';
  return note._id || note.id || '';
};
