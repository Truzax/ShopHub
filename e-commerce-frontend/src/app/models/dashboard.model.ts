export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface TopProduct {
  name: string;
  revenue: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface DashboardData {
  revenueOverTime: RevenuePoint[];
  totalOrders: number;
  ordersByStatus: OrderStatusCount[];
  topProducts: TopProduct[];
}

export interface DashboardFilter {
  startDate: string;
  endDate: string;
  category?: string;
}