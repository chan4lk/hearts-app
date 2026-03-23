import { describe, it, expect } from 'vitest';
import { sanitizeInput } from '@/lib/securityUtils';

// ============================================
// XSS PREVENTION (Fix: notification message sanitization)
// ============================================

describe('sanitizeInput', () => {
  it('escapes HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('<script>');
    expect(sanitizeInput('<img src=x onerror="alert(1)">')).not.toContain('<img');
  });

  it('escapes special characters', () => {
    const result = sanitizeInput('Hello <b>"world"</b> & \'friends\'');
    expect(result).toBe('Hello &lt;b&gt;&quot;world&quot;&lt;/b&gt; &amp; &#x27;friends&#x27;');
  });

  it('truncates to maxLength', () => {
    const long = 'a'.repeat(500);
    expect(sanitizeInput(long, 100).length).toBe(100);
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeInput(null as any)).toBe('');
    expect(sanitizeInput(undefined as any)).toBe('');
    expect(sanitizeInput(123 as any)).toBe('');
  });

  it('preserves safe content', () => {
    expect(sanitizeInput('Complete Q1 Performance Review')).toBe('Complete Q1 Performance Review');
  });

  it('handles goal titles with special chars safely', () => {
    // Simulates what happens when a malicious goal title goes into notifications
    const maliciousTitle = '"><img src=x onerror=alert(1)>';
    const safeTitle = sanitizeInput(maliciousTitle, 200);
    // HTML tags are escaped — browser won't parse them as elements
    expect(safeTitle).not.toContain('<img');
    expect(safeTitle).not.toContain('<script');
    expect(safeTitle).toContain('&lt;img');
    expect(safeTitle).toContain('&quot;');
  });
});
