/**
 * Safe JSON Parser
 * 
 * Provides prototype pollution protection when parsing JSON from user-editable files.
 */

/**
 * Dangerous keys that could pollute prototypes
 */
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Parse JSON with prototype pollution protection.
 * Strips dangerous keys that could be used for prototype pollution attacks.
 * 
 * @param content - The JSON string to parse
 * @returns Parsed object with dangerous keys removed
 * @throws SyntaxError if JSON is malformed
 */
export function safeJsonParse<T>(content: string): T {
    return JSON.parse(content, (key, value) => {
        if (DANGEROUS_KEYS.has(key)) {
            console.warn(`[SafeJSON] Stripped dangerous key from JSON: ${key}`);
            return undefined;
        }
        return value;
    });
}

/**
 * Safely stringify an object to JSON
 * (Standard JSON.stringify is already safe, this is just for consistency)
 */
export function safeJsonStringify(value: unknown, indent = 2): string {
    return JSON.stringify(value, null, indent);
}

/**
 * Parse JSON with error handling and default value
 */
export function safeJsonParseOrDefault<T>(content: string, defaultValue: T): T {
    try {
        return safeJsonParse<T>(content);
    } catch (error) {
        console.error('[SafeJSON] Failed to parse JSON:', error);
        return defaultValue;
    }
}
