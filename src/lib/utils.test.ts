import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('cn utility function', () => {
  it('should combine class names correctly', () => {
    const result = cn('btn', 'btn-primary');
    expect(result).toBe('btn btn-primary');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should merge conflicting tailwind classes', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });
});
