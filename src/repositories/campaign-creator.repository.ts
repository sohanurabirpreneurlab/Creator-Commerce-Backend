import { Pool } from "pg";
import { CampaignCreatorStatus } from "../constants/campaign.constants.js";
import {
  CampaignCreator,
  CampaignCreatorListFilters,
} from "../interfaces/campaign-creator.interface.js";

export class CampaignCreatorRepository {
  constructor(private readonly databasePool: Pool) {}

  public async create(data: {
    campaignId: string;
    creatorProfileId: string;
    campaignApplicationId: string | null;
    status: CampaignCreatorStatus;
    approvedBy: string | null;
  }): Promise<CampaignCreator> {
    const result = await this.databasePool.query(
      `
        insert into public.campaign_creators (
          campaign_id,
          creator_profile_id,
          campaign_application_id,
          status,
          approved_by
        )
        values ($1, $2, $3, $4, $5)
        returning *
      `,
      [
        data.campaignId,
        data.creatorProfileId,
        data.campaignApplicationId,
        data.status,
        data.approvedBy,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  public async findById(id: string): Promise<CampaignCreator | null> {
    const result = await this.databasePool.query(
      `select * from public.campaign_creators where id = $1 limit 1`,
      [id],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  public async findByCampaignAndCreator(
    campaignId: string,
    creatorProfileId: string,
  ): Promise<CampaignCreator | null> {
    const result = await this.databasePool.query(
      `
        select *
        from public.campaign_creators
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
    filters: CampaignCreatorListFilters,
  ): Promise<{ data: CampaignCreator[]; total: number }> {
    return this.findManyInternal(filters, "creator_profile_id = $1", [
      creatorProfileId,
    ]);
  }

  public async findManyByCampaignId(
    campaignId: string,
    filters: CampaignCreatorListFilters,
  ): Promise<{ data: CampaignCreator[]; total: number }> {
    return this.findManyInternal(filters, "campaign_id = $1", [campaignId]);
  }

  public async updateStatus(
    id: string,
    status: CampaignCreatorStatus,
    metadata?: {
      removedAt?: string | null;
    },
  ): Promise<CampaignCreator | null> {
    const result = await this.databasePool.query(
      `
        update public.campaign_creators
        set
          status = $2,
          removed_at = $3,
          updated_at = now()
        where id = $1
        returning *
      `,
      [id, status, metadata?.removedAt ?? null],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  private async findManyInternal(
    filters: CampaignCreatorListFilters,
    baseClause: string,
    baseValues: Array<string>,
  ) {
    const values: Array<string | number> = [...baseValues];
    const whereClauses = [baseClause];

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
        from public.campaign_creators
        where ${whereClauses.join(" and ")}
        order by approved_at desc
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

  private mapRow(row: Record<string, unknown>): CampaignCreator {
    return {
      id: String(row.id),
      campaignId: String(row.campaign_id),
      creatorProfileId: String(row.creator_profile_id),
      campaignApplicationId:
        row.campaign_application_id === null
          ? null
          : String(row.campaign_application_id),
      status: String(row.status) as CampaignCreatorStatus,
      approvedAt:
        row.approved_at instanceof Date
          ? row.approved_at.toISOString()
          : String(row.approved_at),
      approvedBy: row.approved_by === null ? null : String(row.approved_by),
      removedAt:
        row.removed_at instanceof Date
          ? row.removed_at.toISOString()
          : row.removed_at === null
            ? null
            : String(row.removed_at),
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
