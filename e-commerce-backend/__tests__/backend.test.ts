import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import * as authController from '../controllers/authController';
import * as ordersController from '../controllers/ordersController';
import * as productsController from '../controllers/productsController';
import * as usersController from '../controllers/usersController';
import authMiddleware from '../middleware/auth';

import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
}));

jest.mock('../models/User', () => {
  const User: any = jest.fn();
  User.find = jest.fn();
  User.findOne = jest.fn();
  User.findById = jest.fn();
  User.countDocuments = jest.fn();
  return {
    __esModule: true,
    default: User,
  };
});

jest.mock('../models/Product', () => {
  const Product: any = jest.fn();
  Product.find = jest.fn();
  Product.findById = jest.fn();
  Product.create = jest.fn();
  Product.findByIdAndUpdate = jest.fn();
  Product.findByIdAndDelete = jest.fn();
  Product.countDocuments = jest.fn();
  return {
    __esModule: true,
    default: Product,
  };
});

jest.mock('../models/Order', () => {
  const Order: any = jest.fn();
  Order.find = jest.fn();
  Order.findById = jest.fn();
  Order.countDocuments = jest.fn();
  Order.create = jest.fn();
  return {
    __esModule: true,
    default: Order,
  };
});

const mockedJwt = jwt as unknown as {
  sign: jest.Mock;
  verify: jest.Mock;
};

const mockedUserModel = User as unknown as jest.Mock & {
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  countDocuments: jest.Mock;
};

const mockedProductModel = Product as unknown as jest.Mock & {
  find: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  countDocuments: jest.Mock;
};

const mockedOrderModel = Order as unknown as jest.Mock & {
  find: jest.Mock;
  findById: jest.Mock;
  countDocuments: jest.Mock;
  create: jest.Mock;
};

const createMockResponse = () => {
  const response: any = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  response.cookie = jest.fn().mockReturnValue(response);
  response.clearCookie = jest.fn().mockReturnValue(response);
  response.end = jest.fn().mockReturnValue(response);
  return response as Partial<Response>;
};

const createMockRequest = (overrides: Partial<Request> & { user?: any } = {}) =>
  ({
    params: {},
    query: {},
    body: {},
    cookies: {},
    headers: {},
    ...overrides,
  }) as Partial<Request> & { user?: any };

const createListQuery = <T>(result: T) => ({
  populate: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue(result),
});

const createDocumentQuery = <T>(result: T) => ({
  populate: jest.fn().mockReturnValue({
    populate: jest.fn().mockResolvedValue(result),
  }),
});

describe('Backend unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_FROM;
  });

  describe('authController', () => {
    it('creates a user, stores a refresh token, and returns an access token', async () => {
      const request = createMockRequest({
        body: {
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          password: 'secret123',
          role: 'ADMIN',
        },
      });
      const response = createMockResponse();

      const user = {
        _id: 'user-1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'admin',
        save: jest.fn().mockResolvedValue(undefined),
        addRefreshToken: jest.fn().mockResolvedValue(undefined),
      };

      mockedUserModel.findOne.mockResolvedValue(null);
      mockedUserModel.mockImplementation((data: any) => {
        Object.assign(user, data);
        return user;
      });
      mockedJwt.sign.mockReturnValue('access-token');

      await authController.signup(request as any, response as any, jest.fn());

      expect(mockedUserModel.findOne).toHaveBeenCalledWith({ email: 'ada@example.com' });
      expect(user.save).toHaveBeenCalled();
      expect(user.addRefreshToken).toHaveBeenCalledWith(expect.any(String));
      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.objectContaining({ httpOnly: true, sameSite: 'lax' })
      );
      expect(response.status).toHaveBeenCalledWith(201);
      expect(response.json).toHaveBeenCalledWith({
        user: {
          id: 'user-1',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'admin',
        },
        token: 'access-token',
      });
    });

    it('rejects signup requests with missing fields', async () => {
      const request = createMockRequest({ body: { email: 'ada@example.com' } });
      const response = createMockResponse();

      await authController.signup(request as any, response as any, jest.fn());

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({ message: 'Missing fields' });
    });

    it('rejects invalid login credentials', async () => {
      const request = createMockRequest({
        body: { email: 'ada@example.com', password: 'wrong-password' },
      });
      const response = createMockResponse();
      const user = { comparePassword: jest.fn().mockResolvedValue(false) };

      mockedUserModel.findOne.mockResolvedValue(user);

      await authController.login(request as any, response as any, jest.fn());

      expect(response.status).toHaveBeenCalledWith(401);
      expect(response.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('rotates refresh tokens on refresh', async () => {
      const request = createMockRequest({ cookies: { refreshToken: 'old-refresh-token' } });
      const response = createMockResponse();
      const user = {
        _id: 'user-1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'admin',
        removeRefreshToken: jest.fn().mockResolvedValue(undefined),
        addRefreshToken: jest.fn().mockResolvedValue(undefined),
      };

      mockedUserModel.findOne.mockResolvedValue(user);
      mockedJwt.sign.mockReturnValue('new-access-token');

      await authController.refresh(request as any, response as any, jest.fn());

      expect(user.removeRefreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect(user.addRefreshToken).toHaveBeenCalledWith(expect.any(String));
      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.any(Object)
      );
      expect(response.json).toHaveBeenCalledWith({
        token: 'new-access-token',
        user: {
          id: 'user-1',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'admin',
        },
      });
    });

    it('clears the refresh token cookie on logout', async () => {
      const request = createMockRequest({ cookies: { refreshToken: 'logout-token' } });
      const response = createMockResponse();
      const user = {
        removeRefreshToken: jest.fn().mockResolvedValue(undefined),
      };

      mockedUserModel.findOne.mockResolvedValue(user);

      await authController.logout(request as any, response as any, jest.fn());

      expect(user.removeRefreshToken).toHaveBeenCalledWith('logout-token');
      expect(response.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(response.status).toHaveBeenCalledWith(204);
      expect(response.end).toHaveBeenCalled();
    });

    it('does not reveal whether an email exists during forgot password', async () => {
      const request = createMockRequest({ body: { email: 'missing@example.com' } });
      const response = createMockResponse();

      mockedUserModel.findOne.mockResolvedValue(null);

      await authController.forgotPassword(request as any, response as any, jest.fn());

      expect(response.json).toHaveBeenCalledWith({
        message: 'If an account exists, a reset link has been sent',
      });
    });

    it('rejects password reset requests with invalid tokens', async () => {
      const request = createMockRequest({
        body: { token: 'bad-token', email: 'ada@example.com', password: 'new-secret' },
      });
      const response = createMockResponse();

      mockedUserModel.findOne.mockResolvedValue(null);

      await authController.resetPassword(request as any, response as any, jest.fn());

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    });
  });

  describe('productsController', () => {
    it('returns paginated products', async () => {
      const request = createMockRequest({ query: { page: '2', limit: '5' } });
      const response = createMockResponse();
      const products = [
        { _id: 'p1', name: 'Keyboard' },
        { _id: 'p2', name: 'Mouse' },
      ];

      mockedProductModel.find.mockReturnValue(createListQuery(products));
      mockedProductModel.countDocuments.mockResolvedValue(12);

      await productsController.getProducts(request as any, response as any);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        total: 12,
        page: 2,
        pages: 3,
        data: products,
      });
    });

    it('returns 404 when a product cannot be found', async () => {
      const request = createMockRequest({ params: { id: 'missing' } });
      const response = createMockResponse();

      mockedProductModel.findById.mockResolvedValue(null);

      await productsController.getProductById(request as any, response as any);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith({ message: 'Product not found' });
    });

    it('creates a product', async () => {
      const request = createMockRequest({
        body: { name: 'Headphones', price: 149, category: 'Audio', stock: 10 },
      });
      const response = createMockResponse();
      const product = { _id: 'p3', name: 'Headphones', price: 149, category: 'Audio', stock: 10 };

      mockedProductModel.create.mockResolvedValue(product);

      await productsController.createProduct(request as any, response as any);

      expect(response.status).toHaveBeenCalledWith(201);
      expect(response.json).toHaveBeenCalledWith(product);
    });

    it('returns 404 when updating a missing product', async () => {
      const request = createMockRequest({ params: { id: 'missing' }, body: { stock: 2 } });
      const response = createMockResponse();

      mockedProductModel.findByIdAndUpdate.mockResolvedValue(null);

      await productsController.updateProduct(request as any, response as any);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith({ message: 'Product not found' });
    });

    it('deletes a product', async () => {
      const request = createMockRequest({ params: { id: 'p3' } });
      const response = createMockResponse();

      mockedProductModel.findByIdAndDelete.mockResolvedValue({ _id: 'p3' });

      await productsController.deleteProduct(request as any, response as any);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({ message: 'Product deleted successfully' });
    });
  });

  describe('ordersController', () => {
    it('creates an order with server-calculated totals', async () => {
      const request = createMockRequest({
        user: { _id: 'user-1' },
        body: {
          products: [
            { product: 'p1', quantity: 2 },
            { product: 'p2', quantity: 1 },
          ],
        },
      });
      const response = createMockResponse();
      const order = { _id: 'order-1', total: 35 };

      mockedProductModel.findById
        .mockResolvedValueOnce({ _id: 'p1', price: 10 })
        .mockResolvedValueOnce({ _id: 'p2', price: 15 });
      mockedOrderModel.create.mockResolvedValue(order);

      await ordersController.createOrder(request as any, response as any, jest.fn());

      expect(mockedOrderModel.create).toHaveBeenCalledWith({
        user: 'user-1',
        products: [
          { product: 'p1', quantity: 2, price: 10 },
          { product: 'p2', quantity: 1, price: 15 },
        ],
        total: 35,
        status: 'pending',
      });
      expect(response.status).toHaveBeenCalledWith(201);
      expect(response.json).toHaveBeenCalledWith(order);
    });

    it('rejects invalid order payloads', async () => {
      const request = createMockRequest({ user: { _id: 'user-1' }, body: { products: [] } });
      const response = createMockResponse();

      await ordersController.createOrder(request as any, response as any, jest.fn());

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        message: 'Order must contain at least one product',
      });
    });

    it('forbids users from reading orders they do not own', async () => {
      const request = createMockRequest({
        user: { _id: 'user-1', role: 'user' },
        params: { id: 'order-1' },
      });
      const response = createMockResponse();
      const order = {
        user: { _id: 'user-2' },
        products: [],
      };

      mockedOrderModel.findById.mockReturnValue(createDocumentQuery(order));

      await ordersController.getOrderById(request as any, response as any, jest.fn());

      expect(response.status).toHaveBeenCalledWith(403);
      expect(response.json).toHaveBeenCalledWith({
        message: 'Not authorized to view this order',
      });
    });

    it('deducts stock when an order status moves forward', async () => {
      const request = createMockRequest({
        params: { id: 'order-1' },
        body: { status: 'processing' },
      });
      const response = createMockResponse();
      const product = {
        _id: 'p1',
        name: 'Keyboard',
        stock: 5,
        save: jest.fn().mockResolvedValue(undefined),
      };
      const order = {
        status: 'pending',
        stockUpdated: false,
        products: [{ product: 'p1', quantity: 2 }],
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockedOrderModel.findById.mockResolvedValue(order);
      mockedProductModel.findById.mockResolvedValue(product);

      await ordersController.updateOrderStatus(request as any, response as any, jest.fn());

      expect(product.stock).toBe(3);
      expect(product.save).toHaveBeenCalled();
      expect(order.stockUpdated).toBe(true);
      expect(order.save).toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(order);
    });

    it('rejects order status updates when stock is insufficient', async () => {
      const request = createMockRequest({
        params: { id: 'order-1' },
        body: { status: 'processing' },
      });
      const response = createMockResponse();
      const product = {
        _id: 'p1',
        name: 'Keyboard',
        stock: 1,
        save: jest.fn().mockResolvedValue(undefined),
      };
      const order = {
        status: 'pending',
        stockUpdated: false,
        products: [{ product: 'p1', quantity: 2 }],
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockedOrderModel.findById.mockResolvedValue(order);
      mockedProductModel.findById.mockResolvedValue(product);

      await ordersController.updateOrderStatus(request as any, response as any, jest.fn());

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        message: 'Insufficient stock for product Keyboard',
      });
    });
  });

  describe('usersController', () => {
    it('returns paginated users without sensitive fields', async () => {
      const request = createMockRequest({ query: { page: '1', limit: '2' } });
      const response = createMockResponse();
      const users = [{ _id: 'u1', name: 'Ada' }];

      mockedUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(users),
        }),
      });
      mockedUserModel.countDocuments.mockResolvedValue(4);

      await usersController.getUsers(request as any, response as any, jest.fn());

      expect(response.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        total: 4,
        page: 1,
        pages: 2,
        data: users,
      });
    });

    it('rejects unauthenticated profile requests', async () => {
      const request = createMockRequest();
      const response = createMockResponse();

      await usersController.getProfile(request as any, response as any, jest.fn());

      expect(response.status).toHaveBeenCalledWith(401);
      expect(response.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
    });

    it('returns the authenticated user profile', async () => {
      const request = createMockRequest({ user: { _id: 'u1', name: 'Ada' } });
      const response = createMockResponse();

      await usersController.getProfile(request as any, response as any, jest.fn());

      expect(response.json).toHaveBeenCalledWith({ _id: 'u1', name: 'Ada' });
    });
  });

  describe('authMiddleware', () => {
    it('rejects requests without a bearer token', async () => {
      const request = createMockRequest({ headers: {} });
      const response = createMockResponse();
      const next = jest.fn();

      await authMiddleware(request as any, response as any, next);

      expect(response.status).toHaveBeenCalledWith(401);
      expect(response.json).toHaveBeenCalledWith({ message: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('attaches the user for a valid token', async () => {
      const request = createMockRequest({ headers: { authorization: 'Bearer valid-token' } });
      const response = createMockResponse();
      const next = jest.fn();
      const user = { _id: 'u1', name: 'Ada' };

      mockedJwt.verify.mockReturnValue({ id: 'u1' });
      mockedUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });

      await authMiddleware(request as any, response as any, next);

      expect(request.user).toEqual(user);
      expect(next).toHaveBeenCalled();
    });

    it('rejects invalid tokens', async () => {
      const request = createMockRequest({ headers: { authorization: 'Bearer bad-token' } });
      const response = createMockResponse();
      const next = jest.fn();

      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await authMiddleware(request as any, response as any, next);

      expect(response.status).toHaveBeenCalledWith(401);
      expect(response.json).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});