import { getDashboardData } from '../controllers/analyticsController';
import { AnalyticsService } from '../services/analyticsService';
import { Request, Response, NextFunction } from 'express';

jest.mock('../services/analyticsService');

describe('AnalyticsController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            query: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });

    describe('getDashboardData', () => {
        it('should return 400 if startDate or endDate is missing', async () => {
            mockRequest.query = { startDate: '2023-01-01' }; // missing endDate
            
            await getDashboardData(mockRequest as Request, mockResponse as Response, nextFunction);
            
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'startDate and endDate query parameters are required'
            });
        });

        it('should fetch analytics data and return 200 on success', async () => {
            mockRequest.query = { startDate: '2023-01-01', endDate: '2023-01-31', category: 'electronics' };
            const mockDashboardData = { totalSales: 100, orders: 10 };
            
            (AnalyticsService.getDashboardData as jest.Mock).mockResolvedValue(mockDashboardData);
            
            await getDashboardData(mockRequest as Request, mockResponse as Response, nextFunction);
            
            expect(AnalyticsService.getDashboardData).toHaveBeenCalledWith('2023-01-01', '2023-01-31', 'electronics');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockDashboardData
            });
        });

        it('should pass error to nextFunction if service throws', async () => {
            mockRequest.query = { startDate: '2023-01-01', endDate: '2023-01-31' };
            const error = new Error('Database connection failed');
            
            (AnalyticsService.getDashboardData as jest.Mock).mockRejectedValue(error);
            
            await getDashboardData(mockRequest as Request, mockResponse as Response, nextFunction);
            
            expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });
});
