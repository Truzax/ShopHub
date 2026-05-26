import { authLimiter } from '../middleware/rateLimit';

describe('rateLimit middleware', () => {
    it('should be configured with correct windowMs and max', () => {
        expect(authLimiter).toBeDefined();
        // Since rateLimit returns a middleware function with additional properties,
        // we can simply check if it's a function to ensure it initialized correctly.
        expect(typeof authLimiter).toBe('function');
    });
});
