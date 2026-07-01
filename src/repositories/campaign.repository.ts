import { Pool } from "pg";
import {
  CampaignObjective,
  CampaignStatus,
} from "../constants/campaign.constants.js";
import {
  AvailableCampaign,
  Campaign,
  CampaignListItem,
  CampaignListFilters,
} from "../interfaces/campaign.interface.js";

export class CampaignRepository {
  constructor(private readonly databasePool: Pool) {}

  public async create(data: {
    brandId: string;
    title: string;
    description: string | null;
    objective: CampaignObjective;
    status: CampaignStatus;
    budget: number;
    destinationUrl: string | null;
    startDate: string | null;
    endDate: string | null;
    createdBy: string | null;
  }): Promise<Campaign> {
    const result = await this.databasePool.query(
      `
        insert into public.campaigns (
          brand_id,
          title,
          description,
          objective,
          status,
          budget,
          destination_url,
          start_date,
          end_date,
          created_by
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        returning *
      `,
      [
        data.brandId,
        data.title,
        data.description,
        data.objective,
        data.status,
        data.budget,
        data.destinationUrl,
        data.startDate,
        data.endDate,
        data.createdBy,
      ],
    );

    return this.mapRowToCampaign(result.rows[0]);
  }

  public async findById(id: string): Promise<Campaign | null> {
    const result = await this.databasePool.query(
      `
        select *
        from public.campaigns
        where id = $1
        limit 1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToCampaign(result.rows[0]);
  }

  public async findMany(
    filters: CampaignListFilters,
  ): Promise<{ data: CampaignListItem[]; total: number }> {
    return this.findManyInternal(filters);
  }

  public async findManyByBrandId(
    brandId: string,
    filters: CampaignListFilters,
  ): Promise<{ data: CampaignListItem[]; total: number }> {
    return this.findManyInternal(filters, brandId);
  }

  public async findDetailedById(id: string): Promise<CampaignListItem | null> {
    const result = await this.databasePool.query(
      `
        select
          c.*,
          b.id as brand_entity_id,
          b.name as brand_name,
          b.industry as brand_industry,
          b.website as brand_website,
          b.contact_email as brand_contact_email,
          b.logo_url as brand_logo_url
        from public.campaigns c
        inner join public.brands b
          on b.id = c.brand_id
        where c.id = $1
        limit 1
      `,
      [id],
    );

    return result.rowCount === 0 ? null : this.mapRowToCampaignListItem(result.rows[0]);
  }

  public async findAvailableForCreator(
    creatorProfileId: string,
    filters: CampaignListFilters,
  ): Promise<{ data: AvailableCampaign[]; total: number }> {
    const values: Array<string | number> = [creatorProfileId];
    const whereClauses = [`c.status = '${CampaignStatus.ACTIVE}'`];

    if (filters.search) {
      values.push(`%${filters.search}%`);
      const placeholder = `$${values.length}`;
      whereClauses.push(`(c.title ilike ${placeholder} or b.name ilike ${placeholder})`);
    }

    if (filters.objective) {
      values.push(filters.objective);
      whereClauses.push(`c.objective = $${values.length}`);
    }

    values.push(filters.limit);
    values.push((filters.page - 1) * filters.limit);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;

    const result = await this.databasePool.query(
      `
        select
          c.*,
          b.id as brand_entity_id,
          b.name as brand_name,
          b.industry as brand_industry,
          b.website as brand_website,
          b.contact_email as brand_contact_email,
          b.logo_url as brand_logo_url,
          ca.id as application_id,
          ca.status as application_status,
          count(*) over() as total_count
        from public.campaigns c
        inner join public.brands b
          on b.id = c.brand_id
        left join public.campaign_applications ca
          on ca.campaign_id = c.id
         and ca.creator_profile_id = $1
        where ${whereClauses.join(" and ")}
        order by c.created_at desc
        limit $${limitIndex}
        offset $${offsetIndex}
      `,
      values,
    );

    return {
      data: result.rows.map((row) => this.mapRowToAvailableCampaign(row)),
      total: this.getTotal(result.rows),
    };
  }

  public async findActiveDetailForCreator(
    campaignId: string,
    creatorProfileId: string,
  ): Promise<AvailableCampaign | null> {
    const result = await this.databasePool.query(
      `
        select
          c.*,
          b.id as brand_entity_id,
          b.name as brand_name,
          b.industry as brand_industry,
          b.website as brand_website,
          b.contact_email as brand_contact_email,
          b.logo_url as brand_logo_url,
          ca.id as application_id,
          ca.status as application_status
        from public.campaigns c
        inner join public.brands b
          on b.id = c.brand_id
        left join public.campaign_applications ca
          on ca.campaign_id = c.id
         and ca.creator_profile_id = $2
        where c.id = $1
          and c.status = $3
        limit 1
      `,
      [campaignId, creatorProfileId, CampaignStatus.ACTIVE],
    );

    return result.rowCount === 0 ? null : this.mapRowToAvailableCampaign(result.rows[0]);
  }

  public async update(
    id: string,
    data: Partial<{
      title: string;
      description: string | null;
      objective: CampaignObjective;
      budget: number;
      destinationUrl: string | null;
      startDate: string | null;
      endDate: string | null;
    }>,
  ): Promise<Campaign | null> {
    const values: Array<string | number | null> = [];
    const updates: string[] = [];

    if (data.title !== undefined) {
      values.push(data.title);
      updates.push(`title = $${values.length}`);
    }
    if (data.description !== undefined) {
      values.push(data.description);
      updates.push(`description = $${values.length}`);
    }
    if (data.objective !== undefined) {
      values.push(data.objective);
      updates.push(`objective = $${values.length}`);
    }
    if (data.budget !== undefined) {
      values.push(data.budget);
      updates.push(`budget = $${values.length}`);
    }
    if (data.destinationUrl !== undefined) {
      values.push(data.destinationUrl);
      updates.push(`destination_url = $${values.length}`);
    }
    if (data.startDate !== undefined) {
      values.push(data.startDate);
      updates.push(`start_date = $${values.length}`);
    }
    if (data.endDate !== undefined) {
      values.push(data.endDate);
      updates.push(`end_date = $${values.length}`);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await this.databasePool.query(
      `
        update public.campaigns
        set
          ${updates.join(", ")},
          updated_at = now()
        where id = $${values.length}
        returning *
      `,
      values,
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToCampaign(result.rows[0]);
  }

  public async updateStatus(
    id: string,
    status: CampaignStatus,
    metadata?: {
      approvedBy?: string | null;
      approvedAt?: string | null;
    },
  ): Promise<Campaign | null> {
    const approvedBy = metadata?.approvedBy ?? null;
    const approvedAt = metadata?.approvedAt ?? null;

    const result = await this.databasePool.query(
      `
        update public.campaigns
        set
          status = $2,
          approved_by = case when $3::uuid is not null then $3 else approved_by end,
          approved_at = case when $4::timestamptz is not null then $4 else approved_at end,
          updated_at = now()
        where id = $1
        returning *
      `,
      [id, status, approvedBy, approvedAt],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRowToCampaign(result.rows[0]);
  }

  public async count(filters: CampaignListFilters): Promise<number> {
    const { whereSql, values } = this.buildFilterWhere(filters);
    const result = await this.databasePool.query(
      `
        select count(*)::int as total
        from public.campaigns
        ${whereSql}
      `,
      values,
    );

    return Number(result.rows[0]?.total ?? 0);
  }

  private async findManyInternal(
    filters: CampaignListFilters,
    brandId?: string,
  ): Promise<{ data: CampaignListItem[]; total: number }> {
    const { whereSql, values } = this.buildFilterWhere(filters, brandId);

    values.push(filters.limit);
    values.push((filters.page - 1) * filters.limit);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;

    const result = await this.databasePool.query(
      `
        select
          c.*,
          b.id as brand_entity_id,
          b.name as brand_name,
          b.industry as brand_industry,
          b.website as brand_website,
          b.contact_email as brand_contact_email,
          b.logo_url as brand_logo_url,
          count(*) over() as total_count
        from public.campaigns c
        inner join public.brands b
          on b.id = c.brand_id
        ${whereSql}
        order by c.created_at desc
        limit $${limitIndex}
        offset $${offsetIndex}
      `,
      values,
    );

    return {
      data: result.rows.map((row) => this.mapRowToCampaignListItem(row)),
      total: this.getTotal(result.rows),
    };
  }

  private buildFilterWhere(filters: CampaignListFilters, brandId?: string) {
    const values: Array<string | number> = [];
    const whereClauses: string[] = [];

    if (brandId) {
      values.push(brandId);
      whereClauses.push(`c.brand_id = $${values.length}`);
    }
    if (filters.search) {
      values.push(`%${filters.search}%`);
      const placeholder = `$${values.length}`;
      whereClauses.push(`(c.title ilike ${placeholder} or b.name ilike ${placeholder})`);
    }
    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`c.status = $${values.length}`);
    }
    if (filters.objective) {
      values.push(filters.objective);
      whereClauses.push(`c.objective = $${values.length}`);
    }
    if (filters.onlyActive) {
      values.push(CampaignStatus.ACTIVE);
      whereClauses.push(`c.status = $${values.length}`);
    }

    return {
      values,
      whereSql:
        whereClauses.length > 0 ? `where ${whereClauses.join(" and ")}` : "",
    };
  }

  private getTotal(rows: Array<Record<string, unknown>>) {
    return rows.length === 0 ? 0 : Number(rows[0].total_count ?? 0);
  }

  private mapRowToCampaign(row: Record<string, unknown>): Campaign {
    return {
      id: String(row.id),
      brandId: String(row.brand_id),
      title: String(row.title),
      description: row.description === null ? null : String(row.description),
      objective: String(row.objective) as CampaignObjective,
      status: String(row.status) as CampaignStatus,
      budget: Number(row.budget),
      destinationUrl:
        row.destination_url === null ? null : String(row.destination_url),
      startDate:
        row.start_date instanceof Date
          ? row.start_date.toISOString()
          : row.start_date === null
            ? null
            : String(row.start_date),
      endDate:
        row.end_date instanceof Date
          ? row.end_date.toISOString()
          : row.end_date === null
            ? null
            : String(row.end_date),
      createdBy: row.created_by === null ? null : String(row.created_by),
      approvedBy: row.approved_by === null ? null : String(row.approved_by),
      approvedAt:
        row.approved_at instanceof Date
          ? row.approved_at.toISOString()
          : row.approved_at === null
            ? null
            : String(row.approved_at),
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

  private mapRowToAvailableCampaign(row: Record<string, unknown>): AvailableCampaign {
    const campaign = this.mapRowToCampaignListItem(row);
    const applicationId =
      row.application_id === null ? null : String(row.application_id);
    const applicationStatus =
      row.application_status === null ? null : String(row.application_status);

    return {
      ...campaign,
      application:
        applicationId && applicationStatus
          ? {
              id: applicationId,
              status: applicationStatus,
            }
          : null,
      hasApplied: Boolean(applicationId),
    };
  }

  private mapRowToCampaignListItem(row: Record<string, unknown>): CampaignListItem {
    return {
      ...this.mapRowToCampaign(row),
      brand: {
        id: String(row.brand_entity_id),
        name: String(row.brand_name),
        industry: row.brand_industry === null ? null : String(row.brand_industry),
        website: row.brand_website === null ? null : String(row.brand_website),
        contactEmail:
          row.brand_contact_email === null ? null : String(row.brand_contact_email),
        logoUrl: row.brand_logo_url === null ? null : String(row.brand_logo_url),
      },
    };
  }
}
