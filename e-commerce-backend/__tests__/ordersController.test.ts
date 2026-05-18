import { createOrder, getOrders, getOrderById, updateOrderStatus } from '../controllers/ordersController';
import Order from '../models/Order';
import Product from '../models/Product';
import { Request, Response, NextFunction } from 'express';

jest.mock('../models/Order');
jest.mock('../models/Product');

describe('OrdersController', () => {
    let mockRequest: Partial<Request & { user?: any }>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            params: {},
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

    describe('createOrder', () => {
        it('should return 401 if user not authenticated', async () => {
            await createOrder(mockRequest as any, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 if products is missing or empty', async () => {
            mockRequest.user = { _id: 'user1' };
            mockRequest.body = { products: [] };
            await createOrder(mockRequest as any, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
        
        it('should return 400 if product format is invalid', async () => {
            mockRequest.user = { _id: 'user1' };
            mockRequest.body = { products: [{ product: 'prod1' }] }; // missing quantity
            await createOrder(mockRequest as any, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if product not found', async () => {
            mockRequest.user = { _id: 'user1' };
            mockRequest.body = { products: [{ product: 'prod1', quantity: 1 }] };
            (Product.findById as jest.Mock).mockResolvedValue(null);
            await createOrder(mockRequest as any, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        it('should create order successfully', async () => {
            mockRequest.user = { _id: 'user1' };
            mockRequest.body = { products: [{ product: 'prod1', quantity: 2 }] };
            const mockProduct = { _id: 'prod1', price: 50 };
            (Product.findById as jest.Mock).mockResolvedValue(mockProduct);
            (Order.create as jest.Mock).mockResolvedValue({ _id: 'order1' });
            
            await createOrder(mockRequest as any, mockResponse as Response, nextFunction);
            
            expect(Order.create).toHaveBeenCalledWith({
                user: 'user1',
                products: [{ product: 'prod1', quantity: 2, price: 50 }],
                total: 100,
                status: 'pending'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });
        
        it('should pass error to next', async () => {
            mockRequest.user = { _id: 'user1' };
            const error = new Error('DB Error');
            (Order.create as jest.Mock).mockRejectedValue(error);
            // mock something to cause error later
            mockRequest.body = { products: [{ product: 'prod1', quantity: 2 }] };
            (Product.findById as jest.Mock).mockResolvedValue({ _id: 'prod1', price: 50 });
            await createOrder(mockRequest as any, mockResponse as Response, nextFunction);
            expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe('getOrders', () => {
        it('should return 401 if user not authenticated', async () => {
            await getOrders(mockRequest as any, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });

        it('should return orders for admin', async () => {
            mockRequest.user = { _id: 'admin1', role: 'admin' };
            const populateMock = jest.fn().mockReturnThis();
            const sortMock = jest.fn().mockReturnThis();
            const skipMock = jest.fn().mockReturnThis();
            const limitMock = jest.fn().mockResolvedValue([]);
            (Order.find as jest.Mock).mockReturnValue({
                sort: sortMock,
                populate: populateMock,
                skip: skipMock,
                limit: limitMock
            });
            (Order.countDocuments as jest.Mock).mockResolvedValue(0);

            await getOrders(mockRequest as any, mockResponse as Response, nextFunction);

            expect(Order.find).toHaveBeenCalledWith({});
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
        
        it('should return orders for regular user', async () => {
            mockRequest.user = { _id: 'user1', role: 'user' };
            const populateMock = jest.fn().mockReturnThis();
            const sortMock = jest.fn().mockReturnThis();
            const skipMock = jest.fn().mockReturnThis();
            const limitMock = jest.fn().mockResolvedValue([]);
            (Order.find as jest.Mock).mockReturnValue({
                sort: sortMock,
                populate: populateMock,
                skip: skipMock,
                limit: limitMock
            });
            (Order.countDocuments as jest.Mock).mockResolvedValue(0);

            await getOrders(mockRequest as any, mockResponse as Response, nextFunction);

            expect(Order.find).toHaveBeenCalledWith({ user: 'user1' });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
        
        it('should handle errors', async () => {
            mockRequest.user = { _id: 'user1', role: 'user' };
            const error = new Error('error');
            (Order.find as jest.Mock).mockImplementation(() => { throw error; });
            await getOrders(mockRequest as any, mockResponse as Response, nextFunction);
            expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe('getOrderById', () => {
        it('should return 401 if not authenticated', async () => {
             await getOrderById(mockRequest as any, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(401);
        });

        it('should return 404 if not found', async () => {
             mockRequest.user = { _id: 'user1' };
             mockRequest.params = { id: 'order1' };
             const populateMock2 = jest.fn().mockResolvedValue(null);
             const populateMock1 = jest.fn().mockReturnValue({ populate: populateMock2 });
             (Order.findById as jest.Mock).mockReturnValue({ populate: populateMock1 });
             await getOrderById(mockRequest as any, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        it('should return 403 if unauthorized', async () => {
             mockRequest.user = { _id: 'user1', role: 'user' };
             mockRequest.params = { id: 'order1' };
             const populateMock2 = jest.fn().mockResolvedValue({ user: { _id: 'user2' } });
             const populateMock1 = jest.fn().mockReturnValue({ populate: populateMock2 });
             (Order.findById as jest.Mock).mockReturnValue({ populate: populateMock1 });
             await getOrderById(mockRequest as any, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(403);
        });

        it('should return order', async () => {
             mockRequest.user = { _id: 'user1', role: 'user' };
             mockRequest.params = { id: 'order1' };
             const populateMock2 = jest.fn().mockResolvedValue({ user: { _id: 'user1' } });
             const populateMock1 = jest.fn().mockReturnValue({ populate: populateMock2 });
             (Order.findById as jest.Mock).mockReturnValue({ populate: populateMock1 });
             await getOrderById(mockRequest as any, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
        
        it('should handle errors', async () => {
             mockRequest.user = { _id: 'user1', role: 'user' };
             const error = new Error('DB');
             (Order.findById as jest.Mock).mockImplementation(() => { throw error; });
             await getOrderById(mockRequest as any, mockResponse as Response, nextFunction);
             expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe('updateOrderStatus', () => {
        it('should return 400 for invalid status', async () => {
            mockRequest.body = { status: 'invalid' };
            await updateOrderStatus(mockRequest as any, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if order not found', async () => {
            mockRequest.body = { status: 'processing' };
            mockRequest.params = { id: 'order1' };
            (Order.findById as jest.Mock).mockResolvedValue(null);
            await updateOrderStatus(mockRequest as any, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        it('should deduct stock and update status', async () => {
            mockRequest.body = { status: 'processing' };
            mockRequest.params = { id: 'order1' };
            const saveMock = jest.fn().mockResolvedValue(true);
            const mockOrder = {
                _id: 'order1',
                status: 'pending',
                stockUpdated: false,
                products: [{ product: 'prod1', quantity: 2 }],
                save: saveMock
            };
            (Order.findById as jest.Mock).mockResolvedValue(mockOrder);
            
            const prodSaveMock = jest.fn().mockResolvedValue(true);
            const mockProduct = {
                _id: 'prod1',
                stock: 10,
                save: prodSaveMock
            };
            (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

            await updateOrderStatus(mockRequest as any, mockResponse as Response, nextFunction);

            expect(mockProduct.stock).toBe(8);
            expect(prodSaveMock).toHaveBeenCalled();
            expect(mockOrder.stockUpdated).toBe(true);
            expect(mockOrder.status).toBe('processing');
            expect(saveMock).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 if insufficient stock', async () => {
            mockRequest.body = { status: 'processing' };
            mockRequest.params = { id: 'order1' };
            const mockOrder = {
                _id: 'order1',
                status: 'pending',
                stockUpdated: false,
                products: [{ product: 'prod1', quantity: 10 }]
            };
            (Order.findById as jest.Mock).mockResolvedValue(mockOrder);
            
            const mockProduct = {
                _id: 'prod1',
                name: 'TestProd',
                stock: 5 // less than 10
            };
            (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

            await updateOrderStatus(mockRequest as any, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Insufficient stock for product TestProd' });
        });
        
        it('should return 404 if product not found during deduct', async () => {
            mockRequest.body = { status: 'processing' };
            mockRequest.params = { id: 'order1' };
            const mockOrder = {
                _id: 'order1',
                status: 'pending',
                stockUpdated: false,
                products: [{ product: 'prod1', quantity: 2 }]
            };
            (Order.findById as jest.Mock).mockResolvedValue(mockOrder);
            (Product.findById as jest.Mock).mockResolvedValue(null);

            await updateOrderStatus(mockRequest as any, mockResponse as Response, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        it('should handle errors', async () => {
            mockRequest.body = { status: 'processing' };
            mockRequest.params = { id: 'order1' };
            const error = new Error('DB Error');
            (Order.findById as jest.Mock).mockRejectedValue(error);
            await updateOrderStatus(mockRequest as any, mockResponse as Response, nextFunction);
            expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });
});
