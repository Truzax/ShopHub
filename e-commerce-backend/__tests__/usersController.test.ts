import { getUsers, getProfile, updateProfile } from '../controllers/usersController';
import User from '../models/User';
import { Request, Response, NextFunction } from 'express';

jest.mock('../models/User');

describe('UsersController', () => {
    let mockRequest: Partial<Request & { user?: any }>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            query: {},
            body: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });

    describe('getUsers', () => {
        it('should get paginated users', async () => {
            const selectMock = jest.fn().mockReturnThis();
            const skipMock = jest.fn().mockReturnThis();
            const limitMock = jest.fn().mockResolvedValue([{ name: 'User 1' }]);
            
            (User.find as jest.Mock).mockReturnValue({
                select: selectMock,
                skip: skipMock,
                limit: limitMock
            });
            (User.countDocuments as jest.Mock).mockResolvedValue(1);

            await getUsers(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(User.find).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                count: 1,
                total: 1,
                page: 1,
                pages: 1,
                data: [{ name: 'User 1' }]
            });
        });

        it('should handle errors', async () => {
            const error = new Error('DB Error');
            (User.find as jest.Mock).mockImplementation(() => { throw error; });
            await getUsers(mockRequest as Request, mockResponse as Response, nextFunction);
            expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe('getProfile', () => {
        it('should return 401 if user not authenticated', async () => {
             await getProfile(mockRequest as any, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(401);
             expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
        });

        it('should return user profile', async () => {
             mockRequest.user = { _id: 'user123', name: 'John Doe' };
             await getProfile(mockRequest as any, mockResponse as Response, nextFunction);
             expect(mockResponse.json).toHaveBeenCalledWith(mockRequest.user);
        });

        it('should handle errors', async () => {
             mockRequest.user = { _id: 'user123' };
             const error = new Error('Error');
             const mockRes = { json: jest.fn().mockImplementation(() => { throw error; }) } as unknown as Response;
             await getProfile(mockRequest as any, mockRes, nextFunction);
             expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe('updateProfile', () => {
        it('should return 401 if user not authenticated', async () => {
            await updateProfile(mockRequest as any, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
        });

        it('should return 404 if user not found', async () => {
            mockRequest.user = { _id: 'user123' };
            (User.findById as jest.Mock).mockResolvedValue(null);
            
            await updateProfile(mockRequest as any, mockResponse as Response, nextFunction);
            
            expect(User.findById).toHaveBeenCalledWith('user123');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        it('should update user profile successfully', async () => {
            mockRequest.user = { _id: 'user123' };
            mockRequest.body = { name: 'New Name', phone: '1234567890', address: 'New Address' };
            
            const saveMock = jest.fn().mockResolvedValue(true);
            const toObjectMock = jest.fn().mockReturnValue({
                _id: 'user123',
                name: 'New Name',
                phone: '1234567890',
                address: 'New Address',
                password: 'secret_password',
                refreshTokens: ['token']
            });

            const mockUser = {
                save: saveMock,
                toObject: toObjectMock
            };

            (User.findById as jest.Mock).mockResolvedValue(mockUser);
            
            await updateProfile(mockRequest as any, mockResponse as Response, nextFunction);
            
            expect(mockUser.save).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    _id: 'user123',
                    name: 'New Name',
                    phone: '1234567890',
                    address: 'New Address',
                } // password and refreshTokens deleted
            });
        });

        it('should handle errors', async () => {
            mockRequest.user = { _id: 'user123' };
            const error = new Error('DB Error');
            (User.findById as jest.Mock).mockRejectedValue(error);
            await updateProfile(mockRequest as any, mockResponse as Response, nextFunction);
            expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });
});
