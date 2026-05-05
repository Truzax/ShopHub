import Order from '../models/Order';

export interface DashboardResponse {
  revenueOverTime: Array<{ date: string; revenue: number }>;
  totalOrders: number;
  ordersByStatus: Array<{ status: string; count: number }>;
  topProducts: Array<{ name: string; revenue: number }>;
  recentOrders: Array<{ id: string; customer: string; total: number; status: string; date: string }>;
  categoryDistribution: Array<{ name: string; value: number; color: string }>;
  activeCustomers: number;
  avgOrderValue: number;
}

export interface DashboardResponse {
  revenueOverTime: Array<{ date: string; revenue: number }>;
  totalOrders: number;
  ordersByStatus: Array<{ status: string; count: number }>;
  topProducts: Array<{ name: string; revenue: number }>;
  recentOrders: Array<{ id: string; customer: string; total: number; status: string; date: string }>;
  categoryDistribution: Array<{ name: string; value: number; color: string }>;
  hourlyOrders: Array<{ hour: string; count: number }>;
  activeCustomers: number;
  avgOrderValue: number;
  returnCustomerRate: number;
  trends: {
    revenue: number;
    orders: number;
    customers: number;
    avgOrderValue: number;
  };
}

export class AnalyticsService {
  static async getDashboardData(
    startDate: string,
    endDate: string,
    category?: string
  ): Promise<DashboardResponse> {
    try {
      const currentStart = new Date(startDate);
      currentStart.setHours(0, 0, 0, 0);
      
      const currentEnd = new Date(endDate);
      currentEnd.setHours(23, 59, 59, 999);
      
      const duration = currentEnd.getTime() - currentStart.getTime();
      const previousStart = new Date(currentStart.getTime() - duration);
      const previousEnd = new Date(currentStart.getTime() - 1);

      console.log(`Fetching analytics for: ${currentStart.toISOString()} to ${currentEnd.toISOString()} (Category: ${category || 'All'})`);

      const [currentData, previousData] = await Promise.all([
        this.fetchAggregatedData(currentStart, currentEnd, category),
        this.fetchAggregatedData(previousStart, previousEnd, category)
      ]);

      console.log(`Fetched current data: ${currentData.totalOrders} orders, previous: ${previousData.totalOrders} orders`);

      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 1000) / 10;
      };

      const currentRevenue = (currentData.revenueOverTime || []).reduce((sum: number, p: any) => sum + p.revenue, 0);
      const previousRevenue = (previousData.revenueOverTime || []).reduce((sum: number, p: any) => sum + p.revenue, 0);

      const currentAvgValue = currentData.avgOrderValue || 0;
      const previousAvgValue = previousData.avgOrderValue || 0;

      return {
        ...currentData,
        trends: {
          revenue: calculateTrend(currentRevenue, previousRevenue),
          orders: calculateTrend(currentData.totalOrders, previousData.totalOrders),
          customers: calculateTrend(currentData.activeCustomers, previousData.activeCustomers),
          avgOrderValue: calculateTrend(currentAvgValue, previousAvgValue)
        }
      };
    } catch (error) {
      console.error('Analytics Service Error:', error);
      throw error;
    }
  }

  private static async fetchAggregatedData(start: Date, end: Date, category?: string) {
    const normalizedCategory = category?.trim();
    const matchStage: any = { 
      date: { $gte: start, $lte: end },
      status: { $nin: ['pending', 'cancelled'] }
    };

    const pipeline: any[] = [
      { $match: matchStage },
      { $unwind: { path: '$products', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'products',
          localField: 'products.product',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
    ];

    if (normalizedCategory) {
      pipeline.push({
        $match: {
          'productDetails.category': {
            $regex: `^${normalizedCategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
            $options: 'i',
          },
        },
      });
    }

    pipeline.push({
      $facet: {
        revenueOverTime: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              revenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { date: '$_id', revenue: 1, _id: 0 } },
        ],
        totalOrders: [
          { $group: { _id: '$_id' } },
          { $count: 'count' },
        ],
        ordersByStatus: [
          { $group: { _id: { orderId: '$_id', status: '$status' } } },
          { $group: { _id: '$_id.status', count: { $sum: 1 } } },
          { $project: { status: '$_id', count: 1, _id: 0 } },
          { $sort: { status: 1 } },
        ],
        topProducts: [
          {
            $group: {
              _id: '$productDetails._id',
              name: { $first: '$productDetails.name' },
              revenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: 5 },
          { $project: { _id: 0, name: 1, revenue: 1 } },
        ],
        recentOrders: [
          {
            $group: {
              _id: '$_id',
              user: { $first: '$user' },
              total: { $first: '$total' },
              status: { $first: '$status' },
              date: { $first: '$date' },
            },
          },
          { $sort: { date: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'userDetails',
            },
          },
          { $unwind: '$userDetails' },
          {
            $project: {
              id: '$_id',
              customer: '$userDetails.name',
              total: 1,
              status: 1,
              date: 1,
              _id: 0,
            },
          },
        ],
        categoryDistribution: [
          { $group: { _id: '$productDetails.category', value: { $sum: 1 } } },
          { $project: { name: '$_id', value: 1, _id: 0 } },
        ],
        activeCustomers: [
          { $group: { _id: '$user' } },
          { $count: 'count' },
        ],
        avgOrderValue: [
          { $group: { _id: '$_id', total: { $first: '$total' } } },
          { $group: { _id: null, avg: { $avg: '$total' } } },
        ],
        hourlyOrders: [
          { $group: { _id: '$_id', date: { $first: '$date' } } },
          {
            $group: {
              _id: { $hour: '$date' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              hour: { $concat: [{ $toString: '$_id' }, ':00'] },
              count: 1,
              _id: 0
            }
          }
        ],
        customerOrderCounts: [
          { $group: { _id: '$_id', user: { $first: '$user' } } },
          { $group: { _id: '$user', count: { $sum: 1 } } },
        ]
      },
    });

    const result = await Order.aggregate(pipeline);
    const facetData = result[0] || {};
    const colorMap: Record<string, string> = {
      'Electronics': '#4f46e5',
      'Clothing': '#14b8a6',
      'Home': '#f59e0b',
      'Books': '#8b5cf6',
      'Toys': '#ec4899',
      'Smartphone': '#4f46e5',
      'Laptop': '#6366f1',
      'Headphones': '#14b8a6',
      'Tablet': '#f59e0b',
      'Wearable': '#8b5cf6',
      'Peripheral': '#ec4899',
      'Accessory': '#f43f5e',
      'Storage': '#06b6d4',
      'Smart Home': '#10b981',
      'Audio': '#f97316',
      'Component': '#64748b',
      'Gaming': '#d946ef',
      'Audio/Video': '#84cc16',
      'Photography': '#0ea5e9',
      'Furniture': '#a855f7'
    };
    const defaultColors = ['#4f46e5', '#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899'];
    
    const totalCustomers = facetData.customerOrderCounts?.length || 0;
    const returningCustomers = facetData.customerOrderCounts?.filter((c: any) => c.count > 1).length || 0;
    const returnCustomerRate = totalCustomers > 0 ? Math.round((returningCustomers / totalCustomers) * 1000) / 10 : 0;

    return {
      revenueOverTime: facetData.revenueOverTime || [],
      totalOrders: facetData.totalOrders?.[0]?.count || 0,
      ordersByStatus: facetData.ordersByStatus || [],
      topProducts: facetData.topProducts || [],
      recentOrders: facetData.recentOrders || [],
      categoryDistribution: (facetData.categoryDistribution || []).map((c: any, i: number) => ({
        ...c,
        color: colorMap[c.name] || defaultColors[i % defaultColors.length]
      })),
      hourlyOrders: facetData.hourlyOrders || [],
      activeCustomers: facetData.activeCustomers?.[0]?.count || 0,
      avgOrderValue: Math.round((facetData.avgOrderValue?.[0]?.avg || 0) * 100) / 100,
      returnCustomerRate
    };
  }
}
