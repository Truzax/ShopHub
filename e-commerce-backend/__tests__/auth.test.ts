import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Handling the default export commonly used for 'authMiddleware' or named exports
import * as auth from '../middleware/auth';
const authMid = auth.default || (auth as any);

jest.mock('jsonwebtoken');
jest.mock('../models/User');

const createMockRequest = (overrides: Partial<Request> = {}) =>
  ({
    headers: {},
    ...overrides,
  }) as Partial<Request> & { user?: any };

const createMockResponse = () => {
  const response: any = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response as Partial<Response>;
};

describe('authMiddleware', () => {
  const mockedJwt = jwt as jest.Mocked<typeof jwt>;
  const mockedUserModel = User as unknown as jest.Mocked<typeof User>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects requests without a bearer token', async () => {
    const request = createMockRequest({ headers: {} });
    const response = createMockResponse();
    const next = jest.fn();

    // Depending on your actual auth middleware signature:
    // If it's the default export, invoke it directly or specify the correct method
    const middlewareFn = typeof authMid === 'function' ? authMid : (auth as any).default || (Object.values(auth).find(f => typeof f === 'function'));

    await middlewareFn(request as any, response as any, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Not authorized|No token provided|Not authenticated/i) }));
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches the user for a valid token', async () => {
    const request = createMockRequest({ headers: { authorization: 'Bearer valid-token' } });
    const response = createMockResponse();
    const next = jest.fn();
    const user = { _id: 'u1', name: 'Ada' };

    mockedJwt.verify.mockReturnValue({ id: 'u1' } as any);
    
    // Simulate finding the user
    (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(user)
    });

    const middlewareFn = typeof authMid === 'function' ? authMid : (auth as any).default || (Object.values(auth).find(f => typeof f === 'function'));

    await middlewareFn(request as any, response as any, next);

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

    const middlewareFn = typeof authMid === 'function' ? authMid : (auth as any).default || (Object.values(auth).find(f => typeof f === 'function'));

    await middlewareFn(request as any, response as any, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Not authorized|Invalid token/i) }));
    expect(next).not.toHaveBeenCalled();
  });
});
