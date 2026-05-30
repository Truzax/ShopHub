import { getProducts, getCategories, getProductById, createProduct, createBulkProducts, updateProduct, deleteProduct } from '../controllers/productsController';
import Product from '../models/Product';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

jest.mock('../models/Product');
jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK')
  }
}));

describe('ProductsController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            query: {},
            params: {},
            body: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });

    describe('getProducts', () => {
        it('should return products by ids', async () => {
            mockRequest.query = { ids: '1,2,3' };
            (Product.find as jest.Mock).mockResolvedValue([{ _id: '1' }, { _id: '2' }, { _id: '3' }]);

            await getProducts(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(Product.find).toHaveBeenCalledWith({ _id: mongoose.trusted({ $in: ['1', '2', '3'] }) });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                count: 3,
                data: [{ _id: '1' }, { _id: '2' }, { _id: '3' }]
            });
        });

        it('should return paginated products', async () => {
             const skipMock = jest.fn().mockReturnThis();
             const limitMock = jest.fn().mockResolvedValue([{ name: 'Product A' }]);

             (Product.find as jest.Mock).mockReturnValue({
                 skip: skipMock,
                 limit: limitMock
             });
             (Product.countDocuments as jest.Mock).mockResolvedValue(1);

             await getProducts(mockRequest as Request, mockResponse as Response, nextFunction);

             expect(Product.find).toHaveBeenCalledWith({});
             expect(mockResponse.status).toHaveBeenCalledWith(200);
             expect(mockResponse.json).toHaveBeenCalledWith({
                 success: true,
                 count: 1,
                 nextCursor: null,
                 data: [{ name: 'Product A' }]
             });
        });

        it('should pass error to next', async () => {
             const error = new Error('DB error');
             (Product.find as jest.Mock).mockImplementation(() => { throw error; });

             await getProducts(mockRequest as Request, mockResponse as Response, nextFunction);

             expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe('getCategories', () => {
        it('should return categories', async () => {
             (Product.distinct as jest.Mock).mockResolvedValue(['Electronics', 'Books']);
             await getCategories(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(200);
             expect(mockResponse.json).toHaveBeenCalledWith({
                 success: true,
                 data: ['Electronics', 'Books']
             });
        });

        it('should pass error to next', async () => {
             const error = new Error('DB error');
             (Product.distinct as jest.Mock).mockRejectedValue(error);
             await getCategories(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe('getProductById', () => {
        it('should return 404 if product not found', async () => {
             mockRequest.params = { id: '1' };
             (Product.findById as jest.Mock).mockResolvedValue(null);
             await getProductById(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        it('should return product', async () => {
             mockRequest.params = { id: '1' };
             (Product.findById as jest.Mock).mockResolvedValue({ _id: '1' });
             await getProductById(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should pass error to next', async () => {
             mockRequest.params = { id: '1' };
             const error = new Error('DB error');
             (Product.findById as jest.Mock).mockRejectedValue(error);
             await getProductById(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe('createProduct', () => {
        it('should create product', async () => {
             mockRequest.body = { name: 'Test' };
             (Product.create as jest.Mock).mockResolvedValue({ _id: '1', name: 'Test' });
             await createProduct(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it('should pass error to next', async () => {
             const error = new Error('Invalid');
             (Product.create as jest.Mock).mockRejectedValue(error);
             await createProduct(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe('createBulkProducts', () => {
        it('should return 400 if body is not array', async () => {
             mockRequest.body = { name: 'Test' };
             await createBulkProducts(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('should bulk create products', async () => {
             mockRequest.body = [{ name: 'Test1' }, { name: 'Test2' }];
             (Product.insertMany as jest.Mock).mockResolvedValue([{ _id: '1' }, { _id: '2' }]);
             await createBulkProducts(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(201);
             expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: 2 }));
        });

        it('should pass error to next', async () => {
             mockRequest.body = [];
             const error = new Error('Invalid');
             (Product.insertMany as jest.Mock).mockRejectedValue(error);
             await createBulkProducts(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe('updateProduct', () => {
        it('should return 404 if product not found', async () => {
             mockRequest.params = { id: '1' };
             (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
             await updateProduct(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        it('should update product', async () => {
             mockRequest.params = { id: '1' };
             mockRequest.body = { name: 'New' };
             (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue({ _id: '1', name: 'New' });
             await updateProduct(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should pass error to next', async () => {
             mockRequest.params = { id: '1' };
             const error = new Error('Invalid');
             (Product.findByIdAndUpdate as jest.Mock).mockRejectedValue(error);
             await updateProduct(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe('deleteProduct', () => {
        it('should return 404 if product not found', async () => {
             mockRequest.params = { id: '1' };
             (Product.findByIdAndDelete as jest.Mock).mockResolvedValue(null);
             await deleteProduct(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        it('should delete product', async () => {
             mockRequest.params = { id: '1' };
             (Product.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: '1' });
             await deleteProduct(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should pass error to next', async () => {
             mockRequest.params = { id: '1' };
             const error = new Error('DB Error');
             (Product.findByIdAndDelete as jest.Mock).mockRejectedValue(error);
             await deleteProduct(mockRequest as Request, mockResponse as Response, nextFunction);
             expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });
});
