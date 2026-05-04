import Order from '../models/Order';

export interface DashboardResponse {
  revenueOverTime: Array<{ date: string; revenue: number }>;
  totalOrders: number;
  ordersByStatus: Array<{ status: string; count: number }>;
  topProducts: Array<{ name: string; revenue: number }>;
}

export class AnalyticsService {
  /**
   * Fetch aggregated dashboard data with revenue over time, total orders, and top products
   * Uses MongoDB aggregation pipeline for optimal performance
   */
  static async getDashboardData(
    startDate: string,
    endDate: string,
    category?: string
  ): Promise<DashboardResponse> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const normalizedCategory = category?.trim();

      // Validation
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format. Expected ISO string.');
      }

      const matchStage: any = {
        date: {
          $gte: start,
          $lte: end,
        }
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

      // Apply category filter if provided
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

      // Use $facet to return multiple aggregations in a single query
      pipeline.push({
        $facet: {
          revenueOverTime: [
            { $match: { status: { $ne: 'cancelled' } } }, // Exclude cancelled orders from revenue
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$date' },
                },
                revenue: {
                  $sum: {
                    $multiply: ['$products.price', '$products.quantity'],
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                date: '$_id',
                revenue: 1,
                _id: 0,
              },
            },
          ],
          totalOrders: [
            { $group: { _id: '$_id' } },
            { $count: 'count' },
          ],
          ordersByStatus: [
            // group by order id and status to eliminate duplicates created by $unwind
            { $group: { _id: { orderId: '$_id', status: '$status' } } },
            // then group by status to sum
            { $group: { _id: '$_id.status', count: { $sum: 1 } } },
            { $project: { status: '$_id', count: 1, _id: 0 } },
            { $sort: { status: 1 } },
          ],
          topProducts: [
            { $match: { status: { $ne: 'cancelled' } } }, // Exclude cancelled from top products
            {
              $group: {
                _id: '$productDetails._id',
                name: { $first: '$productDetails.name' },
                revenue: {
                  $sum: {
                    $multiply: ['$products.price', '$products.quantity'],
                  },
                },
              },
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 0,
                name: 1,
                revenue: 1,
              },
            },
          ],
        },
      });

      const result = await Order.aggregate(pipeline);

      if (!result || result.length === 0) {
        return {
          revenueOverTime: [],
          totalOrders: 0,
          ordersByStatus: [],
          topProducts: [],
        };
      }

      const facetData = result[0] ?? {};

      return {
        revenueOverTime: facetData.revenueOverTime || [],
        totalOrders: facetData.totalOrders?.[0]?.count || 0,
        ordersByStatus: facetData.ordersByStatus || [],
        topProducts: facetData.topProducts || [],
      };
    } catch (error) {
      console.error('Analytics Service Error:', error);
      throw error;
    }
  }
}
