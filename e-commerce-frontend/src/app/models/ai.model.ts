export interface AiSalesSummary {
  revenue: { value: string; trend: string; isPositive: boolean; insight: string };
  bestSelling: { category: string; insight: string };
  growth: { value: string; isPositive: boolean; insight: string };
  improvementArea: { area: string; insight: string };
  customerPattern: { insight: string };
}

export interface AiPerformanceInsight {
  type: 'warning' | 'success' | 'info' | 'recommendation';
  title: string;
  description: string;
}

export interface AiProductDescription {
  shortDescription: string;
  longDescription: string;
  bulletPoints: string[];
  seoKeywords: string[];
}

export interface AiChatResponse {
  response: string;
}
