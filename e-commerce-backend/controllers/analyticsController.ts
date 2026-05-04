import { Request, Response, NextFunction } from 'express';
import { AnalyticsService, DashboardResponse } from '../services/analyticsService';

/**
 * Get analytics dashboard data
 * Query parameters:
 *   - startDate (required): ISO date string
 *   - endDate (required): ISO date string
 *   - category (optional): Product category filter
 */
export const getDashboardData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, category } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: 'startDate and endDate query parameters are required',
      });
      return;
    }

    // Fetch analytics data
    const dashboardData: DashboardResponse = await AnalyticsService.getDashboardData(
      startDate as string,
      endDate as string,
      category as string | undefined
    );

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    next(error); // Pass to global error handler middleware
  }
};
