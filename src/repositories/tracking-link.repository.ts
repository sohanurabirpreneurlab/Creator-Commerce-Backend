import { Pool } from "pg";
import { TrackingLinkStatus } from "../constants/campaign.constants.js";
import {
  CreatorTrackingLinkListItem,
  TrackingLink,
  TrackingLinkListFilters,
} from "../interfaces/tracking-link.interface.js";

export class TrackingLinkRepository {
  constructor(private readonly databasePool: Pool) {}

  public async create(data: {
    campaignId: string;
    creatorProfileId: string;
    campaignCreatorId: string | null;
    brandId: string;
    shortCode: string;
    destinationUrl: string;
    status: TrackingLinkStatus;
    generatedBy: string | null;
  }): Promise<TrackingLink> {
    const result = await this.databasePool.query(
      `
        insert into public.tracking_links (
          campaign_id,
          creator_profile_id,
          campaign_creator_id,
          brand_id,
          short_code,
          destination_url,
          status,
          generated_by
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        returning *
      `,
      [
        data.campaignId,
        data.creatorProfileId,
        data.campaignCreatorId,
        data.brandId,
        data.shortCode,
        data.destinationUrl,
        data.status,
        data.generatedBy,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  public async findById(id: string): Promise<TrackingLink | null> {
    const result = await this.databasePool.query(
      `select * from public.tracking_links where id = $1 limit 1`,
      [id],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  public async findByShortCode(shortCode: string): Promise<TrackingLink | null> {
    const result = await this.databasePool.query(
      `
        select *
        from public.tracking_links
        where short_code = $1
        limit 1
      `,
      [shortCode],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  public async findByCampaignAndCreator(
    campaignId: string,
    creatorProfileId: string,
  ): Promise<TrackingLink | null> {
    const result = await this.databasePool.query(
      `
        select *
        from public.tracking_links
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
    filters: TrackingLinkListFilters,
  ): Promise<{ data: CreatorTrackingLinkListItem[]; total: number }> {
    return this.findManyDetailedInternal(filters, "tl.creator_profile_id = $1", [
      creatorProfileId,
    ]);
  }

  public async findManyByBrandId(
    brandId: string,
    filters: TrackingLinkListFilters,
  ): Promise<{ data: TrackingLink[]; total: number }> {
    return this.findManyInternal(filters, "brand_id = $1", [brandId]);
  }

  public async findMany(
    filters: TrackingLinkListFilters,
  ): Promise<{ data: TrackingLink[]; total: number }> {
    return this.findManyInternal(filters);
  }

  public async updateStatus(
    id: string,
    status: TrackingLinkStatus,
  ): Promise<TrackingLink | null> {
    const result = await this.databasePool.query(
      `
        update public.tracking_links
        set
          status = $2,
          updated_at = now()
        where id = $1
        returning *
      `,
      [id, status],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  public async count(filters: TrackingLinkListFilters): Promise<number> {
    const values: string[] = [];
    const whereClauses: string[] = [];
    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`status = $${values.length}`);
    }

    const result = await this.databasePool.query(
      `
        select count(*)::int as total
        from public.tracking_links
        ${whereClauses.length > 0 ? `where ${whereClauses.join(" and ")}` : ""}
      `,
      values,
    );

    return Number(result.rows[0]?.total ?? 0);
  }

  private async findManyInternal(
    filters: TrackingLinkListFilters,
    baseClause?: string,
    baseValues: Array<string> = [],
  ) {
    const values: Array<string | number> = [...baseValues];
    const whereClauses = baseClause ? [baseClause] : [];

    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`status = $${values.length}`);
    }

    values.push(filters.limit);
    values.push((filters.page - 1) * filters.limit);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;

    const result = await this.databasePool.query(
      `
        select
          *,
          count(*) over() as total_count
        from public.tracking_links
        ${whereClauses.length > 0 ? `where ${whereClauses.join(" and ")}` : ""}
        order by created_at desc
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

  private async findManyDetailedInternal(
    filters: TrackingLinkListFilters,
    baseClause?: string,
    baseValues: Array<string> = [],
  ) {
    const values: Array<string | number> = [...baseValues];
    const whereClauses = baseClause ? [baseClause] : [];

    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`tl.status = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      const placeholder = `$${values.length}`;
      whereClauses.push(
        `(c.title ilike ${placeholder} or b.name ilike ${placeholder} or tl.short_code ilike ${placeholder})`,
      );
    }

    values.push(filters.limit);
    values.push((filters.page - 1) * filters.limit);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;

    const result = await this.databasePool.query(
      `
        select
          tl.*,
          c.id as campaign_entity_id,
          c.title as campaign_title,
          c.objective as campaign_objective,
          b.id as brand_entity_id,
          b.name as brand_name,
          b.logo_url as brand_logo_url,
          count(*) over() as total_count
        from public.tracking_links tl
        inner join public.campaigns c
          on c.id = tl.campaign_id
        inner join public.brands b
          on b.id = tl.brand_id
        ${whereClauses.length > 0 ? `where ${whereClauses.join(" and ")}` : ""}
        order by tl.created_at desc
        limit $${limitIndex}
        offset $${offsetIndex}
      `,
      values,
    );

    return {
      data: result.rows.map((row) => this.mapRowToCreatorListItem(row)),
      total: result.rows.length === 0 ? 0 : Number(result.rows[0].total_count ?? 0),
    };
  }

  private mapRow(row: Record<string, unknown>): TrackingLink {
    return {
      id: String(row.id),
      campaignId: String(row.campaign_id),
      creatorProfileId: String(row.creator_profile_id),
      campaignCreatorId:
        row.campaign_creator_id === null ? null : String(row.campaign_creator_id),
      brandId: String(row.brand_id),
      shortCode: String(row.short_code),
      destinationUrl: String(row.destination_url),
      status: String(row.status) as TrackingLinkStatus,
      generatedBy: row.generated_by === null ? null : String(row.generated_by),
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

  private mapRowToCreatorListItem(
    row: Record<string, unknown>,
  ): Omit<CreatorTrackingLinkListItem, "trackingUrl"> {
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
}
