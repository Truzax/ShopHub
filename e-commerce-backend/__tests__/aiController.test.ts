import { Request, Response } from 'express';
import { getSalesSummary, getPerformanceInsights, generateProductDescription, handleChat } from '../controllers/aiController';
import Order from '../models/Order';
import Product from '../models/Product';
import AiConversation from '../models/AiConversation';
import AiCache from '../models/AiCache';
import { AiService } from '../services/aiService';

jest.mock('../models/Order');
jest.mock('../models/Product');
jest.mock('../models/AiConversation');
jest.mock('../models/AiCache');
jest.mock('../services/aiService');

describe('AI Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      query: {},
      body: {},
      user: { id: 'user123', role: 'admin' }
    } as any;
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getSalesSummary', () => {
    it('should return cached data if available and fresh', async () => {
      const mockCached = { data: 'Cached Summary', lastDataUpdate: new Date('2026-05-10') };
      
      (Order.find as jest.Mock).mockReturnValue({
        populate: () => ({ limit: () => ({ lean: jest.fn().mockResolvedValue([]) }) })
      });

      (Order.findOne as jest.Mock).mockReturnValue({
        sort: () => ({ select: () => ({ lean: jest.fn().mockResolvedValue({ updatedAt: new Date('2026-05-09') }) }) })
      });
      (AiCache.findOne as jest.Mock).mockResolvedValue(mockCached);

      await getSalesSummary(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, summary: 'Cached Summary' });
    });

    it('should generate new summary with filters if cache is missed or stale', async () => {
      mockReq.query = { startDate: '2026-01-01', endDate: '2026-01-31', category: 'Electronics' };
      (Order.findOne as jest.Mock).mockReturnValue({
        sort: () => ({ select: () => ({ lean: jest.fn().mockResolvedValue(null) }) })
      });
      (AiCache.findOne as jest.Mock).mockResolvedValue(null);
      
      const mockOrders = [
          { total: 100, date: new Date(), products: [{ product: { name: 'Item', category: 'Electronics' }, quantity: 1, price: 100 }] },
          { total: 50, date: new Date(), products: [{ product: { name: 'Item2', category: 'Other' }, quantity: 1, price: 50 }] }
      ];

      (Order.find as jest.Mock).mockReturnValue({
        populate: () => ({ limit: () => ({ lean: jest.fn().mockResolvedValue(mockOrders) }) })
      });
      
      (AiService.generateSalesSummary as jest.Mock).mockResolvedValue('New Summary');
      (AiCache.findOneAndUpdate as jest.Mock).mockResolvedValue({});

      await getSalesSummary(mockReq as Request, mockRes as Response);
      
      expect(AiService.generateSalesSummary).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, summary: 'New Summary' });
    });

    it('should handle errors', async () => {
      const error = new Error('DB error');
      (Order.find as jest.Mock).mockImplementation(() => { throw error; });
      await getSalesSummary(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPerformanceInsights', () => {
    it('should return cached data if fresh', async () => {
      const mockCached = { data: 'Cached Insights', lastDataUpdate: new Date('2026-06-10') };
      
      (Product.find as jest.Mock).mockReturnValue({ select: () => ({ lean: jest.fn().mockResolvedValue([]) }) });
      (Order.find as jest.Mock).mockReturnValue({ sort: () => ({ limit: () => ({ populate: () => ({ lean: jest.fn().mockResolvedValue([]) }) }) }) });

      (Order.findOne as jest.Mock).mockReturnValue({
        sort: () => ({ select: () => ({ lean: jest.fn().mockResolvedValue({ updatedAt: new Date('2026-06-01') }) }) })
      });
      (Product.findOne as jest.Mock).mockReturnValue({
        sort: () => ({ select: () => ({ lean: jest.fn().mockResolvedValue({ updatedAt: new Date('2026-06-02') }) }) })
      });
      (AiCache.findOne as jest.Mock).mockResolvedValue(mockCached);

      await getPerformanceInsights(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, insights: 'Cached Insights' });
    });

    it('should generate new insights if cache is stale', async () => {
      (Product.find as jest.Mock).mockReturnValue({ select: () => ({ lean: jest.fn().mockResolvedValue([{ _id: 'p1', name: 'P1', category: 'C1', stock: 10 }]) }) });
      (Order.find as jest.Mock).mockReturnValue({ sort: () => ({ limit: () => ({ populate: () => ({ lean: jest.fn().mockResolvedValue([{ date: new Date(), products: [{ product: { name: 'P1' }, quantity: 2 }] }]) }) }) }) });

      (Order.findOne as jest.Mock).mockReturnValue({
        sort: () => ({ select: () => ({ lean: jest.fn().mockResolvedValue(null) }) })
      });
      (Product.findOne as jest.Mock).mockReturnValue({
        sort: () => ({ select: () => ({ lean: jest.fn().mockResolvedValue(null) }) })
      });
      (AiCache.findOne as jest.Mock).mockResolvedValue(null);
      (AiService.generatePerformanceInsights as jest.Mock).mockResolvedValue('New Insights');
      
      await getPerformanceInsights(mockReq as Request, mockRes as Response);
      
      expect(AiService.generatePerformanceInsights).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, insights: 'New Insights' });
    });

    it('should handle errors', async () => {
      const error = new Error('DB error');
      (Product.find as jest.Mock).mockImplementation(() => { throw error; });
      await getPerformanceInsights(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('generateProductDescription', () => {
    it('should return 400 if name or category missing', async () => {
      mockReq.body = { name: 'Test' };
      await generateProductDescription(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should generate description successfully', async () => {
      mockReq.body = { name: 'Test', category: 'Electronics' };
      (AiService.generateProductDescription as jest.Mock).mockResolvedValue('Description');
      await generateProductDescription(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, generatedData: 'Description' });
    });

    it('should handle errors', async () => {
      mockReq.body = { name: 'Test', category: 'Electronics' };
      const error = new Error('Error');
      (AiService.generateProductDescription as jest.Mock).mockRejectedValue(error);
      await generateProductDescription(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('handleChat', () => {
    it('should return 400 if message is missing', async () => {
      await handleChat(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should process chat and return response for admin, creating a new conversation', async () => {
      mockReq.body = { message: 'Hello' };
      
      (AiConversation.findOne as jest.Mock).mockResolvedValue(null);
      (AiConversation as unknown as jest.Mock).mockImplementation((data) => ({
         ...data,
         save: jest.fn().mockResolvedValue(true)
      }));

      (Product.find as jest.Mock).mockReturnValue({ select: () => ({ lean: jest.fn().mockResolvedValue([]) }) });
      (Order.find as jest.Mock).mockReturnValue({
        sort: () => ({ limit: () => ({ select: () => ({ lean: jest.fn().mockResolvedValue([]) }) }) })
      });
      
      (AiService.handleChat as jest.Mock).mockResolvedValue('Admin AI Reply');

      await handleChat(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, response: 'Admin AI Reply' });
    });

    it('should process chat and return response for customer, trimming old messages', async () => {
      mockReq.body = { message: 'Hello' };
      mockReq.user = { id: 'user123', role: 'customer' } as any;

      const mockConversation = {
        userId: 'user123',
        messages: Array(15).fill({ role: 'user', content: 'old' }),
        save: jest.fn().mockResolvedValue(true)
      };
      
      (AiConversation.findOne as jest.Mock).mockResolvedValue(mockConversation);
      (Product.find as jest.Mock).mockReturnValue({ select: () => ({ limit: () => ({ lean: jest.fn().mockResolvedValue([]) }) }) });
      
      (AiService.handleChat as jest.Mock).mockResolvedValue('Customer AI Reply');

      await handleChat(mockReq as Request, mockRes as Response);
      
      expect(mockConversation.save).toHaveBeenCalled();
      expect(mockConversation.messages.length).toBe(10); // Trimmed to last 10
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, response: 'Customer AI Reply' });
    });

    it('should handle errors', async () => {
      mockReq.body = { message: 'Hello' };
      const error = new Error('DB Error');
      (AiConversation.findOne as jest.Mock).mockRejectedValue(error);
      await handleChat(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
