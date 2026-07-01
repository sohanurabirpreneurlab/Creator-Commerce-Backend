import { Pool } from "pg";
import {
  BrandAmbassadorSource,
  BrandAmbassadorStatus,
  BrandAmbassadorType,
} from "../constants/brand-ambassador.constants.js";
import {
  BrandAmbassador,
  BrandAmbassadorListFilters,
  BrandAmbassadorListItem,
} from "../interfaces/brand-ambassador.interface.js";

export class BrandAmbassadorRepository {
  constructor(private readonly databasePool: Pool) {}

  public async create(data: {
    brandId: string;
    creatorProfileId: string;
    status: BrandAmbassadorStatus;
    ambassadorType: BrandAmbassadorType;
    source: BrandAmbassadorSource;
    assignedBy: string | null;
    notes: string | null;
  }) {
    const result = await this.databasePool.query(
      `
        insert into public.brand_ambassadors (
          brand_id,
          creator_profile_id,
          status,
          ambassador_type,
          source,
          assigned_by,
          notes
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        returning *
      `,
      [
        data.brandId,
        data.creatorProfileId,
        data.status,
        data.ambassadorType,
        data.source,
        data.assignedBy,
        data.notes,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  public async findById(id: string) {
    const result = await this.databasePool.query(
      `select * from public.brand_ambassadors where id = $1 limit 1`,
      [id],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  public async findDetailedById(id: string) {
    const result = await this.databasePool.query(
      `
        select
          ba.*,
          b.id as brand_entity_id,
          b.name as brand_name,
          cp.id as creator_entity_id,
          cp.display_name as creator_display_name,
          cp.category as creator_category,
          cp.location as creator_location,
          u.email as creator_user_email
        from public.brand_ambassadors ba
        inner join public.brands b on b.id = ba.brand_id
        inner join public.creator_profiles cp on cp.id = ba.creator_profile_id
        inner join public.users u on u.id = cp.user_id
        where ba.id = $1
        limit 1
      `,
      [id],
    );

    return result.rowCount === 0 ? null : this.mapDetailedRow(result.rows[0]);
  }

  public async findByBrandAndCreator(brandId: string, creatorProfileId: string) {
    const result = await this.databasePool.query(
      `
        select *
        from public.brand_ambassadors
        where brand_id = $1
          and creator_profile_id = $2
        limit 1
      `,
      [brandId, creatorProfileId],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  public async findManyByBrandId(
    brandId: string,
    filters: BrandAmbassadorListFilters,
  ): Promise<{ data: BrandAmbassadorListItem[]; total: number }> {
    return this.findManyDetailed(filters, "ba.brand_id = $1", [brandId]);
  }

  public async findMany(
    filters: BrandAmbassadorListFilters,
  ): Promise<{ data: BrandAmbassadorListItem[]; total: number }> {
    return this.findManyDetailed(filters);
  }

  public async update(
    id: string,
    data: Partial<{
      ambassadorType: BrandAmbassadorType;
      notes: string | null;
    }>,
  ) {
    const values: Array<string | null> = [];
    const updates: string[] = [];

    if (data.ambassadorType !== undefined) {
      values.push(data.ambassadorType);
      updates.push(`ambassador_type = $${values.length}`);
    }

    if (data.notes !== undefined) {
      values.push(data.notes);
      updates.push(`notes = $${values.length}`);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await this.databasePool.query(
      `
        update public.brand_ambassadors
        set
          ${updates.join(", ")},
          updated_at = now()
        where id = $${values.length}
        returning *
      `,
      values,
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  public async updateStatus(id: string, status: BrandAmbassadorStatus) {
    const result = await this.databasePool.query(
      `
        update public.brand_ambassadors
        set
          status = $2,
          removed_at = case when $2 = 'REMOVED' then now() else null end,
          updated_at = now()
        where id = $1
        returning *
      `,
      [id, status],
    );

    return result.rowCount === 0 ? null : this.mapRow(result.rows[0]);
  }

  private async findManyDetailed(
    filters: BrandAmbassadorListFilters,
    baseClause?: string,
    baseValues: Array<string> = [],
  ) {
    const values: Array<string | number> = [...baseValues];
    const whereClauses = baseClause ? [baseClause] : [];

    if (filters.status) {
      values.push(filters.status);
      whereClauses.push(`ba.status = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      const placeholder = `$${values.length}`;
      whereClauses.push(
        `(cp.display_name ilike ${placeholder} or b.name ilike ${placeholder} or u.email ilike ${placeholder})`,
      );
    }

    values.push(filters.limit);
    values.push((filters.page - 1) * filters.limit);
    const limitIndex = values.length - 1;
    const offsetIndex = values.length;

    const result = await this.databasePool.query(
      `
        select
          ba.*,
          b.id as brand_entity_id,
          b.name as brand_name,
          cp.id as creator_entity_id,
          cp.display_name as creator_display_name,
          cp.category as creator_category,
          cp.location as creator_location,
          u.email as creator_user_email,
          count(*) over() as total_count
        from public.brand_ambassadors ba
        inner join public.brands b on b.id = ba.brand_id
        inner join public.creator_profiles cp on cp.id = ba.creator_profile_id
        inner join public.users u on u.id = cp.user_id
        ${whereClauses.length > 0 ? `where ${whereClauses.join(" and ")}` : ""}
        order by ba.joined_at desc
        limit $${limitIndex}
        offset $${offsetIndex}
      `,
      values,
    );

    return {
      data: result.rows.map((row) => this.mapDetailedRow(row)),
      total: result.rows.length === 0 ? 0 : Number(result.rows[0].total_count ?? 0),
    };
  }

  public async countByBrandId(brandId: string, status?: BrandAmbassadorStatus) {
    const values: Array<string> = [brandId];
    let extraWhere = "";

    if (status) {
      values.push(status);
      extraWhere = ` and status = $2`;
    }

    const result = await this.databasePool.query(
      `
        select count(*)::int as total
        from public.brand_ambassadors
        where brand_id = $1
        ${extraWhere}
      `,
      values,
    );

    return Number(result.rows[0]?.total ?? 0);
  }

  public async countAll(status?: BrandAmbassadorStatus) {
    const values: Array<string> = [];
    const whereSql = status ? `where status = $1` : "";
    if (status) {
      values.push(status);
    }

    const result = await this.databasePool.query(
      `
        select count(*)::int as total
        from public.brand_ambassadors
        ${whereSql}
      `,
      values,
    );

    return Number(result.rows[0]?.total ?? 0);
  }

  private mapDetailedRow(row: Record<string, unknown>): BrandAmbassadorListItem {
    return {
      ...this.mapRow(row),
      brand: {
        id: String(row.brand_entity_id),
        name: String(row.brand_name),
      },
      creator: {
        id: String(row.creator_entity_id),
        displayName: String(row.creator_display_name),
        category: row.creator_category === null ? null : String(row.creator_category),
        location: row.creator_location === null ? null : String(row.creator_location),
        userEmail: String(row.creator_user_email),
      },
    };
  }

  private mapRow(row: Record<string, unknown>): BrandAmbassador {
    return {
      id: String(row.id),
      brandId: String(row.brand_id),
      creatorProfileId: String(row.creator_profile_id),
      status: String(row.status) as BrandAmbassadorStatus,
      ambassadorType: String(row.ambassador_type) as BrandAmbassadorType,
      source: String(row.source) as BrandAmbassadorSource,
      assignedBy: row.assigned_by === null ? null : String(row.assigned_by),
      joinedAt: row.joined_at instanceof Date ? row.joined_at.toISOString() : String(row.joined_at),
      removedAt:
        row.removed_at instanceof Date
          ? row.removed_at.toISOString()
          : row.removed_at === null
            ? null
            : String(row.removed_at),
      notes: row.notes === null ? null : String(row.notes),
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    };
  }
}
