/**
 * Input Sanitizer
 * 
 * Wraps DOMPurify for sanitizing user input and AI-generated content.
 * Prevents XSS attacks from malicious quest descriptions.
 */

import DOMPurify from 'dompurify';

/**
 * Maximum lengths for various fields to prevent DoS
 */
export const MAX_LENGTHS = {
    questTitle: 200,
    questDescription: 5000,
    characterName: 50,
    notes: 10000,
    tag: 50,
    category: 50,
};

/**
 * Allowed HTML tags for quest descriptions (rich text)
 */
const ALLOWED_DESCRIPTION_TAGS = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'];

/**
 * Sanitize HTML content, allowing only safe formatting tags.
 * Use for quest descriptions and notes.
 */
export function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ALLOWED_DESCRIPTION_TAGS,
        ALLOWED_ATTR: [],
    });
}

/**
 * Strip ALL HTML from text.
 * Use for titles, names, categories, and other plain text fields.
 */
export function sanitizeText(text: string): string {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

/**
 * Validate string length and truncate if necessary.
 * Logs a warning if truncation occurs.
 */
export function validateLength(
    text: string,
    maxLength: number,
    fieldName: string
): string {
    if (text.length > maxLength) {
        console.warn(
            `[Sanitizer] ${fieldName} exceeds max length (${maxLength}), truncating`
        );
        return text.substring(0, maxLength);
    }
    return text;
}

/**
 * Full sanitization for quest title
 */
export function sanitizeQuestTitle(title: string): string {
    const clean = sanitizeText(title);
    return validateLength(clean, MAX_LENGTHS.questTitle, 'Quest title');
}

/**
 * Full sanitization for quest description
 */
export function sanitizeQuestDescription(description: string): string {
    const clean = sanitizeHtml(description);
    return validateLength(clean, MAX_LENGTHS.questDescription, 'Quest description');
}

/**
 * Full sanitization for character name
 */
export function sanitizeCharacterName(name: string): string {
    const clean = sanitizeText(name);
    return validateLength(clean, MAX_LENGTHS.characterName, 'Character name');
}

/**
 * Sanitize an array of tags
 */
export function sanitizeTags(tags: string[]): string[] {
    return tags
        .map(tag => sanitizeText(tag))
        .map(tag => validateLength(tag, MAX_LENGTHS.tag, 'Tag'))
        .filter(tag => tag.length > 0);
}
