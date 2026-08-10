import { describe, it, expect } from 'vitest';
import { validateCbuChecksum } from './banking';

describe('validateCbuChecksum', () => {
    it('should return true for a valid 22-digit CBU', () => {
        // Block 1 (8 digits): 75862257, Block 2 (14 digits): 12345678901233
        expect(validateCbuChecksum('7586225712345678901233')).toBe(true);
    });

    it('should return false for CBUs with incorrect length', () => {
        expect(validateCbuChecksum('758622571234567890123')).toBe(false); // 21 digits
        expect(validateCbuChecksum('75862257123456789012334')).toBe(false); // 23 digits
        expect(validateCbuChecksum('')).toBe(false); // empty
    });

    it('should return false for CBUs containing non-digit characters', () => {
        expect(validateCbuChecksum('758622571234567890123A')).toBe(false);
        expect(validateCbuChecksum('758622571234567890123 ')).toBe(false);
    });

    it('should return false if the first block checksum is invalid', () => {
        // Changing the first digit of block 1 to invalidate its checksum
        expect(validateCbuChecksum('8586225712345678901233')).toBe(false);
    });

    it('should return false if the second block checksum is invalid', () => {
        // Changing the first digit of block 2 to invalidate its checksum
        expect(validateCbuChecksum('7586225722345678901233')).toBe(false);
    });

    it('should return false if both block checksums are invalid', () => {
        expect(validateCbuChecksum('8586225722345678901233')).toBe(false);
    });
});
