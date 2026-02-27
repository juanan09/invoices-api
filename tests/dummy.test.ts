import { describe, it, expect } from 'vitest';

describe('Dummy Test', () => {
    it('debería sumar dos números correctamente', () => {
        const a = 2;
        const b = 3;
        const result = a + b;
        expect(result).toBe(5);
    });
});
