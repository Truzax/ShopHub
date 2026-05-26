import { validateProduct, validateOrder } from '../middleware/validate';
import { Request, Response, NextFunction } from 'express';

describe('validate middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = { body: {} };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();
    });

    describe('validateProduct', () => {
        it('should return 400 for invalid name', () => {
            mockRequest.body = { price: 10, category: 'cat', stock: 5 };
            validateProduct(mockRequest as Request, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Valid name is required' });
        });

        it('should return 400 for invalid price', () => {
            mockRequest.body = { name: 'product', price: -5, category: 'cat', stock: 5 };
            validateProduct(mockRequest as Request, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Valid price is required' });
        });

        it('should return 400 for invalid category', () => {
            mockRequest.body = { name: 'product', price: 10, stock: 5 };
            validateProduct(mockRequest as Request, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Valid category is required' });
        });

        it('should return 400 for invalid stock', () => {
            mockRequest.body = { name: 'product', price: 10, category: 'cat', stock: -1 };
            validateProduct(mockRequest as Request, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Valid stock is required' });
        });

        it('should call next for valid product', () => {
            mockRequest.body = { name: 'product', price: 10, category: 'cat', stock: 5 };
            validateProduct(mockRequest as Request, mockResponse as Response, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });
    });

    describe('validateOrder', () => {
        it('should return 400 for empty products', () => {
            mockRequest.body = { products: [], total: 100 };
            validateOrder(mockRequest as Request, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('should return 400 for invalid product item in order', () => {
            mockRequest.body = { products: [{ product: 'id', quantity: 'not_number' }], total: 100 };
            validateOrder(mockRequest as Request, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid product item format in order' });
        });

        it('should return 400 for invalid total', () => {
            mockRequest.body = { products: [{ product: 'id', quantity: 1, price: 50 }], total: -1 };
            validateOrder(mockRequest as Request, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Valid total amount is required' });
        });

        it('should call next for valid order', () => {
            mockRequest.body = { products: [{ product: 'id', quantity: 1, price: 50 }], total: 50 };
            validateOrder(mockRequest as Request, mockResponse as Response, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });
    });
});
