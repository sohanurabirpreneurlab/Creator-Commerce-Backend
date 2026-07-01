export interface AnalyticsBreakdownItem {
  label: string;
  count: number;
}

export interface BrandAnalyticsSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  totalApplications: number;
  approvedApplications: number;
  totalAmbassadors: number;
  totalContentSubmissions: number;
  approvedContentSubmissions: number;
  totalTrackingLinks: number;
}

export interface PlatformAnalyticsSummary {
  totalBrands: number;
  totalCreators: number;
  totalBrandManagers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalApplications: number;
  totalAmbassadors: number;
  totalContentSubmissions: number;
  totalTrackingLinks: number;
}

export interface BrandAnalyticsResponse {
  summary: BrandAnalyticsSummary;
  campaignStatusBreakdown: AnalyticsBreakdownItem[];
  applicationStatusBreakdown: AnalyticsBreakdownItem[];
  note: string;
}

export interface AdminAnalyticsResponse {
  summary: PlatformAnalyticsSummary;
  campaignStatusBreakdown: AnalyticsBreakdownItem[];
  applicationStatusBreakdown: AnalyticsBreakdownItem[];
  note: string;
}
