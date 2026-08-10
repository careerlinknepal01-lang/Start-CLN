import { describe, it, expect } from 'vitest';
import { isValidUUID, isValidUrl, validateStudyPartnerData, validateChallengeSubmission } from './validation';

describe('validation', () => {
  describe('isValidUUID', () => {
    it('should return true for valid UUID', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('should return false for invalid UUID', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should return false for invalid URL', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
    });
  });

  describe('validateStudyPartnerData', () => {
    it('should return errors for too many subjects', () => {
      const subjects = new Array(11).fill('Subject');
      const errors = validateStudyPartnerData({ subjects });
      expect(errors).toContain('You can select a maximum of 10 subjects.');
    });

    it('should return errors for too long bio', () => {
      const bio = 'a'.repeat(501);
      const errors = validateStudyPartnerData({ bio });
      expect(errors).toContain('Bio must be less than 500 characters.');
    });

    it('should return empty array for valid data', () => {
      const errors = validateStudyPartnerData({ subjects: ['Math'], bio: 'Hello' });
      expect(errors.length).toBe(0);
    });
  });

  describe('validateChallengeSubmission', () => {
    it('should return errors for invalid url', () => {
      const errors = validateChallengeSubmission('invalid');
      expect(errors).toContain('A valid submission URL is required.');
    });

    it('should return errors for long description', () => {
      const description = 'a'.repeat(1001);
      const errors = validateChallengeSubmission('https://example.com', description);
      expect(errors).toContain('Description must be less than 1000 characters.');
    });

    it('should return empty array for valid data', () => {
      const errors = validateChallengeSubmission('https://example.com', 'Valid');
      expect(errors.length).toBe(0);
    });
  });
});
