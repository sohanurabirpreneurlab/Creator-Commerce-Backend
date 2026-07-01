import { Pool } from "pg";
import { ContentSubmissionStatus } from "../constants/campaign.constants.js";
import { SocialPlatform } from "../constants/social-platform.js";
import {
  ContentSubmission,
  ContentSubmissionListFilters,
  CreatorContentSubmissionListItem,
  ReviewerContentSubmissionListItem,
} from "../interfaces/content-submission.interface.js";

export class ContentSubmissionRepository {
  constructor(private readonly databasePool: Pool) {}

  public async findManyByCreatorProfileId(
    creatorProfileId: string,
    filters: ContentSubmissionListFilters,
  ): Promise<{ data: CreatorContentSubmissionListItem[]; total: number }> {
    return this.findManyDetailed(filters, {
      clause: "cs.creator_profile_id = $1",
      values: [creatorProfileId],
      mode: "creator",
    });
  }

  public async findManyByBrandId(
    brandId: string,
    filters: ContentSubmissionListFilters,
  ): Promise<{ data: ReviewerContentSubmissionListItem[]; total: number }> {
    const result = await this.findManyDetailed(filters, {
      clause: "c.brand_id = $1",
      values: [brandId],
      mode: "reviewer",
    });

    return {
      data: result.data as ReviewerContentSubmissionListItem[],
      total: result.total,
    };
  }

  public async findMany(
    filters: ContentSubmissionListFilters,
  ): Promise<{ data: ReviewerContentSubmissionListItem[]; total: number }> {
    const result = await this.findManyDetailed(filters, { mode: "reviewer" });

    return {
      data: result.data as ReviewerContentSubmissionListItem[],
      total: result.total,
    };
  }

  public async findDetailedById(
    id: string,
  ): Promise<ReviewerContentSubmissionListItem | null> {
    const result = await this.databasePool.query(
      `
        select
          cs.*,
          c.id as campaign_entity_id,
          c.title as campaign_title,
          c.objective as campaign_objective,
          b.id as brand_entity_id,
          b.name as brand_name,
          b.logo_url as brand_logo_url,
          cp.id as creator_entity_id,
          cp.display_name as creator_display_name,
          cp.category as creator_category,
          cp.location as creator_location,
          u.email as creator_user_email
        from public.content_submissions cs
        inner join public.campaigns c
          on c.id = cs.campaign_id
        inner join public.brands b
          on b.id = c.brand_id
        inner join public.creator_profiles cp
          on cp.id = cs.creator_profile_id
        inner join public.users u
          on u.id = cp.user_id
        where cs.id = $1
        limit 1
      `,
      [id],
    );

    return result.rowCount === 0 ? null : this.mapRowToReviewerListItem(result.rows[0]);
  }

  public async updateReview(
    id: string,
    data: {
      status: ContentSubmissionStatus;
      reviewedBy: string;
      reviewedAt: string;
      reviewComment: string | null;
    },
  ): Promise<ContentSubmission | null> {
    const result = await this.databasePool.query(
      `
        update public.content_submissions
        set
          status = $2,
          reviewed_by = $3,
          reviewed_at = $4,
          review_comment = $5,
          updated_at = now()
        where id = $1
        returning *
      `,
      [
        id,
        data.status,
        data.reviewedBy,
        data.reviewedAt,
        data.reviewComment,
      ],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  public async countByBrandId(brandId: string, status?: ContentSubmissionStatus) {
    const values: Array<string> = [brandId];
    const whereClauses = ["c.brand_id = $1"];

    if (status) {
      values.push(status);
      whereClauses.push(`cs.status = $${values.length}`);
    }

    const result = await this.databasePool.query(
      `
        select count(*)::int as total
        from public.content_submissions cs
        inner join public.campaigns c
          on c.id = cs.campaign_id
        where ${whereClauses.join(" and ")}
      `,
      values,
    );

    return Number(result.rows[0]?.total ?? 0);
  }

  public async countAll(status?: ContentSubmissionStatus) {
    const values: Array<string> = [];
    const whereSql = status ? `where status = $1` : "";

    if (status) {
      values.push(status);
    }

    const result = await this.databasePool.query(
      `
        select count(*)::int as total
        from public.content_submissions
        ${whereSql}
      `,
      values,
    );

    return Number(result.rows[0]?.total ?? 0);
  }

  private async findManyDetailed(
    filters: ContentSubmissionListFilters,
    base?: {
      clause?: string;
      values?: Array<string>;
      mode: "creator" | "reviewer";
    },
  ): Promise<{ data: Array<CreatorContentSubmissionListItem | ReviewerContentSubmissionListItem>; total: number }> {
    const values: Array<string | number> = [...(base?.values ?? [])];
    const whereClauses = base?.clause ? [base.clause] : [];

    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`cs.status = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      const placeholder = `$${values.length}`;
      whereClauses.push(
        `(c.title ilike ${placeholder} or b.name ilike ${placeholder} or coalesce(cs.caption, '') ilike ${placeholder})`,
      );
    }

    values.push(filters.limit);
    values.push((filters.page - 1) * filters.limit);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;

    const result = await this.databasePool.query(
      `
        select
          cs.*,
          c.id as campaign_entity_id,
          c.title as campaign_title,
          c.objective as campaign_objective,
          b.id as brand_entity_id,
          b.name as brand_name,
          b.logo_url as brand_logo_url,
          count(*) over() as total_count
        from public.content_submissions cs
        inner join public.campaigns c
          on c.id = cs.campaign_id
        inner join public.brands b
          on b.id = c.brand_id
        where ${whereClauses.join(" and ")}
        order by cs.created_at desc
        limit $${limitIndex}
        offset $${offsetIndex}
      `,
      values,
    );

    return {
      data: result.rows.map((row) =>
        base?.mode === "reviewer"
          ? this.mapRowToReviewerListItem(row)
          : this.mapRowToCreatorListItem(row),
      ),
      total: result.rows.length === 0 ? 0 : Number(result.rows[0].total_count ?? 0),
    };
  }

  private mapRowToCreatorListItem(
    row: Record<string, unknown>,
  ): CreatorContentSubmissionListItem {
    return {
      ...this.mapRow(row),
      campaign: {
        id: String(row.campaign_entity_id),
        title: String(row.campaign_title),
        objective: String(row.campaign_objective),
      },
      brand: {
        id: String(row.brand_entity_id),
        name: String(row.brand_name),
        logoUrl:
          row.brand_logo_url === null ? null : String(row.brand_logo_url),
      },
    };
  }

  private mapRowToReviewerListItem(
    row: Record<string, unknown>,
  ): ReviewerContentSubmissionListItem {
    return {
      ...this.mapRowToCreatorListItem(row),
      creator: {
        id: String(row.creator_entity_id),
        displayName: String(row.creator_display_name),
        category: row.creator_category === null ? null : String(row.creator_category),
        location: row.creator_location === null ? null : String(row.creator_location),
        userEmail: String(row.creator_user_email),
      },
    };
  }

  private mapRow(row: Record<string, unknown>): ContentSubmission {
    return {
      id: String(row.id),
      campaignId: String(row.campaign_id),
      creatorProfileId: String(row.creator_profile_id),
      campaignCreatorId:
        row.campaign_creator_id === null ? null : String(row.campaign_creator_id),
      platform:
        row.platform === null ? null : (String(row.platform) as SocialPlatform),
      caption: row.caption === null ? null : String(row.caption),
      contentUrl: row.content_url === null ? null : String(row.content_url),
      status: String(row.status) as ContentSubmissionStatus,
      submittedAt:
        row.submitted_at instanceof Date
          ? row.submitted_at.toISOString()
          : row.submitted_at === null
            ? null
            : String(row.submitted_at),
      reviewedAt:
        row.reviewed_at instanceof Date
          ? row.reviewed_at.toISOString()
          : row.reviewed_at === null
            ? null
            : String(row.reviewed_at),
      reviewedBy: row.reviewed_by === null ? null : String(row.reviewed_by),
      reviewComment:
        row.review_comment === null ? null : String(row.review_comment),
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
}
