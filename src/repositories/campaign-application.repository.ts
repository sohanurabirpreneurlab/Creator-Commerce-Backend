import { Pool } from "pg";
import {
  CampaignApplicationStatus,
  ProposedContentType,
} from "../constants/campaign.constants.js";
import { SocialPlatform } from "../constants/social-platform.js";
import {
  CampaignApplication,
  CreatorApplicationListItem,
  CampaignApplicationListFilters,
  ReviewerApplicationListItem,
} from "../interfaces/campaign-application.interface.js";

export class CampaignApplicationRepository {
  constructor(private readonly databasePool: Pool) {}

  public async create(data: {
    campaignId: string;
    creatorProfileId: string;
    status: CampaignApplicationStatus;
    message: string | null;
    proposedContentType: ProposedContentType | null;
    primaryPlatform: SocialPlatform | null;
    expectedPostDate: string | null;
  }): Promise<CampaignApplication> {
    const result = await this.databasePool.query(
      `
        insert into public.campaign_applications (
          campaign_id,
          creator_profile_id,
          status,
          message,
          proposed_content_type,
          primary_platform,
          expected_post_date
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        returning *
      `,
      [
        data.campaignId,
        data.creatorProfileId,
        data.status,
        data.message,
        data.proposedContentType,
        data.primaryPlatform,
        data.expectedPostDate,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  public async findById(id: string): Promise<CampaignApplication | null> {
    const result = await this.databasePool.query(
      `select * from public.campaign_applications where id = $1 limit 1`,
      [id],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  public async findByCampaignAndCreator(
    campaignId: string,
    creatorProfileId: string,
  ): Promise<CampaignApplication | null> {
    const result = await this.databasePool.query(
      `
        select *
        from public.campaign_applications
        where campaign_id = $1
          and creator_profile_id = $2
        limit 1
      `,
      [campaignId, creatorProfileId],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  public async findManyByCreatorProfileId(
    creatorProfileId: string,
    filters: CampaignApplicationListFilters,
  ): Promise<{ data: CampaignApplication[]; total: number }> {
    return this.findManyInternal(filters, {
      clause: "ca.creator_profile_id = $1",
      values: [creatorProfileId],
    });
  }

  public async findMyApplicationsWithCampaignSummary(
    creatorProfileId: string,
    filters: CampaignApplicationListFilters,
  ): Promise<{ data: CreatorApplicationListItem[]; total: number }> {
    return this.findManyDetailedInternal(filters, {
      clause: "ca.creator_profile_id = $1",
      values: [creatorProfileId],
    });
  }

  public async findManyByBrandId(
    brandId: string,
    filters: CampaignApplicationListFilters,
  ): Promise<{ data: ReviewerApplicationListItem[]; total: number }> {
    return this.findManyReviewerDetailedInternal(filters, {
      clause: "c.brand_id = $1",
      values: [brandId],
    });
  }

  public async findMany(
    filters: CampaignApplicationListFilters,
  ): Promise<{ data: ReviewerApplicationListItem[]; total: number }> {
    return this.findManyReviewerDetailedInternal(filters);
  }

  public async findDetailedById(
    id: string,
  ): Promise<ReviewerApplicationListItem | null> {
    const result = await this.databasePool.query(
      `
        select
          ca.*,
          c.id as campaign_entity_id,
          c.title as campaign_title,
          c.objective as campaign_objective,
          c.status as campaign_status,
          c.start_date as campaign_start_date,
          c.end_date as campaign_end_date,
          b.id as brand_entity_id,
          b.name as brand_name,
          b.logo_url as brand_logo_url,
          cp.id as creator_entity_id,
          cp.display_name as creator_display_name,
          cp.category as creator_category,
          cp.location as creator_location,
          u.email as creator_user_email
        from public.campaign_applications ca
        inner join public.campaigns c
          on c.id = ca.campaign_id
        inner join public.brands b
          on b.id = c.brand_id
        inner join public.creator_profiles cp
          on cp.id = ca.creator_profile_id
        inner join public.users u
          on u.id = cp.user_id
        where ca.id = $1
        limit 1
      `,
      [id],
    );

    return result.rowCount === 0
      ? null
      : this.mapRowToReviewerApplicationListItem(result.rows[0]);
  }

  public async countByBrandId(
    brandId: string,
    filters: Pick<CampaignApplicationListFilters, "status"> = {},
  ): Promise<number> {
    const values: Array<string> = [brandId];
    const whereClauses = ["c.brand_id = $1"];

    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`ca.status = $${values.length}`);
    }

    const result = await this.databasePool.query(
      `
        select count(*)::int as total
        from public.campaign_applications ca
        inner join public.campaigns c
          on c.id = ca.campaign_id
        where ${whereClauses.join(" and ")}
      `,
      values,
    );

    return Number(result.rows[0]?.total ?? 0);
  }

  public async countAllWithFilters(
    filters: Pick<CampaignApplicationListFilters, "status"> = {},
  ): Promise<number> {
    const values: Array<string> = [];
    const whereClauses: string[] = [];

    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`status = $${values.length}`);
    }

    const result = await this.databasePool.query(
      `
        select count(*)::int as total
        from public.campaign_applications
        ${whereClauses.length > 0 ? `where ${whereClauses.join(" and ")}` : ""}
      `,
      values,
    );

    return Number(result.rows[0]?.total ?? 0);
  }

  public async findManyRawByBrandId(
    brandId: string,
    filters: CampaignApplicationListFilters,
  ): Promise<{ data: CampaignApplication[]; total: number }> {
    return this.findManyInternal(filters, {
      clause: "c.brand_id = $1",
      values: [brandId],
    });
  }

  public async updateStatus(
    id: string,
    status: CampaignApplicationStatus,
    metadata?: {
      reviewedAt?: string | null;
      reviewedBy?: string | null;
      rejectionReason?: string | null;
    },
  ): Promise<CampaignApplication | null> {
    const result = await this.databasePool.query(
      `
        update public.campaign_applications
        set
          status = $2,
          reviewed_at = coalesce($3::timestamptz, reviewed_at),
          reviewed_by = coalesce($4::uuid, reviewed_by),
          rejection_reason = $5,
          updated_at = now()
        where id = $1
        returning *
      `,
      [
        id,
        status,
        metadata?.reviewedAt ?? null,
        metadata?.reviewedBy ?? null,
        metadata?.rejectionReason ?? null,
      ],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  public async count(filters: CampaignApplicationListFilters): Promise<number> {
    const values: Array<string> = [];
    const whereClauses: string[] = [];

    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`status = $${values.length}`);
    }

    const result = await this.databasePool.query(
      `
        select count(*)::int as total
        from public.campaign_applications
        ${whereClauses.length > 0 ? `where ${whereClauses.join(" and ")}` : ""}
      `,
      values,
    );

    return Number(result.rows[0]?.total ?? 0);
  }

  private async findManyInternal(
    filters: CampaignApplicationListFilters,
    base: { clause: string; values: Array<string> },
  ) {
    const values: Array<string | number> = [...base.values];
    const whereClauses = [base.clause];

    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`ca.status = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      const placeholder = `$${values.length}`;
      whereClauses.push(`(c.title ilike ${placeholder} or b.name ilike ${placeholder})`);
    }

    values.push(filters.limit);
    values.push((filters.page - 1) * filters.limit);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;

    const result = await this.databasePool.query(
      `
        select
          ca.*,
          count(*) over() as total_count
        from public.campaign_applications ca
        inner join public.campaigns c
          on c.id = ca.campaign_id
        inner join public.brands b
          on b.id = c.brand_id
        where ${whereClauses.join(" and ")}
        order by ca.applied_at desc
        limit $${limitIndex}
        offset $${offsetIndex}
      `,
      values,
    );

    return {
      data: result.rows.map((row) => this.mapRow(row)),
      total: result.rows.length === 0 ? 0 : Number(result.rows[0].total_count ?? 0),
    };
  }

  private mapRow(row: Record<string, unknown>): CampaignApplication {
    return {
      id: String(row.id),
      campaignId: String(row.campaign_id),
      creatorProfileId: String(row.creator_profile_id),
      status: String(row.status) as CampaignApplicationStatus,
      message: row.message === null ? null : String(row.message),
      proposedContentType:
        row.proposed_content_type === null
          ? null
          : (String(row.proposed_content_type) as ProposedContentType),
      primaryPlatform:
        row.primary_platform === null
          ? null
          : (String(row.primary_platform) as SocialPlatform),
      expectedPostDate:
        row.expected_post_date instanceof Date
          ? row.expected_post_date.toISOString()
          : row.expected_post_date === null
            ? null
            : String(row.expected_post_date),
      appliedAt:
        row.applied_at instanceof Date
          ? row.applied_at.toISOString()
          : String(row.applied_at),
      reviewedAt:
        row.reviewed_at instanceof Date
          ? row.reviewed_at.toISOString()
          : row.reviewed_at === null
            ? null
            : String(row.reviewed_at),
      reviewedBy: row.reviewed_by === null ? null : String(row.reviewed_by),
      rejectionReason:
        row.rejection_reason === null ? null : String(row.rejection_reason),
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at),
      updatedAt:
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : String(row.updated_at),
    };
  }

  private async findManyDetailedInternal(
    filters: CampaignApplicationListFilters,
    base: { clause: string; values: Array<string> },
  ) {
    const values: Array<string | number> = [...base.values];
    const whereClauses = [base.clause];

    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`ca.status = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      const placeholder = `$${values.length}`;
      whereClauses.push(`(c.title ilike ${placeholder} or b.name ilike ${placeholder})`);
    }

    values.push(filters.limit);
    values.push((filters.page - 1) * filters.limit);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;

    const result = await this.databasePool.query(
      `
        select
          ca.*,
          c.id as campaign_entity_id,
          c.title as campaign_title,
          c.objective as campaign_objective,
          c.status as campaign_status,
          c.start_date as campaign_start_date,
          c.end_date as campaign_end_date,
          b.id as brand_entity_id,
          b.name as brand_name,
          b.logo_url as brand_logo_url,
          count(*) over() as total_count
        from public.campaign_applications ca
        inner join public.campaigns c
          on c.id = ca.campaign_id
        inner join public.brands b
          on b.id = c.brand_id
        where ${whereClauses.join(" and ")}
        order by ca.applied_at desc
        limit $${limitIndex}
        offset $${offsetIndex}
      `,
      values,
    );

    return {
      data: result.rows.map((row) => this.mapRowToCreatorApplicationListItem(row)),
      total: result.rows.length === 0 ? 0 : Number(result.rows[0].total_count ?? 0),
    };
  }

  private async findManyReviewerDetailedInternal(
    filters: CampaignApplicationListFilters,
    base?: { clause: string; values: Array<string> },
  ) {
    const values: Array<string | number> = [...(base?.values ?? [])];
    const whereClauses = base ? [base.clause] : [];

    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`ca.status = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      const placeholder = `$${values.length}`;
      whereClauses.push(
        `(c.title ilike ${placeholder} or b.name ilike ${placeholder} or cp.display_name ilike ${placeholder} or u.email ilike ${placeholder})`,
      );
    }

    values.push(filters.limit);
    values.push((filters.page - 1) * filters.limit);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;

    const result = await this.databasePool.query(
      `
        select
          ca.*,
          c.id as campaign_entity_id,
          c.title as campaign_title,
          c.objective as campaign_objective,
          c.status as campaign_status,
          c.start_date as campaign_start_date,
          c.end_date as campaign_end_date,
          b.id as brand_entity_id,
          b.name as brand_name,
          b.logo_url as brand_logo_url,
          cp.id as creator_entity_id,
          cp.display_name as creator_display_name,
          cp.category as creator_category,
          cp.location as creator_location,
          u.email as creator_user_email,
          count(*) over() as total_count
        from public.campaign_applications ca
        inner join public.campaigns c
          on c.id = ca.campaign_id
        inner join public.brands b
          on b.id = c.brand_id
        inner join public.creator_profiles cp
          on cp.id = ca.creator_profile_id
        inner join public.users u
          on u.id = cp.user_id
        ${whereClauses.length > 0 ? `where ${whereClauses.join(" and ")}` : ""}
        order by ca.applied_at desc
        limit $${limitIndex}
        offset $${offsetIndex}
      `,
      values,
    );

    return {
      data: result.rows.map((row) => this.mapRowToReviewerApplicationListItem(row)),
      total: result.rows.length === 0 ? 0 : Number(result.rows[0].total_count ?? 0),
    };
  }

  private mapRowToCreatorApplicationListItem(
    row: Record<string, unknown>,
  ): CreatorApplicationListItem {
    return {
      ...this.mapRow(row),
      campaign: {
        id: String(row.campaign_entity_id),
        title: String(row.campaign_title),
        objective: String(row.campaign_objective),
        status: String(row.campaign_status),
        startDate:
          row.campaign_start_date instanceof Date
            ? row.campaign_start_date.toISOString()
            : row.campaign_start_date === null
              ? null
              : String(row.campaign_start_date),
        endDate:
          row.campaign_end_date instanceof Date
            ? row.campaign_end_date.toISOString()
            : row.campaign_end_date === null
              ? null
              : String(row.campaign_end_date),
      },
      brand: {
        id: String(row.brand_entity_id),
        name: String(row.brand_name),
        logoUrl:
          row.brand_logo_url === null ? null : String(row.brand_logo_url),
      },
    };
  }

  private mapRowToReviewerApplicationListItem(
    row: Record<string, unknown>,
  ): ReviewerApplicationListItem {
    return {
      ...this.mapRowToCreatorApplicationListItem(row),
      creator: {
        id: String(row.creator_entity_id),
        displayName: String(row.creator_display_name),
        category: row.creator_category === null ? null : String(row.creator_category),
        location: row.creator_location === null ? null : String(row.creator_location),
        userEmail: String(row.creator_user_email),
      },
    };
  }
}
