import { authorizeRoles } from '../middleware/role';
import { Request, Response, NextFunction } from 'express';

describe('authorizeRoles middleware', () => {
    let mockRequest: Partial<Request & { user?: any }>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();
    });

    it('should return 401 if user is not authenticated', () => {
        const middleware = authorizeRoles('admin');
        middleware(mockRequest as any, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is not allowed', () => {
        mockRequest = { user: { role: 'user' } };
        const middleware = authorizeRoles('admin');
        middleware(mockRequest as any, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Role: user is not allowed to access this resource' });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next if user role is allowed', () => {
        mockRequest = { user: { role: 'admin' } };
        const middleware = authorizeRoles('admin');
        middleware(mockRequest as any, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
    });
});
