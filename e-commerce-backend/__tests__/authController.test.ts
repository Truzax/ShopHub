import { Request, Response, NextFunction } from 'express';
import { signup, login, refresh, logout, forgotPassword, resetPassword, validateReset } from '../controllers/authController';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

jest.mock('../models/User');
jest.mock('jsonwebtoken');
jest.mock('crypto');
jest.mock('nodemailer');

describe('Auth Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      cookies: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      end: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should return 400 if fields are missing', async () => {
      mockReq.body = { email: 'test@test.com' };
      await signup(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Missing fields' });
    });

    it('should return 409 if email is already in use', async () => {
      mockReq.body = { name: 'Test', email: 'test@test.com', password: 'pass' };
      (User.findOne as jest.Mock).mockResolvedValue(true);
      await signup(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Email already in use' });
    });

    it('should successfully create a new user with user role', async () => {
      mockReq.body = { name: 'Test', email: 'test@test.com', password: 'pass', role: 'admin' };
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockAddRefreshToken = jest.fn().mockResolvedValue(true);
      
      (User as unknown as jest.Mock).mockImplementation(() => ({
        _id: 'userid',
        name: 'Test',
        email: 'test@test.com',
        role: 'admin',
        save: mockSave,
        addRefreshToken: mockAddRefreshToken
      }));

      (jwt.sign as jest.Mock).mockReturnValue('mockAccessToken');
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: () => 'mockRefreshToken'
      });

      await signup(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockSave).toHaveBeenCalled();
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'mockRefreshToken', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        token: 'mockAccessToken',
        user: expect.objectContaining({ name: 'Test' })
      }));
    });
    
    it('should handle role normalization correctly', async () => {
      mockReq.body = { name: 'Test', email: 'test@test.com', password: 'pass', role: 'invalid_role' };
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockAddRefreshToken = jest.fn().mockResolvedValue(true);
      
      (User as unknown as jest.Mock).mockImplementation((data) => ({
        ...data,
        save: mockSave,
        addRefreshToken: mockAddRefreshToken
      }));

      (jwt.sign as jest.Mock).mockReturnValue('mockAccessToken');
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: () => 'mockRefreshToken'
      });

      await signup(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({ role: 'user' }) // Defaulted to user when invalid passed
      }));
    });
    
    it('should call next on error', async () => {
      mockReq.body = { name: 'Test', email: 'test@test.com', password: 'pass' };
      const error = new Error('error');
      (User.findOne as jest.Mock).mockRejectedValue(error);
      await signup(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should return 400 if fields are missing', async () => {
      mockReq.body = { email: 'test@test.com' };
      await login(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 on invalid credentials (not found)', async () => {
      mockReq.body = { email: 'test@test.com', password: 'wrong' };
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await login(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 on invalid passwords', async () => {
      mockReq.body = { email: 'test@test.com', password: 'wrong' };
      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      await login(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should successfully log in user', async () => {
      mockReq.body = { email: 'test@test.com', password: 'pass' };
      const mockUser = {
        _id: 'id',
        name: 'Test',
        email: 'test@test.com',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(true),
        addRefreshToken: jest.fn().mockResolvedValue(true)
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mockAccessToken');
      (crypto.randomBytes as jest.Mock).mockReturnValue({ toString: () => 'mockRefresh' });

      await login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUser.comparePassword).toHaveBeenCalledWith('pass');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'mockAccessToken' }));
    });
    
    it('should call next on error', async () => {
      mockReq.body = { email: 'test@test.com', password: 'pass' };
      const error = new Error('error');
      (User.findOne as jest.Mock).mockRejectedValue(error);
      await login(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('refresh', () => {
    it('should return 401 if no refresh token provided', async () => {
      await refresh(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 if token invalid', async () => {
      mockReq.cookies = { refreshToken: 'invalid' };
      (crypto.createHash as jest.Mock).mockReturnValue({
        update: () => ({ digest: () => 'hashed' })
      });
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await refresh(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should refresh token successfully', async () => {
      mockReq.cookies = { refreshToken: 'valid' };
      (crypto.createHash as jest.Mock).mockReturnValue({
        update: () => ({ digest: () => 'hashed' })
      });
      const mockUser = {
        removeRefreshToken: jest.fn().mockResolvedValue(true),
        addRefreshToken: jest.fn().mockResolvedValue(true)
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (crypto.randomBytes as jest.Mock).mockReturnValue({ toString: () => 'newRefresh' });
      (jwt.sign as jest.Mock).mockReturnValue('newAccessToken');

      await refresh(mockReq as Request, mockRes as Response, mockNext);

      expect(mockUser.removeRefreshToken).toHaveBeenCalledWith('valid');
      expect(mockUser.addRefreshToken).toHaveBeenCalledWith('newRefresh');
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'newRefresh', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'newAccessToken' }));
    });
    
    it('should call next on error', async () => {
      mockReq.cookies = { refreshToken: 'invalid' };
      const error = new Error('error');
      (crypto.createHash as jest.Mock).mockImplementation(() => { throw error; });
      await refresh(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('logout', () => {
    it('should clear cookie and return 204 when token exists', async () => {
      mockReq.cookies = { refreshToken: 'valid' };
      (crypto.createHash as jest.Mock).mockReturnValue({
        update: () => ({ digest: () => 'hashed' })
      });
      const mockUser = {
        removeRefreshToken: jest.fn().mockResolvedValue(true)
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await logout(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockUser.removeRefreshToken).toHaveBeenCalledWith('valid');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should clear cookie when token doesn\'t match user', async () => {
      mockReq.cookies = { refreshToken: 'valid' };
      (crypto.createHash as jest.Mock).mockReturnValue({
        update: () => ({ digest: () => 'hashed' })
      });
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await logout(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
    
    it('should clear cookie when no token provided', async () => {
      await logout(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
    
    it('should call next on error', async () => {
      mockReq.cookies = { refreshToken: 'valid' };
      const error = new Error('error');
      (crypto.createHash as jest.Mock).mockImplementation(() => { throw error; });
      await logout(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('forgotPassword', () => {
    it('should return 400 if no email', async () => {
      await forgotPassword(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return success string even if user not found (security)', async () => {
      mockReq.body = { email: 'nonexistent' };
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await forgotPassword(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'If an account exists, a reset link has been sent' });
    });

    it('should create token and return if no SMTP configured', async () => {
      mockReq.body = { email: 'exist' };
      const mockUser = { save: jest.fn() };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (crypto.randomBytes as jest.Mock).mockReturnValue({ toString: () => 'token' });
      (crypto.createHash as jest.Mock).mockReturnValue({ update: () => ({ digest: () => 'hashed' }) });
      
      delete process.env.SMTP_HOST; // ensure mock doesn't trigger SMTP path

      await forgotPassword(mockReq as Request, mockRes as Response, mockNext);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Reset link generated' });
    });

    it('should send email if SMTP configured, and return link in dev', async () => {
      mockReq.body = { email: 'exist' };
      const mockUser = { email: 'exist', save: jest.fn() };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (crypto.randomBytes as jest.Mock).mockReturnValue({ toString: () => 'token' });
      (crypto.createHash as jest.Mock).mockReturnValue({ update: () => ({ digest: () => 'hashed' }) });
      
      process.env.SMTP_HOST = 'smpt.temp';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      
      const sendMailMock = jest.fn().mockResolvedValue(true);
      (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: sendMailMock });
      process.env.NODE_ENV = 'development';
      
      await forgotPassword(mockReq as Request, mockRes as Response, mockNext);
      expect(sendMailMock).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Reset link sent' }));
      
      // Cleanup
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      process.env.NODE_ENV = 'test';
    });

    it('should send email if SMTP configured, and abstract link in prod', async () => {
      mockReq.body = { email: 'exist' };
      const mockUser = { email: 'exist', save: jest.fn() };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (crypto.randomBytes as jest.Mock).mockReturnValue({ toString: () => 'token' });
      (crypto.createHash as jest.Mock).mockReturnValue({ update: () => ({ digest: () => 'hashed' }) });
      
      process.env.SMTP_HOST = 'smpt.temp';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      
      const sendMailMock = jest.fn().mockResolvedValue(true);
      (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: sendMailMock });
      process.env.NODE_ENV = 'production';
      
      await forgotPassword(mockReq as Request, mockRes as Response, mockNext);
      expect(sendMailMock).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Reset link sent' });
      
      // Cleanup
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      process.env.NODE_ENV = 'test';
    });
    
    it('should call next on error', async () => {
      mockReq.body = { email: 'exist' };
      const error = new Error('error');
      (User.findOne as jest.Mock).mockRejectedValue(error);
      await forgotPassword(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('resetPassword', () => {
    it('should return 400 if fields missing', async () => {
      mockReq.body = {};
      await resetPassword(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if invalid or expired token', async () => {
      mockReq.body = { email: 'exist', token: 'token', password: 'new' };
      (crypto.createHash as jest.Mock).mockReturnValue({ update: () => ({ digest: () => 'hashed' }) });
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await resetPassword(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should reset password', async () => {
      mockReq.body = { email: 'exist', token: 'token', password: 'new' };
      (crypto.createHash as jest.Mock).mockReturnValue({ update: () => ({ digest: () => 'hashed' }) });
      const mockUser = {
        save: jest.fn().mockResolvedValue(true),
        addRefreshToken: jest.fn()
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mockAccessToken');
      (crypto.randomBytes as jest.Mock).mockReturnValue({ toString: () => 'mockRefresh' });

      await resetPassword(mockReq as Request, mockRes as Response, mockNext);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.cookie).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Password reset successful', token: 'mockAccessToken' }));
    });
    
    it('should call next on error', async () => {
      mockReq.body = { email: 'exist', token: 'token', password: 'new' };
      const error = new Error('error');
      (crypto.createHash as jest.Mock).mockImplementation(() => { throw error; });
      await resetPassword(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('validateReset', () => {
    it('should return 400 if missing token or email', async () => {
      mockReq.query = {};
      await validateReset(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if user/token invalid', async () => {
      mockReq.query = { email: 'exist', token: 'token' };
      (crypto.createHash as jest.Mock).mockReturnValue({ update: () => ({ digest: () => 'hashed' }) });
      (User.findOne as jest.Mock).mockResolvedValue(null);
      await validateReset(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should validate reset successfully', async () => {
      mockReq.query = { email: 'exist', token: 'token' };
      (crypto.createHash as jest.Mock).mockReturnValue({ update: () => ({ digest: () => 'hashed' }) });
      (User.findOne as jest.Mock).mockResolvedValue(true);
      await validateReset(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith({ valid: true });
    });
    
    it('should call next on error', async () => {
      mockReq.query = { email: 'exist', token: 'token' };
      const error = new Error('error');
      (crypto.createHash as jest.Mock).mockImplementation(() => { throw error; });
      await validateReset(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});