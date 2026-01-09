import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { getToken } from './authService';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface StatisticsData {
  userGrowth: ChartDataPoint[];
  roleDistribution: ChartDataPoint[];
  monthlyUsers: ChartDataPoint[];
  productStats: ChartDataPoint[];
  salesTrend: ChartDataPoint[];
}

// Generate mock data for charts (in a real app, this would come from the backend)
export const getStatisticsData = async (): Promise<StatisticsData> => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // For now, return mock data
    // In production, you would fetch this from your backend API
    return generateMockStatistics();
  } catch (error: any) {
    console.error('Get statistics error:', error);
    // Return mock data even on error for demo purposes
    return generateMockStatistics();
  }
};

const generateMockStatistics = (): StatisticsData => {
  // Generate last 7 days labels
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }

  // User growth over last 7 days (mock data)
  const userGrowth: ChartDataPoint[] = last7Days.map((label, index) => ({
    label,
    value: Math.floor(Math.random() * 20) + 5 + index * 2,
  }));

  // Monthly users (last 6 months)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(date.toLocaleDateString('en-US', { month: 'short' }));
  }

  const monthlyUsers: ChartDataPoint[] = months.map((label, index) => ({
    label,
    value: Math.floor(Math.random() * 50) + 20 + index * 5,
  }));

  // Sales trend (last 7 days)
  const salesTrend: ChartDataPoint[] = last7Days.map((label, index) => ({
    label,
    value: Math.floor(Math.random() * 1000) + 500 + index * 50,
  }));

  // Product stats (mock)
  const productStats: ChartDataPoint[] = [
    { label: 'In Stock', value: Math.floor(Math.random() * 50) + 30 },
    { label: 'Low Stock', value: Math.floor(Math.random() * 10) + 5 },
    { label: 'Out of Stock', value: Math.floor(Math.random() * 5) + 1 },
  ];

  return {
    userGrowth,
    roleDistribution: [], // Will be populated from actual user counts
    monthlyUsers,
    productStats,
    salesTrend,
  };
};

// Get role distribution from user counts
export const getRoleDistributionData = (
  stalkist: number,
  dellear: number,
  salesman: number
): ChartDataPoint[] => {
  return [
    { label: 'Stalkist', value: stalkist, color: '#059669' },
    { label: 'Dellear', value: dellear, color: '#7C3AED' },
    { label: 'Salesman', value: salesman, color: '#2563EB' },
  ];
};

