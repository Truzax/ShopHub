import { AnalyticsService } from '../services/analyticsService';
import Order from '../models/Order';

jest.mock('../models/Order');

describe('Analytics Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardData', () => {
    it('should aggregate and return formatted dashboard data', async () => {
      const mockAggregatedData = [
        {
          revenueOverTime: [{ date: '2026-05-14', revenue: 100 }],
          totalOrders: [{ count: 1 }],
          ordersByStatus: [{ status: 'completed', count: 1 }],
          topProducts: [{ name: 'Product A', revenue: 100 }],
          recentOrders: [{ id: '1', customer: 'User 1', total: 100, status: 'completed', date: '2026-05-14' }],
          categoryDistribution: [{ name: 'Electronics', value: 1 }],
          activeCustomers: [{ count: 1 }],
          avgOrderValue: [{ avg: 100 }],
          hourlyOrders: [{ hour: '10:00', count: 1 }],
          customerOrderCounts: [{ _id: 'user1', count: 1 }]
        }
      ];

      (Order.aggregate as jest.Mock).mockResolvedValue(mockAggregatedData);

      const result = await AnalyticsService.getDashboardData('2026-05-01', '2026-05-14');

      expect(Order.aggregate).toHaveBeenCalledTimes(2); // once for current, once for previous

      expect(result).toHaveProperty('totalOrders', 1);
      expect(result).toHaveProperty('avgOrderValue', 100);
      expect(result).toHaveProperty('categoryDistribution');
      expect(result).toHaveProperty('trends');
      expect(result.trends).toHaveProperty('revenue');
    });

    it('should calculate trends correctly when previous data is missing', async () => {
      const currentData = [{
        revenueOverTime: [{ date: '2026-05-14', revenue: 100 }],
        totalOrders: [{ count: 1 }],
        activeCustomers: [{ count: 1 }],
        avgOrderValue: [{ avg: 100 }],
        customerOrderCounts: []
      }];
      
      const previousData = [{
        // Empty data for previous period
      }];

      (Order.aggregate as jest.Mock)
        .mockResolvedValueOnce(currentData)
        .mockResolvedValueOnce(previousData);

      const result = await AnalyticsService.getDashboardData('2026-05-01', '2026-05-14');
      
      expect(result.trends.revenue).toBe(100);
      expect(result.trends.orders).toBe(100);
    });
  });
});