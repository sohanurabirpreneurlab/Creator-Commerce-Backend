export interface CreatorPerformanceSummary {
  totalApplications: number;
  approvedApplications: number;
  activeTrackingLinks: number;
  estimatedClicks: number;
  estimatedConversions: number;
  estimatedEarnings: number;
}

export interface CreatorCampaignPerformanceItem {
  campaignId: string;
  campaignTitle: string;
  brandName: string;
  clicks: number;
  conversions: number;
  estimatedEarnings: number;
}

export interface CreatorPerformanceResponse {
  summary: CreatorPerformanceSummary;
  campaignPerformance: CreatorCampaignPerformanceItem[];
  note: string;
}
