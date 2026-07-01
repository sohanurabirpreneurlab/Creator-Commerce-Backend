import { Pool } from "pg";
import {
  AnalyticsBreakdownItem,
  BrandAnalyticsSummary,
  PlatformAnalyticsSummary,
} from "../interfaces/analytics.interface.js";

export class AnalyticsRepository {
  constructor(private readonly databasePool: Pool) {}

  public async getBrandSummary(brandId: string): Promise<BrandAnalyticsSummary> {
    const result = await this.databasePool.query(
      `
        select
          (select count(*)::int from public.campaigns where brand_id = $1) as total_campaigns,
          (select count(*)::int from public.campaigns where brand_id = $1 and status = 'ACTIVE') as active_campaigns,
          (
            select count(*)::int
            from public.campaign_applications ca
            inner join public.campaigns c on c.id = ca.campaign_id
            where c.brand_id = $1
          ) as total_applications,
          (
            select count(*)::int
            from public.campaign_applications ca
            inner join public.campaigns c on c.id = ca.campaign_id
            where c.brand_id = $1
              and ca.status = 'APPROVED'
          ) as approved_applications,
          (select count(*)::int from public.brand_ambassadors where brand_id = $1) as total_ambassadors,
          (
            select count(*)::int
            from public.content_submissions cs
            inner join public.campaigns c on c.id = cs.campaign_id
            where c.brand_id = $1
          ) as total_content_submissions,
          (
            select count(*)::int
            from public.content_submissions cs
            inner join public.campaigns c on c.id = cs.campaign_id
            where c.brand_id = $1
              and cs.status = 'APPROVED'
          ) as approved_content_submissions,
          (select count(*)::int from public.tracking_links where brand_id = $1) as total_tracking_links
      `,
      [brandId],
    );

    const row = result.rows[0] ?? {};
    return {
      totalCampaigns: Number(row.total_campaigns ?? 0),
      activeCampaigns: Number(row.active_campaigns ?? 0),
      totalApplications: Number(row.total_applications ?? 0),
      approvedApplications: Number(row.approved_applications ?? 0),
      totalAmbassadors: Number(row.total_ambassadors ?? 0),
      totalContentSubmissions: Number(row.total_content_submissions ?? 0),
      approvedContentSubmissions: Number(row.approved_content_submissions ?? 0),
      totalTrackingLinks: Number(row.total_tracking_links ?? 0),
    };
  }

  public async getPlatformSummary(): Promise<PlatformAnalyticsSummary> {
    const result = await this.databasePool.query(
      `
        select
          (select count(*)::int from public.brands) as total_brands,
          (select count(*)::int from public.creator_profiles) as total_creators,
          (select count(*)::int from public.brand_managers) as total_brand_managers,
          (select count(*)::int from public.campaigns) as total_campaigns,
          (select count(*)::int from public.campaigns where status = 'ACTIVE') as active_campaigns,
          (select count(*)::int from public.campaign_applications) as total_applications,
          (select count(*)::int from public.brand_ambassadors) as total_ambassadors,
          (select count(*)::int from public.content_submissions) as total_content_submissions,
          (select count(*)::int from public.tracking_links) as total_tracking_links
      `,
    );

    const row = result.rows[0] ?? {};
    return {
      totalBrands: Number(row.total_brands ?? 0),
      totalCreators: Number(row.total_creators ?? 0),
      totalBrandManagers: Number(row.total_brand_managers ?? 0),
      totalCampaigns: Number(row.total_campaigns ?? 0),
      activeCampaigns: Number(row.active_campaigns ?? 0),
      totalApplications: Number(row.total_applications ?? 0),
      totalAmbassadors: Number(row.total_ambassadors ?? 0),
      totalContentSubmissions: Number(row.total_content_submissions ?? 0),
      totalTrackingLinks: Number(row.total_tracking_links ?? 0),
    };
  }

  public async getCampaignStatusBreakdownByBrand(
    brandId: string,
  ): Promise<AnalyticsBreakdownItem[]> {
    return this.getBreakdown(
      `
        select c.status as label, count(*)::int as count
        from public.campaigns c
        where c.brand_id = $1
        group by c.status
        order by c.status asc
      `,
      [brandId],
    );
  }

  public async getCampaignStatusBreakdown(): Promise<AnalyticsBreakdownItem[]> {
    return this.getBreakdown(
      `
        select status as label, count(*)::int as count
        from public.campaigns
        group by status
        order by status asc
      `,
    );
  }

  public async getApplicationStatusBreakdownByBrand(
    brandId: string,
  ): Promise<AnalyticsBreakdownItem[]> {
    return this.getBreakdown(
      `
        select ca.status as label, count(*)::int as count
        from public.campaign_applications ca
        inner join public.campaigns c on c.id = ca.campaign_id
        where c.brand_id = $1
        group by ca.status
        order by ca.status asc
      `,
      [brandId],
    );
  }

  public async getApplicationStatusBreakdown(): Promise<AnalyticsBreakdownItem[]> {
    return this.getBreakdown(
      `
        select status as label, count(*)::int as count
        from public.campaign_applications
        group by status
        order by status asc
      `,
    );
  }

  private async getBreakdown(
    query: string,
    values: Array<string> = [],
  ): Promise<AnalyticsBreakdownItem[]> {
    const result = await this.databasePool.query(query, values);
    return result.rows.map((row) => ({
      label: String(row.label),
      count: Number(row.count ?? 0),
    }));
  }
}
