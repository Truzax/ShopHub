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

export interface RecentOrder {
  id: string;
  customer: string;
  total: number;
  status: string;
  date: string;
}

export interface CategoryDistribution {
  name: string;
  value: number;
  color: string;
}

export interface DashboardData {
  revenueOverTime: RevenuePoint[];
  totalOrders: number;
  ordersByStatus: OrderStatusCount[];
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  categoryDistribution: CategoryDistribution[];
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

export interface DashboardFilter {
  startDate: string;
  endDate: string;
  category?: string;
}