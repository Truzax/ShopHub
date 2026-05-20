import { Request, Response, NextFunction } from 'express';
import { AnalyticsService, DashboardResponse } from '../services/analyticsService';
import { catchAsync } from '../middleware/catchAsync';

export const getDashboardData = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
});
