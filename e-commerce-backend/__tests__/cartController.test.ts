import { getCart, updateCart, clearCart } from '../controllers/cartController';
import Cart from '../models/Cart';
import { Request, Response, NextFunction } from 'express';

jest.mock('../models/Cart');

describe('CartController', () => {
    let mockRequest: Partial<Request & { user?: any }>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            user: { _id: 'user_id' },
            body: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });

    describe('getCart', () => {
        it('should get existing cart', async () => {
            const populateMock = jest.fn().mockResolvedValue({ items: [] });
            (Cart.findOne as jest.Mock).mockReturnValue({ populate: populateMock });
            
            await getCart(mockRequest as any, mockResponse as Response, nextFunction);
            
            expect(Cart.findOne).toHaveBeenCalledWith({ user: 'user_id' });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should create cart if none exists', async () => {
            const populateMock = jest.fn().mockResolvedValue(null);
            (Cart.findOne as jest.Mock).mockReturnValue({ populate: populateMock });
            (Cart.create as jest.Mock).mockResolvedValue({ user: 'user_id', items: [] });
            
            await getCart(mockRequest as any, mockResponse as Response, nextFunction);
            
            expect(Cart.create).toHaveBeenCalledWith({ user: 'user_id', items: [] });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
        
        it('should catch errors', async () => {
             const error = new Error('Database Error');
             (Cart.findOne as jest.Mock).mockImplementation(() => { throw error; });
             await getCart(mockRequest as any, mockResponse as Response, nextFunction);
             expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe('updateCart', () => {
        it('should update existing cart', async () => {
            mockRequest.body = { items: [{ product: 'prodId', quantity: 2 }] };
            const saveMock = jest.fn().mockResolvedValue(true);
            (Cart.findOne as jest.Mock).mockResolvedValue({ _id: 'cartId', items: [], save: saveMock });
            const populateMock = jest.fn().mockResolvedValue({ _id: 'cartId', items: mockRequest.body.items });
            (Cart.findById as jest.Mock).mockReturnValue({ populate: populateMock });
            
            await updateCart(mockRequest as any, mockResponse as Response, nextFunction);
            
            expect(saveMock).toHaveBeenCalled();
            expect(Cart.findById).toHaveBeenCalledWith('cartId');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should create cart if not existing during update', async () => {
            mockRequest.body = { items: [{ product: 'prodId', quantity: 2 }] };
            (Cart.findOne as jest.Mock).mockResolvedValue(null);
            (Cart.create as jest.Mock).mockResolvedValue({ _id: 'newCartId' });
            const populateMock = jest.fn().mockResolvedValue({ _id: 'newCartId', items: mockRequest.body.items });
            (Cart.findById as jest.Mock).mockReturnValue({ populate: populateMock });
            
            await updateCart(mockRequest as any, mockResponse as Response, nextFunction);
            
            expect(Cart.create).toHaveBeenCalledWith({ user: 'user_id', items: mockRequest.body.items });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
        
        it('should catch errors', async () => {
             const error = new Error('Database Error');
             (Cart.findOne as jest.Mock).mockRejectedValue(error);
             await updateCart(mockRequest as any, mockResponse as Response, nextFunction);
             expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe('clearCart', () => {
        it('should clear cart', async () => {
            (Cart.findOneAndUpdate as jest.Mock).mockResolvedValue(true);
            
            await clearCart(mockRequest as any, mockResponse as Response, nextFunction);
            
            expect(Cart.findOneAndUpdate).toHaveBeenCalledWith({ user: 'user_id' }, { items: [] });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });
        
        it('should catch errors', async () => {
             const error = new Error('Database Error');
             (Cart.findOneAndUpdate as jest.Mock).mockRejectedValue(error);
             await clearCart(mockRequest as any, mockResponse as Response, nextFunction);
             expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });
});
